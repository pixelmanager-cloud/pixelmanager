// ── THE ARMED SON MUST BE SAID, NOT ONLY PAINTED ─────────────────────────────────────────────────────
// showHeirChoice is the one irreversible decision in the game: you pick which boy carries the name, the
// others are gone, and there is no undo. It signalled the armed card with EXACTLY ONE THING — the `.on`
// class, whose only rule is `.cg-heir-card.on { border-color: var(--good); background: rgba(255,255,255,
// 0.06); }`. A hue swap and a 6%-white wash. makeActivatable stamps role="button" on each card and nothing
// ever set a pressed state, so every card reported aria-pressed === null; and the commit button was the
// constant `Take him on →`, which names nobody. A colour-blind player, a screen-reader player, or anyone
// who clicked and then read the button had no confirmation of WHICH son they were about to spend the rest
// of the save on. The star rating had the same hole: five ★/☆ glyphs inside an unlabelled <div>.
//
// main.ts is a DOM-coupled monolith with no seam to drive headlessly, so this guards the invariant at the
// SOURCE level, like succession_carries.ts next door. PARSED, NOT SLICED: the method body comes from the
// TypeScript AST, so a fixed byte window cannot drift off the end as comments grow.
//
// MUTATION-TESTING THIS PROBE (it must not be able to pass over nothing):
//   - delete ` aria-pressed="${on}"` from the card tag        -> check 2 FAILs
//   - delete the `setAttribute('aria-pressed', ...)` line     -> check 3 FAILs
//   - put back `>Take him on →<`                              -> checks 5 and 6 FAIL
//   - delete `role="img" aria-label=...` from the stars div   -> check 4 FAILs
//   - rename showHeirChoice                                   -> check 1 FAILs and the run stops there,
//     which is the point: every check below is positive or gated on check 1, so an empty body cannot be
//     mistaken for a clean one.
//
// Run: `npx tsx tools/playtest/heir_signal.ts`
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const srcPath = fileURLToPath(new URL('../../client/src/main.ts', import.meta.url));
const htmlPath = fileURLToPath(new URL('../../client/index.html', import.meta.url));
const src = readFileSync(srcPath, 'utf8');
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

console.log('=== The heir choice says which son is armed ===');

// 1. ANTI-VACUITY GATE. Every later check is positive or scoped to this body; two of them are negatives
//    that would sail through an empty string. So the body has to be found and has to still be the screen
//    this probe is about before anything else is allowed to report.
const node = methodNode('showHeirChoice');
const body = node?.body ? node.body.getText(ast) : '';
console.log(`  ..   showHeirChoice body: ${body.length} bytes from the AST`);
check(body.length > 500 && body.includes('data-heir') && body.includes('cg-heir-go') && body.includes('cg-heir-stars'),
  'showHeirChoice was found and still renders the heir cards, the stars and the commit button');
if (!body) { console.log('\n✗ nothing to check — showHeirChoice is gone or renamed'); process.exit(1); }

// The colour-only selection cue this whole probe exists because of. Informational: it is fine for the CSS
// to grow a second channel later, but the spoken state must be there either way.
const css = readFileSync(htmlPath, 'utf8');
const onRule = css.match(/\.cg-heir-card\.on\s*\{[^}]*\}/)?.[0]?.replace(/\s+/g, ' ') ?? '(no rule)';
console.log(`  ..   the only rule for the armed card: ${onRule}`);
check(/\.cg-heir-card\.on\s*\{/.test(css), 'the armed card is still painted for sighted players');

// 2. The card ships a pressed state in the markup, so the FIRST paint is already correct — the pre-selected
//    eldest is armed before any click happens, and a handler-only fix would leave that first render mute.
const cardTag = body.match(/`(<div class="cg-heir-card[\s\S]*?>)`/)?.[1] ?? '';
console.log(`  ..   card tag: ${cardTag || '(not found)'}`);
check(/aria-pressed=/.test(cardTag),
  'the heir card renders a pressed state, not just a border colour');

// 3. The class toggle and the pressed state move TOGETHER. Scoped to the arrow function that owns the
//    toggle, so a stray aria-pressed anywhere else in the method cannot vouch for this.
const togglers: string[] = [];
const seek = (n: ts.Node): void => {
  if (ts.isArrowFunction(n) || ts.isFunctionExpression(n)) {
    const t = n.getText(ast);
    if (/classList\.toggle\('on'/.test(t) && /\[data-heir\]|dataset\.heir/.test(t)) togglers.push(t);
  }
  ts.forEachChild(n, seek);
};
seek(node!.body!);
console.log(`  ..   ${togglers.length} handler(s) toggle the .on class on a heir card`);
check(togglers.length > 0, 'the heir cards have a selection handler at all');
check(togglers.length > 0 && togglers.every((t) => /aria-pressed/.test(t)),
  'every handler that moves the .on class moves aria-pressed with it');

// 4. The star rating is named. A bare <div> is role=generic and ARIA forbids naming a generic element, so
//    the role has to be there or the label is dropped by the readers it was written for.
const starTag = body.match(/<div class="cg-heir-stars[^>]*>/)?.[0] ?? '';
console.log(`  ..   stars tag: ${starTag || '(not found)'}`);
check(/aria-label=/.test(starTag) && /role="img"/.test(starTag),
  'the star rating carries role="img" + aria-label, so the ceiling is spoken as a number');

// 5. The commit button names the boy on first paint.
const goTag = body.match(/<button id="cg-heir-go"[\s\S]{0,80}?<\/button>/)?.[0] ?? '';
console.log(`  ..   commit button: ${goTag || '(not found)'}`);
check(/>[^<]*\$\{/.test(goTag), 'the commit button interpolates the chosen son\'s name on first render');
check(!/>\s*Take him on\s*→/.test(body), 'no constant "Take him on" — the button never names nobody');

// 6. …and is rewritten when the choice changes, or it would name the eldest for ever.
check(togglers.some((t) => /cg-heir-go/.test(t) && /textContent|innerText|innerHTML/.test(t)),
  'the selection handler rewrites the commit button label');

console.log(fails
  ? `\n✗ ${fails} problem(s) — the armed heir is signalled by colour alone`
  : '\n✓ the armed heir is named on the button and spoken by the card');
if (fails) process.exitCode = 1;
