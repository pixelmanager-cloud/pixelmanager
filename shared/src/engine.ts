import type { MatchState, Player, PlayerState, Role, Team } from './types.js';
import { PITCH } from './types.js';
import { makeRng } from './rng.js';
import { mirroredAnchor } from './teams.js';
import { DEFAULT_TACTICS, deriveMods, type TacticMods, type Tactics } from './tactics.js';
import { dutyMods, effectiveDuty, type DutyMods } from './duties.js';
import { mMul, mAdd, hasTrait, teamLeadership } from './mental.js';

export const TICK_SEC = 0.5; // game-seconds per tick
const MATCH_SEC = 90 * 60;
const SHOOT_RANGE = 22; // metres from goal a player will attempt a shot // metres from goal a player will attempt a shot
/** The distance at which shot quality falls to zero. SEPARATE from SHOOT_RANGE, which is the trigger
 *  radius — one constant was doing both jobs via `SHOOT_RANGE + 8`, so re-tuning when a player shoots
 *  silently re-tuned how well he finishes. Same value as before (18 + 8), so behaviour is unchanged. */
const QUALITY_RANGE = 26;
/** How close to the attacking goal the ball must be before off-ball attackers break for the box. 35m is
 *  roughly the final third — runs start as the move enters it, not from the halfway line. */
const BOX_RUN_TRIGGER = 35;
/** The duty `push` at or above which a midfielder joins the run. Forwards always go. */
const BOX_RUN_PUSH = 1;
/** How much of a runner's natural width he keeps as he attacks the box (1 = keeps his flank entirely). */
const BOX_RUN_WIDTH = Number(process.env.BW ?? 0.25);
/** Distance off centre at which a player's anchor makes him a touchline outlet rather than a box runner. */
const WIDE_ANCHOR = Number(process.env.WA ?? 15);      // above this, a player overlaps instead of attacking the box
/** How far up the flank an overlapping wide player pushes — metres short of the goal line. */
const OVERLAP_DEPTH = Number(process.env.OD ?? 14);
/** Extra metres a DEFENDER holds back when overlapping, so he is nearer home when it turns over. */
/** Holding defenders back on the overlap helps a back five and hurts a back four, monotonically, and
 *  every non-zero value cost more elsewhere than it bought: 0 -> 1 failure, 3 -> 6, 5 -> 5, 8 -> 3, 16 -> 6. */
const DF_OVERLAP_HOLD = Number(process.env.DOH ?? 0);
/** How close a defender counts as crowding a shot, and how much each one costs its quality. */
const CROWD_RADIUS = Number(process.env.CR2 ?? 5);
const CROWD_PENALTY = Number(process.env.CP ?? 0.07);
/** How much each defender standing in the passing lane costs a through ball, and how near the line counts. */
const LANE_BLOCK = Number(process.env.LB ?? 0.12);
const LANE_WIDTH = Number(process.env.LW ?? 3.5);
/** Base pass-completion probability before passer quality, distance and pressure.
 *  MEASURED AT 59.2% COMPLETION against roughly 80% in real football, and that gap was the engine's real
 *  structural defect. A pass failed almost two times in five, so the median possession spell was TWO TICKS
 *  — one second. Nothing that takes time to happen could ever happen: an attacker cannot run thirty metres
 *  into a penalty area in one second, which is why the box was measured empty (0.02 attackers) and why the
 *  only chance-creation the game had was a through ball hit from wherever play had stalled, a median of
 *  45.8 metres out. Every downstream symptom — the clamped shooting term, the inert Fan Zone and duty
 *  shoot multipliers, 65 shots a match — traces back here rather than to the finish. */
const PASS_BASE = Number(process.env.PB ?? 0.948);
/** How much of pass completion follows the passer's ability in the ABSOLUTE.
 *
 *  THE PYRAMID WAS THREE DIFFERENT GAMES. The calibration gate measures goals/match at one squad quality and
 *  asserts it sits in [1.6, 3.6]; it passed, while the same engine produced 0.19 goals/match at tier 8's
 *  strength and 6.22 at tier 1's — a thirty-three-fold spread the gate could not see, because it only ever
 *  looked at one point on it. The bottom of the pyramid, where every career starts, was close to goalless.
 *
 *  Completion is the reason, and it compounds: a chain of eight passes lands 17% of the time at 80%
 *  completion and 66% at 95%, so a side whose passers are a few points better reaches the final third
 *  several times as often. At 0.38 this term swung completion from ~0.83 to ~1.09 across the range of squads
 *  the game generates. At 0.06 it barely moves, which is what real football looks like: pass completion is
 *  broadly similar in the fourth tier and the first, because the defending scales with the passing.
 *
 *  A DIFFERENTIAL FORM WAS TRIED FIRST AND REJECTED — the passer measured against the specific defence he
 *  was playing. It flattens the equal-strength curve no better than this does (the two are identical when
 *  the sides are equal, which is the only case that curve measures) and it doubles every mismatch, because
 *  the adjustment runs in opposite directions for the two teams: a 15 against an 11 finished 7.80-0.04.
 *  What varies with the STANDARD of the game belongs at the shot, where SHOT_REL applies it to both sides
 *  at once. See PASS_ABS below. */
/** The two other places absolute quality leaked into scoring, once the pass was made relative.
 *  With the absolute passing slope cut (PASS_ABS) the spread across the pyramid fell from sixteen-fold to
 *  the residue splits cleanly in two: shot ATTEMPTS still rose 3.1x from quality 6 to 18 and CONVERSION
 *  1.86x. SHOOT_ABS is how much a carrier's own shooting drives him to pull the trigger (attempts), and
 *  GK_SCALE is how hard the keeper resists (conversion) — the keeper's term was fixed at 0.2 while the
 *  shooter's reached 0.36, so a better keeper could never fully answer a better striker. */
const SHOOT_BASE_P = Number(process.env.SBP ?? 0.0022);
const SHOOT_ABS = Number(process.env.SA ?? 0.004);
const GK_SCALE = Number(process.env.GKS ?? 0.2);
/** How far a chance's quality is judged against the opposition rather than in the absolute, and the squad
 *  quality the whole engine is calibrated at (tier 3-to-2 strength, where the goals/match gate was set). */
const SHOT_REL = Number(process.env.SR ?? 1.1);
const DEF_ANCHOR = 0.65;
/** How much of the pressure penalty a drilled side shrugs off when playing out of its own defensive third.
 *  A flat completion bonus was the wrong shape — the instruction's claim is that the side BEATS THE PRESS,
 *  so it belongs on the pressure term, which is the only thing a press does to a pass. */
const PLAY_OUT_DRILL = Number(process.env.POD ?? 0.5);
/** How far a defender abandons his shape anchor to track the man he is marking, at neutral press.
 *  NOBODY MARKED ANYONE. `pressers` sends the nearest `pressCount` players AT THE BALL, and everyone else
 *  held a formation anchor pulled loosely toward it — so the defending side converged on the carrier and
 *  left every passing option free. `pressureOn`, which is what actually gates a pass, measures opponents
 *  within four metres OF THE RECEIVER, and measured against a maximum press it read 0.062 in the passing
 *  side's own defensive third. A press that does not deny the pass is not a press, and three separate
 *  assertions fail on it: play-out-of-defence has no press to beat, and the anchor duty has no screening
 *  job to be good at. */
const MARK_PULL = Number(process.env.MP ?? 0.25);
/** How far goal-side of his man a marker positions himself, in metres. */
const MARK_GOALSIDE = 2.5;
/** Marking strength in a side's OWN defensive area, where a block is settled and picks people up whatever
 *  its press setting says, and how far from its own goal that area extends. */
const MARK_DEEP = Number(process.env.MD ?? 1.3);
const MARK_DEEP_RANGE = Number(process.env.MDR ?? 38);
const PASS_ABS = Number(process.env.PA ?? 0.06);
/** Scales the per-tick, per-defender tackle probability.
 *  MEASURED AT 1,508 TACKLES A MATCH against roughly 40 in real football. Every pressing defender within
 *  range rolled a ~19% chance EVERY TICK, so with two defenders near the ball a carrier lost it about a
 *  third of the time each second. This — not the finish, and not off-ball movement — is why possession
 *  never lasted, why nothing that takes time could occur, and why the box stayed empty. */
const TACKLE_SCALE = Number(process.env.TS ?? 0.15);
/** Scales how readily a carrier inside SHOOT_RANGE pulls the trigger. With the through-ball shot removed
 *  this branch is now the game's ONLY finish, so it carries all the shot volume; at the old value carriers
 *  dribbled to the goal line before shooting (median shot distance 2.2m) instead of striking from range. */
const SHOOT_SCALE = Number(process.env.SS ?? 5);
const GP_BASE = Number(process.env.GB ?? 0.12);
const GP_Q = Number(process.env.GQ ?? 0.36);
/** How much likelier a tackle is on the goal line than outside the final third. */
const BOX_DEFENCE = Number(process.env.BD ?? 3);
/** How strongly a tactic's press intensity converts into tackles won. The old flat tackle probability
 *  SATURATED against its 0.8 clamp, which quietly compressed every press difference; once the rate is
 *  realistic nothing saturates, the full press advantage expresses, and Gegenpress dominates the field at
 *  68%. Sub-linear scaling restores a beatable press. */
const PRESS_EXP = Number(process.env.PE ?? 2.2);
/** How far out a wide player will deliver a cross, and how far off-centre counts as "wide". */
const CROSS_RANGE = Number(process.env.CR ?? 34);
const CROSS_WIDE_Y = Number(process.env.CW ?? 13);
/** Base per-tick rate a wide carrier in range whips one in. */
const CROSS_RATE = Number(process.env.CX ?? 0.07);
/** How much a duty's `magnet` — its designation as the team's out-ball, i.e. its creator — raises how often
 *  it delivers from wide. 0 keeps every wide player delivering at the same rate regardless of role. */
const CROSS_CREATOR = Number(process.env.CC ?? 0.16);
/** How much a duty's `magnet` improves the QUALITY of its delivery (finding a man), as opposed to how
 *  often it delivers. Quality is the targeted lever; volume distorts the whole attack. */
const CROSS_VISION = Number(process.env.CV ?? 0.012);
/** How strongly a cross seeks the designated FINISHER (a duty's `shoot`) over merely the nearest man. */
/** Tried and left OFF: aiming crosses at the finisher changed nothing at either 3 or 8 (identical shot
 *  counts), so it is not on the path that decides who shoots. Kept as a documented dead end. */
const CROSS_TO_FINISHER = Number(process.env.CF ?? 0);
/** How strongly play seeks the designated finisher (a duty's `shoot`) as it nears the opposition goal. */
/** Tried and left OFF: at 4 it made the poacher shoot LESS (37.4 from 38.6) and added a failure. The
 *  poacher problem was three measurement errors, not a missing pull. */
const FINISHER_PULL = Number(process.env.FP ?? 0);
/** Radius from goal counted as "attacking the box" for both the runner and the defenders contesting it. */
const BOX_ATTACK_RADIUS = Number(process.env.BAR ?? 16);
/** How heavily a pass option's progress-toward-goal and its freedom-from-pressure weigh against each other. */
const GAIN_W = Number(process.env.GW ?? 1);
const PRESSURE_W = Number(process.env.PW ?? 3);
/** Distance from goal beyond which a carrier keeps his own channel rather than drifting to the centre. */
const LANE_HOLD_RANGE = Number(process.env.LH ?? 40);
/** How strongly a free wide option in the final third is sought as a switch of play. */
/** How much of `gain` is measured up the pitch rather than toward the goal spot. 0 == the original. */
const UPFIELD_W = Number(process.env.UW ?? 0.65);
const WIDTH_PULL = Number(process.env.WP ?? 3);
const WIDTH_ZONE = Number(process.env.WZ ?? 40);
/** How unpressured a wide team-mate must be for a lateral switch to him to be allowed at all, and how much
 *  ground such a switch may concede. */
const SWITCH_FREEDOM = Number(process.env.SF ?? 0.35);
const SWITCH_TOLERANCE = Number(process.env.ST ?? 22);
const BASE_DRAIN = 0.000034; // fitness lost per tick by a working outfielder (tuned via harness)

const norm = (stat: number) => stat / 20;
/** effective-stat multiplier from current fitness: 1.0 fresh, ~0.85 when gassed. */
const fit = (f: number) => 0.7 + 0.3 * f;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const PUSH_BY_ROLE: Record<Role, number> = { GK: 0, DF: 0.35, MF: 0.8, FW: 1.0 };

interface Goal { x: number; y: number }

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
  /** Each side's ability to CUT A PASS OUT — mean tackling/positioning across its outfielders, normalised.
   *  The counterweight to the passer's own quality, so that two equally good sides pass at the same rate no
   *  matter how good they both are. Recomputed whenever the XI can change. */
  private defSkill: [number, number];
  /** commentary-only throttle: last game-second we emitted a "flow" event (pass/tackle/loose-ball),
   *  so the feed gets texture without a line every micro-tick. Purely cosmetic — never read by the sim. */
  private lastFlowSec = -99;
  private fatigueFlagged = new Set<number>(); // key = team*100+idx already narrated as gassed (cosmetic)
  private lastFatigueMin = -1;
  private sentOff = new Set<number>(); // key = team*100+idx of players shown a red card (removed from play)
  private booked = new Set<number>();  // key = team*100+idx already on a yellow (second yellow = red)
  private subsUsed: [number, number] = [0, 0];
  private benchLeft: [Player[], Player[]] = [[], []]; // remaining substitutes per side
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
    this.defSkill = [this.computeDefSkill(0), this.computeDefSkill(1)];
    this.state = {
      clockSec: 0,
      score: [0, 0],
      ball: { x: PITCH.w / 2, y: PITCH.h / 2 },
      carrier: null,
      players: [this.initPositions(0), this.initPositions(1)],
      possession: [0, 0],
      events: [{ minute: 0, type: 'kickoff', teamIdx: 0 }],
      shotAttempts: [0, 0],
      shotAttemptsBy: [{}, {}],
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
          s.events.push({ minute: min, type: 'fatigue', teamIdx: t, playerName: p.name });
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
    if (injured) s.events.push({ minute: min, type: 'injury', teamIdx: t, playerName: outP.name });
    s.events.push({ minute: min, type: 'sub', teamIdx: t, playerName: inP.name, playerName2: outP.name });
  }

  // ---- movement ----

  /** Who is picking up whom. Everyone not chasing the ball takes the nearest opponent no team-mate has
   *  already claimed, walking the defenders in index order so the assignment is deterministic. Only the
   *  opponents who matter — the ones upfield of their own keeper — get picked up, so a defending side does
   *  not send men to stand next to an opposition centre-half. */
  private assignMarks(defTeam: 0 | 1, pressSet: ReadonlySet<number>): (number | null)[] {
    const s = this.state;
    const atk = (1 - defTeam) as 0 | 1;
    const marks: (number | null)[] = new Array(11).fill(null);
    const taken = new Set<number>();
    const carrier = s.carrier;
    for (let i = 1; i < 11; i++) {
      if (pressSet.has(i) || this.sentOff.has(defTeam * 100 + i)) continue;
      const ds = s.players[defTeam][i];
      let best = -1, bestD = Infinity;
      for (let j = 1; j < 11; j++) {
        if (taken.has(j) || this.sentOff.has(atk * 100 + j)) continue;
        if (carrier && carrier.teamIdx === atk && carrier.playerIdx === j) continue; // the ball-carrier is the pressers' job
        const as = s.players[atk][j];
        const d = Math.hypot(as.x - ds.x, as.y - ds.y);
        if (d < bestD) { bestD = d; best = j; }
      }
      if (best >= 0) { marks[i] = best; taken.add(best); }
    }
    return marks;
  }

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
      const marks = attacking ? null : this.assignMarks(teamIdx, pressSet);
      const goalX = this.goalOf(teamIdx).x;   // the goal THIS team is attacking

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
        const speed = (1.8 + norm(p.attrs.pace) * 3.6) * eff * TICK_SEC;

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
        const pullX = clamp((p.role === 'GK' ? 0.04 : attacking ? 0.22 : 0.34) + (attacking ? dm.come : 0), 0, 0.6);
        const pullY = p.role === 'GK' ? 0.25 : attacking ? 0.30 : 0.46;
        tx += (s.ball.x - tx) * pullX;
        ty += (s.ball.y - ty) * pullY;

        // TRACK YOUR MAN. Scaled by the side's press setting, so a high press genuinely denies the pass and
        // a deep block sits off and concedes it — which is the difference the two settings claim to be.
        const markIdx = marks ? marks[i] : null;
        if (markIdx != null) {
          const op = s.players[(1 - teamIdx) as 0 | 1][markIdx];
          const ownGoalX = this.goalOf((1 - teamIdx) as 0 | 1).x;
          // A DEEP BLOCK MARKS TIGHTER, NOT LOOSER. Scaling the whole thing by press intensity made a low
          // press worse everywhere, which is exactly why Park the Bus and Counter measured as the two worst
          // presets at every quality gap — the "defensive" options were named to attract the player who
          // should never pick them. Choosing a low press is a choice about WHERE you defend, not whether:
          // near your own goal a settled block picks people up harder than a high press does, and it is up
          // the pitch that the low press declines to chase.
          const deep = Math.abs(s.ball.x - ownGoalX) < MARK_DEEP_RANGE;
          const w = clamp(MARK_PULL * (deep ? MARK_DEEP : mods.pressIntensity) * dm.mark, 0, 0.9);
          tx += (op.x + Math.sign(ownGoalX - op.x) * (MARK_GOALSIDE + dm.sweep) - tx) * w;
          ty += (op.y - ty) * w;
        }

        // ── OFF-BALL BOX RUNS ────────────────────────────────────────────────────────────────────
        // THE MISSING MECHANISM. Every off-ball player targeted a tactical anchor pulled toward the ball,
        // and nothing in the engine ever sent anyone INTO the penalty area — measured at 0.02 attackers in
        // the box on average while attacking, i.e. essentially never. With no bodies in the box there is
        // nobody to pass to near goal, so the only way the ball ever got there was the through-ball, whose
        // shot resolves from wherever the receiver happened to be standing: a median of 45.8 metres.
        //
        // That single fact is what makes `quality`'s shooting term clamp to zero on 97% of shots, what
        // makes the shoot-from-range branch fire 0.2% of the time, and what leaves the formation shape
        // edge, the Fan Zone home advantage and every duty shoot multiplier inert. It is upstream of all
        // of them, which is why the rebalance that tried to fix the FINISH first had to be rejected.
        //
        // So: when the ball is in the final third, forwards (and midfielders whose duty pushes them on)
        // break for the box instead of holding their anchor, fanning out across it by player index so they
        // arrive at the near post, the penalty spot and the far post rather than stacking on one square.
        // Pure position maths — it draws no rng, so the match stream is untouched.
        // WIDE PLAYERS DO NOT ATTACK THE BOX — THEY SUPPLY IT. My first pass had every attacker break for
        // the box AND keep his width, which is two jobs at once and does neither: measured, the carrier was
        // in a crossing position 14 ticks a match and 84% of those had nobody within 16m of goal to aim at.
        // Keeping the runs wide (to preserve formation shape) is exactly what pushed the runners out of the
        // area they were running into. The flank and the box are different jobs: a player anchored wide
        // HOLDS the touchline as the crossing outlet, and everyone else attacks the six-yard space.
        const heldWide = Math.abs(a.y - 34) > WIDE_ANCHOR;
        const inFinalThird = Math.abs(s.ball.x - goalX) < BOX_RUN_TRIGGER;
        const runner = attacking && p.role !== 'GK' && p.role !== 'DF' && !heldWide
          && (p.role === 'FW' || dm.push >= BOX_RUN_PUSH)
          && inFinalThird;
        // THE OVERLAP. Supply and box-attack are different jobs and the engine modelled neither, which is
        // what defeated the last two attempts. Letting everyone break for the box put the wide men in it
        // too — 16 crossing positions a match but 72% of them with NOBODY left to aim at. Excluding the
        // wide men from the runs instead left them sitting at their anchor, and crossing positions fell to
        // 3 a match, because a player who never advances is never in a position to deliver.
        //
        // A wide anchor now does the third thing a real wide player does: he goes UP, and he stays OUT. He
        // is the outlet, level with the box and on the touchline, while the central runners attack the six-
        // yard space in front of him.
        const overlap = attacking && heldWide && p.role !== 'GK' && inFinalThird;
        if (overlap) {
          tx = goalX - dir * (OVERLAP_DEPTH + (p.role === 'DF' ? DF_OVERLAP_HOLD : 0));
          ty = a.y;                                   // full width: he is the width, not a second striker
        } else if (runner) {
          // THE RUN KEEPS THE PLAYER'S SIDE. Fanning runners into three fixed central lanes funnelled every
          // attack through the middle and erased the whole point of a wide shape — the formation width
          // assertions inverted on exactly that. A wide player attacks the near or far post from HIS flank;
          // a central one attacks the spot. Width is preserved, just compressed into the box.
          const depth = p.role === 'FW' ? 8 : 15;               // forwards get in behind; midfielders arrive late
          tx = goalX - dir * depth;
          ty = 34 + (a.y - 34) * BOX_RUN_WIDTH;
          // still drawn a little toward the ball, so a wide attack pulls the runs across rather than
          // leaving three men on the spot while the ball is in the corner
          ty += (s.ball.y - ty) * 0.25;
        }

        tx = clamp(tx, 2, 103);
        ty = clamp(ty, 3, 65);
        if (p.role === 'GK') tx = clamp(tx, teamIdx === 0 ? 2 : 89 - dm.gkStep, teamIdx === 0 ? 16 + dm.gkStep : 103);

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
    ps.fitness = Math.max(0, ps.fitness - BASE_DRAIN * mods.staminaDrain * (0.7 + 0.6 * norm(p.attrs.workrate)) * staminaFactor * effort * conditioning);
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
        // DEFENCE COMPRESSES NEAR ITS OWN GOAL. A flat tackle rate across the whole pitch let an attacker
        // who got in behind simply walk to the goal line — measured median shot distance 2.7m, with 98% of
        // shots inside the box, which is as unreal as the 45.8m it replaced. Real defending gets harder to
        // play through the closer you get: bodies, angles and desperation. Ramps from no bonus at 35m to
        // BOX_DEFENCE times as likely on the goal line.
        const ownGoalDist = Math.hypot(cs.x - this.goalOf(defTeam === 0 ? 1 : 0).x, cs.y - PITCH.h / 2);
        const compress = 1 + (BOX_DEFENCE - 1) * clamp(1 - ownGoalDist / 35, 0, 1);
        const pTackle = TACKLE_SCALE * compress * clamp(0.12 + 0.5 * (defEff / (defEff + retain)), 0.05, 0.8) * Math.pow(defMods.pressIntensity, PRESS_EXP)
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
      const shootP = SHOOT_SCALE * (SHOOT_BASE_P + norm(carrier.attrs.shooting) * SHOOT_ABS) * closeness * (0.35 + 0.65 * central) * this.dm[teamIdx][playerIdx].shoot * (1 + this.zonal[teamIdx]) * homeBoost * TICK_SEC;
      if (this.rng() < shootP) {
        this.resolveShot(teamIdx, playerIdx, distGoal, false);
        return;
      }
    }

    // ── CROSSING — the reason width is worth anything ────────────────────────────────────────────────
    // THE ENGINE HAD NO CROSS. Not a weak one: none. The only route to goal was a carrier working himself
    // into the middle and shooting, so every formation attacked the same way and the shape edge (`zonal`)
    // could only ever be a shot-probability multiplier bolted onto that one route — which is exactly what
    // the standing note said had to be re-derived as a chance-CREATION edge instead.
    //
    // Without a cross, a wide shape has no payoff and six of strategy_test's assertions are unwinnable by
    // construction: wide 3-4-3 vs a narrow diamond, wide-playmaker vs central duties in the wide slot, and
    // 3-4-3's central-vs-wide attacking focus all measure a reward the engine does not implement.
    //
    // Now: a wide carrier in the final third whips it in for whoever is attacking the box. The delivery is
    // contested by however many defenders have collapsed in there, and the finish is a header/close-range
    // strike from where the runner actually is. Width creates the chance; bodies in the box convert it.
    const fromCentre = Math.abs(cs.y - PITCH.h / 2);
    if (distGoal < CROSS_RANGE && fromCentre > CROSS_WIDE_Y) {
      const crossP = CROSS_RATE * (0.4 + 0.6 * norm(carrier.attrs.passing) * fit(cs.fitness))
        * (1 + this.zonal[teamIdx]) * (1 + Math.max(0, this.dm[teamIdx][playerIdx].hug) + Math.max(0, this.dm[teamIdx][playerIdx].magnet) * CROSS_CREATOR) * TICK_SEC;   // wide duties deliver more, and a designated creator most of all
      if (this.rng() < crossP) {
        // YOU CROSS TO THE STRIKER, NOT TO WHOEVER HAPPENS TO BE NEAREST. This picked purely by distance,
        // which is why a poacher — "lives for the six-yard box, minimal build-up involvement, maximum
        // finishing instinct" — took FEWER shots than a target man even at twice the shooting weight: a
        // target man's magnet 5 wins him the ball in build-up, and nothing anywhere preferred the poacher
        // once the ball was wide. A duty's `shoot` is the game's own statement of who the finisher is, so
        // it belongs in choosing who the ball is aimed at.
        let target = -1, bestScore = -Infinity;
        for (let i = 1; i < 11; i++) {
          if (i === playerIdx || this.sentOff.has(teamIdx * 100 + i)) continue;
          const ps = s.players[teamIdx][i];
          const d = Math.hypot(goal.x - ps.x, goal.y - ps.y);
          if (d >= BOX_ATTACK_RADIUS) continue;
          const score = -d + this.dm[teamIdx][i].shoot * CROSS_TO_FINISHER;
          if (score > bestScore) { bestScore = score; target = i; }
        }
        const bestD = target >= 0 ? Math.hypot(goal.x - s.players[teamIdx][target].x, goal.y - s.players[teamIdx][target].y) : 0;
        if (target >= 0) {
          // contested by the bodies back defending it — a packed box kills a cross, an open one is a gift
          let defenders = 0;
          for (let i = 0; i < 11; i++) {
            if (this.sentOff.has(defTeam * 100 + i)) continue;
            const ds = s.players[defTeam][i];
            if (Math.hypot(goal.x - ds.x, goal.y - ds.y) < BOX_ATTACK_RADIUS) defenders++;
          }
          // A CREATOR PICKS THE RIGHT BALL, he does not just hit more of them. `magnet` marks a duty as the
          // team's designated out-ball — the man it plays through — so it belongs in delivery QUALITY here,
          // not only in delivery volume (CROSS_CREATOR). The distinction is load-bearing: raising volume to
          // the point where a wide playmaker out-created a box-to-box also broke four other assertions,
          // because more crosses distorts the whole attack. Raising quality only changes what HIS crosses
          // are worth, which is what the duty actually claims — "dictates play from out there, like a
          // winger who thinks like a No.10".
          const delivered = 0.62 + 0.3 * norm(carrier.attrs.passing) - 0.09 * defenders
            + mAdd(carrier.attrs.creativity, 0.05)
            + Math.max(0, this.dm[teamIdx][playerIdx].magnet) * CROSS_VISION;
          if (this.rng() < delivered) {
            s.carrier = { teamIdx, playerIdx: target };
            s.ball = { ...s.players[teamIdx][target] };
            this.lastPass[teamIdx] = { passer: playerIdx, receiver: target, sec: s.clockSec };
            this.flow('pass', teamIdx, s.ball.x, carrier.name, this.teams[teamIdx].players[target].name);
            this.resolveShot(teamIdx, target, bestD, false);
          } else {
            // cleared: the ball is hacked away from the danger area
            s.ball = { x: clamp(goal.x - this.attackDir(teamIdx) * 25, 0, PITCH.w), y: clamp(cs.y + (this.rng() - 0.5) * 20, 0, PITCH.h) };
            this.flow('loose_ball', teamIdx, s.ball.x, carrier.name);
            s.carrier = null;
          }
          return;
        }
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
        const skill = norm(carrier.attrs.passing) * fit(cs.fitness);
        // PLAY-OUT-OF-DEFENCE WAS A TOGGLE THAT DID NOTHING. Its only effect anywhere was to force the
        // keeper's `directness` to -1 when picking a pass target — so the ball went short and then took its
        // chances like any other pass. Measured over 250 paired matches against a high press it was worth
        // +0.072 goals conceded (95% CI [-0.117, 0.261]) and +0.001 possession share: no benefit, no cost,
        // no reason to ever touch it. The instruction's whole premise is that the side has REHEARSED this —
        // the angles, the third-man runs, who drops in — so the drilled bonus belongs on the ball played out
        // of the back, and the risk stays exactly where it was, in the short option under a press.
        const drilled = this.tactics[teamIdx].playOutOfDefence && this.zoneOf(teamIdx, cs.x) === 'def' ? PLAY_OUT_DRILL : 0;
        const completion = clamp(
          PASS_BASE + PASS_ABS * skill - dist * 0.008 - pressure * 0.18 * (1 - drilled) - patientUnderPress - risk
          + mAdd(carrier.attrs.teamwork, 0.07) + (hasTrait(carrier, 'metronome') ? 0.03 : 0), // teamwork/Metronome sharpen link-up
          0.1, 0.96,
        );
        if (this.rng() < completion) {
          // commentary: a completed pass in the mid/final third (skip defensive knock-abouts to reduce noise)
          if (this.zoneOf(teamIdx, recS.x) !== 'def') this.flow('pass', teamIdx, recS.x, carrier.name, rec.name);
          this.lastPass[teamIdx] = { passer: playerIdx, receiver: pick.idx, sec: s.clockSec }; // for assist credit
          s.carrier = { teamIdx, playerIdx: pick.idx };
          s.ball = { ...recS };
          // through-ball that springs a fast forward behind a high line => clear chance
          if (pick.through && this.beatsLastDefender(teamIdx, pick.idx)) {
            s.events.push({ minute: this.minute(), type: 'chance', teamIdx, playerName: rec.name, counter: this.onCounter(teamIdx) });
            // A THROUGH BALL IS NOT A SHOT. This used to resolve a shot the instant the pass landed, from
            // wherever the receiver happened to be standing — a median of 45.8 metres out, past the halfway
            // line. That single line was the game's entire chance-creation model, and it is why `quality`'s
            // shooting term clamped to zero on 97% of shots, why the shoot-from-range branch fired 0.2% of
            // the time, and why the Fan Zone edge and every duty shoot multiplier were inert.
            //
            // Now that possession lasts (see TACKLE_SCALE) and attackers actually run into the box (see the
            // box-run block in movePlayers), the honest model works: springing the last defender leaves the
            // receiver in behind WITH THE BALL, and he carries on and finishes from a real distance like any
            // other attack. The chance is still recorded as a chance; it simply has to be taken.
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

    // dribble toward goal, HOLDING YOUR LANE until it is worth cutting in.
    // This aimed every carrier at the goal's centre spot, which is why the ball was welded to the middle of
    // the pitch: measured, the carrier's median distance from the centre line was 2.6m and its 90th
    // percentile 4.6m, on a pitch 68m wide, while his team-mates were spread out to 24m. The ball was never
    // wide, so a cross could never be attempted, so width could never pay — no amount of tuning the shape
    // edge or the pass weighting could fix that, because the carrier walked to the centre unaided.
    // Now a wide player drives down his own channel and only cuts inside as the byline approaches.
    const laneHold = clamp(distGoal / LANE_HOLD_RANGE, 0, 1);   // 1 far out: keep your channel; 0 at goal: cut in
    const driveY = goal.y + (cs.y - goal.y) * laneHold + (this.rng() - 0.5) * 10;
    const speed = (1.6 + norm(carrier.attrs.pace) * 3.0) * fit(cs.fitness) * TICK_SEC;
    this.stepToward(cs, goal.x, driveY, speed);
    this.drain(cs, carrier, this.mods[teamIdx], 1.2);
    s.ball = { x: cs.x, y: cs.y };
  }

  /** Mean interception ability across a side's outfielders — tackling and positioning, normalised. Reading
   *  a defender's QUALITY is what `pressureOn` cannot do: it counts bodies, so a packed box of poor markers
   *  and a packed box of good ones were the same number. */
  private computeDefSkill(teamIdx: 0 | 1): number {
    const ps = this.teams[teamIdx].players;
    let sum = 0, n = 0;
    for (let i = 1; i < ps.length && i < 11; i++) {
      const a = ps[i].attrs;
      sum += (norm(a.tackling) + norm(a.positioning ?? a.tackling)) / 2;
      n++;
    }
    return n ? sum / n : 0.5;
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
      // PROGRESS IS UP THE PITCH, NOT TOWARD THE GOAL SPOT. This measured gain as the change in STRAIGHT-LINE
      // distance to the centre of the goal, so a square ball to a free winger scored as LOSING ground —
      // roughly -8m for a 24m-wide target — and the `gain > -6` filter below then rejected it outright.
      // Wide passes were therefore not merely unattractive, they were structurally forbidden: measured, the
      // formation anchors put four players 24m off centre and the receiver of a pass was a median of 3.2m
      // off centre. That is the root cause of width being worthless, and it is upstream of the shape edge,
      // the crossing game and every formation-width assertion in strategy_test.
      const gain = (myDistGoal - dGoal) * (1 - UPFIELD_W) + (Math.abs(goal.x - cs.x) - Math.abs(goal.x - ts.x)) * UPFIELD_W;
      const pressure = this.pressureOn(defTeam, ts);
      // ATTACK-FOCUS instruction (unset = neutral): bias the ball toward the widest or the most
      // central available option, on top of everything else — a deliberate lean into (or away from)
      // the shape's natural width, independent of any single duty's magnet.
      const focus = this.tactics[teamIdx].attackFocus;
      const focusBias = focus === 'wide' ? Math.abs(ts.y - 34) * 0.18 : focus === 'central' ? -Math.abs(ts.y - 34) * 0.18 : 0;
      // directness>0 rewards forward gain and tolerates longer passes; <0 rewards safe short options.
      // duty "magnet" makes playmakers/target-men more (and ball-winners less) sought as an out-ball.
      // WHY THE BALL NEVER WENT WIDE. `gain` (metres of progress toward goal) reached ~30 against a
      // pressure penalty of at most ~3, so a congested central option beat a free wide one every single
      // time: measured, wide players were open 26% of the time and the CARRIER was wide 0.0% of the time.
      // A ball that is never wide means crossing can never fire, which means width has no payoff and the
      // formation-shape assertions are unwinnable however the shape edge is tuned. Weighting freedom
      // against progress is what makes a flank an actual option.
      const score = gain * GAIN_W * (0.7 + 0.6 * (directness + 1))
        - dPass * (0.2 - directness * 0.1)
        - pressure * PRESSURE_W
        + this.dm[teamIdx][i].magnet
        // NEAR GOAL YOU LOOK FOR THE FINISHER, not for the man you build through. `magnet` is a single
        // number covering both jobs, and a poacher's is deliberately low — "minimal build-up involvement"
        // — which is right in midfield and exactly wrong in the box. Measured, a target man out-shot a
        // poacher 41.6 to 38.6 in the FORWARDS' OWN shots despite half his shooting weight, purely because
        // magnet 5 against 3 fed him the ball far more often; no shooting multiplier can outrun never
        // receiving it. This adds a second, position-dependent pull toward whoever the duty designates as
        // the finisher, and it fades to nothing outside the final third.
        + this.dm[teamIdx][i].shoot * FINISHER_PULL * Math.max(0, 1 - Math.abs(goal.x - ts.x) / 40)
        + focusBias
        // SWITCH THE PLAY. Nothing in this score ever rewarded using a flank: a wide option is always
        // further from goal, so `gain` docks it, and there was no term on the other side of the ledger.
        // Measured, four players hold ~14.5m off centre all match and the receiver of a pass was a median
        // of 3.2m off centre — the flanks existed as geometry and never as an option. In the final third a
        // free wide man is worth finding, because that is where a cross comes from.
        + (Math.abs(goal.x - cs.x) < WIDTH_ZONE ? Math.max(0, Math.abs(ts.y - 34) - 9) * WIDTH_PULL : 0)
        + this.rng() * 6;
      // a direct side, and especially one on the counter, slips more through-balls in behind;
      // the passer's creativity (and the Creative Maestro trait) unlocks more of them
      const counter = this.onCounter(teamIdx);
      const passer = this.teams[teamIdx].players[playerIdx];
      // SOMEONE STANDING IN THE LANE. A defender could only affect play by tackling or, since the crowd
      // penalty, by being near a shot — nothing modelled the oldest defensive job there is, standing
      // between the ball and where it wants to go. That is why a holding midfielder whose entire idea is
      // "screens the back four" was worth less than a ball-winner who simply pressed harder: his screening
      // had no mechanism. A man near the line from passer to receiver now makes the ball through harder,
      // which is what a screen IS.
      let blockers = 0;
      if (LANE_BLOCK > 0) {
        const vx = ts.x - cs.x, vy = ts.y - cs.y, len2 = vx * vx + vy * vy || 1;
        for (let d = 1; d < 11; d++) {
          if (this.sentOff.has(defTeam * 100 + d)) continue;
          const dp = s.players[defTeam][d];
          const t = clamp(((dp.x - cs.x) * vx + (dp.y - cs.y) * vy) / len2, 0, 1);   // projection onto the lane
          const px = cs.x + vx * t, py = cs.y + vy * t;
          if (Math.hypot(dp.x - px, dp.y - py) < LANE_WIDTH) blockers++;
        }
      }
      const throughP = clamp(0.5 + 0.16 * directness + (counter ? 0.14 : 0)
        + mAdd(passer.attrs.creativity, 0.12) + (hasTrait(passer, 'maestro') ? 0.05 : 0)
        - blockers * LANE_BLOCK, 0.25, 0.9);
      const through = gain > (counter ? 14 : 16) && this.teams[teamIdx].players[i].role === 'FW' && this.rng() < throughP;
      // THE VETO, NOT THE SCORE, IS WHAT CLOSED THE FLANKS. This gate is applied AFTER the score, so it
      // cannot be outvoted: measured, 80% of all wide candidates died here, which is why adding a
      // switch-of-play term to the score moved wide passes only from 4.6% to 8.1% however hard it was
      // pushed. I had fixed the wrong half of this expression — reweighting `gain` helped the score while
      // the absolute veto went on discarding the same options.
      //
      // A switch of play is lateral BY DEFINITION and gains no ground, so an absolute progress requirement
      // forbids it outright. What actually distinguishes a good switch from a bad hospital ball is whether
      // the man is FREE: allow a lateral option to a genuinely unpressured team-mate, and keep the strict
      // requirement for everything else, so an aimless backward ball under pressure is still refused.
      const laneOpen = Math.abs(ts.y - 34) > 10 && pressure < SWITCH_FREEDOM;
      const progresses = gain > (laneOpen ? -SWITCH_TOLERANCE : -6);
      if (progresses && score > bestScore) { bestScore = score; best = { idx: i, through }; }
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
    // THE LAST DEFENDER IS THE DEEPEST ONE, NOT THE NEAREST ONE. This picked whoever was closest to the
    // receiver, which inverts the line-height slider: dropping the line moves the back four AWAY from an
    // advanced forward, so the "nearest defender" becomes a midfielder standing further up the pitch and
    // the receiver counts as in behind him. Measured on the old engine, a DEEP line conceded 42.6 clear
    // chances a match against a neutral line's 30.4 — the deeper you sat, the more often you were played
    // through, which is why every defensive preset was a trap and `line: -2` was the worst single setting
    // in the game. Ranked by depth it is what the method has always claimed to be.
    let last = 1, deepest = Infinity;
    for (let i = 1; i < 11; i++) {
      if (this.sentOff.has(defTeam * 100 + i)) continue;
      const depth = dir === 1 ? -s.players[defTeam][i].x : s.players[defTeam][i].x;
      if (depth < deepest) { deepest = depth; last = i; }
    }
    const def = this.teams[defTeam].players[last];
    const ds = s.players[defTeam][last];
    const behind = dir === 1 ? recS.x > ds.x : recS.x < ds.x; // receiver already past that defender
    const paceGap = norm(rec.attrs.pace) * fit(recS.fitness) - norm(def.attrs.pace) * fit(ds.fitness);
    // OFFSIDE TRAP instruction (off by default, and only meaningful with a high/very-high line): the
    // back line steps up together the instant the ball is played, so a receiver needs a REAL pace
    // edge to spring it clean — a marginal one just gets caught. Bounded to this one decision, so a
    // side without a genuine outlet threat gets far fewer clear breakaways; a side with real pace
    // (e.g. a poacher/pressing-forward with a big gap) still tears the trap open exactly as before.
    const trap = !!this.tactics[defTeam].offsideTrap && this.tactics[defTeam].line >= 1;
    const faster = paceGap > (trap ? 0.12 : 0);
    return behind && faster;
  }

  private resolveShot(teamIdx: 0 | 1, playerIdx: number, distGoal: number, clear: boolean, allowRebound = true) {
    const s = this.state;
    // count EVERY attempt before any logging decision — see MatchState.shotAttempts
    s.shotAttempts[teamIdx]++;
    s.shotAttemptsBy[teamIdx][playerIdx] = (s.shotAttemptsBy[teamIdx][playerIdx] ?? 0) + 1;
    const shooter = this.teams[teamIdx].players[playerIdx];
    const ss = s.players[teamIdx][playerIdx];
    const defTeam = (1 - teamIdx) as 0 | 1;
    const gk = this.teams[defTeam].players[0];
    const gks = s.players[defTeam][0];
    // BODIES IN FRONT OF THE BALL. Shot quality depended only on DISTANCE, so putting more defenders
    // between the shooter and the goal changed nothing — which is why a back five conceded no better than
    // a back four. Measured: a 5-4-1 kept MORE men in its own box than a 4-4-2 (0.41 against 0.36) and
    // still conceded more (1.50 against 1.35), because the extra defender had no way to affect the shot.
    // He does now: a crowded shot is a worse shot, which is the entire point of an extra defender.
    let crowd = 0;
    for (let i = 1; i < 11; i++) {
      if (this.sentOff.has(defTeam * 100 + i)) continue;
      const dp = s.players[defTeam][i];
      if (Math.hypot(dp.x - ss.x, dp.y - ss.y) < CROWD_RADIUS) crowd++;
    }
    // HOW GOOD A CHANCE IS depends on the striker RELATIVE TO THE DEFENDING HE IS UP AGAINST, not on his
    // shooting in the absolute. Left absolute, `quality` fed both the on-target roll (0.5 + quality * 0.45)
    // and the conversion, so a top-flight striker's chances were better in both — while the top-flight
    // defenders and keeper facing him got no equivalent lift, and conversion climbed 4.5% to 8.1% across the
    // pyramid. Anchored at DEF_ANCHOR so an evenly-matched game at the calibration quality is unchanged.
    // Judged against the STANDARD OF THE MATCH — the mean of both defences — not against this particular
    // opponent. Against the opponent alone the adjustment runs in opposite directions for the two sides and
    // so doubles every mismatch: a 15 against an 11 finished 7.80-0.04, a scoreline no football match has.
    // The mean moves both sides together, which is the whole point — it is the LEVEL being played at that
    // decides whether a chance is a good one, and at equal strength the two are identical anyway, so the
    // flattening across the pyramid is unchanged.
    const standard = (this.defSkill[0] + this.defSkill[1]) / 2;
    const shotSkill = norm(shooter.attrs.shooting) * fit(ss.fitness) - SHOT_REL * (standard - DEF_ANCHOR);
    const quality = clamp(shotSkill * (1 - distGoal / QUALITY_RANGE)
      + (clear ? 0.15 : 0) - crowd * CROWD_PENALTY, 0, 1);
    const minute = this.minute();
    const onTarget = this.rng() < 0.5 + quality * 0.45;
    if (!onTarget) {
      // only log clear-cut misses; hopeful long-range efforts don't clutter the feed
      if (quality > 0.32 || clear) {
        // a small deterministic slice of high-quality off-target efforts rattle the woodwork —
        // pure commentary relabel (still no goal, keeper still restarts): consumes NO rng.
        const frame = quality > 0.5 && (((minute * 131 + playerIdx * 17 + teamIdx * 7) >>> 0) % 6 === 0);
        s.events.push({ minute, type: frame ? 'woodwork' : 'shot_missed', teamIdx, playerName: shooter.name });
      }
    } else {
      // composure (+ Clinical Finisher, + a calm well-led side) lifts conversion; The Wall keeper resists it.
      // all centred → a neutral shooter/keeper/team scores exactly as before.
      const finish = mAdd(shooter.attrs.composure, 0.1) + (hasTrait(shooter, 'clinical') ? 0.04 : 0) + this.leadershipBonus[teamIdx];
      const wall = hasTrait(gk, 'wall') ? 0.06 : 0;
      const goalProb = clamp(GP_BASE + quality * GP_Q - norm(gk.attrs.keeping) * fit(gks.fitness) * GK_SCALE + (clear ? 0.12 : 0) + finish - wall, 0.02, 0.9);
      if (this.rng() < goalProb) {
        s.score[teamIdx]++;
        // assist = the player who played the last pass to this scorer, if recent (<=8s) and not himself
        const lp = this.lastPass[teamIdx];
        const assist = lp && lp.receiver === playerIdx && lp.passer !== playerIdx && s.clockSec - lp.sec <= 8
          ? this.teams[teamIdx].players[lp.passer].name : undefined;
        s.events.push({ minute, type: 'goal', teamIdx, playerName: shooter.name, playerName2: assist });
        this.lastPass[teamIdx] = null;
        this.giveKickoff(defTeam);
        return;
      }
      s.events.push({ minute, type: 'shot_saved', teamIdx, playerName: shooter.name });
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
        s.events.push({ minute, type: 'chance', teamIdx, playerName: this.teams[teamIdx].players[poacher].name });
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
    s.events.push({ minute, type: 'corner', teamIdx: atkTeam, playerName: taker.p.name });
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
      s.events.push({ minute, type: 'goal', teamIdx: atkTeam, playerName: header.name, playerName2: assist });
      this.giveKickoff(defTeam);
      return;
    }
    if (r < goalP + 0.10) s.events.push({ minute, type: 'shot_saved', teamIdx: atkTeam, playerName: header.name }); // header on target, kept out
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
    s.events.push({ minute, type: 'foul', teamIdx: defTeam, playerName: fouler.name, zone });

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
      else { this.booked.add(key); s.events.push({ minute, type: 'yellow_card', teamIdx: defTeam, playerName: fouler.name }); }
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
    this.state.events.push({ minute, type: 'red_card', teamIdx, playerName: p.name, zone: kind === 'second-yellow' ? 'mid' : undefined });
    // send him to the touchline, out of the play — every sim loop skips sent-off players, and
    // this keeps his position in-bounds (a legitimate engine invariant checked by the fuzz harness).
    const ps = this.state.players[teamIdx][playerIdx];
    ps.x = teamIdx === 0 ? 1 : PITCH.w - 1; ps.y = 0.5; ps.fitness = 1;
  }

  private takePenalty(atkTeam: 0 | 1, defTeam: 0 | 1, minute: number) {
    const s = this.state;
    const { p: taker } = this.bestSetPiece(atkTeam, 'pen');
    const gk = this.teams[defTeam].players[0], gks = s.players[defTeam][0];
    s.events.push({ minute, type: 'penalty', teamIdx: atkTeam, playerName: taker.name });
    const convP = clamp(0.70 + norm(taker.attrs.setPiece ?? 8) * 0.14 + mAdd(taker.attrs.composure, 0.08) - norm(gk.attrs.keeping) * fit(gks.fitness) * 0.14, 0.5, 0.93);
    if (this.rng() < convP) {
      s.score[atkTeam]++;
      s.events.push({ minute, type: 'goal', teamIdx: atkTeam, playerName: taker.name });
      this.giveKickoff(defTeam);
    } else {
      s.events.push({ minute, type: 'penalty_missed', teamIdx: atkTeam, playerName: taker.name });
      s.carrier = { teamIdx: defTeam, playerIdx: 0 };
      s.ball = { ...gks };
    }
  }

  private takeFreeKick(atkTeam: 0 | 1, defTeam: 0 | 1, at: { x: number; y: number }, minute: number) {
    const s = this.state;
    const { p: taker } = this.bestSetPiece(atkTeam, 'fk');
    const gk = this.teams[defTeam].players[0], gks = s.players[defTeam][0];
    s.events.push({ minute, type: 'free_kick', teamIdx: atkTeam, playerName: taker.name, zone: 'att' });
    const goal = this.goalOf(atkTeam);
    const dist = Math.hypot(goal.x - at.x, goal.y - at.y);
    const quality = clamp(norm(taker.attrs.setPiece ?? 8) * (1 - dist / 34), 0, 1);
    const scoreP = clamp(0.03 + quality * 0.11 - norm(gk.attrs.keeping) * fit(gks.fitness) * 0.08, 0.01, 0.15);
    if (this.rng() < scoreP) {
      s.score[atkTeam]++;
      s.events.push({ minute, type: 'goal', teamIdx: atkTeam, playerName: taker.name });
      this.giveKickoff(defTeam);
      return;
    }
    // off target vs saved — either way the keeper restarts
    s.events.push({ minute, type: this.rng() < 0.5 ? 'shot_saved' : 'shot_missed', teamIdx: atkTeam, playerName: taker.name });
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
