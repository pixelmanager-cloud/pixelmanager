// THE SHOWSTOPPER NOTE MUST BE TRUE ABOUT THE COMMERCIAL CHAIN THAT EXISTS.
//
// career.ts's CUT block records why `showstopper` was never wired: its hook `squadMarketability` ->
// `sponsorIncome` was BROKEN, so `brandMult` was "pinned at 1.0" and the trait would have hung off a dead
// number. That was true when written and stopped being true when commercial income was re-pointed: api.ts
// now reads the bloodline star's OWN token marketability (main.ts passes `starId`, api.ts looks the token
// up, `sponsorIncome` multiplies by it), and the multiplier measurably moves — §0 re-measures the spread
// every run rather than quoting it. Left uncorrected, the note keeps a trait cut on a premise the code
// refutes, and the next author reads "repair that chain first" about a chain that already runs.
//
// The residue is the mirror image: `squadMarketability` has no production caller left, yet client/src/api.ts
// still imports it and the function's own docstring still reads as if it were the live brand input. §4
// polices both against a MEASURED caller count, so wiring it back turns this green instead of red.
//
// SCOPE, deliberately narrow: this one chain. client/src/api.ts's `@fm/shared` import carries other unused
// bindings (transferList, sellValue, incomingBid, contractDemand, wageForLength, deriveMatchStats,
// renownBidMult the day this was written) — that is a DIFFERENT finding, and sweeping it in here would make
// this probe red for a reason its header cannot explain, the mistake arc_gate_comment_truth.ts documents.
//
// Run: `npx tsx tools/playtest/sponsor_brand_comment_truth.ts`
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { sponsorIncome } from '../../shared/src/facilities.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== career.ts / facilities.ts describe the commercial chain that exists ===');

// ── 0. THE MEASUREMENT, taken from the function rather than quoted. A top-flight L10 Commercial Dept with
// the trophy term capped out — the same corner of the curve the note argues about.
const lo = sponsorIncome(10, 9, 20, 1);
const neutral = sponsorIncome(10, 9, 20, 10);
const hi = sponsorIncome(10, 9, 20, 20);
const spreadPct = Math.round((hi / lo - 1) * 100);
console.log(`  ..   measured sponsorIncome(L10, tierIdx 9, 20 titles): ${lo} at marketability 1, ${neutral} at 10, ${hi} at 20 (+${spreadPct}%)`);
// VACUITY GUARD. If sponsorIncome ever returns 0 across the board (a level guard moved, say), lo/hi are
// both 0, the spread is NaN and every "the chain is live" branch below decides on nothing. Mutation-tested
// by making sponsorIncome return 0: this line goes red first and the prose checks never get to lie.
ok(neutral > 1000 && lo > 0, 'sponsorIncome actually paid out (not a zero-of-zero pass)');
const brandLive = lo > 0 && hi > lo;

// ── 1. THE PREMISE, read from the source rather than assumed: the star's marketability really reaches
// sponsorIncome in a live save. If any hop goes away, this goes red FIRST and says so, instead of §2
// policing prose about a chain that no longer runs.
/** Code only. A bare `//` strip would eat `https://...`, hence the no-colon guard. Same split as arc_gate_comment_truth.ts. */
const codeOf = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
/** Comment text only, so prose is never mistaken for code. */
const commentsOf = (src: string) =>
  [...src.matchAll(/\/\*[\s\S]*?\*\//g)].map((m) => m[0])
    .concat([...src.matchAll(/^[ \t]*\/\/[^\n]*/gm)].map((m) => m[0])).join('\n');
/** Flattened to one line, because every claim below is wrapped across three or four source lines. */
const flatten = (s: string) => s.split('\n').map((l) => l.replace(/^\s*(?:\/\*\*?|\*\/|\*|\/\/)\s?/, '')).join(' ').replace(/\s+/g, ' ');

const career = readFileSync('shared/src/career.ts', 'utf8');
const api = readFileSync('client/src/api.ts', 'utf8');
const main = readFileSync('client/src/main.ts', 'utf8');
const facilities = readFileSync('shared/src/facilities.ts', 'utf8');
const apiCode = codeOf(api);
const hops: { what: string; found: boolean }[] = [
  { what: 'main.ts hands the star id to spSeasonReward', found: codeOf(main).includes('starId: m.starId') },
  { what: "api.ts reads that token's marketability", found: apiCode.includes('const starMarketability = starTok?.marketability ?? 10;') },
  { what: 'api.ts feeds it to seasonFacilityIncome', found: /\n\s*starMarketability,\s*\n/.test(apiCode) },
];
for (const h of hops) ok(h.found, `premise: ${h.what}`);
const wired = hops.every((h) => h.found);
if (!wired) console.log('  ..   a hop moved or went away — re-read this probe before trusting the failures below');

// ── 2. THE CUT NOTE MAY NOT CALL A LIVE CHAIN DEAD. Each pattern is tied to the fact that refutes it, so
// the next reader checks the CLAIM, not the regex — and the direction flips: if §0/§1 ever show the chain
// really is dead again, the note is required to say so rather than merely allowed to.
const bStart = career.indexOf("//   - showstopper");
const bEnd = career.indexOf('export const TRAITS', bStart);
ok(bStart >= 0 && bEnd > bStart, "career.ts's showstopper CUT note was located");
const note = bStart >= 0 && bEnd > bStart ? flatten(commentsOf(career.slice(bStart, bEnd))) : '';
console.log(`  ..   ${note.length} chars of showstopper note read from career.ts`);
ok(note.length >= 200, 'the CUT note was actually parsed (not a zero-of-zero pass)');

const REFUTED: { re: RegExp; what: string }[] = [
  { re: /`?brandMult`? is pinned/i, what: `brandMult is pinned at 1.0 — it measures ${(lo / neutral).toFixed(2)}x to ${(hi / neutral).toFixed(2)}x across the marketability range` },
  { re: /that chain is broken/i, what: 'the marketability -> sponsorIncome chain is broken — §1 walks all three hops of it' },
  { re: /repair that chain first/i, what: 'the chain must be repaired before the trait can be wired — it was repaired' },
];
const restated = REFUTED.filter((p) => p.re.test(note));
for (const p of restated) console.log(`       the CUT note still claims ${p.what}`);
if (brandLive && wired) ok(restated.length === 0, `the showstopper note calls nothing dead that the code runs (${restated.length} found)`);
else ok(restated.length === REFUTED.length, 'the chain really is dead — the CUT note must say so (it is the only honest reading)');

// ── 3. AND WHERE IT QUANTIFIES THE HOOK IT MUST QUOTE THE MEASURED SPREAD. This is what correcting the
// prose alone would not have caught: a note that says "brandMult is live" beside a re-tuned sponsorIncome
// is the same defect one word softer. When the curve moves this goes red naming the block — the fix is to
// paste the `..` figures from §0 into the note, not to loosen this check.
const nums = note.replace(/(\d),(\d)/g, '$1$2');
if (brandLive && wired) {
  ok(new RegExp(`\\b${lo}\\b`).test(nums), `the note quotes the measured floor (${lo} at marketability 1)`);
  ok(new RegExp(`\\b${hi}\\b`).test(nums), `the note quotes the measured ceiling (${hi} at marketability 20)`);
  ok(new RegExp(`\\b${spreadPct}\\b`).test(nums), `the note quotes the measured spread (${spreadPct}%)`);
}

// ── 4. THE RESIDUE. `squadMarketability` is the helper the chain used to run through. Count its real call
// sites before saying anything about it: production is everything under client/src and shared/src (the
// qa_*.ts harnesses sit one level up, in client/ and shared/, and are deliberately not counted — they are
// why the function still exists).
const tsFiles = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? tsFiles(p) : p.endsWith('.ts') ? [p] : [];
});
const prod = [...tsFiles('client/src'), ...tsFiles('shared/src')];
ok(prod.length >= 10, `production sources were actually walked (${prod.length} files, not a zero-of-zero pass)`);
let callers = 0;
for (const f of prod) {
  const code = codeOf(readFileSync(f, 'utf8')).replace('export function squadMarketability', '');   // the definition is not a call
  const n = (code.match(/\bsquadMarketability\s*\(/g) ?? []).length;
  if (n) console.log(`       ${f} calls squadMarketability ${n}x`);
  callers += n;
}
console.log(`  ..   squadMarketability has ${callers} production call site(s)`);

// 4a. An import with no call is dead wiring that reads as live wiring. Stated as an implication, so
// re-hooking the helper into api.ts turns this green rather than forbidding the name outright.
const importsIt = /\bsquadMarketability\b/.test(apiCode);
ok(!importsIt || callers > 0, `client/src/api.ts imports squadMarketability only if something calls it (imported: ${importsIt}, callers: ${callers})`);

// 4b. And the docstring must match that count in both directions — an unwarned dead helper misleads, and a
// "nobody calls this" warning on a live one misleads just as badly.
const at = facilities.indexOf('export function squadMarketability(');
const dStart = at < 0 ? -1 : facilities.lastIndexOf('/**', at);
ok(at >= 0 && dStart >= 0, 'the squadMarketability docstring was located in facilities.ts');
const doc = at >= 0 && dStart >= 0 ? facilities.slice(dStart, at) : '';
console.log(`  ..   ${doc.length} chars of docstring read for squadMarketability`);
ok(doc.length >= 40, 'the docstring was actually read (not a zero-of-zero pass)');
const warns = /nothing in production calls this/i.test(doc);
ok(warns === (callers === 0), `the docstring's caller claim matches the count (warns: ${warns}, callers: ${callers})`);

console.log(fails === 0 ? '\nPASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
