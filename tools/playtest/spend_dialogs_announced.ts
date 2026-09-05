// THE TWO SCREENS WHERE COINS LEAVE THE ACCOUNT MUST SAY WHAT THEY ARE.
//
// Transfer Market and Contract Talks opened as anonymous stacks of divs: no role, no aria-modal, and a
// .tt-title nothing referenced. dialogify supplies inert, the Tab trap and Escape but sets no ARIA at all,
// and its focus move is `focusables()[0]?.focus()` — in both overlays the first match in DOM order is the ✕,
// whose accessible name is "Close" (in the market, #tm-body still holds only SPINNER at that moment, so
// there is nothing else to match). So the whole announcement a screen-reader player got for the screen where
// he SPENDS was "Close, button": the market never said it was the market, and in Contract Talks the name of
// the man being negotiated with — the one piece of context that makes the wage figures mean anything — was
// on screen and unreadable. openConfirm carries the fix for exactly this failure already (main.ts:993);
// these two are the same shape, on the two screens where coins are irreversibly committed.
//
// THIS PROBE DOES NOT GREP FOR THE ATTRIBUTES. Grepping passes on `aria-labelledby="tm-titel"` and on the
// word appearing in a comment. It lifts each overlay's real innerHTML template out of main.ts, evaluates it
// with the real SPINNER (also lifted) and a player name, and then computes the announcement the way a screen
// reader does: find the element carrying the dialog role, resolve its aria-labelledby ids AGAINST THAT SAME
// RENDERED HTML, and read the text out of them. A typo'd id, a dropped id attribute or a role on the wrong
// node all leave the announcement empty. It also re-measures the premise — that the first focusable
// dialogify lands on says nothing about which dialog this is — so the checks below cannot be beside the point.
//
// MUTATION-TESTED so no assertion here can be vacuous: deleting `id="cn-title"` from the template, pointing
// aria-labelledby at a non-existent id, moving the role from the card onto an inner div, and swapping
// role="dialog" for role="alertdialog" each turn it red; changing the fixture name changes the printed
// announcement, which is how you can see the player's name is really being read out of the markup.
//
// Run: `npx tsx tools/playtest/spend_dialogs_announced.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== The two spend dialogs announce what they are ===');

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

/** Text content of the element carrying `id`, tags stripped, depth-matched so nesting cannot truncate it. */
function textOfId(html: string, id: string): string {
  const open = new RegExp(`<([a-z]+)([^>]*\\bid="${id}"[^>]*)>`, 'i').exec(html);
  if (!open) return '';
  const tag = open[1].toLowerCase();
  let depth = 1, i = open.index + open[0].length;
  const start = i;
  while (i < html.length && depth > 0) {
    if (html.startsWith(`<${tag}`, i)) depth++;
    else if (html.startsWith(`</${tag}`, i)) { depth--; if (!depth) break; }
    i++;
  }
  return html.slice(start, i).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// The real spinner, not a stand-in: it is what fills #tm-body when the market opens, so if it ever gained a
// focusable of its own the "first focusable is the ✕" premise below would change, and this probe would say so.
const SPINNER = /^const SPINNER = '(.*)';$/m.exec(src)?.[1] ?? '';
ok(SPINNER.includes('pixel-loader'), 'the real SPINNER was lifted from main.ts (it is what the market shows first)');

/** The rendered innerHTML of the first `ov.innerHTML = ...` template literal in a method body. */
function renderTemplate(body: string): string {
  const at = body.indexOf('ov.innerHTML =');
  const end = body.indexOf('`;', at);
  if (at < 0 || end < 0) return '';
  const tpl = body.slice(at + 'ov.innerHTML ='.length, end + 1);
  // A THIRD interpolated value appearing in one of these templates throws ReferenceError here, which is a
  // loud fail rather than a quietly empty string that would make every check below vacuous.
  try { return String(new Function('name', 'SPINNER', `return ${tpl}`)('Bruno Vale', SPINNER)); }
  catch (e) { console.log(`  ..   template did not evaluate: ${(e as Error).message}`); return ''; }
}

const DIALOGS = [
  {
    what: 'Transfer Market',
    sig: 'private openTransferMarket()',
    says: /transfer market/i,
    why: 'the announcement SAYS IT IS THE MARKET — "Close, button" never told him where he was',
  },
  {
    what: 'Contract Talks',
    sig: 'private async openContractNegotiation(playerId: string)',
    says: /Bruno Vale/,
    why: 'the announcement NAMES THE MAN being negotiated with — without him the wage figures mean nothing',
  },
];
ok(DIALOGS.length === 2, 'both spend dialogs are under test (this list is what makes the checks below count)');

for (const d of DIALOGS) {
  console.log(`\n  -- ${d.what} --`);
  const body = bodyOf(d.sig);
  ok(body.length > 0, `${d.what} still exists`);
  // The ARIA is only ever spoken because focus is moved into the overlay; that is dialogify's job.
  ok(/this\.dialogify\(ov\)/.test(body), `${d.what} still goes through dialogify, which is what triggers the announcement`);

  const html = renderTemplate(body);
  // If this ever renders nothing, every assertion below would be measuring an empty string.
  ok(html.includes('class="set-x"') && html.includes('tt-title'),
     `${d.what}'s markup was rendered from source (the ✕ and the title are in it)`);

  // The premise, re-measured rather than assumed: what dialogify's focus move actually announces on its own.
  const firstBtn = /<button[^>]*>/i.exec(html)?.[0] ?? '';
  const firstName = /aria-label="([^"]*)"/i.exec(firstBtn)?.[1] ?? '';
  console.log(`  ..   first focusable: ${firstBtn} → announced as "${firstName}"`);
  ok(firstName.length > 0 && !d.says.test(firstName),
     `the first focusable says nothing about which dialog this is (got "${firstName}"), so the card's own name is the only announcement`);

  const dialogTag = /<[a-z]+[^>]*\brole="(dialog|alertdialog)"[^>]*>/i.exec(html);
  ok(dialogTag !== null, `${d.what} carries a dialog role — without one it is an anonymous stack of divs`);
  const tag = dialogTag?.[0] ?? '';
  const role = dialogTag?.[1] ?? '(none)';
  const attr = (n: string) => (new RegExp(`\\b${n}="([^"]*)"`, 'i').exec(tag)?.[1] ?? '');

  ok(/\btt-card\b/.test(tag),
     'the role sits on the CARD, not on the full-screen backdrop — clicking the backdrop dismisses, so it is chrome');
  ok(role === 'dialog',
     `it is a plain dialog, not an alertdialog: this one is entered, not thrown at you — alertdialog belongs ` +
     `to the destructive confirm, and confirm_announced.ts asserts that distinction (got role="${role}")`);
  ok(attr('aria-modal') === 'true', 'aria-modal="true" — the season screen behind it is not part of this');

  const name = attr('aria-labelledby').split(/\s+/).filter(Boolean).map((id) => textOfId(html, id)).join(' ').trim();
  console.log(`  ..   announced as: role=${role} name="${name}"`);
  // Resolution against the rendered HTML is the load-bearing step: a labelledby pointing at an id that is not
  // there returns '' here and fails, exactly as a screen reader would find nothing to read.
  ok(name.length > 0, 'aria-labelledby resolves to a real element in the same markup (the title is announced)');
  ok(d.says.test(name), d.why);
}

console.log(fails ? `\n✗ ${fails} — the screens where coins are spent do not announce what they are`
                  : '\n✓ both spend dialogs name themselves, and contract talks names the player');
if (fails) process.exitCode = 1;
