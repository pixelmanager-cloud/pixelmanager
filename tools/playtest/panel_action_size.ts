// A PANEL'S OWN ACTIONS ARE PANEL-SIZED.
//
// The season screen is a column of small cards, and every one of them shrinks its buttons to the 11px
// display treatment — a full-size 18px button inside a 10px-padded card is the loudest thing on the screen.
// `.sf-wc`, the World Finals panel, wrote its box, its heading and its text and then stopped: no button rule
// at all. So "Follow the tournament 🌍" and "View the tournament report →" fell through to the global
// `button` rule and came out 18px VT323, 41px tall, while the SAME tournament's knockout actions one stage
// later — which borrow `.sf-cont-btns` from the Continental Cup panel — came out 11px Press Start 2P, 32px
// tall. One tournament, two button sizes, depending on how far into it you were.
//
// A MISSING rule is the case reading the stylesheet cannot catch: there is nothing there to read, and the
// buttons still look like buttons. So this measures instead of grepping — it loads the shipped stylesheet
// and the real markup the emitters return into headless chromium and reads getComputedStyle off each
// button. The reference is not a hard-coded 11px either: it is the Continental Cup panel's own action,
// rendered on the same page, because "matches the panel immediately below it" is the actual requirement.
//
// The markup is lifted out of main.ts rather than written here, so a button moved out of its panel is
// measured rather than assumed. Everything below the browser launch is worthless if that extraction comes
// back empty, so it is asserted first and hard-exits: no panels, no buttons, no run.
//
// Run: `npx tsx tools/playtest/panel_action_size.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const html = readFileSync('client/index.html', 'utf8');
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== Every World Finals action is sized like the panel it sits in ===');

/**
 * The static markup the `return \`<div …>\` + \`…\`;` expression around `at` produces. Interpolations go
 * first — they carry their own nested backticks and tags — after which the backtick-separated pieces
 * alternate literal / `+ (cond ? ` glue, so the odd ones are exactly the markup the browser would see.
 */
function emittedAt(at: number): string {
  const start = src.lastIndexOf('return ', at);
  if (start < 0 || at - start > 200) return '';
  const body = src.slice(start, start + 8000).replace(/\$\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '');
  const end = body.indexOf('`;');
  return end < 0 ? '' : body.slice(0, end + 1).split('`').filter((_, n) => n % 2 === 1).join('');
}

// Every World Finals panel the game can render, found by its class rather than by its copy.
const wc = new Set<string>();
for (const m of src.matchAll(/<div class="sf-wc(?:"| )/g)) { const p = emittedAt(m.index!); if (p) wc.add(p); }
const wcMarkup = [...wc].join('\n');
const ref = emittedAt(src.indexOf('<div class="sf-cont"><div class="sf-cont-head">'));
const ids = [...wcMarkup.matchAll(/<button[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
const REF = 'sf-cont-play';

console.log(`  ..   ${wc.size} World Finals panel(s), ${ids.length} action(s): ${ids.join(', ') || '(none)'}`);
ok(wc.size >= 3, 'the three World Finals panels (teaser, knockout run, concluded report) were extracted');
ok(ids.length >= 4, 'their action buttons were found — this is not about to measure an empty set');
ok((wcMarkup.match(/<button/g) ?? []).length === ids.length, 'every button in those panels carries an id, so every one is measured');
ok(ref.includes(`id="${REF}"`), `the reference panel (the Continental Cup, one row below) still emits #${REF}`);
if (fails) { console.log('\n✗ the markup could not be read, so nothing below would be measuring anything'); process.exit(1); }

const style = html.slice(html.indexOf('<style'), html.lastIndexOf('</style>') + 8);
const page = `<!doctype html><html><head><meta charset="utf-8">${style}</head><body>`
  + `<div id="app"><div id="season" class="panel"><div id="season-body">${wcMarkup}${ref}</div></div><button id="pas-bare">bare</button></div></body></html>`;

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
  const read = (id: string) => pg.evaluate((i: string) => {
    const el = document.getElementById(i);
    if (!el) return null;
    const c = getComputedStyle(el);
    return { size: c.fontSize, face: c.fontFamily.split(',')[0].replace(/['"]/g, ''), h: Math.round(el.getBoundingClientRect().height) };
  }, id);

  // ANCHOR THE REFERENCE, or every assertion below is only "equal to something that might itself be wrong".
  // Measured by the reviewer: delete `.sf-cont-btns button` outright and all six buttons drop to the global
  // 18px VT323 treatment TOGETHER — every equality below still holds and this probe reports a clean pass over
  // a completely broken row. The bare button outside the panels reports what the page does with a button it
  // has styled for nobody, so the reference has to be measurably different from it.
  const bare = await read('pas-bare');
  const r = await read(REF);
  ok(!!bare, 'the bare control button rendered (it is what anchors the reference)');
  ok(!!r, `the reference action #${REF} rendered`);
  if (bare && r) console.log(`  ..   bare button (the global treatment): ${bare.face} ${bare.size}, ${bare.h}px tall`);
  ok(!!bare && !!r && r.size !== bare.size,
     `the reference action is styled, not just inheriting the global button rule (${r?.size} vs bare ${bare?.size})`);
  if (r) {
    console.log(`  ..   reference: the Continental Cup action is ${r.face} ${r.size}, ${r.h}px tall`);
    for (const id of ids) {
      const b = await read(id);
      ok(!!b, `#${id} rendered`);
      if (!b) continue;
      console.log(`  ..   #${id}: ${b.face} ${b.size}, ${b.h}px tall`);
      ok(b.size === r.size, `#${id} is sized like the action beside it (${b.size} vs ${r.size})`);
      ok(b.face === r.face, `#${id} wears the panel-action face (${b.face} vs ${r.face})`);
    }
  }

  await browser.close();
  console.log(fails ? `\n✗ ${fails} — the World Finals panel changes the size of its own buttons` : '\n✓ every World Finals action matches the panel beside it');
  if (fails) process.exitCode = 1;
}
void main();
