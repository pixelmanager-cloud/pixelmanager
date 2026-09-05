// THE POSITION CHIP MUST STAY THE POSITION'S COLOUR — ON EVERY ROW, AND UNDER THE POINTER.
//
// `<td class="pos role-GK">` (renderSquad, client/src/main.ts) carries the chip colour on the CELL, from
// `.role-GK { background: var(--gk) }` at the bottom of the sheet — specificity 0,1,0. The generic table
// base near the top of the sheet is `table tbody tr:nth-child(even) td { background: … }` at 0,1,4, with a
// `tr:hover td` twin. Same element, same property, higher specificity: the stripe REPLACED the chip instead
// of tinting it. `statsTableHTML` emits `<table class="squad">${head}${rows}</table>` with no `<thead>`, so
// the header <tr> is nth-child(1) and the FIRST data row is the even child — half the squad, alternating,
// lost its position colour entirely, and `table.squad td.pos { color: #0a0a16 }` (inked dark BECAUSE it is
// meant to sit on a bright chip) fell to 1.25:1 near-black on near-black. The hover twin did the same at
// 1.35:1 to whichever row the pointer was over, which on a table you scan with the mouse is the louder of
// the two — so both lines need the exclusion, not just the striping one.
// That is the Team Sheet's "View full squad stats" panel — the screen a manager reads to pick an XI — with
// no information in its Pos column on every other row.
//
// WHY A PROBE AND NOT A READ OF THE CSS: the losing rule is *present, valid and later in the file*. Nothing
// looks wrong in the source; the cascade decides it, and it decides it differently per nth-child parity and
// per hover state. Only a rendered page at both parities in both states says which rule actually painted.
//
// WHAT IS ASSERTED, and why each one is here rather than just "the chip is gold":
//   1. INK — td.pos's own colour clears 4.5:1 over the pixel actually painted behind it. This is the harm.
//   2. IDENTITY — each chip is nearer its OWN role colour than to any other role's, by ≥1.5x. A "fix" that
//      flattened all four to one plate, or that let the stripe half-wash them, passes (1) and fails here.
//   3. INVARIANCE — the same role reads the same on an odd row, an even row and under the pointer, to
//      within twice the sheet's own stripe (measured off td.name, not assumed). A chip is still allowed to
//      be TINTED like everything else in the table; it may not be REPLACED. This is the bug stated exactly.
// The star's row is measured too: `table.squad tr.nft-row td` (W17-12) is a background-IMAGE overlay and
// never touched background-color, so it did not rescue the Pos cell — and it must not be broken by fixing it.
//
// NOT VACUOUS: the four roles come out of shared/src/types.ts, their colours out of the sheet's own
// variables, and the cell shape out of renderSquad's template — a renamed class, a fifth role or a moved
// style fails the shape guards instead of leaving this measuring a table the game never draws. The generic
// stripe must still be FOUND in the sheet and still be MEASURABLE on td.name, so "the chip survived" can
// never be reached by having quietly deleted the striping. Every role/parity/state combination must be
// present before anything is asserted. Mutation test, all four run before this file was committed: put the
// bare `td` back on the nth-child rule and all four roles go red at 1.25:1 on the even rows; put it back on
// the :hover twin ONLY and they go red at 1.35:1 under the pointer while the resting rows stay green (which
// is the half a one-line fix misses); paint every `.role-*` the same colour and identity goes red at x0.00
// while legibility stays green at 11.27:1; empty the stripe's body and the shape guard goes red rather than
// the chips going quietly green on a table with no striping left to override them.
//
// The CRT scanline/vignette overlays are off via the game's own `body.no-crt`, as in star_row_highlight.ts:
// they are fixed-position periodic masks that alias with a single-pixel sample.
//
// Run: `npx tsx tools/playtest/pos_chip_colour.ts`
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const html = readFileSync('client/index.html', 'utf8');
const src = readFileSync('client/src/main.ts', 'utf8');
const types = readFileSync('shared/src/types.ts', 'utf8');

console.log('=== The squad table\'s position chip keeps its colour on every row and under the pointer ===');

// ── the roles, the colours and the markup, taken from the game rather than retyped ───────────────────
const ROLES = ((/export type Role = ([^;]+);/.exec(types) ?? [])[1] ?? '')
  .split('|').map((s) => s.trim().replace(/'/g, '')).filter(Boolean);
const style = html.slice(html.indexOf('<style'), html.lastIndexOf('</style>') + 8);
const COLOUR: Record<string, string> = {};
for (const r of ROLES) {
  const m = new RegExp(`--${r.toLowerCase()}:\\s*(#[0-9a-f]{6})`, 'i').exec(style);
  if (m) COLOUR[r] = m[1];
}
console.log(`  ..   roles from shared/src/types.ts: ${ROLES.map((r) => `${r} ${COLOUR[r] ?? '(no --' + r.toLowerCase() + ')'}`).join(', ')}`);
ok(ROLES.length >= 4 && ROLES.every((r) => COLOUR[r]), 'every Role has a colour variable in the sheet — without them nothing below is measuring the chip');

// Every shape this harness reproduces. If renderSquad stops emitting one of these, or the generic stripe
// stops existing, the table measured below is a fiction and this has to fail rather than pass on it.
const shapes: [string, RegExp][] = [
  ['the position chip is still td.pos with a role class', /<td class="pos role-\$\{p\.role\}"/],
  ['the chip colour still comes from a bare .role-* background rule', /\.role-GK \{ background: var\(--gk\); \}/],
  ['td.pos is still inked dark BECAUSE it sits on a bright chip', /table\.squad td\.pos \{[^}]*color:\s*#0a0a16/],
  ['the table is still emitted with no <thead>, so the header <tr> shifts every data row\'s parity',
   /<table class="squad">\$\{head\}\$\{rows\}<\/table>/],
  ['the head is still a bare <tr> of <th>, sitting in the same implicit tbody as the data rows',
   /const head = `<tr><th><\/th>/],
  ['the star\'s row still carries .nft-row', /nft \? ' nft-row' : ''/],
  ['the generic zebra stripe still exists (this is the rule that was overriding the chip)', /table tbody tr:nth-child\(even\) td[^{]*\{[^}]*background:/],
  ['the generic row hover still exists (its twin, and the half a one-line fix forgets)', /table tbody tr:hover td[^{]*\{[^}]*background:/],
];
for (const [msg, re] of shapes) ok(re.test(src) || re.test(style), msg);
if (fails) { console.log('\n✗ the squad table no longer has the shape this measures — retune the harness, do not delete it'); process.exit(1); }

// ── the page: every role at BOTH nth-child parities, ordinary row and star's row ─────────────────────
// A block of four roles has even length, so repeating it would pin each role to one parity forever. The
// second block is offset by one role so every role lands on both, and the coverage is asserted below.
type Cell = { role: string; kind: string; par: string; n: number };
const plan: Cell[] = [];
let n = 1; // the header <tr> is nth-child(1) — the reason the FIRST data row is an even child
for (const kind of ['plain', 'nft-row']) {
  for (const off of [0, 1]) {
    for (const r of ROLES.map((_, i) => ROLES[(i + off) % ROLES.length])) {
      n++;
      plan.push({ role: r, kind, par: n % 2 ? 'odd' : 'even', n });
    }
  }
}
const row = (c: Cell) =>
  `<tr class="${c.kind === 'plain' ? '' : c.kind}" data-n="${c.n}">`
  + `<td class="inxi-mark">&#9679;</td><td class="pos role-${c.role}" data-n="${c.n}">${c.role}</td>`
  + `<td class="name" data-name="${c.n}">Ross</td><td class="stat" style="background:#3ec98a">70</td>`
  + `<td class="stat age">24</td></tr>`;
const page = `<!doctype html><html><head><meta charset="utf-8">${style}`
  + `<style>html,body{background:var(--panel)}table.squad{table-layout:fixed;width:660px}table.squad td{height:34px}</style>`
  + `</head><body class="no-crt"><div id="app"><table class="squad">`
  + `<tr><th></th><th>Pos</th><th>Name</th><th>OVR</th><th>AGE</th></tr>`
  + plan.map(row).join('') + `</table></div></body></html>`;

// ── colour maths: CIEDE2000 for "is it still that colour", WCAG for "can you read it" ────────────────
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

/** The one pixel a 1x1 PNG holds — every filter degenerates to the raw byte with no left neighbour and no
 *  scanline above, so no unfiltering is needed. Same sampler as star_row_highlight.ts. */
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

  // Geometry and ink once; the pixel is re-sampled per hover state because that is what changes.
  const geom: any[] = await pg.evaluate(() => [...document.querySelectorAll('table.squad td.pos')].map((el) => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    // A pixel inside the cell's padding at the far right, clear of the centred glyph and of the 1px
    // bottom border — the cell's own ground, not antialiased type.
    return { n: Number((el as HTMLElement).dataset.n), x: Math.round(r.x + r.width - 4), y: Math.round(r.y + 3),
             ink: cs.color, alpha: Number(cs.opacity) };
  }));
  const nameGeom: any[] = await pg.evaluate(() => [...document.querySelectorAll('table.squad td.name')].map((el) => {
    const r = el.getBoundingClientRect();
    return { n: Number((el as HTMLElement).dataset.name), x: Math.round(r.x + r.width - 4), y: Math.round(r.y + 3) };
  }));
  const shot = async (g: { x: number; y: number }) => pixel(await pg.screenshot({ clip: { x: g.x, y: g.y, width: 1, height: 1 } }));

  type Sample = Cell & { state: string; px: RGB; ink: RGB; alpha: number };
  const samples: Sample[] = [];
  for (const g of geom) {
    const c = plan.find((p) => p.n === g.n)!;
    samples.push({ ...c, state: 'rest', px: await shot(g), ink: parseRGB(g.ink), alpha: g.alpha });
  }
  // …and again with the pointer on each row, because `tr:hover td` is the twin that a one-line fix misses.
  for (const g of geom) {
    const c = plan.find((p) => p.n === g.n)!;
    await pg.hover(`table.squad td.pos[data-n="${g.n}"]`);
    samples.push({ ...c, state: 'hover', px: await shot(g), ink: parseRGB(g.ink), alpha: g.alpha });
  }
  // The anchor: the stripe painted on a cell it is SUPPOSED to reach. If the chips only survive because
  // somebody deleted the striping, this goes red instead of everything going green.
  await pg.mouse.move(0, 0);
  const nameOdd = nameGeom.find((g) => g.n % 2 === 1)!, nameEven = nameGeom.find((g) => g.n % 2 === 0)!;
  const stripe = dE(await shot(nameOdd), await shot(nameEven));
  await browser.close();

  // ── coverage first: every role, both parities, both row kinds, both states ─────────────────────────
  const want = ROLES.length * 2 * 2 * 2;
  const seen = new Set(samples.map((s) => `${s.role}/${s.par}/${s.kind}/${s.state}`));
  console.log(`  ..   ${samples.length} chip samples over ${seen.size}/${want} role x parity x row-kind x state combinations`);
  ok(seen.size === want, 'every role was measured on an odd row, an even row, a star\'s row and under the pointer');
  console.log(`  ..   the sheet's own zebra stripe on td.name (a cell it is meant to reach) = ΔE00 ${stripe.toFixed(2)}`);
  ok(stripe > 0.5, 'the generic stripe is still painted somewhere, so this cannot pass by the striping having been deleted');
  if (fails) { console.log('\n✗ the harness table did not render what it plans to measure — nothing below would mean anything'); process.exit(1); }

  // ── 1. the harm: can you read the letters ─────────────────────────────────────────────────────────
  const FLOOR = 4.5;
  const lit = samples.map((s) => ({ s, k: contrast(over(s.ink, s.alpha, s.px), s.px) }));
  const dim = lit.reduce((a, b) => (a.k <= b.k ? a : b));
  console.log(`  ..   dimmest Pos letters: ${dim.s.role} on an ${dim.s.par} ${dim.s.kind} row, ${dim.s.state} — ${dim.k.toFixed(2)}:1 (floor ${FLOOR}:1)`);
  // One FAIL line per ROLE, not per role-and-parity-and-state: they go red in families of eight and saying
  // it eight times buries the number that matters, which is how far under the floor the worst of them is.
  for (const r of ROLES) {
    const w = lit.filter((x) => x.s.role === r).reduce((a, b) => (a.k <= b.k ? a : b));
    if (w.k < FLOOR) ok(false, `the ${r} letters read ${w.k.toFixed(2)}:1 on an ${w.s.par} ${w.s.kind} row (${w.s.state}) — the chip has been repainted out from under td.pos's dark ink`);
  }
  ok(lit.every((x) => x.k >= FLOOR), `every position letter clears ${FLOOR}:1 on the chip actually painted behind it`);

  // ── 2. identity: it is still THAT role's colour, not a wash and not another role's ─────────────────
  const idents = samples.map((s) => {
    const own = dE(s.px, hexRGB(COLOUR[s.role]));
    const other = Math.min(...ROLES.filter((r) => r !== s.role).map((r) => dE(s.px, hexRGB(COLOUR[r]))));
    return { s, own, other, margin: own === 0 ? Infinity : other / own };
  });
  const tight = idents.reduce((a, b) => (a.margin <= b.margin ? a : b));
  console.log(`  ..   weakest identity: ${tight.s.role} on an ${tight.s.par} ${tight.s.kind} row (${tight.s.state}) — ΔE00 ${tight.own.toFixed(2)} from its own colour, ${tight.other.toFixed(2)} from the nearest other role (x${Number.isFinite(tight.margin) ? tight.margin.toFixed(2) : '∞'})`);
  for (const r of ROLES) {
    const w = idents.filter((x) => x.s.role === r).reduce((a, b) => (a.margin <= b.margin ? a : b));
    if (w.margin < 1.5) ok(false, `the ${r} chip on an ${w.s.par} ${w.s.kind} row (${w.s.state}) sits ΔE00 ${w.own.toFixed(2)} from ${COLOUR[r]} and ${w.other.toFixed(2)} from another role's colour — the Pos column is carrying no position`);
  }
  ok(idents.every((x) => x.margin >= 1.5), 'every chip still reads as its own role\'s colour rather than another role\'s or a grey wash');

  // ── 3. invariance: parity and hover must not be information ───────────────────────────────────────
  // Stated against the stripe rather than against zero, so the generic base is still free to tint a chip
  // the way it tints everything else — it just may not REPLACE it.
  const CEILING = stripe * 2;   // a chip may be TINTED like anything else in the table; it may not be REPLACED
  const drifts = ROLES.flatMap((r) => ['plain', 'nft-row'].map((kind) => {
    const g = samples.filter((s) => s.role === r && s.kind === kind);
    const worst = g.flatMap((a, i) => g.slice(i + 1).map((b) => ({ a, b, d: dE(a.px, b.px) }))).reduce((x, y) => (x.d >= y.d ? x : y));
    return { r, kind, ...worst };
  }));
  const spread = drifts.reduce((a, b) => (a.d >= b.d ? a : b));
  console.log(`  ..   widest same-role drift across parity/hover: ${spread.r} on a ${spread.kind} row — ΔE00 ${spread.d.toFixed(2)} (${spread.a.par}/${spread.a.state} vs ${spread.b.par}/${spread.b.state}), against a ceiling of ${CEILING.toFixed(2)} (2x the stripe)`);
  for (const r of ROLES) {
    const w = drifts.filter((x) => x.r === r).reduce((a, b) => (a.d >= b.d ? a : b));
    if (w.d > CEILING) ok(false, `the ${r} chip changes by ΔE00 ${w.d.toFixed(2)} between ${w.a.par}/${w.a.state} and ${w.b.par}/${w.b.state} on a ${w.kind} row — over the ${CEILING.toFixed(2)} ceiling, so a row's parity is being read as its position`);
  }
  ok(drifts.every((x) => x.d <= CEILING), `a chip's colour is its role's, not its row's — same role within ΔE00 ${CEILING.toFixed(2)} across both parities and hover`);

  console.log(fails ? `\n✗ ${fails} check(s) failed — the Pos column is not carrying position colour on every row`
    : '\n✓ every position chip keeps its role colour and its legible letters at both parities, resting and hovered');
  if (fails) process.exitCode = 1;
}
void main();
