// THE COMMERCIAL DEPT CARD MUST NOT SELL SILVERWARE THE SPONSOR TERM NEVER COUNTS.
//
// The trophy argument handed to `sponsorIncome` is built in api.ts's `spSeasonReward` out of the club's
// honours, and it filters them to `kind === 'league'`. Cup wins are honours too: the Continental Cup and
// the World Finals both call spSeasonReward with their own kind, api.ts writes `pos === 1 ? 1 : 0` into
// the title column, and the Trophy Cabinet renders EVERY title-carrying honour with no kind filter at
// all — it even keeps a trophy image and a name for 'continental' and 'world'. So a Continental Cup is a
// trophy in your cabinet by the game's own definition, and the card that promised income "for every
// trophy in your cabinet" moved by exactly nothing when you won one.
//
// That is the Fan Zone defect one facility along — a card advertising a stream the arithmetic pays zero
// on ("swells the gate", over a gate that is 0 until the ground is built) — at the facility whose whole
// job is to turn the cabinet into money.
//
// So this does not check the sentence against a hard-coded string, which would rot the way the copy it
// guards did. It reads the filter that ACTUALLY FEEDS the sponsor term out of api.ts and requires the
// card's promise to be exactly as wide as that filter: league-only counting must not be sold as the whole
// cabinet, and if the count is ever widened to pay cups the card has to be widened with it.
//
// Run: `npx tsx tools/playtest/sponsor_trophy_copy.ts`
import { readFileSync } from 'node:fs';
import { FACILITY_META, MAX_LEVEL, sponsorIncome } from '../../shared/src/facilities.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== the Commercial Dept card promises exactly the honours the sponsor term counts ===');

const api = readFileSync('client/src/api.ts', 'utf8');
const main = readFileSync('client/src/main.ts', 'utf8');
const blurb = FACILITY_META.sponsor.blurb;
console.log(`  ..   card: "${blurb}"`);

// ── 1. THE COUNT, read from the source rather than assumed, and the vacuity guard for the gate below. If
// this stops matching — the argument is renamed, the reduce moves into shared, the honours query changes
// shape — the copy would be judged against nothing and this probe would go green having read nothing at
// all. It has to go red HERE instead. Mutation test: drop `&& h.kind === 'league'` from api.ts and the
// gate at the bottom must swap branches; rename `honoursSoFar` and this line must go red.
const countLine = /\(honoursSoFar as any\[\]\)\.filter\(([^\n]*)\)\s*\r?\n\s*\.reduce\(/.exec(api);
ok(!!countLine, 'found the honours filter that feeds sponsorIncome (so the gate below cannot pass on nothing)');
const countsLeagueOnly = !!countLine && /kind === 'league'/.test(countLine[1]);
if (countLine) console.log(`  ..   counted for sponsorship: ${countLine[1].trim()}`);

// ── 2. THE CABINET, which is the thing the sentence points at. A won cup is banked with a title flag and
// drawn as a trophy, so it is in the cabinet whatever the sponsor term then does with it.
const cupBanked = /kind: 'continental'/.test(main) && /kind: 'world'/.test(main)
  && /addHonour\(OWNER, [^\n]*pos === 1 \? 1 : 0,/.test(api);
ok(cupBanked, 'a won cup is banked as a title-carrying honour of its own kind (the premise)');
const cabinet = /const titles = honours\.filter\(\(h\) => h\.title === 1\);/.test(main)
  && /kind === 'continental'\) return 'Continental Cup'/.test(main);
ok(cabinet, 'the Trophy Cabinet shows every title honour, cups included — it has no kind filter (the premise)');
ok(/<div class="fac-blurb">\$\{f\.blurb\}<\/div>/.test(main), 'and this blurb is the text the facility screen prints');

// What the silence is worth, recomputed every run so the figure cannot rot: a cup carries no tier, so each
// would weigh 1 in the reduce — the flat end of the curve, and still real money at a maxed department.
const fiveCups = sponsorIncome(MAX_LEVEL, 9, 5, 10) - sponsorIncome(MAX_LEVEL, 9, 0, 10);
console.log(`  ..   five cups would be worth ${fiveCups.toLocaleString('en-US')}c a season at a maxed Commercial Dept in the top flight; the count credits them 0`);

// ── 3. THE GATE. Both branches assert, so widening the economy later cannot quietly make this green: pay
// cups and the card must say so, count league titles only and the card must not claim the cabinet.
const promisesTheCabinet = /every trophy|each trophy|any trophy|troph(?:y|ies) in your cabinet|silverware/i.test(blurb);
const namesLeagueTitles = /league title/i.test(blurb);
if (!countLine) {
  console.log('  ..   the count could not be read, so the card is being judged against nothing — fix the guard above first');
} else if (countsLeagueOnly) {
  ok(!promisesTheCabinet, 'the card does not sell the whole cabinet while only league titles are counted');
  ok(namesLeagueTitles, 'the card names league titles — the one honour that actually moves sponsorship');
} else {
  ok(promisesTheCabinet, 'the count credits cups too now, so the card must promise the whole cabinet');
  console.log('  ..   the sponsor term no longer filters to league titles — re-read this probe before trusting it');
}

console.log(fails === 0 ? '\nPASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
