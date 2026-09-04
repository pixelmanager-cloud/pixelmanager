// MATCH-DAY PROSE MUST NOT LAND ON A TRAINING SESSION.
//
// narratePlay computes `bigOccasion = (ctx.kind ?? 'match') === 'match' && ctx.stakes >= 2` and uses it to
// pick the SETTING, under a comment that states the rule outright: big-occasion settings describe a match,
// "so they must not be stamped on a training session or an off-pitch moment just because the stakes are
// high — the same bleed PT-15 fixed for moment labels."
//
// Forty lines later, three sibling beats ignore ctx.kind entirely and gate on raw stakes: the HUGE_TENSION
// build-up, the HUGE_AFTERMATH remembered-by line, and the stakes-2 BIG_BEAT. Every line in those banks
// describes a match — "Ninety minutes of football have come down to this one moment.", "The whole stadium
// seems to hold its breath at once.", "He will know before he reaches the tunnel exactly what he got wrong."
// So a high-stakes TRAINING session gets cup-final prose wrapped around a drill.
//
// The fix reuses the flag three lines up rather than inventing a second one. Note the stakes-2 gate keeps
// `rng() < 0.7` FIRST and tests bigOccasion after it: short-circuiting before the draw would consume a
// different number of rng values on non-match turns and shift every downstream pick in the career.
//
// Run: `npx tsx tools/playtest/occasion_bleed.ts`
import { readFileSync } from 'node:fs';
import { narratePlay } from '../../shared/src/narrate.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== Big-occasion beats stay on match days ===');

// THE THREE BEAT BANKS, READ OUT OF THE SOURCE. An earlier draft of this probe matched a hand-written list
// of match words ("stadium", "the tunnel", "ninety minutes") and found 580 bleeds; the fix took it to 184.
// The remaining 184 are NOT these beats — they come from the per-chapter SETTINGS banks, which are used for
// match and non-match moments alike and are themselves written as match settings ("At a stadium built in the
// eighties and not touched since"). That is a real and separate content problem, logged as its own finding.
// A probe that fails on it would be asserting something this fix does not claim, so this one matches the
// three banks' ACTUAL LINES instead of a proxy for them.
const src = readFileSync('shared/src/narrate.ts', 'utf8');
function bankLines(name: string): string[] {
  const i = src.indexOf(`const ${name}`);
  if (i < 0) return [];
  const end = src.indexOf('\n];', i);
  return [...src.slice(i, end).matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"))
    .filter((l) => l.length > 25);
}
const BEATS = [...bankLines('HUGE_TENSION'), ...bankLines('HUGE_AFTERMATH'), ...bankLines('HUGE_AFTERMATH_BAD'), ...bankLines('BIG_BEAT')];
console.log(`  ..   ${BEATS.length} line(s) parsed from HUGE_TENSION / HUGE_AFTERMATH / HUGE_AFTERMATH_BAD / BIG_BEAT`);
ok(BEATS.length > 60, `the beat banks were actually parsed (${BEATS.length} lines)`);

const CHAPTERS = ['Grassroots', 'Academy', 'Scholar', 'Youth Team', 'Breakthrough', 'First Team', 'Establishing'];
const KINDS = ['training', 'social'] as const;

let scanned = 0;
const bled: string[] = [];
for (const kind of KINDS) {
  for (const stakes of [2, 3] as const) {
    for (let seed = 0; seed < 900; seed++) {
      const chapter = CHAPTERS[seed % CHAPTERS.length];
      const out = narratePlay('Drill', ['teamwork'], (seed % 5) * 25, {
        age: 18 + (seed % 12), chapter, stakes, personalityId: 'grafter', kind,
        turn: seed % 120, seed, careerSeed: seed * 7 + 1,
      });
      scanned++;
      const hit = BEATS.find((l) => out.includes(l));
      if (hit) bled.push(`kind=${kind} stakes=${stakes} seed=${seed}: "${hit.slice(0, 70)}"`);
    }
  }
}
console.log(`  ..   ${scanned} non-match beat(s) rendered across ${KINDS.length} kind(s) x 2 stakes levels`);
// VACUITY GUARDS. The sweep must actually run, and the same banks must still appear where they belong —
// otherwise a probe that matches nothing at all reports clean.
ok(scanned > 3000, `the sweep actually ran (${scanned} samples)`);
let onMatch = 0;
for (let seed = 0; seed < 900; seed++) {
  const out = narratePlay('Drill', ['teamwork'], (seed % 5) * 25, {
    age: 24, chapter: 'Establishing', stakes: 3, personalityId: 'grafter', kind: 'match',
    turn: seed % 120, seed, careerSeed: seed * 7 + 1,
  });
  if (BEATS.some((l) => out.includes(l))) onMatch++;
}
console.log(`  ..   the same banks on kind='match' stakes=3: ${onMatch}/900 — still emitted where they belong`);
ok(onMatch > 400, 'match-day beats still fire on match days (otherwise this probe matches nothing by accident)');

for (const b of bled.slice(0, 6)) console.log(`       ${b}`);
ok(bled.length === 0, `no training or off-pitch beat borrows a match-day occasion line (${bled.length} of ${scanned})`);

console.log(fails === 0 ? '\n✓ occasion prose stays on the occasion' : `\n✗ ${fails} problem(s)`);
process.exit(fails === 0 ? 0 : 1);
