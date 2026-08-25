import type { MatchState, Player, PlayerState, Role, Team } from './types.js';
import { PITCH } from './types.js';
import { makeRng } from './rng.js';
import { mirroredAnchor } from './teams.js';
import { DEFAULT_TACTICS, deriveMods, type TacticMods, type Tactics } from './tactics.js';
import { dutyMods, effectiveDuty, type DutyMods } from './duties.js';

export const TICK_SEC = 0.5; // game-seconds per tick
const MATCH_SEC = 90 * 60;
const SHOOT_RANGE = 18; // metres from goal a player will attempt a shot
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

  constructor(public teams: [Team, Team], seed: number, tactics?: [Tactics, Tactics]) {
    this.rng = makeRng(seed);
    this.tactics = tactics ?? [{ ...DEFAULT_TACTICS }, { ...DEFAULT_TACTICS }];
    this.mods = [deriveMods(this.tactics[0]), deriveMods(this.tactics[1])];
    this.dm = [teams[0].players.map((p) => dutyMods(effectiveDuty(p))), teams[1].players.map((p) => dutyMods(effectiveDuty(p)))];
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

    if (s.carrier) s.possession[s.carrier.teamIdx]++;
    this.movePlayers();
    if (s.carrier) this.actCarrier();
    else this.chaseLooseBall();
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

      s.players[teamIdx].forEach((ps, i) => {
        if (s.carrier && s.carrier.teamIdx === teamIdx && s.carrier.playerIdx === i) return; // carrier handled separately
        const p = this.teams[teamIdx].players[i];
        const eff = fit(ps.fitness);
        const speed = (1.8 + norm(p.attrs.pace) * 3.6) * eff * TICK_SEC;

        // pressers/loose-ball chasers run straight at the ball
        if (pressSet.has(i)) {
          this.stepToward(ps, s.ball.x, s.ball.y, speed * 1.1);
          this.drain(ps, p, mods, 1.5);
          return;
        }

        // tactical target = width-scaled anchor, shifted by line height / attacking push, pulled toward ball;
        // the player's duty biases how far they push and how strongly they drift toward the ball.
        const dm = this.dm[teamIdx][i];
        const a = this.baseAnchor(teamIdx, i);
        let tx = a.x;
        let ty = 34 + (a.y - 34) * mods.widthScale;
        if (p.role === 'DF') tx += dir * mods.lineShift;
        if (attacking && p.role !== 'GK') tx += dir * mods.attackPush * PUSH_BY_ROLE[p.role] * dm.push;
        const pullX = clamp((p.role === 'GK' ? 0.04 : attacking ? 0.22 : 0.34) + (attacking ? dm.come : 0), 0, 0.6);
        const pullY = p.role === 'GK' ? 0.25 : attacking ? 0.30 : 0.46;
        tx += (s.ball.x - tx) * pullX;
        ty += (s.ball.y - ty) * pullY;

        tx = clamp(tx, 2, 103);
        ty = clamp(ty, 3, 65);
        if (p.role === 'GK') tx = clamp(tx, teamIdx === 0 ? 2 : 89 - dm.gkStep, teamIdx === 0 ? 16 + dm.gkStep : 103);

        const moved = this.stepToward(ps, tx, ty, speed);
        if (moved > 0.3) this.drain(ps, p, mods, 1);
      });
    }
  }

  private drain(ps: PlayerState, p: Player, mods: TacticMods, effort: number) {
    ps.fitness = Math.max(0, ps.fitness - BASE_DRAIN * mods.staminaDrain * (0.7 + 0.6 * norm(p.attrs.workrate)) * effort);
  }

  private stepToward(ps: PlayerState, tx: number, ty: number, maxStep: number): number {
    const dx = tx - ps.x, dy = ty - ps.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.01) return 0;
    const step = Math.min(maxStep, d);
    ps.x += (dx / d) * step;
    ps.y += (dy / d) * step;
    return step;
  }

  private closestToBall(teamIdx: 0 | 1): number {
    const s = this.state;
    let best = 1, bestD = Infinity; // skip GK for chases
    for (let i = 1; i < 11; i++) {
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
        const defEff = norm(def.attrs.tackling) * fit(ds.fitness) * (0.6 + 0.4 * norm(def.attrs.workrate));
        const retain = (norm(carrier.attrs.strength) * 0.5 + norm(carrier.attrs.pace) * 0.3 + norm(carrier.attrs.passing) * 0.2) * fit(cs.fitness);
        const pTackle = clamp(0.12 + 0.5 * (defEff / (defEff + retain)), 0.05, 0.8) * defMods.pressIntensity
          * (1 + Math.max(0, this.dm[defTeam][i].press) * 0.25) * TICK_SEC;
        if (this.rng() < pTackle) {
          s.carrier = { teamIdx: defTeam, playerIdx: i };
          s.ball = { ...ds };
          return;
        }
      }
    }

    // shoot from range — likelier the closer/more central and the better the shooter,
    // so players rarely waste hopeful long shots (which keeps shot volume realistic)
    if (distGoal < SHOOT_RANGE) {
      const closeness = 1 - distGoal / SHOOT_RANGE; // 0 at the edge of range, 1 at the goal
      const central = 1 - Math.abs(cs.y - PITCH.h / 2) / (PITCH.h / 2); // 1 dead-central, 0 at the touchline
      const shootP = (0.0022 + norm(carrier.attrs.shooting) * 0.004) * closeness * (0.35 + 0.65 * central) * this.dm[teamIdx][playerIdx].shoot * TICK_SEC;
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
          0.58 + 0.38 * norm(carrier.attrs.passing) * fit(cs.fitness) - dist * 0.008 - pressure * 0.18 - patientUnderPress - risk,
          0.1, 0.96,
        );
        if (this.rng() < completion) {
          s.carrier = { teamIdx, playerIdx: pick.idx };
          s.ball = { ...recS };
          // through-ball that springs a fast forward behind a high line => clear chance
          if (pick.through && this.beatsLastDefender(teamIdx, pick.idx)) {
            s.events.push({ minute: this.minute(), type: 'chance', teamIdx, playerName: rec.name });
            this.resolveShot(teamIdx, pick.idx, Math.hypot(goal.x - recS.x, goal.y - recS.y), true);
          }
        } else {
          const dx = s.players[teamIdx][pick.idx].x;
          s.ball = { x: (cs.x + dx) / 2 + (this.rng() - 0.5) * 6, y: (cs.y + recS.y) / 2 + (this.rng() - 0.5) * 6 };
          s.carrier = null;
        }
        return;
      }
    }

    // dribble toward goal
    const speed = (1.6 + norm(carrier.attrs.pace) * 3.0) * fit(cs.fitness) * TICK_SEC;
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
    let best: { idx: number; through: boolean } | null = null;
    let bestScore = -Infinity;
    for (let i = 0; i < 11; i++) {
      if (i === playerIdx) continue;
      const ts = s.players[teamIdx][i];
      const dGoal = Math.hypot(goal.x - ts.x, goal.y - ts.y);
      const dPass = Math.hypot(ts.x - cs.x, ts.y - cs.y);
      if (dPass > 42 || dPass < 3) continue;
      const gain = myDistGoal - dGoal; // positive = progresses toward goal
      const pressure = this.pressureOn(defTeam, ts);
      // directness>0 rewards forward gain and tolerates longer passes; <0 rewards safe short options.
      // duty "magnet" makes playmakers/target-men more (and ball-winners less) sought as an out-ball.
      const score = gain * (0.7 + 0.6 * (mods.directness + 1))
        - dPass * (0.2 - mods.directness * 0.1)
        - pressure * 3
        + this.dm[teamIdx][i].magnet
        + this.rng() * 6;
      const through = gain > 16 && this.teams[teamIdx].players[i].role === 'FW' && this.rng() < 0.5;
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
      const d = Math.hypot(s.players[defTeam][i].x - recS.x, s.players[defTeam][i].y - recS.y);
      if (d < nd) { nd = d; nearest = i; }
    }
    const def = this.teams[defTeam].players[nearest];
    const ds = s.players[defTeam][nearest];
    const behind = dir === 1 ? recS.x > ds.x : recS.x < ds.x; // receiver already past that defender
    const faster = norm(rec.attrs.pace) * fit(recS.fitness) > norm(def.attrs.pace) * fit(ds.fitness);
    return behind && faster;
  }

  private resolveShot(teamIdx: 0 | 1, playerIdx: number, distGoal: number, clear: boolean) {
    const s = this.state;
    const shooter = this.teams[teamIdx].players[playerIdx];
    const ss = s.players[teamIdx][playerIdx];
    const defTeam = (1 - teamIdx) as 0 | 1;
    const gk = this.teams[defTeam].players[0];
    const gks = s.players[defTeam][0];
    const quality = clamp(norm(shooter.attrs.shooting) * fit(ss.fitness) * (1 - distGoal / (SHOOT_RANGE + 8)) + (clear ? 0.15 : 0), 0, 1);
    const minute = this.minute();
    const onTarget = this.rng() < 0.5 + quality * 0.45;
    if (!onTarget) {
      // only log clear-cut misses; hopeful long-range efforts don't clutter the feed
      if (quality > 0.32 || clear) s.events.push({ minute, type: 'shot_missed', teamIdx, playerName: shooter.name });
    } else {
      const goalProb = clamp(0.13 + quality * 0.55 - norm(gk.attrs.keeping) * fit(gks.fitness) * 0.2 + (clear ? 0.12 : 0), 0.03, 0.9);
      if (this.rng() < goalProb) {
        s.score[teamIdx]++;
        s.events.push({ minute, type: 'goal', teamIdx, playerName: shooter.name });
        this.giveKickoff(defTeam);
        return;
      }
      s.events.push({ minute, type: 'shot_saved', teamIdx, playerName: shooter.name });
    }
    s.carrier = { teamIdx: defTeam, playerIdx: 0 };
    s.ball = { ...s.players[defTeam][0] };
  }

  private chaseLooseBall() {
    const s = this.state;
    let best: { teamIdx: 0 | 1; playerIdx: number; d: number } | null = null;
    for (const teamIdx of [0, 1] as const) {
      s.players[teamIdx].forEach((ps, i) => {
        const d = Math.hypot(ps.x - s.ball.x, ps.y - s.ball.y);
        if (!best || d < best.d) best = { teamIdx, playerIdx: i, d };
      });
    }
    if (best && (best as { d: number }).d < 1.2) {
      const b = best as { teamIdx: 0 | 1; playerIdx: number };
      s.carrier = { teamIdx: b.teamIdx, playerIdx: b.playerIdx };
    }
  }
}
