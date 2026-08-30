// What renown actually FEELS like over a dynasty. A ladder whose rungs nobody reaches is decoration, and
// one you clear in two generations stops mattering — so the tiers are checked against simulated houses
// rather than chosen by eye.
import { houseRenown, houseTier, HOUSE_TIERS, type HouseMember } from '../../shared/src/renown.js';

// Three dynasties: one that never produces a great, one ordinary, one that keeps producing them.
const SHAPES: Array<[string, { peak: number; titles: number; caps: number }]> = [
  ['a modest line   ', { peak: 11, titles: 0, caps: 0 }],
  ['an ordinary line', { peak: 14, titles: 1, caps: 12 }],
  ['a great line    ', { peak: 18, titles: 3, caps: 60 }],
];

for (const [label, s] of SHAPES) {
  const members: HouseMember[] = [];
  const row: string[] = [];
  for (let g = 0; g < 8; g++) {
    members.push({ name: `G${g}`, generation: g, played: true, peakOverall: s.peak, caps: s.caps,
      leagueTitles: s.titles, cups: s.titles, seasons: 10, bigNights: 6 });
    // roughly one passed-over brother a generation, a level below the played line
    if (g > 0) members.push({ name: `G${g}b`, generation: g, played: false, peakOverall: s.peak - 3,
      caps: Math.round(s.caps / 3), leagueTitles: 0, cups: 0, seasons: 8, bigNights: 3 });
    const h = houseRenown(members);
    row.push(`g${g + 1}:${String(h.renown).padStart(5)} ${h.tier.icon}`);
  }
  console.log(`${label}  ${row.join('  ')}`);
}

// Where each rung lands for the ordinary line — the one most saves will be.
const ord: HouseMember[] = [];
const reached = new Map<string, number>();
for (let g = 0; g < 30; g++) {
  ord.push({ name: `G${g}`, generation: g, played: true, peakOverall: 14, caps: 12, leagueTitles: 1, cups: 1, seasons: 10, bigNights: 6 });
  if (g > 0) ord.push({ name: `G${g}b`, generation: g, played: false, peakOverall: 11, caps: 4, leagueTitles: 0, cups: 0, seasons: 8, bigNights: 3 });
  const t = houseTier(houseRenown(ord).renown);
  if (!reached.has(t.name)) reached.set(t.name, g + 1);
}
console.log('\n  an ordinary dynasty reaches:');
for (const t of HOUSE_TIERS) console.log(`    ${t.icon} ${t.name.padEnd(24)} ${reached.has(t.name) ? `generation ${reached.get(t.name)}` : 'never'}`);

const share = (() => { const h = houseRenown(ord); return Math.round((h.fromBranches / h.renown) * 100); })();
console.log(`\n  the branches you passed over are worth ${share}% of the house`);

const fail = (m: string) => { console.log('✗ ' + m); process.exitCode = 1; };
// Royalty has to be reachable, or the top of the ladder is a lie — but not before a real dynasty.
const royalty = reached.get('Royalty');
if (!royalty) fail('an ordinary dynasty never reaches Royalty — the top rung is unreachable');
else if (royalty < 6) fail(`Royalty at generation ${royalty} — the climb is over before the game is`);
else if (royalty > 20) fail(`Royalty at generation ${royalty} — nobody will play that long`);
if (share < 8) fail(`branches contribute only ${share}% — passing a brother over costs nothing either way`);
if (!process.exitCode) console.log('\n✓ the renown ladder is climbable and the branches matter');
