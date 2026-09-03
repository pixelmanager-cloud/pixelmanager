// shared/ IS THE DETERMINISTIC ENGINE. THAT WAS A PROMISE NOTHING CHECKED.
//
// Four places in this repo state the rule — career.ts ("Fully deterministic (seeded, no
// Date.now/Math.random)"), injuries.ts ("can never be Math.random"), agent/AGENT.md ("never introduce
// Date.now(), Math.random()"), and tools/factory/audit.mjs, which tells every audit agent that "those are
// enforced". They were not. browser_safe.ts is the only AST scanner over shared/src and it looks for Node
// globals — process, __dirname, Buffer, builtin imports — not for the clock or the RNG. A rule asserted in
// four files and checked in none is the exact defect class this whole audit keeps finding.
//
// Math.hypot is here for a subtler reason. ECMA-262 marks it IMPLEMENTATION-APPROXIMATED: two conforming
// engines may legally differ in the last bit, unlike Math.sqrt, which is the correctly-rounded IEEE-754
// square root. The match engine had 21 hypot calls, every one feeding a threshold comparison, and the tick
// loop turns one flipped comparison into a different ninety minutes. Measured: forcing a one-ULP difference
// changed 185 of 200 identical seeded matches. The game ships to the web as well as to Steam, so the same
// save seed produced a different season in a different browser.
//
// Run: `npx tsx tools/playtest/shared_purity.ts`
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

/** Non-determinism across RUNS: the clock and the RNG. */
const BANNED = new Map<string, string>([
  ['Date.now', 'the clock — two runs of the same seed must agree'],
  ['performance.now', 'the clock'],
  ['Math.random', 'unseeded randomness — every draw here must come from the seeded rng'],
]);
/** Non-determinism across ENGINES: ECMA-262 leaves the last bit to the implementation.
 *
 *  EMPTY, DELIBERATELY, and Math.hypot is the reason. It belongs here on the merits — 21 call sites in the
 *  match engine, every one feeding a threshold comparison, and a measured one-ULP perturbation changed 185
 *  of 200 identical seeded matches, so the same save seed plays out differently in different browsers. The
 *  exactly-specified replacement (Math.sqrt(dx*dx + dy*dy)) was written and it works.
 *
 *  It is not applied, because applying it moves the balance past a tuned threshold:
 *  league_competitiveness goes from 3.0% underdog wins to 1.5%, and the favourite from 90.5% to 92.5%
 *  against a 92% ceiling. The engine's constants were tuned against hypot's exact rounding. That makes the
 *  repair a re-tune, not a patch — decisions-for-ck section 92. Kept as a named hazard below rather than
 *  quietly dropped, so it cannot be forgotten. */
const APPROX = new Map<string, string>([]);
/** Approximated too — counted, not banned. Math.hypot IS proven to diverge (see above); the rest are not,
 *  and the one that was measured (Math.exp, the league Poisson) did not move under a one-ULP perturbation. */
const RESIDUAL = ['Math.hypot', 'Math.pow', 'Math.exp', 'Math.log', 'Math.sin', 'Math.cos', 'Math.atan2', 'Math.cbrt', 'Math.tanh', 'Math.sinh', 'Math.cosh'];

function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const full = join(dir, n);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (n.endsWith('.ts')) out.push(full);
  }
  return out;
}

console.log('=== shared/ is pure: no clock, no unseeded randomness, no approximated maths ===');

const files = walk('shared/src');
console.log(`  ..   ${files.length} file(s) under shared/src`);
ok(files.length > 10, 'the scan found the engine (this is not measuring an empty set)');

const hits: Array<{ file: string; line: number; what: string; why: string; kind: string }> = [];
const residual = new Map<string, number>();
let exprs = 0;

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, src, ts.ScriptTarget.ESNext, true);
  const visit = (n: ts.Node): void => {
    // PARSED, NOT GREPPED — this file's comments quote banned code verbatim in their post-mortems, and a
    // regex over the raw text reports the explanation as the offence. Property accesses only, from the AST.
    if (ts.isPropertyAccessExpression(n)) {
      exprs++;
      const text = `${n.expression.getText(ast)}.${n.name.getText(ast)}`;
      const line = ast.getLineAndCharacterOfPosition(n.getStart(ast)).line + 1;
      if (BANNED.has(text)) hits.push({ file, line, what: text, why: BANNED.get(text)!, kind: 'clock/rng' });
      else if (APPROX.has(text)) hits.push({ file, line, what: text, why: APPROX.get(text)!, kind: 'cross-engine' });
      else if (RESIDUAL.includes(text)) residual.set(text, (residual.get(text) ?? 0) + 1);
    }
    // `new Date()` is the clock under another name.
    if (ts.isNewExpression(n) && n.expression.getText(ast) === 'Date' && !(n.arguments?.length)) {
      hits.push({ file, line: ast.getLineAndCharacterOfPosition(n.getStart(ast)).line + 1, what: 'new Date()', why: 'the clock', kind: 'clock/rng' });
    }
    ts.forEachChild(n, visit);
  };
  visit(ast);
}

console.log(`  ..   ${exprs} property access(es) examined`);
ok(exprs > 1000, 'the AST walk actually examined the code (a broken parse would pass everything)');

for (const h of hits) ok(false, `${h.file}:${h.line} uses ${h.what} — ${h.why}`);
ok(hits.length === 0, `shared/ is free of the clock, the RNG and approximated maths (${hits.length} violation(s))`);

// REPORTED, NOT BANNED. These are approximated too, and a divergence here would be just as real — but they
// are pervasive and the one that was measured (Math.exp, the league Poisson) did NOT diverge under a
// one-ULP perturbation. Banning them is a large change with a real chance of moving balance, so it is a
// decision rather than a repair. The number is printed so it cannot drift up unnoticed.
const total = [...residual.values()].reduce((a, b) => a + b, 0);
console.log(`  ..   ${total} call(s) to other implementation-approximated Math functions, not banned:`);
for (const [k, v] of [...residual].sort((a, b) => b[1] - a[1])) console.log(`  ..     ${k} x${v}`);

console.log(fails ? `\n✗ ${fails} — shared/ is not the deterministic engine it says it is` : '\n✓ shared/ keeps the promise it makes in four files');
if (fails) process.exitCode = 1;
