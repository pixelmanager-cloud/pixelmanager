// The PROMPT CORPUS: every bank that composes a per-turn scenario prompt. These are being authored up to
// ~30x their original size (PT-404: at the original 489 lines, the fifth heir of a dynasty was re-reading
// 95% of prompt sentences). At that scale two things go wrong silently — the same line gets written twice
// across waves, and one key quietly lags the rest so a whole chapter or moment-kind stays stale. This
// reports both, and fails on duplicates.
import { KIND_SETUP } from '../../shared/src/prompts/kind_setup.js';
import { DEMAND } from '../../shared/src/prompts/demand.js';
import { FRAME_BY_CHAPTER } from '../../shared/src/prompts/frame.js';
import { CHILD_SETUP } from '../../shared/src/prompts/child_setup.js';
import { SETTINGS } from '../../shared/src/prompts/settings.js';
import { EVENT_PREFIX } from '../../shared/src/prompts/event_prefix.js';
import { BIG_SETTINGS } from '../../shared/src/prompts/big_settings.js';

const BANKS: Record<string, Record<string, string[]> | string[]> = {
  KIND_SETUP, DEMAND, FRAME_BY_CHAPTER, CHILD_SETUP, SETTINGS, EVENT_PREFIX, BIG_SETTINGS,
};
const BASELINE = 489;              // the corpus size when PT-404 was measured
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

let total = 0, dupes = 0;
const seen = new Map<string, string>();
const rows: Array<[string, string, number]> = [];
for (const [bank, data] of Object.entries(BANKS)) {
  const keys = Array.isArray(data) ? { _: data } : data;
  for (const [key, lines] of Object.entries(keys)) {
    total += lines.length;
    rows.push([bank, key, lines.length]);
    for (const l of lines) {
      const k = norm(l);
      if (!k) continue;
      const prev = seen.get(k);
      if (prev) { console.log(`  DUPLICATE  "${l.slice(0, 68)}"\n             in ${bank}.${key} — already in ${prev}`); dupes++; }
      else seen.set(k, `${bank}.${key}`);
    }
  }
}
rows.sort((a, b) => a[2] - b[2]);
console.log(`=== Prompt corpus — ${total} lines across ${rows.length} keys (baseline ${BASELINE}, ${(total / BASELINE).toFixed(1)}x) ===`);
console.log('  thinnest keys (these are what goes stale first):');
for (const [b, k, n] of rows.slice(0, 8)) console.log(`    ${String(n).padStart(4)}  ${b}.${k}`);
const median = rows[Math.floor(rows.length / 2)][2];
console.log(`  median key: ${median} lines · widest: ${rows[rows.length - 1][2]}`);
console.log(dupes ? `\n⚠ ${dupes} duplicate line(s) — an authoring wave repeated itself` : `\n✓ no duplicated lines across the corpus`);
if (dupes) process.exitCode = 1;
