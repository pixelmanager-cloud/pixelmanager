// THE CAREER BARS MUST ACTUALLY ANIMATE.
//
// Four `transition: width` rules were written for the career dashboard — `.cg-bar > i`,
// `.cg-dash .cg-m-bar b`, `.cg-obj-bar b`, `.op-bar-fill` — and not one of them had ever fired. Every bar
// carries its value as an inline width inside the innerHTML string that rebuilds the whole dashboard, so
// each render destroys the old node and creates a new one ALREADY at its final width. A brand-new element
// has no from-state, so there is nothing to transition out of.
//
// That is invisible: the bars show correct values, they just teleport. Which is exactly why a probe is
// needed rather than a look — the fix is a from-state that exists for one frame and is then gone.
//
// This checks the mechanism statically, at the source level, because the alternative (driving a real career
// in a browser and sampling widths mid-transition) is both slow and flaky. It asserts the three things the
// fix depends on, all of which a careless edit could remove without breaking anything visible:
//   1. the widths are snapshotted BEFORE the innerHTML write
//   2. a layout read forces the from-state to commit between the two writes
//   3. the true widths are stamped in a LATER frame, not synchronously
//
// Run: `npx tsx tools/playtest/bar_transition.ts`
import { readFileSync } from 'node:fs';

const src = readFileSync('client/src/main.ts', 'utf8');
const css = readFileSync('client/index.html', 'utf8');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The career dashboard bars animate rather than teleport ===');

// The rules whose whole purpose this is. `.cg-dash .cg-e-bar b` is the fifth, and it is listed here
// because it once was not: this list was hardcoded from the same four selectors as BAR_SEL, so when the
// energy bar turned out to be missing from both the CSS and BAR_SEL — named in renderCareer's comment but
// never actually covered by it — the probe inherited that blind spot and stayed green while energy
// teleported alone. Both halves of that fix are load-bearing, so each is asserted separately: the count
// below fails if the rule loses its transition, and the BAR_SEL check at the bottom fails if the selector
// is dropped from the snapshot. The count is exact rather than a floor, so a selector that stops matching
// fails loudly instead of quietly shrinking the list the coverage check then runs over.
const declared = ['.cg-bar > i', '.cg-dash .cg-m-bar b', '.cg-obj-bar b', '.op-bar-fill', '.cg-dash .cg-e-bar b']
  .filter((sel) => new RegExp(`${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{[^}]*transition:[^}]*width`).test(css));
console.log(`  ..   ${declared.length} of 5 bar rules still declare a width transition`);
ok(declared.length === 5, 'all five bars still declare the transition the fix exists to make usable');

const i = src.indexOf("const BAR_SEL = ");
ok(i > 0, 'renderCareer snapshots the bars through a BAR_SEL selector');
if (i > 0) {
  const block = src.slice(i, i + 1800);
  const snapAt = block.indexOf('beforeW');
  const writeAt = block.indexOf("$('academy-body').innerHTML");
  ok(snapAt >= 0 && writeAt > snapAt, 'the old widths are read BEFORE the innerHTML write destroys the nodes');
  ok(/void\s+bars\[0\]\.offsetWidth|void\s+document\.body\.offsetWidth/.test(block),
     'a layout read commits the from-state between the two width writes');
  ok(/requestAnimationFrame\(/.test(block), 'the true widths are stamped in a later frame, not synchronously');
  // Matching by index is only safe when the dashboard has the same shape as last render; without the guard
  // a bar would slide from a value that was never its own.
  ok(/beforeW\.length === bars\.length/.test(block), 'it refuses to animate when the dashboard changed shape');
  // And the selector must actually name the four bars, or the whole thing runs over an empty list.
  const sel = (block.match(/const BAR_SEL = '([^']+)'/) ?? [])[1] ?? '';
  ok(declared.every((d) => sel.includes(d)), `BAR_SEL covers every bar that declares a transition (${sel})`);
}

console.log(fails ? `\n✗ ${fails} check(s) failed — the bars are teleporting again` : '\n✓ the from-state, the reflow and the deferred stamp are all still in place');
if (fails) process.exitCode = 1;
