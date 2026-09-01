// MEASUREMENT LENS probe 5 (no matches) — the engine's EXPLICIT hard-coded shape term, computeZonal()
// (engine.ts:210-219), is a pure function of the anchors. Compute it for every shape and see how much of
// the published ranking it already predicts on its own.
import { FORMATIONS } from '@fm/shared';
const names = Object.keys(FORMATIONS) as any[];
const shape = (f: any) => {
  const outs = FORMATIONS[f].slice(1);
  const width = outs.reduce((s, p) => s + Math.abs(p.y - 34), 0) / outs.length;
  const central = FORMATIONS[f].filter((p) => p.role === 'MF' && Math.abs(p.y - 34) < 13).length;
  return { width, central };
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const edge = (a: any, b: any) => clamp(0.013 * (a.width - b.width) + 0.05 * (a.central - b.central), -0.18, 0.18);
const sh: Record<string, any> = {}; for (const f of names) sh[f] = shape(f);
const GT: Record<string, number> = { '5-4-1': 0.562, '4-1-4-1': 0.465, '4-5-1': 0.334, '3-4-3': 0.146, '4-3-3': -0.007, '5-3-2': -0.033, '4-2-3-1': -0.070, '3-5-2': -0.217, '4-1-2-1-2': -0.347, '4-4-2': -0.364, '4-2-2-2': -0.468 };
const rows = names.map((f) => {
  const z = names.filter((g) => g !== f).reduce((s, g) => s + edge(sh[f], sh[g]), 0) / (names.length - 1);
  const fwd = FORMATIONS[f].filter((p) => p.role === 'FW').length;
  return { f, w: sh[f].width, c: sh[f].central, z, fwd, gt: GT[f] };
}).sort((a, b) => b.gt - a.gt);
console.log('shape  meanWidth centralMF  zonal-vs-field   #FW   published GD');
for (const r of rows) console.log(`  ${r.f.padEnd(10)} ${r.w.toFixed(2)}      ${r.c}        ${(r.z >= 0 ? '+' : '') + r.z.toFixed(4)}        ${r.fwd}    ${(r.gt >= 0 ? '+' : '') + r.gt.toFixed(3)}`);
const corr = (a: number[], b: number[]) => { const m = (x: number[]) => x.reduce((s, y) => s + y, 0) / x.length; const ma = m(a), mb = m(b); let n = 0, da = 0, db = 0; for (let i = 0; i < a.length; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return n / Math.sqrt(da * db); };
console.log(`\n  Pearson r(zonal, published GD)   = ${corr(rows.map(r => r.z), rows.map(r => r.gt)).toFixed(3)}  (R2 ${(corr(rows.map(r => r.z), rows.map(r => r.gt)) ** 2).toFixed(3)})`);
console.log(`  Pearson r(#forwards, publ. GD)   = ${corr(rows.map(r => r.fwd), rows.map(r => r.gt)).toFixed(3)}`);
console.log(`  Pearson r(centralMF, publ. GD)   = ${corr(rows.map(r => r.c), rows.map(r => r.gt)).toFixed(3)}`);
console.log(`  Pearson r(meanWidth, publ. GD)   = ${corr(rows.map(r => r.w), rows.map(r => r.gt)).toFixed(3)}`);
// kickoff-taker slot: giveKickoff() hands the ball to index 6 in EVERY shape
console.log('\n  giveKickoff() always gives the ball to slot 6. That slot is:');
for (const r of rows) { const s6 = FORMATIONS[r.f][6]; console.log(`    ${r.f.padEnd(10)} ${s6.role} at x=${s6.x} y=${s6.y}  (|y-34| = ${Math.abs(s6.y - 34)})`); }
console.log(`  Pearson r(|slot6.y-34|, publ. GD) = ${corr(rows.map(r => Math.abs(FORMATIONS[r.f][6].y - 34)), rows.map(r => r.gt)).toFixed(3)}`);
