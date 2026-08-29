// Is the feature actually CONNECTED? Twice in one session I wrote a method and never called it:
// `maybeOfferArc` (so no manager arc would ever have appeared, silently) and a call to `spTable`, a method
// that does not exist — the latter hidden because a half-written file made tsc bail before it checked
// anything. Neither is a type error and neither shows up in a test that does not run the UI.
//
// This checks the cheap, high-value invariant: every private method that represents a FEATURE is called
// from somewhere other than its own definition.
import { readFileSync } from 'node:fs';

const src = readFileSync('client/src/main.ts', 'utf8');
const defs = [...src.matchAll(/^\s*private (?:async )?([a-z][A-Za-z0-9_]*)\s*[(<]/gm)].map((m) => m[1]);
const unused: string[] = [];
for (const name of new Set(defs)) {
  // count references that are not the definition itself
  const uses = [...src.matchAll(new RegExp(`\\b${name}\\b`, 'g'))].length;
  const defCount = [...src.matchAll(new RegExp(`private (?:async )?${name}\\s*[(<]`, 'g'))].length;
  if (uses - defCount <= 0) unused.push(name);
}
console.log(`=== Wiring — ${new Set(defs).size} private methods in main.ts ===`);
if (unused.length) for (const u of unused) console.log(`  FLAG ${u} is defined but never called`);
console.log(unused.length ? `\n⚠ ${unused.length} method(s) defined but never called — a feature that cannot run` : '\n✓ every private method is reachable');
if (unused.length) process.exitCode = 1;
