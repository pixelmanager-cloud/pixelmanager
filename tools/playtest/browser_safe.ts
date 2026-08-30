// ── THE GAME MUST ACTUALLY RUN IN A BROWSER ──────────────────────────────────────────────────────────
//
// It did not, and every check said it did. Forty tuning constants were read as `Number(process.env.X ?? d)`
// at MODULE SCOPE. `process` does not exist in a browser, so importing the engine threw a ReferenceError
// before a frame rendered and the game was a black rectangle — while `npm run verify` was green, because
// `vite build` type-checks and bundles without executing, and all sixty-six harnesses run in Node.
//
// THE FIRST VERSION OF THIS GATE DID NOT WORK EITHER, which is the more useful lesson. It scanned text with
// a hand-rolled `stripLiterals()`, and an adversarial review poisoned a copy of the tree with two
// module-scope `process.env` reads and watched it print "clean" and exit 0. Six defects, all real:
//
//   1. `${...}` inside template literals was blanked, hiding executable code — 2,264 such sites in-tree.
//   2. A regex literal containing an odd number of quote characters opened a fake string state that
//      swallowed everything after it — 9 in client/src/main.ts alone, the first at line 101. Measured,
//      24,384 executable characters of that file (15.8%) were invisible to the scan.
//   3. `globalThis.process.env.X` was not matched, and throws a TypeError in a browser.
//   4. `import 'fs'` / `import 'node:fs/promises'` / `await import('node:child_process')` were all missed.
//   5. The documented guard `typeof process !== 'undefined'` was itself REJECTED, because `'undefined'`
//      was blanked before the guard regex could see it — so allow-rule 1 was dead code.
//   6. Which left allow-rule 2, `process && process.env`, as the only rule that ever fired — and it has no
//      `typeof`, so it waved through the exact crash this file exists to stop.
//
// So it uses the TypeScript parser now. An identifier is an identifier; there is no cleverness left to get
// wrong. A reference is allowed only when the statement containing it also asks `typeof <name>`, which is
// the short-circuit that makes a harness hook safe in a browser.
//
// This is still the cheap half. The expensive half is loading the built page in a headless browser, and
// this file does not pretend to be that.
import ts from 'typescript';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SCAN = ['shared/src', 'client/src'];
const NODE_GLOBALS = new Set(['process', '__dirname', '__filename', 'Buffer', 'require']);
const NODE_MODULES = /^(node:|fs$|path$|os$|child_process$|crypto$|util$|worker_threads$|module$)/;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

/** Does the statement enclosing this node short-circuit on `typeof <name>`? */
function guardedBy(node: ts.Node, name: string): boolean {
  let stmt: ts.Node = node;
  while (stmt.parent && !ts.isStatement(stmt)) stmt = stmt.parent;
  let found = false;
  const scan = (n: ts.Node): void => {
    if (found) return;
    if (ts.isTypeOfExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === name) { found = true; return; }
    ts.forEachChild(n, scan);
  };
  scan(stmt);
  return found;
}

const problems: string[] = [];
let filesScanned = 0, guardedAllowed = 0;

for (const rel of SCAN) {
  for (const file of walk(join(ROOT, rel))) {
    filesScanned++;
    const shown = relative(ROOT, file);
    const src = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ESNext, true);
    const at = (n: ts.Node) => `${shown}:${src.getLineAndCharacterOfPosition(n.getStart(src)).line + 1}`;

    const visit = (node: ts.Node): void => {
      // a Node built-in reached by import, re-export, or dynamic import()
      const spec = (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) ? node.moduleSpecifier
        : (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) ? node.arguments[0]
        : undefined;
      if (spec && ts.isStringLiteral(spec) && NODE_MODULES.test(spec.text)) {
        problems.push(`${at(node)}  imports the Node built-in '${spec.text}'`);
      }
      if (ts.isIdentifier(node) && NODE_GLOBALS.has(node.text)) {
        const p = node.parent;
        // skip anything that is not a value reference: property names, declarations, labels, types
        const isPropertyName = (ts.isPropertyAccessExpression(p) && p.name === node)
          || (ts.isPropertySignature(p) && p.name === node) || (ts.isPropertyAssignment(p) && p.name === node)
          || (ts.isBindingElement(p) && p.propertyName === node);
        const isDeclName = (ts.isVariableDeclaration(p) || ts.isParameter(p) || ts.isFunctionDeclaration(p)
          || ts.isImportSpecifier(p) || ts.isBindingElement(p)) && (p as any).name === node;
        const inType = (() => { let q: ts.Node | undefined = node; while (q) { if (ts.isTypeNode(q)) return true; q = q.parent; } return false; })();
        if (!isPropertyName && !isDeclName && !inType) {
          // `globalThis.process` is a property access, but it is still a Node global reached at runtime
          if (guardedBy(node, node.text)) guardedAllowed++;
          else problems.push(`${at(node)}  uses the Node global \`${node.text}\` unguarded`);
        }
      }
      // globalThis.process.* — a property name, so the identifier branch above skips it deliberately.
      // Unwrap parentheses and casts first: `(globalThis as any).process.env.X` is the idiomatic way to
      // write this in TypeScript, and a naive isIdentifier check misses every instance of it.
      const unwrap = (n: ts.Expression): ts.Expression => {
        let e: ts.Expression = n;
        while (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isTypeAssertionExpression(e) || ts.isNonNullExpression(e)) e = e.expression;
        return e;
      };
      if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(unwrap(node.expression)) && (unwrap(node.expression) as ts.Identifier).text === 'globalThis'
        && NODE_GLOBALS.has(node.name.text) && !guardedBy(node, node.name.text)) {
        problems.push(`${at(node)}  reaches the Node global \`${node.name.text}\` via globalThis`);
      }
      ts.forEachChild(node, visit);
    };
    visit(src);
  }
}

console.log(`[browser-safe] parsed ${filesScanned} shipped source files in ${SCAN.join(', ')}`);
if (guardedAllowed) console.log(`[browser-safe] ${guardedAllowed} guarded reference(s) allowed (short-circuited on typeof)`);
if (problems.length) {
  console.log(`\nBROWSER SAFETY FAILED — ${problems.length} Node-only reference(s) in code that ships to a browser:\n`);
  for (const p of problems) console.log(`  ✗ ${p}`);
  console.log('\nThese throw at module scope in a browser and take the whole page down.');
  console.log("Guard the access (`typeof process !== 'undefined' && ...`) or move the code to a harness under tools/.");
  process.exit(1);
}
console.log('[browser-safe] clean — nothing in the shipped source assumes a Node runtime');
