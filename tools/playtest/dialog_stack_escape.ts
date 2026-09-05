// ESCAPE CLOSES THE DIALOG ON TOP, NOT THE PILE UNDER IT.
//
// dialogify gives every overlay its own `document.addEventListener('keydown', onKey, true)` and its Escape
// branch only preventDefaults — so two stacked dialogs are two capture-phase listeners on the SAME node,
// and one Escape ran both of them in registration order, outermost first. The refcount three lines above it
// exists precisely because "Two overlays can stack", so the stacking was known; the key handling was not
// written for it.
//
// One path in the shipped game reaches that stack: the Transfer Market. openTransferMarket dialogifies its
// overlay, and its Buy/Sell rows open a confirm that dialogifies a second one on top. So "Cancel" on
// "Sell <player> for +380c?" did not return the player to the market — it tore the market down as well and
// dropped focus onto <body>, because the button the confirm would have restored had just been detached
// with the market it lived in. Escape/B is the universal back gesture, and on the one screen where the
// player spends coins it went two screens back and lost the keyboard.
//
// THIS PROBE DOES NOT GREP FOR A STACK, because a grep passes on a stack that is pushed and never read.
// It lifts dialogify's real body and the class statics that body reads out of main.ts, lifts the two real
// overlay templates out of openTransferMarket and openConfirm, transpiles the lot, and runs it in headless
// chromium: market overlay, confirm on top, focus on the Sell button that opened it, one Escape. Then it
// reads back which overlays survived, whether #app is still inert, and where focus landed.
//
// NOT VACUOUS, in three ways. The lift is asserted before it is used — a renamed method or template leaves
// this measuring nothing, and says so instead of passing. The setup itself is asserted (both overlays
// present, inertDepth at 2, focus on Cancel) before any key is pressed, so a harness that failed to stack
// anything cannot report a green single-close. And the assertions are two-sided: one says the confirm DID
// close, the other says the market did NOT, so neither "close everything" nor "close nothing" passes.
//
// MUTATION-TESTED, three ways, all three run. Against the tree as it was when this was written — one Escape
// shared between every listener — four assertions go red together: the market survives, the page behind
// stays inert at depth 1, and both focus restores. Making close() pop the stack instead of splicing out the
// overlay by identity leaves that normal case green and turns the out-of-order guard red. So does the
// tempting one-liner this file exists to reject: capture `inertDepth` at open time and return early unless
// it still matches. It looks equivalent and is not — see the guard at the bottom.
//
// Run: `npx tsx tools/playtest/dialog_stack_escape.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== Escape closes the dialog on top, not every dialog under it ===');

/** The body of a method, brace-matched from its signature. */
function bodyOf(signature: string): string {
  const at = src.indexOf(signature);
  if (at < 0) return '';
  let depth = 0;
  for (let i = src.indexOf('{', at); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(at, i + 1); }
  }
  return '';
}

// ── the stack is real in the shipped game, not a hypothetical ────────────────────────────────────────
const dialogify = bodyOf('private dialogify(ov: HTMLElement, onClose?: () => void): () => void');
ok(dialogify.length > 0, 'dialogify still exists (the one helper every overlay goes through)');
ok(/document\.addEventListener\('keydown', onKey, true\)/.test(dialogify),
   '…and still owns Escape from a capture-phase listener on `document`, one registered per overlay');
const market = bodyOf('private openTransferMarket()');
const confirmBody = bodyOf('private openConfirm(message: string, confirmLabel: string, onYes: () => void)');
const render = bodyOf('private renderTransferMarket()');
const sellFlow = bodyOf('private async sellPlayerFlow(playerId: string)');
ok(/const close = this\.dialogify\(ov\);/.test(market), 'the Transfer Market overlay is dialogify\'d');
ok(/const close = this\.dialogify\(ov\);/.test(confirmBody), '…and so is the confirm that opens on top of it');
ok(/data-sell/.test(render) && /sellPlayerFlow/.test(render), 'the market\'s Sell rows still call sellPlayerFlow');
ok(/this\.openConfirm\(/.test(sellFlow), '…which opens that confirm — this is the stack, on the screen where coins are spent');

// ── lift the real code and the real markup ───────────────────────────────────────────────────────────
/** The `ov.innerHTML = \`…\`` template out of an overlay opener, template literal included. */
const tplOf = (body: string) => {
  const at = body.indexOf('ov.innerHTML = `');
  const end = body.indexOf('`;', at);
  return at < 0 || end < 0 ? '' : body.slice(at + 'ov.innerHTML ='.length, end + 1);
};
const marketHtml = String(new Function('SPINNER', `return ${tplOf(market)}`)('<i class="spin"></i>'));
const confirmHtml = String(new Function('message', 'confirmLabel',
  `return ${tplOf(confirmBody)}`)('Sell <b>Ray Bright</b> for +380c?', 'Sell'));
ok(/class="set-x"/.test(marketHtml) && /id="tm-body"/.test(marketHtml),
   'the market overlay was rendered from source (its ✕ and its body are in it)');
ok(/id="cf-no"/.test(confirmHtml) && /id="cf-yes"/.test(confirmHtml),
   'the confirm was rendered from source (Cancel and the action button are in it)');

// The class statics dialogify reads, lifted rather than hand-written — so a fix that stores its state
// somewhere else is measured as it is, not as this file imagines it.
const statics = Array.from(src.matchAll(/^  private static (?:readonly )?(\w+)((?::[^=\n]*)?) = ([^;\n]+);/gm))
  .filter((m) => new RegExp(`\\bGame\\.${m[1]}\\b`).test(dialogify))
  .map((m) => `  static ${m[1]}${m[2]} = ${m[3]};`);
ok(statics.length > 0, 'the statics dialogify reads were lifted with it');
if (fails) { console.log('\n✗ dialogify or the Transfer Market no longer has the shape this measures — retune the harness, do not delete it'); process.exit(1); }

const mod = `class Game {\n${statics.join('\n')}\n}\n`
  + dialogify.replace('private dialogify(', 'function dialogify(')
  + `\n(window as any).Game = Game; (window as any).dialogify = dialogify;\n`;

// No stylesheet: what is measured here is focus, `inert` and detachment, and the sheet moves none of them.
const PAGE = `<!doctype html><html><body><div id="app"><button id="season-btn">Season</button></div></body></html>`;

async function main() {
  let ts: any;
  try { const m = await import('typescript'); ts = (m as any).default ?? m; }
  catch { console.log('  FAIL typescript is not installed — run `npm i` at the repo root'); process.exit(1); }
  let chromium: any;
  try { ({ chromium } = await import('playwright')); }
  catch {
    console.log('  FAIL playwright is not installed — `npm i -D playwright && npx playwright install chromium`');
    process.exit(1);
  }
  const js = ts.transpileModule(mod, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  let browser: any;
  try { browser = await chromium.launch(); }
  catch (e: any) {
    console.log(`  FAIL chromium could not launch (${String(e?.message ?? e).slice(0, 90)})`);
    console.log('       run `npx playwright install chromium`');
    process.exit(1);
  }
  const page = await browser.newPage();

  // The page functions are built as SOURCE, not passed as closures: this file is run through tsx, whose
  // esbuild pass rewrites function expressions with a `__name` helper that does not exist inside the
  // browser, and page.evaluate ships a function by its source text.
  const bootstrap = `
window.open2 = function () {                       // the market, then a confirm on top of it
  var mk = function (id, html) { var d = document.createElement('div'); d.id = id; d.innerHTML = html; document.body.appendChild(d); return d; };
  document.getElementById('season-btn').focus();                                  // the season screen, before anything opens
  window.closeMarket = window.dialogify(mk('settings-ov', ${JSON.stringify(marketHtml)}));   // openTransferMarket
  document.getElementById('tm-body').innerHTML = '<button data-sell="p1">Sell &middot; +380c</button>';  // one renderTransferMarket row
  document.querySelector('[data-sell]').focus();                                  // the player clicks it…
  window.closeConfirm = window.dialogify(mk('confirm-ov', ${JSON.stringify(confirmHtml)})); // …and openConfirm stacks on top
};
window.snap = function () {
  var a = document.activeElement;
  return { market: !!document.getElementById('settings-ov'), confirm: !!document.getElementById('confirm-ov'),
           inert: document.getElementById('app').hasAttribute('inert'), depth: window.Game.inertDepth,
           focus: (a && (a.id || a.getAttribute('data-sell') || a.tagName)) || '' };
};`;
  const load = async () => { await page.setContent(PAGE); await page.addScriptTag({ content: js + bootstrap }); };
  const snap = () => page.evaluate('window.snap()') as Promise<any>;

  // ── the reachable path: cancel a sale, expect to be back in the market ─────────────────────────────
  await load();
  await page.evaluate('window.open2()');
  const before = await snap();
  console.log(`  ..   stacked: market=${before.market} confirm=${before.confirm} inertDepth=${before.depth} focus=${before.focus}`);
  ok(before.market && before.confirm && before.depth === 2 && before.focus === 'cf-no',
     'the harness really stacked two dialogs, and focus is on the confirm\'s Cancel');
  if (fails) { console.log('\n✗ the stack never formed, so nothing below would be measuring anything'); await browser.close(); process.exit(1); }

  await page.keyboard.press('Escape');
  const one = await snap();
  console.log(`  ..   after Escape: market=${one.market} confirm=${one.confirm} #app inert=${one.inert} inertDepth=${one.depth} focus=${one.focus}`);
  ok(!one.confirm, 'Escape closed the confirm');
  ok(one.market, '…and left the Transfer Market open underneath it');
  ok(one.inert && one.depth === 1, '…with the page behind still inert, because a dialog is still up');
  ok(one.focus === 'p1', '…and focus back on the Sell button that opened the confirm, not on <body>');

  await page.keyboard.press('Escape');
  const two = await snap();
  console.log(`  ..   after Escape again: market=${two.market} #app inert=${two.inert} inertDepth=${two.depth} focus=${two.focus}`);
  ok(!two.market && !two.inert && two.depth === 0, 'a second Escape closes the market and hands the page back');
  ok(two.focus === 'season-btn', '…returning focus to the season screen the market was opened from');

  // ── the guard that rejects a depth comparison: an outer dialog can close first ─────────────────────
  // The overlays are siblings under <body> and only #app is inerted, so nothing in the code stops the outer
  // one's own close() running first — its ✕ and its backdrop call it directly. Today that particular click
  // is swallowed, because the confirm's inset:0 backdrop happens to cover the market at the same z-index;
  // that is a stacking accident one CSS line from being untrue, and it is not a guarantee dialogify makes.
  // Matching by identity does not depend on it. A captured-inertDepth test does, and dies here: after the
  // out-of-order close the confirm is the only dialog left and Escape is the only way off it.
  await load();
  await page.evaluate('window.open2(); window.closeMarket();');
  const oo = await snap();
  ok(!oo.market && oo.confirm && oo.depth === 1, 'the market can be closed out of order, leaving the confirm alone on top');
  await page.keyboard.press('Escape');
  const oo2 = await snap();
  console.log(`  ..   out-of-order close, then Escape: confirm=${oo2.confirm} #app inert=${oo2.inert} inertDepth=${oo2.depth}`);
  ok(!oo2.confirm && !oo2.inert && oo2.depth === 0, 'Escape still closes the confirm, and the page is handed back');

  await browser.close();
  console.log(fails ? `\n✗ ${fails} — Escape does not close one dialog at a time`
                    : '\n✓ cancelling a purchase returns to the market, with focus on the button that opened it');
  if (fails) process.exitCode = 1;
}
void main();
