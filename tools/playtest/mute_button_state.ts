// ── THE TOP-BAR MUTE BUTTON MUST SAY WHICH WAY IT IS SET ─────────────────────────────────────────────
// The always-visible one-press music control was the one toggle in the game whose state lived only in an
// aria-hidden glyph. `<button id="audio-toggle" ... aria-label="Toggle music">` had a FIXED name, both sync
// paths swapped only `innerHTML` and the `.muted` class, ICON_SPEAKER / ICON_MUTED are both
// `<svg aria-hidden="true">`, and the only other cue was colour (`#audio-toggle.muted svg { stroke:
// var(--muted) }`). So it announced "Toggle music, button" whether the music was playing or silenced, and
// pressing it produced the same seven words before and after — no announced change at all.
//
// TWO HALVES, AND A FIX THAT SHIPS ONLY ONE OF THEM IS STILL BROKEN:
//   the STATE — aria-pressed, in the markup and moved by every path that swaps the icon; and
//   the NAME — "Toggle music, pressed" is a verb phrase plus a state, and does not say which way it went
//   (pressed = muted, or pressed = playing?). The name has to be the stable noun phrase the Settings
//   switch already uses for the same bit — `sw(audio.isMuted(), 'music', 'Mute music')` — so the two
//   controls for one setting say one thing: "Mute music, pressed".
// Check 4 reads that label out of main.ts rather than repeating the string, so the two cannot drift apart.
//
// aria-pressed, NOT aria-checked: this is a real <button>, and button does not support aria-checked —
// the trap F-144 documents, where re-roled tiles had their aria-checked silently dropped.
//
// main.ts is a DOM-coupled monolith with no seam to drive headlessly, so this guards the invariant at the
// SOURCE level like lineup_toggle_state.ts next door, and the handler half is PARSED, NOT SLICED: the
// owning function comes from the TypeScript AST, so it cannot drift off the end as comments grow, and it
// counts however many sync sites exist — there were two identical ones, and a dedupe to one must not make
// the check vacuous.
//
// MUTATION-TESTING THIS PROBE (it must not be able to pass over nothing):
//   - drop aria-pressed from the #audio-toggle tag in index.html   -> check 3 FAILs
//   - put aria-label="Toggle music" back on the tag                -> checks 4 and 5 FAIL
//   - rename the Settings music switch's label to "Toggle music"   -> check 5 FAILs (5 is why 4 alone is
//     not enough: 4 only proves the two agree, 5 proves what they agree ON is a state, not a verb)
//   - drop the setAttribute('aria-pressed', ...) from a sync site  -> check 7 FAILs
//   - hard-code aria-pressed to a literal instead of isMuted()     -> check 7 FAILs
//   - remove aria-hidden="true" from ICON_MUTED                    -> check 8 FAILs
//   - delete the #audio-toggle button / rename the icon constants  -> check 1 / check 6 FAILs and the run
//     stops there, which is the point: every later check is scoped to something check 1 or 6 proved is
//     really still this widget, so an empty string cannot be mistaken for a clean one.
//
// Run: `npx tsx tools/playtest/mute_button_state.ts`
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const srcPath = fileURLToPath(new URL('../../client/src/main.ts', import.meta.url));
const htmlPath = fileURLToPath(new URL('../../client/index.html', import.meta.url));
const src = readFileSync(srcPath, 'utf8');
const html = readFileSync(htmlPath, 'utf8');
const ast = ts.createSourceFile(srcPath, src, ts.ScriptTarget.ESNext, true);

let fails = 0;
const check = (ok: boolean, msg: string) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails++; };

console.log('=== The top-bar mute button says whether music is off ===');

// ── 1. ANTI-VACUITY GATE for the markup half. Checks 2-5 all read this one tag; if it is gone they would
//       every one of them be testing the empty string.
const tag = html.match(/<button id="audio-toggle"[^>]*>/)?.[0] ?? '';
console.log(`  ..   button tag: ${tag || '(not found)'}`);
check(tag.length > 0, 'the top-bar #audio-toggle button is still in index.html');
if (!tag) { console.log('\n✗ nothing to check — the #audio-toggle button is gone or renamed'); process.exit(1); }

// The colour-only cue this probe exists because of. Informational: the CSS may grow another channel later,
// but the spoken state has to be there either way.
const mutedPaint = html.match(/#audio-toggle\.muted svg\s*\{[^}]*\}/)?.[0]?.replace(/\s+/g, ' ') ?? '(no rule)';
console.log(`  ..   muted paints: ${mutedPaint}`);

// ── 2. It must be a real <button> for aria-pressed to mean anything (see the F-144 note above).
check(!/\brole="/.test(tag) || /\brole="button"/.test(tag),
  'it is still a plain <button>, so aria-pressed is the state its role supports');

// ── 3. The pressed state ships IN THE MARKUP, so the button is a toggle from the first paint — before any
//       script has run, and even if the sync path is never reached on some screen.
check(/\baria-pressed="(true|false)"/.test(tag),
  'the button renders a pressed state in the markup, not only a background colour and an icon');

// ── 4. The name is the SAME noun phrase the Settings switch uses for the same bit — read out of main.ts,
//       never retyped here, so the two controls for one setting cannot drift apart.
const swLabel = src.match(/sw\(audio\.isMuted\(\),\s*'music',\s*'([^']+)'\)/)?.[1] ?? '';
const ariaLabel = tag.match(/aria-label="([^"]*)"/)?.[1] ?? '';
console.log(`  ..   Settings switch calls it: ${swLabel || '(not found)'}`);
console.log(`  ..   top-bar button calls it:  ${ariaLabel || '(no aria-label)'}`);
check(swLabel.length > 0, 'the Settings music switch still passes a spoken label (the name this borrows)');
check(swLabel.length > 0 && ariaLabel === swLabel,
  'the top-bar button and the Settings switch give the same name to the same setting');

// ── 5. …and that shared name is a STATE, not an instruction. "Toggle music, pressed" is a verb phrase
//       wearing a state: it never says which way the press went. Gated on check 4 having found a name.
check(ariaLabel.length > 0 && !/^(toggle|switch|turn|flip)\b/i.test(ariaLabel),
  'the name is a state ("Mute music"), not a verb phrase — "Toggle music, pressed" says nothing about which way');

// ── 6. ANTI-VACUITY GATE for the handler half. There were TWO byte-identical sync statements; a dedupe to
//       one is fine, zero is not — check 7 is an every() and would sail straight through an empty list.
const owners: { name: string; text: string }[] = [];
const seen = new Set<ts.Node>();
const visit = (n: ts.Node): void => {
  if (ts.isExpressionStatement(n) && /innerHTML\s*=[\s\S]*ICON_MUTED[\s\S]*ICON_SPEAKER/.test(n.getText(ast))) {
    // walk out to the function that owns this swap, so the check is scoped to the sync path itself and a
    // stray aria-pressed elsewhere in the class cannot vouch for it
    let p: ts.Node | undefined = n.parent;
    while (p && !ts.isFunctionLike(p)) p = p.parent;
    if (p && !seen.has(p)) {
      seen.add(p);
      const nm = (ts.isMethodDeclaration(p) || ts.isFunctionDeclaration(p)) && p.name ? p.name.getText(ast)
        : ts.isVariableDeclaration(p.parent) ? p.parent.name.getText(ast) : '(anonymous)';
      owners.push({ name: nm, text: p.getText(ast) });
    }
  }
  ts.forEachChild(n, visit);
};
visit(ast);
console.log(`  ..   ${owners.length} function(s) swap the speaker/muted icon: ${owners.map((o) => o.name).join(', ') || '(none)'}`);
check(owners.length > 0, 'the icon-swapping sync path was found at all');
if (!owners.length) { console.log('\n✗ nothing to check — no function swaps ICON_MUTED / ICON_SPEAKER'); process.exit(1); }

// ── 7. EVERY one of them moves the pressed state with the picture, and moves it from the LIVE mute state
//       rather than a literal — a second sync site that only changes the glyph puts the button back to
//       announcing the wrong way round, which is exactly how this shipped.
for (const o of owners) {
  check(/aria-pressed'?[^;]*isMuted\(\)/.test(o.text),
    `${o.name}() sets aria-pressed from audio.isMuted() alongside the icon it swaps`);
}

// ── 8. …and the glyphs stay hidden from the reader. They are the reason the name has to carry the state:
//       an aria-hidden <svg> contributes nothing to the accessible name, in either direction.
for (const k of ['ICON_SPEAKER', 'ICON_MUTED']) {
  const icon = src.match(new RegExp(`const ${k} = '([^']*)'`))?.[1] ?? '';
  check(icon.length > 0 && /aria-hidden="true"/.test(icon),
    `${k} is still aria-hidden — the picture cannot be the thing that announces the state`);
}

console.log(fails
  ? `\n✗ ${fails} problem(s) — the mute button announces the same words whether music is on or off`
  : '\n✓ the top-bar mute button names the setting and announces which way it is set');
if (fails) process.exitCode = 1;
