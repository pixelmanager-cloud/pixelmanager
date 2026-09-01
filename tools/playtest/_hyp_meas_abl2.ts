// THROWAWAY PROBE 3b — same three arms, paired seeds, with sampling-noise correction.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam, autoPickXI, buildXI } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import { FORMATIONS, type Formation } from '../../shared/src/formations.js';
import type { Team } from '../../shared/src/types.js';

const SHAPES = Object.keys(FORMATIONS) as Formation[];
const N = Number(process.argv[2] ?? 15);
const mk = (f: Formation, seed: number): Team => { const c = generateTeam(`t${seed}`, 'T', 0x445566, 12, seed, f); return buildXI(c, autoPickXI(c, f)); };
const E: any = (MatchEngine as any).prototype;
const origAct = E.actCarrier, origPick = E.pickPassTarget;
let ARM: 'A' | 'B' | 'C' = 'A';
E.actCarrier = function (this: any, ...a: any[]) { if (ARM === 'B') { this.clearRun[0] = -1; this.clearRun[1] = -1; } return origAct.apply(this, a); };
E.pickPassTarget = function (this: any, ...a: any[]) { const r = origPick.apply(this, a); if (ARM === 'C' && r && r.through) r.through = false; return r; };

const run = (arm: 'A' | 'B' | 'C') => {
  ARM = arm;
  const sum: Record<string, number> = {}, sq: Record<string, number> = {}, n: Record<string, number> = {}, gf: Record<string, number> = {};
  for (const s of SHAPES) { sum[s] = 0; sq[s] = 0; n[s] = 0; gf[s] = 0; }
  let seed = 1;
  for (const A of SHAPES) for (const B of SHAPES) {
    if (A === B) continue;
    for (let k = 0; k < N; k++) {
      const s = seed++;
      const e: any = new MatchEngine([mk(A, s * 7 + 1), mk(B, s * 7 + 2)], s, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
      let g = 0; while (!e.state.finished && g++ < 20000) e.tick();
      const d = e.state.score[0] - e.state.score[1];
      sum[A] += d; sq[A] += d * d; n[A]++; gf[A] += e.state.score[0];
      sum[B] -= d; sq[B] += d * d; n[B]++; gf[B] += e.state.score[1];
    }
  }
  const gds: Record<string, number> = {}; for (const s of SHAPES) gds[s] = sum[s] / n[s];
  const vals = SHAPES.map((s) => gds[s]);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const varObs = vals.reduce((a, v) => a + (v - mean) ** 2, 0) / (vals.length - 1);
  // per-shape sampling variance of the mean, averaged
  const samp = SHAPES.map((s) => (sq[s] / n[s] - gds[s] ** 2) / n[s]).reduce((a, b) => a + b, 0) / SHAPES.length;
  const gpm = SHAPES.reduce((a, s) => a + gf[s], 0) / SHAPES.reduce((a, s) => a + n[s], 0);
  const sorted = [...vals].sort((a, b) => b - a);
  console.log(`ARM ${arm}: matches/shape=${n[SHAPES[0]]} goals/match(total)=${(gpm * 2).toFixed(3)} range=${(sorted[0] - sorted[sorted.length - 1]).toFixed(3)} SD=${Math.sqrt(varObs).toFixed(4)} SD_true=${Math.sqrt(Math.max(0, varObs - samp)).toFixed(4)} (samplingSD=${Math.sqrt(samp).toFixed(4)}) scaleFreeSD_true=${(Math.sqrt(Math.max(0, varObs - samp)) / (gpm * 2)).toFixed(4)}`);
  console.log('  ' + SHAPES.map((s) => `${s}:${gds[s].toFixed(3)}`).join(' '));
  return gds;
};
const A = run('A'), B = run('B'), C = run('C');
const corr = (x: number[], y: number[]) => { const n = x.length, mx = x.reduce((a, b) => a + b) / n, my = y.reduce((a, b) => a + b) / n;
  return x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0) / Math.sqrt(x.reduce((s, v) => s + (v - mx) ** 2, 0) * y.reduce((s, v) => s + (v - my) ** 2, 0)); };
const a = SHAPES.map((s) => A[s]), b = SHAPES.map((s) => B[s]), c = SHAPES.map((s) => C[s]);
console.log(`corr(A,B)=${corr(a, b).toFixed(3)}  corr(A,C)=${corr(a, c).toFixed(3)}  corr(B,C)=${corr(b, c).toFixed(3)}`);
