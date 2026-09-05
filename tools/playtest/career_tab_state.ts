// ── THE CAREER SCREEN'S TABS MUST SAY WHICH VIEW IS SHOWING ──────────────────────────────────────────
// The tab bar is the navigation of the screen the player spends ~120 turns on: Now / Player / Kit, plus
// Life and League once the career is senior. Pressing one swaps the entire body of the screen. It signalled
// which of the five is showing with EXACTLY ONE THING — the `.on` class, whose only rule is
// `.cg-tab.on { color: var(--cg-accent, #7cf); border-bottom-color: var(--cg-accent, #7cf); }`. A hue and a
// 2px underline. Nothing ever set a state, so all five reported aria-pressed === null and a screen-reader
// player heard five identical plain buttons, never told which view was on screen. This is the same defect
// already fixed four times in this one file — the deal-length selector, the temperament tiles, the heir
// cards, the lineup toggles — and the tab bar was missed by all four.
//
// aria-pressed, NOT role="tab"/aria-selected. The tab vocabulary owes the player a keyboard model this
// screen does not have: one roving tabindex across the group, Left/Right to move between tabs, and a
// role="tabpanel" for aria-controls to point at — but the body is written as loose siblings into
// #academy-body, not a panel element. Promising "tab, 3 of 5" and then not answering the arrow keys is
// worse than not promising it. These are real <button>s that Tab already reaches one at a time, so
// aria-pressed is both correct and the idiom this file already settled on.
//
// AND ON EVERY TAB, NOT ONLY THE SHOWING ONE: an omitted aria-pressed makes a button a plain button again
// rather than an unpressed toggle, which is exactly the null the four fixes above were written against.
// Check 4 is the one that catches a conditional emit, because the attribute name then hides inside the
// interpolation and the literal `aria-pressed="${` disappears from the source.
//
// main.ts is a DOM-coupled monolith with no seam to drive headlessly, so this guards the invariant at the
// SOURCE level like heir_signal.ts and lineup_toggle_state.ts next door, and PARSED, NOT SLICED: the method
// body comes from the TypeScript AST, so a fixed byte window cannot drift off the end as comments grow.
//
// MUTATION-TESTING THIS PROBE (it must not be able to pass over nothing):
//   - drop ` aria-pressed="${this.careerTab === t}"` from the tab tag  -> checks 4, 5 and 6 FAIL
//   - emit it only on the showing tab (`${on ? ' aria-pressed="true"' : ''}`) -> checks 4, 5 and 6 FAIL
//   - hard-code `aria-pressed="${true}"`                              -> checks 5 and 6 FAIL (check 5
//     resolves a bare identifier back to its `const`, and a literal has none)
//   - point it at a different flag than the `on` class uses           -> checks 5 and 6 FAIL
//   - swap aria-pressed for a bare aria-selected on the <button>      -> checks 3, 4, 5 and 6 FAIL
//   - delete the `.cg-tab.on` CSS rule                                -> check 2 FAILs (the sighted cue is
//     not allowed to leave with the spoken one)
//   - drop the `this.renderCareer(s)` from the tab click handler      -> check 7 FAILs, which is why this
//     probe needs no handler-side setAttribute check the way heir_signal.ts does: the markup is re-emitted
//     on every press, and check 7 is what keeps that true
//   - rename renderCareer / drop the tab bar                          -> check 1 FAILs and the run stops
//     there, which is the point: every check below is scoped to a body check 1 proved is non-empty and
//     still the tab bar, and check 3 is a negative that would sail straight through an empty string.
//
// Run: `npx tsx tools/playtest/career_tab_state.ts`
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const srcPath = fileURLToPath(new URL('../../client/src/main.ts', import.meta.url));
const htmlPath = fileURLToPath(new URL('../../client/index.html', import.meta.url));
const src = readFileSync(srcPath, 'utf8');
const css = readFileSync(htmlPath, 'utf8');
const ast = ts.createSourceFile(srcPath, src, ts.ScriptTarget.ESNext, true);

let fails = 0;
const check = (ok: boolean, msg: string) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails++; };

/** The method's own body text, from the AST — not a byte window off a string index. */
function methodNode(name: string): ts.MethodDeclaration | undefined {
  let found: ts.MethodDeclaration | undefined;
  const visit = (n: ts.Node): void => {
    if (found) return;
    if (ts.isMethodDeclaration(n) && n.name && ts.isIdentifier(n.name) && n.name.text === name && n.body) {
      found = n; return;
    }
    ts.forEachChild(n, visit);
  };
  visit(ast);
  return found;
}

console.log('=== The career tabs say which view is showing ===');

// ── 1. ANTI-VACUITY GATE. Every check below reads this body; check 3 is a negative that an empty string
//       would pass. So the body has to be found and has to still be the tab bar this probe is about.
const node = methodNode('renderCareer');
const body = node?.body ? node.body.getText(ast) : '';
console.log(`  ..   renderCareer body: ${body.length} bytes from the AST`);
check(body.length > 500 && body.includes('cg-tabs') && body.includes('data-tab') && body.includes('careerTab'),
  'renderCareer was found and still builds the career tab bar');
if (!body) { console.log('\n✗ nothing to check — renderCareer is gone or renamed'); process.exit(1); }

// ── 2. The colour-only cue this whole probe exists because of. The CSS may grow another channel later, but
//       the sighted player must keep this one and the reader must get a spoken state either way.
const onRule = css.match(/\.cg-tab\.on\s*\{[^}]*\}/)?.[0]?.replace(/\s+/g, ' ') ?? '(no rule)';
console.log(`  ..   the only rule for the showing tab: ${onRule}`);
check(/\.cg-tab\.on\s*\{/.test(css), 'the showing tab is still painted for sighted players');

const tabTag = body.match(/<button class="cg-tab[\s\S]*?>/)?.[0] ?? '';
console.log(`  ..   tab tag: ${tabTag || '(not found)'}`);

// ── 3. The state token has to match the role. aria-selected belongs to role="tab"/"option" and is dropped
//       on a plain <button> — the trap F-144 documents, where re-roled tiles lost their aria-checked in
//       silence. Gated on the tag having been found at all.
check(tabTag.length > 0 && (!/aria-(selected|checked)=/.test(tabTag)
    || /role="(tab|option|checkbox|radio|switch|menuitemcheckbox|menuitemradio)"/.test(tabTag)),
  'the tab uses the state its role supports — no bare aria-selected on a plain <button>');

// ── 4. The state is in the MARKUP and on EVERY tab. A conditional emit hides the attribute name inside the
//       interpolation, so the literal below is exactly what a `${on ? ' aria-pressed="true"' : ''}` loses.
const ariaExpr = tabTag.match(/aria-pressed="\$\{([^}]*)\}"/)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
check(/aria-pressed="\$\{/.test(tabTag),
  'every career tab renders aria-pressed unconditionally, so the four unselected ones are unpressed toggles and not plain buttons');

// ── 5. …and it carries the real flag, not a constant. `aria-pressed="${true}"` would pass check 4. A bare
//       identifier is resolved back to its declaration, so hoisting the comparison into one `const on` and
//       using it in both places stays green — a literal cannot borrow that door, there is no `const true`.
const bareId = /^[A-Za-z_$][\w$]*$/.test(ariaExpr) ? ariaExpr : '';
const hoisted = bareId.length > 0 && new RegExp(`(?:const|let|var)\\s+${bareId}\\s*=[^;\\n]*careerTab[^;\\n]*`).test(body);
console.log(`  ..   pressed expression: ${ariaExpr || '(none)'}${hoisted ? ' (resolved to its declaration)' : ''}`);
check(ariaExpr.length > 0 && ((/careerTab/.test(ariaExpr) && /\bt\b/.test(ariaExpr)) || hoisted),
  'the pressed state is computed from the tab being rendered against the showing tab');

// ── 6. The underline and the spoken state are WRITTEN FROM THE SAME EXPRESSION, or the screen and the
//       reader can drift and name different tabs. Deliberately textual: hoisting the comparison into one
//       `const on` and using it twice passes, rewording one of the two copies does not.
const classExpr = tabTag.match(/class="cg-tab\$\{([^}]*?)\?/)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
console.log(`  ..   'on' class expression: ${classExpr || '(none)'}`);
check(classExpr.length > 0 && ariaExpr.length > 0 && classExpr === ariaExpr,
  'the spoken state and the .on underline are written from the same expression, so they can never disagree');

// ── 7. Pressing a tab re-renders the whole bar, which is why a markup-only fix is enough here and no
//       handler needs to move the attribute by hand. If that ever stops being true this probe goes red
//       rather than quietly guarding a first paint nobody sees twice.
const handlers: string[] = [];
const seek = (n: ts.Node): void => {
  if (ts.isArrowFunction(n) || ts.isFunctionExpression(n)) {
    const t = n.getText(ast);
    if (/this\.careerTab\s*=/.test(t) && /dataset\.tab/.test(t)) handlers.push(t);
  }
  ts.forEachChild(n, seek);
};
seek(node!.body!);
console.log(`  ..   ${handlers.length} handler(s) set careerTab from a pressed tab`);
check(handlers.length > 0 && handlers.every((t) => /renderCareer\(/.test(t)),
  'every tab click re-renders the career screen, so the re-emitted markup carries the new state');

console.log(fails
  ? `\n✗ ${fails} problem(s) — the career tabs signal the showing view by colour alone`
  : '\n✓ every career tab announces whether its view is the one showing');
if (fails) process.exitCode = 1;
