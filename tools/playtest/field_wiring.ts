// ── FIELD WIRING — does every persisted field have both a WRITER and a READER? ────────────────────────
//
// The dominant defect shape in this project, found repeatedly: a well-designed field, a consumer that
// reads it, and NOTHING that ever writes it — so the consumer silently reads undefined/0 forever and every
// test still passes. Measured instances include ach_tier and ach_promotions (deflating every legend card
// in the game), and the mirror image, `promotions`, missing from three test fixtures.
//
// This walks the declared fields of the two persisted shapes — the `Token` save-record and the `SaveModel`
// that holds them — and reports any field with no writer, or no reader, in production code.
//
// ── WHAT THIS IS AND IS NOT ──────────────────────────────────────────────────────────────────────────
// It is a TEXT heuristic. There is no type information here, so it cannot know that the `morale:` it just
// found is a Player's morale and not a Token's. Everything below exists to keep that ignorance from
// producing the one outcome that would make the probe worthless: a masked defect reported as clean.
// Four guards do that work:
//
//   1. COMMENTS AND TYPE DECLARATIONS ARE NOT CODE. This file's own prose names `ach_tier` a dozen times;
//      an interface that declares `morale: number` is not a write. Both are stripped before counting, so
//      the probe cannot be fooled by the very comments that document the bug it looks for.
//   2. TESTS ARE NOT EVIDENCE. Fixtures and fuzz builders write every field by construction — that is
//      exactly how ach_tier looked wired while no production code touched it. Excluded.
//   3. AMBIGUOUS NAMES ARE HELD TO A HIGHER BAR. Any field name also declared on some OTHER interface in
//      the repo (`morale`, `role`, `name`, `state`, `branch`, `id`, …) is auto-detected as ambiguous, and
//      its evidence only counts when it sits near a mention of the owning shape. Without this, one
//      unrelated `morale: 50` anywhere in the tree would vouch for a Token field nothing writes — a false
//      NEGATIVE, which is the failure mode this codebase keeps producing.
//
//   4. A WRITER NOTHING CALLS IS NOT A WRITER. `ach_tier`'s two writers were real code that matched any
//      textual "is it written?" test; nothing called either. Write sites are attributed to their enclosing
//      function and a function referenced nowhere but its own definition is treated as dead.
//
// Findings are graded, not guessed at. The build FAILS only on the two unambiguous shapes that have
// actually bitten: a field with no writer at all, and a field whose only writers are unreachable.
// Everything softer — evidence that could belong to another type, a field written but never read — is
// printed as a warning for a human to judge, with `--explain <field>` to dump the raw evidence.
//
// KNOWN LIMITS, stated plainly rather than discovered later:
//   • "strong" only means the match sits in token-ish/save-ish text. `tokenContract()` building a DTO with
//     `morale:` counts as a strong Token write although it is really a read. So strong evidence can be
//     over-generous for a field that has other, genuine writers; it is not proof of a specific write.
//   • Reachability is one level deep — a live writer called only from another dead function still passes.
//   • Only `.ts` under shared/ and client/ is scanned (the UI is main.ts; index.html holds no logic).
//   • A field written via spread/`Object.assign` alone, or read via destructuring, is invisible here.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// `new URL(...).pathname` is percent-encoded — this repo lives under a path with a space in it, so that
// spelling handed readFileSync a directory called `Clause%20Coding` and the probe died on its first read.
const ROOT = fileURLToPath(new URL('../../', import.meta.url));

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === 'dist' || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
}

const rel = (p: string) => relative(ROOT, p);

// A test/fixture/simulation file. Its writes are construction, not wiring.
const isTest = (p: string) => /(^|\/)qa_|\/tools\/playtest\/|_test\.ts$|_sim\.ts$|fuzz|\/scripts\//.test(p);

// ── text normalisation ───────────────────────────────────────────────────────────────────────────────
// Replace a span with spaces so every remaining byte keeps its original offset (line numbers stay true).
const blank = (s: string, a: number, b: number) =>
  s.slice(0, a) + s.slice(a, b).replace(/[^\n]/g, ' ') + s.slice(b);

/** Strip block and line comments. Prose in this codebase names fields constantly — an unstripped comment
 *  is a phantom reader, and the doc-comment ON a dead field would vouch for the field itself. */
function stripComments(text: string): string {
  let out = text;
  for (const re of [/\/\*[\s\S]*?\*\//g, /\/\/[^\n]*/g]) {
    for (const m of [...out.matchAll(re)]) out = blank(out, m.index!, m.index! + m[0].length);
  }
  return out;
}

/** Blank the body of every `interface X {…}` / `type X = {…}`. A declaration is neither a read nor a
 *  write; counting it as a write is how a field with 40 declarations and 0 assignments looks wired. */
function stripTypeDecls(text: string): string {
  let out = text;
  const re = /(?:^|\n)\s*(?:export\s+)?(?:declare\s+)?(?:interface\s+\w+[^{]*|type\s+\w+[^=]*=\s*)\{/g;
  for (const m of [...out.matchAll(re)]) {
    const open = m.index! + m[0].length - 1;
    let depth = 0, i = open;
    for (; i < out.length; i++) {
      if (out[i] === '{') depth++;
      else if (out[i] === '}') { depth--; if (depth === 0) break; }
    }
    out = blank(out, open + 1, i);
  }
  return out;
}

/** Blank one named interface body only — used on the declaring file itself, which for `SaveModel` is also
 *  its single biggest writer (LocalStore lives in save.ts), so the file cannot simply be skipped. */
function blankInterface(text: string, name: string): string {
  const at = text.search(new RegExp(`(?:export\\s+)?interface\\s+${name}\\b[^{]*\\{`));
  if (at < 0) return text;
  const open = text.indexOf('{', at);
  let depth = 0, i = open;
  for (; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) break; }
  }
  return blank(text, open + 1, i);
}

// ── declaration parsing ──────────────────────────────────────────────────────────────────────────────
/** The TOP-LEVEL field names of one interface. Depth-tracked, so the members of an inline object type
 *  (`profile: { name: string; coins: number }`) are not mistaken for fields of the shape itself. */
function declaredFields(text: string, name: string): string[] {
  const src = stripComments(text);
  const at = src.search(new RegExp(`(?:export\\s+)?interface\\s+${name}\\b[^{]*\\{`));
  if (at < 0) throw new Error(`[field-wiring] interface ${name} not found`);
  const open = src.indexOf('{', at);
  const out: string[] = [];
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '{' || c === '(' || c === '[') { depth++; continue; }
    if (c === '}' || c === ')' || c === ']') { depth--; if (depth === 0) break; continue; }
    if (depth !== 1) continue;
    // at the top level of the body, a field starts after `{`, `;` or a newline
    if (c === ';' || c === '\n' || i === open) {
      const m = /^\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*\??\s*:/.exec(src.slice(i + 1, i + 120));
      if (m) out.push(m[1]);
    }
  }
  return [...new Set(out)];
}

/** Every field name declared on any OTHER interface/type-literal in the tree. A Token field whose name
 *  collides with one of these cannot be vouched for by a bare textual match. */
function collidingNames(files: string[], own: Set<string>, ownFile: string): Set<string> {
  const seen = new Set<string>();
  const reDecl = /(?:^|\n)\s*(?:export\s+)?(?:declare\s+)?(?:interface\s+(\w+)[^{]*|type\s+(\w+)[^=]*=\s*)\{/g;
  for (const f of files) {
    const src = stripComments(readFileSync(f, 'utf8'));
    for (const m of [...src.matchAll(reDecl)]) {
      const nm = m[1] ?? m[2];
      if (f === ownFile && (nm === 'Token' || nm === 'SaveModel')) continue;
      const open = m.index! + m[0].length - 1;
      let depth = 0, i = open;
      for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') { depth--; if (depth === 0) break; }
      }
      for (const fm of src.slice(open, i).matchAll(/(?:^|[;{\n])\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*\??\s*:/g)) {
        if (own.has(fm[1])) seen.add(fm[1]);
      }
    }
  }
  return seen;
}

// ── reachability ─────────────────────────────────────────────────────────────────────────────────────
// A WRITER THAT IS NEVER CALLED IS NOT A WRITER. This is the exact shape of the flagship bug: `ach_tier`
// had two writers, `recordPlayerSeason` and `setAchievements` — both real code, both matching any textual
// "is it written?" test — and NOTHING CALLED EITHER. A probe that stops at "some file assigns this field"
// would have reported that save-record as fully wired for as long as the bug lived.
//
// So each write site is attributed to its enclosing function, and a function that appears nowhere except
// its own definition is dead. A field written only from dead functions is reported as effectively unwritten.

const FN_DEF = [
  /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/,
  // a function EXPRESSION — `function` or a fat arrow is required. Matching a bare `= (` swept in ordinary
  // parenthesised assignments (`const useed = ((uncle as any).branch_seed ?? 0) >>> 0;`), which then stole
  // the attribution of every write below it inside the real enclosing function.
  /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]*)?=\s*(?:async\s+)?(?:function\b|(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^=]*?)?=>)/,
  // an object-literal function property: `succeed: async (pid, body) => {`. The whole `api` facade is one
  // object literal of these, so without this rule every write in api.ts was attributed to whatever
  // module-level arrow happened to sit above it.
  /^\s*([A-Za-z_$][\w$]*)\s*:\s*(?:async\s+)?(?:function\b|(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^=]*?)?=>)/,
  // a method: `[modifiers] name(…) [: T] {` — the trailing `{` on the same line is what separates a
  // definition from an interface's method SIGNATURE, which ends in `;` and must never count as a
  // definition (otherwise every GameStore method looks defined twice and never called).
  /^\s*(?:public\s+|private\s+|protected\s+|static\s+|readonly\s+|abstract\s+|override\s+|async\s+|\*\s*)*([A-Za-z_$][\w$]*)\s*(?:<[^>=]*>)?\s*\(.*\)\s*(?::[^{]*)?\{/,
];
// control-flow keywords look exactly like a call followed by a block
const NOT_FN = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'else', 'do', 'function', 'constructor']);

/** The name of the function/method whose body encloses `line` (1-based), or null at module top level.
 *  BRACE-BALANCED, not indentation-based. Indentation picks the nearest shallower definition above, which
 *  is routinely a sibling that has already closed: a helper `const distinctName = (seed) => {…}` declared
 *  at the top of `succeed()` stole every write in the 60 lines after its own closing brace. Walking the
 *  brace balance upward finds the block that is still OPEN at the hit, which is the real enclosing scope. */
function enclosingFn(codeLines: string[], line: number): string | null {
  // A one-liner method (`async getToken(id) { return this.m.tokens.find(…); }`) opens and closes on the hit's
  // own line, so the upward walk never sees it. Test that line first or every such method reads as top level.
  const self = codeLines[line - 1] ?? '';
  if (/\{.*\}/.test(self)) for (const re of FN_DEF) { const m = re.exec(self); if (m && !NOT_FN.has(m[1])) return m[1]; }
  let depth = 0;
  for (let i = line - 2; i >= 0; i--) {
    const l = codeLines[i] ?? '';
    depth += (l.match(/\}/g)?.length ?? 0) - (l.match(/\{/g)?.length ?? 0);
    if (depth >= 0) continue;                       // this line's block closes before the hit — not enclosing
    if (/^\s*(?:export\s+)?(?:abstract\s+)?class\s+/.test(l)) return null;   // class body, not a function
    for (const re of FN_DEF) { const m = re.exec(l); if (m && !NOT_FN.has(m[1])) return m[1]; }
    depth = 0;                                      // an enclosing but unnamed block — keep going outward
  }
  return null;
}

/** Function names that appear nowhere but their own definition, across all production source. Comments and
 *  type declarations are already stripped, so an interface's method signature does not count as a caller. */
function deadFunctions(sources: Map<string, { text: string }>): Set<string> {
  const defs = new Map<string, number>();
  for (const { text } of sources.values()) {
    for (const l of text.split('\n')) for (const re of FN_DEF) {
      const m = re.exec(l); if (m && !NOT_FN.has(m[1])) { defs.set(m[1], (defs.get(m[1]) ?? 0) + 1); break; }
    }
  }
  const dead = new Set<string>();
  for (const [name, defCount] of defs) {
    let uses = 0;
    for (const { text } of sources.values()) uses += (text.match(new RegExp(`\\b${name}\\b`, 'g')) ?? []).length;
    if (uses - defCount <= 0) dead.add(name);
  }
  return dead;
}

// ── evidence ─────────────────────────────────────────────────────────────────────────────────────────
type Hit = { file: string; line: number; strong: boolean; live: boolean; fn: string | null; text: string };

function lineIndex(text: string): number[] {
  const idx = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') idx.push(i + 1);
  return idx;
}
const lineOf = (idx: number[], off: number) => {
  let lo = 0, hi = idx.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (idx[mid] <= off) lo = mid; else hi = mid - 1; }
  return lo + 1;
};

type Shape = {
  name: string;            // interface name
  declFile: string;        // path, relative to ROOT
  clue: RegExp;            // "this text is plausibly about this shape"
  fields: string[];
  ambiguous: Set<string>;
};

function scan(shape: Shape, sources: Map<string, { text: string; code: string[]; raw: string[]; lines: number[] }>, dead: Set<string>) {
  const report = new Map<string, { writes: Hit[]; reads: Hit[] }>();
  for (const f of shape.fields) {
    const writes: Hit[] = [], reads: Hit[] = [];
    // a WRITE: an object-literal key `field:`, or an assignment/mutation `x.field = / += / ++`
    const reWrite = new RegExp(
      `(?:(?:^|[\\s{,(\\[])${f}\\s*:(?!:))|(?:\\.${f}\\s*(?:\\+\\+|--|(?:[+\\-*/%|&^]|\\?\\?|\\|\\||&&)?=(?!=)))`, 'gm');
    // a READ: a property access `.field` that is not the assignment target above
    const reRead = new RegExp(`\\.${f}\\b(?!\\s*(?:\\+\\+|--|(?:[+\\-*/%|&^]|\\?\\?|\\|\\||&&)?=(?!=)))(?!\\s*:)`, 'gm');
    for (const [path, { text, code, raw, lines }] of sources) {
      const fileClue = shape.clue.test(path) || shape.clue.test(raw.join('\n'));
      for (const [re, bucket] of [[reWrite, writes], [reRead, reads]] as const) {
        for (const m of [...text.matchAll(re)]) {
          const ln = lineOf(lines, m.index!);
          // For a name that also lives on other types, the match must sit near a mention of this shape.
          // The window is taken from the ORIGINAL text, comments included: a comment can never be evidence
          // that a write happened, but it is perfectly good evidence of what the surrounding code is about,
          // and this codebase documents itself in prose more than in identifiers.
          const near = raw.slice(Math.max(0, ln - 13), ln + 10).join('\n');
          // The declaring file is always strong context — a file that declares the shape is about it.
          // (`save.ts` both declares SaveModel and, in LocalStore, is its single biggest writer; `this.m.club = club`
          //  sits 120 lines below the only textual mention of the type name.)
          const strong = fileClue && (!shape.ambiguous.has(f) || path === shape.declFile || shape.clue.test(near));
          const fn = enclosingFn(text.split('\n'), ln);
          bucket.push({ file: path, line: ln, strong, fn, live: !fn || !dead.has(fn), text: (raw[ln - 1] ?? '').trim().slice(0, 110) });
        }
      }
    }
    report.set(f, { writes, reads });
  }
  return report;
}

// ── run ──────────────────────────────────────────────────────────────────────────────────────────────
const allFiles = [...walk(join(ROOT, 'shared')), ...walk(join(ROOT, 'client'))];
const prodFiles = allFiles.filter((p) => !isTest(rel(p)));

const TOKEN_DECL = join(ROOT, 'shared/src/token.ts');
const SAVE_DECL = join(ROOT, 'client/src/save.ts');

const tokenFields = declaredFields(readFileSync(TOKEN_DECL, 'utf8'), 'Token');
const saveFields = declaredFields(readFileSync(SAVE_DECL, 'utf8'), 'SaveModel');

// DECOY: `--decoy` injects a field that provably nothing writes, to prove the probe still detects one.
const decoy = process.argv.includes('--decoy');

const shapes: Shape[] = [
  {
    name: 'Token', declFile: 'shared/src/token.ts', clue: /token/i,
    fields: decoy ? [...tokenFields, 'zz_decoy_field'] : tokenFields,
    ambiguous: collidingNames(prodFiles, new Set(tokenFields), TOKEN_DECL),
  },
  {
    name: 'SaveModel', declFile: 'client/src/save.ts', clue: /SaveModel|save\.ts|\/save\b/i,
    fields: saveFields,
    ambiguous: collidingNames(prodFiles, new Set(saveFields), SAVE_DECL),
  },
];

let failed = 0;
for (const shape of shapes) {
  // normalise every production file: comments and type declarations are neither reads nor writes, and the
  // shape's own declaration must not vouch for itself.
  const sources = new Map<string, { text: string; code: string[]; raw: string[]; lines: number[] }>();
  for (const p of prodFiles) {
    const original = readFileSync(p, 'utf8');
    let text = rel(p) === shape.declFile ? blankInterface(original, shape.name) : original;
    text = stripTypeDecls(stripComments(text));
    sources.set(rel(p), { text, raw: original.split('\n'), lines: lineIndex(text) });
  }

  const deadFns = deadFunctions(sources);
  const report = scan(shape, sources, deadFns);
  const dead: string[] = [], unreachable: string[] = [], weakOnly: string[] = [], unread: string[] = [], weakRead: string[] = [];
  for (const [f, { writes, reads }] of report) {
    const sw = writes.filter((h) => h.strong), sr = reads.filter((h) => h.strong);
    if (writes.length === 0) dead.push(f);
    else if (!writes.some((h) => h.live)) {
      // the ach_tier shape: writers exist, nothing calls them
      unreachable.push(`${f} — only writers are in never-called ${[...new Set(writes.map((h) => h.fn))].join('/')}() ` +
        `(${writes.slice(0, 2).map((h) => `${h.file}:${h.line}`).join(', ')})`);
    } else if (sw.length === 0) {
      weakOnly.push(`${f} (${writes.length} weak: ${writes.slice(0, 2).map((h) => `${h.file}:${h.line}`).join(', ')})`);
    }
    if (reads.length === 0) unread.push(`${f} (written at ${writes.slice(0, 3).map((h) => `${h.file}:${h.line}`).join(', ')})`);
    else if (sr.length === 0) weakRead.push(`${f} (${reads.length} weak)`);
  }

  console.log(`\n[field-wiring] ${shape.name}: ${shape.fields.length} fields vs ${sources.size} production files` +
    ` (${shape.ambiguous.size} name(s) also declared on other types, held to the near-context bar)`);
  if (shape.ambiguous.size) console.log(`  ambiguous: ${[...shape.ambiguous].sort().join(', ')}`);

  if (weakOnly.length) {
    console.log(`  ⚠ written ONLY by matches that could belong to another type — verify by hand:`);
    for (const l of weakOnly) console.log(`      ${l}`);
  }
  if (unread.length) console.log(`  ⚠ never read in production: ${unread.join(', ')}`);
  else if (weakRead.length) console.log(`  ⚠ read only weakly: ${weakRead.join(', ')}`);

  // `--explain <field>` dumps the raw evidence behind one verdict. A heuristic nobody can audit is a
  // heuristic nobody should trust, and the point of this probe is to be checked by hand when it speaks.
  const explain = process.argv[process.argv.indexOf('--explain') + 1];
  if (process.argv.includes('--explain') && report.has(explain)) {
    const { writes, reads } = report.get(explain)!;
    console.log(`  ── evidence for ${shape.name}.${explain} ──`);
    for (const [label, hits] of [['WRITE', writes], ['READ', reads]] as const)
      for (const h of hits) console.log(`    ${h.strong ? 'strong' : ' weak '} ${h.live ? '    ' : 'DEAD'} ${label} ${h.file}:${h.line} in ${h.fn ?? '<top level>'}()  ${h.text}`);
  }

  if (dead.length || unreachable.length) {
    failed++;
    if (dead.length) {
      console.log(`  ✗ ${dead.length} field(s) have NO writer anywhere in production — every reader gets undefined forever:`);
      for (const f of dead) console.log(`      ${f}`);
    }
    if (unreachable.length) {
      console.log(`  ✗ ${unreachable.length} field(s) are written ONLY from functions nothing calls — the ach_tier shape:`);
      for (const f of unreachable) console.log(`      ${f}`);
    }
  } else {
    console.log(`  ✓ every field has a reachable production writer`);
  }
}

if (failed) process.exit(1);
