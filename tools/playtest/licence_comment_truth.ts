// WHAT THE CLIENT SAYS ABOUT THE MUSIC LICENCE MUST MATCH THE LICENCE FILES.
//
// `docs/licenses/README.md` is a proof-of-rights file, and it already carries the scar: it "used to say"
// attribution was contractual, was checked against the EULA PDF, and now warns in terms that nobody should
// describe it as a licence obligation — "a proof-of-rights file that overstates one term is not trustworthy
// about the others". The client then re-introduced the overstatement one directory away. openSettings'
// comment announced "CREDITS ARE A LICENSING OBLIGATION, not a courtesy" and attributed to CREDITS.md a
// sentence saying the credit "MUST appear in the shipped game's credits" — a quotation that appears nowhere
// in CREDITS.md, or anywhere else in the repo. showCredits' header said the same thing more quietly.
//
// Nothing rendered was wrong; the damage is to the paper trail. The next agent to touch store or credits
// copy reads the comment beside the code, not the licence file two directories over, and a fabricated
// contractual term sitting next to the one clause that IS binding (do not imply the licensor endorses the
// game) is how the binding one gets treated as equally soft.
//
// The gate cuts both ways ON PURPOSE. §2 forbids restating the refuted claim; §4 forbids the lazy fix of
// deleting the credit to make §2 go quiet. The credit is courtesy, and courtesy is still kept.
//
// SCOPE, deliberately narrow: comments in client/src/*.ts. `docs/launch-roadmap.md:45` carries a milder
// version of the same sentence ("music attribution is a licensing requirement"), and docs are a different
// review lane — widening this to prose files would make the probe red for something it cannot explain.
//
// Run: `npx tsx tools/playtest/licence_comment_truth.ts`
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== client comments tell the truth about the music licence ===');

/** Comment text only, grouped into BLOCKS: each block comment is one, and a run of consecutive `//` lines
 *  is one — because the line citing CREDITS.md and the line quoting it were different lines of the same
 *  three-line comment, and checking them apart is how the quote went unattributed. */
const commentBlocks = (src: string): string[] => {
  const out = [...src.matchAll(/\/\*[\s\S]*?\*\//g)].map((m) => m[0]);
  let run: string[] = [];
  for (const line of src.split('\n')) {
    const c = /^[ \t]*\/\/(.*)$/.exec(line);
    if (c) run.push(c[1]); else { if (run.length) out.push(run.join(' ')); run = []; }
  }
  if (run.length) out.push(run.join(' '));
  return out;
};
/** Code only. A bare `//` strip would eat `https://...`, hence the no-colon guard. */
const codeOf = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
/** Markdown emphasis, smart quotes and line wrapping are formatting, not meaning — a quote that survives a
 *  re-wrap of CREDITS.md should still resolve. */
const flat = (s: string) => s.replace(/[*_`]/g, '').replace(/[“”]/g, '"')
  .replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();

const credits = readFileSync('CREDITS.md', 'utf8');
const licences = readFileSync('docs/licenses/README.md', 'utf8');

// ── 1. THE PREMISE, read from the licence files rather than assumed. If a future asset licence really does
// carry an attribution clause, this goes red FIRST and says so, instead of §2 silently forbidding prose
// about an obligation that has become real.
const creditsSaysCourtesy = /courtesy, not a contractual requirement/i.test(flat(credits));
ok(creditsSaysCourtesy, 'CREDITS.md still calls the music credit courtesy, not a contractual requirement');
const licenceSaysNotRequired = /Attribution is NOT a contractual requirement/i.test(flat(licences));
ok(licenceSaysNotRequired, 'docs/licenses/README.md still records that attribution is not contractual');
if (!creditsSaysCourtesy || !licenceSaysNotRequired)
  console.log('  ..   the licence position moved — re-read this probe before trusting the checks below');

// ── 2. NO CLIENT COMMENT MAY RE-STATE WHAT §1 REFUTES. Each pattern is tied to the licence fact that kills
// it, so the next reader checks the CLAIM, not the regex. Negations survive: "is not a licensing
// requirement" does not match "is a licens…".
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : [];
});
const clientFiles = walk('client/src');
const blocks = clientFiles.flatMap((p) => commentBlocks(readFileSync(p, 'utf8')).map((b) => ({ p, t: flat(b) })));
console.log(`  ..   ${blocks.length} comment block(s) read across ${clientFiles.length} client/src file(s)`);
// VACUITY GUARD. If the comment split ever breaks, `blocks` empties and every filter below passes over
// nothing — the zero-of-zero green that let four dead `transition: width` rules live for months.
ok(blocks.length >= 100, 'client comments were actually parsed (not a zero-of-zero pass)');
const REFUTED: { re: RegExp; what: string }[] = [
  { re: /credits?\s+(are|is)\s+a\s+licens(ing|e)\s+obligation/i,
    what: 'the credit is a licensing obligation — the EULA has no attribution clause (§1)' },
  { re: /credit\s+(is|was|remains)\s+a\s+licens(ing|e)\s+(requirement|obligation|term)/i,
    what: 'the credit is a licence requirement — CREDITS.md calls it courtesy (§1)' },
  { re: /attribution\s+is\s+a\s+(contractual|licens\w+)\s+(requirement|obligation)/i,
    what: 'attribution is contractual — docs/licenses/README.md says in terms that it is not (§1)' },
];
const restated = blocks.flatMap((b) => REFUTED.filter((r) => r.re.test(b.t)).map((r) => ({ ...b, r })));
for (const x of restated) console.log(`       ${x.p} — a comment still claims ${x.r.what}`);
ok(restated.length === 0, `no client comment claims a licence term the EULA lacks (${restated.length} found)`);

// ── 3. AND A COMMENT THAT QUOTES THE LICENCE FILES MUST QUOTE SOMETHING THEY SAY. This is the one that
// catches the fabrication directly: "MUST appear in the shipped game's credits" was attributed to
// CREDITS.md and exists in neither file. Mutation-tested by altering a character inside a quoted span in
// showCredits' header — the filter goes red naming the span, as it should.
const haystack = `${flat(credits)}\n${flat(licences)}`.toLowerCase();
const citing = blocks.filter((b) => /CREDITS\.md|docs\/licenses/i.test(b.t));
console.log(`  ..   ${citing.length} client comment block(s) cite the licence files`);
ok(citing.length >= 2, 'the licence-citing comments were actually found (not a zero-of-zero pass)');
const spans = citing.flatMap((b) => [...b.t.matchAll(/"([^"\n]{8,})"/g)].map((m) => ({ p: b.p, q: m[1] })));
const phantom = spans.filter((s) => !haystack.includes(s.q.toLowerCase()));
console.log(`  ..   ${spans.length} quoted span(s) in those comments, ${spans.length - phantom.length} resolve`);
for (const s of phantom) console.log(`       ${s.p} — quotes "${s.q}", which is in neither licence file`);
ok(phantom.length === 0, `every quote a comment attributes to the licence files exists (${phantom.length} phantom)`);

// ── 4. AND THE CREDIT ITSELF STAYS ON THE SCREEN. Saying the credit is courtesy is not permission to drop
// it: CREDITS.md keeps it "because it is right and costs nothing", and the note wording is the one clause
// the EULA does bind. Read from CODE, so a comment repeating the phrase can never satisfy this.
const mainCode = codeOf(readFileSync('client/src/main.ts', 'utf8'));
ok(/Bit By Bit Sound/.test(mainCode), 'the credits screen still names Bit By Bit Sound');
ok(/bitbybitsound\.com/.test(mainCode), 'the credits screen still carries the creator\'s site');
ok(/A credit, not an endorsement/.test(mainCode), 'the note still says "A credit, not an endorsement" (the binding clause)');
ok(/id="set-credits"/.test(mainCode) && /showCredits\(\)/.test(mainCode), 'Settings still has a reachable way into the credits screen');

console.log(fails === 0 ? '\nPASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
