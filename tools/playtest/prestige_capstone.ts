// A PRESTIGE ACHIEVEMENT MUST FIRE ON THE RANK IT IS NAMED AFTER, AND "THE HIGHEST RANK" MUST MEAN THE TOP.
//
// `prestige_immortal` ("The Immortal Gaffer", desc: "Reach the highest manager prestige rank") tested
// `prestigeIdx >= 7`, and idx 7 of PRESTIGE_LEVELS is 'Footballing Legend' — 'Immortal Gaffer' is idx 8, at
// 16,000 points. So the toast fired a rank early and the longest grind in the game unlocked nothing at all.
// `prestige_elite` ("Elite Company") had the same off-by-one: it fired at idx 5 'Trophy Winner', not idx 6
// 'Elite Manager'. Only `prestige_mid` lined up. Nothing measured the pairing, because the thresholds are
// bare integers in one file and the rank titles are strings in another — the two can drift apart silently,
// and these ids are the ones a Steamworks mapping will be built on.
//
// The predicates are PROBED, not parsed: each is run against a snapshot whose only non-zero field is
// prestigeIdx, so the rank an achievement actually fires on is measured behaviour, not a regexp over source.
// Non-vacuity: the scan runs well past the top of the ladder, so a threshold moved BEYOND the last rank
// shows up as "fires at idx N = NO SUCH RANK" instead of quietly dropping out of the measured set, and the
// count of prestige-gated achievements is asserted so deleting them cannot turn this probe green.
//
// Run: `npx tsx tools/playtest/prestige_capstone.ts`
import { ACHIEVEMENTS, type AchSnapshot } from '../../shared/src/achievements.js';
import { PRESTIGE_LEVELS } from '../../shared/src/prestige.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

// Every field reads 0 except prestigeIdx — a Proxy rather than a literal so a field added to AchSnapshot
// later cannot read `undefined` here and silently make a predicate untestable (qa_achievements_fuzz.ts
// learned that one the hard way when `promotions` was added).
const snapAt = (idx: number): AchSnapshot =>
  new Proxy({} as AchSnapshot, { get: (_t, k) => (k === 'prestigeIdx' ? idx : 0) });

const TOP = PRESTIGE_LEVELS.length - 1;
const SCAN_MAX = TOP + 64;   // far past the ladder: a threshold set beyond the last rank must still be SEEN
const firstIdx = (test: (s: AchSnapshot) => boolean): number => {
  for (let i = 0; i <= SCAN_MAX; i++) if (test(snapAt(i))) return i;
  return -1;
};

const NOISE = new Set(['the', 'a', 'an', 'of', 'and']);
const words = (s: string) => s.toLowerCase().split(/[^a-z]+/).filter((w) => w && !NOISE.has(w));

console.log('=== Prestige achievements fire on the rank they are named after ===');
console.log(`  ..   ladder: ${PRESTIGE_LEVELS.map((l, i) => `${i}:${l.title}@${l.at}`).join(', ')}`);

const gated = ACHIEVEMENTS.map((a) => ({ a, at: firstIdx(a.test) })).filter((g) => g.at > 0);
console.log(`  ..   prestige-gated: ${gated.map((g) => `"${g.a.name}"→${g.at} (${PRESTIGE_LEVELS[g.at]?.title ?? 'NO SUCH RANK'})`).join(', ') || '(none)'}`);
ok(gated.length >= 2, `prestige-gated achievements still exist to measure (found ${gated.length}, expect >= 2)`);

for (const { a, at } of gated) {
  const rank = PRESTIGE_LEVELS[at];
  const shared = rank ? words(a.name).filter((w) => words(rank.title).includes(w)) : [];
  ok(shared.length > 0,
     `"${a.name}" fires at idx ${at} = '${rank?.title ?? 'NO SUCH RANK'}' — the rank it is named after`);
}

// The desc is a promise to the player, and this one is checkable: "highest" has exactly one referent.
const claimsTop = ACHIEVEMENTS.filter((a) => /highest/i.test(a.desc) && /prestige/i.test(a.desc));
console.log(`  ..   claiming the HIGHEST rank: ${claimsTop.map((a) => `"${a.name}"`).join(', ') || '(none)'}`);
ok(claimsTop.length >= 1, `an achievement still claims the highest prestige rank (found ${claimsTop.length})`);
for (const a of claimsTop) {
  const at = firstIdx(a.test);
  ok(at === TOP,
     `"${a.name}" says "highest" and first fires at the top of the ladder — idx ${TOP} '${PRESTIGE_LEVELS[TOP].title}' (fires at ${at})`);
}

console.log(fails ? `\n✗ ${fails} — a prestige achievement fires on the wrong rank` : '\n✓ every prestige achievement fires on the rank it names, and "highest" means the top');
if (fails) process.exitCode = 1;
