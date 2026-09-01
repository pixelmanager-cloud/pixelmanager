// THROWAWAY PROBE — measurement-lens audit of the CLEAR_RUN_APPETITE claim. Delete when done.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam, autoPickXI, buildXI } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import { FORMATIONS, type Formation } from '../../shared/src/formations.js';
import type { Team } from '../../shared/src/types.js';

const SHAPES = Object.keys(FORMATIONS) as Formation[];
const N = Number(process.argv[2] ?? 6); // matches per ordered pair

const mk = (f: Formation, seed: number): Team => {
  const c = generateTeam(`t${seed}`, 'T', 0x445566, 12, seed, f);
  return buildXI(c, autoPickXI(c, f));
};

interface Acc {
  matches: number; gf: number; ga: number;
  chances: number;                 // 'chance' events (== clearRun flag sets)
  recDist: number; recIn30: number; // where the flagged FW actually IS when flagged
  liveTicks: number; liveIn30: number;   // flagged AND he is the carrier (x12 can fire)
  naiveTicks: number; naiveIn30: number; // flagged, carrier or not (what a naive per-tick read counts)
  staleIn30: number;               // flagged, NOT the carrier (phantom: x12 cannot fire)
  plainTicksIn30: number;          // carrier in range, NOT flagged
  clearShots: number; plainShots: number; clearGoals: number;
  flagFW: number; flagNonFW: number;
}
const zero = (): Acc => ({ matches: 0, gf: 0, ga: 0, chances: 0, recDist: 0, recIn30: 0, liveTicks: 0, liveIn30: 0,
  naiveTicks: 0, naiveIn30: 0, staleIn30: 0, plainTicksIn30: 0, clearShots: 0, plainShots: 0, clearGoals: 0, flagFW: 0, flagNonFW: 0 });
const acc: Record<string, Acc> = {}; for (const s of SHAPES) acc[s] = zero();

// ── instrumentation ───────────────────────────────────────────────────────────────────────────────
const E: any = (MatchEngine as any).prototype;
const origAct = E.actCarrier, origTick = E.tick, origShot = E.resolveShot;
let patchedActHits = 0, patchedShotHits = 0, patchedTickHits = 0;

// per-engine scratch, set by the runner
let cur: Acc[] = [];               // index by teamIdx
let curShape: string[] = [];
let inActFlagged = false, inActInRange = false, inAct = false;

const goalX = (t: number) => (t === 0 ? 105 : 0);
const distTo = (t: number, p: { x: number; y: number }) => Math.hypot(goalX(t) - p.x, 34 - p.y);

E.actCarrier = function (this: any, ...a: any[]) {
  patchedActHits++;
  const c = this.state.carrier;
  if (c) {
    const t = c.teamIdx as 0 | 1, i = c.playerIdx as number;
    const d = distTo(t, this.state.players[t][i]);
    inAct = true;
    inActFlagged = this.clearRun[t] === i;
    inActInRange = d < 30;
    if (inActFlagged) { cur[t].liveTicks++; if (inActInRange) cur[t].liveIn30++; }
    else if (inActInRange) cur[t].plainTicksIn30++;
  }
  const r = origAct.apply(this, a);
  inAct = false; inActFlagged = false; inActInRange = false;
  return r;
};

E.resolveShot = function (this: any, teamIdx: 0 | 1, playerIdx: number, distGoal: number, clear: boolean, ...rest: any[]) {
  patchedShotHits++;
  const before = this.state.score ? [...this.state.score] : null;
  const flagged = inAct && inActFlagged;
  if (inAct) { if (flagged) cur[teamIdx].clearShots++; else cur[teamIdx].plainShots++; }
  const r = origShot.call(this, teamIdx, playerIdx, distGoal, clear, ...rest);
  if (flagged && before && this.state.score[teamIdx] > before[teamIdx]) cur[teamIdx].clearGoals++;
  return r;
};

E.tick = function (this: any, ...a: any[]) {
  const prev: [number, number] = [this.clearRun[0], this.clearRun[1]];
  const r = origTick.apply(this, a);
  patchedTickHits++;
  for (const t of [0, 1] as const) {
    const idx = this.clearRun[t];
    if (idx < 0) continue;
    const ps = this.state.players[t][idx];
    const d = distTo(t, ps);
    cur[t].naiveTicks++; if (d < 30) cur[t].naiveIn30++;
    const isCarrier = this.state.carrier && this.state.carrier.teamIdx === t && this.state.carrier.playerIdx === idx;
    if (!isCarrier && d < 30) cur[t].staleIn30++;
    if (prev[t] !== idx) { // freshly flagged this tick
      cur[t].recDist += d; if (d < 30) cur[t].recIn30++;
      if (this.teams[t].players[idx].role === 'FW') cur[t].flagFW++; else cur[t].flagNonFW++;
    }
  }
  return r;
};

// ── run ordered round-robin ───────────────────────────────────────────────────────────────────────
let seed = 1;
for (const A of SHAPES) for (const B of SHAPES) {
  if (A === B) continue;
  for (let n = 0; n < N; n++) {
    const s = seed++;
    const e: any = new MatchEngine([mk(A, s * 7 + 1), mk(B, s * 7 + 2)], s, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
    cur = [zero(), zero()]; curShape = [A, B];
    let guard = 0;
    while (!e.state.finished && guard++ < 20000) e.tick();
    for (const t of [0, 1] as const) {
      const a = acc[curShape[t]], c = cur[t];
      a.matches++; a.gf += e.state.score[t]; a.ga += e.state.score[1 - t];
      a.chances += e.state.events.filter((ev: any) => ev.type === 'chance' && ev.teamIdx === t).length;
      for (const k of ['recDist','recIn30','liveTicks','liveIn30','naiveTicks','naiveIn30','staleIn30','plainTicksIn30','clearShots','plainShots','clearGoals','flagFW','flagNonFW'] as const) (a as any)[k] += (c as any)[k];
    }
  }
}

// ── report ────────────────────────────────────────────────────────────────────────────────────────
const anchorMaxFW = (f: Formation) => Math.max(...FORMATIONS[f].filter((s) => s.role === 'FW').map((s) => s.x));
const rows = SHAPES.map((f) => {
  const a = acc[f], m = a.matches;
  return {
    f, anch: anchorMaxFW(f), gd: (a.gf - a.ga) / m,
    ch: a.chances / m, recD: a.recDist / (a.flagFW + a.flagNonFW), recIn30pc: 100 * a.recIn30 / (a.flagFW + a.flagNonFW),
    liveIn30: a.liveIn30 / m, naiveIn30: a.naiveIn30 / m, staleIn30: a.staleIn30 / m,
    tpcLive: a.liveIn30 / a.chances, tpcNaive: a.naiveIn30 / a.chances,
    csh: a.clearShots / m, psh: a.plainShots / m, cg: a.clearGoals / m, g: a.gf / m,
    rateClear: a.clearShots / a.liveIn30, rateNaive: a.clearShots / a.naiveIn30, ratePlain: a.plainShots / a.plainTicksIn30,
    nonFW: a.flagNonFW,
  };
}).sort((x, y) => y.gd - x.gd);

console.log(`N/pair=${N}  matches=${rows.reduce((s, r) => s + acc[r.f].matches, 0) / 2}  patchHits act=${patchedActHits} shot=${patchedShotHits} tick=${patchedTickHits}`);
console.log('shape      anchFW    GD  chan  recD  rec<30%  liveIn30 naiveIn30 staleIn30  t/ch(live) t/ch(naive)  clrSh plnSh clrGoal goals   pClear  pNaive  pPlain  ratio(C/P)  nonFWflag');
for (const r of rows) {
  console.log(
    `${r.f.padEnd(10)} ${String(r.anch).padStart(4)} ${r.gd.toFixed(3).padStart(6)} ${r.ch.toFixed(1).padStart(5)} ${r.recD.toFixed(1).padStart(5)} ${r.recIn30pc.toFixed(1).padStart(7)}%` +
    ` ${r.liveIn30.toFixed(1).padStart(9)} ${r.naiveIn30.toFixed(1).padStart(9)} ${r.staleIn30.toFixed(1).padStart(9)}` +
    ` ${r.tpcLive.toFixed(2).padStart(10)} ${r.tpcNaive.toFixed(2).padStart(11)}` +
    ` ${r.csh.toFixed(2).padStart(6)} ${r.psh.toFixed(2).padStart(5)} ${r.cg.toFixed(2).padStart(7)} ${r.g.toFixed(2).padStart(5)}` +
    ` ${r.rateClear.toFixed(4).padStart(8)} ${r.rateNaive.toFixed(4).padStart(7)} ${r.ratePlain.toFixed(4).padStart(7)} ${(r.rateClear / r.ratePlain).toFixed(1).padStart(11)} ${String(r.nonFW).padStart(9)}`,
  );
}
const gds = rows.map((r) => r.gd);
console.log(`spread = ${(Math.max(...gds) - Math.min(...gds)).toFixed(3)}`);
// correlations
const corr = (xs: number[], ys: number[]) => {
  const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  const cov = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const sx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0)), sy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0));
  return cov / (sx * sy);
};
console.log(`corr(GD, liveIn30)=${corr(gds, rows.map(r => r.liveIn30)).toFixed(3)}  corr(GD, naiveIn30)=${corr(gds, rows.map(r => r.naiveIn30)).toFixed(3)}  corr(GD, chances)=${corr(gds, rows.map(r => r.ch)).toFixed(3)}  corr(GD, clrSh)=${corr(gds, rows.map(r => r.csh)).toFixed(3)}  corr(GD, anchor)=${corr(gds, rows.map(r => r.anch)).toFixed(3)}  corr(GD, plnSh)=${corr(gds, rows.map(r => r.psh)).toFixed(3)}`);
