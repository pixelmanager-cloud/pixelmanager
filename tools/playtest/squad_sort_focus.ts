// SORTING THE SQUAD TABLE MUST HAND THE SORT HEADER ITS KEYBOARD FOCUS BACK.
//
// F-142 made the squad table's column headers keyboard-operable — statsTableHTML's th() emits
// `class="sortable" aria-sort=...` and renderSquadPanel runs makeActivatable over them, so Enter on a
// header sorts the column. Then the handler's last act is `this.renderSquadPanel()`, whose FIRST act is
// `panel.innerHTML = ...` — which destroys the very <th> the player is standing on. Nothing restored it:
// measured in chromium, Enter on OVR left document.activeElement === BODY. The tab stop survives (the
// rebuilt headers are made activatable again); the POSITION does not. To sort a second column the player
// had to tab back into #squad-panel past the tactics selects and every player/duty select in the XI, and
// pay that again on the next sort — sorting is repeated, non-destructive and unconfirmed, so the cost is
// paid on every single use of the thing F-142 added. It is the failure keepFocus() was written for on the
// career screen, at a panel that helper was never wired into.
//
// THE HALF THAT GREPPING WOULD MISS. Wiring keepFocus() in is NOT sufficient here, and a source-level
// "does it call the helper" check would report the fix green while the screen still dumped the player on
// <body>. keepFocus matches the old node to a new one by id -> data-tab -> same-data-act position ->
// .cg-tab, and a sort header carries none of the last three while #squad-panel renders no .cg-tab at all —
// so with the wrapper in place and no id on the <th>, `back` falls through every link of that chain to
// null and nothing is focused. Measured, both ways: wrapper + no id -> BODY; wrapper + id -> the same OVR
// header. So the id in th() is load-bearing, and this probe RENDERS the header markup the game actually
// emits, drives a real Tab/Enter through the real keepFocus() and makeActivatable() lifted out of main.ts,
// and reads document.activeElement — rather than asserting that some text appears in the file.
//
// ORDER IS PART OF THE FIX, so the harness reproduces main.ts's order instead of assuming a good one: a
// restoreFocus() called BEFORE makeActivatable runs on a header that has no tabindex yet, which is not in
// keepFocus's FOCUSABLE list, so the restore misses and the player lands on <body> exactly as before. The
// two booleans below are read out of renderSquadPanel and fed to the page, so this measures the wiring the
// file really has.
//
// NOT VACUOUS: the run fails unless the header markup came out of th() carrying class="sortable", unless
// three headers rendered, unless focus actually STARTED on the OVR header before Enter, and unless the
// sort handler actually fired — a rebuild that never happened would leave focus "intact" for the wrong
// reason.
//
// MUTATION TEST — five applied, all five red. It is red on the pre-fix tree, which is the tree it was
// written against. On the fixed tree: drop `id="sq-th-${key}"` from th() and the verdict reads BODY;
// delete `restoreFocus();` from renderSquadPanel, same; move `restoreFocus();` above the makeActivatable
// calls, same; strip `setAttribute('tabindex', '0')` out of makeActivatable and it goes red one step
// earlier, on "focus reached the OVR header by Tab", because there is then no tab stop to press Enter on.
//
// Run: `npx tsx tools/playtest/squad_sort_focus.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== Sorting the squad table hands the header its keyboard focus back ===');

/** The source between two markers. '' when either is missing or out of order — which must FAIL rather
 *  than skip: an assertion run over nothing is how four dead `transition: width` rules survived here. */
function between(from: string, to: string): string {
  const a = src.indexOf(from);
  if (a < 0) return '';
  const b = src.indexOf(to, a + from.length);
  return b < 0 ? '' : src.slice(a, b);
}

/** A method of the App class, brace-matched from its signature, so the harness runs the real helper. */
function method(sig: string): string {
  const a = src.indexOf(sig);
  if (a < 0) return '';
  let depth = 0;
  for (let i = src.indexOf('{', a); i >= 0 && i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(a, i + 1);
  }
  return '';
}

// ── the shape this measures, taken from the game rather than retyped ────────────────────────────────
const render = between('private renderSquadPanel() {', 'private updateEditorInsight(');
ok(render.length > 0, 'found renderSquadPanel (the method this is about)');
const writeAt = render.indexOf('panel.innerHTML =');
ok(writeAt >= 0, '...it still rebuilds the whole panel with panel.innerHTML (the write that destroys the focused header)');
ok(/this\.makeActivatable\(panel\.querySelectorAll\('th\.sortable'\)\)/.test(render),
   "...and still makes th.sortable keyboard-operable (F-142's tab stop, which is what this protects)");
ok(/const head = `<tr><th><\/th>\$\{th\('Pos', 'pos'/.test(src),
   'the table header is still built from th(), so the markup rendered below is the markup the game draws');

// The two wiring facts, read out of the file and handed to the page so the harness measures what
// renderSquadPanel really does rather than an idealised version of it.
const keepAt = render.indexOf('this.keepFocus(panel)');
const restoreAt = render.lastIndexOf('restoreFocus();');
const lastActivateAt = render.lastIndexOf('this.makeActivatable(');
const wrapped = keepAt >= 0 && writeAt >= 0 && keepAt < writeAt;
const restoreAfterActivate = restoreAt >= 0 && lastActivateAt >= 0 && restoreAt > lastActivateAt;
console.log(`  ..   renderSquadPanel: keepFocus before the write = ${wrapped}, restoreFocus after makeActivatable = ${restoreAfterActivate}`);

const keepFocusSrc = method('private keepFocus(host: HTMLElement)');
const activatableSrc = method('private makeActivatable(els:');
ok(keepFocusSrc.length > 0 && activatableSrc.length > 0,
   'lifted keepFocus() and makeActivatable() out of main.ts (the page below runs the real helpers, not a copy)');

// The <th> exactly as statsTableHTML emits it, evaluated from that arrow's own source.
const thSrc = between('const th = (label', '</th>`;');
ok(thSrc.length > 0, "lifted th() out of statsTableHTML (the header markup below is th()'s own output)");
if (fails) { console.log('\n✗ main.ts no longer has the shape this measures — retune the harness, do not delete it'); process.exit(1); }

/** Types stripped, because this source is about to run in a browser. A leftover annotation is a syntax
 *  error there, so anything missed shows up as a thrown harness, never as a green run. */
const toJs = (s: string) => s
  .replace(/^\s*private\s+(\w+)\(\s*(\w+)[^)]*\)[^{]*\{/, 'function $1($2) {')
  .replace(/querySelectorAll<HTMLElement>/g, 'querySelectorAll')
  .replace(/\bas HTMLElement(?: \| null)?/g, '')
  .replace(/\(el: HTMLElement\)/g, '(el)')
  .replace(/\(e as KeyboardEvent\)/g, 'e');

let header = '';
try {
  const expr = thSrc.replace(/: string/g, '').replace(/^const th = /, '') + '</th>`';
  const th = new Function('sort', 'arrow', `return ${expr}`)(null, () => '') as
    (l: string, k: string, s?: string, t?: string) => string;
  header = `<tr><th></th>${th('Pos', 'pos')}${th('Name', 'name', 'text-align:left')}${th('OVR', 'ovr', '', 'Overall rating')}${th('AGE', 'age')}</tr>`;
} catch (e: any) { ok(false, `th() could not be evaluated (${String(e?.message ?? e).slice(0, 80)})`); }
ok((header.match(/class="sortable"/g) ?? []).length >= 3,
   `th() rendered ${(header.match(/class="sortable"/g) ?? []).length} sortable headers (without them nothing below is a test)`);
console.log(`  ..   header markup: ${header.slice(header.indexOf('<th class'), header.indexOf('<th class') + 96)}...`);
if (fails) { console.log('\n✗ the harness could not build the squad header — retune it, do not delete it'); process.exit(1); }

// ── the harness page: renderSquadPanel's write, its wiring order, and the real helpers ──────────────
const page = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<button id="before">a control outside the panel, so Tab arrives from where the player really is</button>
<div id="squad-panel"></div>
<script>
${toJs(keepFocusSrc)}
${toJs(activatableSrc)}
window.__sorts = 0;
var WRAPPED = ${wrapped}, RESTORE_AFTER = ${restoreAfterActivate};
function render() {
  var panel = document.getElementById('squad-panel');
  var restoreFocus = WRAPPED ? keepFocus(panel) : function () {};
  panel.innerHTML = '<table class="squad">' + ${JSON.stringify(header)} + '</table>';
  panel.querySelectorAll('th.sortable').forEach(function (th) {
    th.addEventListener('click', function () { window.__sorts++; render(); });
  });
  if (!RESTORE_AFTER) restoreFocus();
  makeActivatable(panel.querySelectorAll('th.sortable'));
  if (RESTORE_AFTER) restoreFocus();
}
render();
</script></body></html>`;

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
  const boom: string[] = [];
  pg.on('pageerror', (e: any) => boom.push(String(e?.message ?? e)));
  await pg.setContent(page, { waitUntil: 'load' });
  ok(boom.length === 0, `the lifted helpers run in a browser${boom.length ? ` — threw: ${boom[0].slice(0, 90)}` : ''}`);

  const at = () => pg.evaluate(() => {
    const a = document.activeElement as HTMLElement | null;
    return { tag: a?.tagName ?? 'NONE', sort: a?.dataset?.sort ?? '', id: a?.id ?? '' };
  });
  // Tab in from outside the panel, the way a keyboard player reaches the table at all.
  for (let i = 0; i < 12 && (await at()).sort !== 'ovr'; i++) await pg.keyboard.press('Tab');
  const before = await at();
  ok(before.sort === 'ovr', `focus reached the OVR header by Tab before pressing Enter (landed on ${before.tag}${before.sort ? ` [${before.sort}]` : ''}) — nothing below means anything otherwise`);
  if (fails) { await browser.close(); console.log('\n✗ the harness never got focus onto a sort header'); process.exit(1); }

  await pg.keyboard.press('Enter');
  const after = await at();
  const sorts = await pg.evaluate(() => (window as any).__sorts);
  await browser.close();

  ok(sorts === 1, `Enter actually sorted and rebuilt the table (${sorts} rebuild(s)) — "focus survived" over a table that never rebuilt would be a lie`);
  console.log(`  ..   after Enter on OVR, document.activeElement = ${after.tag}${after.id ? ` #${after.id}` : ''}${after.sort ? ` [data-sort=${after.sort}]` : ''}`);
  const landed = after.sort === 'ovr';
  ok(landed, landed
    ? 'sorting handed the keyboard back to the OVR header it was pressed on'
    : after.tag === 'BODY'
      ? 'sorting left the player on <body> — every further sort costs a full re-tab back into #squad-panel'
      : `sorting moved focus to ${after.tag}${after.id ? ` #${after.id}` : ''}, not back to the header it was pressed on`);

  console.log(fails ? `\n✗ ${fails} — the squad table's keyboard sort throws focus away`
                    : '\n✓ the sort headers keep the keyboard through the rebuild');
  if (fails) process.exitCode = 1;
}
main();
