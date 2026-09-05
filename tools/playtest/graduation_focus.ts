// THE GRADUATION SCREEN MUST HAND KEYBOARD FOCUS ON RATHER THAN DROP IT.
//
// doCareerAct's `r.graduated` branch is the one career render that is NOT renderCareer. It replaces the
// whole of #academy-body with the graduation panel and returns, so renderCareer's keepFocus() snapshot and
// its restore — the pair written for exactly this failure on the per-turn path — never run on it. The
// player pressed Enter on a card, that card was destroyed with the panel, and document.activeElement went
// back to <body>: four Tab presses (app title, ← logout, ← back) from the one "Reveal the pro →" button
// this screen offers. #toast is the game's only ARIA live region and nothing in the branch fires one, so a
// screen reader was told nothing about the screen swap either. Once per generation, on the career's
// climax. The succession chain already carries the fix at #cg-will-note and #cg-heir-title; this render,
// arriving by a different path, never got it.
//
// Source-level for the reason succession_focus.ts is one: this handler lives in a DOM-coupled monolith
// with no headless seam, and the alternative is driving a career from age 10 to graduation at 25 in a real
// browser for every assertion.
//
// It holds the four things the fix depends on, each of which a careless edit could remove without
// breaking anything visible:
//   1. focus moves AFTER the write, not before it (before it would target a node about to be destroyed);
//   2. the target carries tabindex="-1" — .focus() on a plain <div> is a silent no-op;
//   3. the id the code focuses is the id the markup emits, not a near-miss;
//   4. preventScroll, the rule #ft-continue, #pause-ov and both succession panels already learned — this
//      panel carries the whole epilogue and a bare focus() would scroll it off the top.
// The landing target is the TITLE and not #cg-reveal on purpose: client/index.html delays that button's
// `ftpop` by 1.05s with `both`, so at write time it is still in its from-state and a ring would sit on
// something not yet drawn. `.cg-grad-title` has no delay.
//
// MUTATION TEST, because a focus assertion is easy to write so that it can never fail: delete the
// `.focus({ preventScroll: true })` line and check 3 goes red; strip `tabindex="-1"` from the title and
// check 4 goes red; rename the id on one side only and check 4 goes red; move the focus call above the
// innerHTML write and check 5 goes red; drop `preventScroll` and check 3 goes red. All five were applied
// to the fixed source and all five went red. Checks 1 and 2 exist so that a marker which stops matching
// FAILS here rather than quietly measuring an empty string — the way four dead `transition: width` rules
// survived in this codebase.
//
// NOT COVERED HERE. Three other writes in main.ts replace #academy-body with a `.cg-graduation` panel from
// a click and hand focus to nobody either — renderHandoff (the take-the-reins offer), retireStar (the
// send-off, whose OUTGOING transitions succession_focus.ts guards but whose incoming write it does not)
// and renderReplayIssue. They are not one-liners like this one: renderHandoff in particular is re-entered
// from the Settings overlay (the hide-card-stats switch re-renders the career behind it), where focus
// legitimately lives outside the panel and must be left alone — the containment guard keepFocus()
// documents. Fixing them needs that guard, not a copy of the line below.
//
// Run: `npx tsx tools/playtest/graduation_focus.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== The graduation screen hands focus into the panel it replaces ===');

/** The source between two markers. '' when either is missing or out of order — which must FAIL rather
 *  than skip: an assertion run over nothing is worse than no assertion, because it reports green. */
function between(from: string, to: string): string {
  const a = src.indexOf(from);
  if (a < 0) return '';
  const b = src.indexOf(to, a + from.length);
  return b < 0 ? '' : src.slice(a, b);
}

const WRITE = "$('academy-body').innerHTML";
const block = between('if (r.graduated && r.player) {', '} else if (r.state) {');
ok(block.length > 0, "found doCareerAct's graduated branch (the career render that is not renderCareer)");

const writeAt = block.indexOf(WRITE);
ok(writeAt >= 0, `...it still replaces the whole panel with ${WRITE} (the write this is about)`);

if (block && writeAt >= 0) {
  const m = block.match(/\$\('([\w-]+)'\)\.focus\(\{ preventScroll: true \}\)/);
  ok(!!m, '...focus is moved into the new content (preventScroll — this panel holds the epilogue)');
  if (m) {
    const id = m[1];
    console.log(`  ..   focus lands on #${id}`);
    // A <div> is not focusable. Without tabindex="-1" the focus() above is a silent no-op and every other
    // check here would pass over a screen that still dumps the player on <body>.
    ok(new RegExp(`id="${id}"[^>]*tabindex="-1"|tabindex="-1"[^>]*id="${id}"`).test(block),
       `...#${id} is emitted in this panel with tabindex="-1", so focusing it is not a silent no-op`);
    ok(block.indexOf(m[0]) > writeAt, '...and the focus runs AFTER the write, on a node that survived it');
  }
}

// The branch takes itself INSTEAD of renderCareer, which is the whole reason keepFocus never covers it.
// If that ever stops being true the probe above is guarding a path nobody walks, and this says so.
ok(!/this\.renderCareer\(/.test(block) && /const restoreFocus = this\.keepFocus\(\$\('academy-body'\)\)/.test(src),
   'the branch still bypasses renderCareer, whose keepFocus() is the only other hand-off on this screen');

console.log(fails ? `\n✗ ${fails} — graduation drops the player on <body> and says nothing`
                  : '\n✓ graduation hands focus on to the panel it just wrote');
if (fails) process.exitCode = 1;
