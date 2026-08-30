// How often a rival family's son actually reaches your market. Both failure modes are bad: never, and the
// Houses table is a spreadsheet you can only read; every season, and the twelve great families become a
// supplier rather than rivals. Aim: a handful across a manager's career, and worth stopping for.
import { houseListings } from '../../shared/src/houses.js';
import { tierStrength } from '../../shared/src/clubseason.js';

for (const tier of [10, 6, 2]) {
  let seasonsWith = 0, total = 0, n = 0;
  const seen = new Set<string>();
  for (let seed = 0; seed < 400; seed++) {
    for (let season = 1; season <= 12; season++) {
      const gen = Math.floor(season / 12);
      const l = houseListings(seed * 7919 + 3, season, tier, gen, tierStrength(tier));
      n++; total += l.length;
      if (l.length) { seasonsWith++; for (const x of l) seen.add(x.player.name.split(' ').slice(-1)[0]); }
    }
  }
  console.log(`tier ${String(tier).padStart(2)} (${tierStrength(tier).toFixed(1)} strength): a rival son appears in ${((seasonsWith / n) * 100).toFixed(1)}% of seasons`
    + ` → ~${(total / n * 12).toFixed(1)} across a 12-season manager career · ${seen.size} different families reachable`);
}

const fail = (m: string) => { console.log('✗ ' + m); process.exitCode = 1; };
const rate = (tier: number) => {
  let hits = 0, n = 0;
  for (let seed = 0; seed < 400; seed++) for (let season = 1; season <= 12; season++) {
    n++; if (houseListings(seed * 7919 + 3, season, tier, 0, tierStrength(tier)).length) hits++;
  }
  return hits / n;
};
// The bottom of the pyramid is DELIBERATELY near-zero: a great family's son does not sign for a Sunday
// League club, and that is exactly what makes the climb worth making. So the bound that matters is the
// top — reachable there, and never a supplier anywhere.
const top = rate(2), bottom = rate(10);
if (top < 0.06) fail(`top flight: a rival son appears in only ${(top * 100).toFixed(1)}% of seasons — the families stay unreachable even at the summit`);
if (top > 0.25) fail(`top flight: a rival son appears in ${(top * 100).toFixed(0)}% of seasons — the great families are a supplier`);
if (bottom > top * 0.5) fail('the bottom of the pyramid has the same access as the top — climbing should open these doors');
if (!process.exitCode) console.log('\n✓ a rival family reaches your market rarely enough to matter');
