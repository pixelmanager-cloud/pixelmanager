// sanity: does the `norole` doctoring actually neutralise the role bias? (a patch that came loose
// reads as a clean engine, so verify the patched squads before trusting the condition)
import { generateTeam, FORMATIONS } from '@fm/shared';
const BIAS: any = {
  DF: { pace: 0, strength: 2, passing: -1, shooting: -5, tackling: 4, positioning: 3, workrate: 1, keeping: -10, setPiece: -2, stamina: 1 },
  MF: { pace: 1, strength: 0, passing: 3, shooting: 0, tackling: 0, positioning: 1, workrate: 3, keeping: -10, setPiece: 2, stamina: 3 },
  FW: { pace: 3, strength: 1, passing: 0, shooting: 4, tackling: -4, positioning: 2, workrate: 0, keeping: -10, setPiece: 2, stamina: 1 },
};
const KEYS = ['pace','strength','passing','shooting','tackling','positioning','workrate','setPiece','stamina'];
const raw: any = { DF: {}, MF: {}, FW: {} }, fix: any = { DF: {}, MF: {}, FW: {} }, cnt: any = { DF: 0, MF: 0, FW: 0 };
for (const r of ['DF','MF','FW']) for (const k of KEYS) { raw[r][k] = 0; fix[r][k] = 0; }
let outOfRange = 0;
for (let s = 0; s < 3000; s++) for (const f of Object.keys(FORMATIONS) as any[]) {
  const t: any = generateTeam('x','x',0,12,s*7919+11,f);
  for (const p of t.players) { if (p.role === 'GK') continue;
    cnt[p.role]++;
    for (const k of KEYS) { raw[p.role][k] += p.attrs[k]; const v = p.attrs[k] - BIAS[p.role][k]; fix[p.role][k] += v; if (v < 9 || v > 15) outOfRange++; } }
}
console.log('mean stat by role — RAW (as the engine ships) then DOCTORED (role bias subtracted):');
for (const r of ['DF','MF','FW']) console.log(`  ${r} raw   ` + KEYS.map(k => `${k.slice(0,5)}=${(raw[r][k]/cnt[r]).toFixed(2)}`).join(' '));
for (const r of ['DF','MF','FW']) console.log(`  ${r} fixed ` + KEYS.map(k => `${k.slice(0,5)}=${(fix[r][k]/cnt[r]).toFixed(2)}`).join(' '));
console.log(`  doctored values outside the un-clamped 9..15 band (i.e. clamping made the undo lossy): ${outOfRange} of ${(cnt.DF+cnt.MF+cnt.FW)*KEYS.length}`);
