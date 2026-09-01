// THROWAWAY PROBE 2 — life-table of a clear run: where it starts, how long it lives, why it ends.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam, autoPickXI, buildXI } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import { FORMATIONS, type Formation } from '../../shared/src/formations.js';
import type { Team } from '../../shared/src/types.js';

const SHAPES = Object.keys(FORMATIONS) as Formation[];
const N = Number(process.argv[2] ?? 3);
const mk = (f: Formation, seed: number): Team => { const c = generateTeam(`t${seed}`, 'T', 0x445566, 12, seed, f); return buildXI(c, autoPickXI(c, f)); };

interface Acc {
  runs: number; recD: number; recIn: number; liveTicks: number; in30: number; reached: number; in30given: number;
  endShot: number; endPassOk: number; endPassFail: number; endTurnover: number; endOther: number;
  passAttempts: number; passNull: number;      // while flagged+carrier
  carryTicks: number;                          // flagged ticks with no pass attempt roll success
  matches: number;
}
const zero = (): Acc => ({ runs: 0, recD: 0, recIn: 0, liveTicks: 0, in30: 0, reached: 0, in30given: 0, endShot: 0, endPassOk: 0, endPassFail: 0, endTurnover: 0, endOther: 0, passAttempts: 0, passNull: 0, carryTicks: 0, matches: 0 });
const acc: Record<string, Acc> = {}; for (const s of SHAPES) acc[s] = zero();

const E: any = (MatchEngine as any).prototype;
const origAct = E.actCarrier, origPick = E.pickPassTarget, origShot = E.resolveShot;
let shotFired = false;
let cur: Acc[] = [];
let run: any[] = [null, null];
let inFlaggedAct = -1; // teamIdx if the current actCarrier is a flagged carrier
const goalX = (t: number) => (t === 0 ? 105 : 0);
const dist = (t: number, p: any) => Math.hypot(goalX(t) - p.x, 34 - p.y);

E.pickPassTarget = function (this: any, teamIdx: number, playerIdx: number, goal: any) {
  const r = origPick.call(this, teamIdx, playerIdx, goal);
  if (inFlaggedAct === teamIdx) { cur[teamIdx].passAttempts++; if (!r) cur[teamIdx].passNull++; }
  return r;
};

E.resolveShot = function (this: any, ...a: any[]) { shotFired = true; return origShot.apply(this, a); };

E.actCarrier = function (this: any, ...a: any[]) {
  const s = this.state, c = s.carrier;
  let t = -1, i = -1, flagged = false;
  if (c) { t = c.teamIdx; i = c.playerIdx; flagged = this.clearRun[t] === i; }
  shotFired = false;
  if (flagged) {
    inFlaggedAct = t;
    const d = dist(t, s.players[t][i]);
    if (!run[t]) { run[t] = { ticks: 0, in30: 0, reached: false, recD: d }; cur[t].runs++; cur[t].recD += d; if (d < 30) cur[t].recIn++; }
    run[t].ticks++; cur[t].liveTicks++;
    if (d < 30) { run[t].in30++; cur[t].in30++; run[t].reached = true; }
  }
  const r = origAct.apply(this, a);
  inFlaggedAct = -1;
  if (flagged) {
    const stillFlagged = this.clearRun[t] === i && s.carrier && s.carrier.teamIdx === t && s.carrier.playerIdx === i;
    if (!stillFlagged) {
      const R = run[t]; run[t] = null;
      if (R.reached) { cur[t].reached++; cur[t].in30given += R.in30; }
      if (shotFired) cur[t].endShot++;
      else if (!s.carrier) cur[t].endPassFail++;
      else if (s.carrier.teamIdx !== t) cur[t].endTurnover++;
      else if (s.carrier.playerIdx !== i) cur[t].endPassOk++;
      else cur[t].endOther++;
    } else cur[t].carryTicks++;
  }
  return r;
};

let seed = 1;
for (const A of SHAPES) for (const B of SHAPES) {
  if (A === B) continue;
  for (let n = 0; n < N; n++) {
    const s = seed++;
    const e: any = new MatchEngine([mk(A, s * 7 + 1), mk(B, s * 7 + 2)], s, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
    cur = [zero(), zero()]; run = [null, null];
    let g = 0; while (!e.state.finished && g++ < 20000) e.tick();
    const sh = [A, B];
    for (const t of [0, 1] as const) {
      const a = acc[sh[t]], c = cur[t]; a.matches++;
      for (const k of Object.keys(c) as (keyof Acc)[]) if (k !== 'matches') (a as any)[k] += (c as any)[k];
    }
  }
}

const anchorFW = (f: Formation) => Math.max(...FORMATIONS[f].filter((s) => s.role === 'FW').map((s) => s.x));
console.log('shape      anch  runs/m  recD  rec<30%  liveTk/run  P(reach30)  in30|reach  in30/run   end: shot  passOk passFail turnover other   passNull%  ');
const rows = SHAPES.map((f) => ({ f, a: acc[f] })).sort((x, y) => (y.a.in30 / y.a.runs) - (x.a.in30 / x.a.runs));
for (const { f, a } of rows) {
  const ends = a.endShot + a.endPassOk + a.endPassFail + a.endTurnover + a.endOther;
  console.log(
    `${f.padEnd(10)} ${String(anchorFW(f)).padStart(3)} ${(a.runs / a.matches).toFixed(1).padStart(6)} ${(a.recD / a.runs).toFixed(1).padStart(5)} ${(100 * a.recIn / a.runs).toFixed(1).padStart(7)}%` +
    ` ${(a.liveTicks / a.runs).toFixed(2).padStart(10)} ${(100 * a.reached / a.runs).toFixed(1).padStart(10)}% ${(a.in30given / a.reached).toFixed(2).padStart(10)} ${(a.in30 / a.runs).toFixed(2).padStart(8)}` +
    `   ${(100 * a.endShot / ends).toFixed(1).padStart(5)}% ${(100 * a.endPassOk / ends).toFixed(1).padStart(6)}% ${(100 * a.endPassFail / ends).toFixed(1).padStart(7)}% ${(100 * a.endTurnover / ends).toFixed(1).padStart(7)}% ${(100 * a.endOther / ends).toFixed(1).padStart(5)}%` +
    ` ${(100 * a.passNull / a.passAttempts).toFixed(1).padStart(9)}%`,
  );
}
