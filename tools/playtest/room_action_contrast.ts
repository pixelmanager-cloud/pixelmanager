// A FILLED ACTION IS READABLE ON ITS OWN FILL — IN WHICHEVER ROOM IT LANDS.
//
// `.dest button.dispatch` painted #fff on `var(--accent)`: white on #6f8ad9, measured in chromium at
// 3.33:1. That is the Scouting Network's only action — "Send scout · 💰 63 ▶", six of them on screen at
// once — under the 4.5:1 floor. Forty-five lines above it in the same stylesheet sits the comment left
// behind when the IDENTICAL treatment was fixed on the club screen's `.fac-up`: "White on --accent is
// 3.33:1, under the floor this sheet holds itself to, on the primary action of the whole screen." Same
// number, same fill, same kind of control, one screen over, untouched — because a comment cannot fail.
//
// WHY THIS RENDERS INSTEAD OF READING THE SHEET. The correct treatment is `var(--room)` on
// `var(--room-ink)`, and those two are redeclared by every panel (`#scouting { --room: #a98ce8; … }`).
// What a control is actually painted is therefore a product of the cascade and of which room the element
// ends up inside — not of any hex written next to the rule. A regex would have to re-implement custom
// property resolution to answer the question, which is how you get a confident wrong number. So this
// loads the shipped stylesheet into headless chromium and reads getComputedStyle.
//
// WHY EVERY ROOM AND NOT JUST #scouting: a room-variable fill changes colour eight times. Measuring one
// room would leave the same treatment free to drop under the floor in another, which is precisely the
// half-a-fix this probe exists to stop happening a second time.
//
// 4.5:1 AND NOT 3:1, asserted rather than assumed: WCAG's large-text exemption starts at 24px regular
// (18.66px bold), and every control measured here is checked to be under that line before the floor is
// applied, so a later font bump cannot quietly argue the floor away.
//
// NOT VACUOUS. Two ways this could measure nothing and report green, both closed:
//   · the DOM chains are synthesised FROM the selectors, so a chain that does not match its own selector
//     would leave the control unstyled — the failing case silently disappears. Every scanned selector is
//     therefore required to match at least one element on the page, by name.
//   · the room axis could be inert (all eight panels painting the same thing) if `--room` never reached
//     the elements, so at least one control is required to actually change fill between rooms.
// Plus a floor on how many filled cells were measured at all. Mutation test: put `background:
// var(--accent, #2b6); color: #fff;` back on `.dest button.dispatch` and this goes red naming it at
// 3.33:1 in all eight rooms; break the chain builder and the per-selector match check goes red instead
// of the file passing over an empty measurement.
//
// Run: `npx tsx tools/playtest/room_action_contrast.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const html = readFileSync('client/index.html', 'utf8');
const style = html.slice(html.indexOf('<style'), html.lastIndexOf('</style>') + 8);
// Strip comments before scanning. This sheet documents nearly every non-obvious rule and those comments
// quote selectors and declarations — read raw, the comment ABOUT this defect parses as the defect.
const css = style.replace(/\/\*[\s\S]*?\*\//g, ' ');

const FLOOR = 4.5;    // WCAG 2.1 AA, normal-size text
const LARGE_PX = 24;  // …at or above which 3:1 would apply instead

console.log('=== Every filled action is readable on its own fill, in every room ===');

// The law being enforced is the one the sheet states itself; if it is rewritten, this probe is enforcing
// a rule nobody agreed to any more.
ok(/the room's colour marks the ONE action the room is for/.test(html),
   'the sheet still declares that the room hue is what marks a room\'s one action');

// Every panel that redeclares the room pair. This is the axis: the same rule paints eight colours.
const rooms = [...css.matchAll(/#([\w-]+)\s*\{\s*--room:\s*[^;]+;\s*--room-ink:/g)].map((m) => m[1]);
console.log(`  ..   ${rooms.length} room(s) redeclaring --room/--room-ink: ${rooms.join(', ') || '(none)'}`);
ok(rooms.length >= 8, 'the painted rooms were found (without them there is no room axis to measure)');

// Every rule that fills a button with a colour AND writes ink on it. Pseudo-classes and combinators are
// left out because they are states and shapes this cannot synthesise honestly, not because they are safe.
const sels = new Set<string>();
for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  if (!/(?:^|[;\s])background(?:-color)?:/.test(m[2]) || !/(?:^|[;\s])color:/.test(m[2])) continue;
  for (const part of m[1].split(',')) {
    const s = part.trim().replace(/\s+/g, ' ');
    if (/\bbutton\b/.test(s) && !/[:>+~[]/.test(s)) sels.add(s);
  }
}
console.log(`  ..   ${sels.size} filled-control rule(s): ${[...sels].join(' | ') || '(none)'}`);
ok(sels.size >= 8, 'the sheet\'s filled-control rules were found (a regex matching nothing passes everything below)');
if (fails) { console.log('\n✗ the stylesheet could not be read, so nothing below would be measuring anything'); process.exit(1); }

/** The smallest element chain a descendant selector matches: `.dest button.dispatch` → div.dest > button. */
function chainHtml(sel: string, key: string): string {
  let open = '', close = '';
  const toks = sel.split(' ');
  toks.forEach((t, i) => {
    const tag = /^[a-z]+/.exec(t)?.[0] ?? 'div';
    const id = /#([\w-]+)/.exec(t)?.[1];
    const cls = [...t.matchAll(/\.([\w-]+)/g)].map((x) => x[1]).join(' ');
    open += `<${tag}${id ? ` id="${id}"` : ''}${cls ? ` class="${cls}"` : ''}`
          + `${i === toks.length - 1 ? ` data-k="${key}"` : ''}>`;
    close = `</${tag}>` + close;
  });
  return `${open}Send scout${close}`;
}

const cells = new Map<string, { sel: string; room: string }>();
let body = '';
for (const room of rooms) {
  let inner = '';
  for (const sel of sels) {
    const key = `${room}::${sel}`;
    cells.set(key, { sel, room });
    inner += chainHtml(sel, key);
  }
  body += `<div id="${room}" class="panel">${inner}</div>`;
}
const page = `<!doctype html><html><head><meta charset="utf-8">${style}</head>`
  + `<body><div id="app">${body}</div></body></html>`;

/** sRGB relative luminance (WCAG 2.1), from the rgb() triples getComputedStyle hands back. */
function luminance(rgb: number[]): number {
  const c = rgb.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const nums = (s: string) => (s.match(/[\d.]+/g) ?? []).map(Number);
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

async function main() {
  let chromium: any;
  try { ({ chromium } = await import('playwright')); }
  catch { console.log('  FAIL playwright is not installed — `npm i -D playwright && npx playwright install chromium`'); process.exit(1); }
  let browser: any;
  try { browser = await chromium.launch(); }
  catch (e: any) {
    console.log(`  FAIL chromium could not launch (${String(e?.message ?? e).slice(0, 90)})`);
    console.log('       run `npx playwright install chromium`');
    process.exit(1);
  }
  const pg = await browser.newPage();
  await pg.setContent(page, { waitUntil: 'load' });

  // THE ANCHOR: a synthesised chain that misses its own selector renders a bare button, which carries no
  // solid fill and would be dropped from the measurement below without a word.
  const unmatched: string[] = await pg.evaluate(
    (list: string[]) => list.filter((s) => document.querySelectorAll(s).length === 0), [...sels]);
  ok(unmatched.length === 0,
     `every filled-control selector matched the markup built for it${unmatched.length ? ` — missed: ${unmatched.join(', ')}` : ''}`);

  const read: { k: string; fg: string; bg: string; fs: string; fw: string }[] = await pg.evaluate(() =>
    Array.from(document.querySelectorAll('[data-k]')).map((el) => {
      const c = getComputedStyle(el);
      return { k: (el as HTMLElement).dataset.k!, fg: c.color, bg: c.backgroundColor, fs: c.fontSize, fw: c.fontWeight };
    }));
  await browser.close();

  // Only controls that actually carry a solid fill are in scope: a gradient or transparent ground is a
  // different question (what shows through), and this probe would be guessing at the answer.
  const filled = read
    .map((r) => ({ ...r, ...cells.get(r.k)!, rgbF: nums(r.fg).slice(0, 3), rgbB: nums(r.bg) }))
    .filter((r) => r.rgbB.length >= 3 && (r.rgbB[3] ?? 1) > 0.99)
    .map((r) => ({ ...r, px: Number(r.fs.replace('px', '')), ratio: contrast(r.rgbF, r.rgbB.slice(0, 3)) }))
    .sort((a, b) => a.ratio - b.ratio);

  console.log(`  ..   ${filled.length} filled control(s) measured across ${rooms.length} room(s); `
    + `dimmest ${filled[0]?.sel} in #${filled[0]?.room} at ${filled[0]?.ratio.toFixed(2)}:1, floor ${FLOOR}:1`);
  ok(filled.length >= rooms.length * 4, 'the render produced filled controls to measure');

  // …and the room axis is live, not eight copies of one colour.
  const varying = [...sels].filter((s) => new Set(filled.filter((f) => f.sel === s).map((f) => f.bg)).size > 1);
  ok(varying.length > 0, `at least one control takes its fill from the room it is in (${varying.length} of ${sels.size} do)`);

  const large = filled.filter((f) => f.px >= LARGE_PX || (f.px >= 18.66 && Number(f.fw) >= 700));
  ok(large.length === 0, `no filled control is large text, so the ${FLOOR}:1 floor applies and not 3:1`);

  // One line per offending RULE, not per cell: a room-independent fill fails in all eight at once, and
  // eight copies of the same sentence buries how many distinct rules are actually broken.
  for (const s of [...sels]) {
    const bad = filled.filter((f) => f.sel === s && f.ratio < FLOOR);
    if (bad.length) ok(false, `${s} paints ${bad[0].fg} on ${bad[0].bg} at ${bad[0].ratio.toFixed(2)}:1`
      + ` in #${bad[0].room}${bad.length > 1 ? ` and ${bad.length - 1} other room(s)` : ''} — a player cannot read that action`);
  }
  ok(filled.every((f) => f.ratio >= FLOOR),
     `every filled action clears ${FLOOR}:1 on its own fill (margin ${(filled[0]?.ratio - FLOOR).toFixed(2)})`);

  console.log(fails ? `\n✗ ${fails} — a room is painting an action a player cannot read` : '\n✓ every filled action clears the readable floor in every room');
  if (fails) process.exitCode = 1;
}
void main();
