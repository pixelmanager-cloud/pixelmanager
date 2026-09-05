// MgrState IS A PERSISTED SHAPE THAT NOTHING WALKS — every field of it must be READ somewhere.
//
// `tools/playtest/field_wiring.ts` walks the two persisted shapes it knows about, `Token` and `SaveModel`.
// MgrState is the third — the whole manager-season save, in localStorage — and it is declared inside
// main.ts, not exported, so field_wiring never sees it. That blind spot kept `lastFinishPos` alive: written
// at both season-roll saves and cleared at both succession resets, read by NOTHING, under a declaration
// comment that told the next reader it "feeds next season's expectation". The reader had in fact been
// deleted on purpose (PT-64/66 — deriving the board's bar from the stored finish lagged a year behind
// reality), so the comment pointed straight back at the regression that fix removed.
//
// The gate is therefore not "is lastFinishPos gone" — a named check dies with the name. It is structural:
// every field declared on MgrState must have at least one read in production code. Add a field tomorrow
// and forget to consume it, and this goes red on its own.
//
// SCOPE: client/src/main.ts only. MgrState is neither exported nor referenced anywhere else, so that file
// is the whole read/write universe for the shape.
//
// WHAT THIS IS: a text heuristic with no type information, so it cannot tell a MgrState `.season` from a
// fixture's. That ignorance is deliberately pointed at MISSES rather than false alarms — an unrelated
// `.season` read counts as a read and the field passes — because a spurious red in a shared gate costs
// more than a slow catch. The guards below exist to stop that leniency becoming a zero-of-zero green.
//
// Run: `npx tsx tools/playtest/mgr_state_wiring.ts`   (`--decoy` self-tests the detector, see §3)
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== every MgrState field is read somewhere, not just written ===');

const raw = readFileSync('client/src/main.ts', 'utf8');

/** Blank a span, keeping every byte's offset so line numbers stay true. */
const blank = (s: string, a: number, b: number) => s.slice(0, a) + s.slice(a, b).replace(/[^\n]/g, ' ') + s.slice(b);
/** Comments are prose, not wiring. This project documents itself in comments more than in identifiers —
 *  the doc-comment ON a dead field would otherwise vouch for the field. */
function stripComments(text: string): string {
  let out = text;
  for (const re of [/\/\*[\s\S]*?\*\//g, /\/\/[^\n]*/g]) {
    for (const m of [...out.matchAll(re)]) out = blank(out, m.index!, m.index! + m[0].length);
  }
  return out;
}
/** The span of `interface MgrState { … }` in the given text: [open brace, close brace]. */
function interfaceSpan(text: string): [number, number] {
  const at = text.search(/interface\s+MgrState\b[^{]*\{/);
  if (at < 0) return [-1, -1];
  const open = text.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) return [open, i]; }
  }
  return [open, -1];
}

const noComments = stripComments(raw);
const [open, close] = interfaceSpan(noComments);
ok(open >= 0 && close > open, 'interface MgrState was located in client/src/main.ts');

// ── 1. THE FIELDS, DERIVED FROM THE DECLARATION. Depth-tracked, so the members of an inline object type
// (`lastBoard?: { message; mood; expectation }`) are not mistaken for fields of the shape itself.
const fields: string[] = [];
{
  let depth = 0;
  for (let i = open; i <= close; i++) {
    const c = noComments[i];
    // `season` shares its line with the opening brace, so the brace position is itself a field start —
    // test it BEFORE the depth bookkeeping swallows it, or the shape's first field is silently never checked.
    const first = i === open;
    if (c === '{' || c === '(' || c === '[') depth++;
    else if (c === '}' || c === ')' || c === ']') { depth--; continue; }
    else if (depth !== 1) continue;
    if (!(first || c === ';' || c === '\n')) continue;
    const m = /^\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*\??\s*:/.exec(noComments.slice(i + 1, i + 120));
    if (m && !fields.includes(m[1])) fields.push(m[1]);
  }
}
console.log(`  ..   ${fields.length} field(s) declared on MgrState: ${fields.join(' ')}`);
// VACUITY GUARD. If the parse ever breaks, `fields` empties and §2 passes over nothing — the zero-of-zero
// green that let four dead `transition: width` rules live for months here. Mutation-tested by pointing
// interfaceSpan at a name that does not exist: the count drops to 0 and this goes red before §2 can lie.
ok(fields.length >= 30, 'the field list was actually derived (not a zero-of-zero pass)');
ok(fields.includes('lastBoard') && fields.includes('season'), 'and it contains the shape\'s known fields');

// ── 2. EVERY DECLARED FIELD MUST BE READ. The declaration itself is blanked first: a type declaration is
// neither a read nor a write, and counting it as either is exactly how a field with one declaration and
// four assignments looks wired.
const code = blank(noComments, open + 1, close);
// `--decoy` suppresses reads of one genuinely-live field, to prove this detector still fires. Without a
// self-test, "0 unread fields" is indistinguishable from a regex that stopped matching anything.
const DECOY = 'lastBoard';
const decoy = process.argv.includes('--decoy');
const hunted = decoy ? code.replaceAll(`.${DECOY}`, '.zz_decoy_suppressed') : code;

const unread: string[] = [];
let wired = 0;
for (const f of fields) {
  // a WRITE: an object-literal key `field:`, or an assignment `x.field = / += / ++`
  const reWrite = new RegExp(`(?:(?:^|[\\s{,(\\[])${f}\\s*:(?!:))|(?:\\.${f}\\s*(?:\\+\\+|--|(?:[+\\-*/%|&^]|\\?\\?|\\|\\||&&)?=(?!=)))`, 'gm');
  // a READ: a property access `.field` that is not the assignment target above
  const reRead = new RegExp(`\\.${f}\\b(?!\\s*(?:\\+\\+|--|(?:[+\\-*/%|&^]|\\?\\?|\\|\\||&&)?=(?!=)))(?!\\s*:)`, 'gm');
  const writes = [...hunted.matchAll(reWrite)];
  const reads = [...hunted.matchAll(reRead)];
  if (reads.length) wired++;
  if (writes.length && !reads.length) {
    const where = writes.slice(0, 4).map((m) => hunted.slice(0, m.index!).split('\n').length).join(', ');
    unread.push(`${f} — ${writes.length} write(s) at main.ts:${where}, 0 reads`);
  }
}
console.log(`  ..   ${wired} of ${fields.length} field(s) have at least one read`);
// The second floor, because a PARTIAL break still hides things and an empty-set pass cannot be told from a
// clean one by §2 alone. A handful of genuinely dead fields is what §2 is FOR and must not trip this, but if
// a fifth of the shape suddenly reads as unread, the regex broke rather than the game.
ok(wired >= Math.ceil(fields.length * 0.8), 'the read scan is still matching (a mass "unread" verdict means the regex broke, not the code)');
for (const u of unread) console.log(`       ${u}`);
ok(unread.length === 0, `no MgrState field is written and never read (${unread.length} found)`);

// ── 3. THE SELF-TEST, reported rather than assumed.
if (decoy) console.log(`  ..   --decoy suppressed reads of \`${DECOY}\`; the check above must be RED for this probe to be worth anything`);

console.log(fails === 0 ? '\nPASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
