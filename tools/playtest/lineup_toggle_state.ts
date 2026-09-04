// ── THE LINEUP SCREEN'S TWO TOGGLES MUST SAY WHICH WAY THEY ARE SET ──────────────────────────────────
// Both widgets on the matchday screen carried their on/off state in CSS alone, and one of them lied.
//
//   the MATCH PLAN rows put a ✓ in the DOM unconditionally and hid it with `.mp-check { color:
//   transparent }`. Transparent text is still text: it is in the accessibility tree either way, so all
//   seven conditional orders announced with a tick whether they were armed or not — worse than silence,
//   because an unarmed rule read out as done. makeActivatable stamps role="button" and nothing ever set a
//   pressed state, so clicking one gave no feedback at all. In forced-colors mode `color: transparent` is
//   overridden too, so every rule shows a tick on screen as well;
//
//   the CAPTAIN / PENALTY / FREE-KICK / CORNER badges are <button>s whose armed state reached only the
//   `.on` class, painted by `.slot .role-badges .rb.cap.on { background: #ffd75e; ... }` and its sibling —
//   a background colour and nothing else. A colour-blind or screen-reader player could not tell who wears
//   the armband from the ten men who do not.
//
// aria-pressed, NOT aria-checked. makeActivatable gives a generic div role="button", and button does not
// support aria-checked — the exact trap F-144 documents, where role="radio" tiles were re-roled and their
// aria-checked silently dropped. So the negative check below is load-bearing, not tidiness.
//
// main.ts is a DOM-coupled monolith with no seam to drive headlessly, so this guards the invariant at the
// SOURCE level like heir_signal.ts next door, and PARSED, NOT SLICED: both method bodies come from the
// TypeScript AST, so a fixed byte window cannot drift off the end as comments grow.
//
// MUTATION-TESTING THIS PROBE (it must not be able to pass over nothing):
//   - drop ` aria-pressed="${on}"` from the .mp-rule div        -> check 2 FAILs
//   - drop ` aria-hidden="true"` from the .mp-check span        -> check 3 FAILs
//   - drop the setAttribute('aria-pressed', ...) in the handler -> check 5 FAILs
//   - swap aria-pressed for aria-checked on the .mp-rule div    -> check 4 FAILs
//   - drop ` aria-pressed="${on}"` from the rb() <button>       -> check 7 FAILs
//   - rename renderMatchPlan / renderLineupEditor               -> check 1 / check 6 FAILs and the run stops
//     there, which is the point: every check is scoped to a body that check 1 or 6 proved is non-empty and
//     still the widget this probe is about, so an empty string cannot be mistaken for a clean one.
//
// Run: `npx tsx tools/playtest/lineup_toggle_state.ts`
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
function methodBody(name: string): { node: ts.MethodDeclaration; text: string } | undefined {
  let found: ts.MethodDeclaration | undefined;
  const visit = (n: ts.Node): void => {
    if (found) return;
    if (ts.isMethodDeclaration(n) && n.name && ts.isIdentifier(n.name) && n.name.text === name && n.body) { found = n; return; }
    ts.forEachChild(n, visit);
  };
  visit(ast);
  return found ? { node: found, text: found.body!.getText(ast) } : undefined;
}

console.log('=== The lineup screen says which way its toggles are set ===');

// ── 1. ANTI-VACUITY GATE for the match plan. Checks 2-5 are scoped to this body and one of them is a
//       negative that would sail straight through an empty string.
const mp = methodBody('renderMatchPlan');
console.log(`  ..   renderMatchPlan body: ${mp ? mp.text.length : 0} bytes from the AST`);
check(!!mp && mp.text.length > 300 && mp.text.includes('mp-rule') && mp.text.includes('data-plan'),
  'renderMatchPlan was found and still renders the conditional-order rows');
if (!mp) { console.log('\n✗ nothing to check — renderMatchPlan is gone or renamed'); process.exit(1); }

// The colour-only cue this whole probe exists because of. Informational: the CSS may grow another channel
// later, but the spoken state has to be there either way.
const mpOn = css.match(/\.mp-rule\.on\s*\{[^}]*\}/)?.[0]?.replace(/\s+/g, ' ') ?? '(no rule)';
const mpCheck = css.match(/\.mp-check\s*\{[^}]*\}/)?.[0]?.replace(/\s+/g, ' ') ?? '(no rule)';
console.log(`  ..   armed row paints: ${mpOn}`);
console.log(`  ..   the tick hides by: ${mpCheck}`);

// ── 2. The row ships a pressed state IN THE MARKUP, so the very first paint is already correct — rules
//       restored from a saved plan are armed before any click happens, and a handler-only fix leaves that
//       first render mute.
const ruleTag = mp.text.match(/<div class="mp-rule[\s\S]*?>/)?.[0] ?? '';
console.log(`  ..   rule tag: ${ruleTag || '(not found)'}`);
check(/aria-pressed="\$\{/.test(ruleTag),
  'each match-plan rule renders a pressed state built from its own armed flag, not just a background colour');

// ── 3. …and the ✓ is hidden from the reader, or an UNARMED rule still announces with a tick. This is the
//       half a colour change cannot fix: `color: transparent` hides nothing from the accessibility tree.
const tickTag = mp.text.match(/<span class="mp-check"[^>]*>/)?.[0] ?? '';
console.log(`  ..   tick span: ${tickTag || '(not found)'}`);
check(/aria-hidden="true"/.test(tickTag),
  'the always-present ✓ is aria-hidden, so an unarmed rule does not read out as done');

// ── 4. aria-checked here would be dropped on the floor: makeActivatable stamps role="button" on a generic
//       div and button does not support it (F-144). Gated on check 2 having found a real tag.
check(ruleTag.length > 0 && (!/aria-checked/.test(ruleTag) || /role="(checkbox|radio|switch|menuitemcheckbox|menuitemradio)"/.test(ruleTag)),
  'the row uses the state its role supports — no bare aria-checked on the role="button" makeActivatable stamps');

// ── 5. The class toggle and the pressed state move TOGETHER. Scoped to the handlers that own the toggle,
//       so a stray aria-pressed elsewhere in the method cannot vouch for this.
const togglers: string[] = [];
const seek = (n: ts.Node): void => {
  if (ts.isArrowFunction(n) || ts.isFunctionExpression(n)) {
    const t = n.getText(ast);
    if (/classList\.toggle\('on'/.test(t) && /dataset\.plan|data-plan/.test(t)) togglers.push(t);
  }
  ts.forEachChild(n, seek);
};
seek(mp.node.body!);
console.log(`  ..   ${togglers.length} handler(s) toggle the .on class on a match-plan rule`);
check(togglers.length > 0, 'the match-plan rules have a toggle handler at all');
check(togglers.length > 0 && togglers.every((t) => /aria-pressed/.test(t)),
  'every handler that moves the .on class moves aria-pressed with it');

// ── 6. ANTI-VACUITY GATE for the role badges.
const le = methodBody('renderLineupEditor');
console.log(`  ..   renderLineupEditor body: ${le ? le.text.length : 0} bytes from the AST`);
check(!!le && le.text.length > 500 && le.text.includes('role-badges') && le.text.includes('class="rb '),
  'renderLineupEditor was found and still renders the captain / taker badges');
if (!le) { console.log('\n✗ nothing to check — renderLineupEditor is gone or renamed'); process.exit(1); }

const rbOn = css.match(/\.rb\.cap\.on\s*\{[^}]*\}/)?.[0]?.replace(/\s+/g, ' ') ?? '(no rule)';
console.log(`  ..   armed badge paints: ${rbOn}`);

// ── 7. The badge is a real <button>, so aria-pressed is native there. The whole editor re-renders on every
//       click, so the markup alone is enough — but only if the flag reaches the attribute and not just the
//       class name.
const rbTag = le.text.match(/<button class="rb [\s\S]*?>/)?.[0] ?? '';
console.log(`  ..   badge tag: ${rbTag || '(not found)'}`);
check(/aria-pressed="\$\{on\}"/.test(rbTag),
  'the captain / penalty / free-kick / corner badges render aria-pressed from the same flag that sets .on');

console.log(fails
  ? `\n✗ ${fails} problem(s) — the lineup screen's toggles keep their state in CSS colour only`
  : '\n✓ both lineup toggles announce whether they are armed');
if (fails) process.exitCode = 1;
