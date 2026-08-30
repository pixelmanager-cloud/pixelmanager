// The rival table has one job: give the player somebody to be a dynasty against. It fails in two ways —
// the field is so strong the player is never in it, or so weak the table is a formality. This measures
// where a real dynasty actually lands among them, at three levels of play.
import { rivalStandings, RIVAL_HOUSES, houseQualityAt } from '../../shared/src/houses.js';
import { houseRenown, houseTier, type HouseMember } from '../../shared/src/renown.js';

// CALIBRATED AGAINST THE REAL GAME — and RE-calibrated twice, which is the lesson worth recording.
//
// v1 used peak 11/14/16/18, invented. v2 dropped to 8/10/12/14 after six real careers were driven through
// the facade and graduated at 8-11. v3 is these numbers, because the star's development was then moved onto
// the squad lifecycle curve and his peak moved with it: measured now, he tops out at **12** with no training
// investment and **17** with the Training Ground maxed.
//
// THE DEPENDENCY IS THE POINT. This file's thresholds are only meaningful relative to what the game can
// actually produce, so any change to career graduation, developPlayer or the Training facility invalidates
// them. Re-measure before trusting a green tick here — driving four real careers takes about a minute.
const SHAPES: Array<[string, number, number, number]> = [
  ['a poor dynasty     ', 10, 0, 0],
  ['an ordinary dynasty', 12, 1, 10],
  ['a good dynasty     ', 15, 2, 30],
  ['an exceptional one ', 17, 3, 55],
];
const SEEDS = [7, 1234, 99991, 424242, 8675309, 31337, 90210, 555];

for (const [label, peak, titles, caps] of SHAPES) {
  const places: number[] = [];
  for (const seed of SEEDS) {
    const mine: HouseMember[] = [];
    for (let g = 0; g <= 7; g++) {
      mine.push({ name: `G${g}`, generation: g, played: true, peakOverall: peak, caps, leagueTitles: titles, cups: titles, seasons: 10, bigNights: 6 });
      if (g > 0) mine.push({ name: `G${g}b`, generation: g, played: false, peakOverall: peak - 3, caps: Math.round(caps / 3), leagueTitles: 0, cups: 0, seasons: 8, bigNights: 3 });
    }
    const me = houseRenown(mine).renown;
    const rows = rivalStandings(seed, 7);
    places.push(rows.filter((r) => r.renown > me).length + 1);
  }
  console.log(`${label}  finishes ${places.join(', ')} of ${RIVAL_HOUSES.length + 1} after 8 generations`);
}

console.log('\n  the table after 8 generations (seed 1234):');
for (const r of rivalStandings(1234, 7).slice(0, 12)) {
  console.log(`    ${r.tier.icon} ${String(r.renown).padStart(6)}  ${r.house.name.padEnd(11)} ${r.house.arc.padEnd(9)} latest: ${r.latest.name} (peak ${r.latest.peakOverall})`);
}

console.log('\n  each arc across 8 generations (quality of the family\'s man):');
for (const h of RIVAL_HOUSES.slice(0, 6)) {
  const q = Array.from({ length: 8 }, (_, g) => houseQualityAt(h, g, 1234).toFixed(0).padStart(2));
  console.log(`    ${h.name.padEnd(11)} ${h.arc.padEnd(9)} ${q.join(' ')}`);
}

const fail = (m: string) => { console.log('✗ ' + m); process.exitCode = 1; };
// A great dynasty must be able to win the table; a modest one must not.
// Must build the SAME dynasty the table above prints, brothers included — the first version left the
// passed-over branches out and then reported the resulting placing under the same label, so the summary
// line and the assertions were quietly measuring two different families.
const place = (peak: number, titles: number, caps: number, seed: number) => {
  const mine: HouseMember[] = [];
  for (let g = 0; g <= 7; g++) {
    mine.push({ name: `G${g}`, generation: g, played: true, peakOverall: peak, caps, leagueTitles: titles, cups: titles, seasons: 10, bigNights: 6 });
    if (g > 0) mine.push({ name: `G${g}b`, generation: g, played: false, peakOverall: peak - 3, caps: Math.round(caps / 3), leagueTitles: 0, cups: 0, seasons: 8, bigNights: 3 });
  }
  const me = houseRenown(mine).renown;
  return rivalStandings(seed, 7).filter((r) => r.renown > me).length + 1;
};
const flawless = SEEDS.map((s) => place(17, 3, 55, s));
const strong = SEEDS.map((s) => place(15, 2, 30, s));
const modestBest = Math.min(...SEEDS.map((s) => place(10, 0, 0, s)));
const ordinary = SEEDS.map((s) => place(12, 1, 10, s));
const ordWorst = Math.max(...ordinary), ordBest = Math.min(...ordinary);
// A dynasty that produces an 18-peak, three-title man EVERY generation for eight generations is not
// "great", it is flawless, and it should win. What must not be a foregone conclusion is the tier below.
if (Math.min(...flawless) > 2) fail(`a flawless dynasty never finishes better than ${Math.min(...flawless)} — the field is unbeatable`);
if (Math.max(...strong) <= 1) fail('a strong dynasty wins on every seed — the top of the table is a formality');
if (Math.min(...strong) > 4) fail(`a strong dynasty never finishes better than ${Math.min(...strong)} — excellence is not rewarded`);
if (modestBest <= 3) fail(`a modest dynasty reaches ${modestBest} — the field is a formality`);
// THE CASE THAT MATTERS MOST, and the one the first version of this probe missed: the ordinary player is
// most saves. If merely being competent wins the table, the table is decoration from the third generation
// on. He should be in the argument and not yet winning it — and WHERE in the argument should depend on the
// era he was born into, which is why the range below is wide rather than a single acceptable place.
if (ordBest <= 2) fail(`an ordinary dynasty finishes ${ordBest} — being competent should not win the table`);
if (ordWorst > 11) fail(`an ordinary dynasty finishes as low as ${ordWorst} — he is not even in the argument`);
const spread = rivalStandings(1234, 7);
if (spread[0].renown / spread[spread.length - 1].renown < 1.8) fail('the rival houses are all the same — the table has no shape');
// The field must differ between saves, or the table is a fixed difficulty curve wearing twelve names.
if (new Set(ordinary).size < 3) fail(`an ordinary dynasty finishes ${[...new Set(ordinary)].join('/')} on every seed — the world does not vary between saves`);
const topNames = SEEDS.map((s) => rivalStandings(s, 7)[0].house.name);
if (new Set(topNames).size < 3) fail(`the same houses lead every save (${[...new Set(topNames)].join(', ')})`);
if (!process.exitCode) console.log('\n✓ the field is beatable, not a formality, and has a shape');
