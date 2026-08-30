// ── FIELD WIRING — does every persisted field have both a WRITER and a READER? ────────────────────────
//
// The dominant defect shape in this project, found repeatedly: a well-designed field, a consumer that
// reads it, and NOTHING that ever writes it — so the consumer silently reads undefined/0 forever and every
// test still passes. Measured instances include ach_tier and ach_promotions (deflating every legend card
// in the game), and the mirror image, `promotions`, missing from three test fixtures.
//
// This walks the declared fields of the persisted Token and reports any with no writer or no reader
// outside its own declaration. It is deliberately a HEURISTIC over source text — there is no type
// information here — so it reports rather than guesses, and only fails on the case that is unambiguous
// and has actually bitten: a field nothing writes.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname;
const DECL = 'shared/src/token.ts';

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === 'dist' || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
}

const decl = readFileSync(join(ROOT, DECL), 'utf8');
const body = decl.slice(decl.indexOf('export interface Token {'));
// field names declared on Token (skip comment lines so prose can't masquerade as a field)
const FIELDS = [...new Set(
  body.split('\n')
    .filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//') && !l.trim().startsWith('/**'))
    .flatMap((l) => [...l.matchAll(/(?:^|[;{]\s*)([a-z_][a-z0-9_]*)\??\s*:/gi)].map((m) => m[1])),
)].filter((f) => f !== 'Token');

const files = [...walk(join(ROOT, 'shared')), ...walk(join(ROOT, 'client'))]
  .filter((f) => !f.endsWith(DECL.split('/').pop()!) || !f.includes('src/token.ts'));

const src = new Map<string, string>();
for (const f of files) src.set(f, readFileSync(f, 'utf8'));

const noWriter: string[] = [], noReader: string[] = [];
for (const f of FIELDS) {
  let writes = 0, reads = 0;
  for (const [path, text] of src) {
    if (path.endsWith('src/token.ts')) continue;                 // the declaration itself is neither
    const isTest = /\/qa_|\/tools\/playtest\/|_test\.ts$|_sim\.ts$|fuzz/.test(path);
    // a WRITE looks like an object-literal key: `field: value`
    const w = (text.match(new RegExp(`(?:^|[\\s{,(])${f}\\s*:`, 'gm')) ?? []).length;
    // a READ looks like a property access: `.field` (not followed by a colon, which would be a write)
    const r = (text.match(new RegExp(`\\.${f}\\b(?!\\s*:)`, 'gm')) ?? []).length;
    // test fixtures write every field by construction, so they cannot count as evidence of real wiring —
    // that is exactly how ach_tier looked "written" while no production code touched it
    if (!isTest) { writes += w; reads += r; }
  }
  if (writes === 0) noWriter.push(f);
  else if (reads === 0) noReader.push(f);
}

console.log(`[field-wiring] ${FIELDS.length} Token fields checked against ${src.size} source files (tests excluded as evidence)`);
if (noReader.length) console.log(`  note   written but never read in production: ${noReader.join(', ')}`);
if (noWriter.length) {
  console.log(`\n✗ ${noWriter.length} Token field(s) have NO production writer — anything reading them gets undefined forever:`);
  for (const f of noWriter) console.log(`    ${f}`);
  process.exit(1);
}
console.log('✓ every Token field has a production writer');
