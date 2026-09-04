// THE IDENTITY SCREEN MUST NOT SELL A FIELD THE ENGINE CANNOT SEE.
//
// The KIT tab's nickname box shipped labelled "(what the crowd and the commentary call him)", under a
// prompt that defended both fields as "the two details that actually show up in his story". Neither claim
// was true of the nickname. `kit.nickname` is written by wireKitTab, sanitised by api.saveKit and
// round-tripped straight back into the same input by careerState — and read by nothing else in the game.
// `.nickname` occurs ZERO times in shared/src, which is where every authored line the player ever reads is
// written. So the player types "The Wolf", is told "Saved ✓", and not one of the game's thousands of lines
// will ever say it (F-191).
//
// The squad-number half of the SAME screen is honoured for real — legendCardOf pulls `.number` out of
// kit_json for the retired shirt — which is exactly what makes the nickname read as a broken feature
// rather than as flavour.
//
// The rule gated here is therefore NOT "wire the nickname up". It is: A KIT FIELD THE ENGINE CANNOT SEE
// MUST NOT BE SOLD AS ONE THE WORLD REACTS TO. Wiring a field satisfies the rule too — a field with a
// reader in shared/src is exempt and may promise whatever it now delivers.
//
// HOW IT DECIDES A FIELD IS READ, and where that is weak — spelled out because a false NEGATIVE here (a
// promise quietly allowed) is the one outcome that would make this probe worthless:
//   • the rows, their copy and their fields are PARSED out of kitTabHtml/wireKitTab rather than listed
//     here, so a third field is checked the day someone adds it, not the day someone remembers this file.
//   • "read" means a dot-access `.field` (or `['field']`) anywhere under shared/src, comments stripped.
//     shared/ is the pure engine: the crowd, the commentary, the press and the narration are all authored
//     there, so a field it cannot see cannot be spoken. A field pulled out by DESTRUCTURING is invisible
//     to that match — if you wire one that way, widen the matcher in the same commit, or this goes red on
//     a change that was correct.
//   • the evidence lines are printed, because a `.number` hit is evidence that the field is read, not
//     proof that the KIT field is the one being read.
//   • only the player-facing copy is scanned for promises. The comment above the markup is NOT scanned by
//     vocabulary — a comment that explains the ban necessarily contains the banned words — so the one
//     sentence that shipped the claim is blocked by an exact literal instead, to stop a straight revert.
//
// VACUITY is how a probe of this shape dies quietly, so every step that could match nothing says so: the
// block must be found, the rows must parse, every input must map to a field the save actually writes, and
// the promise vocabulary is self-tested against the two sentences that shipped the bug. Mutation-test it
// by putting "the crowd" back into the nickname hint (goes red on the promise rule), or by adding a
// `.nickname` read to any file in shared/src (that rule goes green — the field then has a voice and is
// allowed to claim one). Both were run against this probe before it landed.
//
// Run: `npx tsx tools/playtest/kit_promise.ts`
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// `new URL(...).pathname` is percent-encoded and this repo lives under a path with a space in it, so that
// spelling hands readFileSync a directory called `Clause%20Coding` (field_wiring.ts died on it first).
const ROOT = fileURLToPath(new URL('../../', import.meta.url));

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The Identity screen promises only what the engine can deliver ===');

const src = readFileSync(join(ROOT, 'client/src/main.ts'), 'utf8');

// ── 1. THE SCREEN, read out of the source rather than described here.
const sliceMethod = (name: string): string => {
  const at = src.indexOf(`private ${name}(`);
  if (at < 0) return '';
  const end = src.indexOf('\n  }\n', at);
  return src.slice(at, end > at ? end : at + 2000);
};
const tab = sliceMethod('kitTabHtml');
const wire = sliceMethod('wireKitTab');
ok(!!tab && !!wire, 'kitTabHtml and wireKitTab are still the Identity screen (everything below reads them)');

// The saved field behind each input, taken from the object wireKitTab hands to api.saveKit. Listing the
// pairs here instead would be a list someone has to remember — the failure run-playtest.mjs was written for.
const fieldOf = new Map<string, string>();
for (const line of wire.split('\n')) {
  const m = line.match(/^\s*(\w+):.*\$\('(kit-[\w-]+)'\)/);
  if (m) fieldOf.set(m[2], m[1]);
}

const rows = [...tab.matchAll(/<div class="cg-kit-row">([\s\S]*?)<\/div>/g)].map((m) => m[1]);
console.log(`  ..   ${rows.length} identity row(s) parsed, ${fieldOf.size} input(s) mapped to a saved field`);
ok(rows.length >= 2, 'the identity rows were actually parsed out of the markup (not a zero-of-zero pass)');

// The tab's own prompt is copy about EVERY row, so it is checked against every unread field alongside that
// field's own hint. "the two details that actually show up in his story" was half of this bug.
const prompt = ((tab.match(/<div class="cg-prompt">([\s\S]*?)<\/div>/) ?? [])[1] ?? '').replace(/<[^>]*>/g, '').trim();
console.log(`  ..   tab prompt: "${prompt}"`);
ok(!!prompt, 'the tab prompt was found (it is copy about every row, so it is checked too)');

type Row = { field: string; label: string; hint: string };
const parsed: Row[] = [];
for (const row of rows) {
  const id = (row.match(/<input\b[^>]*\bid="([\w-]+)"/) ?? [])[1] ?? '';
  // `<label[^>]*>` because the labels now carry `for=` (F-257 named these two inputs). A literal `<label>`
  // matched nothing the moment that landed: `label` fell to '' and every message below silently degraded
  // from `the "Squad number" row's...` to `the "kit-number" row's...` without failing anything.
  const label = ((row.match(/<label[^>]*>([^<]*)/) ?? [])[1] ?? '').trim();
  const hint = ((row.match(/class="cg-kit-hint">([\s\S]*?)<\/span>/) ?? [])[1] ?? '').trim();
  const field = fieldOf.get(id) ?? '';
  // An input that maps to no saved field is a row this probe cannot check — report it rather than skip it.
  ok(!!field, `the "${label || id}" row's input #${id} maps to a field the save writes${field ? ` (${field})` : ''}`);
  if (field) parsed.push({ field, label, hint });
}

// ── 2. WHICH FIELDS THE ENGINE CAN SEE. shared/ is the pure engine; every line of narration, commentary
// and press in the game is authored under shared/src. Fixtures are excluded on the field_wiring rule that
// tests are not evidence: a builder that writes every field by construction would vouch for a dead one.
const walk = (dir: string, out: string[] = []): string[] => {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === 'dist' || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.ts') && !/(^|\/)qa_|_test\.ts$|fuzz/.test(p)) out.push(p);
  }
  return out;
};
// Comments are not code. This codebase documents fields in prose constantly — token.ts:24 names the
// nickname in the very comment describing the column nothing reads — and an unstripped comment is a
// phantom reader that would vouch for the field it describes as dead. Blanked rather than deleted, because
// collapsing a block comment shifts every line number after it and the evidence lines below are printed
// for a human to open the file at.
const stripComments = (t: string) => t
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/\/\/[^\n]*/g, '');
const engineFiles = walk(join(ROOT, 'shared/src')).map((p) => ({ p, lines: stripComments(readFileSync(p, 'utf8')).split('\n') }));
console.log(`  ..   ${engineFiles.length} engine file(s) scanned under shared/src`);
ok(engineFiles.length > 20, 'the engine sources were actually found and read (not a zero-of-zero pass)');

const readersOf = (field: string): string[] => {
  const re = new RegExp(`\\.${field}\\b|\\[['"]${field}['"]\\]`);
  const hits: string[] = [];
  for (const f of engineFiles) f.lines.forEach((l, i) => { if (re.test(l)) hits.push(`${relative(ROOT, f.p)}:${i + 1}`); });
  return hits;
};

// ── 3. THE VOCABULARY OF A PROMISE, each rule tied to the thing it tells the player is going to happen.
const PROMISE: { re: RegExp; what: string }[] = [
  { re: /\bcrowd\b|\bterraces\b|\bthe stands\b|\bchant/i, what: 'the crowd saying it' },
  { re: /\bcommentar(y|ies)\b|\bcommentators?\b/i, what: 'the commentary saying it' },
  { re: /\bpress\b|\bpundits?\b|\bheadlines?\b|\bthe papers\b/i, what: 'the press printing it' },
  { re: /\bin his story\b|\bshows? up in\b|\bin the (match )?text\b|\bnarrat/i, what: 'appearing in his authored story' },
  { re: /\bcalls? him\b|\bcalled him\b|\bknown as\b/i, what: 'somebody in the game using it out loud' },
];
// SELF-TEST. A vocabulary that matches nothing passes everything, and nothing else in this file would
// notice. These are the two sentences the bug shipped with; if either stops matching, the guard is off.
const CANARIES = ['(what the crowd and the commentary call him)',
  'this is a text game, so we keep it to the two details that actually show up in his story.'];
const missed = CANARIES.filter((c) => !PROMISE.some((p) => p.re.test(c)));
ok(missed.length === 0, `the promise vocabulary still fires on the copy that shipped the bug${missed.length ? ` (missed: ${missed.join(' | ')})` : ''}`);

// ── 4. THE RULE.
let checked = 0;
const bad: string[] = [];
for (const r of parsed) {
  const readers = readersOf(r.field);
  if (readers.length) {
    console.log(`  ..   ${r.field}: read by the engine — exempt (${readers.slice(0, 3).join(', ')})`);
    continue;
  }
  checked++;
  console.log(`  ..   ${r.field}: no reader in shared/src — its copy is held to the promise rule`);
  for (const copy of [prompt, r.hint]) {
    for (const p of PROMISE) {
      if (p.re.test(copy)) bad.push(`${r.field}: "${copy}" — promises ${p.what}, but nothing in shared/src reads it`);
    }
  }
}
for (const b of bad) console.log(`       ${b}`);
console.log(`  ..   ${checked} of ${parsed.length} identity field(s) have no engine reader`);
ok(bad.length === 0, `no unread identity field is sold as one the world reacts to (${bad.length} promise(s) found)`);

// ── 5. AND THE COMMENT THAT ARGUED FOR IT. The claim was made twice: once to the player in the hint, once
// to the next author in the comment defending the field's place on the screen. Leaving the second standing
// is how the first comes back. Deliberately an exact literal, not vocabulary — see the header.
ok(!/the nickname is what the crowd\/commentary calls him/i.test(src),
   'the comment above the markup no longer re-asserts the claim the copy had to drop');

console.log(fails
  ? `\n✗ ${fails} check(s) failed — the Identity screen is promising a voice the engine does not have`
  : '\n✓ every identity field either has an engine reader or claims nothing the engine cannot do');
if (fails) process.exitCode = 1;
