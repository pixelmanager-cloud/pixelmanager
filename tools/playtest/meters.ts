// Every meter a player SPENDS COINS ON must be visible in the HUD at that life stage. Family was hidden
// from Scholar onward — five of the seven chapters — while "Treat Your Parents 🏠+14" was on sale in all of
// them, so coins went into a bar that was not on screen. The mismatch is invisible by reading, because the
// meter list and the shop list live in different tables. (PT-154)
import { LIFESTYLE, activeMeters } from '../../shared/src/career.js';
const CH = ['Grassroots', 'Academy', 'Scholar', 'Youth Team', 'Breakthrough', 'First Team', 'Establishing'];
let fails = 0;
for (let idx = 0; idx < CH.length; idx++) {
  const shown = new Set(activeMeters(CH[idx]).map((m: any) => m.key));
  const bad = new Set<string>();
  for (const it of LIFESTYLE as any[]) {
    if ((it.minChapterIdx ?? 0) > idx || (it.maxChapterIdx ?? 99) < idx) continue;
    for (const k of Object.keys(it.perks ?? {})) if (!shown.has(k)) bad.add(`${k} (${it.name})`);
  }
  console.log(`  ${CH[idx].padEnd(13)} shows [${[...shown].join(', ')}]`);
  if (bad.size) { console.log(`      FLAG tiles pay into hidden meters: ${[...bad].join(' · ')}`); fails += bad.size; }
}
console.log(fails ? `\n⚠ ${fails} tile/meter mismatch(es)` : '\n✓ every spend tile pays into a meter the player can see');
if (fails) process.exitCode = 1;
