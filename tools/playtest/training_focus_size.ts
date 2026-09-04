// A CONTROL IS SIZED BY THE ROW IT SITS IN, NOT BY THE GLOBAL RULE.
//
// `.sf-focus select` — the training-focus picker — was the only `<select>` in the game never given a
// class-scoped size. Every other one has its own: `#lineup select` takes a width, `.slot select.duty-sel`
// takes 17px and its own padding, `.cg-kit-row select` takes 15px. This one inherited the global 21px rule
// and landed inside a 14px row, in the NARROWER of the two season-grid columns (1fr against 1.1fr), which
// pushed that row to 76px tall — taller than any fixture row (34px) or the records line (31px) above it.
// The season's least consequential control was drawn as its most prominent one.
//
// A MISSING size is the case reading the stylesheet cannot catch, which is why this is a probe of its own
// rather than a check in the two files that already read this sheet. `.sf-focus select` HAS a rule (it sets
// a margin) and the class IS reachable, so css_hooks.ts — which asks whether an emitted class can style
// anything — is satisfied by it; and visual_rules.ts enforces laws the sheet writes into its own comments,
// and there is no such comment here. Both read text, and the declaration that would have to be grepped for
// is exactly the one that is absent. So this MEASURES: it loads the shipped stylesheet and the row main.ts
// actually emits into headless chromium and reads getComputedStyle and getBoundingClientRect off the real
// boxes, the way panel_action_size.ts and slider_chrome.ts do next door.
//
// THE REFERENCE IS NOT A PIXEL COUNT SOMEBODY PICKED. It is the SAME row, rendered on the same page in the
// same column, with its control drawn at the row's own font-size — so "no taller than the row would be if
// the control belonged to it" is asserted against the row itself and stays true when the copy or the column
// widths change. The bare `<select>` beside them reports what the page does with a select no row has
// styled; on the broken tree the training-focus picker measured EXACTLY that, which is the defect stated as
// a measurement rather than as an opinion about hierarchy.
//
// MUTATION-TESTED, because an assertion nothing can fail is worse than none. Removing `font-size` from the
// rule and leaving the padding puts all four measurements back in the red (21px in a 14px row, 33px against
// 26px, 69px against 63px). Renaming `.sf-focus` in main.ts, or swapping its `<select>` for plain text,
// empties the extraction — and that hard-exits red at the top rather than sailing through a measurement of
// nothing, which is the failure mode this file exists to avoid in the first place.
//
// Run: `npx tsx tools/playtest/training_focus_size.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const html = readFileSync('client/index.html', 'utf8');
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== The training-focus picker is sized like the row that labels it ===');

/**
 * The static markup the `.sf-focus` template literal produces. Interpolations go first — the option list
 * carries its own nested backticks — after which what is left between the literal's own backticks is
 * exactly the markup the browser would see.
 */
function emittedRow(): string {
  const at = src.indexOf('<div class="sf-focus">');
  const start = src.lastIndexOf('`', at);
  if (at < 0 || start < 0 || at - start > 4) return '';
  const body = src.slice(start, start + 4000).replace(/\$\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '');
  const end = body.indexOf('`', 1);
  return end < 0 ? '' : body.slice(1, end);
}

// The option list is stripped out with the interpolation that builds it, so it is read back from the
// literal it is built from — a select sizes itself to its widest option, and an empty one would be
// measuring a box no player ever sees.
const FOCI = (src.match(/const FOCI = \[([^\]]*)\]/)?.[1] ?? '')
  .split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
const bareRow = emittedRow();
const options = FOCI.map((f) => `<option>${f}</option>`).join('');
const row = bareRow.replace(/(<select\b[^>]*>)/, `$1${options}`);

console.log(`  ..   row markup ${bareRow.length} chars, ${FOCI.length} training foci: ${FOCI.join(', ') || '(none)'}`);
ok(bareRow.startsWith('<div class="sf-focus">'), 'the training-focus row was extracted from main.ts');
ok(/<select\b/.test(bareRow), 'it still emits a <select> — this is not about to measure a row with no control in it');
ok(FOCI.length >= 3, 'the option list was read back, so the control is sized by its real widest option');
ok(row !== bareRow, 'the options were injected into the extracted select');
// The column matters: the doc's 76px is the height in the 1fr column, not the 1.1fr one beside it.
ok(/season-fixtures[\s\S]{0,240}?\$\{focusSel\}/.test(src), 'the row is still emitted into the narrower season column');
if (fails) { console.log('\n✗ the row could not be read, so nothing below would be measuring anything'); process.exit(1); }

const style = html.slice(html.indexOf('<style'), html.lastIndexOf('</style>') + 8);
const page = `<!doctype html><html><head><meta charset="utf-8">${style}</head><body>`
  + `<div id="app"><div id="season" class="panel"><div id="season-body"><div class="season-cols">`
  + `<div class="season-fixtures"><h4 class="scout-h4">FIXTURES</h4>`
  + `<div class="sf-fx"><span class="sf-md">12</span><span class="sf-v home">H</span><span class="sf-opp">Ashfield Rovers</span><span class="sf-res pending">—</span></div>`
  + `<div id="tfs-live">${row}</div><div id="tfs-ref">${row}</div>`
  + `<select id="tfs-bare">${options}</select></div>`
  + `<div class="season-table-wrap"><h4 class="scout-h4">LEAGUE TABLE</h4></div>`
  + `</div></div></div></div></body></html>`;

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

  const m = await pg.evaluate(() => {
    // THE REFERENCE IS THE ROW'S OWN SIZE, applied to a copy of the row's own control. Anything else is a
    // number somebody picked, and a number somebody picked is what a stylesheet already has too many of.
    // (No helper function in here: tsx compiles a named arrow into a `__name(...)` call that does not
    // exist inside the page, so the whole evaluate throws before it measures anything.)
    const liveRow = document.querySelector('#tfs-live .sf-focus') as HTMLElement | null;
    const refSel = document.querySelector('#tfs-ref .sf-focus select') as HTMLSelectElement | null;
    if (liveRow && refSel) refSel.style.fontSize = getComputedStyle(liveRow).fontSize;
    const want: Record<string, string> = {
      row: '#tfs-live .sf-focus', sel: '#tfs-live .sf-focus select',
      refRow: '#tfs-ref .sf-focus', refSel: '#tfs-ref .sf-focus select',
      bare: '#tfs-bare', fx: '.sf-fx', narrow: '.season-fixtures', wide: '.season-table-wrap',
    };
    const out: Record<string, { size: string; px: number; h: number; w: number } | null> = {};
    for (const k of Object.keys(want)) {
      const el = document.querySelector(want[k]) as HTMLElement | null;
      if (!el) { out[k] = null; continue; }
      const c = getComputedStyle(el), b = el.getBoundingClientRect();
      out[k] = { size: c.fontSize, px: parseFloat(c.fontSize), h: Math.round(b.height), w: Math.round(b.width) };
    }
    return out;
  });

  const { row: r, sel: s, refRow: rr, refSel: rs, bare, fx, narrow, wide } = m as any;
  ok(!!r && !!s && !!rr && !!rs && !!bare, 'the row, its control, the reference copy and the bare select all rendered');
  if (!r || !s || !rr || !rs || !bare) { await browser.close(); console.log('\n✗ nothing was measured'); process.exit(1); }

  console.log(`  ..   columns: fixtures ${narrow.w}px vs table ${wide.w}px`);
  ok(narrow.w < wide.w, 'the focus row is in the narrower of the two season columns (1fr vs 1.1fr)');
  console.log(`  ..   bare <select> (a select no row has styled): ${bare.size}, ${bare.h}px tall`);
  console.log(`  ..   the row is ${r.size}; its control is ${s.size}, ${s.h}px tall, ${s.w}px wide`);
  console.log(`  ..   row ${r.h}px tall vs ${rr.h}px for the same row at the row's own size, and ${fx.h}px for a fixture row`);

  ok(s.px <= r.px, `the control is not drawn larger than the row that labels it (${s.size} in a ${r.size} row)`);
  ok(s.size !== bare.size, `the control has a size of its own rather than the global one (${s.size} vs bare ${bare.size})`);
  ok(s.h <= rs.h, `the control is no taller than it would be at the row's own size (${s.h}px vs ${rs.h}px)`);
  ok(r.h <= rr.h, `the control does not stretch its row (${r.h}px vs ${rr.h}px at the row's own size)`);

  await browser.close();
  console.log(fails ? `\n✗ ${fails} — the season's least consequential control is drawn as its most prominent` : '\n✓ the training-focus picker belongs to its row');
  if (fails) process.exitCode = 1;
}
void main();
