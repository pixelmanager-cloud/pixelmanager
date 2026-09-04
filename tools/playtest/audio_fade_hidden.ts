// A CROSSFADE MUST FINISH EVEN WHEN NOBODY IS LOOKING AT THE WINDOW.
//
// crossfadeTo() promises that "rapid screen changes can never leave two tracks overlapping (only `next`
// survives the fade; all others are paused + dropped)". The pause-and-trim that keeps that promise lives
// only in the fade's own t===1 branch — and the fade was stepped by requestAnimationFrame, which does not
// fire AT ALL in a hidden window. main.ts already knows this and moves the match clock onto a timer when
// the tab goes away (PT-1409); the fade had no equivalent. HTMLAudioElement keeps playing while hidden —
// that is exactly why a match can be left to run in the background — so hiding the window inside the 800ms
// fade froze the ramp where it stood and left BOTH the outgoing loop and the incoming one playing,
// unpaused and still in `tracked`, until the player came back. Tab away just after kick-off and hub-1.ogg
// ran over the match track for the whole nine-minute fixture.
//
// The canceller has to move with the scheduler. cancelAnimationFrame on a timeout id is a silent no-op,
// and a superseded fade that keeps stepping fires the NEW fade's cleanup, nulls the NEW fade's handle and
// overwrites `tracked` with its own dead deck — re-creating the exact overlap the "SETTLE THE FADE ALREADY
// IN FLIGHT" block in crossfadeTo() records fixing. That pairing is guarded at source level below, because
// its damage is ordering-dependent and does not reproduce reliably in a scripted run.
//
// The behavioural half drives the real AudioManager headlessly: a fake clock, fake HTMLAudioElements, a
// requestAnimationFrame that goes dead on cue (a hidden window) and timers that keep firing.
//
// MUTATION-TESTED, because "at most one track is playing" is trivially true of zero tracks. Make the fake
// element's play() leave `paused` true and the last assertion passes on 0 of 0 — the overlap guard above
// it goes red on both trees, which is the whole reason it is there.
//
// Run: `npx tsx tools/playtest/audio_fade_hidden.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/audio.ts', 'utf8');
// These assertions are about CODE, not prose: a comment in audio.ts has to stay free to NAME the API it is
// warning the next reader about. Strip /* … */ blocks and whole-line // comments before matching.
const code = src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');

console.log('=== The fade is scheduled on a clock that still runs in a hidden window ===');

// If the fade ever stops existing, every assertion below is measuring nothing.
ok(/private fadeTimer/.test(code) && /FADE_MS/.test(code), 'audio.ts still has a timed fade to measure');
ok(!/requestAnimationFrame/.test(code),
   'no fade in audio.ts is scheduled with requestAnimationFrame (it does not fire at all in a hidden window)');
ok(/clearTimeout\(this\.fadeTimer\)/.test(code),
   'the superseding branch cancels the in-flight fade with clearTimeout — the canceller matches the scheduler');
ok(!/cancelAnimationFrame/.test(code),
   'no cancelAnimationFrame is left in the code (it would silently fail to cancel a timeout, and the dead fade would keep stepping)');

console.log('\n=== Hiding the window mid-crossfade does not leave two soundtracks layered ===');

// ── a headless browser, only as much of one as audio.ts touches ───────────────
const realSetTimeout = globalThis.setTimeout;
let clock = 1000;
(globalThis as any).performance = { now: () => clock };
const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, String(v)); } };
const made: any[] = [];
class FakeAudio {
  src: string; volume = 1; loop = false; preload = ''; currentTime = 0; paused = true;
  constructor(src: string) { this.src = src; made.push(this); }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  addEventListener() { /* audio.ts only uses this for one-shot stings */ }
}
(globalThis as any).Audio = FakeAudio;
let hidden = false, rafSeq = 1;
const rafQ = new Map<number, () => void>();
(globalThis as any).requestAnimationFrame = (cb: () => void) => { const id = rafSeq++; rafQ.set(id, cb); return id; };
(globalThis as any).cancelAnimationFrame = (id: number) => { rafQ.delete(id); };

// Imported AFTER the globals exist and BEFORE the fake timer queue replaces the real one, so nothing in
// the module graph is accidentally scheduled onto a queue only this file drains.
// Top-level await is not supported by the CJS transform run-playtest uses, so the async half lives in a
// function — the same shape choice_cost.ts and arc_tag_lean.ts use.
async function main() {
  const { audio } = await import('../../client/src/audio.js') as any;

  let toSeq = 1;
  const toQ = new Map<number, { cb: () => void; at: number }>();
  (globalThis as any).setTimeout = (cb: () => void, ms: number) => { const id = toSeq++; toQ.set(id, { cb, at: clock + (ms || 0) }); return id; };
  (globalThis as any).clearTimeout = (id: number) => { toQ.delete(id); };

  /** Run whatever is due: frames only while the window is shown, timers always (throttled, but alive). */
  function pump(rounds: number): void {
    for (let i = 0; i < rounds; i++) {
      const frames = hidden ? [] : [...rafQ.values()];
      if (!hidden) rafQ.clear();
      const due = [...toQ.entries()].filter(([, t]) => t.at <= clock);
      for (const [id] of due) toQ.delete(id);
      if (!frames.length && !due.length) return;
      for (const cb of frames) cb();
      for (const [, t] of due) t.cb();
    }
  }
  const settle = () => new Promise<void>((r) => realSetTimeout(r, 0));   // let next.play() resolve
  const live = () => made.filter((a) => !a.paused);
  const shape = () => made.map((a) => `${a.src.split('/').pop()} ${a.paused ? 'paused' : 'PLAYING'} @${a.volume.toFixed(3)}`).join(', ');

  audio.unlock();
  audio.play('hub');
  await settle();
  clock += 2000;                 // well past FADE_MS
  pump(400);
  ok(live().length === 1 && live()[0].volume > 0, `the hub loop faded in and is the only thing playing (${shape()})`);

  // The player presses kick-off, then tabs away inside the 800ms fade.
  audio.play('match');
  await settle();
  ok(made.length === 2 && live().length === 2,
     `two live elements overlap the instant the crossfade starts, so there is something to clean up (${shape()})`);
  hidden = true;
  clock += 5000;
  pump(400);
  console.log(`  ..   five seconds after the window went hidden mid-fade: ${shape()}`);
  ok(live().length <= 1, `only one track survives the fade (${live().length} playing, promise is 1)`);

  console.log(fails ? `\n✗ ${fails} — a backgrounded window can be left playing two soundtracks at once` : '\n✓ the crossfade completes and trims whether or not the window is visible');
  if (fails) process.exitCode = 1;
}
void main();
