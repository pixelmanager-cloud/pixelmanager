// THE SETTINGS SLIDERS ARE SLIDERS, NOT TEXT FIELDS.
//
// `.set-row input[type=range]` sets `height: 8px` and nothing else about its box — no border, no padding —
// so the three sliders (#set-vol, #set-sfx, #set-scale) fell through to the generic
// `input:not([type="checkbox"]):not([type="radio"])` rule for those. Both selectors compute to the SAME
// specificity (0,2,1) — `:not()` contributes its argument's — so the dedicated rule wins only the
// properties it re-declares. Border-box + a 2px border + 6px vertical padding floors the box at 16px, so
// the declared 8px could never render, and the generic rule's :hover/:focus border-colour painted a cyan
// then green text-field box around a volume slider. The 10px horizontal padding also inset the thumb's
// travel from both ends of the visible groove, so the UI-scale handle never reached its own 80%/140% stops.
//
// A tie in the cascade is invisible to reading: both rules are present and correct-looking, and the slider
// still slides. So this MEASURES, in headless chromium, against the shipped stylesheet and the real
// settings markup lifted out of main.ts — a slider moved out of a `.set-row` is measured, not assumed.
//
// The anchor is a plain text input on the same page, checked against the numbers the generic rule itself
// declares. Every slider assertion below would otherwise also pass if that rule were simply deleted — which
// would strip the chrome off every real text field in the game — and "not zero" is not enough either: with
// the rule stripped, chromium's UA default (2px border, 1px/2px padding) sails straight through it.
//
// Run: `npx tsx tools/playtest/slider_chrome.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const html = readFileSync('client/index.html', 'utf8');
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== The settings sliders wear slider chrome, not the text-field box ===');

// The static markup `ov.innerHTML = \`…\` + \`…\`;` produces. Interpolations go first — they carry their own
// nested backticks and tags — after which the backtick-separated pieces alternate literal / `+` glue, so the
// odd ones are exactly the markup the browser would see.
const at = src.indexOf('ov.innerHTML = `<div class="tt-card set-card">');
const body = src.slice(at, at + 12000).replace(/\$\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '');
const end = body.indexOf('`;');
const markup = end < 0 ? '' : body.slice(0, end + 1).split('`').filter((_, n) => n % 2 === 1).join('');

const ranges = [...markup.matchAll(/<input[^>]*type="range"[^>]*>/g)].map((m) => m[0]);
const ids = ranges.map((r) => (r.match(/id="([^"]+)"/) ?? [])[1] ?? '').filter(Boolean);

console.log(`  ..   settings markup: ${markup.length} chars, ${ranges.length} range input(s): ${ids.join(', ') || '(none)'}`);
ok(at > 0 && markup.length > 500, 'the settings dialog markup was extracted from main.ts');
ok(ids.length === 3, 'all three sliders (music, sfx, UI scale) were found — this is not about to measure an empty set');
ok(ids.length === ranges.length, 'every slider in the dialog carries an id, so every one of them is measured');

// Both rules are read out of the sheet rather than hard-coded, so a re-tuned groove or a re-tuned text
// field re-tunes the assertions with it.
const rule = (html.match(/\.set-row input\[type=range\] \{([^}]*)\}/) ?? [])[1] ?? '';
const declaredH = Number((rule.match(/height:\s*(\d+)px/) ?? [])[1] ?? 0);
const generic = (html.match(/input:not\(\[type="checkbox"\]\)[^{]*\{([\s\S]*?)\n {6}\}/) ?? [])[1] ?? '';
const chrome = {
  bw: `${(generic.match(/border:\s*(\d+)px/) ?? [])[1] ?? 0}px`,
  py: `${(generic.match(/padding:\s*(\d+)px\s+(\d+)px/) ?? [])[1] ?? 0}px`,
  px: `${(generic.match(/padding:\s*(\d+)px\s+(\d+)px/) ?? [])[2] ?? 0}px`,
};
console.log(`  ..   .set-row input[type=range] declares height: ${declaredH || '?'}px`);
console.log(`  ..   the generic text-field rule declares ${chrome.bw} border, ${chrome.py}/${chrome.px} padding`);
// If the groove were ever re-declared at 16px or taller the height check below would pass with the border
// and padding still on, and prove nothing — retune this guard deliberately, don't delete it.
ok(declaredH > 0 && declaredH < 16, 'the groove is still declared shorter than a bordered, padded input can physically be');
ok(chrome.bw !== '0px' && chrome.px !== '0px' && chrome.py !== '0px',
   'the generic text-field rule still declares a box, so the control below can anchor on it');
if (fails) { console.log('\n✗ nothing could be measured, so nothing below would be measuring anything'); process.exit(1); }

const style = html.slice(html.indexOf('<style'), html.lastIndexOf('</style>') + 8);
const page = `<!doctype html><html><head><meta charset="utf-8">${style}</head><body>`
  + `<div id="app"><div id="settings-ov" style="position:static;display:block">`
  + `<div style="width:420px">${markup}</div></div>`
  + `<input type="text" id="sc-control" value="control"></div></body></html>`;

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
    return { h: Math.round(el.getBoundingClientRect().height), bw: c.borderTopWidth, px: c.paddingLeft, py: c.paddingTop,
             bc: c.borderTopColor, row: !!el.closest('.set-row') };
  }, id);

  // ANCHOR FIRST. Every slider assertion below would also pass if the generic input rule were simply
  // deleted — which would strip the chrome off every text field in the game. This control is a plain
  // <input> on the same page, and it is checked against the sheet's OWN declared numbers rather than
  // against "not zero": the reviewer stripped border and padding out of the generic rule and chromium's UA
  // default (2px border, 1px/2px padding) sailed through a not-zero test.
  const ctl = await read('sc-control');
  ok(!!ctl, 'the control text input rendered (it is what proves the generic input rule is still live)');
  if (ctl) console.log(`  ..   control <input type=text>: ${ctl.bw} border, ${ctl.py}/${ctl.px} padding, ${ctl.h}px tall`);
  ok(!!ctl && ctl.bw === chrome.bw && ctl.px === chrome.px && ctl.py === chrome.py,
     `the generic rule still paints its declared box on a real text field (${ctl?.bw}/${ctl?.py}/${ctl?.px} vs ${chrome.bw}/${chrome.py}/${chrome.px})`);

  for (const id of ids) {
    const s = await read(id);
    ok(!!s, `#${id} rendered`);
    if (!s) continue;
    console.log(`  ..   #${id}: ${s.h}px tall, ${s.bw} border, ${s.py}/${s.px} padding`);
    ok(s.row, `#${id} is still inside a .set-row, so the rule under test is the one styling it`);
    ok(s.h === declaredH, `#${id} is the ${declaredH}px groove the sheet declares (measured ${s.h}px)`);
    ok(s.bw === '0px', `#${id} has no text-field border (${s.bw})`);
    ok(s.px === '0px', `#${id}'s thumb can reach both ends of its own groove (${s.px} inset)`);
  }

  // The hover affordance the border carried: a cyan box around a volume slider. With no border there is
  // nothing for :hover to recolour, which is the point.
  if (ids[0]) {
    await pg.hover(`#${ids[0]}`);
    const hov = await read(ids[0]);
    console.log(`  ..   #${ids[0]} on hover: ${hov?.bw} border ${hov?.bc}`);
    ok(hov?.bw === '0px', `#${ids[0]} does not grow a text-input hover box (${hov?.bw})`);
  }

  // AND THE FIX MUST NOT COST THE KEYBOARD RING. The generic rule's own comment records that an
  // `outline: none` there once cancelled the app-wide focus ring for every input in the game; removing the
  // border must not quietly do the same thing by another route. Real Tab presses, because :focus-visible
  // does not arm on a range input that was focused programmatically.
  let ring: { id: string; w: string } | null = null;
  for (let n = 0; n < 8 && ring?.id !== ids[0]; n++) {
    await pg.keyboard.press('Tab');
    ring = await pg.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el ? { id: el.id, w: getComputedStyle(el).outlineWidth } : null;
    });
  }
  console.log(`  ..   keyboard focus landed on #${ring?.id} with a ${ring?.w} ring`);
  ok(ring?.id === ids[0], `Tab reaches #${ids[0]} (the ring assertion is not measuring some other element)`);
  ok(!!ring && parseFloat(ring.w) >= 2, `a focused slider still shows the app-wide keyboard ring (${ring?.w})`);

  await browser.close();
  console.log(fails ? `\n✗ ${fails} check(s) failed — the settings sliders are wearing the text-field box again` : '\n✓ all three sliders render as the declared groove, borderless and full-width');
  if (fails) process.exitCode = 1;
}
void main();
