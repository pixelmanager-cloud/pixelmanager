// THE AGE COLUMN MUST RENDER THE INK ITS OWN RULE DECLARES, NOT THE ONE IT LOSES TO.
//
// `table.squad td.stat { color: #0a0a16; }` paints a near-black ink because every OTHER stat cell carries an
// opaque statColor() background painted inline. The age cell carries no background, so that ink lands on the
// dark panel. It was reported and closed as fixed by adding `td.stat.age { color: var(--muted); }` — and the
// fix was inert: `table.squad td.stat` is (0,2,2) and a bare `td.stat.age` is (0,2,1), two classes each but
// two type selectors against one, so the near-black won on every row regardless of source order. The comment
// written above the fix asserted the opposite relation as fact ("its specificity beats the colour rule's"),
// so the next reader was told a solved problem. Measured in chromium against the shipped sheet, the age
// glyphs rendered rgb(10,10,22) at 1.15:1 on the panel — invisible, in the column a manager reads to decide
// who is about to decline and who to sell — while the ledger carried the row as repaired.
//
// WHY THIS RENDERS INSTEAD OF READING THE SHEET. The bug is not in any one declaration; both rules are
// correct on their own and the defect lives only in which of them the cascade picks. A grep for
// `color: var(--muted)` finds the fix and reports green. So the assertion is made on the COMPUTED colour of
// a real `table.squad` row, and it is anchored to the value the age rule itself declares — read out of the
// stylesheet and rendered on a reference span — so re-tuning --muted does not need this file edited, but any
// future specificity change that takes the colour away fails here by name.
//
// THE FLOOR IS DERIVED, NOT ASSUMED. `table.squad` sets 19px and `td.stat` sets bold, which is over WCAG's
// 14pt-bold large-text line, so the honest AA floor for these glyphs is 3:1 and not 4.5:1 — asserted from
// the rendered metrics below rather than argued, so a later font change moves the floor by itself. The exact
// colour check is the tight guard; the ratio is the backstop for the day --muted is darkened.
//
// NOT VACUOUS: a page that failed to render, or a renderSquad that no longer emits `td.stat.age`, would
// leave every ratio below measuring nothing — so the markup shapes come out of main.ts, both rules must be
// found in the sheet with a colour on them, and the two reference inks must be DIFFERENT colours before the
// equality test means anything. Mutation test: put the bare `td.stat.age` selector back and the colour check
// goes red naming rgb(10,10,22) with the ratio at 1.15:1; darken --muted to #2a2a3a and the ratio goes red
// while the colour check stays green (the two halves catch different failures); rename the age cell's class
// in main.ts and the shape check goes red instead of this passing on a table the game never draws.
//
// The CRT overlays are off via the game's own `body.no-crt`: they are fixed periodic masks that alias with a
// single-pixel sample and darken every row identically, so they can only shrink the numbers below.
//
// Run: `npx tsx tools/playtest/squad_age_contrast.ts`
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const html = readFileSync('client/index.html', 'utf8');
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== The squad table\'s AGE column renders the ink its own rule declares ===');

// ── the markup, taken from the game rather than retyped ─────────────────────────────────────────────
const shapes: [string, RegExp][] = [
  ['renderSquad still wraps the rows in table.squad (the scope the age rule has to reach through)', /return `<table class="squad">/],
  ['the age cell is still td.stat.age', /<td class="stat age">/],
  ['the other stat cells still paint statColor INLINE, which is why td.stat\'s ink is near-black at all', /<td class="stat" style="background:\$\{statColor\(/],
  ['the header is still a bare <tr>, so the first player row is an EVEN child and gets the zebra stripe', /const head = `<tr><th><\/th>/],
];
for (const [msg, re] of shapes) ok(re.test(src), msg);
const rampBody = (/function statColor\(v: number\): string \{([\s\S]*?)\n\}/.exec(src) ?? [])[1] ?? '';
const RAMP = [...rampBody.matchAll(/'(#[0-9a-f]{6})'/gi)].map((m) => m[1]);
ok(RAMP.length === 5, `statColor's ramp was read out of main.ts (${RAMP.length} steps) — the sibling stat cells below are painted with the real thing`);

// ── the two rules whose fight this is ───────────────────────────────────────────────────────────────
const style = html.slice(html.indexOf('<style'), html.lastIndexOf('</style>') + 8);
// Comments first: this sheet documents nearly every non-obvious rule and those comments quote selectors and
// hex values, so a raw scan reads a comment ABOUT a colour as a declaration of one.
const css = style.replace(/\/\*[\s\S]*?\*\//g, ' ');
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map((m) => ({ sel: m[1].trim().replace(/\s+/g, ' '), body: m[2] }))
  .filter((r) => !r.sel.startsWith('@'));
const inkOf = (body: string) => /(?:^|[;\s])color:\s*([^;}]+)/i.exec(body)?.[1].trim();
const ageRule = rules.find((r) => /td\.stat\.age(?![\w-])/.test(r.sel) && !!inkOf(r.body));
const statRule = rules.find((r) => /td\.stat(?![\w.-])/.test(r.sel) && !!inkOf(r.body));
console.log(`  ..   age rule:  \`${ageRule?.sel ?? 'NOT FOUND'}\` → ${ageRule ? inkOf(ageRule.body) : '—'}`);
console.log(`  ..   stat rule: \`${statRule?.sel ?? 'NOT FOUND'}\` → ${statRule ? inkOf(statRule.body) : '—'}`);
ok(!!ageRule && !!statRule, 'both the age rule and the stat-column rule were found with a colour on them (without both, nothing below is a contest)');
if (fails) { console.log('\n✗ the squad table no longer has the shape this measures — retune the harness, do not delete it'); process.exit(1); }

// ── the harness page: a real table.squad, both row parities ─────────────────────────────────────────
const row = (n: number) =>
  `<tr data-n="${n}"><td class="inxi-mark" data-c="mark">&#9679;</td>`
  + `<td class="pos role-FW" data-c="pos">FW</td>`
  + `<td class="name" data-c="name">Ross</td>`
  + RAMP.map((c, i) => `<td class="stat" data-c="s${i}" style="background:${c}">${10 + i}</td>`).join('')
  + `<td class="stat age" data-c="age">24</td></tr>`;
const page = `<!doctype html><html><head><meta charset="utf-8">${style}`
  + `<style>html,body{background:var(--panel)}table.squad{table-layout:fixed;width:660px}table.squad td{height:34px}</style>`
  + `</head><body class="no-crt"><div id="app"><table class="squad">`
  + `<tr><th></th><th>Pos</th><th>Name</th>${RAMP.map(() => '<th>S</th>').join('')}<th>AGE</th></tr>`
  + `${row(0)}${row(1)}</table>`
  // The two inks under contention, rendered as the sheet writes them, so `var(--muted)` is resolved by the
  // browser and this file never has to know what --muted currently is.
  + `<span id="ref-age" style="color:${inkOf(ageRule!.body)}"></span>`
  + `<span id="ref-stat" style="color:${inkOf(statRule!.body)}"></span></div></body></html>`;

// ── colour maths ────────────────────────────────────────────────────────────────────────────────────
type RGB = [number, number, number];
const lum = ([r, g, b]: RGB) => {
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a: RGB, b: RGB) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const over = (ink: RGB, alpha: number, bg: RGB): RGB => ink.map((v, i) => alpha * v + (1 - alpha) * bg[i]) as RGB;
const parseRGB = (s: string): RGB => (s.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number) as RGB;

/** The one pixel a 1x1 PNG holds. Every PNG filter degenerates to the raw byte with no pixel to the left and
 *  no scanline above, so no unfiltering is needed — which is why samples are taken a pixel at a time. */
function pixel(png: Buffer): RGB {
  let off = 8; const idat: Buffer[] = [];
  while (off + 8 <= png.length) {
    const len = png.readUInt32BE(off);
    if (png.toString('ascii', off + 4, off + 8) === 'IDAT') idat.push(png.subarray(off + 8, off + 8 + len));
    off += 12 + len;
  }
  return [...inflateSync(Buffer.concat(idat)).subarray(1, 4)] as RGB;
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
  const refs = await pg.evaluate(() => ({
    age: getComputedStyle(document.getElementById('ref-age')!).color,
    stat: getComputedStyle(document.getElementById('ref-stat')!).color,
  }));
  const cells: any[] = await pg.evaluate(() => [...document.querySelectorAll('table.squad td')].map((el) => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return {
      n: Number((el.closest('tr') as HTMLElement).dataset.n), c: (el as HTMLElement).dataset.c,
      // A pixel inside the cell's padding at the far right — the cell's own ground, clear of the centred
      // glyphs and of the 1px bottom border.
      x: Math.round(r.x + r.width - 4), y: Math.round(r.y + 3),
      ink: cs.color, alpha: Number(cs.opacity), px: Number(cs.fontSize.replace('px', '')), weight: Number(cs.fontWeight),
    };
  }));
  for (const c of cells) c.ground = pixel(await pg.screenshot({ clip: { x: c.x, y: c.y, width: 1, height: 1 } }));
  await browser.close();

  const expected = 2 * (3 + RAMP.length + 1);
  ok(cells.length === expected, `both row parities rendered every cell the squad table draws (${cells.length}/${expected})`);
  ok(refs.age !== refs.stat, `the two inks under contention are different colours (age rule ${refs.age} vs stat rule ${refs.stat}) — otherwise the check below is satisfied by anything`);
  if (fails) { console.log('\n✗ the harness table did not render — nothing below would be measuring anything'); process.exit(1); }

  const ages = cells.filter((c) => c.c === 'age');
  const ratio = (c: any) => contrast(over(parseRGB(c.ink), c.alpha, c.ground), c.ground);

  // ── the tight guard: the age rule actually wins the cascade ───────────────────────────────────────
  console.log(`  ..   AGE cell renders ${ages[0].ink} at opacity ${ages[0].alpha} on ${ages.map((c: any) => c.ground.join(',')).join(' / ')} — its rule declares ${refs.age}, the column rule it must beat declares ${refs.stat}`);
  for (const a of ages.filter((c: any) => c.ink !== refs.age))
    ok(false, `the AGE cell on the ${a.n === 0 ? 'even' : 'odd'} row renders ${a.ink}${a.ink === refs.stat ? ' — the stat column\'s near-black ink, so its own rule is being outranked and is dead' : ''}`);
  ok(ages.every((c: any) => c.ink === refs.age), 'the AGE cell renders the colour td.stat.age declares, on both row parities');

  // ── the backstop: and that colour is readable on the ground it lands on ───────────────────────────
  // WCAG 2.1 AA: 4.5:1 for normal text, 3:1 once the glyphs are large — 24px, or 18.66px at weight 700.
  const large = ages.every((c: any) => c.px >= 24 || (c.px >= 18.66 && c.weight >= 700));
  const FLOOR = large ? 3 : 4.5;
  console.log(`  ..   AGE glyphs are ${ages[0].px}px weight ${ages[0].weight} → WCAG floor ${FLOOR}:1 (${large ? 'large text' : 'normal text'}); measured ${ages.map((c: any) => ratio(c).toFixed(2)).join(' / ')}:1`);
  for (const a of ages.filter((c: any) => ratio(c) < FLOOR))
    ok(false, `the AGE number reads ${ratio(a).toFixed(2)}:1 on the ${a.n === 0 ? 'even' : 'odd'} row — under ${FLOOR}:1, a manager cannot read the column he sells on`);
  ok(ages.every((c: any) => ratio(c) >= FLOOR), `the AGE number clears ${FLOOR}:1 on both row parities`);

  // ── and the fix must be a scope, not a repaint ────────────────────────────────────────────────────
  // The other way to make the age cell readable is to lighten `table.squad td.stat` itself, which would put
  // light ink on the five saturated statColor grounds the near-black exists for. Those cells are measured
  // here so that shortcut fails instead of trading one unreadable column for six.
  const stats = cells.filter((c: any) => /^s\d+$/.test(c.c));
  const worst = stats.reduce((a: any, b: any) => (ratio(a) <= ratio(b) ? a : b));
  console.log(`  ..   ${stats.length} statColor cells still carry the near-black ink; dimmest is ${worst.c} at ${ratio(worst).toFixed(2)}:1 on ${worst.ground.join(',')}`);
  ok(stats.length === 2 * RAMP.length && stats.every((c: any) => ratio(c) >= FLOOR),
     `every statColor cell still clears ${FLOOR}:1 — the age column was scoped out, not fixed by repainting the whole stat column`);

  // ── …and it stays de-emphasised, which is what the rule is for ────────────────────────────────────
  // Lifting the age ink to body brightness would clear the floor and lose the authored quiet — the same bug
  // wearing the opposite sign. The name cell is the body tier on the same ground.
  const name = cells.find((c: any) => c.c === 'name')!;
  console.log(`  ..   AGE ${ratio(ages[0]).toFixed(2)}:1 vs the name cell's body ink ${ratio(name).toFixed(2)}:1 on the same panel`);
  ok(ratio(ages[0]) < ratio(name), 'the AGE column still reads a step quieter than the name beside it — lifted over the floor, not flattened into the body tier');

  console.log(fails ? `\n✗ ${fails} check(s) failed — the AGE column is painting ink a manager cannot read`
    : '\n✓ the AGE column wins its own colour and clears the readable floor on both row parities');
  if (fails) process.exitCode = 1;
}
void main();
