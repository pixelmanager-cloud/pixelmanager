import { FORMATIONS } from '@fm/shared';
const max: any = { GK: 0, DF: 0, MF: 0, FW: 0 };
for (const f of Object.keys(FORMATIONS) as any[]) {
  const c: any = { GK: 0, DF: 0, MF: 0, FW: 0 };
  for (const s of FORMATIONS[f]) c[s.role]++;
  for (const r of ['GK','DF','MF','FW']) max[r] = Math.max(max[r], c[r]);
  console.log(`  ${f.padEnd(10)} GK${c.GK} DF${c.DF} MF${c.MF} FW${c.FW}`);
}
console.log(`  MAX demand across all 11 shapes: GK${max.GK} DF${max.DF} MF${max.MF} FW${max.FW}   roster supplies GK2 DF7 MF7 FW4`);
console.log(`  => autoPickXI's role-fallback branch is unreachable for every shape in the pool; "0 mis-slotted" is guaranteed by construction, not measured.`);
