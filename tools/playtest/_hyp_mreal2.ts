// MEASUREMENT LENS probe 2 — is "mean XI overall" a valid ruler for "same squad quality"?
// overall() uses a DIFFERENT stat set per role, and rollAttrs biases exactly those stats. So the number
// is not comparable across roles and a shape that fields more forwards scores higher for free.
import { generateClub, autoPickXI, overall, FORMATIONS } from '@fm/shared';
import type { Player } from '@fm/shared';

const names = Object.keys(FORMATIONS) as any[];
const CLUBS = 800;
const clubs = Array.from({ length: CLUBS }, (_, i) => generateClub(`c${i}`, 'C', 0, 12, i * 7919 + 11, true));

// 1) population mean of overall() per role, on the SAME quality centre, from the production path
const pop: Record<string, number[]> = { GK: [], DF: [], MF: [], FW: [] };
for (const c of clubs) for (const p of c.players) pop[p.role].push(overall(p));
const pm: Record<string, number> = {};
for (const r of ['GK', 'DF', 'MF', 'FW']) { const a = pop[r]; pm[r] = a.reduce((x, y) => x + y, 0) / a.length; }
console.log('population overall() by role (generateClub rich=true, quality 12):');
for (const r of ['GK', 'DF', 'MF', 'FW']) console.log(`   ${r} ${pm[r].toFixed(4)}  n=${pop[r].length}`);
console.log(`   FW minus DF = ${(pm.FW - pm.DF).toFixed(4)}   FW minus MF = ${(pm.FW - pm.MF).toFixed(4)}`);

// 2) the claim's own instrument, and the same thing measured with a role-fair ruler
const KEYS = ['pace','strength','passing','shooting','tackling','positioning','workrate','keeping','setPiece','stamina'] as const;
type Row = { n: string; raw: number; norm: number; mis: number; stats: Record<string, number> };
const rows: Row[] = [];
for (const f of names) {
  let raw = 0, norm = 0, mis = 0, k = 0;
  const stats: Record<string, number> = {}; for (const s of KEYS) stats[s] = 0;
  for (const c of clubs) {
    const li = autoPickXI(c, f);
    const slots = FORMATIONS[f];
    li.playerIds.forEach((pid, i) => {
      const p = c.players.find((x: Player) => x.id === pid)!;
      if (p.role !== slots[i].role) mis++;
      raw += overall(p);
      norm += overall(p) - pm[p.role];     // role-fair: each player vs his OWN role's population mean
      for (const s of KEYS) stats[s] += (p.attrs as any)[s] ?? 10;
      k++;
    });
  }
  for (const s of KEYS) stats[s] /= k;
  rows.push({ n: f, raw: raw / k, norm: norm / k, mis, stats });
}
console.log('\nmean XI overall(), raw vs role-normalised (z=0 means "exactly an average player of his own role"):');
for (const r of rows.sort((a, b) => b.raw - a.raw))
  console.log(`   ${r.n.padEnd(10)} raw ${r.raw.toFixed(3)}   role-fair ${(r.norm >= 0 ? '+' : '') + r.norm.toFixed(3)}   misslotted ${r.mis}`);
console.log('\nwhat the ENGINE actually reads (mean XI stat, the same 11 players):');
console.log('   shape      shoot  tackl  pass   pace   posn   wrate  stren');
for (const r of rows.sort((a, b) => b.norm - a.norm))
  console.log(`   ${r.n.padEnd(10)} ${r.stats.shooting.toFixed(2)}  ${r.stats.tackling.toFixed(2)}  ${r.stats.passing.toFixed(2)}  ${r.stats.pace.toFixed(2)}  ${r.stats.positioning.toFixed(2)}  ${r.stats.workrate.toFixed(2)}  ${r.stats.strength.toFixed(2)}`);
