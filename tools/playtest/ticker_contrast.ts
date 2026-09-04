// THE MATCH FEED'S INK MUST BE READABLE ON THE MATCH FEED'S GROUND.
//
// The ticker IS the match view — seven hundred-odd authored lines of play-by-play on one near-black plate,
// where colour is the only thing separating a goal from a lull. Nothing ever measured those colours, so one
// of them drifted under the readable floor and stayed there: `#ticker .cm-lull` painted #6a7088, which is
// 3.93:1 on the feed's #0c0c22, while every other class on the same ground sat between 6.05:1 and 19.24:1.
// The lull bank is three authored lines (“It had gone a bit flat — but here’s something.”) written to pick
// the viewer back up, and it fires in effectively every Full-mode match: lastAttackMin resets to 0 at
// kick-off, so the first attacking beat after minute 12 trips the ten-minute guard with no lull at all.
//
// The rule is already written down twice and enforced nowhere. docs/ui-visual-audit.md R3 says the ad-hoc
// greys "sit around ~3:1 contrast — below the ~4.5:1 needed for comfortable reading"; index.html's own
// comment beside .cm-min records this exact defect being fixed once already on the neighbouring rule
// (#66708a, 3.89:1, lifted to #8790ab). Prose cannot fail, so a second rule went under the floor beside it.
//
// 4.5:1 AND NOT 3:1, asserted rather than assumed: WCAG's large-text exemption starts at 24px regular, the
// ticker sets 18px, and the only .cm-* rules that touch size make text smaller (.cm-min 14px, .cm-assist
// 0.85em). Both facts are checked below, so the floor cannot be quietly argued away by a later font bump.
//
// NOT VACUOUS: a regex over a stylesheet fails by matching nothing and reporting green, so the ground
// colour and a palette of at least 20 inks must be found before anything is asserted about them. Mutation
// test: put #6a7088 back on .cm-lull and this goes red naming it at 3.93:1; rename the #ticker rules away
// and the ground check goes red instead of the file passing silently on an empty palette.
//
// Run: `npx tsx tools/playtest/ticker_contrast.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

// Strip comments first. This sheet documents almost every non-obvious rule, and those comments quote hex
// values and selectors — scanned raw, a comment about a colour reads as a declaration of one.
const css = readFileSync('client/index.html', 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');

const FLOOR = 4.5;        // WCAG 2.1 AA for normal-size text
const LARGE_PX = 24;      // …at or above which 3:1 would apply instead

/** sRGB relative luminance (WCAG 2.1). Accepts #rgb and #rrggbb — the sheet uses both (.cm-break is #cbd). */
function luminance(hex: string): number {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const chan = (i: number) => {
    const s = parseInt(h.slice(i * 2, i * 2 + 2), 16) / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(0) + 0.7152 * chan(1) + 0.0722 * chan(2);
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

console.log('=== Every colour in the match feed is readable on the match feed ===');

// Every `#ticker …{ … }` declaration block in source order. The one with an empty selector tail is the
// container itself, which supplies the ground colour and the base size the floor is chosen from.
const rules = [...css.matchAll(/#ticker(?![\w-])\s*([^{}]*?)\s*\{([^}]*)\}/g)].map((m) => ({ sel: m[1], body: m[2] }));
const container = rules.find((r) => r.sel === '')?.body ?? '';
const ground = /background:\s*(#[0-9a-f]{3,6})\b/i.exec(container)?.[1] ?? '';
const basePx = Number(/font-size:\s*([\d.]+)px/.exec(container)?.[1] ?? 0);

console.log(`  ..   ${rules.length} #ticker rule(s); ground ${ground || 'NOT FOUND'}, base text ${basePx || 'NOT FOUND'}px`);
ok(/^#[0-9a-f]{3,6}$/i.test(ground), 'the feed ground colour was located (without it nothing below means anything)');
ok(basePx > 0 && basePx < LARGE_PX, `feed text is ${basePx}px — under the ${LARGE_PX}px large-text line, so the ${FLOOR}:1 floor applies and not 3:1`);
const scaledUp = rules.filter((r) => r.sel !== '' && Number(/font-size:\s*([\d.]+)px/.exec(r.body)?.[1] ?? 0) >= LARGE_PX);
ok(scaledUp.length === 0, 'no commentary class scales itself into large text, so one floor covers the whole palette');
if (!ground) { console.log('\n✗ 1 — could not read the feed ground'); process.exit(1); }

// `(?:^|[;\s])` so `background-color:` is not read as `color:`.
const inks = rules
  .filter((r) => r.sel !== '')
  .map((r) => ({ sel: r.sel.trim(), hex: /(?:^|[;\s])color:\s*(#[0-9a-f]{3,6})\b/i.exec(r.body)?.[1] }))
  .filter((r): r is { sel: string; hex: string } => !!r.hex)
  .map((r) => ({ ...r, ratio: contrast(r.hex, ground) }))
  .sort((a, b) => a.ratio - b.ratio);

console.log(`  ..   ${inks.length} ink colour(s) declared on ${ground}; dimmest ${inks[0]?.hex} (${inks[0]?.sel}) at ${inks[0]?.ratio.toFixed(2)}:1, floor ${FLOOR}:1`);
ok(inks.length >= 20, 'the palette scan found the commentary colours (a regex matching nothing would pass every check below)');
for (const i of inks.filter((x) => x.ratio < FLOOR))
  ok(false, `#ticker ${i.sel} paints ${i.hex} at ${i.ratio.toFixed(2)}:1 on ${ground} — a player cannot read that line`);
ok(inks.every((i) => i.ratio >= FLOOR), `every commentary colour clears ${FLOOR}:1 on the feed ground`);

// …and the fix must be a lift, not a flattening. The lull line is meant to read as quiet; raising it to
// body brightness would clear the floor and lose the authored de-emphasis, which is the same bug wearing
// the opposite sign. The italic and a step below the minute stamp are what carry it.
const lull = inks.find((i) => /\.cm-lull\b/.test(i.sel));
const stamp = inks.find((i) => /\.cm-min\b/.test(i.sel));
ok(!!lull && !!stamp, 'the lull tier and the minute stamp are both still in the palette being measured');
ok(!!lull && !!stamp && lull.ratio < stamp.ratio,
   `the lull tier (${lull?.ratio.toFixed(2)}:1) is still dimmer than the minute stamp (${stamp?.ratio.toFixed(2)}:1) — lifted over the floor, not flattened into the body tier`);

console.log(fails ? `\n✗ ${fails} — the match feed is painting text a player cannot read` : '\n✓ every feed colour clears the readable floor');
if (fails) process.exitCode = 1;
