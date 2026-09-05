// A BUTTON WITH AN ICON IN IT MUST STILL BE CLICKABLE ON THE ICON.
//
// Several overlays delegate their clicks from a container and then read `e.target` directly:
//
//     el.addEventListener('click', (e) => { const t = e.target as HTMLElement;
//                                           if (t.dataset.extend) { ... } });
//
// That works only while the control's entire clickable area is the element carrying the data attribute.
// The player card's Re-sign/Extend button is not: it contains `sprite('seal')`, a real <svg> of <rect>s
// rendered at 20x20, and no pointer-events rule covers `.px` or `.ico-inline`. A click landing on the icon
// therefore reports the <rect> as the target, which carries no data-extend, and the button silently does
// nothing — on roughly a third of its own surface, at the moment the player is deciding whether to keep a
// player they have had for years.
//
// The rule: a delegated handler that dispatches on `dataset.*` must resolve the target through closest()
// first. The one deliberate exception is a backdrop test — `raw === el` — which must keep the ORIGINAL
// target, since closest() would never report the overlay itself.
//
// This is a source-level probe because these handlers live in a DOM-coupled monolith with no headless
// seam. It catches the exact shape that shipped.
//
// Run: `npx tsx tools/playtest/delegated_clicks.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');
const html = readFileSync('client/index.html', 'utf8');

console.log('=== Delegated click handlers resolve through the control, not the pixel ===');

// VACUITY GUARD 1: the premise is that sprites inside buttons are not click-transparent. If someone adds a
// blanket `pointer-events: none` for icons the whole class evaporates and these assertions stop meaning
// anything — so say so rather than passing silently.
const iconTransparent = /\.(?:px|ico-inline)[^{]*\{[^}]*pointer-events:\s*none/.test(html);
console.log(`  ..   icons are click-transparent in CSS: ${iconTransparent}`);
if (iconTransparent) {
  console.log('  ..   (a pointer-events:none rule now covers icons — this probe is moot and should be retired)');
}

// Find every delegated handler that dispatches on a data attribute.
const handlers = [...src.matchAll(/addEventListener\('click',\s*(?:async\s*)?\(e[^)]*\)\s*=>\s*\{([\s\S]{0,700}?)\n {4}\}\);/g)]
  .map((m) => m[1])
  .filter((body) => /\.dataset\.\w+/.test(body));
console.log(`  ..   ${handlers.length} delegated click handler(s) dispatching on a data attribute`);
ok(handlers.length > 0, 'there are delegated handlers to check (this is not measuring an empty set)');

for (const body of handlers) {
  const key = (body.match(/dataset\.(\w+)/) ?? [, '?'])[1];
  // Either it resolves through closest(), or every dispatch key it uses is on a text-only control.
  const resolves = /\.closest\(/.test(body);
  ok(resolves, `the handler dispatching on data-${key} resolves its target through closest()`);
}

// VACUITY GUARD 2: the specific control that shipped broken must still contain an icon, or the regression
// this was written for can no longer be reproduced and the probe is guarding nothing.
// The tag carries an aria-label between the data attribute and the `>` now — naming the subject on this
// control, because its own text is a seal glyph, a verb and a price and never said WHO the deal was for.
// Pinned on the sprite and the data attribute rather than on their adjacency, so naming it did not blind
// the guard: what this assertion is for is that the control still contains an ICON, which is the shape
// that made the original regression possible.
ok(/class="pc-extend" data-extend="\$\{p\.id\}"[^>]*><span class="ico-inline/.test(src),
   'the Re-sign/Extend button still contains a sprite (the case that made this fail)');

console.log(fails ? `\n✗ ${fails} handler(s) can be defeated by clicking the icon inside the button` : '\n✓ every delegated handler resolves through its control');
if (fails) process.exitCode = 1;
