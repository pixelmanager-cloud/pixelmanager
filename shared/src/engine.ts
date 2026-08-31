import type { MatchState, Player, PlayerState, Role, Team } from './types.js';
import { PITCH } from './types.js';
import { makeRng } from './rng.js';
import { mirroredAnchor } from './teams.js';
import { DEFAULT_TACTICS, deriveMods, type TacticMods, type Tactics } from './tactics.js';
import { dutyMods, effectiveDuty, type DutyMods } from './duties.js';
import { mMul, mAdd, hasTrait, teamLeadership } from './mental.js';

export const TICK_SEC = 0.5; // game-seconds per tick
const MATCH_SEC = 90 * 60;
const SHOOT_RANGE = 30; // metres from goal a player will attempt a shot
/** The distance at which shot quality falls to zero. SEPARATE from SHOOT_RANGE, which is the trigger
 *  radius — one constant was doing both jobs via `SHOOT_RANGE + 8`, so re-tuning when a player shoots
 *  silently re-tuned how well he finishes. Same value as before (18 + 8), so behaviour is unchanged. */
const QUALITY_RANGE = 26;
const BASE_DRAIN = 0.000034; // fitness lost per tick by a working outfielder (tuned via harness)

// A NON-FINITE STAT IS A 10, NOT A NaN — the same guard `overall()` carries in teams.ts, whose own
// comment records that this exact class once "permanently poisoned the wallet". `mental.ts` was hardened
// for the five mental stats; this `norm` reads the ten PHYSICAL ones and was left bare, so the hole was
// only half closed. NaN propagates silently: `clamp(NaN, lo, hi)` is NaN (Math.min/max pass it through)
// and `rng() < NaN` is false FOREVER, so nothing throws and nothing logs.
// Measured over 40 matches with one NaN planted in a single stat: a keeper with NaN `keeping` conceded
// 0 goals against a healthy baseline of 52 — an UNBEATABLE goalkeeper, produced by one bad number in a
// save file. Outfield NaNs are less spectacular but still corrupt results (NaN passing: 44-66 against a
// 45-52 baseline). Guarding here costs nothing: for every finite stat this is the identical expression.
// 10 is the SCALE's neutral, not a role-appropriate one — a generated q14 keeper carries `keeping` 19, so
// a corrupted keeper now concedes 118 rather than 0. That is the safe direction and it is deliberate: a
// bad save should yield a poor goalkeeper, never an invincible one. Verified equivalent to an explicit
// 10 (identical 40-118 across the same 40 fixtures), which is the guard's whole promise.
const norm = (stat: number) => (Number.isFinite(stat) ? stat : 10) / 20;
/** effective-stat multiplier from current fitness: 1.0 fresh, ~0.85 when gassed. */
const fit = (f: number) => 0.7 + 0.3 * f;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const PUSH_BY_ROLE: Record<Role, number> = { GK: 0, DF: 0.35, MF: 0.8, FW: 1.0 };

interface Goal { x: number; y: number }

// ── THE OFFSIDE TRAP, AND WHY IT HAS A DOWNSIDE NOW ──────────────────────────────────────────────────
// The trap used to be one-directional: it RAISED the pace edge an attacker needed to get behind, and
// nothing else. A receiver who would have been through was sometimes caught; one who would have been
// caught was never let through. So it was a free win, and a large one — measured paired at n=2000, a High
// line plus the trap was worth +18.2 points over a 38-game season [13.2, 23.2]. Meanwhile the tooltip and
// the glossary both warned "mistime it and they're through", describing a branch that did not exist.
//
// Rather than delete the promise, implement it: a step-up is a timing act, and when it goes wrong the
// line is committed and the receiver is away. TRAP_MISTIME is the rate at which that happens to an
// attacker who would otherwise have been caught. Swept paired at n=2000 per cell:
//     0.00 (shipped)  +18.2 pts/38 [13.2, 23.2]      a free win
//     0.30             +7.0        [4.2, 9.7]
//     0.35             +5.9        [3.2, 8.6]        <- chosen
//     0.55             +1.2        [-1.5, 3.9]       neutral: no reason to ever tick it
// 0.35 keeps it a real choice for a side that commits to a high line while removing two thirds of the
// free win. THIS IS A MITIGATION, NOT THE FULL FIX: the engine can only express a mistimed trap as an
// ordinary clear chance, so it cannot yet be MORE dangerous than the chance it replaces, which is what
// "clean through on your keeper" actually means. That needs the chance-creation rework — see
// docs/decisions-for-ck.md sections 1 and 19.
//
// The trap is off by default and no preset sets it, so this rng draw only occurs in matches where the
// player turned it on: every existing calibration number is untouched.
/** How near the goal the BALL must be before attackers start running into the area, and how hard they
 *  are pulled in when it is. Swept against both panels; see the block in the movement step. */
const BOX_RUN_TRIGGER = 45;
const BOX_RUN = 0.35;

/** Multiplier on the carrier's shot probability. Swept against BOTH panels; the league is the hard
 *  constraint, so this rises only as far as division_balance stays green. */
/** Scales every tackle attempt. Swept against BOTH panels — the league is the hard constraint. */
const TACKLE_RATE = 0.3;

const SHOT_APPETITE = 1;
/** ...and for a man played clean through, who is not going to dawdle on the ball. */
const CLEAR_RUN_APPETITE = 12;

/** Pace edge an attacker needs to spring a SET trap cleanly. */
const TRAP_BEATS = 0.12;
/** How often the line's step-up is mistimed, sending through a receiver who would have been caught. */
const TRAP_MISTIME = 0.35;

export class MatchEngine {
  readonly state: MatchState;
  tactics: [Tactics, Tactics];
  private mods: [TacticMods, TacticMods];
  /** per-player duty modifiers, precomputed once (duties are fixed pre-kickoff). */
  private dm: [DutyMods[], DutyMods[]];
  private rng: () => number;
  private halftimeDone = false;
  // counter-attack window: the team that just won the ball can spring a fast break while
  // the opponent is out of shape — devastating against a side caught high/pressing.
  private counterTeam: 0 | 1 | null = null;
  private counterUntil = 0;
  /** bounded chance-creation edge from a formation SHAPE overload vs the opponent: a team
   *  wider than a narrow opponent finds the flanks; a team with more central midfielders
   *  controls the middle. Precomputed (shape + width are fixed pre-kickoff). */
  private zonal: [number, number];
  /** small team-wide finishing steadiness from each side's best leader (0 for a leaderless side) */
  private leadershipBonus: [number, number];
  /** commentary-only throttle: last game-second we emitted a "flow" event (pass/tackle/loose-ball),
   *  so the feed gets texture without a line every micro-tick. Purely cosmetic — never read by the sim. */
  private lastFlowSec = -99;
  private fatigueFlagged = new Set<number>(); // key = team*100+idx already narrated as gassed (cosmetic)
  private lastFatigueMin = -1;
  private sentOff = new Set<number>(); // key = team*100+idx of players shown a red card (removed from play)
  private booked = new Set<number>();  // key = team*100+idx already on a yellow (second yellow = red)
  private subsUsed: [number, number] = [0, 0];
  private benchLeft: [Player[], Player[]] = [[], []]; // remaining substitutes per side
  /** the player currently clean through on goal, per side (-1 = nobody). A man put in behind
   *  shoots when he arrives rather than waiting for the ordinary range roll. */
  private clearRun: [number, number] = [-1, -1];
  private lastBenchMin = -1;
  // last completed pass per side, for crediting assists (deterministic, no rng)
  private lastPass: Array<{ passer: number; receiver: number; sec: number } | null> = [null, null];

  /** rough pitch third from the acting team's perspective — for commentary context ("in the final third"). */
  private zoneOf(teamIdx: 0 | 1, x: number): 'def' | 'mid' | 'att' {
    const frac = teamIdx === 0 ? x / PITCH.w : 1 - x / PITCH.w; // 0 = own goal, 1 = opponent goal
    return frac > 0.66 ? 'att' : frac < 0.34 ? 'def' : 'mid';
  }
  /** Emit a throttled commentary "flow" event (add-only; reads decided state, consumes no rng).
   *  The gap is PRESSURE-SENSITIVE so the feed breathes like real radio: chatter tightens near
   *  either box (where play matters) and thins right out during midfield knock-abouts. Net effect
   *  is far fewer lines than a flat throttle, with density that tracks where the ball is. */
  private flow(type: 'pass' | 'tackle_won' | 'loose_ball', teamIdx: 0 | 1, x: number, playerName?: string, playerName2?: string) {
    const sec = Math.floor(this.state.clockSec);
    const zone = this.zoneOf(teamIdx, x);
    // minimum seconds between flow lines by where the action is (att = busiest, def = sparsest)
    const gap = zone === 'att' ? 5 : zone === 'mid' ? 11 : 16;
    if (sec - this.lastFlowSec < gap) return;
    this.lastFlowSec = sec;
    this.state.events.push({ minute: this.minute(), type, teamIdx, playerName, playerName2, zone });
  }

  constructor(public teams: [Team, Team], seed: number, tactics?: [Tactics, Tactics]) {
    // work on our own copy of each XI so late-game subs never mutate the caller's team object
    this.teams = [{ ...teams[0], players: [...teams[0].players] }, { ...teams[1], players: [...teams[1].players] }];
    this.benchLeft = [(teams[0].bench ?? []).slice(), (teams[1].bench ?? []).slice()];
    this.rng = makeRng(seed);
    this.tactics = tactics ?? [{ ...DEFAULT_TACTICS }, { ...DEFAULT_TACTICS }];
    this.mods = [deriveMods(this.tactics[0]), deriveMods(this.tactics[1])];
    this.dm = [teams[0].players.map((p) => dutyMods(effectiveDuty(p))), teams[1].players.map((p) => dutyMods(effectiveDuty(p)))];
    this.zonal = this.computeZonal();
    this.leadershipBonus = [teamLeadership(teams[0].players), teamLeadership(teams[1].players)];
    this.state = {
      clockSec: 0,
      score: [0, 0],
      ball: { x: PITCH.w / 2, y: PITCH.h / 2 },
      carrier: null,
      players: [this.initPositions(0), this.initPositions(1)],
      possession: [0, 0],
      events: [{ minute: 0, type: 'kickoff', teamIdx: 0 }],
      finished: false,
    };
    this.giveKickoff(0);
  }

  /** Change a team's tactics mid-match (e.g. manager makes a change). */
  setTactics(teamIdx: 0 | 1, t: Tactics) {
    this.tactics[teamIdx] = t;
    this.mods[teamIdx] = deriveMods(t);
    this.zonal = this.computeZonal();
  }

  /** Bounded chance edge from a formation-SHAPE overload vs the opponent (width + central mids). */
  private computeZonal(): [number, number] {
    const shape = (t: 0 | 1) => {
      const outs = this.teams[t].players.slice(1); // outfielders (skip GK)
      const width = outs.reduce((s, p) => s + Math.abs(p.anchor.y - 34), 0) / outs.length * this.mods[t].widthScale;
      const central = this.teams[t].players.filter((p) => p.role === 'MF' && Math.abs(p.anchor.y - 34) < 13).length;
      return { width, central };
    };
    const a = shape(0), b = shape(1);
    // width outweighs central density (so a WIDE shape beats a NARROW one on the flanks),
    // but a packed-central shape wins the middle; both bounded so shape is a nudge, not king.
    const edge = (me: typeof a, opp: typeof a) => clamp(0.013 * (me.width - opp.width) + 0.05 * (me.central - opp.central), -0.18, 0.18);
    return [edge(a, b), edge(b, a)];
  }

  private initPositions(teamIdx: 0 | 1): PlayerState[] {
    return this.teams[teamIdx].players.map((p) => {
      const a = teamIdx === 0 ? p.anchor : mirroredAnchor(p.anchor);
      return { x: a.x, y: a.y, fitness: 1 };
    });
  }

  private baseAnchor(teamIdx: 0 | 1, playerIdx: number) {
    const a = this.teams[teamIdx].players[playerIdx].anchor;
    return teamIdx === 0 ? a : mirroredAnchor(a);
  }

  private attackDir(teamIdx: 0 | 1): 1 | -1 {
    return teamIdx === 0 ? 1 : -1;
  }

  private goalOf(attackingTeam: 0 | 1): Goal {
    return { x: attackingTeam === 0 ? PITCH.w : 0, y: PITCH.h / 2 };
  }

  private minute(): number {
    return Math.min(90, Math.floor(this.state.clockSec / 60));
  }

  private giveKickoff(teamIdx: 0 | 1) {
    const s = this.state;
    s.players = [this.reset(0), this.reset(1)];
    s.ball = { x: PITCH.w / 2, y: PITCH.h / 2 };
    s.players[teamIdx][6] = { ...s.players[teamIdx][6], x: PITCH.w / 2, y: PITCH.h / 2 };
    s.carrier = { teamIdx, playerIdx: 6 };
  }

  /** Reset positions but preserve fitness (used at goals/kickoffs). */
  private reset(teamIdx: 0 | 1): PlayerState[] {
    return this.teams[teamIdx].players.map((p, i) => {
      const a = teamIdx === 0 ? p.anchor : mirroredAnchor(p.anchor);
      const prev = this.state?.players?.[teamIdx]?.[i];
      return { x: a.x, y: a.y, fitness: prev?.fitness ?? 1 };
    });
  }

  tick(): void {
    const s = this.state;
    if (s.finished) return;

    s.clockSec += TICK_SEC;
    if (!this.halftimeDone && s.clockSec >= MATCH_SEC / 2) {
      this.halftimeDone = true;
      // half-time breather: small fitness recovery
      for (const t of [0, 1] as const) s.players[t].forEach((ps) => (ps.fitness = Math.min(1, ps.fitness + 0.1)));
      s.events.push({ minute: 45, type: 'halftime', teamIdx: 0 });
      this.giveKickoff(1);
    }
    if (s.clockSec >= MATCH_SEC) {
      s.finished = true;
      s.events.push({ minute: 90, type: 'fulltime', teamIdx: 0 });
      return;
    }

    const prevTeam = s.carrier?.teamIdx;
    if (s.carrier) s.possession[s.carrier.teamIdx]++;
    this.movePlayers();
    if (s.carrier) this.actCarrier();
    else this.chaseLooseBall();
    // possession just turned over in open play (not a keeper gathering a shot) → the
    // winner is on the counter for a few seconds.
    const now = s.carrier?.teamIdx;
    if (now !== undefined && now !== prevTeam && s.carrier!.playerIdx !== 0) {
      // only a real counter if the side that LOST the ball was committed high (attacking
      // mentality or a high line) — that's when there's space in behind to break into.
      const loser = (1 - now) as 0 | 1;
      if (this.mods[loser].attackPush >= 9 || this.mods[loser].lineShift >= 3) {
        this.counterTeam = now;
        this.counterUntil = s.clockSec + 2.0;
      }
    }
    this.checkFatigue();
    this.manageBench();
  }

  private onCounter(teamIdx: 0 | 1): boolean {
    return this.counterTeam === teamIdx && this.state.clockSec < this.counterUntil;
  }

  /** Cosmetic: once per minute in the closing stages, surface the first badly-gassed grafter per
   *  side. Reads live fitness only — no rng, no outcome change — so stamina finally shows on-screen. */
  private checkFatigue() {
    const s = this.state;
    const min = this.minute();
    if (min < 60 || min === this.lastFatigueMin) return;
    this.lastFatigueMin = min;
    for (const t of [0, 1] as const) {
      for (let i = 1; i < 11; i++) {
        const key = t * 100 + i;
        if (this.fatigueFlagged.has(key) || this.sentOff.has(key)) continue;
        const p = this.teams[t].players[i];
        if (s.players[t][i].fitness < 0.56 && norm(p.attrs.workrate) > 0.5) {
          this.fatigueFlagged.add(key);
          s.events.push({ minute: min, type: 'fatigue', teamIdx: t, playerName: p.name, playerId: p.id });
          break; // at most one per side per minute
        }
      }
    }
  }

  /** Deterministic late-game bench management (NO rng): swap a gassed player for a fresh sub, and
   *  occasionally force an injury sub. Runs only when a bench is present (real matches) — the
   *  bench-less test/CPU squads are completely unaffected, so calibration is untouched. */
  private manageBench() {
    const s = this.state;
    const min = this.minute();
    if (min < 58 || min > 87 || min === this.lastBenchMin) return;
    this.lastBenchMin = min;
    const isCarrier = (t: 0 | 1, i: number) => !!s.carrier && s.carrier.teamIdx === t && s.carrier.playerIdx === i;
    for (const t of [0, 1] as const) {
      if (!this.benchLeft[t].length || this.subsUsed[t] >= 3) continue;
      // INJURY (independent of fatigue): a fragile outfielder picks up a knock and is forced off —
      // deterministic hash, kept rare. One hashed candidate per side per minute.
      const injI = 1 + (((min * 7919 + t * 104729) >>> 0) % 10);
      if (!this.sentOff.has(t * 100 + injI) && !isCarrier(t, injI)) {
        const inj = this.teams[t].players[injI];
        const durab = norm(inj.attrs.durability ?? inj.attrs.stamina ?? 10);
        const h = ((min * 2654435761 + t * 40503 + injI * 2246822519) >>> 0) % 10000;
        if (durab < 0.6 && h < 250) { this.makeSub(t, injI, true); continue; }
      }
      // TACTICAL SUB: freshen up the most-gassed outfielder (never the current ball carrier)
      let worstI = -1, worstFit = Infinity;
      for (let i = 1; i < 11; i++) {
        if (this.sentOff.has(t * 100 + i) || isCarrier(t, i)) continue;
        const f = s.players[t][i].fitness;
        if (f < worstFit) { worstFit = f; worstI = i; }
      }
      if (worstI >= 0 && worstFit < 0.80) this.makeSub(t, worstI, false);
    }
  }

  private makeSub(t: 0 | 1, outI: number, injured: boolean) {
    const s = this.state;
    const min = this.minute();
    const outP = this.teams[t].players[outI];
    const bl = this.benchLeft[t];
    let pick = bl.findIndex((p) => p.role === outP.role); // prefer a like-for-like replacement
    if (pick < 0) pick = 0;
    const inP = bl.splice(pick, 1)[0];
    this.teams[t].players[outI] = { ...inP, anchor: outP.anchor, duty: outP.duty };
    this.dm[t][outI] = dutyMods(effectiveDuty(this.teams[t].players[outI]));
    const a = t === 0 ? outP.anchor : mirroredAnchor(outP.anchor);
    s.players[t][outI] = { x: a.x, y: a.y, fitness: 0.9 }; // fresh legs
    this.subsUsed[t]++;
    // RECOMPUTED, because the XI just changed. `leadershipBonus` was set once in the constructor from the
    // STARTING eleven and never touched again, so a captain substituted off kept his armband bonus for the
    // rest of the match and his replacement never earned one. Note the swap above deliberately carries the
    // outgoing man's `anchor` and `duty` but NOT his `captain` flag — so after a captain goes off nobody on
    // the pitch wears it, and teamLeadership correctly falls back to the best natural leader still on.
    // Pure and rng-free, so this consumes no draws and cannot desync a replay.
    this.leadershipBonus[t] = teamLeadership(this.teams[t].players);
    if (injured) s.events.push({ minute: min, type: 'injury', teamIdx: t, playerName: outP.name, playerId: outP.id });
    s.events.push({ minute: min, type: 'sub', teamIdx: t, playerName: inP.name, playerId: inP.id, playerName2: outP.name, playerId2: outP.id });
  }

  // ---- movement ----

  private pressers(defTeam: 0 | 1): Set<number> {
    const s = this.state;
    const set = new Set<number>();
    if (!s.carrier) {
      set.add(this.closestToBall(defTeam));
      return set;
    }
    const count = this.mods[defTeam].pressCount;
    const cx = s.players[s.carrier.teamIdx][s.carrier.playerIdx].x;
    const cy = s.players[s.carrier.teamIdx][s.carrier.playerIdx].y;
    const order = [];
    for (let i = 1; i < 11; i++) {
      if (this.sentOff.has(defTeam * 100 + i)) continue;
      const ps = s.players[defTeam][i];
      // duty press-eagerness shrinks a player's effective distance to the ball, so
      // ball-winners/stoppers get picked to close down ahead of a sit-off cover man.
      order.push({ i, d: Math.hypot(ps.x - cx, ps.y - cy) - this.dm[defTeam][i].press * 3 });
    }
    order.sort((a, b) => a.d - b.d);
    for (let k = 0; k < count && k < order.length; k++) set.add(order[k].i);
    return set;
  }

  private movePlayers() {
    const s = this.state;
    for (const teamIdx of [0, 1] as const) {
      const attacking = s.carrier?.teamIdx === teamIdx;
      const mods = this.mods[teamIdx];
      const dir = this.attackDir(teamIdx);
      const pressSet = attacking ? new Set<number>() : this.pressers(teamIdx);

      // emergency box defence: if an opponent is carrying near OUR goal, the closest
      // outfielder collapses onto the ball regardless of the press setting — you never
      // leave a striker camped unmarked in your own box (which used to let attackers
      // loiter on the goal line). Fixes the loiter via pressure, not extra shots.
      let emergency = -1;
      if (!attacking && s.carrier) {
        const ourGoal = this.goalOf((1 - teamIdx) as 0 | 1);
        if (Math.hypot(s.ball.x - ourGoal.x, s.ball.y - ourGoal.y) < 20) {
          let nd = Infinity;
          for (let i = 1; i < 11; i++) {
            if (this.sentOff.has(teamIdx * 100 + i)) continue;
            const d = Math.hypot(s.players[teamIdx][i].x - s.ball.x, s.players[teamIdx][i].y - s.ball.y);
            if (d < nd) { nd = d; emergency = i; }
          }
        }
      }

      const cond = this.teams[teamIdx].conditioning ?? 1; // training-ground fitness-drain multiplier
      s.players[teamIdx].forEach((ps, i) => {
        if (this.sentOff.has(teamIdx * 100 + i)) return; // red-carded: parked off the pitch
        if (s.carrier && s.carrier.teamIdx === teamIdx && s.carrier.playerIdx === i) return; // carrier handled separately
        const p = this.teams[teamIdx].players[i];
        const eff = fit(ps.fitness);
        // LIVEWIRE ("blistering, frightening pace") lifts how fast he actually moves. Deliberately NOT
        // hooked into `beatsLastDefender`'s paceGap: measured, a 1.06x on all three pace terms is +25.1%
        // goals a match at q=17 and the paceGap term alone accounts for +24.4% of that, because it is a
        // threshold on a difference rather than a rate. The two speed terms together are +7.2%, which is a
        // trait being worth something rather than a trait rewriting the match.
        const speed = (1.8 + norm(p.attrs.pace) * 3.6) * (hasTrait(p, 'livewire') ? 1.06 : 1) * eff * TICK_SEC;

        // pressers/loose-ball chasers (and the emergency box defender) run at the ball
        if (pressSet.has(i) || i === emergency) {
          this.stepToward(ps, s.ball.x, s.ball.y, speed * 1.1);
          this.drain(ps, p, mods, 1.5, cond);
          return;
        }

        // tactical target = width-scaled anchor, shifted by line height / attacking push, pulled toward ball;
        // the player's duty biases how far they push and how strongly they drift toward the ball.
        const dm = this.dm[teamIdx][i];
        const a = this.baseAnchor(teamIdx, i);
        let tx = a.x;
        let ty = 34 + (a.y - 34) * mods.widthScale;
        if (attacking) ty += (a.y - 34) * dm.hug; // wing-back etc.: stay/push wider as an auxiliary winger going forward
        if (p.role === 'DF') tx += dir * mods.lineShift;
        // on a counter, the winning side's forwards burst upfield into the space
        const counterPush = attacking && p.role === 'FW' && this.onCounter(teamIdx) ? 1.3 : 1;
        if (attacking && p.role !== 'GK') tx += dir * mods.attackPush * PUSH_BY_ROLE[p.role] * dm.push * counterPush;
        // STEP 2 OF THE REBUILD: BOX RUNS — the mechanism the game has never had.
        // Measured before this existed: 0.0162 attackers in the penalty area on average while attacking,
        // and forwards sitting a median 36.3m from the goal they are attacking — outside the 18-yard line,
        // permanently. With nobody in the box there is nothing to pass to in the box, which is why the only
        // chance the engine could manufacture was a through-ball fired from midfield.
        //
        // ORDER MATTERS HERE, and my first attempt got it wrong: applying the run BEFORE the ball-pull
        // below moved forwards by 0.3m, because `tx += (ball.x - tx) * pullX` immediately dragged them back
        // toward a ball that is usually BEHIND them. A player making a run into the box is deliberately not
        // tracking the ball — that is what a run is — so the run both damps the ball-pull and is applied
        // after it.
        const boxRun = attacking && (p.role === 'FW' || p.role === 'MF')
          ? BOX_RUN * (1 - Math.min(1, Math.hypot(this.goalOf(teamIdx).x - s.ball.x, this.goalOf(teamIdx).y - s.ball.y) / BOX_RUN_TRIGGER)) * (p.role === 'FW' ? 1 : 0.5)
          : 0;
        const pullX = clamp((p.role === 'GK' ? 0.04 : attacking ? 0.22 : 0.34) + (attacking ? dm.come : 0), 0, 0.6) * (1 - boxRun);
        const pullY = (p.role === 'GK' ? 0.25 : attacking ? 0.30 : 0.46) * (1 - boxRun * 0.5);
        tx += (s.ball.x - tx) * pullX;
        ty += (s.ball.y - ty) * pullY;
        if (boxRun > 0) {
          const g = this.goalOf(teamIdx);
          tx += (g.x - tx) * boxRun;
          ty += (g.y - ty) * boxRun * 0.6;
        }

        tx = clamp(tx, 2, 103);
        ty = clamp(ty, 3, 65);
        // the keeper's safety rail. It used to be widened by the retired sweeper-keeper duty's `gkStep`,
        // which was the duty's ONLY effect — and the clamp never once bound in 857,896 measured ticks.
        if (p.role === 'GK') tx = clamp(tx, teamIdx === 0 ? 2 : 89, teamIdx === 0 ? 16 : 103);

        const moved = this.stepToward(ps, tx, ty, speed);
        if (moved > 0.3) this.drain(ps, p, mods, 1, cond);
      });
    }
  }

  private drain(ps: PlayerState, p: Player, mods: TacticMods, effort: number, conditioning = 1) {
    // workrate raises effort (drains more); stamina is endurance (drains less). Both are
    // centred at the mid stat so average squads keep the tuned overall drain rate, while
    // a high-stamina star fades far less than a low-stamina filler late in the game.
    // Default stamina to the mid stat (10) for legacy 8-stat squads made before the
    // stamina stat existed — otherwise norm(undefined)=NaN corrupts fitness → NaN
    // positions → invisible players.
    const staminaFactor = 1.3 - 0.6 * norm(p.attrs.stamina ?? 10);
    // IRON MAN ("runs all day") and ENGINE-ROOM GENERAL ("drags the team through matches by will alone")
    // are both endurance claims, and this is the only place endurance is spent. They stack deliberately —
    // a player who has earned both really should still be running in the 90th minute.
    const willToRun = (hasTrait(p, 'ironman') ? 0.88 : 1) * (hasTrait(p, 'general2') ? 0.93 : 1);
    ps.fitness = Math.max(0, ps.fitness - BASE_DRAIN * mods.staminaDrain * (0.7 + 0.6 * norm(p.attrs.workrate)) * staminaFactor * effort * conditioning * willToRun);
  }

  private stepToward(ps: PlayerState, tx: number, ty: number, maxStep: number): number {
    const dx = tx - ps.x, dy = ty - ps.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.01) return 0;
    const step = Math.min(maxStep, d);
    // Keep every player on the field. Tactical targets are already inside the
    // pitch, but chasing the ball or dribbling at the goal aims straight at the
    // boundary (x = 0/105), where float rounding can land a hair outside it.
    ps.x = clamp(ps.x + (dx / d) * step, 0, PITCH.w);
    ps.y = clamp(ps.y + (dy / d) * step, 0, PITCH.h);
    return step;
  }

  private closestToBall(teamIdx: 0 | 1): number {
    const s = this.state;
    let best = 1, bestD = Infinity; // skip GK for chases
    for (let i = 1; i < 11; i++) {
      if (this.sentOff.has(teamIdx * 100 + i)) continue;
      const d = Math.hypot(s.players[teamIdx][i].x - s.ball.x, s.players[teamIdx][i].y - s.ball.y);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  // ---- on-ball decisions ----

  private actCarrier() {
    const s = this.state;
    const { teamIdx, playerIdx } = s.carrier!;
    const defTeam = (1 - teamIdx) as 0 | 1;
    const carrier = this.teams[teamIdx].players[playerIdx];
    const cs = s.players[teamIdx][playerIdx];
    const goal = this.goalOf(teamIdx);
    const distGoal = Math.hypot(goal.x - cs.x, goal.y - cs.y);
    const defMods = this.mods[defTeam];

    // pressing defenders attempt tackles
    const tackleRange = clamp(1.4 * defMods.pressIntensity, 0.9, 2.4);
    for (const i of this.pressers(defTeam)) {
      const ds = s.players[defTeam][i];
      if (Math.hypot(ds.x - cs.x, ds.y - cs.y) < tackleRange) {
        const def = this.teams[defTeam].players[i];
        // 1v1 DUEL: defending blends tackling with POSITIONING (reading the challenge); aggression +
        // the Ball-Winner trait sharpen it. Attacker retains via strength/pace/passing, and CREATIVITY
        // (dribbling) lets a skilful carrier wriggle away. positioning blend is ~calibration-neutral
        // (a defender's tackling≈positioning); creativity is centred so base players are unchanged.
        const defEff = (norm(def.attrs.tackling) * 0.7 + norm(def.attrs.positioning) * 0.3) * fit(ds.fitness) * (0.6 + 0.4 * norm(def.attrs.workrate))
          * mMul(def.attrs.aggression, 0.18) * (hasTrait(def, 'ballwinner') ? 1.08 : 1);
        const retain = (norm(carrier.attrs.strength) * 0.5 + norm(carrier.attrs.pace) * 0.3 + norm(carrier.attrs.passing) * 0.2) * fit(cs.fitness)
          * mMul(carrier.attrs.creativity, 0.2) * (hasTrait(carrier, 'maestro') ? 1.06 : 1);
        // TACKLE_RATE — THE ROOT OF THE GEOMETRY DEFECT, and the thing to fix before anything downstream.
        // Every defender within range rolled this EVERY TICK, which produced 144 tackles won and 142 loose
        // balls a match against real football's ~40, and a median possession spell of TWO TICKS — one
        // second. A carrier needs roughly eleven ticks to run from 46m into the penalty area, and the p90
        // spell is four. So nobody could carry the ball anywhere, and the only chance the engine could
        // express was one resolved INSTANTLY, from wherever the receiver happened to be standing: hence
        // 97.6% of shots coming off a through-ball at a median of 45.8 metres.
        // Box runs, clear runs and a real finish are all downstream of being able to keep the ball.
        const pTackle = TACKLE_RATE * clamp(0.12 + 0.5 * (defEff / (defEff + retain)), 0.05, 0.8) * defMods.pressIntensity
          * (1 + Math.max(0, this.dm[defTeam][i].press) * 0.25) * TICK_SEC;
        const roll = this.rng();
        if (roll < pTackle) {
          // A mistimed/reckless win becomes a FOUL. Decided by REUSING `roll` (no extra rng): a win
          // landing in the very top slice of the success band is a foul, and that slice widens with
          // the defender's aggression. Only actual fouls then draw fresh rng (card + set-piece).
          const aggr = norm(def.attrs.aggression ?? 10);
          const foulBand = pTackle * (0.005 + aggr * 0.015);
          if (roll > pTackle - foulBand) {
            this.awardFoul(defTeam, teamIdx, i, playerIdx, { x: cs.x, y: cs.y });
            return;
          }
          this.flow('tackle_won', defTeam, ds.x, def.name); // commentary: a turnover won
          s.carrier = { teamIdx: defTeam, playerIdx: i };
          s.ball = { ...ds };
          return;
        }
      }
    }

    // point-blank finish — a carrier who has got in front of goal in space SHOOTS
    // promptly rather than loitering on the goal line (they used to just dribble in
    // little circles because the range-shot chance is tiny). Gated on a clear-ish
    // central spot with room, so a crowded six-yard box still plays out.
    // shoot from range — likelier the closer/more central and the better the shooter,
    // so players rarely waste hopeful long shots (which keeps shot volume realistic)
    if (distGoal < SHOOT_RANGE) {
      const closeness = 1 - distGoal / SHOOT_RANGE; // 0 at the edge of range, 1 at the goal
      const central = 1 - Math.abs(cs.y - PITCH.h / 2) / (PITCH.h / 2); // 1 dead-central, 0 at the touchline
      const homeBoost = this.teams[teamIdx].homeBoost ?? 1; // Fan Zone home advantage (only teams[0] carries it)
      // STEP 3: THE FINISH, UNCLAMPED — and only now, because unclamping it while the through-ball gate
      // still fired 67 times a match was measured and REVERTED once already (26 goals and 72 shots a
      // match). With chances gated on proximity and the box actually occupied, this is the mechanism that
      // has to carry shot volume, and at its old value it could not: shootP peaked near 0.004 per tick, so
      // a player standing in front of goal shot about once every 250 ticks. SHOT_APPETITE scales it.
      const onClearRun = this.clearRun[teamIdx] === playerIdx;
      const shootP = (onClearRun ? CLEAR_RUN_APPETITE : SHOT_APPETITE) * (0.0022 + norm(carrier.attrs.shooting) * 0.004) * closeness * (0.35 + 0.65 * central) * this.dm[teamIdx][playerIdx].shoot * (1 + this.zonal[teamIdx]) * homeBoost * TICK_SEC;
      if (this.rng() < shootP) {
        this.resolveShot(teamIdx, playerIdx, distGoal, false);
        return;
      }
    }

    // attempt a pass
    if (this.rng() < 0.85 * TICK_SEC) {
      const pick = this.pickPassTarget(teamIdx, playerIdx, goal);
      if (pick) {
        const rec = this.teams[teamIdx].players[pick.idx];
        const recS = s.players[teamIdx][pick.idx];
        const dist = Math.hypot(recS.x - cs.x, recS.y - cs.y);
        const pressure = this.pressureOn(defTeam, recS);
        const risk = pick.through ? 0.14 : 0;
        // A patient, short-passing side that insists on playing out through a heavy press
        // is punished (build-up disrupted) — so pressing is a real counter to possession,
        // without the chaos of forced turnovers.
        const patientUnderPress = Math.max(0, -this.mods[teamIdx].directness) * Math.max(0, defMods.pressIntensity - 1) * 0.42;
        const completion = clamp(
          0.58 + 0.38 * norm(carrier.attrs.passing) * fit(cs.fitness) - dist * 0.008 - pressure * 0.18 - patientUnderPress - risk
          + mAdd(carrier.attrs.teamwork, 0.07) + (hasTrait(carrier, 'metronome') ? 0.03 : 0), // teamwork/Metronome sharpen link-up
          0.1, 0.96,
        );
        if (this.rng() < completion) {
          // commentary: a completed pass in the mid/final third (skip defensive knock-abouts to reduce noise)
          if (this.zoneOf(teamIdx, recS.x) !== 'def') this.flow('pass', teamIdx, recS.x, carrier.name, rec.name);
          this.lastPass[teamIdx] = { passer: playerIdx, receiver: pick.idx, sec: s.clockSec }; // for assist credit
          s.carrier = { teamIdx, playerIdx: pick.idx };
          this.clearRun[teamIdx] = -1;
          s.ball = { ...recS };
          // through-ball that springs a fast forward behind a high line => clear chance
          if (pick.through && this.beatsLastDefender(teamIdx, pick.idx)) {
            s.events.push({ minute: this.minute(), type: 'chance', teamIdx, playerName: rec.name, playerId: rec.id, counter: this.onCounter(teamIdx) });
            // NOTE — A MEASURED, UNFIXED DEFECT, and a REBALANCE THAT WAS DESIGNED AND REJECTED.
            //
            // A full two-sided rebalance was measured over ~1,600 mirrored matches and DOES fix this axis:
            // chances 68 -> 3.6 a match, shots 70 -> 24.6, median shot distance 45.9m -> 16.4m, goals held
            // at 2.26, no side bias, and `shooting` (t=4.6 -> 10.5), `homeBoost` (inert -> t=6.4) and
            // `computeZonal` (inert -> t=2.6) all become live. It was rejected because it breaks the
            // tactical layer: 10 of strategy_test's assertions fail, the formation rock-paper-scissors
            // INVERTS (wide 3-4-3 vs narrow diamond, 69W-28L -> 9W-42L) and so does the preset one
            // (Counter vs Gegenpress, 32W-23L -> 12W-45L). Tuning does not recover it.
            //
            // The reason is structural, and it is the thing to fix first: THIS IS THE GAME'S ONLY CHANCE-
            // CREATION MECHANISM. Only 2% of carrier time is spent inside 18m and there is a hard wall at
            // 25-30m, so with the through-ball shot removed the game produces 2.3 shots and 0.13 goals a
            // match. All shot volume is therefore faked by an inflated shoot-from-range constant, and that
            // constant is what currently rewards central compactness and high pressing over everything
            // else — which is why the shape tests invert when it changes. Off-ball movement has to
            // manufacture box entries before the finish can be unclamped; then the attribute sensitivity
            // budget needs re-normalising as a whole, and computeZonal re-derived as a chance-CREATION
            // edge rather than a shot-probability multiplier. Shipping the tuning alone would trade one
            // measured defect for three. The shot resolves from wherever the receiver was STANDING
            // when the pass arrived: a median of 45.9 metres, past the halfway line. `quality` is
            // clamp(shooting * fit * (1 - dist/26) + 0.15, 0, 1), so 97% of every shot in the game has its
            // shooting term clamped to exactly zero — a 20-rated finisher converts the same as a 5-rated
            // one, and eight of sixteen player attributes do not move results at all. It is also the only
            // reason the shoot-from-range branch fires 0.2% of the time, which in turn makes the formation
            // shape edge, the Fan Zone home advantage and every duty shoot multiplier inert.
            //
            // Resolving the finish from a realistic 7-16m was tried and REVERTED: it takes the game to
            // 26.25 goals and 72 shots a match, because the through-ball gate fires ~67 times a match and
            // the current 3.7% conversion is the only thing hiding that. Fixing this properly means making
            // clear chances RARE first (tighten `beatsLastDefender` / the through-ball gate to a handful a
            // match), then unclamping the finish — a balance project, not a one-line change. Shipping the
            // half of it that raises conversion would be far worse than the defect.
            // NO LONGER A SHOT FROM HERE. This fired resolveShot from wherever the receiver was STANDING
            // when the pass arrived — a median of 45.8 metres, past the halfway line — which is the single
            // root of the whole geometry defect: 97.6% of every shot in the game came through this line,
            // 2.4% of them from inside the box, and `quality` clamps the shooting term to zero at that
            // range so a 20-rated finisher converted like a 5-rated one.
            //
            // A ball played in behind is a CHANCE, not a strike. The receiver already has possession (set
            // above), so he now carries it at the goal and the ordinary shoot-from-range logic decides the
            // finish when he actually arrives. Volume is preserved — the gate still fires as often — while
            // the shot itself happens where a shot happens.
            this.clearRun[teamIdx] = pick.idx;
          }
        } else {
          // Intercepted/loose ball scatters near the midpoint of the attempted pass;
          // clamp so a scatter next to a touchline/goal line can't leave the pitch.
          const dx = s.players[teamIdx][pick.idx].x;
          s.ball = {
            x: clamp((cs.x + dx) / 2 + (this.rng() - 0.5) * 6, 0, PITCH.w),
            y: clamp((cs.y + recS.y) / 2 + (this.rng() - 0.5) * 6, 0, PITCH.h),
          };
          this.flow('loose_ball', teamIdx, s.ball.x, carrier.name); // commentary: pass cut out / loose ball
          s.carrier = null;
        }
        return;
      }
    }

    // dribble toward goal
    const speed = (1.6 + norm(carrier.attrs.pace) * 3.0) * (hasTrait(carrier, 'livewire') ? 1.06 : 1) * fit(cs.fitness) * TICK_SEC;
    this.stepToward(cs, goal.x, goal.y + (this.rng() - 0.5) * 10, speed);
    this.drain(cs, carrier, this.mods[teamIdx], 1.2);
    s.ball = { x: cs.x, y: cs.y };
  }

  /** Count of opponents within 4m of a spot (passing/receiving pressure, 0..~3). */
  private pressureOn(defTeam: 0 | 1, at: { x: number; y: number }): number {
    const s = this.state;
    let n = 0;
    for (let i = 1; i < 11; i++) {
      if (Math.hypot(s.players[defTeam][i].x - at.x, s.players[defTeam][i].y - at.y) < 4) n++;
    }
    return Math.min(3, n);
  }

  private pickPassTarget(teamIdx: 0 | 1, playerIdx: number, goal: Goal): { idx: number; through: boolean } | null {
    const s = this.state;
    const mods = this.mods[teamIdx];
    const defTeam = (1 - teamIdx) as 0 | 1;
    const cs = s.players[teamIdx][playerIdx];
    const myDistGoal = Math.hypot(goal.x - cs.x, goal.y - cs.y);
    // PLAY-OUT-OF-DEFENCE instruction (off by default): when the KEEPER has the ball, a side with it
    // armed insists on the safest short option regardless of the tempo slider — the trade-off is fewer
    // risky giveaways right after a save/gather, at the cost of the counter-attacking speed a longer,
    // more direct restart would have given. Only overrides directness for this one decision.
    const directness = (playerIdx === 0 && this.tactics[teamIdx].playOutOfDefence) ? -1 : mods.directness;
    let best: { idx: number; through: boolean } | null = null;
    let bestScore = -Infinity;
    for (let i = 0; i < 11; i++) {
      if (i === playerIdx) continue;
      if (this.sentOff.has(teamIdx * 100 + i)) continue;
      const ts = s.players[teamIdx][i];
      const dGoal = Math.hypot(goal.x - ts.x, goal.y - ts.y);
      const dPass = Math.hypot(ts.x - cs.x, ts.y - cs.y);
      if (dPass > 42 || dPass < 3) continue;
      const gain = myDistGoal - dGoal; // positive = progresses toward goal
      const pressure = this.pressureOn(defTeam, ts);
      // ATTACK-FOCUS instruction (unset = neutral): bias the ball toward the widest or the most
      // central available option, on top of everything else — a deliberate lean into (or away from)
      // the shape's natural width, independent of any single duty's magnet.
      const focus = this.tactics[teamIdx].attackFocus;
      const focusBias = focus === 'wide' ? Math.abs(ts.y - 34) * 0.18 : focus === 'central' ? -Math.abs(ts.y - 34) * 0.18 : 0;
      // directness>0 rewards forward gain and tolerates longer passes; <0 rewards safe short options.
      // duty "magnet" makes playmakers/target-men more (and ball-winners less) sought as an out-ball.
      const score = gain * (0.7 + 0.6 * (directness + 1))
        - dPass * (0.2 - directness * 0.1)
        - pressure * 3
        + this.dm[teamIdx][i].magnet
        + focusBias
        + this.rng() * 6;
      // a direct side, and especially one on the counter, slips more through-balls in behind;
      // the passer's creativity (and the Creative Maestro trait) unlocks more of them
      const counter = this.onCounter(teamIdx);
      const passer = this.teams[teamIdx].players[playerIdx];
      const throughP = clamp(0.5 + 0.16 * directness + (counter ? 0.14 : 0)
        + mAdd(passer.attrs.creativity, 0.12) + (hasTrait(passer, 'maestro') ? 0.05 : 0), 0.25, 0.9);
      const through = gain > (counter ? 14 : 16) && this.teams[teamIdx].players[i].role === 'FW' && this.rng() < throughP;
      if (gain > -6 && score > bestScore) { bestScore = score; best = { idx: i, through }; }
    }
    return best;
  }

  /** True if the receiver is beyond the opponent's last defender and can outrun the nearest one. */
  private beatsLastDefender(teamIdx: 0 | 1, recIdx: number): boolean {
    const s = this.state;
    const defTeam = (1 - teamIdx) as 0 | 1;
    const rec = this.teams[teamIdx].players[recIdx];
    const recS = s.players[teamIdx][recIdx];
    const dir = this.attackDir(teamIdx);
    let nearest = 1, nd = Infinity;
    for (let i = 1; i < 11; i++) {
      if (this.sentOff.has(defTeam * 100 + i)) continue;
      const d = Math.hypot(s.players[defTeam][i].x - recS.x, s.players[defTeam][i].y - recS.y);
      if (d < nd) { nd = d; nearest = i; }
    }
    const def = this.teams[defTeam].players[nearest];
    const ds = s.players[defTeam][nearest];
    const behind = dir === 1 ? recS.x > ds.x : recS.x < ds.x; // receiver already past that defender
    const paceGap = norm(rec.attrs.pace) * fit(recS.fitness) - norm(def.attrs.pace) * fit(ds.fitness);
    // OFFSIDE TRAP instruction (off by default, and only meaningful with a high/very-high line): the
    // back line steps up together the instant the ball is played, so a receiver needs a REAL pace
    // edge to spring it clean — a marginal one just gets caught. Bounded to this one decision, so a
    // side without a genuine outlet threat gets far fewer clear breakaways; a side with real pace
    // (e.g. a poacher/pressing-forward with a big gap) still tears the trap open exactly as before.
    // STEP 1 OF THE REBUILD: A CLEAR CHANCE HAS TO BE NEAR THE GOAL.
    // This gate asked only "is the receiver past the last defender, and faster?" — never "is he anywhere
    // dangerous?" — and it fires about 67 times a match, supplying 97.6% of every shot in the game. The
    // shot then resolves from wherever the receiver was STANDING when the pass arrived: a median of 45.8
    // metres, past the halfway line, with 2.4% of all shots taken from inside the box. That is the whole
    // shape of the defect, and every downstream symptom (an inflated shoot-from-range constant, `shooting`
    // clamped inert on 97% of attempts, an empty penalty area) hangs off it.
    //
    // A ball played in behind at 46 metres is a pass into space, not a chance. CHANCE_RANGE says how close
    // the receiver must be to the goal he is attacking for it to count as one. Rarity FIRST, exactly as
    // engine.ts's own note prescribes — the finish cannot be unclamped while the gate fires 67 times.
    const trap = !!this.tactics[defTeam].offsideTrap && this.tactics[defTeam].line >= 1;
    if (!trap) return behind && paceGap > 0;
    if (paceGap > TRAP_BEATS) return behind;              // real pace tears a set trap open, as before
    // ...and otherwise he is caught — UNLESS the step-up is mistimed, which is the risk the instruction's
    // own description has always promised and the engine never implemented. See TRAP_MISTIME.
    return behind && this.rng() < TRAP_MISTIME;
  }

  private resolveShot(teamIdx: 0 | 1, playerIdx: number, distGoal: number, clear: boolean, allowRebound = true) {
    const s = this.state;
    const shooter = this.teams[teamIdx].players[playerIdx];
    const ss = s.players[teamIdx][playerIdx];
    const defTeam = (1 - teamIdx) as 0 | 1;
    const gk = this.teams[defTeam].players[0];
    const gks = s.players[defTeam][0];
    const quality = clamp(norm(shooter.attrs.shooting) * fit(ss.fitness) * (1 - distGoal / QUALITY_RANGE) + (clear ? 0.15 : 0), 0, 1);
    const minute = this.minute();
    const onTarget = this.rng() < 0.5 + quality * 0.45;
    if (!onTarget) {
      // only log clear-cut misses; hopeful long-range efforts don't clutter the feed
      if (quality > 0.32 || clear) {
        // a small deterministic slice of high-quality off-target efforts rattle the woodwork —
        // pure commentary relabel (still no goal, keeper still restarts): consumes NO rng.
        const frame = quality > 0.5 && (((minute * 131 + playerIdx * 17 + teamIdx * 7) >>> 0) % 6 === 0);
        s.events.push({ minute, type: frame ? 'woodwork' : 'shot_missed', teamIdx, playerName: shooter.name, playerId: shooter.id });
      }
    } else {
      // composure (+ Clinical Finisher, + a calm well-led side) lifts conversion; The Wall keeper resists it.
      // all centred → a neutral shooter/keeper/team scores exactly as before.
      // BIG-GAME PLAYER ("turns up when it matters most"). Held by 57.5% of graduated bloodline stars —
      // the most common trait in the game, and on the hero path specifically — while doing nothing at all.
      // It reads `Team.stakes`, which is 0 for a league fixture and rises for a cup round, so the trait is
      // inert in the ordinary week and only speaks on the occasion it is named for. It is 0.00 per XI on
      // squad players (their gate reads a career log they do not have), so this affects exactly one man
      // per save: yours.
      const occasion = hasTrait(shooter, 'biggame') ? 0.035 * (this.teams[teamIdx].stakes ?? 0) : 0;
      const finish = mAdd(shooter.attrs.composure, 0.1) + (hasTrait(shooter, 'clinical') ? 0.04 : 0) + occasion + this.leadershipBonus[teamIdx];
      const wall = hasTrait(gk, 'wall') ? 0.06 : 0;
      // THE SPARK ("makes something from nothing") — a bonus that applies ONLY to a poor chance. Hooking it
      // to the distance term instead was tried and measured as a no-op: `quality` is
      // `(1 - distGoal / QUALITY_RANGE)` clamped at 0, and shots in this engine come from a median ~45m, so
      // that expression is already pinned at zero for almost every attempt and widening the range moved
      // nothing (0 of 24 fixtures). Conversion is where a poor chance can still become a goal, which is
      // also the more honest reading of the trait: he scores the one nobody else would have.
      const spark = hasTrait(shooter, 'spark') && quality < 0.35 ? 0.035 : 0;
      const goalProb = clamp(0.13 + quality * 0.55 - norm(gk.attrs.keeping) * fit(gks.fitness) * 0.2 + (clear ? 0.12 : 0) + finish + spark - wall, 0.03, 0.9);
      if (this.rng() < goalProb) {
        s.score[teamIdx]++;
        // assist = the player who played the last pass to this scorer, if recent (<=8s) and not himself
        const lp = this.lastPass[teamIdx];
        const assistP = lp && lp.receiver === playerIdx && lp.passer !== playerIdx && s.clockSec - lp.sec <= 8
          ? this.teams[teamIdx].players[lp.passer] : undefined;
        s.events.push({ minute, type: 'goal', teamIdx, playerName: shooter.name, playerId: shooter.id, playerName2: assistP?.name, playerId2: assistP?.id });
        this.lastPass[teamIdx] = null;
        this.giveKickoff(defTeam);
        return;
      }
      s.events.push({ minute, type: 'shot_saved', teamIdx, playerName: shooter.name, playerId: shooter.id });
      // the keeper can only parry — the ball spills to a lurking attacker for a follow-up (one only)
      if (allowRebound && this.rng() < 0.05) {
        let poacher = playerIdx, pd = Infinity; // nearest forward-ish teammate to the goal
        for (let i = 1; i < 11; i++) {
          if (this.sentOff.has(teamIdx * 100 + i)) continue;
          const pl = this.teams[teamIdx].players[i];
          if (pl.role !== 'FW' && pl.role !== 'MF') continue;
          const d = Math.hypot(this.goalOf(teamIdx).x - s.players[teamIdx][i].x, this.goalOf(teamIdx).y - s.players[teamIdx][i].y);
          if (d < pd) { pd = d; poacher = i; }
        }
        s.events.push({ minute, type: 'chance', teamIdx, playerName: this.teams[teamIdx].players[poacher].name, playerId: this.teams[teamIdx].players[poacher].id });
        this.resolveShot(teamIdx, poacher, Math.max(11, Math.min(distGoal, 14)), false, false); // rushed follow-up, no further rebound
        return;
      }
      // a save is often pushed behind for a corner
      if (this.rng() < 0.14) { this.takeCorner(teamIdx, defTeam, minute); return; }
    }
    s.carrier = { teamIdx: defTeam, playerIdx: 0 };
    s.ball = { ...s.players[defTeam][0] };
  }

  /** Resolve a corner: a delivery (setPiece) met by the best aerial attacker vs the keeper.
   *  Draws rng (real mechanic; conversion kept low so goals stay in band). */
  private takeCorner(atkTeam: 0 | 1, defTeam: 0 | 1, minute: number) {
    const s = this.state;
    const taker = this.bestSetPiece(atkTeam, 'corner');
    s.events.push({ minute, type: 'corner', teamIdx: atkTeam, playerName: taker.p.name, playerId: taker.p.id });
    // aerial target = best strength+positioning outfielder on the pitch
    let hi = 1, best = -Infinity;
    for (let i = 1; i < 11; i++) {
      if (this.sentOff.has(atkTeam * 100 + i)) continue;
      const a = this.teams[atkTeam].players[i].attrs;
      const v = a.strength + a.positioning;
      if (v > best) { best = v; hi = i; }
    }
    const header = this.teams[atkTeam].players[hi];
    const gk = this.teams[defTeam].players[0], gks = s.players[defTeam][0];
    const delivery = norm(taker.p.attrs.setPiece ?? 8);
    const aerial = norm(header.attrs.strength) * 0.6 + norm(header.attrs.positioning) * 0.4;
    const goalP = clamp(0.012 + delivery * 0.018 + aerial * 0.02 - norm(gk.attrs.keeping) * fit(gks.fitness) * 0.025, 0.008, 0.05);
    const r = this.rng();
    if (r < goalP) {
      s.score[atkTeam]++;
      // the corner delivery is the assist (unless the taker headed it in himself)
      const assist = taker.i !== hi ? taker.p.name : undefined;
      const assistId = taker.i !== hi ? taker.p.id : undefined;
      s.events.push({ minute, type: 'goal', teamIdx: atkTeam, playerName: header.name, playerId: header.id, playerName2: assist, playerId2: assistId });
      this.giveKickoff(defTeam);
      return;
    }
    if (r < goalP + 0.10) s.events.push({ minute, type: 'shot_saved', teamIdx: atkTeam, playerName: header.name, playerId: header.id }); // header on target, kept out
    s.carrier = { teamIdx: defTeam, playerIdx: 0 };
    s.ball = { ...gks };
  }

  /** Is point `at` inside defTeam's own penalty area? (box ≈ 16.5m deep, 40.3m wide, centred). */
  private inBoxOf(defTeam: 0 | 1, at: { x: number; y: number }): boolean {
    const nearGoal = defTeam === 0 ? at.x <= 16.5 : at.x >= PITCH.w - 16.5;
    return nearGoal && at.y >= 13.85 && at.y <= 54.15;
  }

  /** Best on-pitch set-piece taker (skips GK and any sent-off man): setPiece + composure. */
  private bestSetPiece(teamIdx: 0 | 1, type?: 'pen' | 'fk' | 'corner'): { p: Player; i: number } {
    // a MANAGER-DESIGNATED taker for this set-piece type takes it (if on the pitch); else auto-pick
    if (type) {
      for (let i = 1; i < 11; i++) {
        if (this.sentOff.has(teamIdx * 100 + i)) continue;
        const pl = this.teams[teamIdx].players[i];
        if (type === 'pen' ? pl.takesPen : type === 'fk' ? pl.takesFk : pl.takesCorner) return { p: pl, i };
      }
    }
    let bi = 1, best = -Infinity;
    for (let i = 1; i < 11; i++) {
      if (this.sentOff.has(teamIdx * 100 + i)) continue;
      const a = this.teams[teamIdx].players[i].attrs;
      const v = (a.setPiece ?? 8) + (a.composure ?? 10);
      if (v > best) { best = v; bi = i; }
    }
    return { p: this.teams[teamIdx].players[bi], i: bi };
  }

  /** A foul was committed by `defIdx` on the carrier `atkIdx` at `at`. Emits the foul, a possible
   *  card, and the restart: penalty (in box), a dangerous free kick (central & close), or a simple
   *  restart that hands possession back. Draws rng (real mechanic — outcomes change; re-tuned). */
  private awardFoul(defTeam: 0 | 1, atkTeam: 0 | 1, defIdx: number, atkIdx: number, at: { x: number; y: number }) {
    const s = this.state;
    const minute = this.minute();
    const fouler = this.teams[defTeam].players[defIdx];
    const zone = this.zoneOf(defTeam, at.x);
    s.events.push({ minute, type: 'foul', teamIdx: defTeam, playerName: fouler.name, playerId: fouler.id, zone });

    // discipline: aggression drives card risk; a foul on a clear break (carrier already in the
    // final third) is a candidate professional foul → rare straight red. Second yellow = red.
    const aggr = norm(fouler.attrs.aggression ?? 10);
    const key = defTeam * 100 + defIdx;
    const cardRoll = this.rng();
    const dangerous = this.zoneOf(atkTeam, at.x) === 'att';
    if (dangerous && cardRoll < 0.002 + aggr * 0.003) {
      this.sendOff(defTeam, defIdx, minute, 'red');
    } else if (cardRoll < 0.10 + aggr * 0.14) {
      if (this.booked.has(key)) this.sendOff(defTeam, defIdx, minute, 'second-yellow');
      else { this.booked.add(key); s.events.push({ minute, type: 'yellow_card', teamIdx: defTeam, playerName: fouler.name, playerId: fouler.id }); }
    }

    // restart — not every foul in the box is given; the ref often waves it on / the keeper gathers
    if (this.inBoxOf(defTeam, at)) {
      if (this.rng() < 0.22) { this.takePenalty(atkTeam, defTeam, minute); return; }
      s.carrier = { teamIdx: defTeam, playerIdx: 0 };
      s.ball = { ...s.players[defTeam][0] };
      return;
    }
    const goal = this.goalOf(atkTeam);
    const dGoal = Math.hypot(goal.x - at.x, goal.y - at.y);
    const central = Math.abs(at.y - PITCH.h / 2) < 20;
    if (dGoal < 25 && central) { this.takeFreeKick(atkTeam, defTeam, at, minute); return; }
    // ordinary restart: the fouled side keeps the ball at the spot
    s.carrier = { teamIdx: atkTeam, playerIdx: atkIdx };
    s.ball = { x: at.x, y: at.y };
  }

  private sendOff(teamIdx: 0 | 1, playerIdx: number, minute: number, kind: 'red' | 'second-yellow') {
    this.sentOff.add(teamIdx * 100 + playerIdx);
    const p = this.teams[teamIdx].players[playerIdx];
    this.state.events.push({ minute, type: 'red_card', teamIdx, playerName: p.name, playerId: p.id, zone: kind === 'second-yellow' ? 'mid' : undefined });
    // send him to the touchline, out of the play — every sim loop skips sent-off players, and
    // this keeps his position in-bounds (a legitimate engine invariant checked by the fuzz harness).
    const ps = this.state.players[teamIdx][playerIdx];
    ps.x = teamIdx === 0 ? 1 : PITCH.w - 1; ps.y = 0.5; ps.fitness = 1;
  }

  private takePenalty(atkTeam: 0 | 1, defTeam: 0 | 1, minute: number) {
    const s = this.state;
    const { p: taker } = this.bestSetPiece(atkTeam, 'pen');
    const gk = this.teams[defTeam].players[0], gks = s.players[defTeam][0];
    s.events.push({ minute, type: 'penalty', teamIdx: atkTeam, playerName: taker.name, playerId: taker.id });
    const convP = clamp(0.70 + norm(taker.attrs.setPiece ?? 8) * 0.14 + mAdd(taker.attrs.composure, 0.08) - norm(gk.attrs.keeping) * fit(gks.fitness) * 0.14, 0.5, 0.93);
    if (this.rng() < convP) {
      s.score[atkTeam]++;
      s.events.push({ minute, type: 'goal', teamIdx: atkTeam, playerName: taker.name, playerId: taker.id });
      this.giveKickoff(defTeam);
    } else {
      s.events.push({ minute, type: 'penalty_missed', teamIdx: atkTeam, playerName: taker.name, playerId: taker.id });
      s.carrier = { teamIdx: defTeam, playerIdx: 0 };
      s.ball = { ...gks };
    }
  }

  private takeFreeKick(atkTeam: 0 | 1, defTeam: 0 | 1, at: { x: number; y: number }, minute: number) {
    const s = this.state;
    const { p: taker } = this.bestSetPiece(atkTeam, 'fk');
    const gk = this.teams[defTeam].players[0], gks = s.players[defTeam][0];
    s.events.push({ minute, type: 'free_kick', teamIdx: atkTeam, playerName: taker.name, playerId: taker.id, zone: 'att' });
    const goal = this.goalOf(atkTeam);
    const dist = Math.hypot(goal.x - at.x, goal.y - at.y);
    const quality = clamp(norm(taker.attrs.setPiece ?? 8) * (1 - dist / 34), 0, 1);
    const scoreP = clamp(0.03 + quality * 0.11 - norm(gk.attrs.keeping) * fit(gks.fitness) * 0.08, 0.01, 0.15);
    if (this.rng() < scoreP) {
      s.score[atkTeam]++;
      s.events.push({ minute, type: 'goal', teamIdx: atkTeam, playerName: taker.name, playerId: taker.id });
      this.giveKickoff(defTeam);
      return;
    }
    // off target vs saved — either way the keeper restarts
    s.events.push({ minute, type: this.rng() < 0.5 ? 'shot_saved' : 'shot_missed', teamIdx: atkTeam, playerName: taker.name, playerId: taker.id });
    s.carrier = { teamIdx: defTeam, playerIdx: 0 };
    s.ball = { ...gks };
  }

  private chaseLooseBall() {
    const s = this.state;
    // a 50/50 is a PHYSICAL DUEL: strength + pace let a player win it from a little further out,
    // so those stats matter in every scramble. Centred at the neutral stat → average players ≈ pure
    // proximity (calibration-safe); the winner is picked by effective reach but must still be near it.
    let best: { teamIdx: 0 | 1; playerIdx: number; eff: number; d: number } | null = null;
    for (const teamIdx of [0, 1] as const) {
      s.players[teamIdx].forEach((ps, i) => {
        const p = this.teams[teamIdx].players[i];
        const d = Math.hypot(ps.x - s.ball.x, ps.y - s.ball.y);
        const physical = 0.5 * (norm(p.attrs.strength) + norm(p.attrs.pace) - 1); // >0 above the neutral stat
        const eff = d - physical;
        if (!best || eff < best.eff) best = { teamIdx, playerIdx: i, eff, d };
      });
    }
    if (best && (best as { d: number }).d < 1.4) {
      const b = best as { teamIdx: 0 | 1; playerIdx: number };
      s.carrier = { teamIdx: b.teamIdx, playerIdx: b.playerIdx };
    }
  }
}
