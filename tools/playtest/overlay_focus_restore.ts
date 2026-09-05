// EVERY OVERLAY MUST PUT KEYBOARD FOCUS BACK WHERE IT FOUND IT.
//
// `dialogify` exists to be the one place that does this: it captures `const previously =
// document.activeElement` on open and calls the restore in its close. Six of the game's seven body-level
// overlays go through it. `openPauseMenu` did not — it hand-rolls its overlay AND its own `close`, and
// that close restored `running`, removed the node, un-inerted `#app`, and then simply stopped. Measured in
// Chromium with the pause menu's exact close shape: focus `BUTTON#logout`, open, close -> `BODY#`. With
// the restore added -> `BUTTON#logout`. Menu is the top-bar button reachable on every screen, so a
// keyboard or controller player who opened it and backed out was dropped at the top of the document and
// had to re-tab the whole screen to get back to the button they had just pressed — the same defect
// already fixed for the career screen and the succession chain.
//
// THE RULE this holds: an overlay appended to <body> either goes through dialogify, or does the same two
// things itself — capture the opener BEFORE it moves focus into the overlay, and restore it LAST in
// close(), AFTER `#app` is un-inerted. The ordering is not pedantry, and it is measured, not assumed: the
// opener lives inside `#app`, and focusing a node in an inert subtree is a silent no-op. The same Chromium
// run with the restore moved one line up, above `removeAttribute('inert')`, lands on `BODY#` again — a
// mutation that reads correct in a diff and ships the original bug.
//
// Source-level for the reason modal_pause_handoff.ts is: these handlers live in a DOM-coupled monolith
// with no headless seam, and the alternative is driving a real match in a browser per assertion. Comments
// are stripped before scanning, so a comment that merely NAMES the call it is missing cannot satisfy it.
//
// MUTATION TEST, so this is not decorative. All six were applied and all six went red:
//   1. delete the restore from openPauseMenu's close -> the restore check (this is the state of the tree
//      this probe was written against, where it fails);
//   2. move that call above the `--Game.inertDepth` line -> the un-inert ordering check;
//   3. move the `const previously =` capture below the `#pm-resume` focus -> the capture ordering check;
//   4. leave the restore only inside the comment above it -> still red (comments are stripped);
//   5. delete dialogify's own restore -> the convention guard;
//   6. delete `const previously = document.activeElement` from dialogify -> the convention guard.
//
// Run: `npx tsx tools/playtest/overlay_focus_restore.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== Every <body> overlay hands keyboard focus back to whatever opened it ===');

const RESTORE = 'previously?.focus?.()';
const CAPTURE = 'const previously = document.activeElement';
const UNINERT = "removeAttribute('inert')";
const MEMBER = /\n  (?:private |public |protected )?(?:static )?(?:async )?(\w+)\s*\(/g;

/** Comments out. Every check below is an index comparison, and a comment naming the missing call would
 *  otherwise satisfy the check it is apologising for. `//` must follow start-of-line or whitespace so
 *  that a `https://` in a string survives. Indices shift, but all comparisons are within one stripped
 *  body, so only their relative order matters. */
const decomment = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').map((l) => l.replace(/(^|\s)\/\/.*$/, '$1')).join('\n');

/** The body of a class method, from its declaration to the next closing brace at class-member indent. */
const bodyOf = (name: string): string => {
  if (!name) return '';
  const decl = new RegExp(`\\n  (?:private |public |protected )?(?:static )?(?:async )?${name}\\s*\\(`).exec(src);
  if (!decl) return '';
  const end = src.indexOf('\n  }\n', decl.index);
  return decomment(end < 0 ? src.slice(decl.index) : src.slice(decl.index, end));
};
/** The class method containing this offset: the last member declaration above it. */
const enclosing = (idx: number): string => {
  let name = '';
  for (const d of src.slice(0, idx).matchAll(MEMBER)) name = d[1];
  return name;
};
const lineOf = (idx: number) => src.slice(0, idx).split('\n').length;

// VACUITY GUARD: the rule below is "delegate to dialogify, or do what dialogify does". If dialogify stops
// capturing the opener or stops restoring it, six overlays lose focus-restore in silence and every
// "delegates to dialogify" pass here becomes a lie about them.
const dlg = bodyOf('dialogify');
ok(dlg.includes(CAPTURE), 'dialogify still captures the opener (otherwise every delegation below is vacuous)');
const dlgRestore = dlg.indexOf(RESTORE);
ok(dlgRestore >= 0, 'dialogify still restores focus to the opener on close');
const dlgInert = dlg.indexOf(UNINERT);
ok(dlgInert >= 0 && dlgRestore > dlgInert, 'dialogify restores focus AFTER un-inerting #app (an inert subtree cannot take focus)');

// Every overlay appended straight to <body>. These are the modals; the player/prospect/contract cards are
// already in the DOM and get dialogify'd in place.
const sites = [...src.matchAll(/document\.body\.appendChild\(ov\);/g)]
  .map((m) => ({ owner: enclosing(m.index!), line: lineOf(m.index!) }));
console.log(`  ..   ${sites.length} <body> overlay(s): ${sites.map((s) => `${s.owner}:${s.line}`).join(', ')}`);
ok(sites.length > 0, 'there are overlays to check (this is not measuring an empty set)');

let delegated = 0, handRolled = 0, ordered = 0;
for (const s of sites) {
  const body = bodyOf(s.owner);
  if (!body) { ok(false, `${s.owner}() — main.ts:${s.line} — its method body was found (the scan is not silently skipping it)`); continue; }
  if (/const close = this\.dialogify\(ov/.test(body)) { delegated++; continue; }
  handRolled++;

  // Hand-rolled: it has to do dialogify's job itself, in dialogify's order.
  const restoreAt = body.indexOf(RESTORE);
  ok(restoreAt >= 0, `${s.owner}() — main.ts:${s.line} — hand-rolls its overlay, so its own close() must call ${RESTORE}`);
  if (restoreAt < 0) continue;

  const inertAt = body.indexOf(UNINERT);
  ok(inertAt >= 0, `${s.owner}() — its close() still un-inerts #app (the modality this restore has to survive)`);
  if (inertAt >= 0) { ok(restoreAt > inertAt, `${s.owner}() — the restore runs AFTER ${UNINERT}, so it is not a silent no-op inside an inert #app`); ordered++; }

  // The capture has to happen before the overlay takes focus, or it records the overlay's own first button
  // and "restoring" it puts focus on a node that close() has just removed.
  const captureAt = body.indexOf(CAPTURE);
  ok(captureAt >= 0, `${s.owner}() — it captures the opener with document.activeElement`);
  // Masked to the same length, so indices either side of it are unmoved.
  const moveIn = body.replace(RESTORE, RESTORE.replace('focus', 'xxxxx')).indexOf('.focus(');
  ok(moveIn >= 0, `${s.owner}() — it still moves focus into the overlay it opens`);
  if (captureAt >= 0 && moveIn >= 0) ok(captureAt < moveIn, `${s.owner}() — the capture runs BEFORE focus moves into the overlay, so it records the opener, not the overlay's own first button`);
}
console.log(`  ..   ${delegated} delegate to dialogify, ${handRolled} hand-rolled (${ordered} un-inert-ordering check(s) run)`);
ok(delegated + handRolled === sites.length, 'every overlay found was classified and measured');

console.log(fails ? `\n✗ ${fails} — an overlay drops the player on <body> when it closes`
                  : '\n✓ every <body> overlay returns focus to whatever opened it');
if (fails) process.exitCode = 1;
