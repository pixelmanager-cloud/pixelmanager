// THROWAWAY PROBE 3 — three-arm ablation on identical seeds.
//   A baseline
//   B CLEAN x12 removal: clearRun zeroed at the top of every actCarrier, so `onClearRun` is always false.
//     Nothing else moves: the through-ball still fires, `risk = 0.14` still applies, the 'chance' event
//     still fires, beatsLastDefender is untouched.
//   C the hypothesis's ablation: pickPassTarget forced to through=false (also deletes the 0.14 risk term,
//     the chance event and the whole through-ball concept).
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam, autoPickXI, buildXI } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import { FORMATIONS, type Formation } from '../../shared/src/formations.js';
import type { Team } from '../../shared/src/types.js';

const SHAPES = Object.keys(FORMATIONS) as Formation[];
const N = Number(process.argv[2] ?? 4);
const mk = (f: Formation, seed: number): Team => { const c = generateTeam(`t${seed}`, 'T', 0x445566, 12, seed, f); return buildXI(c, autoPickXI(c, f)); };

const E: any = (MatchEngine as any).prototype;
const origAct = E.actCarrier, origPick = E.pickPassTarget;
let ARM: 'A' | 'B' | 'C' = 'A';
let zeroed = 0, forced = 0;

E.actCarrier = function (this: any, ...a: any[]) {
  if (ARM === 'B') { if (this.clearRun[0] >= 0 || this.clearRun[1] >= 0) zeroed++; this.clearRun[0] = -1; this.clearRun[1] = -1; }
  return origAct.apply(this, a);
};
E.pickPassTarget = function (this: any, ...a: any[]) {
  const r = origPick.apply(this, a);
  if (ARM === 'C' && r && r.through) { forced++; r.through = false; }
  return r;
};

const run = (arm: 'A' | 'B' | 'C') => {
  ARM = arm;
  const gf: Record<string, number> = {}, ga: Record<string, number> = {}, mc: Record<string, number> = {};
  for (const s of SHAPES) { gf[s] = 0; ga[s] = 0; mc[s] = 0; }
  let seed = 1;
  for (const A of SHAPES) for (const B of SHAPES) {
    if (A === B) continue;
    for (let n = 0; n < N; n++) {
      const s = seed++;
      const e: any = new MatchEngine([mk(A, s * 7 + 1), mk(B, s * 7 + 2)], s, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
      let g = 0; while (!e.state.finished && g++ < 20000) e.tick();
      gf[A] += e.state.score[0]; ga[A] += e.state.score[1]; mc[A]++;
      gf[B] += e.state.score[1]; ga[B] += e.state.score[0]; mc[B]++;
    }
  }
  const rows = SHAPES.map((f) => ({ f, gd: (gf[f] - ga[f]) / mc[f], g: gf[f] / mc[f] })).sort((x, y) => y.gd - x.gd);
  const gpm = SHAPES.reduce((s, f) => s + gf[f], 0) / SHAPES.reduce((s, f) => s + mc[f], 0);
  const spread = rows[0].gd - rows[rows.length - 1].gd;
  console.log(`\n── ARM ${arm} ──  matches=${SHAPES.reduce((s, f) => s + mc[f], 0) / 2}  goals/match=${gpm.toFixed(3)}  spread=${spread.toFixed(3)}  scale-free=${(spread / gpm).toFixed(3)}  [zeroed=${zeroed} forced=${forced}]`);
  console.log(rows.map((r) => `${r.f}:${r.gd.toFixed(3)}`).join('  '));
  return rows;
};

const A = run('A'), B = run('B'), C = run('C');
console.log('\nrank shift (baseline -> B clean-x12-off -> C through-off)');
for (const r of A) {
  const b = B.findIndex((x) => x.f === r.f) + 1, c = C.findIndex((x) => x.f === r.f) + 1;
  console.log(`${r.f.padEnd(10)} #${(A.findIndex((x) => x.f === r.f) + 1).toString().padStart(2)} ${r.gd.toFixed(3).padStart(7)}   -> #${b.toString().padStart(2)} ${B[b - 1].gd.toFixed(3).padStart(7)}   -> #${c.toString().padStart(2)} ${C[c - 1].gd.toFixed(3).padStart(7)}`);
}
