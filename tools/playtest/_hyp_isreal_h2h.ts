// Targeted: 4-1-2-1-2's ten head-to-heads at high N. Claim under test: "wins 6 of its 10 head-to-heads".
import { MatchEngine, generateTeam, autoPickXI, buildXI, DEFAULT_TACTICS, FORMATIONS } from '@fm/shared';
const names = Object.keys(FORMATIONS) as any[];
const D = '4-1-2-1-2';
const N = Number(process.env.FN ?? 60);
const mk = (id: string, sd: number, f: any) => { const t: any = generateTeam(id, id, 0xff0000, 12, sd, f); return buildXI(t, autoPickXI(t, f)); };
const run = (Af: string, Bf: string, i: number) => {
  const e: any = new MatchEngine([mk('a', i * 7 + 1, Af), mk('b', i * 11 + 3, Bf)], i * 31 + 5,
    [{ ...DEFAULT_TACTICS, formation: Af }, { ...DEFAULT_TACTICS, formation: Bf }]);
  let g = 0; while (!e.state.finished && g++ < 40000) e.tick();
  return [e.state.score[0], e.state.score[1]] as [number, number];
};
const mean = (d: number[]) => d.reduce((a, b) => a + b, 0) / d.length;
const ci = (d: number[]) => { const m = mean(d); return 1.96 * Math.sqrt(d.reduce((a, b) => a + (b - m) ** 2, 0) / (d.length - 1)) / Math.sqrt(d.length); };
let W = 0, L = 0, all: number[] = [];
console.log(`4-1-2-1-2 head-to-heads, ${N} home + ${N} away = ${N * 2} matches per opponent`);
for (const o of names) {
  if (o === D) continue;
  const gd: number[] = [], res = { w: 0, d: 0, l: 0 };
  for (let i = 0; i < N; i++) {
    const [a, b] = run(D, o, i); gd.push(a - b); if (a > b) res.w++; else if (a === b) res.d++; else res.l++;
    const [c, d] = run(o, D, i + 5000); gd.push(d - c); if (d > c) res.w++; else if (d === c) res.d++; else res.l++;
  }
  all = all.concat(gd);
  const m = mean(gd); if (m > 0) W++; else L++;
  console.log(`  vs ${String(o).padEnd(10)} GD ${m >= 0 ? '+' : ''}${m.toFixed(3)} +/- ${ci(gd).toFixed(3)}   record ${res.w}W ${res.d}D ${res.l}L   ${m > 0 ? 'WIN' : 'LOSS'}`);
}
console.log(`  => 4-1-2-1-2 wins ${W} of its 10 head-to-heads, loses ${L}.  overall GD ${mean(all) >= 0 ? '+' : ''}${mean(all).toFixed(3)} +/- ${ci(all).toFixed(3)} over ${all.length} matches`);
