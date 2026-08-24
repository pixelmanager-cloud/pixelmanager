import type { MatchState, PlayerState, Team } from './types.js';
import { PITCH } from './types.js';
import { makeRng } from './rng.js';
import { mirroredAnchor } from './teams.js';

export const TICK_SEC = 0.5;          // game-seconds advanced per tick
const MATCH_SEC = 90 * 60;
const SHOOT_RANGE = 24;               // metres from goal a player will attempt a shot
const TACKLE_RANGE = 1.6;

interface Goal { x: number; y: number }

export class MatchEngine {
  readonly state: MatchState;
  private rng: () => number;
  private halftimeDone = false;

  constructor(public teams: [Team, Team], seed: number) {
    this.rng = makeRng(seed);
    this.state = {
      clockSec: 0,
      score: [0, 0],
      ball: { x: PITCH.w / 2, y: PITCH.h / 2 },
      carrier: null,
      players: [this.initPositions(0), this.initPositions(1)],
      events: [{ minute: 0, type: 'kickoff', teamIdx: 0 }],
      finished: false,
    };
    this.giveKickoff(0);
  }

  private initPositions(teamIdx: 0 | 1): PlayerState[] {
    return this.teams[teamIdx].players.map((p) => {
      const a = teamIdx === 0 ? p.anchor : mirroredAnchor(p.anchor);
      return { x: a.x, y: a.y };
    });
  }

  private anchor(teamIdx: 0 | 1, playerIdx: number) {
    const a = this.teams[teamIdx].players[playerIdx].anchor;
    return teamIdx === 0 ? a : mirroredAnchor(a);
  }

  private goalOf(attackingTeam: 0 | 1): Goal {
    return { x: attackingTeam === 0 ? PITCH.w : 0, y: PITCH.h / 2 };
  }

  private minute(): number {
    return Math.min(90, Math.floor(this.state.clockSec / 60));
  }

  private giveKickoff(teamIdx: 0 | 1) {
    const s = this.state;
    s.players = [this.initPositions(0), this.initPositions(1)];
    s.ball = { x: PITCH.w / 2, y: PITCH.h / 2 };
    // give the ball to a central midfielder (index 6)
    s.players[teamIdx][6] = { x: PITCH.w / 2, y: PITCH.h / 2 };
    s.carrier = { teamIdx, playerIdx: 6 };
  }

  /** Advance the match by one tick. Safe to call after finish (no-op). */
  tick(): void {
    const s = this.state;
    if (s.finished) return;

    s.clockSec += TICK_SEC;
    if (!this.halftimeDone && s.clockSec >= MATCH_SEC / 2) {
      this.halftimeDone = true;
      s.events.push({ minute: 45, type: 'halftime', teamIdx: 0 });
      this.giveKickoff(1);
    }
    if (s.clockSec >= MATCH_SEC) {
      s.finished = true;
      s.events.push({ minute: 90, type: 'fulltime', teamIdx: 0 });
      return;
    }

    this.movePlayers();
    if (s.carrier) this.actCarrier();
    else this.chaseLooseBall();
  }

  // ---- movement ----

  private movePlayers() {
    const s = this.state;
    for (const teamIdx of [0, 1] as const) {
      const attacking = s.carrier?.teamIdx === teamIdx;
      // nearest outfielder presses the ball directly: chases a loose ball, or closes down the opposing carrier
      const chaserIdx = s.carrier?.teamIdx === teamIdx ? -1 : this.closestToBall(teamIdx);
      s.players[teamIdx].forEach((ps, i) => {
        if (s.carrier && s.carrier.teamIdx === teamIdx && s.carrier.playerIdx === i) return; // carrier moves in actCarrier
        if (i === chaserIdx) {
          const p = this.teams[teamIdx].players[i];
          this.stepToward(ps, s.ball.x, s.ball.y, (3 + (p.attrs.pace / 99) * 3.5) * TICK_SEC);
          return;
        }
        const p = this.teams[teamIdx].players[i];
        const a = this.anchor(teamIdx, i);
        // target = anchor shifted toward the ball; attackers push forward, defenders sit
        const pull = p.role === 'GK' ? 0.05 : attacking ? 0.35 : 0.45;
        const push = p.role === 'GK' ? 0 : attacking ? (teamIdx === 0 ? 12 : -12) : 0;
        let tx = a.x + (s.ball.x - a.x) * pull + push;
        let ty = a.y + (s.ball.y - a.y) * pull;
        tx = Math.max(1, Math.min(PITCH.w - 1, tx));
        ty = Math.max(1, Math.min(PITCH.h - 1, ty));
        const speed = (2.5 + (p.attrs.pace / 99) * 3.5) * TICK_SEC; // m per tick
        this.stepToward(ps, tx, ty, speed);
      });
    }
  }

  private closestToBall(teamIdx: 0 | 1): number {
    const s = this.state;
    let best = 1, bestD = Infinity; // skip GK (index 0) for loose-ball chases
    for (let i = 1; i < 11; i++) {
      const d = Math.hypot(s.players[teamIdx][i].x - s.ball.x, s.players[teamIdx][i].y - s.ball.y);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  private stepToward(ps: PlayerState, tx: number, ty: number, maxStep: number) {
    const dx = tx - ps.x, dy = ty - ps.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.01) return;
    const step = Math.min(maxStep, d);
    ps.x += (dx / d) * step;
    ps.y += (dy / d) * step;
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

    // defenders attempt tackles
    for (let i = 1; i < 11; i++) {
      const ds = s.players[defTeam][i];
      if (Math.hypot(ds.x - cs.x, ds.y - cs.y) < TACKLE_RANGE) {
        const def = this.teams[defTeam].players[i];
        const pTackle = 0.22 + 0.4 * (def.attrs.defend / (def.attrs.defend + carrier.attrs.pass));
        if (this.rng() < pTackle * TICK_SEC) {
          s.carrier = { teamIdx: defTeam, playerIdx: i };
          return;
        }
      }
    }

    // shoot?
    if (distGoal < SHOOT_RANGE && this.rng() < (0.02 + (carrier.attrs.shoot / 99) * 0.035) * TICK_SEC) {
      this.resolveShot(teamIdx, playerIdx, distGoal);
      return;
    }

    // pass? prefer a teammate closer to goal and unmarked
    if (this.rng() < 0.9 * TICK_SEC) {
      const target = this.pickPassTarget(teamIdx, playerIdx, goal);
      if (target !== null) {
        const rec = this.teams[teamIdx].players[target];
        const pComplete = 0.6 + 0.35 * (carrier.attrs.pass / 99);
        if (this.rng() < pComplete) {
          s.carrier = { teamIdx, playerIdx: target };
          s.ball = { ...s.players[teamIdx][target] };
        } else {
          // interception: loose ball midway to the receiver
          const recS = s.players[teamIdx][target];
          s.ball = { x: (cs.x + recS.x) / 2 + (this.rng() - 0.5) * 6, y: (cs.y + recS.y) / 2 + (this.rng() - 0.5) * 6 };
          s.carrier = null;
        }
        void rec;
        return;
      }
    }

    // dribble toward goal
    const speed = (2.2 + (carrier.attrs.pace / 99) * 3.2) * TICK_SEC;
    this.stepToward(cs, goal.x, goal.y + (this.rng() - 0.5) * 10, speed);
    s.ball = { x: cs.x, y: cs.y };
  }

  private pickPassTarget(teamIdx: 0 | 1, playerIdx: number, goal: Goal): number | null {
    const s = this.state;
    let best: number | null = null;
    let bestScore = -Infinity;
    const cs = s.players[teamIdx][playerIdx];
    const myDistGoal = Math.hypot(goal.x - cs.x, goal.y - cs.y);
    for (let i = 0; i < 11; i++) {
      if (i === playerIdx) continue;
      const ts = s.players[teamIdx][i];
      const dGoal = Math.hypot(goal.x - ts.x, goal.y - ts.y);
      const dPass = Math.hypot(ts.x - cs.x, ts.y - cs.y);
      if (dPass > 35 || dPass < 3) continue;
      const gain = myDistGoal - dGoal;
      const score = gain - dPass * 0.15 + this.rng() * 8;
      if (gain > -5 && score > bestScore) { bestScore = score; best = i; }
    }
    return best;
  }

  private resolveShot(teamIdx: 0 | 1, playerIdx: number, distGoal: number) {
    const s = this.state;
    const shooter = this.teams[teamIdx].players[playerIdx];
    const defTeam = (1 - teamIdx) as 0 | 1;
    const gk = this.teams[defTeam].players[0];
    const quality = (shooter.attrs.shoot / 99) * (1 - distGoal / (SHOOT_RANGE + 6));
    const onTarget = this.rng() < 0.45 + quality * 0.5;
    const minute = this.minute();
    if (!onTarget) {
      s.events.push({ minute, type: 'shot_missed', teamIdx, playerName: shooter.name });
    } else if (this.rng() < Math.max(0.05, 0.22 + quality * 0.48 - (gk.attrs.keeping / 99) * 0.28)) {
      s.score[teamIdx]++;
      s.events.push({ minute, type: 'goal', teamIdx, playerName: shooter.name });
      this.giveKickoff(defTeam);
      return;
    } else {
      s.events.push({ minute, type: 'shot_saved', teamIdx, playerName: shooter.name });
    }
    // ball goes to the defending keeper after a miss/save
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
