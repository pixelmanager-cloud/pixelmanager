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

// A METHOD CAN BE CALLED AND STILL HAVE A DEAD HALF. `openLineup(mode: 'standing' | 'match')` was called
// from three sites and every one of them passed 'match', so the whole 'standing' branch -- the team-sheet
// editor, `saveTeam()`, and one of the two `api.setStandingOrders` call sites -- was unreachable, and the
// only way to change your XI was to walk into a fixture. The check above could never see it: the method
// IS called. So also require that every literal in a string-union parameter is passed by some call site.
// SCAN CODE, NOT PROSE. The comment above this block contains the literal `openLineup('standing')`, and on
// the first run of this check that comment alone satisfied it -- deleting the real call site left the probe
// green. An assertion a comment can satisfy is not an assertion.
const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const modeDead: string[] = [];
for (const m of code.matchAll(/private (?:async )?([a-z][A-Za-z0-9_]*)\(\s*[a-z][A-Za-z0-9_]*:\s*((?:'[a-z-]+'\s*\|\s*)+'[a-z-]+')/g)) {
  const [, name, union] = m;
  // Skip any method some call site invokes with a VARIABLE: `wcTie(s)` where `s` is narrowed to the same
  // three literals is perfectly reachable, and a source scan cannot tell which value it carries. Only
  // methods whose every call site passes a literal can be judged this way.
  const calls = [...code.matchAll(new RegExp(`\\bthis\\.${name}\\(\\s*([^,)]*)`, 'g'))].map((c) => c[1].trim());
  if (calls.some((a) => a && !/^'[a-z-]+'$/.test(a))) continue;
  for (const lit of union.match(/'[a-z-]+'/g) ?? []) {
    const passed = new RegExp(`\\b${name}\\(\\s*${lit}`).test(code);
    if (!passed) modeDead.push(`${name}(${lit}) — declared but no call site ever passes it`);
  }
}
if (modeDead.length) for (const d of modeDead) console.log(`  FLAG ${d}`);
console.log(modeDead.length
  ? `\n⚠ ${modeDead.length} unreachable mode(s) — a branch the player can never get to`
  : `✓ every declared mode of a union-parameter method is actually reached`);
if (modeDead.length) process.exitCode = 1;

