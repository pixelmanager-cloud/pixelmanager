// Decompose evidence (d): is "mean XI overall" a cross-role currency at all?
import { generateClub, autoPickXI, overall } from '../../shared/src/teams.js';
import { FORMATIONS, type Formation } from '../../shared/src/formations.js';
const F = Object.keys(FORMATIONS) as Formation[];
const N = 400;
const rows: Array<{ f: string; nfw: number; xi: number; byRole: Record<string, number> }> = [];
for (const f of F) {
  let tot = 0; const byRole: Record<string, number[]> = { GK: [], DF: [], MF: [], FW: [] };
  for (let s = 0; s < N; s++) {
    const c = generateClub('c', 'C', 1, 12, s * 7919 + 3, true);
    const l = autoPickXI(c, f);
    const xi = l.playerIds.map((id) => c.players.find((p) => p.id === id)!);
    tot += xi.reduce((a, p) => a + overall(p), 0) / 11;
    for (const p of xi) byRole[p.role].push(overall(p));
  }
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  rows.push({ f, nfw: FORMATIONS[f].filter((s) => s.role === 'FW').length, xi: tot / N,
    byRole: { DF: mean(byRole.DF), MF: mean(byRole.MF), FW: mean(byRole.FW) } });
}
rows.sort((a, b) => a.xi - b.xi);
console.log('formation   nFW  meanXIoverall   meanDF  meanMF  meanFW   (rich roster 2GK/7DF/7MF/4FW, autoPickXI, n=' + N + ')');
for (const r of rows) console.log(`  ${r.f.padEnd(10)} ${r.nfw}   ${r.xi.toFixed(3)}        ${r.byRole.DF.toFixed(2)}   ${r.byRole.MF.toFixed(2)}   ${r.byRole.FW.toFixed(2)}`);
