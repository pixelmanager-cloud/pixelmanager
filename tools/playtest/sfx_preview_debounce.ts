// A "PREVIEW ONCE ON RELEASE" CHIME MUST NOT FIRE ONCE PER ARROW KEY.
//
// The SFX volume slider in Settings previewed itself off the range input's `change` event, with the
// comment "preview once on release". That is true of a POINTER only. On `<input type="range">` Chromium
// fires `input` AND `change` on every arrow-key step; it defers `change` to mouseup for drags alone. So a
// keyboard-only or screen-reader player — adjusting sound effects the one way open to them — got a full
// 0.23s two-note chime per keypress, and holding the arrow through key-repeat piled half a dozen
// overlapping oscillator pairs on top of each other, on the very control they had opened to make the game
// quieter. The mouse user the comment was written for got exactly one. Nothing downstream saved it:
// audio.chime() schedules its notes at ctx.currentTime with no rate limit of its own, so repeated calls
// SUM rather than replace — the behavioural half below measures that, because it is the premise the whole
// rule rests on. If chime() ever grows its own throttle, that assertion goes red and this file should be
// re-read rather than trusted.
//
// THE RULE. The SFX preview must be scheduled on a timer, must cancel the previously pending one before
// scheduling a new one (a debounce that never clears is the same burst 250ms late), and the handle it
// writes must be cleared in the Settings dialog's dialogify onClose — otherwise arrow-then-Escape sounds a
// chime into a dismissed dialog, which is a new wrong behaviour replacing the old one. dialogify's
// onClose is the single funnel for ✕, backdrop click and Escape alike, so clearing it there covers all
// three. The check resolves the HANDLE, not just the presence of a clearTimeout: the variable the change
// listener assigns has to be the one close() cancels, or the cancel is cancelling something else.
//
// Source-level for the wiring, for the reason modal_pause_handoff.ts gives about the same method: these
// handlers live in a DOM-coupled monolith with no headless seam, and `change`-on-arrow-key is a browser
// behaviour Node cannot reproduce anyway.
//
// MUTATION-TESTED, all four red: drop the `clearTimeout` from the change listener (the burst survives,
// merely delayed); drop the `setTimeout` and chime synchronously again (the shipped defect); drop the
// clearTimeout from the dialogify onClose (chime into a closed dialog); rename the timer variable in one
// of the two places (the handle check catches a cancel aimed at nothing).
//
// Run: `npx tsx tools/playtest/sfx_preview_debounce.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== The SFX volume preview chimes once, whatever moved the slider ===');

/** The body of openSettings, from its declaration to the closing brace at class-member indent. */
const decl = /\n  (?:private |public |protected )?openSettings\s*\(/.exec(src);
const end = decl ? src.indexOf('\n  }\n', decl.index) : -1;
const body = decl ? src.slice(decl.index, end < 0 ? src.length : end) : '';

/** A whole `foo(...)` call from `at`, paren-matched and quote-aware, so a multi-line handler is captured. */
const callFrom = (s: string, at: number): string => {
  const open = s.indexOf('(', at);
  if (open < 0) return '';
  let depth = 0, q = '';
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q && s[i - 1] !== '\\') q = ''; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '(') depth++;
    else if (c === ')' && --depth === 0) return s.slice(at, i + 1);
  }
  return s.slice(at);
};

// VACUITY GUARDS. Every assertion below is about a preview on a slider. If either stops existing this
// probe is measuring nothing, so it must go red and be re-read rather than quietly pass.
ok(!!body && body.includes('id="set-sfx"'),
   'Settings still renders the SFX volume range slider (otherwise there is nothing to preview)');
const chIdx = body.indexOf(`sfx.addEventListener('change'`);
const handler = chIdx < 0 ? '' : callFrom(body, chIdx);
ok(!!handler && /audio\.chime\(/.test(handler),
   'the SFX slider still previews itself with a chime on `change` (the behaviour under test)');
console.log(`  ..   the change listener is ${handler.split('\n').length} line(s), ${handler.length} chars`);

// THE DEFECT ITSELF: the chime fired synchronously in the listener, so one keypress = one chime.
const toIdx = handler.indexOf('setTimeout(');
const chimeIdx = handler.indexOf('audio.chime(');
ok(toIdx >= 0 && chimeIdx > toIdx,
   'the preview chime is deferred behind a timer, not sounded synchronously from every `change` event');

// A DEBOUNCE THAT NEVER CANCELS IS NOT A DEBOUNCE. Without this, ten arrow keys still make ten chimes —
// they just all arrive 250ms later, which is the identical burst with a delay bolted on.
const clrIdx = handler.indexOf('clearTimeout(');
ok(clrIdx >= 0 && toIdx >= 0 && clrIdx < toIdx,
   'the pending preview is cancelled BEFORE a new one is scheduled, so a keypress burst collapses to one chime');

// The handle, not just a clearTimeout somewhere: `previewT = setTimeout(...)` names the timer close() owes
// a cancel to.
const handle = /(\w+)\s*=\s*setTimeout\(/.exec(handler)?.[1] ?? '';
ok(!!handle, 'the scheduled preview is kept in a named handle (nothing can be cancelled without one)');

// AND IT MUST DIE WITH THE DIALOG. Arrow the slider, hit Escape: a bare timer chimes into a Settings
// screen that no longer exists.
const dlgIdx = body.indexOf('this.dialogify(ov');
const dialogify = dlgIdx < 0 ? '' : callFrom(body, dlgIdx);
ok(!!dialogify && /this\.running = wasRunning;/.test(dialogify),
   'Settings still closes through dialogify with an onClose (the one funnel for ✕, backdrop and Escape)');
ok(!!handle && dialogify.includes(`clearTimeout(${handle})`),
   `the dialog's onClose cancels the same handle the change listener writes (clearTimeout(${handle || '?'}))`);

// ── THE PREMISE, MEASURED: chime() has no rate limit, so a burst really does stack ──────────────────
// Driven headlessly against the real client/src/audio.ts, with only as much browser as chime() touches.
// Top-level await is not supported by the CJS transform run-playtest uses, so this lives in a function —
// the same shape audio_fade_hidden.ts uses.
async function main() {
  console.log('\n=== Repeated chime() calls overlap rather than replace (why the burst is harsh) ===');
  const store = new Map<string, string>();
  (globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, String(v)); } };
  const notes: { start: number; stop: number }[] = [];
  const ramp = () => ({ setValueAtTime() { }, linearRampToValueAtTime() { }, exponentialRampToValueAtTime() { } });
  class FakeCtx {
    state = 'running'; currentTime = 5; destination = {};
    resume() { return Promise.resolve(); }
    createOscillator() { const n = { start: 0, stop: 0 }; notes.push(n as any); return { type: '', frequency: { value: 0 }, connect() { }, start: (t: number) => { (n as any).start = t; }, stop: (t: number) => { (n as any).stop = t; } }; }
    createGain() { return { gain: ramp(), connect() { } }; }
  }
  (globalThis as any).window = { AudioContext: FakeCtx };
  const { audio } = await import('../../client/src/audio.js') as any;
  audio.unlock();
  audio.setSfxMuted(false);

  const PRESSES = 6;                       // ~0.2s of key-repeat, inside one 'confirm' chime's length
  for (let i = 0; i < PRESSES; i++) audio.chime('confirm');
  const live = notes.filter((n) => n.stop > n.start);
  const last = live.length ? Math.max(...live.map((n) => n.start)) : 0;
  const first = live.length ? Math.min(...live.map((n) => n.start)) : 0;
  const tail = live.length ? Math.max(...live.map((n) => n.stop)) - first : 0;
  console.log(`  ..   ${PRESSES} chime() calls scheduled ${live.length} oscillators across ${(last - first).toFixed(3)}s, each ringing until ${tail.toFixed(3)}s`);
  ok(live.length >= PRESSES * 2 && last - first < tail,
     `chime() has no throttle of its own — ${live.length} oscillators from ${PRESSES} calls all overlap, so the calls sum`);

  console.log(fails ? `\n✗ ${fails} — the SFX preview can machine-gun chimes, or outlive the dialog that scheduled it` : '\n✓ the SFX preview fires once when the value settles, and dies with the dialog');
  if (fails) process.exitCode = 1;
}
void main();
