// THE RESULT OF THE TURN IS THE ONE THING THE TURN WAS FOR, AND IT WAS SPOKEN TO NOBODY.
//
// `doCareerAct` stores the narration, `renderCareer` puts it at the very top of the content, and then
// `restoreFocus()` moves focus onto card N of the NEW hand — which sits below it. `.cg-narrate` carried no
// role and no aria-live, and the only two live regions the game had (#toast, #mm-preview) are nowhere near
// this screen — so what a screen-reader player was handed after committing a turn was the name of a card
// they had not chosen yet, never the narrated result. ~120 turns a generation, on the core loop.
// docs/decisions-for-ck.md §104, option (a): the narrated result is announced; the two verdict pills stay
// outside the region by that decision, not by oversight.
//
// WHAT A READER ACTUALLY HEARS, AND WHY IT IS IN THAT ORDER. The innerHTML write and restoreFocus() sit in
// one synchronous stretch of renderCareer, so nothing is spoken between them: the engine flushes the focus
// change and the newly-live region together at the end of the task, the reader speaks the focused card
// first (a focus change cancels speech in progress), and the polite region follows it. So: "Play <card>…",
// then the narrated result. That holds only while the region is POLITE and while nothing awaits between the
// write and the focus move — `alert` would cut the card off mid-word, and an await would let the narration
// start and then be cancelled by the focus change. Both are checked below: both are one edit away, and
// neither of them shows up on screen.
//
// WHAT IS MEASURED — not a grep for the attribute, which passes on the word in a comment, on
// `role="statuses"`, and on the attribute sitting one div away on the pills. This lifts the real
// `const narr = …` line and the real outcomeChipHtml() out of main.ts, renders one turn with them, and
// reads the live regions back out of the HTML the game would have written.
//
// VACUITY GUARDS, since every check reads a string this file built:
//   * both lifts are asserted — the line and the method must come out of source whole;
//   * the rendered block must contain the narration and both pills before anything is read off it;
//   * the block is echoed on a `..` line, so a check that measured '' shows up in the log instead of
//     passing as a green tick over nothing.
//
// MUTATION TEST — each of these must turn a line below red: delete `role="status"`; change it to
// `role="alert"`; move it onto the `.cg-outcome` pill wrapper instead (the count stays 1, but the narration
// is no longer inside a region); add a SECOND region so the pills announce separately; move `narr` after
// `body` in the content string; hoist `restoreFocus()` above the innerHTML write; put an `await` between
// those two.
//
// NOT MEASURED HERE, deliberately: whether Blink exposes the node as live=polite. The same attribute on
// #toast was measured in headless chromium and the result is recorded beside it in index.html — live=polite,
// atomic=true, ignored=false, and opacity:0 does NOT make it ignored, which is what `.cg-narrate`'s narrfade
// animation needs. What this probe is actually guarding — the order against the focus move — no headless
// engine can speak for anyway.
//
// Run: `npx tsx tools/playtest/turn_outcome_announced.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== the narrated outcome of a career turn is announced, and does not fight the focus move ===');

/** The body of a method, brace-matched from its signature. `${}` inside the templates stays balanced. */
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

// ── lift the real turn-outcome block out of main.ts ──────────────────────────────────────────────────
const chip = bodyOf('private outcomeChipHtml(): string');
ok(chip.includes('cg-oc-pill'), 'outcomeChipHtml came out of source whole — the two verdict pills that sit above the narration');
const chipBody = chip.slice(chip.indexOf('{'));

const NARR_HEAD = 'const narr = this.lastNarration ?';
ok(src.split(NARR_HEAD).length - 1 === 1, 'renderCareer still builds the turn-outcome block in exactly one place');
const nAt = src.indexOf(NARR_HEAD);
const narrLine = nAt < 0 ? '' : src.slice(nAt, src.indexOf('\n', nAt));
ok(narrLine.includes('cg-narrate') && narrLine.trimEnd().endsWith(';'),
   'and that line came out whole — the checks below run the real code, not a copy of it');

type Outcome = { answeredAsk: boolean; matchedAsk: boolean; fit: number; bestFit: number; success: number; tags: string[] };
/** One turn's outcome block, rendered by the game's own code against a stubbed `this`. */
function renderBlock(o: Outcome | null, narration: string): string {
  const f = new Function('outcome', 'narration', `
    const self = {
      lastOutcome: outcome,
      lastNarration: narration,
      outcomeChipHtml() ${chipBody},
    };
    return (function () { ${narrLine} return narr; }).call(self);
  `) as (o: Outcome | null, n: string) => string;
  return f(o, narration);
}

const NARRATION = 'He took it first time, and the away end stood up.';
const OUTCOME: Outcome = { answeredAsk: true, matchedAsk: true, fit: 0.9, bestFit: 0.9, success: 0.86, tags: ['Vision'] };
let block = '';
try { block = renderBlock(OUTCOME, NARRATION); }
catch (e) { ok(false, `the outcome block no longer renders on its own — teach this probe what it reads now (${(e as Error).message})`); }
console.log(`  ..   one turn renders: ${block || '(nothing)'}`);
ok(block.includes(NARRATION) && (block.match(/cg-oc-pill/g) ?? []).length === 2,
   'the lift really rendered this turn — the narration and both verdict pills are in the string every check below reads');

// ── what assistive tech is handed ────────────────────────────────────────────────────────────────────
/** Every element in `html` a reader treats as a live region, in document order. */
function liveRegions(html: string): Array<{ tag: string; at: number; role: string; live: string }> {
  const out: Array<{ tag: string; at: number; role: string; live: string }> = [];
  for (const m of html.matchAll(/<([a-z]+)\b([^>]*)>/g)) {
    const role = /\brole="([^"]*)"/.exec(m[2])?.[1] ?? '';
    const live = /\baria-live="([^"]*)"/.exec(m[2])?.[1] ?? '';
    if (['status', 'alert', 'log'].includes(role) || (live !== '' && live !== 'off')) out.push({ tag: m[1], at: m.index!, role, live });
  }
  return out;
}
/** The inner HTML of the element opening at `at`. Same-name tags are counted, so a nested span cannot end it early. */
function innerOf(html: string, at: number, tag: string): string {
  const openEnd = html.indexOf('>', at) + 1;
  const re = new RegExp(`<(/?)${tag}\\b`, 'g'); re.lastIndex = openEnd;
  let depth = 1;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(openEnd, m.index);
  }
  return '';
}

const regions = liveRegions(block);
console.log(`  ..   live regions in it: ${regions.length ? regions.map((r) => `<${r.tag} role="${r.role || '-'}" aria-live="${r.live || '-'}">`).join(' ') : '(none)'}`);
ok(regions.length === 1,
   'the turn outcome is exactly ONE live region — none is the player being told nothing; two is the pills and the ' +
   'prose arriving as two announcements with no defined order between them (if the pills should be spoken as well, ' +
   'they belong INSIDE this region, not in a second one)');
const reg = regions[0];
ok(!!reg && reg.role === 'status' && reg.live !== 'assertive',
   'and it is polite (role="status"), never an alert — restoreFocus() moves focus in the same render, and an ' +
   'assertive region would cut off the card the player has just been put on');
ok(!!reg && innerOf(block, reg.at, reg.tag).includes(NARRATION),
   'the narration is INSIDE that region — role="status" is atomic, so the whole line is read; a region sitting ' +
   'next to the prose announces nothing at all');

// A region rebuilt on every render must not exist on renders that have nothing to report, or it announces
// an empty string each time the player opens the Now tab.
let quiet = 'x';
try { quiet = renderBlock(null, ''); } catch { /* the throw is already reported above */ }
ok(quiet === '', 'a turn with nothing to report renders no block at all — no empty region announcing silence');

// ── the order it reaches the reader in ───────────────────────────────────────────────────────────────
const render = bodyOf('private renderCareer(s: import');
ok(render.includes('this.keepFocus('), 'renderCareer came out of source whole (the checks below are not reading an empty string)');
const iContent = render.indexOf('else content = narr');
const contentLine = iContent < 0 ? '' : render.slice(iContent, render.indexOf('\n', iContent));
ok(iContent > 0 && contentLine.indexOf('narr') < contentLine.indexOf('body'),
   'the outcome block is still FIRST in the Now tab\'s content, above the cards — so the card restoreFocus() ' +
   'lands on sits below the region, and a reader who navigates instead of listening walks up into it');

const iKeep = render.indexOf('const restoreFocus = this.keepFocus(');
const iWrite = render.indexOf("$('academy-body').innerHTML =");
const iRestore = render.lastIndexOf('restoreFocus();');
ok(iKeep > 0 && iWrite > 0 && iRestore > 0,
   'all three moments this turns on are still in renderCareer — keepFocus() snapshotting, the innerHTML write ' +
   'that inserts the region, restoreFocus() moving focus');
ok(iKeep < iWrite && iWrite < iRestore,
   'and they run in that order: the region is in the page BEFORE focus moves, so the announcement is queued ' +
   'behind the card rather than raced against a node that does not exist yet');
ok(iWrite > 0 && iRestore > iWrite && !/\bawait\b/.test(render.slice(iWrite, iRestore)),
   'and nothing awaits between the write and the focus move, so both land in one task — the reader speaks the ' +
   'newly focused card and then the outcome, instead of the focus change cancelling an announcement mid-sentence');

console.log(fails ? `\n✗ ${fails} check(s) failed — the game can resolve a career turn and tell a screen-reader player nothing about it`
                  : '\n✓ the narrated outcome is announced politely, after the card focus lands on it');
if (fails) process.exitCode = 1;
