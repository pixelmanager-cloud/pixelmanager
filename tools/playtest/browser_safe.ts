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
import { builtinModules } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SCAN = ['shared/src', 'client/src'];
const NODE_GLOBALS = new Set(['process', '__dirname', '__filename', 'Buffer', 'require']);
// Ask Node what its built-ins are rather than guessing. The hand-rolled regex missed `fs/promises`,
// `events`, `http` and `stream`, and would have missed every builtin added since it was written.
const BUILTINS = new Set(builtinModules);
const isNodeModule = (spec: string): boolean =>
  spec.startsWith('node:') || BUILTINS.has(spec) || BUILTINS.has(spec.split('/')[0]);
/** Objects a Node global can be reached through without naming it directly. */
const GLOBAL_OBJECTS = new Set(['globalThis', 'global', 'window', 'self']);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

/** Does a `typeof <name>` actually protect THIS reference?
 *
 *  The first version walked up to the nearest STATEMENT and asked whether a `typeof` appeared anywhere in
 *  it. One decoy in a sibling declarator therefore laundered every other declarator in the same `const` —
 *  and `const _n = typeof process, A = Number(process.env.X ?? 1), B = ...` is exactly the shape of the
 *  forty module-scope reads that took the game to a black screen. A `typeof` in one class member licensed
 *  the whole class the same way.
 *
 *  A reference is protected only when short-circuiting actually reaches it: it is on the right of an
 *  `&&`/`||`/`??` whose left tests `typeof <name>`, or inside the taken branch of a `?:` or `if` whose
 *  condition does. The walk stops at a declarator, property, function or class boundary, because those are
 *  precisely the seams a decoy used to cross. */
function mentionsTypeOf(n: ts.Node, name: string): boolean {
  let found = false;
  const scan = (x: ts.Node): void => {
    if (found) return;
    if (ts.isTypeOfExpression(x) && ts.isIdentifier(x.expression) && x.expression.text === name) { found = true; return; }
    ts.forEachChild(x, scan);
  };
  scan(n);
  return found;
}

function guardedBy(node: ts.Node, name: string): boolean {
  let cur: ts.Node = node;
  let parent = cur.parent;
  while (parent) {
    if (ts.isBinaryExpression(parent)
      && (parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
        || parent.operatorToken.kind === ts.SyntaxKind.BarBarToken
        || parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)
      && parent.right === cur && mentionsTypeOf(parent.left, name)) return true;
    if (ts.isConditionalExpression(parent) && (parent.whenTrue === cur || parent.whenFalse === cur)
      && mentionsTypeOf(parent.condition, name)) return true;
    if (ts.isIfStatement(parent) && parent.expression !== cur && mentionsTypeOf(parent.expression, name)) return true;
    // a decoy must not reach across these seams
    if (ts.isVariableDeclaration(parent) || ts.isPropertyDeclaration(parent) || ts.isPropertyAssignment(parent)
      || ts.isFunctionLike(parent) || ts.isClassLike(parent) || ts.isSourceFile(parent)) return false;
    cur = parent; parent = cur.parent;
  }
  return false;
}

/** Names this file declares itself. A class called `Buffer` or a method called `process` is yours, not
 *  Node's, and flagging it would be a false positive — 9 of them on one 13-line browser-safe file. */
function localNames(src: ts.SourceFile): Set<string> {
  const names = new Set<string>();
  const add = (n?: ts.Node) => { if (n && ts.isIdentifier(n)) names.add(n.text); };
  const visit = (n: ts.Node): void => {
    if (ts.isClassDeclaration(n) || ts.isFunctionDeclaration(n) || ts.isEnumDeclaration(n)
      || ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n)) add(n.name);
    if (ts.isVariableDeclaration(n) || ts.isParameter(n) || ts.isBindingElement(n)) add(n.name as ts.Node);
    if (ts.isImportSpecifier(n) || ts.isImportClause(n) || ts.isNamespaceImport(n)) add((n as any).name);
    if (ts.isMethodDeclaration(n) || ts.isPropertyDeclaration(n) || ts.isGetAccessor(n) || ts.isSetAccessor(n)
      || ts.isEnumMember(n)) add(n.name as ts.Node);
    ts.forEachChild(n, visit);
  };
  visit(src);
  return names;
}

const problems: string[] = [];
let filesScanned = 0, guardedAllowed = 0;

for (const rel of SCAN) {
  for (const file of walk(join(ROOT, rel))) {
    filesScanned++;
    const shown = relative(ROOT, file);
    const src = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ESNext, true);
    const mine = localNames(src);
    const at = (n: ts.Node) => `${shown}:${src.getLineAndCharacterOfPosition(n.getStart(src)).line + 1}`;

    const visit = (node: ts.Node): void => {
      // a Node built-in reached by import, re-export, or dynamic import()
      const spec = (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) ? node.moduleSpecifier
        : (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) ? node.arguments[0]
        : undefined;
      if (spec && ts.isStringLiteral(spec) && isNodeModule(spec.text)) {
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
        // `typeof process` is the safe idiom itself — its operand must not be reported
        const isTypeOfOperand = ts.isTypeOfExpression(p) && p.expression === node;
        // a name this file declares is this file's, not Node's
        const isOurs = mine.has(node.text);
        if (!isPropertyName && !isDeclName && !inType && !isTypeOfOperand && !isOurs) {
          // `globalThis.process` is a property access, but it is still a Node global reached at runtime
          if (guardedBy(node, node.text)) guardedAllowed++;
          else problems.push(`${at(node)}  uses the Node global \`${node.text}\` unguarded`);
        }
      }
      // Reached THROUGH a global object rather than named directly. Both spellings, because
      // `globalThis['process']` is an ElementAccess and slipped past a PropertyAccess-only check.
      const viaGlobal = (obj: ts.Expression, nameNode: ts.Node, text: string | undefined): void => {
        let e: ts.Expression = obj;
        while (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isTypeAssertionExpression(e) || ts.isNonNullExpression(e)) e = e.expression;
        if (!ts.isIdentifier(e) || !GLOBAL_OBJECTS.has(e.text)) return;
        if (!text || !NODE_GLOBALS.has(text)) return;
        if (guardedBy(nameNode, text)) { guardedAllowed++; return; }
        problems.push(`${at(nameNode)}  reaches the Node global \`${text}\` via ${e.text}`);
      };
      if (ts.isPropertyAccessExpression(node)) viaGlobal(node.expression, node, node.name.text);
      if (ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression)) {
        viaGlobal(node.expression, node, node.argumentExpression.text);
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
