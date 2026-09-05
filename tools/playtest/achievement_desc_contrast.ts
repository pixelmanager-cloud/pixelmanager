// THE LIST OF WHAT IS LEFT TO CHASE MUST BE READABLE ON THE GROUND IT IS PAINTED ON.
//
// `#trophies .ach-desc { color: #8d825f }` is the ink for every achievement description, and that list is
// the only thing in the Trophy Room that tells a player what a dynasty is FOR. It has been under the
// readable floor since the room was themed, and the first fix only half-moved it: `#trophies .ach.locked`
// went 0.4 → 0.7, which lifted the locked cards from 1.71:1 to about 2.94:1 and stopped there. The ink
// itself was never touched, so the earned cards stayed under the floor too. Nothing measured either side,
// which is the only reason "fixed" could be recorded against it.
//
// MEASURED THROUGH THE OPACITY GROUP, NOT OFF THE STYLESHEET. `#trophies .ach.locked { opacity: 0.7 }`
// makes the card a group: the ink AND the card's own gradient are both composited toward the page ground
// behind it, so contrast(#8d825f, --hall-2) read straight off the sheet is not the number a player sees.
// So the page is rendered TWICE at identical layout — once with `background: currentColor` on `.ach-desc`
// (a solid pixel of the sheet's own ink, painted inside the same group the glyphs are), once with the
// descriptions `visibility: hidden` (the card's ground showing through at the same place). Sampling the
// SAME pixel in both passes is what makes this exact: card and page are both gradients, so ink and ground
// taken from different spots would be comparing two different points of them.
//
// 4.5:1 AND NOT 3:1: `.ach-desc` is 12px, far under WCAG's 24px large-text line, and that size is read off
// the rendered element rather than assumed, so a later font bump cannot quietly move the floor. Both real
// card states are measured, locked and earned, because the one colour rule serves both.
//
// AND IT MUST BE A LIFT, NOT A FLATTENING. Deleting `opacity: 0.7` would also clear the floor, and would
// throw away the earned/locked distinction the room is built on — so the locked cards are required to stay
// quieter than the earned ones, and the group opacity is required to still be there at all.
//
// NOT VACUOUS: the descriptions come out of shared/src/achievements.ts and the card markup is checked
// against what main.ts emits, so a renamed class or a moved rule fails here instead of leaving this
// measuring a screen the game never draws; both states of every achievement must render, and the two
// passes must agree on layout, before anything is asserted. Mutation test, run before this was committed:
// put `#8d825f` back and the locked cards go red at 2.94:1 and the earned ones at 4.17:1; delete
// `opacity: 0.7` to 1 and the lift-not-flatten check goes red instead (locked 8.70:1 now beats earned
// 7.47:1), while deleting the declaration outright drops to the plain `.ach.locked` value further down;
// break the achievements read and the count check goes red rather than this passing over an empty grid.
//
// The CRT scanline/vignette overlays are switched off with the game's own `body.no-crt` class: they are
// fixed-position periodic masks that alias with a single-pixel sample and can only shrink every number.
//
// Run: `npx tsx tools/playtest/achievement_desc_contrast.ts`
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const html = readFileSync('client/index.html', 'utf8');
const mainSrc = readFileSync('client/src/main.ts', 'utf8');
const achSrc = readFileSync('shared/src/achievements.ts', 'utf8');

const FLOOR = 4.5;   // WCAG 2.1 AA, normal-size text
const LARGE_PX = 24; // …at or above which 3:1 would apply instead

console.log('=== Every achievement description is readable on the ground the Trophy Room paints it on ===');

// ── the content and the markup, taken from the game rather than retyped ─────────────────────────────
const at = achSrc.indexOf('export const ACHIEVEMENTS');
const list = achSrc.slice(at, achSrc.indexOf('\n];', at));
const descs = [...list.matchAll(/desc:\s*'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"));
console.log(`  ..   ${descs.length} achievement description(s) read from shared/src/achievements.ts`);
ok(descs.length >= 20, `the achievement list was found (${descs.length} descriptions) — a regex matching nothing would pass every check below`);
const shapes: [string, RegExp][] = [
  ["a card is still `.ach` plus `got`/`locked`, so the two states measured below are the real two", /class="ach \$\{got \? 'got' : 'locked'\}"/],
  ['the description is still `.ach-desc` inside `.ach-txt`', /<div class="ach-txt">.*<div class="ach-desc">\$\{a\.desc\}<\/div>/],
  ['the cards are still laid out in `.ach-grid`', /<div class="ach-grid">/],
];
for (const [msg, re] of shapes) ok(re.test(mainSrc), msg);
if (fails) { console.log('\n✗ the Trophy Room no longer has the shape this measures — retune the harness, do not delete it'); process.exit(1); }

// Locked and earned interleaved, so both states meet both ends of the page gradient the room paints
// behind them rather than one state sitting only where the ground happens to be kind.
const card = (d: string, got: boolean) =>
  `<div class="ach ${got ? 'got' : 'locked'}" data-state="${got ? 'got' : 'locked'}">`
  + `<span class="ach-ico">${got ? '🏅' : '🔒'}</span>`
  + `<div class="ach-txt"><div class="ach-name">Milestone</div><div class="ach-desc">${d}</div></div></div>`;
const style = html.slice(html.indexOf('<style'), html.lastIndexOf('</style>') + 8);
/** `extra` is the only harness-authored CSS, and it is what makes the two passes differ. */
const page = (extra: string) => `<!doctype html><html><head><meta charset="utf-8">${style}`
  + `<style>#trophies{width:880px;padding:16px 18px}${extra}</style>`
  + `</head><body class="no-crt"><div id="app"><div id="trophies" class="panel"><div id="trophies-body">`
  + `<div class="ach-grid">${descs.flatMap((d) => [card(d, false), card(d, true)]).join('')}</div>`
  + `</div></div></div></body></html>`;

// ── colour maths ────────────────────────────────────────────────────────────────────────────────────
type RGB = [number, number, number];
const lum = ([r, g, b]: RGB) => {
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a: RGB, b: RGB) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

/** The one pixel a 1x1 PNG holds. Every filter degenerates to the raw byte with no pixel to the left and
 *  no scanline above, so no unfiltering is needed — which is why samples are taken a pixel at a time. */
function pixel(png: Buffer): RGB {
  let off = 8; const idat: Buffer[] = [];
  while (off + 8 <= png.length) {
    const len = png.readUInt32BE(off);
    if (png.toString('ascii', off + 4, off + 8) === 'IDAT') idat.push(png.subarray(off + 8, off + 8 + len));
    off += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  return [raw[1], raw[2], raw[3]];
}

async function run() {
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
  const pg = await browser.newPage({ viewport: { width: 1000, height: 2600 }, deviceScaleFactor: 1 });

  /** Three points across each description box, at the top of its first line — the card and the page are
   *  both gradients, so one sample per card would only ever find one point of them. */
  const probePoints = async (extra: string) => {
    await pg.setContent(page(extra), { waitUntil: 'load' });
    return pg.evaluate(() => [...document.querySelectorAll('#trophies .ach-desc')].flatMap((el, i) => {
      const box = el.closest('.ach') as HTMLElement;
      const d = el.getBoundingClientRect(), cs = getComputedStyle(el);
      // Cumulative opacity of the ancestor groups: `opacity` is not inherited as a computed value, so the
      // description always reports 1 while the card around it reports 0.7.
      let alpha = 1;
      for (let n: HTMLElement | null = el as HTMLElement; n; n = n.parentElement) alpha *= Number(getComputedStyle(n).opacity);
      return [0.08, 0.5, 0.92].map((f) => ({
        i, state: box.dataset.state!, alpha, size: Number(/[\d.]+/.exec(cs.fontSize)?.[0] ?? 0), ink: cs.color,
        x: Math.round(d.x + d.width * f), y: Math.round(d.y + 4),
      }));
    }));
  };
  const inkPts: any[] = await probePoints('#trophies .ach-desc { background: currentColor; }');
  for (const p of inkPts) p.inkPx = pixel(await pg.screenshot({ clip: { x: p.x, y: p.y, width: 1, height: 1 } }));
  const gndPts: any[] = await probePoints('#trophies .ach-desc { visibility: hidden; }');
  for (const p of gndPts) p.groundPx = pixel(await pg.screenshot({ clip: { x: p.x, y: p.y, width: 1, height: 1 } }));
  await browser.close();

  // The two passes only differ by paint, so identical layout is a precondition, not a hope. If it ever
  // stops holding, the samples are of two different pictures and every ratio below is fiction.
  const aligned = inkPts.length === gndPts.length
    && inkPts.every((p, k) => p.x === gndPts[k].x && p.y === gndPts[k].y && p.state === gndPts[k].state);
  ok(aligned, `the ink pass and the ground pass laid out identically (${inkPts.length} sample points each), so each pair is one pixel measured twice`);
  if (!aligned) { console.log('\n✗ the two passes disagree on layout — the samples are not comparable'); process.exit(1); }

  const spots = inkPts.map((p, k) => ({ ...p, groundPx: gndPts[k].groundPx, ratio: contrast(p.inkPx, gndPts[k].groundPx) }));
  const locked = spots.filter((s) => s.state === 'locked');
  const got = spots.filter((s) => s.state === 'got');
  ok(locked.length === descs.length * 3 && got.length === descs.length * 3,
     `the grid drew both states of every achievement (${locked.length / 3} locked, ${got.length / 3} earned of ${descs.length})`);
  if (!locked.length || !got.length) { console.log('\n✗ nothing rendered — every floor below would pass over an empty list'); process.exit(1); }
  ok(spots.every((s) => s.size > 0 && s.size < LARGE_PX),
     `descriptions render at ${spots[0].size}px — under the ${LARGE_PX}px large-text line, so the ${FLOOR}:1 floor applies and not 3:1`);
  // If the group opacity ever goes away these stop being the composited numbers this file claims to
  // report, so say so out loud rather than quoting a comfortable ratio off a card that no longer fades.
  ok(locked.every((s) => s.alpha < 1),
     `locked cards are still a composited opacity group (${locked[0].alpha}) — the ink is measured washed toward the page behind, as a player sees it`);

  const band = (rows: any[]) => `${Math.min(...rows.map((r) => r.ratio)).toFixed(2)}:1–${Math.max(...rows.map((r) => r.ratio)).toFixed(2)}:1`;
  const wl = Math.min(...locked.map((s) => s.ratio)), wg = Math.min(...got.map((s) => s.ratio));
  console.log(`  ..   ink ${spots[0].ink} at cumulative opacity ${locked[0].alpha}: locked cards ${band(locked)}, earned cards ${band(got)}, over ${spots.length} sampled pixels; floor ${FLOOR}:1`);
  if (wl < FLOOR) ok(false, `locked achievement descriptions read at ${wl.toFixed(2)}:1 — the list telling the player what there is left to chase is the least readable thing in the room`);
  if (wg < FLOOR) ok(false, `earned achievement descriptions read at ${wg.toFixed(2)}:1 on the gold-tinted card`);
  ok(spots.every((s) => s.ratio >= FLOOR), `all ${descs.length} descriptions clear ${FLOOR}:1 in both card states, at every point of both gradients`);

  ok(wl < wg, `locked cards still read quieter than earned ones (${wl.toFixed(2)}:1 vs ${wg.toFixed(2)}:1) — lifted over the floor, not flattened by dropping the fade`);

  console.log(fails ? `\n✗ ${fails} — the Trophy Room is painting the dynasty's goal list where a player cannot read it`
    : '\n✓ every achievement description clears the readable floor in both card states');
  if (fails) process.exitCode = 1;
}
void run();
