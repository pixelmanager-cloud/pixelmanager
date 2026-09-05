// THE ACADEMY MUST NOT SELL PEDIGREE AS THE HEIR'S CEILING.
//
// The intro above the prospect list said "a higher pedigree means a stronger natural ceiling to develop
// toward", and the ★ rating printed on every row directly beneath it comes from `rebornPotential`
// (shared/src/tokens.ts), which averages the three inherited gene CEILINGS and never reads `t.pedigree`.
// Its own docstring records why the pedigree term was taken out: it "added exactly zero discrimination,
// because every son of one succession is written with the SAME pedigree". So the screen named the wrong
// vehicle for a real mechanism — a decorated father genuinely does lift his son's ceiling, but through
// `legacyBoost().ceilingLift` → `inheritGenes`, never through the percentage on the card.
//
// THE SHARPEST WITNESS IS THE SIBLING SET, and it is on this exact screen. `succeed()` writes every
// brother with `pedigree: rf.pedigree ?? 0` — one number for the whole set — and `prospects()` rates each
// of them through `rebornPotential` separately, so the Academy routinely lists brothers at an identical
// pedigree % on different star ratings, immediately under the sentence saying the first number produces
// the second. Half of all multi-heir sets, measured in §1.
//
// WHAT THIS DOES NOT CLAIM is that pedigree does nothing, or that it is uncorrelated with the ceiling.
// `legacyBoost` returns `pedigree` and `ceilingLift` from the SAME father's record, so across a dynasty
// the two genuinely rise together. The false thing is the CAUSAL edge the copy asserts — which is why §1
// measures the function instead of a correlation, and why §3 forbids clearing §2 by deleting the sentence
// and leaving a row that prints "Potential 4 · pedigree 23%" with no account of either number.
//
// §4 holds the code to the same standard: the same gloss was written on the succession's THE NAME bump,
// one of three IRREVERSIBLE will choices, which is the worst place in the game to overstate an effect.
// F-186 corrected the income bullet on this panel and nobody re-read the pedigree bullet beside it; a
// probe is what stops a third pass.
//
// Run: `npx tsx tools/playtest/pedigree_ceiling_truth.ts`
import { readFileSync } from 'node:fs';
import { rebornPotential } from '../../shared/src/tokens.js';
import { mintHeirs, heirCount } from '../../shared/src/bloodline.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const flat = (s: string) => s.replace(/\s+/g, ' ').trim();
const stripTags = (s: string) => s.replace(/<[^>]*>/g, '');
/** The consecutive `//` run directly above a source offset — the comment that annotates that line. */
const commentAbove = (src: string, at: number): string => {
  const lines = src.slice(0, at).split('\n');
  lines.pop();                                  // the partial line the offset itself sits on
  const run: string[] = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const c = /^[ \t]*\/\/(.*)$/.exec(lines[i]);
    if (!c) break;
    run.unshift(c[1]);
  }
  return flat(run.join(' '));
};

console.log('=== the Academy tells the truth about what pedigree buys ===');

// ── 1. THE PREMISE, measured off the engine rather than assumed. If pedigree is ever genuinely wired into
// the star rating, this section reds FIRST and names it, rather than §2 quietly forbidding true prose.
const GENES = { pace: { floor: 9, ceiling: 15 }, strength: { floor: 8, ceiling: 14 }, stamina: { floor: 10, ceiling: 16 } };
const starsAt = (genes: unknown, pedigree: number) =>
  rebornPotential({ genes_json: JSON.stringify(genes), pedigree } as any).stars;
const sweep = new Set<number>();
for (let i = 0; i <= 100; i++) sweep.add(starsAt(GENES, i / 100));
console.log(`  ..   pedigree 0.00→1.00 on fixed genes, 101 samples — ★ ratings seen: ${[...sweep].join(', ')}`);
ok(sweep.size === 1, 'rebornPotential still cannot see pedigree at all (the edge §2 forbids asserting)');
// MUTATION GUARD: a rebornPotential hardcoded to a constant would satisfy the line above while meaning
// nothing. Moving the GENES has to move the rating, or §1 is measuring a dead function.
const byGenes = new Set<number>();
for (let c = 12; c <= 19; c++) byGenes.add(starsAt({ pace: { floor: 9, ceiling: c }, strength: { floor: 8, ceiling: c }, stamina: { floor: 10, ceiling: c } }, 0.5));
ok(byGenes.size >= 4, `and the rating does move on the genes — ${byGenes.size} distinct ★ over gene ceilings 12..19`);

// The sibling set is the witness the player actually sees: one shared pedigree, separate star ratings.
let multi = 0, differ = 0;
for (let s = 0; s < 2000; s++) {
  const seed = (s * 2654435761) >>> 0;
  const n = heirCount(seed, 1);
  if (n < 2) continue;
  multi++;
  const brothers = mintHeirs(GENES as any, seed, n, s % 4, seed);
  const rated = new Set(brothers.map((h) => starsAt(h.genes, 0.42)));  // ONE pedigree for all of them, as succeed() writes
  if (rated.size > 1) differ++;
}
console.log(`  ..   ${differ}/${multi} multi-heir sets (${(100 * differ / Math.max(1, multi)).toFixed(1)}%) put brothers on different ★ at one shared pedigree`);
ok(multi >= 200, `enough multi-heir sets were minted to measure (${multi} — not a zero-of-zero pass)`);
ok(differ > 0, 'the Academy really can list brothers at an identical pedigree % on different ★');

// ...and both halves of that are still wired the way the measurement assumes.
const api = readFileSync('client/src/api.ts', 'utf8');
ok(/pedigree: rf\.pedigree \?\? 0/.test(api), 'succeed() still stamps one shared pedigree on every brother in the set');
const p0 = api.indexOf('  prospects: async () => {');
const p1 = api.indexOf('  genesis: async () => {', p0 + 1);
ok(p0 >= 0 && p1 > p0, 'the Academy prospect list was found in api.ts');
ok(p0 >= 0 && p1 > p0 && /rebornPotential\(t\)/.test(api.slice(p0, p1)),
  'and it still rates each prospect through rebornPotential, pedigree unused');
if (fails) console.log('  ..   the pedigree/potential wiring moved — re-read this probe before trusting §2');

// ── 2. THE COPY MAY NOT ASSERT AN EDGE §1 REFUTES. Each pattern carries the fact that kills it, so the
// next reader checks the CLAIM rather than the regex.
const main = readFileSync('client/src/main.ts', 'utf8');
const notes = [...main.matchAll(/<span class="scout-note">([\s\S]*?)<\/span>/g)].map((m) => m[1]);
ok(notes.length === 1, `the Academy's pedigree note was found (${notes.length} scout-note span(s), expected 1)`);
const note = flat(stripTags(notes[0] ?? ''));
console.log(`  ..   note: ${note}`);
ok(note.length >= 60, 'and it is still a real sentence, not an emptied span');
const FALSE_EDGE: { re: RegExp; what: string }[] = [
  { re: /\bhigher pedigree\b[^.]{0,70}\b(?:ceiling|potential|better|stronger|higher|further)\b/i,
    what: 'more pedigree means a higher ceiling — rebornPotential never reads pedigree (§1)' },
  { re: /\bpedigree\b[^.]{0,45}\b(?:means|sets|gives|decides|determines|drives|buys)\b[^.]{0,45}\b(?:ceiling|potential|upside|how good|how far)\b/i,
    what: 'pedigree produces the ★ — brothers share one pedigree on separate ratings (§1)' },
  { re: /\b(?:ceiling|potential|upside)\b[^.]{0,35}\b(?:comes from|from|set by|driven by|down to)\b[^.]{0,25}\b(?:his |the )?pedigree\b/i,
    what: 'the ceiling comes from pedigree — it comes from the inherited gene ceilings (§1)' },
];
const asserted = FALSE_EDGE.filter((f) => f.re.test(note));
for (const a of asserted) console.log(`       the Academy note still claims ${a.what}`);
ok(asserted.length === 0, `the Academy note claims no ceiling the pedigree % cannot deliver (${asserted.length} found)`);

// ── 3. AND THE PLAYER STILL HAS TO BE TOLD WHAT THE TWO NUMBERS ARE. Emptying the sentence clears §2 and
// leaves a row printing "Potential 4 · pedigree 23%" with neither number explained — the same trap, one
// step quieter. These name the CONCEPTS rather than a phrasing, so the prose stays free.
ok(/\bpedigree\b/i.test(note), 'the note still explains the pedigree % that every row beneath it prints');
ok(/\bgene|\binherit/i.test(note), 'and still points the ★ at the genes he inherits, where the ceiling really comes from');

// ── 4. THE SAME CLAIM, WRITTEN INTO THE CODE, ON AN IRREVERSIBLE CHOICE. "THE NAME" is sold to the player
// as a head-start, and the comment on the line that grants it called that head-start a potential one.
const bump = api.indexOf("if (inheritance === 'name') rf.pedigree =");
ok(bump > 0, "the succession's THE NAME pedigree bump was found in api.ts");
const above = bump > 0 ? commentAbove(api, bump) : '';
console.log(`  ..   comment on the bump: ${above.slice(0, 130)}${above.length > 130 ? '…' : ''}`);
ok(above.length >= 40, 'it still carries a comment (deleting it is not the fix either)');
ok(!/\bpedigree \(potential\)/i.test(above), 'which no longer bills the +0.15 as a potential head-start');
ok(/\brebornPotential\b/.test(above), 'and names the function that ignores pedigree, so the claim cannot come back');

console.log(fails ? `\n✗ ${fails} — the Academy sells a head-start the star rating cannot deliver` : '\n✓ pedigree is described as what it actually buys');
if (fails) process.exitCode = 1;
