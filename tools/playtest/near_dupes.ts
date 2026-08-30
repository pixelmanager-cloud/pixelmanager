// ── NEAR-DUPLICATES THE EXACT-MATCH PROBES CANNOT SEE ────────────────────────────────────────────────
// prompt_corpus.ts normalises and compares EXACTLY, so it is blind to the thing a reader actually
// notices: the same line with a word changed. Measured when this was written, 752 pairs at Jaccard >= 0.6
// on content words WITHIN a single draw pool, 539 of them in KIND_SETUP alone.
//
// The mechanism is visible in the index deltas: of the KIND_SETUP pairs, over half sit within 60 slots of
// each other and the histogram peaks at deltas 38-52 — a block of lines produced by walking the previous
// block and inserting an adverb. The tell is in the prose too: precisely, genuinely, entirely, unusually,
// in fact, at all, very. `pickByTurn` strides the pool, so two lines 44 apart can land four turns apart.
import { KIND_SETUP } from '../../shared/src/prompts/kind_setup.js';
import { SETTINGS } from '../../shared/src/prompts/settings.js';
import { FRAME_BY_CHAPTER } from '../../shared/src/prompts/frame.js';
import { DEMAND } from '../../shared/src/prompts/demand.js';
import { CHILD_SETUP } from '../../shared/src/prompts/child_setup.js';

// every pool a line can be DRAWN from, flattened to `bankName.poolKey -> lines`
const PROMPT_BANKS: Record<string, string[]> = {};
for (const [name, bank] of Object.entries({ KIND_SETUP, SETTINGS, FRAME_BY_CHAPTER, DEMAND, CHILD_SETUP })) {
  for (const [key, lines] of Object.entries(bank as Record<string, unknown>)) {
    if (Array.isArray(lines)) PROMPT_BANKS[`${name}.${key}`] = lines as string[];
  }
}

const STOP = new Set(['the', 'a', 'an', 'and', 'to', 'of', 'in', 'is', 'it', 'that', 'his', 'him', 'he',
  'for', 'on', 'with', 'as', 'at', 'by', 'has', 'have', 'had', 'been', 'be', 'was', 'were', 'this']);
const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z\s{}]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
const jaccard = (a: Set<string>, b: Set<string>) => {
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
};

// TWO BARS. `THRESH` is what gets REPORTED — 0.6 catches genuine variations, many of which are legitimate
// texture and should not be deleted. `FAIL_AT` is what gets ENFORCED: at 0.85 and above the two lines are
// the same sentence with a word swapped ("A kit man is retiring after thirty-one years and nobody has
// organised anything." / "The kit man is..."), which no reader experiences as variety. 121 such lines were
// removed; the bar keeps them from coming back.
const THRESH = Number(process.env.DUPE_T ?? 0.6);
const FAIL_AT = Number(process.env.DUPE_FAIL ?? 0.85);
let pairs = 0, lines = 0;
const worst: Array<{ score: number; pool: string; a: string; b: string; delta: number }> = [];
for (const [pool, bank] of Object.entries(PROMPT_BANKS as Record<string, string[]>)) {
  if (!Array.isArray(bank)) continue;
  lines += bank.length;
  const sets = bank.map(words);
  for (let i = 0; i < bank.length; i++) {
    for (let j = i + 1; j < bank.length; j++) {
      const s = jaccard(sets[i], sets[j]);
      if (s >= THRESH) { pairs++; worst.push({ score: s, pool, a: bank[i], b: bank[j], delta: j - i }); }
    }
  }
}
worst.sort((x, y) => y.score - x.score);
console.log(`[near-dupes] ${pairs} pair(s) at Jaccard >= ${THRESH} across ${lines} lines in ${Object.keys(PROMPT_BANKS).length} pools`);
for (const w of worst.slice(0, 10)) {
  console.log(`\n  ${w.score.toFixed(2)}  ${w.pool}  (${w.delta} apart)`);
  console.log(`    ${w.a}`);
  console.log(`    ${w.b}`);
}
const hard = worst.filter((w) => w.score >= FAIL_AT);
if (pairs) console.log(`\n⚠ ${pairs} near-duplicate pair(s) at >= ${THRESH} — a reader notices "this again" long before an exact-match probe fires`);
if (hard.length) {
  console.log(`\n✗ ${hard.length} pair(s) at >= ${FAIL_AT} — the same sentence with a word swapped:`);
  for (const w of hard.slice(0, 8)) console.log(`    ${w.pool}\n      ${w.a}\n      ${w.b}`);
  process.exit(1);
}
console.log(`✓ no pair at or above ${FAIL_AT} — nothing in the corpus is another line with a word swapped`);
