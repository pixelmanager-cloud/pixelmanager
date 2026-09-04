// A FAILURE THE PLAYER CANNOT SEE IS A BUTTON THAT DOES NOTHING.
//
// The title screen reports its failures by writing into #login-error. That element is
// `<div id="login-error" style="color:var(--home); font-size: 16px; margin-top:8px">` — no role, no
// aria-live — and it is the last child of #mainmenu, below the save list, with nothing that scrolls it
// into view. loadSave already carries the measurement in its own comment: at 800x450 it renders below the
// fold, so a failure written only there is invisible on screen AND silent to a screen reader. That is why
// loadSave's catch also toasts.
//
// startNewGame never got the same treatment: pressing Start ⚽ on a create that rejects wrote
// 'Could not create your club — please try again.' into that same off-screen div and nothing else, so the
// first button in the game appeared to do nothing at all. The path is real — api.register writes the new
// save through IndexedDB, which refuses for the ordinary reasons deleteSave's comment enumerates: a blocked
// upgrade, a corrupt DB, Safari private browsing, the cached failed open.
//
// So this is written as a rule about the class, not about the one handler: every catch that reports a
// failure through #login-error must also route it to #toast, the app's only live region.
//
// Run: `npx tsx tools/playtest/menu_error_visible.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
// Strip comments before reading the code: this codebase's comments quote the broken code they replaced
// verbatim, and a grep-the-source probe that reads them reports a fixed defect as still present
// (destructive_delete.ts and css_hooks.ts both hit that trap).
const decomment = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const raw = readFileSync('client/src/main.ts', 'utf8');
const src = decomment(raw);
const html = readFileSync('client/index.html', 'utf8');

console.log('=== Title-screen failures reach a place the player can perceive ===');

// ── why the rule exists: #login-error cannot announce, #toast can ──
const errTag = (html.match(/<div id="login-error"[^>]*>/) ?? [''])[0];
ok(errTag.length > 0, '#login-error still exists (this is not measuring an empty set)');
ok(!/\brole=|\baria-live=/.test(errTag), '#login-error is still NOT a live region — which is what makes the rule below necessary');
ok(/<div id="toast"[^>]*\brole="status"/.test(html), '#toast is still the live region the rule routes to');
ok(/function toast\(msg: string\) \{[\s\S]{0,120}\$\('toast'\)[\s\S]{0,80}textContent = msg;/.test(raw),
   'toast() still writes into #toast (without this the assertions below mean nothing)');

/** Every `catch { … }` body, brace-matched. These are one-liners today; a nested brace must not truncate. */
function catchBodies(t: string): string[] {
  const out: string[] = [];
  const re = /catch\s*(?:\([^)]*\)\s*)?\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    let depth = 0;
    for (let i = m.index + m[0].length - 1; i < t.length; i++) {
      if (t[i] === '{') depth++;
      else if (t[i] === '}') { depth--; if (depth === 0) { out.push(t.slice(m.index, i + 1)); break; } }
    }
  }
  return out;
}

// A write of '' is the CLEAR, not a report — only a non-empty message counts.
const reporting = catchBodies(src).filter((b) => /\$\('login-error'\)\.textContent\s*=\s*['"`][^'"`]/.test(b));
console.log(`  ..   ${reporting.length} catch block(s) report a failure through #login-error`);
ok(reporting.length >= 2, 'more than one title-screen path reports this way (this is not measuring an empty set)');

for (const b of reporting) {
  const msg = (b.match(/\$\('login-error'\)\.textContent\s*=\s*'([^']*)'/) ?? [, '?'])[1];
  ok(/\btoast\(/.test(b), `"${msg.slice(0, 44)}" is also said where it can be seen and heard`);
}

console.log(fails ? `\n✗ ${fails} — a title-screen failure is reported only below the fold, to no live region` : '\n✓ every title-screen failure also reaches the live region');
if (fails) process.exitCode = 1;
