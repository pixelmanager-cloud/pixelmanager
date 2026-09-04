// THE BLOODLINE STAR'S ROW MUST CARRY A MARK THE PLAYER CAN ACTUALLY SEE.
//
// `table.squad tr.nft-row td.pos, …td.stat { filter: brightness(1.02); }` was the only row-scoped rule for
// the star's row — every other rule in that block styles the name cell alone. A 1.02x multiplier on cells
// that already carry saturated opaque backgrounds moves them by 2-4 values out of 255. Measured in chromium
// against the shipped sheet, that was ΔE00 0.00–1.14 per cell: QUIETER THAN THE TABLE'S OWN ZEBRA STRIPE
// (`table tbody tr:nth-child(even) td`, ΔE00 1.62). The deliberate mark on the one row the player scans for
// was less visible than the incidental striping, and the slot where a real highlight would go was occupied.
//
// THE STRIPE IS THE ANCHOR, and it is read off the same page rather than hard-coded: it is the smallest
// row-level difference this sheet already considers worth painting, so a "highlight" below it is not one.
//
// THE OTHER HALF IS THE RAMP, and it is why "just raise the multiplier" is the wrong fix. `td.stat`'s
// background is statColor()'s five-step ramp painted inline — it is the column's information channel. This
// measures the highlighted cell against EVERY unhighlighted step, not against its own: at 0.10 white the top
// green stays nearest its own step by 1.8x, at 0.14 by 1.1x, and at 0.18 a highlighted 17+ cell is nearer the
// 14-16 band's colour than its own. So the two halves pull opposite ways and no single number satisfies both
// by drifting — which is the whole reason the dead rule could not simply be turned up.
//
// WHY !important, and why a probe rather than a read: the stat cells carry `style="background:…"`, and an
// inline `background` shorthand also sets `background-image: none`, which beats any non-important author
// rule regardless of selector. Without the flag the overlay is dead on exactly the columns it matters in —
// the same invisible-rule bug in new clothes, and reading the CSS will not tell you which one you have.
//
// NOT VACUOUS: the ramp comes out of statColor() in main.ts and the cell shapes are checked against the
// markup renderSquad() emits, so a renamed class or a moved inline style fails here instead of leaving this
// measuring a table the game never draws; the stripe anchor and a five-colour ramp must both be found before
// anything is asserted. Mutation test: put `filter: brightness(1.02)` back and every cell goes red at
// 0.00–1.14 vs the 1.62 stripe; drop the `!important` and the five stat cells go red while pos/name pass;
// raise the alpha to 0.18 and ramp integrity goes red (x0.79) together with the bronze tier's name ink
// (3.97:1) — measured, all four, before this file was committed.
//
// The CRT scanline/vignette overlays are switched off with the game's own `body.no-crt` class: they are
// fixed-position periodic masks that alias with a single-pixel sample, and they darken the star's row and
// its neighbours identically, so they can only shrink every number below.
//
// Run: `npx tsx tools/playtest/star_row_highlight.ts`
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const html = readFileSync('client/index.html', 'utf8');
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== The star\'s squad-table row wears a mark you can see, and the stat ramp survives it ===');

// ── the colours and the markup, taken from the game rather than retyped ──────────────────────────────
const rampBody = (/function statColor\(v: number\): string \{([\s\S]*?)\n\}/.exec(src) ?? [])[1] ?? '';
const RAMP = [...rampBody.matchAll(/'(#[0-9a-f]{6})'/gi)].map((m) => m[1]);
// Every shape this harness reproduces. If renderSquad stops emitting one of these, the table measured below
// is a fiction and the check has to fail rather than pass on it.
const shapes: [string, RegExp][] = [
  ['the star\'s row still carries .nft-row', /nft \? ' nft-row' : ''/],
  ['stat cells still paint statColor INLINE (which is what the overlay has to survive)', /<td class="stat" style="background:\$\{statColor\(/],
  ['the position chip is still td.pos with a role class', /<td class="pos role-\$\{p\.role\}"/],
  ['the age cell is still td.stat.age', /<td class="stat age">/],
  ['the in-XI marker is still td.inxi-mark', /<td class="inxi-mark">/],
];
console.log(`  ..   statColor ramp: ${RAMP.join(' ') || '(none found)'}`);
ok(RAMP.length === 5, `statColor's ramp was read out of main.ts (${RAMP.length} steps) — without it nothing below is measuring the stat column`);
for (const [msg, re] of shapes) ok(re.test(src), msg);
if (fails) { console.log('\n✗ the squad table no longer has the shape this measures — retune the harness, do not delete it'); process.exit(1); }

const style = html.slice(html.indexOf('<style'), html.lastIndexOf('</style>') + 8);
// The star's row and an ordinary row, at BOTH nth-child parities, because the sheet's zebra rule paints
// even rows and a highlight that only shows on one parity is half a highlight.
const row = (cls: string, n: number) =>
  `<tr class="${cls}" data-n="${n}"><td class="inxi-mark" data-c="mark">&#9679;</td>`
  + `<td class="pos role-FW" data-c="pos">FW</td>`
  + `<td class="name nft-name tier-gold" data-c="name">Ross</td>`
  + RAMP.map((c, i) => `<td class="stat" data-c="s${i}" style="background:${c}">${10 + i}</td>`).join('')
  + `<td class="stat age" data-c="age">24</td></tr>`;
const CELLS = ['mark', 'pos', 'name', ...RAMP.map((_, i) => `s${i}`), 'age'];
const page = `<!doctype html><html><head><meta charset="utf-8">${style}`
  + `<style>html,body{background:var(--panel)}table.squad{table-layout:fixed;width:660px}table.squad td{height:34px}</style>`
  + `</head><body class="no-crt"><div id="app"><table class="squad">`
  + `${row('', 0)}${row('', 1)}${row('nft-row', 2)}${row('nft-row', 3)}</table></div></body></html>`;

// ── colour maths: CIEDE2000 for "can you see it", WCAG for "can you still read it" ──────────────────
type RGB = [number, number, number];
function lab([r, g, b]: RGB): RGB {
  const f = (v: number) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const R = f(r), G = f(g), B = f(b);
  const g2 = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const X = g2((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047);
  const Y = g2(0.2126 * R + 0.7152 * G + 0.0722 * B);
  const Z = g2((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
  return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
}
function dE(c1: RGB, c2: RGB): number {
  const [L1, a1, b1] = lab(c1), [L2, a2, b2] = lab(c2);
  const Cb = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cb, 7) / (Math.pow(Cb, 7) + Math.pow(25, 7))));
  const A1 = (1 + G) * a1, A2 = (1 + G) * a2;
  const Cp1 = Math.hypot(A1, b1), Cp2 = Math.hypot(A2, b2);
  const hue = (a: number, b: number) => { if (a === 0 && b === 0) return 0; const x = Math.atan2(b, a) * 180 / Math.PI; return x < 0 ? x + 360 : x; };
  const h1 = hue(A1, b1), h2 = hue(A2, b2);
  const dL = L2 - L1, dC = Cp2 - Cp1;
  let dh = 0;
  if (Cp1 * Cp2 !== 0) { dh = h2 - h1; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360; }
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin(dh * Math.PI / 360);
  const Lb = (L1 + L2) / 2, Cpb = (Cp1 + Cp2) / 2;
  let hb = h1 + h2;
  if (Cp1 * Cp2 !== 0) hb = Math.abs(h1 - h2) > 180 ? (h1 + h2 + 360) / 2 : (h1 + h2) / 2;
  const T = 1 - 0.17 * Math.cos((hb - 30) * Math.PI / 180) + 0.24 * Math.cos(2 * hb * Math.PI / 180)
    + 0.32 * Math.cos((3 * hb + 6) * Math.PI / 180) - 0.20 * Math.cos((4 * hb - 63) * Math.PI / 180);
  const Rt = -Math.sin(2 * (30 * Math.exp(-Math.pow((hb - 275) / 25, 2))) * Math.PI / 180)
    * 2 * Math.sqrt(Math.pow(Cpb, 7) / (Math.pow(Cpb, 7) + Math.pow(25, 7)));
  const Sl = 1 + (0.015 * Math.pow(Lb - 50, 2)) / Math.sqrt(20 + Math.pow(Lb - 50, 2));
  const Sc = 1 + 0.045 * Cpb, Sh = 1 + 0.015 * Cpb * T;
  return Math.sqrt(Math.pow(dL / Sl, 2) + Math.pow(dC / Sc, 2) + Math.pow(dH / Sh, 2) + Rt * (dC / Sc) * (dH / Sh));
}
const lum = ([r, g, b]: RGB) => {
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a: RGB, b: RGB) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const over = (ink: RGB, alpha: number, bg: RGB): RGB => ink.map((v, i) => alpha * v + (1 - alpha) * bg[i]) as RGB;
const parseRGB = (s: string): RGB => (s.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number) as RGB;
const hexRGB = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;

/** The one pixel a 1x1 PNG holds. Every PNG filter degenerates to the raw byte when there is no pixel to
 *  the left and no scanline above, so no unfiltering is needed — which is the whole reason the samples are
 *  taken one pixel at a time instead of decoding a screenshot of the table. */
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
  const pg = await browser.newPage({ deviceScaleFactor: 1 });
  await pg.setContent(page, { waitUntil: 'load' });

  const cells: any[] = await pg.evaluate(() => [...document.querySelectorAll('table.squad td')].map((el) => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return {
      n: Number((el.closest('tr') as HTMLElement).dataset.n), c: (el as HTMLElement).dataset.c,
      // A pixel inside the cell's padding at the far right, clear of the centred glyphs and of the
      // 1px bottom border — the cell's own ground, not antialiased type.
      x: Math.round(r.x + r.width - 4), y: Math.round(r.y + 3),
      img: cs.backgroundImage === 'none' ? 'none' : 'overlay', ink: cs.color, alpha: Number(cs.opacity),
    };
  }));
  for (const c of cells) c.px = pixel(await pg.screenshot({ clip: { x: c.x, y: c.y, width: 1, height: 1 } }));
  await browser.close();

  const at = (n: number, c: string) => cells.find((x) => x.n === n && x.c === c)!;
  ok(cells.length === 4 * CELLS.length, `both rows rendered every cell the squad table draws (${cells.length}/${4 * CELLS.length})`);
  if (fails) { console.log('\n✗ the harness table did not render — nothing below would be measuring anything'); process.exit(1); }
  const pairs = CELLS.flatMap((c) => [{ c, par: 'odd', a: at(0, c), b: at(2, c) }, { c, par: 'even', a: at(1, c), b: at(3, c) }]);

  // ── the anchor: the sheet's own zebra stripe ────────────────────────────────────────────────────────
  // Measured on the cells the stripe can actually reach; the stat cells' inline background beats it, which
  // is exactly why a rule that only tints backgrounds cannot mark the star's row on its own.
  const stripe = Math.max(...['mark', 'name'].map((c) => dE(at(0, c).px, at(1, c).px)));
  console.log(`  ..   zebra stripe (tr:nth-child(even) td) = ΔE00 ${stripe.toFixed(2)} — the floor every cell of the star's row has to clear`);
  ok(stripe > 0.5, 'the zebra stripe is still painted, so there is a real anchor to measure against');

  // ── half one: the row is marked ─────────────────────────────────────────────────────────────────────
  const shifts = pairs.map((p) => ({ ...p, d: dE(p.a.px, p.b.px) })).sort((x, y) => x.d - y.d);
  console.log(`  ..   star row vs ordinary row: ΔE00 ${shifts[0].d.toFixed(2)} (${shifts[0].c}/${shifts[0].par}) … ${shifts[shifts.length - 1].d.toFixed(2)} (${shifts[shifts.length - 1].c}/${shifts[shifts.length - 1].par}) over ${shifts.length} cell/parity pairs`);
  // One line per CELL, not per cell-and-parity: the two parities fail together and saying it twice buries
  // the count that matters, which is how many of the row's cells carry no mark at all.
  for (const c of CELLS) {
    const w = shifts.filter((x) => x.c === c).reduce((a, b) => (a.d <= b.d ? a : b));
    if (w.d < stripe) ok(false, `td.${w.c} shifts only ΔE00 ${w.d.toFixed(2)} on a ${w.par} row — under the ${stripe.toFixed(2)} the table's own striping manages, so it is not a mark`);
  }
  ok(shifts.every((s) => s.d >= stripe), `every cell of the star's row reads as lifted (worst ΔE00 ${shifts[0].d.toFixed(2)} vs stripe ${stripe.toFixed(2)})`);
  // …and it must survive the INLINE background on the stat cells, which is the half a stylesheet read misses.
  const statImg = pairs.filter((p) => /^s\d+$/.test(p.c)).map((p) => p.b.img);
  console.log(`  ..   star-row stat cells whose highlight survives the inline background: ${statImg.filter((i) => i !== 'none').length}/${statImg.length}`);
  ok(statImg.every((i) => i !== 'none'),
     'the highlight composites over the inline `background:` shorthand rather than being erased by it (this is what !important buys)');

  // ── half two: statColor's ramp is still the ramp ─────────────────────────────────────────────────────
  const nearest = RAMP.map((_, i) => {
    const hi = at(2, `s${i}`).px;
    const own = dE(hi, at(0, `s${i}`).px);
    const other = Math.min(...RAMP.map((__, j) => j).filter((j) => j !== i).map((j) => dE(hi, at(0, `s${j}`).px)));
    return { i, own, other, margin: other / own };
  });
  const tight = nearest.reduce((a, b) => (a.margin <= b.margin ? a : b));
  console.log(`  ..   ramp integrity: worst step is ${RAMP[tight.i]} — ΔE00 ${tight.own.toFixed(2)} from its own unhighlighted colour, ${tight.other.toFixed(2)} from the nearest other step (x${Number.isFinite(tight.margin) ? tight.margin.toFixed(2) : '∞, the highlight is doing nothing'})`);
  for (const s of nearest.filter((x) => x.margin < 1.5))
    ok(false, `highlighted ${RAMP[s.i]} sits ΔE00 ${s.own.toFixed(2)} from itself and ${s.other.toFixed(2)} from another step — the OVR ramp is being read as the wrong band`);
  ok(nearest.every((s) => s.margin >= 1.5), 'every highlighted stat cell still reads as its own statColor step and not the one above it');
  // A second, differently-shaped guard on the same thing: the ramp's steps must stay as far apart INSIDE
  // the star's row as they are outside it, so the highlight cannot quietly flatten the column.
  const seps = RAMP.slice(1).map((_, i) => dE(at(2, `s${i}`).px, at(2, `s${i + 1}`).px) / dE(at(0, `s${i}`).px, at(0, `s${i + 1}`).px));
  console.log(`  ..   adjacent-step separation inside the star's row: ${(Math.min(...seps) * 100).toFixed(0)}%–${(Math.max(...seps) * 100).toFixed(0)}% of an ordinary row's`);
  ok(Math.min(...seps) >= 0.8, `the five OVR bands stay as separable in the star's row as anywhere else (worst ${(Math.min(...seps) * 100).toFixed(0)}%)`);

  // ── and the mark must not cost legibility ────────────────────────────────────────────────────────────
  // Raising a background is free for the near-black stat ink and costs the light inks. Every ink that clears
  // 4.5:1 on an ordinary row has to still clear it on the star's row; anything already under the floor is
  // reported and left alone, because that is a different defect and this must not quietly adopt it.
  const FLOOR = 4.5;
  const inks = pairs.map((p) => ({ c: p.c, par: p.par, was: contrast(over(parseRGB(p.a.ink), p.a.alpha, p.a.px), p.a.px), now: contrast(over(parseRGB(p.b.ink), p.b.alpha, p.b.px), p.b.px) }));
  // The name cell's ink is whichever tier the star happens to be, so all five are checked on its ground.
  const tiers = [...style.matchAll(/td\.nft-name\.tier-\w+\s*\{[^}]*?color:\s*(#[0-9a-f]{3,6}|var\(--warn\))/gi)]
    .map((m) => (m[1].startsWith('var') ? (/--warn:\s*(#[0-9a-f]{6})/i.exec(style) ?? [])[1] : m[1]))
    .filter(Boolean) as string[];
  for (const t of tiers) inks.push({ c: `name[${t}]`, par: 'odd', was: contrast(hexRGB(t), at(0, 'name').px), now: contrast(hexRGB(t), at(2, 'name').px) });
  for (const u of inks.filter((i) => i.was < FLOOR))
    console.log(`  ..   td.${u.c} (${u.par}) is under ${FLOOR}:1 on an ORDINARY row too (${u.was.toFixed(2)}:1 → ${u.now.toFixed(2)}:1) — pre-existing, reported so it is not silently adopted here`);
  const readable = inks.filter((i) => i.was >= FLOOR);
  ok(tiers.length >= 4 && readable.length >= 8, `there is a real set of inks being measured over the lifted backgrounds (${tiers.length} tiers, ${readable.length} cells)`);
  if (!readable.length) { console.log('\n✗ no readable ink was found, so the floor below would pass over an empty list'); process.exit(1); }
  const worst = readable.reduce((a, b) => (a.now <= b.now ? a : b));
  console.log(`  ..   ${tiers.length} name tiers + ${inks.length - tiers.length} cells checked for ink; dimmest on the star's row is td.${worst.c} at ${worst.now.toFixed(2)}:1 (${worst.was.toFixed(2)}:1 unhighlighted)`);
  for (const i of readable.filter((x) => x.now < FLOOR))
    ok(false, `td.${i.c} drops to ${i.now.toFixed(2)}:1 on the star's row (was ${i.was.toFixed(2)}:1) — the highlight is costing legibility`);
  ok(readable.every((i) => i.now >= FLOOR), `the lifted backgrounds keep every readable ink over ${FLOOR}:1`);

  console.log(fails ? `\n✗ ${fails} check(s) failed — the star's row is unmarked again, or the OVR ramp is paying for the mark`
    : '\n✓ the star\'s row is marked above the table\'s own striping and statColor still reads step by step');
  if (fails) process.exitCode = 1;
}
void main();
