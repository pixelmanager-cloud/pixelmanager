// THE SETTINGS DIALOG'S OWN COMMENTS MUST NOT CALL ITS OWN CONTROLS UNSHIPPED.
//
// openSettings' docstring read "Music volume + mute and reduced-motion, applied live. (SFX volume joins
// here once the SFX set ships.)" — four lines above the markup that renders `id="set-sfx"`, the "Mute sound
// effects" switch and the live `audio.setSfxVolume` / `audio.toggleSfxMuted` wiring, against accessors
// audio.ts has carried since the SFX bus landed. A reader auditing the audio settings was told a control
// still needed building by the very function that builds it.
//
// This is the fifth close of the same failure in this subsystem (F-201, F-206, F-223, F-224), so the gate
// is not "does the docstring say the right words" — an enumeration of rows would go stale on the next row
// added, which is exactly how this sentence went stale. It is structural: the CONTROLS ARE DERIVED FROM THE
// MARKUP AND WIRING, and any comment inside the function that describes one of them as future work is
// refused. Add a row tomorrow and the derived set grows on its own.
//
// SCOPE, deliberately narrow: comments inside openSettings, measured against openSettings' own code. Other
// dialogs carry the same risk and are a different change; one function, one gate.
//
// Run: `npx tsx tools/playtest/settings_comment_truth.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== openSettings does not describe its own controls as unshipped ===');

const main = readFileSync('client/src/main.ts', 'utf8');
const audioSrc = readFileSync('client/src/audio.ts', 'utf8');

/** openSettings WITH its leading docstring — the false sentence lived in the docstring, not the body, so a
 *  brace-matched body alone would have read straight past it. */
function fnWithDoc(src: string, sig: string): string {
  const i = src.indexOf(sig);
  if (i < 0) return '';
  const doc = src.lastIndexOf('/**', i);
  let depth = 0;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(doc >= 0 ? doc : i, j + 1); }
  }
  return '';
}
/** Code only. A bare `//` strip would eat `https://...`, hence the no-colon guard. */
const codeOf = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
/** Comment text, grouped into BLOCKS: each block comment is one, a run of consecutive `//` lines is one. */
const commentBlocks = (s: string): string[] => {
  const out = [...s.matchAll(/\/\*[\s\S]*?\*\//g)]
    .map((m) => m[0].slice(2, -2).replace(/^[ \t]*\*+/gm, ' '));
  let run: string[] = [];
  for (const line of s.split('\n')) {
    const c = /^[ \t]*\/\/(.*)$/.exec(line);
    if (c) run.push(c[1]); else { if (run.length) out.push(run.join(' ')); run = []; }
  }
  if (run.length) out.push(run.join(' '));
  return out;
};
const flat = (s: string) => s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();

const fn = fnWithDoc(main, 'private openSettings()');
ok(fn.length > 0, 'openSettings was located in client/src/main.ts (with its docstring)');
const code = codeOf(fn);

// ── 1. THE PREMISE, read from the code rather than assumed: the sound-effects controls really are rendered
// here and really are wired live. If Settings ever stops carrying them, this goes red FIRST and says so,
// instead of §3 silently forbidding prose about a control that has genuinely gone away.
const renders = /id="set-sfx"/.test(code) && /'sfx'/.test(code);
const wires = /audio\.setSfxVolume\(/.test(code) && /audio\.toggleSfxMuted\(\)/.test(code);
ok(renders, 'openSettings still renders the sound-effects slider and its mute switch');
ok(wires, 'and still drives them live through audio.setSfxVolume / audio.toggleSfxMuted');
ok(/setSfxVolume\(/.test(audioSrc) && /toggleSfxMuted\(/.test(audioSrc), 'audio.ts still declares those accessors');
if (!renders || !wires) console.log('  ..   the SFX rows moved — re-read this probe before trusting the checks below');

// ── 2. THE CONTROLS, DERIVED. Element ids, switch keys, the audio methods called and the prefs touched —
// split on camelCase into words, minus the accessor verbs that carry no subject. Nothing here is a hand-
// written list, so a row added tomorrow is policed without editing this file.
const STOP = new Set(['get', 'set', 'is', 'has', 'toggle', 'apply', 'save', 'sync', 'open', 'show', 'close']);
const ids = [...code.matchAll(/id="set-([a-z0-9-]+)"/g)].map((m) => m[1]);
const keys = [...code.matchAll(/byKey\('([a-z0-9-]+)'\)/g)].map((m) => m[1]);
const calls = [...code.matchAll(/audio\.([A-Za-z]+)\(/g)].map((m) => m[1]);
const prefs = [...code.matchAll(/this\.prefs\.([A-Za-z]+)/g)].map((m) => m[1]);
const control = new Set<string>();
for (const id of [...ids, ...keys, ...calls, ...prefs])
  for (const w of id.split(/[-_]|(?=[A-Z])/).map((x) => x.toLowerCase()))
    if (w.length >= 3 && !STOP.has(w)) control.add(w);
console.log(`  ..   ${control.size} control word(s) derived from openSettings' markup and wiring: ${[...control].sort().join(' ')}`);
// VACUITY GUARD. If the derivation ever breaks, `control` empties and §3 passes over nothing — the zero-of-
// zero green that let four dead `transition: width` rules live for months. Two floors, because a PARTIAL
// break still hides things: mutation-tested by emptying `calls`, which leaves 16 words standing (over the
// count floor) but loses "volume", and the named check below goes red — the count alone would not have.
ok(control.size >= 12, 'the controls were actually derived (not a zero-of-zero pass)');
ok(control.has('sfx') && control.has('volume'), 'and the sound-effects control is among them');

// ── 3. NO COMMENT IN THIS FUNCTION MAY PUT ONE OF THOSE CONTROLS IN THE FUTURE. The shapes are the ones a
// promise actually takes; the subject test is the derived set, so the next reader checks the CLAIM, not a
// word list. Past tense survives on purpose: "The game shipped with no credits screen" is history, not a
// promise, and must not trip this.
const blocks = commentBlocks(fn).map(flat);
console.log(`  ..   ${blocks.length} comment block(s) read inside openSettings`);
ok(blocks.length >= 6, "openSettings' comments were actually parsed (not a zero-of-zero pass)");
const PENDING: { re: RegExp; what: string }[] = [
  { re: /\b(once|when|until|after)\b[^,.;]*\b(ships?|lands?|arrives?)\b/i, what: 'gates it on something shipping later' },
  { re: /\bnot yet\b/i, what: 'says it has not happened yet' },
  { re: /\byet to (be |ship|land|arrive)/i, what: 'says it is yet to arrive' },
  { re: /\b(joins?|arrives?|lands?) (here|this|the) \w+ (once|when)\b/i, what: 'promises it will join later' },
  { re: /\b(coming soon|TODO|for now, no|placeholder until)\b/i, what: 'marks it as unbuilt' },
];
type Hit = { s: string; what: string; subject: string };
const hits: Hit[] = [];
for (const b of blocks)
  for (const sentence of b.split(/(?<=[.;])\s+/)) {
    const p = PENDING.find((x) => x.re.test(sentence));
    if (!p) continue;
    const subject = sentence.toLowerCase().split(/[^a-z0-9]+/).find((w) => control.has(w));
    if (subject) hits.push({ s: sentence.trim(), what: p.what, subject });
  }
for (const h of hits) console.log(`       "${h.s}" — ${h.what}, but openSettings renders "${h.subject}" itself`);
ok(hits.length === 0, `no comment here calls a control this function builds unshipped (${hits.length} found)`);

console.log(fails === 0 ? '\nPASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
