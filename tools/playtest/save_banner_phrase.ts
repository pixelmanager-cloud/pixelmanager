// THE STORAGE-FAILURE BANNER BRACKETS `saveHealth.error`, SO `saveHealth.error` HAS TO BE A CAUSE.
//
// main.ts builds the red "THE GAME IS NOT BEING SAVED" banner as
//   `...Your browser refused to store this save${h.error ? ` (${h.error})` : ''}. Progress since you...`
// — a parenthetical partway through a sentence, sized for the raw exception message `writeSlotInner`
// puts there (`(e as Error)?.message`). Two producers in save.ts do not supply an exception message at
// all, they supply a written-out sentence, and one of them is the ONLY one a player can actually hit:
// the module-load initializer that fires when `typeof indexedDB === 'undefined'` (a stripped webview, a
// hardened wrapper — the fallback save.ts's own comment was written for). That rendered as
//   "...refused to store this save (This browser is not letting the game store saves, so your progress
//    will be lost when you close it.). Progress since you started playing will be lost..."
// — a full stop inside the brackets and the same fact three times, on the one banner whose whole job is
// to be read and believed.
//
// Nothing types this: `error?: string` accepts prose as happily as a cause, and the bad string is only
// produced in an environment no test harness renders a DOM in. So the check reads the phrases at RUNTIME
// (getSaveHealth() at import is literally the no-IndexedDB branch, because Node has no indexedDB) and
// runs them through the REAL banner template, lifted out of main.ts so the two cannot drift apart.
//
// VACUITY GUARDS, because this probe could otherwise measure nothing and stay green:
//   * a sentinel is rendered first — if the template stops interpolating `h.error`, that fails rather
//     than quietly making every later assertion true;
//   * the phrase count is asserted, so the per-phrase loop can never run over an empty list.
// To mutation-test it, put a full sentence back in either literal in client/src/save.ts; three
// assertions must go red.
//
// Run: `npx tsx tools/playtest/save_banner_phrase.ts`
import { readFileSync } from 'node:fs';
import { getSaveHealth, setSaveBackend, createInMemoryBackend } from '../../client/src/save.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== the save-failure banner reads as one sentence, whatever raised it ===');

// ── the real render, lifted from main.ts rather than copied ──
const src = readFileSync('client/src/main.ts', 'utf8');
const at = src.indexOf('THE GAME IS NOT BEING SAVED');
const open = at < 0 ? -1 : src.lastIndexOf('el.innerHTML = ', at);
ok(open >= 0, 'the storage-failure banner is still built by an el.innerHTML template in main.ts');
let render: ((h: { error?: string }) => string) | null = null;
if (open >= 0) {
  const tail = src.slice(open + 'el.innerHTML = '.length);
  const expr = tail.slice(0, tail.indexOf(';\n'));
  try { render = new Function('h', 'return ' + expr) as (h: { error?: string }) => string; }
  catch (e) { ok(false, `the banner template no longer evaluates against a bare {error} — update this probe (${(e as Error).message})`); }
}
ok(!!render && render({ error: 'PROBE-SENTINEL' }).includes('PROBE-SENTINEL'),
   'the banner actually interpolates saveHealth.error (sentinel reached the rendered text)');

// ── every phrase save.ts can hand that template WITHOUT an exception to quote ──
const phrases: { where: string; text: string }[] = [];
const atLoad = getSaveHealth();   // Node has no indexedDB, so this IS the HAS_IDB=false branch
if (!atLoad.ok && atLoad.error) phrases.push({ where: 'module load, no IndexedDB', text: atLoad.error });
setSaveBackend(createInMemoryBackend(), { volatile: true });
const volatileHealth = getSaveHealth();
if (!volatileHealth.ok && volatileHealth.error) phrases.push({ where: 'setSaveBackend({volatile})', text: volatileHealth.error });

console.log(`  ..   ${phrases.length} authored failure phrases observed: ${phrases.map((p) => `${p.text.length} chars`).join(', ')}`);
ok(phrases.length === 2, 'both authored (non-exception) failure phrases were observed — the checks below have something to measure');

for (const p of phrases) {
  const r = render ? render({ error: p.text }) : '';
  // A cause, not prose: the bracket sits mid-sentence, so a terminal stop nests one sentence in another.
  ok(!/[.!?]$/.test(p.text), `[${p.where}] the phrase does not end a sentence: "${p.text}"`);
  ok(!!render && !/[.!?]\)/.test(r), `[${p.where}] the rendered banner closes no sentence inside the brackets`);
  // Length is the blunt guard on the same thing: 98 chars of prose was the shape of the defect, and a
  // cause the player can skim ("no storage available") is a fifth of that.
  ok(p.text.length <= 48, `[${p.where}] the phrase is a cause, not a paragraph (${p.text.length} chars, limit 48)`);
}

console.log(fails ? `\n✗ ${fails} check(s) failed — the banner is nesting a sentence in its parenthetical again`
                  : '\n✓ every authored save-failure phrase reads as a cause inside the banner');
if (fails) process.exitCode = 1;
