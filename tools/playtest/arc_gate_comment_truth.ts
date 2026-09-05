// THE ARC GATE'S COMMENTS MUST BE TRUE ABOUT THE ARC LIBRARY.
//
// `ArcChoice.requires` is a real gate. career.ts's current() filters a beat's choices by it on every arc,
// and the authored choices that gate on it — 116 across 89 flags the day this was written, re-measured at
// run time below — rely on that filter to hide a payoff the career never earned.
// Three comments beside it said the opposite: career.ts's arcTags block called it safe for replay because
// "zero arcs currently use" it, the filter's own comment said nothing filtered today, and storyarc.ts still
// marked the field "(reserved)". All three were true when written and none was revisited when the content
// landed. A maintainer who believed them and deleted the filter would silently un-gate 116 authored
// choices — offering payoffs to careers that never earned the flag — and no test in the tree would notice.
//
// The same drift hit the NUMBERS. pickArcStart's docstring quoted "88 of the 90 `requires` choices" beside
// a library that holds 116, so correcting only the prose moves the contradiction one file over. This probe
// polices both: the claim, and the count. A red in §2 or §3 is fixed by correcting the comment it names; a
// red in §1 means the gate itself moved, and nothing below it should be believed until that is understood.
//
// SCOPE, deliberately narrow: the two files that describe this gate, shared/src/career.ts and
// shared/src/storyarc.ts. Other stale figures inside the very same blocks (career.ts's "732 of 1,650 arc
// options" counts `effect.tag`, and measures 761 of 1,766 today) are a DIFFERENT mechanism and a separate
// finding; pulling them in here makes this red for a reason it cannot explain — the mistake
// engine_comment_truth.ts documents next door.
//
// Run: `npx tsx tools/playtest/arc_gate_comment_truth.ts`
import { readFileSync } from 'node:fs';
import { ARCS } from '../../shared/src/storyarc.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== career.ts / storyarc.ts comments describe the arc gate that exists ===');

// ── 0. THE MEASUREMENT, taken from the library rather than quoted. Everything below compares prose to this.
let gated = 0; const flagSet = new Set<string>();
for (const a of ARCS as any[]) for (const b of Object.values(a.beats ?? {}) as any[]) for (const c of b.choices ?? [])
  if (c.requires) { gated++; flagSet.add(c.requires); }
const flags = flagSet.size;
console.log(`  ..   measured: ${gated} gated choice(s) across ${flags} flag(s) in ${(ARCS as any[]).length} arcs`);
// VACUITY GUARD. If ARCS ever fails to aggregate, `gated` is 0, every "quote the measured count" check
// below turns into "the comment must contain 0", and the probe passes over nothing. Mutation-tested by
// pointing the walk at an empty array: this line goes red first and the rest never gets to lie.
ok(gated >= 50, 'the arc library was actually walked (not a zero-of-zero pass)');

/** Comment text only, so prose is never mistaken for code. Same split as engine_comment_truth.ts. */
const commentsOf = (src: string) =>
  [...src.matchAll(/\/\*[\s\S]*?\*\//g)].map((m) => m[0])
    .concat([...src.matchAll(/^[ \t]*\/\/[^\n]*/gm)].map((m) => m[0])).join('\n');
/** Code only. A bare `//` strip would eat `https://...`, hence the no-colon guard. */
const codeOf = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
/** Flattened to one line, because every claim below is wrapped across two or three source lines. */
const flatten = (s: string) => s.split('\n').map((l) => l.replace(/^\s*(?:\/\*\*?|\*\/|\*|\/\/)\s?/, '')).join(' ').replace(/\s+/g, ' ');

const career = readFileSync('shared/src/career.ts', 'utf8');
const storyarc = readFileSync('shared/src/storyarc.ts', 'utf8');

// ── 1. THE PREMISE, read from the source rather than assumed: the gate is live. If someone deletes the
// filter, this goes red FIRST and says so, instead of §2 below policing prose about a gate that has gone.
const FILTER = 'beat.choices.filter((c) => !c.requires || this.arcTags.has(c.requires))';
const filterLive = codeOf(career).includes(FILTER);
ok(filterLive, "current() still filters a beat's choices by `requires` (the premise)");
if (!filterLive) console.log('  ..   the gate moved or went away — re-read this probe before trusting the failures below');

// ── 2. NO COMMENT MAY SAY THE GATE IS INERT. Each pattern is tied to the fact that refutes it, so the next
// reader checks the CLAIM, not the regex. Historical notes are fine and deliberately survive this: career.ts
// legitimately records that `requires` WAS marked "(reserved)" and evaluated nowhere before it was wired.
const prose = flatten(commentsOf(career)) + ' ' + flatten(commentsOf(storyarc));
console.log(`  ..   ${prose.length} chars of comment prose read from the two files`);
ok(prose.length >= 2000, 'the two files\' comments were actually parsed (not a zero-of-zero pass)');
const REFUTED: { re: RegExp; what: string }[] = [
  { re: /zero arcs (?:currently )?(?:use|carry) `requires`/i, what: `the library has no gated content — ${gated} choices carry \`requires\`` },
  { re: /nothing filters today/i, what: 'the filter never removes a choice — it runs on every arc beat, on every career' },
];
const restated = REFUTED.filter((p) => p.re.test(prose));
for (const p of restated) console.log(`       a comment still claims ${p.what}`);
ok(restated.length === 0, `no comment calls the \`requires\` gate inert (${restated.length} found)`);

// ── 2b. AND THE FIELD'S OWN COMMENT, which is TRAILING (`requires?: string;  // ...`) and so never reaches
// the line-start extractor above. Scoped to the ArcChoice block, whose only code is field declarations, so
// taking everything after a `//` cannot swallow a URL.
const ifStart = storyarc.indexOf('export interface ArcChoice {');
const ifEnd = storyarc.indexOf('\n}', ifStart);
ok(ifStart >= 0 && ifEnd > ifStart, 'the ArcChoice interface was located in storyarc.ts');
const fieldProse = storyarc.slice(ifStart, Math.max(ifStart, ifEnd)).split('\n')
  .map((l) => { const i = l.indexOf('//'); return i < 0 ? '' : l.slice(i + 2); }).join(' ').replace(/\s+/g, ' ').trim();
console.log(`  ..   ${fieldProse.length} chars of trailing comment read from ArcChoice`);
ok(fieldProse.length >= 100, 'ArcChoice\'s field comments were actually read (not a zero-of-zero pass)');
const FIELD_REFUTED: { re: RegExp; what: string }[] = [
  { re: /\(reserved\)/i, what: '`requires` is reserved for later — §1 shows it is read on every beat' },
  { re: /flag was set earlier in the arc/i, what: 'the flag is arc-scoped — arcTags lives on the CAREER and pickArcStart weights CROSS-arc payoffs' },
];
const fieldBad = FIELD_REFUTED.filter((p) => p.re.test(fieldProse));
for (const p of fieldBad) console.log(`       ArcChoice's field comment still claims ${p.what}`);
ok(fieldBad.length === 0, `the \`requires\` field comment claims nothing the code refutes (${fieldBad.length} found)`);

// ── 3. AND EVERY BLOCK THAT QUANTIFIES THE GATE MUST QUOTE THE MEASURED COUNT. This is what the prose fix
// alone would not have caught: "88 of the 90 `requires` choices" sat in storyarc.ts while career.ts was
// being corrected to 116, so a reader landing in either file got a different number. One measurement, three
// places that state it. When authoring moves the count this goes red naming each block — the fix is to
// paste the `..` figure above into each, not to widen this list.
const blocks: { name: string; from: string; to: string; src: string }[] = [
  { name: 'career.ts arcTags', from: '/** STATE FLAGS SET BY ARC CHOICES.', to: '*/', src: career },
  { name: "career.ts current()'s filter", from: '// A choice gated on a flag the career never earned is not offered', to: FILTER, src: career },
  { name: 'storyarc.ts pickArcStart', from: "/** `tags` is the career's earned arc-tag set.", to: '*/', src: storyarc },
];
for (const b of blocks) {
  const s = b.src.indexOf(b.from);
  const e = s < 0 ? -1 : b.src.indexOf(b.to, s + b.from.length);
  if (s < 0 || e < 0) { ok(false, `${b.name}: the block was located`); continue; }   // moved/renamed — say so, do not pass
  const text = b.src.slice(s, e);
  ok(new RegExp(`\\b${gated}\\b`).test(text), `${b.name} quotes the measured gated-choice count (${gated})`);
  // A block may omit the flag count; it may not state the wrong one.
  const claimed = [...text.matchAll(/across (\d+)(?: distinct)? (?:flags|tags)/gi)].map((m) => Number(m[1]));
  for (const n of claimed.filter((n) => n !== flags)) console.log(`       ${b.name} says "across ${n} flags"; measured ${flags}`);
  ok(claimed.every((n) => n === flags), `${b.name}'s flag count, where it states one, is right (${claimed.length} claim(s))`);
}

console.log(fails === 0 ? '\nPASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
