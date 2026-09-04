// THE SUCCESSION CHAIN MUST HAND KEYBOARD FOCUS ON RATHER THAN DROP IT.
//
// Retiring the bloodline star replaces the academy panel three times in a row, and every one of those
// writes destroyed the element that was holding focus:
//
//   1. the next-life tiles -> the will cards. The handler runs ON the [data-nextlife] tile the player just
//      pressed Enter on, and it replaces #cg-nextlife — that tile's own parent — with outerHTML, so
//      document.activeElement goes back to <body>. To reach the three will cards the player then has to
//      tab past ← back, the tab bar and the entire send-off again.
//   2. the will cards -> "Raising the next generation…", which is a DISABLED button and cannot hold focus,
//      while succeed() is in flight.
//   3. the whole panel -> the heir grid, written by showHeirChoice with innerHTML.
//
// Nothing in that chain called focus(), and nothing called toast() — #toast is the game's only ARIA live
// region, so a screen reader was told nothing at all while the game replaced the screen three times and
// asked two irreversible questions. showScreen() does no focus work either, and keepFocus() — the helper
// written for exactly this failure on the career screen — is used at neither site.
//
// This is a source-level probe for the same reason delegated_clicks.ts is one: these handlers live in a
// DOM-coupled monolith with no headless seam, and the alternative (driving a real dynasty all the way to
// a retirement in a browser) is minutes of setup per assertion.
//
// It holds the three things the fix depends on, each of which a careless edit could remove without
// breaking anything visible:
//   1. focus moves AFTER each write, not before it (before it would target a node about to be destroyed);
//   2. the target carries tabindex="-1" — .focus() on a plain <div> is a silent no-op;
//   3. preventScroll, because this panel carries the whole final-season report and a bare focus() would
//      scroll the send-off the player is reading off the top of the screen.
//
// MUTATION TEST, so this is not decorative: delete either `.focus({ preventScroll: true })` line and its
// check goes red; strip `tabindex="-1"` from either target and the focusability check goes red; move a
// focus call above its own write and the ordering check goes red; rename an id on one side only and the
// id cross-check goes red. All four mutations were applied to the fixed tree and all four went red.
//
// Run: `npx tsx tools/playtest/succession_focus.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== The succession chain moves focus into every panel it replaces ===');

/** The source between two markers. '' when either is missing or out of order — which must FAIL rather
 *  than skip: an assertion run over nothing is how four dead `transition: width` rules survived here. */
function between(from: string, to: string): string {
  const a = src.indexOf(from);
  if (a < 0) return '';
  const b = src.indexOf(to, a + from.length);
  return b < 0 ? '' : src.slice(a, b);
}

/** One panel swap in the chain: the write that destroys the focused node, and the focus that must follow. */
const SITES: Array<{ what: string; from: string; to: string; write: string }> = [
  { what: 'the will cards replacing the next-life tile the player pressed Enter on',
    from: "'#cg-nextlife [data-nextlife]').forEach(", to: 'private async bringThroughHeir(',
    write: "$('cg-nextlife').outerHTML" },
  { what: 'the heir grid replacing the whole panel',
    from: 'const cards = direct.map((h, i) => card(h, i === 0))', to: "$('cg-heir-go').addEventListener(",
    write: "$('academy-body').innerHTML" },
];

let checked = 0;
for (const site of SITES) {
  const block = between(site.from, site.to);
  ok(block.length > 0, `found the code for ${site.what}`);
  if (!block) continue;
  const writeAt = block.indexOf(site.write);
  ok(writeAt >= 0, `...it still replaces the panel with ${site.write} (the write this is about)`);
  if (writeAt < 0) continue;

  // The choices it lands the player in front of must still be keyboard-reachable, or focusing a line of
  // text above them is theatre.
  ok(/this\.makeActivatable\(/.test(block), '...the choices it offers are still made keyboard-activatable');

  const m = block.match(/\$\('([\w-]+)'\)\.focus\(\{ preventScroll: true \}\)/);
  ok(!!m, '...focus is moved into the new content (preventScroll — this panel holds the final-season report)');
  if (!m) continue;
  const id = m[1];
  console.log(`  ..   focus lands on #${id}`);
  // A <div> is not focusable. Without tabindex="-1" the focus() above is a silent no-op, and every other
  // check here would pass over a screen that still dumps the player on <body>.
  ok(new RegExp(`id="${id}"[^>]*tabindex="-1"|tabindex="-1"[^>]*id="${id}"`).test(block),
     `...#${id} is emitted with tabindex="-1", so focusing it is not a silent no-op`);
  ok(block.indexOf(m[0]) > writeAt, '...and the focus runs AFTER the write, on a node that survived it');
  checked++;
}
console.log(`  ..   ${checked} of ${SITES.length} panel swaps carry a focus hand-off`);
ok(checked === SITES.length, 'both panel swaps were found and measured (this is not measuring an empty set)');

// The chain's OTHER exit — one son, no brothers — skips showHeirChoice and opens the prospect card. That
// path is already covered, but only because dialogify focuses what it opens; if that goes, the same hole
// reopens on a path nothing above watches.
ok(/focusables\(\)\[0\]\?\.focus\(\)/.test(src),
   'the no-brothers exit stays covered: dialogify still focuses the prospect card it opens');

console.log(fails ? `\n✗ ${fails} — the succession chain drops the player on <body> and says nothing`
                  : '\n✓ every panel the succession replaces hands focus on to what it asks next');
if (fails) process.exitCode = 1;
