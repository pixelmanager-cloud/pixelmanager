// ── THE GAME MUST ACTUALLY RUN IN A BROWSER ──────────────────────────────────────────────────────────
//
// It did not, and every gate said it did.
//
// The engine rebuild made forty tuning constants overridable from the environment — `Number(process.env.TS
// ?? 0.15)` and friends — which is genuinely how the calibration defects in that file were found. But they
// are evaluated at MODULE SCOPE, and `process` does not exist in a browser. Importing the engine threw a
// ReferenceError on line 13 and the whole game went to a black screen on load.
//
// It shipped to main with a fully green gate, because NOTHING IN THE GATE RUNS THE PAGE:
//   • `npm run verify` builds the client with `tsc --noEmit && vite build` — a type-check and a bundle.
//     Neither executes a single line of the result.
//   • all sixty-six harnesses across verify / playtest / qa run under tsx in Node, where `process` exists.
// Sixty-six passing checks, and the product was a black rectangle. It was found by opening the game.
//
// This is the cheap, deterministic half of never repeating that: `shared/` and `client/src/` ship to a
// browser, so a Node-only global appearing in them is a build error, not a style preference. A guarded
// access (`typeof process !== 'undefined' && ...`) is allowed, because that is how a shared module offers
// a harness hook without assuming a runtime.
//
// The expensive half is a real page load, which belongs in a smoke test with a headless browser; this file
// deliberately does not pretend to be that, and says so rather than implying more coverage than it has.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SCAN = ['shared/src', 'client/src'];

/** Globals a browser does not have. Each is matched as a whole word so `processed` or `globalThis` do not trip it. */
const NODE_GLOBALS = ['process', '__dirname', '__filename', 'Buffer', 'require'];
/** Node built-ins that must never be imported by shipped client code. */
const NODE_MODULES = /from\s+['"](node:|fs|path|os|child_process|crypto|url|util|worker_threads)['"]/;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js)$/.test(name)) out.push(p);
  }
  return out;
}

/** Blank out string literals and comments, leaving only executable code.
 *  This is not optional decoration: the content packs are tens of thousands of lines of English prose about
 *  football, and a manager who is told to "trust the process" or a transfer that would "require a specialist"
 *  is not a Node global. A first version of this scan without it produced 24 findings, all of them sentences.
 *  Quotes are replaced rather than deleted so column positions and the rest of the line survive. */
function stripLiterals(src: string): string {
  let out = '';
  let inS: string | null = null;   // the quote character we are inside, if any
  let inLine = false, inBlock = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (inLine) { if (c === '\n') { inLine = false; out += c; } else out += ' '; continue; }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; out += '  '; i++; } else out += c === '\n' ? c : ' '; continue; }
    if (inS) {
      if (c === '\\') { out += '  '; i++; continue; }          // escaped char: skip both
      if (c === inS) { inS = null; out += ' '; continue; }
      out += c === '\n' ? c : ' ';
      continue;
    }
    if (c === '/' && n === '/') { inLine = true; out += '  '; i++; continue; }
    if (c === '/' && n === '*') { inBlock = true; out += '  '; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inS = c; out += ' '; continue; }
    out += c;
  }
  return out;
}

const problems: string[] = [];
let filesScanned = 0, guardedAllowed = 0;

for (const rel of SCAN) {
  for (const file of walk(join(ROOT, rel))) {
    filesScanned++;
    const raw = readFileSync(file, 'utf8');
    const src = stripLiterals(raw);
    const rawLines = raw.split('\n');
    const shown = relative(ROOT, file);
    src.split('\n').forEach((code, i) => {
      const at = `${shown}:${i + 1}`;
      const rawLine = rawLines[i] ?? '';
      if (NODE_MODULES.test(rawLine)) problems.push(`${at}  imports a Node built-in: ${rawLine.trim().slice(0, 100)}`);
      for (const g of NODE_GLOBALS) {
        if (!new RegExp(`(^|[^\\w.$])${g}\\b`).test(code)) continue;
        // a `typeof X !== 'undefined'` guard on the same line is the sanctioned pattern
        if (new RegExp(`typeof\\s+${g}\\s*[!=]==?\\s*['"]undefined['"]`).test(code)) { guardedAllowed++; continue; }
        // ...and so is a line that only reads a value the guard already produced
        if (g === 'process' && /\bprocess\s*&&\s*process\.env\b/.test(code)) { guardedAllowed++; continue; }
        problems.push(`${at}  uses the Node global \`${g}\` unguarded: ${rawLine.trim().slice(0, 100)}`);
      }
    });
  }
}

console.log(`[browser-safe] scanned ${filesScanned} shipped source files in ${SCAN.join(', ')}`);
if (guardedAllowed) console.log(`[browser-safe] ${guardedAllowed} guarded access(es) allowed (typeof-checked)`);
if (problems.length) {
  console.log(`\nBROWSER SAFETY FAILED — ${problems.length} Node-only reference(s) in code that ships to a browser:\n`);
  for (const p of problems) console.log(`  ✗ ${p}`);
  console.log('\nThese throw a ReferenceError at module scope in a browser and take the whole page down.');
  console.log('Guard the access (`typeof process !== \'undefined\'`) or move the code to a harness under tools/.');
  process.exit(1);
}
console.log('[browser-safe] clean — nothing in the shipped source assumes a Node runtime');
