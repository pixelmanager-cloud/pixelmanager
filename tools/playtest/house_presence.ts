// How often the rival families are actually PRESENT, rather than a table you read once. Three surfaces —
// the market (you can sign one), the opposition XI (you play against one), the feed (they make news) —
// and each fails in both directions: never, so the Houses table is a spreadsheet; or constantly, so twelve
// great dynasties become background noise.
import { seedHouseIntoSquad, houseNews, RIVAL_HOUSES } from '../../shared/src/houses.js';
import { tierStrength } from '../../shared/src/clubseason.js';

const SEASONS = 12, SEEDS = 300;

for (const tier of [10, 6, 2]) {
  let met = 0, fixtures = 0;
  const families = new Set<string>();
  for (let s = 0; s < SEEDS; s++) {
    for (let season = 1; season <= SEASONS; season++) {
      for (let f = 0; f < 18; f++) {                       // an 18-fixture season
        fixtures++;
        const club = { players: Array.from({ length: 18 }, (_, i) => ({ id: `p${i}`, role: 'MF', name: 'x' })) };
        const r = seedHouseIntoSquad(club as any, s * 7919 + 3, (season * 100 + f) >>> 0, 0, tierStrength(tier));
        if (r.guest) { met++; families.add(r.guest.house.name); }
      }
    }
  }
  console.log(`tier ${String(tier).padStart(2)}: you face a rival family's son in ${((met / fixtures) * 100).toFixed(1)}% of fixtures`
    + ` → ~${(met / fixtures * 18).toFixed(1)} times a season · ${families.size} families met`);
}

let newsSeasons = 0, n = 0;
const sample: string[] = [];
for (let s = 0; s < SEEDS; s++) for (let season = 1; season <= SEASONS; season++) {
  n++;
  const line = houseNews(s * 7919 + 3, season, Math.floor(season / 6), 2000);
  if (line) { newsSeasons++; if (sample.length < 5 && s % 41 === 0) sample.push(line); }
}
console.log(`\nthe families make news in ${((newsSeasons / n) * 100).toFixed(0)}% of seasons`);
for (const l of sample) console.log(`    "${l}"`);

const fail = (m: string) => { console.log('✗ ' + m); process.exitCode = 1; };
// Present enough to be a rivalry, rare enough to be an event.
const rate = (tier: number) => {
  let met = 0, fx = 0;
  for (let s = 0; s < 200; s++) for (let season = 1; season <= 12; season++) for (let f = 0; f < 18; f++) {
    fx++;
    const club = { players: Array.from({ length: 18 }, (_, i) => ({ id: `p${i}`, role: 'MF', name: 'x' })) };
    if (seedHouseIntoSquad(club as any, s * 7919 + 3, (season * 100 + f) >>> 0, 0, tierStrength(tier)).guest) met++;
  }
  return met / fx;
};
const top = rate(2);
if (top * 18 < 0.5) fail(`top flight: you meet a rival family ${(top * 18).toFixed(1)} times a season — they are not present at all`);
if (top * 18 > 6) fail(`top flight: ${(top * 18).toFixed(1)} times a season — the great families are wallpaper`);
if (newsSeasons / n < 0.15) fail('the families almost never make news — the table still moves in silence');
if (newsSeasons / n > 0.75) fail('the families make news nearly every season — the feed will teach the player to skip it');
// And the swap must never damage the opponent: same count, same roles.
const club = { players: Array.from({ length: 18 }, (_, i) => ({ id: `p${i}`, role: i < 2 ? 'GK' : 'MF', name: 'x' })) };
let checked = 0;
for (let s = 0; s < 400; s++) {
  const r = seedHouseIntoSquad(club as any, s, s * 3 + 1, 0, tierStrength(2));
  if (!r.guest) continue;
  checked++;
  if (r.club.players.length !== club.players.length) fail('the swap changed the squad size');
  if (r.club.players.map((p: any) => p.role).join() !== club.players.map((p) => p.role).join()) fail('the swap changed the opponent\'s shape');
  if (new Set(r.club.players.map((p: any) => p.id)).size !== club.players.length) fail('the swap duplicated a player id');
}
console.log(`  (squad integrity checked on ${checked} swaps)`);
if (!process.exitCode) console.log('\n✓ the rival families are present without being wallpaper');
