// THROWAWAY PROBE 4 — the discriminating experiment. Move the ANCHOR and nothing else.
//   4-4-2H : 4-4-2 with BOTH strikers lifted 62 -> 72 (the hypothesis's "inside the 30m circle" tier)
//   4-5-1L : 4-5-1 with its lone striker dropped 72 -> 62 (the "outside" tier)
// Hypothesis (anchor x sets time-in-SHOOT_RANGE): 4-4-2H should jump to ~13 ticks/chance and top-tier GD;
// 4-5-1L should collapse to ~5 and bottom-tier.
// Rival (the run dies to a legal forward pass, engine.ts:838 `gain > -6`): 4-4-2H keeps a partner within
// 6m so pickPassTarget still finds a target and the flag still resets -> stays low tier.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam, autoPickXI, buildXI } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import { FORMATIONS, type Formation } from '../../shared/src/formations.js';
import type { Team } from '../../shared/src/types.js';

const POOL = Object.keys(FORMATIONS) as Formation[];
const F: any = FORMATIONS;
F['4-4-2H'] = FORMATIONS['4-4-2'].map((s) => (s.role === 'FW' ? { ...s, x: 72 } : { ...s }));
F['4-5-1L'] = FORMATIONS['4-5-1'].map((s) => (s.role === 'FW' ? { ...s, x: 62 } : { ...s }));
F['4-4-2P'] = FORMATIONS['4-5-1'].map((s) => ({ ...s })); // 4-5-1 with ONE midfielder pushed up to 72 as a 2nd FW-anchored MF
{ const a = F['4-4-2P']; const i = a.findIndex((s: any) => s.role === 'MF' && s.x === 38); a[i] = { ...a[i], x: 72, y: 27 }; a[10] = { ...a[10], y: 41 }; }
const TESTS = ['4-4-2', '4-4-2H', '4-5-1', '4-5-1L', '4-4-2P'] as any[];
const N = Number(process.argv[2] ?? 12);

const mk = (f: any, seed: number): Team => { const c = generateTeam(`t${seed}`, 'T', 0x445566, 12, seed, f); return buildXI(c, autoPickXI(c, f)); };

interface Acc { m: number; gf: number; ga: number; runs: number; recD: number; live: number; in30: number; reach: number; in30r: number; shots: number; endShot: number; endPass: number; endTurn: number; passN: number; passA: number; legal: number; legalN: number }
const zero = (): Acc => ({ m: 0, gf: 0, ga: 0, runs: 0, recD: 0, live: 0, in30: 0, reach: 0, in30r: 0, shots: 0, endShot: 0, endPass: 0, endTurn: 0, passN: 0, passA: 0, legal: 0, legalN: 0 });
const acc: Record<string, Acc> = {}; for (const t of TESTS) acc[t] = zero();

const E: any = (MatchEngine as any).prototype;
const origAct = E.actCarrier, origPick = E.pickPassTarget, origShot = E.resolveShot;
let cur: Acc | null = null, side = -1, run: any = null, inFlagged = -1, shotFired = false;
const dist = (t: number, p: any) => Math.hypot((t === 0 ? 105 : 0) - p.x, 34 - p.y);

E.resolveShot = function (this: any, ...a: any[]) { shotFired = true; return origShot.apply(this, a); };
E.pickPassTarget = function (this: any, teamIdx: number, playerIdx: number, goal: any) {
  const r = origPick.call(this, teamIdx, playerIdx, goal);
  if (cur && inFlagged === teamIdx) {
    cur.passA++; if (!r) cur.passN++;
    // how many teammates survive the `gain > -6` + dPass window veto at this instant
    const s = this.state, cs = s.players[teamIdx][playerIdx];
    const my = Math.hypot(goal.x - cs.x, goal.y - cs.y);
    let n = 0;
    for (let i = 0; i < 11; i++) {
      if (i === playerIdx) continue;
      const ts = s.players[teamIdx][i];
      const dP = Math.hypot(ts.x - cs.x, ts.y - cs.y);
      if (dP > 42 || dP < 3) continue;
      if (my - Math.hypot(goal.x - ts.x, goal.y - ts.y) > -6) n++;
    }
    cur.legal += n; cur.legalN++;
  }
  return r;
};
E.actCarrier = function (this: any, ...a: any[]) {
  const s = this.state, c = s.carrier;
  let t = -1, i = -1, flagged = false;
  if (c) { t = c.teamIdx; i = c.playerIdx; flagged = this.clearRun[t] === i; }
  const mine = cur && t === side;
  shotFired = false;
  if (flagged && mine) {
    inFlagged = t;
    const d = dist(t, s.players[t][i]);
    if (!run) { run = { in30: 0, reached: false }; cur!.runs++; cur!.recD += d; }
    cur!.live++; if (d < 30) { cur!.in30++; run.in30++; run.reached = true; }
  }
  const r = origAct.apply(this, a);
  inFlagged = -1;
  if (flagged && mine) {
    if (shotFired) cur!.shots++;
    const still = this.clearRun[t] === i && s.carrier && s.carrier.teamIdx === t && s.carrier.playerIdx === i;
    if (!still) {
      if (run.reached) { cur!.reach++; cur!.in30r += run.in30; }
      run = null;
      if (shotFired) cur!.endShot++;
      else if (s.carrier && s.carrier.teamIdx === t) cur!.endPass++;
      else cur!.endTurn++;
    }
  }
  return r;
};

let seed = 1;
for (const T of TESTS) for (const O of POOL) for (const home of [0, 1]) for (let n = 0; n < N; n++) {
  const sd = seed++;
  const A = home === 0 ? T : O, B = home === 0 ? O : T;
  const e: any = new MatchEngine([mk(A, sd * 7 + 1), mk(B, sd * 7 + 2)], sd, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
  cur = acc[T]; side = home; run = null;
  let g = 0; while (!e.state.finished && g++ < 20000) e.tick();
  cur.m++; cur.gf += e.state.score[home]; cur.ga += e.state.score[1 - home];
  cur = null;
}

console.log('shape        anchFW  matches    GD  runs/m  recD  liveTk/run P(reach30) in30|reach in30/run in30/match clrSh/m  end:shot/pass/turn   legalTargets  passNull%');
for (const T of TESTS) {
  const a = acc[T], anch = Math.max(...F[T].filter((s: any) => s.role === 'FW').map((s: any) => s.x));
  const ends = a.endShot + a.endPass + a.endTurn;
  console.log(
    `${String(T).padEnd(12)} ${String(anch).padStart(4)} ${String(a.m).padStart(8)} ${((a.gf - a.ga) / a.m).toFixed(3).padStart(6)} ${(a.runs / a.m).toFixed(1).padStart(6)} ${(a.recD / a.runs).toFixed(1).padStart(5)}` +
    ` ${(a.live / a.runs).toFixed(2).padStart(10)} ${(100 * a.reach / a.runs).toFixed(1).padStart(9)}% ${(a.in30r / a.reach).toFixed(2).padStart(9)} ${(a.in30 / a.runs).toFixed(2).padStart(7)} ${(a.in30 / a.m).toFixed(1).padStart(9)} ${(a.shots / a.m).toFixed(2).padStart(7)}` +
    `  ${(100 * a.endShot / ends).toFixed(0)}%/${(100 * a.endPass / ends).toFixed(0)}%/${(100 * a.endTurn / ends).toFixed(0)}%` +
    ` ${(a.legal / a.legalN).toFixed(2).padStart(12)} ${(100 * a.passN / a.passA).toFixed(1).padStart(9)}%`,
  );
}
