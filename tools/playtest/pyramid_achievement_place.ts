// AN ACHIEVEMENT MEASURED IN PROMOTIONS MUST NOT PROMISE A PLACE IN THE PYRAMID.
//
// `AchSnapshot.promotions` is `startTier - clubTier` (client/src/main.ts buildAchSnapshot) — a RELATIVE
// climb from wherever the founding career seeded the club, not an absolute position; `topTier` is the
// absolute one. `climb_half` ("Climbing the Pyramid") tested `promotions >= 4` while its description read
// "Reach the middle tiers of the football pyramid", which is a place — and a place four promotions almost
// never reaches. `clubTier()` floors at 1, so from the ordinary founding tiers of 5/6/7 the fourth
// promotion lands in tier 1/2/3: the top flight, where 'The Big Time' fires in the same instant, or a
// division or two below it. The achievement list is a static, always-visible goal board, so this was the
// one line meant to say what to chase next, naming the wrong target.
//
// THE DRIVING FIELD IS PROBED, NOT PARSED. Each predicate is run against a snapshot whose only non-zero
// field is the one under test, so "this achievement is gated on promotions" is measured behaviour rather
// than a regexp over source — the same discipline as prestige_capstone.ts, which caught the neighbouring
// off-by-one in the two prestige capstones. Only the desc is read as text: it is a promise to the player
// and nothing else's input.
//
// NOT VACUOUS: the pyramid-gated set is counted, so deleting these achievements cannot turn this green;
// the place vocabulary must still match SOME description, so narrowing the regexp to nothing fails here
// instead of passing over an empty set; and the division-count check is guarded by a "someone still
// states a count" assertion. Mutation test, run before this was committed: put the old desc back ("Reach
// the middle tiers of the football pyramid") and both the place check and the origin check go red; give
// the desc a count that disagrees with the threshold ("Climb five divisions…") and the count check goes
// red; empty the PLACE regexp and the vocabulary guard goes red.
//
// NOT ASSERTED, DELIBERATELY: that `climb_half` is reachable at all. From a founding tier of 3 or 4 —
// both returnable by startingTierFor (client/src/main.ts) — `promotions` caps at 2 or 3 and the
// achievement can never unlock. Whether a threshold of 4 is the right ask of the goal board is a balance
// decision for a human, not a defect this probe should force; the landing table below prints it on every
// run so it cannot quietly be forgotten again.
//
// Run: `npx tsx tools/playtest/pyramid_achievement_place.ts`
import { ACHIEVEMENTS, type AchSnapshot } from '../../shared/src/achievements.js';
import { TIERS } from '../../shared/src/clubseason.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

// One field non-zero at a time — a Proxy rather than a literal so a field added to AchSnapshot later
// cannot read `undefined` here and silently make a predicate untestable (the trap qa_achievements_fuzz.ts
// fell into when `promotions` was added).
const only = (field: string, v: number): AchSnapshot =>
  new Proxy({} as AchSnapshot, { get: (_t, k) => (k === field ? v : 0) });

const SCAN = TIERS + 40;  // far past the pyramid: a threshold set beyond it must be SEEN, not dropped
const firesAt = (test: (s: AchSnapshot) => boolean, field: string): number => {
  for (let v = 1; v <= SCAN; v++) if (test(only(field, v))) return v;
  return -1;
};

// A PLACE in the pyramid — an absolute position, true or false whatever tier the club was founded in.
const PLACE = /\btop flight\b|\bmiddle tiers?\b|\bbasement\b|\bbottom (?:of the pyramid|division|tier)\b/i;
// An ORIGIN anchor — the words that make a relative climb honest about what it is measured from.
const ORIGIN = /\bstarting division\b|\bfounded\b|\bfounding\b|\bstarted\b|\bwhere the club\b/i;
const NUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
/** How many divisions a description claims, or -1 if it names no count. */
const claimedDivisions = (desc: string): number => {
  const m = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+divisions?\b/i.exec(desc);
  return m ? (NUM[m[1].toLowerCase()] ?? Number(m[1])) : -1;
};

console.log('=== A promotions-gated achievement names a climb, not a place ===');

const gated = ACHIEVEMENTS
  .map((a) => ({ a, rel: firesAt(a.test, 'promotions'), abs: firesAt(a.test, 'topTier') }))
  .filter((g) => g.rel > 0 || g.abs > 0);
console.log(`  ..   pyramid-gated: ${gated.map((g) => `"${g.a.name}"[${[g.rel > 0 ? `promotions>=${g.rel}` : '', g.abs > 0 ? `topTier>=${g.abs}` : ''].filter(Boolean).join(' ')}]`).join(', ') || '(none)'}`);
ok(gated.length >= 3, `pyramid-gated achievements still exist to measure (found ${gated.length}, expect >= 3)`);
ok(ACHIEVEMENTS.some((a) => PLACE.test(a.desc)),
   'the place vocabulary still matches some description, so the place check below is not measuring zero of zero');

// `promotions` is startTier - clubTier and clubTier floors at 1, so a threshold of N can only be reached
// from a founding tier of N+1 or deeper, and it lands the club in (founding tier - N).
const relGated = gated.filter((g) => g.rel > 0);
for (const { a, rel } of relGated) {
  const land = Array.from({ length: TIERS }, (_, i) => i + 1)
    .map((f) => `${f}→${f - rel >= 1 ? `tier ${f - rel}` : 'NEVER'}`).join(', ');
  console.log(`  ..   "${a.name}" needs ${rel} promotion${rel === 1 ? '' : 's'}; founding tier → where it fires: ${land}`);
}

for (const { a, rel } of relGated) {
  ok(!PLACE.test(a.desc),
     `"${a.name}" is gated on promotions>=${rel} (a climb FROM the founding tier) and its desc names no absolute place — "${a.desc}"`);
  ok(ORIGIN.test(a.desc),
     `"${a.name}" says what the climb is measured from — "${a.desc}"`);
}

const counted = relGated.filter((g) => claimedDivisions(g.a.desc) > 0);
console.log(`  ..   stating a division count: ${counted.map((g) => `"${g.a.name}"=${claimedDivisions(g.a.desc)}`).join(', ') || '(none)'}`);
ok(counted.length >= 1, `a relative-climb description still states its division count (found ${counted.length})`);
for (const { a, rel } of counted) {
  ok(claimedDivisions(a.desc) === rel,
     `"${a.name}" promises ${claimedDivisions(a.desc)} divisions and fires at ${rel}`);
}

console.log(fails ? `\n✗ ${fails} — an achievement's description does not describe what its predicate measures` : '\n✓ every pyramid achievement describes the quantity it is actually gated on');
if (fails) process.exitCode = 1;
