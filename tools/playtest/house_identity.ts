// TWELVE FAMILIES, OR TWO NAMES WEARING TWELVE SURNAMES.
//
// A rival house reaches the player as a NAME and almost nothing else: `houseNews` prints one in the season
// feed, `seedHouseIntoSquad` puts one in an opponent's XI, `houseListings` puts one in the transfer market.
// So whatever field houses.ts hashes on to tell the twelve families apart IS what the player experiences as
// twelve great dynasties — and twice it hashed on a field that does not tell them apart.
//
// `houseManAt` keyed the first name on `h.base`, which is 14 or 15 across all twelve entries of RIVAL_HOUSES:
// seven houses got one name and five got the other, in every generation of every save (seed 1234, generation
// 0, called all twelve of them Kaito). `houseManAsPlayer` keyed the MINT SEED on `h.name.length`, which takes
// five values, so Vasquez/Okonkwo/Brandão/Sowande were minted from one seed and drew one personality between
// them, generation after generation. The Trophy Room never shows the twelve first names side by side, which
// is why this survived: the player meets them serially, across seasons, and only slowly notices.
//
// The test is PAIRWISE and ACROSS GENERATIONS, because that is the shape of the defect. Two houses that
// genuinely hash apart share a first name about one generation in eight, so agreeing on all eight is a
// 1-in-16-million accident; agreeing because they share a discriminator is a certainty on every seed.
// Measured over 2000 seeds, the broken discriminators give 31 name-identical pairs and 13 personality-
// identical pairs of 66 on EVERY seed without exception, and a distinct one gives zero.
//
// Run: `npx tsx tools/playtest/house_identity.ts`
import { RIVAL_HOUSES, houseManAt, houseManAsPlayer } from '../../shared/src/houses.js';

const SEEDS = [1234, 12345, 999, 777, 1234567, 424242, 8675309, 31337, 90210, 555];
const GENS = 8;
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== the twelve rival houses are twelve different men ===');

const nameTwins: string[] = [], persTwins: string[] = [];
let pairs = 0, distinctSum = 0, generations = 0, worstNameTwins = 0;
const namesSeen = new Set<string>(), persSeen = new Set<string>();

for (const seed of SEEDS) {
  // A house's SIGNATURE is what it fields across the dynasty's whole run, not in any one generation.
  const names = RIVAL_HOUSES.map((h) => Array.from({ length: GENS }, (_, g) => houseManAt(h, g, seed).name.split(' ')[0]));
  const chars = RIVAL_HOUSES.map((h) => Array.from({ length: GENS }, (_, g) => houseManAsPlayer(h, g, seed, 'probe', 'MF', 24).personality));
  names.forEach((r) => r.forEach((n) => namesSeen.add(n)));
  chars.forEach((r) => r.forEach((p) => persSeen.add(String(p))));
  for (let g = 0; g < GENS; g++) { distinctSum += new Set(names.map((r) => r[g])).size; generations++; }
  let seedTwins = 0;
  for (let i = 0; i < RIVAL_HOUSES.length; i++) for (let j = i + 1; j < RIVAL_HOUSES.length; j++) {
    pairs++;
    if (names[i].join('|') === names[j].join('|')) { seedTwins++; nameTwins.push(`seed ${seed}: ${RIVAL_HOUSES[i].name} and ${RIVAL_HOUSES[j].name} both field a ${names[i][0]} in all ${GENS} generations`); }
    if (chars[i].join('|') === chars[j].join('|')) persTwins.push(`seed ${seed}: ${RIVAL_HOUSES[i].name} and ${RIVAL_HOUSES[j].name} share one personality (${chars[i][0]}) across all ${GENS} generations`);
  }
  worstNameTwins = Math.max(worstNameTwins, seedTwins);
}

const avgDistinct = distinctSum / generations;
console.log(`  ..   ${pairs} house pairs over ${SEEDS.length} seeds × ${GENS} generations · ${namesSeen.size} first name(s) and ${persSeen.size} personality(s) drawn`);
console.log(`  ..   ${avgDistinct.toFixed(2)} distinct first names among the twelve per generation (worst seed: ${worstNameTwins} name-identical pairs of ${pairs / SEEDS.length})`);

// VACUITY GUARDS. An emptied or renamed house list would compare nothing and pass for free. The twin checks
// below cannot go vacuous the other way — a collapsed name pool or a constant personality makes EVERY pair a
// twin, which is red, not green.
ok(RIVAL_HOUSES.length >= 8, `the house list was actually read (${RIVAL_HOUSES.length} houses)`);
ok(pairs >= 200, `enough pairs to see a shared discriminator (${pairs})`);
ok(namesSeen.size >= 4 && persSeen.size >= 4, `the draws are not degenerate (${namesSeen.size} names, ${persSeen.size} personalities)`);

for (const t of nameTwins.slice(0, 6)) console.log(`       ${t}`);
ok(nameTwins.length === 0, `no two houses field the same first name in every generation (${nameTwins.length} pair-seeds)`);
for (const t of persTwins.slice(0, 6)) console.log(`       ${t}`);
ok(persTwins.length === 0, `no two houses are minted from the same seed (${persTwins.length} pair-seeds share a personality throughout)`);
// The coarse reading of the same thing: twelve families must not collapse into a handful of groups.
ok(avgDistinct >= 4, `the twelve houses spread across the name pool (${avgDistinct.toFixed(2)} distinct per generation, not 2 groups)`);

console.log(fails === 0 ? '\n✓ each rival house is its own man' : `\n✗ ${fails} problem(s)`);
process.exit(fails === 0 ? 0 : 1);
