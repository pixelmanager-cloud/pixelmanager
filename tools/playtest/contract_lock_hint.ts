// THE LINE THAT SAYS WHY YOU CANNOT AFFORD HIM MUST BE READABLE.
//
// `.cn-offer.cn-locked { opacity: .45 }` and `.cn-offer .cn-o-hint { opacity: 0.6 }` are separate rules on
// nested elements, so they MULTIPLY: 0.27 of the ink, under a `grayscale(.5)` filter. Measured in chromium
// against the shipped sheet, "🔒 need 433c more" — the only place the shortfall is ever stated — rendered at
// 1.89:1, and on the recommended tile at 1.05:1, worse than the 1.71:1 that `#trophies .ach.locked`'s own
// comment calls the least readable thing in the room. The locked button is `disabled` (main.ts), so it is
// out of the tab order and skipped by screen readers: that span is the whole channel. And it was not only
// the hint — every span on a locked tile was under the floor (label 4.47:1, total 3.93:1), because the group
// opacity dims all three at once.
//
// THE RECOMMENDED TILE IS THE WORSE HALF, and it is why "stop the two opacities compounding" is not the fix
// on its own. `button.primary { background: var(--room) }` fills "Meet it" with cyan and the locked rule then
// paints `var(--warn)` yellow on it: 1.05:1, invisible at ANY opacity — lifting the group to .7 and the hint
// to 1 still measures 1.10:1 there. On that tile the ink has to stay `button.primary`'s own `--room-ink`,
// which the warn override was overriding. So the defect is a colour AND an opacity, and neither alone clears
// the floor. The third piece is source order: the hint's reset has to sit after
// `.cn-offer.primary .cn-o-hint { opacity: 0.85 }`, which is the same 0,3,0 specificity.
//
// NOT VACUOUS, in three ways. The card is rebuilt from what main.ts actually emits and those shapes are
// asserted first, so a renamed class fails here instead of leaving this measuring a card the game never
// draws. The ink is sampled as a `background: currentColor` swatch INSIDE each span — same nested opacities,
// same filter, same ground, beside a transparent twin that gives that ink's ground at the same height — so a
// swatch that fails to paint reads as ground-on-ground, 1.00:1, and goes red rather than passing on nothing.
// And the floor is paired with a dimming guard: a locked tile whose spans stop being quieter than the
// affordable tile's has been flattened into looking clickable, which is the same bug with the opposite sign,
// so "raise everything to 1" cannot pass this either.
//
// MUTATION-TESTED, all five, before this file was committed. Group opacity back to .45 → 12 red spans,
// dimmest 2.73:1. Drop the hint's `opacity: 1` → the four hints red at 2.82:1 and 4.33:1. Move that rule
// ABOVE the primary's 0.85 → "Meet it"'s hint alone red at 4.33:1, on source order. Drop the `:not(.primary)`
// from the warn colour → "Meet it"'s hint red at 1.10:1. Set the locked group to `opacity: 1` → the floor
// goes green and the dimming guard goes red on seven spans instead.
//
// reducedMotion is the game's own switch, and it is load-bearing here: #settings-ov carries
// `animation: ftfade 0.25s`, and sampling mid-fade reads the overlay's black wash into the numbers —
// measured, two identical tiles came back at 1.00:1 and 1.89:1 depending on which screenshot caught them.
//
// Run: `npx tsx tools/playtest/contract_lock_hint.ts`
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const html = readFileSync('client/index.html', 'utf8');
const src = readFileSync('client/src/main.ts', 'utf8');

const FLOOR = 4.5;   // WCAG 2.1 AA for normal-size text — the floor this sheet already holds itself to
const LARGE_PX = 24; // …at or above which 3:1 would apply instead

console.log('=== Every word on an unaffordable contract offer is still readable ===');

// ── the markup, taken from the emitter rather than retyped ───────────────────────────────────────────
const shapes: [string, RegExp][] = [
  ['an unaffordable offer is still marked .cn-locked', /afford \? '' : ' cn-locked'/],
  ['…and is still `disabled`, so its hint is the only channel left', /afford \? ` data-wage="\$\{w\}"` : ' disabled'/],
  ['the shortfall is still stated in .cn-o-hint and nowhere else on the tile', /<span class="cn-o-hint">\$\{afford \? hint : `🔒 need \$\{\(total - coins\)/],
  ['the tile still carries .cn-o-lbl and .cn-o-tot beside it', /<span class="cn-o-lbl">\$\{label\}<\/span><span class="cn-o-tot">/],
  ['"Meet it" is still the .primary tile, and is lockable like any other tier', /offer\('Meet it', 1\.0, '[^']*', 'primary'\)/],
];
for (const [msg, re] of shapes) ok(re.test(src), msg);
// If a title or aria-label is ever added to that button the visual channel stops being the only one, and
// this probe's premise needs revisiting rather than quietly passing on a weaker claim.
ok(!/class="cn-offer[^"]*"[^>]*(title=|aria-label=)/.test(src),
   'the locked button still has no title and no aria-label to carry the number instead');
if (fails) { console.log('\n✗ the contract offer card no longer has the shape this measures — retune the harness, do not delete it'); process.exit(1); }

// ── colour maths ─────────────────────────────────────────────────────────────────────────────────────
type RGB = [number, number, number];
const lum = ([r, g, b]: RGB) => {
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a: RGB, b: RGB) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

/** The one pixel a 1x1 PNG holds. Every PNG filter degenerates to the raw byte when there is no pixel to the
 *  left and no scanline above, so no unfiltering is needed — which is why the samples are taken one pixel at
 *  a time instead of decoding a screenshot of the whole card. */
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

// ── the page: the shipped sheet, and the card the emitter builds ──────────────────────────────────────
const style = html.slice(html.indexOf('<style'), html.lastIndexOf('</style>') + 8);
// Two swatches per span on their own line: one filled with `currentColor` — the ink, carried down through
// every nested opacity and the group's filter — and one transparent, giving that ink's actual ground at the
// same height, so the button's vertical gradient cannot skew the pair.
const SW = '<span class="qa-pair" style="display:block;white-space:nowrap;text-align:center">'
  + '<i class="qa-ink" style="display:inline-block;width:12px;height:10px;background:currentColor"></i>'
  + '<i class="qa-bg" style="display:inline-block;width:12px;height:10px;background:transparent"></i></span>';
const tile = (label: string, total: string, hint: string, cls: string, locked: boolean) =>
  `<button class="cn-offer ${cls}${locked ? ' cn-locked' : ''}"${locked ? ' disabled' : ' data-wage="1"'} data-t="${label}">`
  + `<span class="cn-o-lbl">${label}${SW}</span><span class="cn-o-tot">${total}${SW}</span>`
  + `<span class="cn-o-hint">${locked ? '🔒 need 433c more' : hint}${SW}</span></button>`;
const offers = (locked: boolean) =>
  tile('Lowball', '906c total', 'he refuses — costs morale', '', locked)
  + tile('Haggle', '1,042c total', 'he’ll push back', '', locked)
  + tile('Meet it', '1,133c total', 'deal done', 'primary', locked)
  + tile('Generous', '1,337c total', 'delighted + loyal', '', locked);
// The same wrapper the modal builds — `<div class="tt-card cn-card">` inside `#settings-ov`, appended to
// <body>. That matters: --room falls back to :root's cyan there, and that cyan IS the "Meet it" tile's
// ground. Both groups are rendered so every locked span has an affordable twin to be measured against.
const page = `<!doctype html><html><head><meta charset="utf-8">${style}</head><body class="no-crt">`
  + '<div id="settings-ov"><div class="tt-card cn-card"><div id="cn-body">'
  + `<div class="cn-offers" data-g="locked">${offers(true)}</div>`
  + `<div class="cn-offers" data-g="affordable">${offers(false)}</div>`
  + '</div></div></div></body></html>';

const SPANS = ['cn-o-lbl', 'cn-o-tot', 'cn-o-hint'];

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
  const pg = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: 900, height: 900 }, reducedMotion: 'reduce' });
  await pg.setContent(page, { waitUntil: 'load' });

  const pts: any[] = await pg.evaluate((spans: string[]) => [...document.querySelectorAll('.cn-offers')].flatMap((g) =>
    [...g.querySelectorAll('.cn-offer')].flatMap((btn) => spans.flatMap((c) => {
      const sp = btn.querySelector('.' + c) as HTMLElement | null;
      const ink = sp?.querySelector('.qa-ink') as HTMLElement | null;
      const bg = sp?.querySelector('.qa-bg') as HTMLElement | null;
      if (!sp || !ink || !bg) return [];
      const ri = ink.getBoundingClientRect(), rb = bg.getBoundingClientRect();
      if (ri.width < 6 || rb.width < 6) return [];   // a collapsed swatch would sample the ground twice
      return [{
        grp: (g as HTMLElement).dataset.g, t: (btn as HTMLElement).dataset.t, c,
        px: Number.parseFloat(getComputedStyle(sp).fontSize),
        groupOpacity: Number(getComputedStyle(btn).opacity),
        ix: Math.round(ri.x + ri.width / 2), iy: Math.round(ri.y + ri.height / 2),
        bx: Math.round(rb.x + rb.width / 2), by: Math.round(rb.y + rb.height / 2),
      }];
    }))), SPANS);
  for (const p of pts) {
    p.ink = pixel(await pg.screenshot({ clip: { x: p.ix, y: p.iy, width: 1, height: 1 } }));
    p.bg = pixel(await pg.screenshot({ clip: { x: p.bx, y: p.by, width: 1, height: 1 } }));
    p.ratio = contrast(p.ink, p.bg);
  }
  await browser.close();

  const locked = pts.filter((p) => p.grp === 'locked');
  const afford = pts.filter((p) => p.grp === 'affordable');
  console.log(`  ..   ${locked.length} span(s) measured on the four unaffordable tiles, ${afford.length} on their affordable twins`);
  ok(locked.length === 12 && afford.length === 12,
     'the whole card rendered — four tiers x three spans, locked and affordable (an empty scan would pass every check below)');
  if (fails) { console.log('\n✗ the harness card did not render — nothing below would be measuring anything'); process.exit(1); }

  // 4.5 AND NOT 3:1, asserted rather than assumed: WCAG's large-text exemption starts at 24px and every span
  // on this tile is 11-12px, so a later font bump cannot quietly argue the floor away.
  const biggest = Math.max(...pts.map((p) => p.px));
  ok(biggest > 0 && biggest < LARGE_PX, `the tile's biggest text is ${biggest}px — under the ${LARGE_PX}px large-text line, so ${FLOOR}:1 applies and not 3:1`);

  // ── half one: the floor ──────────────────────────────────────────────────────────────────────────────
  const worst = locked.reduce((a, b) => (a.ratio <= b.ratio ? a : b));
  console.log(`  ..   dimmest thing on an unaffordable tile: ${worst.t}/${worst.c} at ${worst.ratio.toFixed(2)}:1 (ink ${worst.ink} on ${worst.bg}), floor ${FLOOR}:1`);
  for (const p of locked.filter((x) => x.ratio < FLOOR).sort((a, b) => a.ratio - b.ratio))
    ok(false, `.${p.c} on the locked "${p.t}" tile renders at ${p.ratio.toFixed(2)}:1 — a player cannot read that`);
  ok(locked.every((p) => p.ratio >= FLOOR), `every span on every unaffordable tile clears ${FLOOR}:1 through the group opacity and the grayscale filter`);

  // ── half two: a lift, not a flattening ───────────────────────────────────────────────────────────────
  // The tile must still look unavailable. If it stops being quieter than the tile you CAN press, the fix has
  // turned a disabled control into one that invites a click — the same defect wearing the opposite sign.
  const twins = locked.map((l) => ({ l, a: afford.find((x) => x.t === l.t && x.c === l.c)! })).filter((p) => p.a);
  ok(twins.length === locked.length, 'every locked span has an affordable twin to be measured against');
  const tightest = twins.reduce((x, y) => (x.a.ratio - x.l.ratio <= y.a.ratio - y.l.ratio ? x : y));
  console.log(`  ..   still visibly unavailable: closest pair is ${tightest.l.t}/${tightest.l.c} at ${tightest.l.ratio.toFixed(2)}:1 against ${tightest.a.ratio.toFixed(2)}:1 affordable`);
  for (const p of twins.filter((x) => x.l.ratio >= x.a.ratio))
    ok(false, `.${p.l.c} on the locked "${p.l.t}" tile is as loud as the affordable one (${p.l.ratio.toFixed(2)}:1 vs ${p.a.ratio.toFixed(2)}:1) — it now reads as clickable`);
  ok(twins.every((p) => p.l.ratio < p.a.ratio), 'every locked span is still quieter than the offer you can actually make');
  const dim = Math.max(...locked.map((p) => p.groupOpacity));
  console.log(`  ..   locked tile group opacity ${dim}, with the grayscale filter on top`);
  ok(dim < 1, 'the unaffordable tile is still dimmed as a group, so the lock is a visible state and not just a cursor');

  console.log(fails ? `\n✗ ${fails} — the card cannot tell the player why the offer is locked`
    : '\n✓ the shortfall, the tier and the total all survive the locked tile\'s dimming');
  if (fails) process.exitCode = 1;
}
void main();
