// THE PLAYER CARD'S REGISTER CONTROL MUST BE INSIDE THE FOCUS TRAP THAT OWNS THE CARD.
//
// showPlayerCard's registration line is one ternary with two arms. The registered arm is a real
// `<button type="button" class="pc-link" data-stake="off">withdraw from the squad</button>`. The
// not-registered arm shipped as `<a class="pc-link" data-stake="on">register him for the season</a>` — an
// anchor with NO href and no tabindex, which is not focusable at all and carries no link role. The card is
// modal (`const closeCard = this.dialogify(el)`), and dialogify picks its tab ring with
//   'button:not([disabled]), a[href], select, input, [tabindex]:not([tabindex="-1"])'
// — `a[href]`, not `a`. So the anchor was in neither the initial focus nor the Tab cycle: the trap held
// only [pc-extend, pc-close] and rotated between them forever. A mouse never noticed, because the handler
// is delegated on the overlay via closest('[data-extend],[data-stake],.pc-close') and resolves through the
// anchor unchanged.
//
// WHAT THAT COSTS. Withdrawing is the only write of `staked_since: null` in the codebase
// (client/src/api.ts) and it is reached from the sibling arm one line up — focusable, in the same trap. So
// a keyboard or controller player can un-register his star from this card and then cannot re-register him
// from it. The fallback, the .ns-act Register button in #squad-panel, is hidden behind the "▤ View full
// squad stats" toggle, and `#lineup.simple #squad-panel { display: none; }` (client/index.html) removes it
// outright in simple mode, where there is then no re-registration path at all. Nothing on screen admits
// it: the global focus ring does list `a:focus-visible`, but an <a> that cannot take focus never draws it.
//
// HOW THIS MEASURES IT. Not by grepping for `<button`, which passes on markup no trap can reach. It lifts
// dialogify's real body and the class statics that body reads out of main.ts, lifts the stakeHtml ternary
// verbatim and evaluates BOTH arms, mounts each in a card with the .pc-contract / .pc-extend / .pc-close
// shape showPlayerCard gives it, dialogifies it in headless chromium, and walks the trap with real Tab
// presses. What it asserts is where focus actually goes.
//
// TWO-SIDED, so it cannot pass by measuring an empty ring. The registered arm is asserted reachable too
// and is green on the pre-fix tree: if the harness ever stopped mounting a live trap, that assertion goes
// red first and says the walk is broken rather than reporting the register arm as reachable. The lift is
// asserted before it is used, and the walk must take focus off the screen behind, come back round, and
// never fall out of the card.
//
// MUTATION TEST, all four applied, all four red:
//   1. the pre-fix tree itself (`<a class="pc-link" data-stake="on">`) — exactly the two register-arm
//      checks go red and nothing else does, which is this finding stated as a measurement;
//   2. give the withdraw arm the same href-less <a> — its two checks go red instead, so the walk is
//      measuring reachability and not echoing a tag name back at itself;
//   3. drop `button:not([disabled])` from dialogify's focusables selector — 8 red across both arms: a trap
//      that selects nothing is reported as a broken harness, never as a pass;
//   4. delete the Tab branch from dialogify's onKey — the escape check goes red on both arms, because the
//      walk then falls out of the card (… → pc-close → BODY) instead of wrapping inside it.
//
// Run: `npx tsx tools/playtest/card_stake_reachable.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== The player card\'s register/withdraw control is reachable inside its focus trap ===');

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

// ── the trap, lifted rather than described ───────────────────────────────────────────────────────────
const dialogify = bodyOf('private dialogify(ov: HTMLElement, onClose?: () => void): () => void');
ok(dialogify.length > 0, 'dialogify still exists (the one trap every card goes through)');
const sel = (dialogify.match(/ov\.querySelectorAll<HTMLElement>\(\s*'([^']*)'/) ?? [])[1] ?? '';
ok(sel.length > 0, '…and its focusables() selector was lifted from source, not retyped here');
console.log(`  ..   focusables() selects: ${sel}`);
ok(/e\.key !== 'Tab'/.test(dialogify), '…and it still owns Tab, so that ring is the whole keyboard path into a card');

const card = bodyOf('private showPlayerCard(p: Player, minted = false)');
ok(card.length > 0, 'showPlayerCard still exists');
ok(/const closeCard = this\.dialogify\(el\);/.test(card), '…and the player card is still modal, so the trap is what has to reach its controls');
ok(/closest\('\[data-extend\],\[data-stake\],\.pc-close'\)/.test(card),
   '…with the stake control still reached by a DELEGATED click — which is why the mouse path stayed green');
ok(/class="pc-extend"/.test(card) && /class="pc-close"/.test(card),
   '…and .pc-extend / .pc-close are still the siblings the trap rotates between');

// ── both arms of the one ternary, evaluated from the shipped source ───────────────────────────────────
const at = card.indexOf('const stakeHtml = ci ?');
const END = "`) : '';";
const end = card.indexOf(END, at);
ok(at >= 0 && end > at, 'the stakeHtml ternary was located in showPlayerCard');
if (fails) { console.log('\n✗ dialogify or showPlayerCard no longer has the shape this measures — retune the harness, do not delete it'); process.exit(1); }
const stmt = card.slice(at, end + END.length);
const armOf = (staked: boolean, seasons: number) =>
  String(new Function('ci', 'p', `${stmt} return stakeHtml;`)({ staked, stakedSeasons: seasons }, { id: 'nft:1' }));
const ARMS: Array<[string, string, string]> = [
  ['registered    ', armOf(true, 3), 'stake:off'],
  ['NOT registered', armOf(false, 0), 'stake:on'],
];
ok(/data-stake="off"/.test(ARMS[0][1]) && /data-stake="on"/.test(ARMS[1][1]),
   'both arms rendered from source — the withdraw control and the register control');

// The statics dialogify reads, lifted with it, so a fix that keeps its state elsewhere is measured as it is.
const statics = Array.from(src.matchAll(/^  private static (?:readonly )?(\w+)((?::[^=\n]*)?) = ([^;\n]+);/gm))
  .filter((m) => new RegExp(`\\bGame\\.${m[1]}\\b`).test(dialogify))
  .map((m) => `  static ${m[1]}${m[2]} = ${m[3]};`);
ok(statics.length > 0, 'the statics dialogify reads were lifted with it');
if (fails) { console.log('\n✗ the lift failed, so nothing below would be measuring anything'); process.exit(1); }

const mod = `class Game {\n${statics.join('\n')}\n}\n`
  + dialogify.replace('private dialogify(', 'function dialogify(')
  + `\n(window as any).Game = Game; (window as any).dialogify = dialogify;\n`;

// No stylesheet: focus order is what is measured, and the sheet moves none of it.
const PAGE = `<!doctype html><html><body><div id="app"><button id="squad-btn">Squad</button></div></body></html>`;
/** The card as showPlayerCard nests it around stakeHtml: the contract block with its actions, then Close. */
const cardHtml = (stake: string) =>
  `<div class="pc-card"><div class="pc-contract">`
  + `<div class="pc-cactions"><button class="pc-extend" data-extend="nft:1">Re-sign</button></div>`
  + stake
  + `</div><button class="pc-close">Close</button></div>`;

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

  // Built as SOURCE, not passed as a closure: tsx's esbuild pass rewrites function expressions with a
  // `__name` helper that does not exist in the browser, and page.evaluate ships a function by its text.
  const bootstrap = `
window.name_ = function (a) {
  if (!a || a === document.body) return 'BODY';
  var s = a.getAttribute && a.getAttribute('data-stake');
  return s ? 'stake:' + s : (a.className || a.id || a.tagName);
};
window.mount = function (html) {
  document.getElementById('squad-btn').focus();                 // the squad screen, before the card opens
  var el = document.createElement('div'); el.id = 'player-card-ov'; el.innerHTML = html;
  document.body.appendChild(el);
  window.card = el; window.closeCard = window.dialogify(el);    // exactly what showPlayerCard does
  return window.name_(document.activeElement);
};
window.at = function () { return window.name_(document.activeElement); };
window.ring = function (sel) { return Array.prototype.map.call(window.card.querySelectorAll(sel), window.name_); };`;

  for (const [label, stake, want] of ARMS) {
    await page.setContent(PAGE);
    await page.addScriptTag({ content: js + bootstrap });
    const seen = [await page.evaluate(`window.mount(${JSON.stringify(cardHtml(stake))})`) as string];
    const ring = await page.evaluate(`window.ring(${JSON.stringify(sel)})`) as string[];
    for (let i = 0; i < 5; i++) { await page.keyboard.press('Tab'); seen.push(await page.evaluate('window.at()') as string); }
    console.log(`  ..   ${label}: trap holds [${ring.join(', ')}]; Tab walk ${seen.join(' → ')}`);
    // VACUITY GUARD: an empty ring, or a card that never pulled focus off the screen behind it, must not
    // read as "reachable" — that is a broken harness, and it has to say so instead of passing.
    ok(ring.length >= 2 && seen[0] !== 'BODY' && seen[0] !== 'squad-btn',
       `${label}: the card really opened a live trap and took focus into it`);
    ok(seen.slice(1).includes(seen[0]), `${label}: …and the walk comes back round, so it saw the whole ring`);
    ok(!seen.includes('BODY'), `${label}: …and never escapes the card, so this ring is the entire keyboard path`);
    ok(ring.includes(want), `${label}: the ${want === 'stake:on' ? 'register' : 'withdraw'} control is in what focusables() selects`);
    ok(seen.includes(want), `${label}: …and a real Tab walk lands on it`);
  }

  await browser.close();
  console.log(fails ? `\n✗ ${fails} — a control on the player card cannot be reached from the keyboard`
                    : '\n✓ both arms of the registration line are reachable inside the card\'s focus trap');
  if (fails) process.exitCode = 1;
}
void main();
