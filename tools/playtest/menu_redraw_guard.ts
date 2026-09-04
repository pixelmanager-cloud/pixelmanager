// A LATE MENU REDRAW MUST NOT CLOSE THE NEW GAME PANEL UNDER THE PLAYER'S HANDS.
//
// `recoverOrphanedSaves()` awaits `api.listSaves()` — on a cold launch that is the FIRST IndexedDB open of
// the session, and it is fired-and-forgotten so the title screen can draw immediately. Whatever runs in its
// `.then` therefore lands at an unknown moment, potentially seconds later, on whatever screen the player
// has since navigated to. `renderMainMenu()` is not a passive repaint: it does
// `$('mm-newgame').classList.add('hidden')` and ends by moving focus to a menu button. Run it inside that
// read window and a first-launch player — who had `#mm-new` pre-focused, pressed Enter, and is now typing
// their family name into `#mm-name` — has the panel yanked shut and the caret stolen mid-word. The save
// list stays hidden too, because only the New-Game opener hides `#mm-saves` and only its Back button and
// quitToMenu bring it back.
//
// quitToMenu already knew this and guards its copy of the call. boot()'s copy — the one that runs on the
// one screen where a text field is a single pre-focused Enter away — did not. That asymmetry is the bug
// this probe exists to stop coming back, so it is written as a rule about EVERY async redraw rather than
// about the one line that was missing it.
//
// Run: `npx tsx tools/playtest/menu_redraw_guard.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== A late menu redraw cannot yank the player out of the family-name field ===');

/** Brace-matched body starting at `from`, taking the first `{` at or after it. */
function braceBody(from: number): string {
  if (from < 0) return '';
  let depth = 0;
  for (let i = src.indexOf('{', from); i >= 0 && i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(from, i + 1); }
  }
  return '';
}

// ── the premises. If any of these stop holding, the rule below is decorative and must say so. ──
const render = braceBody(src.indexOf('private renderMainMenu()'));
ok(render.length > 0, 'renderMainMenu() was found (the thing these callbacks run)');
ok(/\$\('mm-newgame'\)\.classList\.add\('hidden'\)/.test(render),
   'renderMainMenu() CLOSES the New Game panel — which is why a stray one is destructive');
ok(/\.focus\(\{ preventScroll: true \}\)/.test(render),
   '...and it MOVES FOCUS to a menu button, so a stray one steals the caret');
const openerAt = src.indexOf("$('mm-new').addEventListener('click'");
const opener = openerAt < 0 ? '' : src.slice(openerAt, src.indexOf("$('mm-cancel')"));
ok(/\$\('mm-name'\) as HTMLInputElement\)\.focus\(\)/.test(opener),
   'the New Game panel focuses the family-name input, so there is a caret to steal');

// ── the rule ──
// Every fire-and-forget `recoverOrphanedSaves().then(...)` that redraws the menu must first check that the
// New Game panel is closed. Sites are found, not listed, so a third copy of this call is covered the day
// it is written.
const sites: Array<{ line: number; body: string }> = [];
for (const m of src.matchAll(/recoverOrphanedSaves\(\)\s*\.then\(/g)) {
  const open = m.index! + m[0].length - 1;
  let depth = 0, end = open;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '(') depth++;
    else if (src[i] === ')') { depth--; if (depth === 0) { end = i; break; } }
  }
  sites.push({ line: src.slice(0, m.index!).split('\n').length, body: src.slice(open, end + 1) });
}
console.log(`  ..   ${sites.length} async recoverOrphanedSaves(...).then(...) site(s): lines ${sites.map((s) => s.line).join(', ')}`);
// NOT AN EMPTY SET. Every assertion below iterates `sites`; with none found they would all pass silently,
// which is precisely the shape of dead check this repo keeps digging out. Two is the standing count (boot
// and quitToMenu) — if the call is renamed or inlined away this fails loudly instead of going quiet.
ok(sites.length >= 2, 'both async redraw sites are still there (this is not measuring an empty set)');

const redrawing = sites.filter((s) => /renderMainMenu\(\)/.test(s.body));
console.log(`  ..   ${redrawing.length} of them redraw the menu from inside the read window`);
ok(redrawing.length >= 2, '...and both of them redraw (the ones the rule is about)');

for (const s of redrawing) {
  // The guard has to be the real one: `if (panel is hidden) redraw`. An inverted or absent test is the bug.
  const guarded = /if \(\$\('mm-newgame'\)\.classList\.contains\('hidden'\)\) this\.renderMainMenu\(\)/.test(s.body);
  ok(guarded, `main.ts:${s.line} — the late redraw is skipped while the New Game panel is up`);
}

console.log(fails
  ? `\n✗ ${fails} — a late menu redraw can close the New Game panel a player is typing into`
  : '\n✓ every late menu redraw stands down while the family-name panel is open');
if (fails) process.exitCode = 1;
