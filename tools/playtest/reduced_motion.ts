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
const rmStart = css.indexOf('@media (prefers-reduced-motion: reduce)');
const rmBlocks = rules.filter((r) => r.at > rmStart && r.at < rmStart + 1400);
const rmText = rmBlocks.map((r) => `${r.sel}{${r.body}}`).join('\n');

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
  const covered = new RegExp(`${r.sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\w.\\-]*\\s*(,|\\{)`).test(rmText)
    && /opacity:\s*1/.test(rmText);
  ok(covered, `${r.sel} is restored under Reduce Motion (it is invisible at rest and only an animation reveals it)`);
}

console.log(fails ? `\n✗ ${fails} element(s) vanish entirely for a player who asked for less motion` : '\n✓ Reduce Motion calms the game down without deleting anything from it');
if (fails) process.exitCode = 1;
