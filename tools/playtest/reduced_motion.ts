// REDUCING MOTION MUST NOT REMOVE INFORMATION.
//
// The global `prefers-reduced-motion` rule clamps every animation in the game to 0.001ms. That is the right
// default — but it is lethal to any element that sits at `opacity: 0` at rest and only becomes visible
// DURING an animation. Such an element is not calmed down by the clamp; it is deleted. A player with Reduce
// Motion enabled saw no toast anywhere in the game (every error, confirmation and rejected bid) and was
// never told a goal had been scored, because #toast and #goal-flash are both built that way.
//
// This is the project's usual defect shape wearing new clothes: a mechanism that, under one setting, cannot
// fire at all — and nothing fails, so nobody notices.
//
// The check: find every selector whose base rule sets `opacity: 0`, keep the ones whose only route to
// visible is an `animation:` declaration, and require the reduced-motion block to restore each one
// explicitly. Purely static — it reads the stylesheet, so it holds for screens no harness has ever driven.
//
// Run: `npx tsx tools/playtest/reduced_motion.ts`
import { readFileSync } from 'node:fs';

// Strip comments FIRST. Without this a rule preceded by a comment arrives with the comment glued to its
// selector, the simple-selector test rejects it, and the check quietly examines fewer elements than it
// claims to — which is how the first run of this probe passed while #toast, the worst-affected element in
// the game, was never looked at.
const css = readFileSync('client/index.html', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== Reduce Motion must not delete information ===');

// Every rule as { selector, body }. Good enough for this hand-written sheet: no nested at-rules inside the
// blocks we care about, and we only need declaration presence, not the cascade.
const rules: Array<{ sel: string; body: string; at: number }> = [];
const re = /([^{}]+)\{([^{}]*)\}/g;
let m: RegExpExecArray | null;
while ((m = re.exec(css))) rules.push({ sel: m[1].trim().replace(/\s+/g, ' '), body: m[2], at: m.index });

// The reduced-motion block(s), and everything they mention.
// BOTH CLAMPS, NOT JUST THE OS ONE. The game has two: the `@media (prefers-reduced-motion)` block, and a
// `body.reduced-motion` class driven by the in-game switch. The first version of this probe only knew about
// the media query, so it went green while a player using the in-game setting still lost every toast in the
// game — a fix that was half a fix, passed by a check that was half a check.
// Find each @media block's real extent by brace-matching rather than guessing a window. Looking a fixed
// number of characters back for the at-rule broke the moment a long comment was added between it and its
// rules — the probe then reported the OS clamp uncovered when it was covered.
const mediaSpans: Array<[number, number]> = [];
for (let i = css.indexOf('@media (prefers-reduced-motion'); i >= 0; i = css.indexOf('@media (prefers-reduced-motion', i + 1)) {
  const open = css.indexOf('{', i);
  if (open < 0) break;
  let depth = 0, j = open;
  for (; j < css.length; j++) { if (css[j] === '{') depth++; else if (css[j] === '}' && --depth === 0) break; }
  mediaSpans.push([open, j]);
}
const inMediaBlock = (at: number) => mediaSpans.some(([a2, b2]) => at > a2 && at < b2);
const rmText = rules
  .filter((r) => inMediaBlock(r.at) || /body\.reduced-motion/.test(r.sel))
  .map((r) => `${r.sel}{${r.body}}`).join('\n');
const clamps = [/@media \(prefers-reduced-motion: reduce\)/.test(css), /body\.reduced-motion \*/.test(css)].filter(Boolean).length;
console.log(`  ..   ${clamps} motion clamp(s) in the sheet (OS media query and/or the in-game switch)`);

// Elements that rest invisible.
const invisible = rules.filter((r) => /opacity:\s*0\s*[;}]/.test(r.body) && /^[#.][\w-]+$/.test(r.sel));
// ...whose only way to become visible is an animation (no other rule sets a non-zero opacity on them).
const animOnly = invisible.filter((r) => {
  const base = r.sel;
  const others = rules.filter((x) => x !== r && x.sel.startsWith(base));
  const shownByOpacity = others.some((x) => /opacity:\s*(?!0\s*[;}])[\d.]+/.test(x.body));
  const shownByAnim = others.some((x) => /animation:/.test(x.body));
  return shownByAnim && !shownByOpacity;
});

console.log(`  ..   ${invisible.length} selector(s) rest at opacity:0; ${animOnly.length} of them can only be revealed by an animation`);
// A check over an empty set proves nothing — this sheet definitely contains such elements.
ok(animOnly.length > 0, 'the stylesheet actually contains animation-only-visible elements to check');

for (const r of animOnly) {
  const esc = r.sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Each clamp must exempt it INDEPENDENTLY — a player reaches reduced motion through either one.
  const inMedia = new RegExp(`(?<!body\\.reduced-motion )${esc}[\\w.\\-]*\\s*(,|\\{)[^}]*opacity:\\s*1`, 's').test(rmText);
  const inClass = new RegExp(`body\\.reduced-motion ${esc}[\\w.\\-]*\\s*(,|\\{)[^}]*opacity:\\s*1`, 's').test(rmText)
    || new RegExp(`body\\.reduced-motion [^{]*${esc}[\\w.\\-]*[^{]*\\{[^}]*opacity:\\s*1`, 's').test(rmText);
  ok(inMedia, `${r.sel} survives the OS reduced-motion clamp`);
  ok(inClass, `${r.sel} survives the IN-GAME reduce-motion switch`);
}

console.log(fails ? `\n✗ ${fails} element(s) vanish entirely for a player who asked for less motion` : '\n✓ Reduce Motion calms the game down without deleting anything from it');
if (fails) process.exitCode = 1;
