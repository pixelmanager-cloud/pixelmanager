// A STAKES-3 SETTING MUST NOT NAME THE COMPETITION — THE LABEL BESIDE IT IS A SEPARATE DRAW.
//
// shared/src/prompts/big_settings.ts states the law in its own header, for the stakes-2 bank: "ATMOSPHERE
// ONLY — never a fixture identity or a venue… The label and this pool are chosen independently, so anything
// here that claims what KIND of game it is will eventually contradict the screen above it… Tone is safe;
// facts are not. (PT-155/PT-808)". BIG_SETTINGS was swept to obey it. HUGE_SETTINGS — the OTHER ARM of the
// same ternary in narratePlay (`bigOccasion && ctx.stakes === 3 ? pickByTurn(HUGE_SETTINGS…) : bigOccasion
// ? pickByTurn(BIG_SETTINGS…)`) — was never swept, and named a fixture on 6 of its 32 lines.
//
// The two draws really are independent: career.ts picks the label with `HUGE_MOMENTS[Math.floor(rng() *
// HUGE_MOMENTS.length)]`, narratePlay strides HUGE_SETTINGS off the turn. And the label is not decoration —
// tokens.ts's matchContext uses it as the COMPETITION FIELD of the matchday header (`const comp = big ??
// …`), so "🏟️ Home · The Match That Decides Who Goes Down" was followed, one click later, by "In the cup
// final, the whole ground holding its breath, he…".
//
// WHY A FLAT BAN AND NOT A PAIRWISE RULE: HUGE_MOMENTS spans several mutually exclusive competitions (a cup
// tie, a league title race, a promotion play-off, a relegation decider, a continental night), so a setting
// naming ANY of them is contradicted by every label naming another. The pairs are still counted below,
// because a ban nobody has costed gets argued with.
//
// THE THIRD ARM IS NOT A THIRD INSTANCE. SETTINGS[chapter] fires only when `bigOccasion` is false, which is
// exactly when career.ts leaves `moment` null — there is no ★ label on screen for it to contradict. Two
// banks are subject to this law, not three, and only one of them had been swept.
//
// Run: `npx tsx tools/playtest/huge_setting_fixture.ts`
// Mutation-test: point NARRATE_SRC at a copy with one fixture line put back — this must go red.
import { readFileSync } from 'node:fs';
import { BIG_SETTINGS } from '../../shared/src/prompts/big_settings.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== Stakes-3 settings name no competition ===');

// Both banks are module-private, so they are read out of the source the way occasion_bleed.ts reads the
// beat banks — a probe that imported a copy would stop tracking the bank it is meant to guard.
function bank(file: string, name: string): string[] {
  const src = readFileSync(file, 'utf8');
  const i = src.indexOf(`const ${name} = [`);
  if (i < 0) return [];
  const end = src.indexOf('];', i);
  return [...src.slice(i, end).matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"));
}
const SETTINGS3 = bank(process.env.NARRATE_SRC ?? 'shared/src/narrate.ts', 'HUGE_SETTINGS');
const MOMENTS = bank('shared/src/career.ts', 'HUGE_MOMENTS');
console.log(`  ..   ${SETTINGS3.length} HUGE_SETTINGS line(s), ${MOMENTS.length} HUGE_MOMENTS label(s), ${BIG_SETTINGS.length} BIG_SETTINGS line(s) parsed`);
ok(SETTINGS3.length > 20, `HUGE_SETTINGS was actually parsed (${SETTINGS3.length} lines)`);
ok(MOMENTS.length > 5, `HUGE_MOMENTS was actually parsed (${MOMENTS.length} labels)`);

// THE VOCABULARY IS THE LABEL BANK'S, NOT A WISHLIST. Every pattern here must name a competition that
// HUGE_MOMENTS actually draws — the guard below enforces that, so the table cannot rot into a list of
// words nothing on screen ever says. 'final' counts only as the HEAD noun (end of label, or before
// punctuation): BIG_SETTINGS' "by the final quarter" is the adjective and claims no competition.
const COMPETITION: Record<string, RegExp> = {
  cup: /\bcup\b/i,
  title: /\btitle\b/i,
  promotion: /\bpromotion\b|\bplay-?offs?\b/i,
  derby: /\bderb(y|ies)\b/i,
  continental: /\bcontinental\b|\beuropean\b/i,
  relegation: /\brelegation\b|\bgo(es|ing)? down\b/i,
  silverware: /\btroph(y|ies)\b|\bfinals?\b(?!\s+[a-z])/i,
};
const named = (s: string) => Object.keys(COMPETITION).filter((k) => COMPETITION[k].test(s));

// VACUITY GUARD 1 — the table must still match the labels it was derived from. Blank a pattern out and
// this goes red before the ban below can pass by matching nothing.
const unanchored = Object.keys(COMPETITION).filter((k) => !MOMENTS.some((m) => COMPETITION[k].test(m)));
const labelled = MOMENTS.filter((m) => named(m).length);
console.log(`  ..   ${labelled.length}/${MOMENTS.length} HUGE_MOMENTS labels carry a competition, e.g. ${labelled.slice(0, 3).map((m) => `"${m}" [${named(m)}]`).join(', ')}`);
ok(unanchored.length === 0, `every pattern is anchored in a real HUGE_MOMENTS label (${unanchored.join(', ') || 'all 7'})`);
ok(labelled.length >= 5, `the table demonstrably classifies label text (${labelled.length} of ${MOMENTS.length})`);

// VACUITY GUARD 2 — the swept sibling, under the identical table. BIG_SETTINGS obeys this law today, which
// is what proves the rule is satisfiable in this register and the patterns are not merely over-broad.
const bigHits = BIG_SETTINGS.filter((l) => named(l).length);
for (const l of bigHits.slice(0, 4)) console.log(`       BIG_SETTINGS: "${l}" [${named(l)}]`);
ok(bigHits.length === 0, `BIG_SETTINGS, already swept for PT-155/PT-808, stays clean (${bigHits.length} of ${BIG_SETTINGS.length})`);

// THE ASSERTION.
const hits = SETTINGS3.filter((l) => named(l).length);
let pairs = 0;
for (const s of hits) for (const m of MOMENTS) {
  const a = named(s), b = named(m);
  if (b.length && !a.some((k) => b.includes(k))) pairs++;
}
console.log(`  ..   ${pairs} (label, setting) pair(s) out of ${SETTINGS3.length * MOMENTS.length} state two different competitions`);
for (const l of hits) console.log(`       HUGE_SETTINGS: "${l}" [${named(l)}]`);
ok(hits.length === 0, `no stakes-3 setting names a competition the ★ label may contradict (${hits.length} of ${SETTINGS3.length})`);

console.log(fails === 0 ? '\n✓ the biggest turn in the game states one competition, not two' : `\n✗ ${fails} problem(s)`);
process.exit(fails === 0 ? 0 : 1);
