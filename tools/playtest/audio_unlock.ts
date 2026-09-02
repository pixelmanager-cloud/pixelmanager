// AUDIO MUST UNLOCK FOR A PLAYER WHO NEVER TOUCHES A POINTER.
//
// Browsers block autoplay until a user gesture, so the game gates all sound behind an `unlocked` flag set
// by the first interaction. That listener was bound to `pointerdown` ONLY. This game is playable from the
// keyboard — 1/2/3 set match speed, Escape closes overlays — so a keyboard or controller player never fired
// it: `unlocked` stayed false, every audio.play() returned at its first line, and they got no music and no
// chimes for the whole session. No error, no warning, just silence.
//
// Run: `npx tsx tools/playtest/audio_unlock.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const main = readFileSync('client/src/main.ts', 'utf8');
const audio = readFileSync('client/src/audio.ts', 'utf8');

console.log('=== Sound reaches a player who only uses a keyboard ===');

// The gate exists — if it ever stops existing this probe is measuring nothing.
ok(/if \(!this\.unlocked\)/.test(audio), 'audio.play() is still gated behind an unlocked flag (the thing this guards)');

const block = main.slice(Math.max(0, main.indexOf('audio.unlock()') - 900), main.indexOf('audio.unlock()') + 500);
for (const ev of ['pointerdown', 'keydown']) {
  ok(new RegExp(`addEventListener\\(\\s*(?:ev|['"\`]${ev})`).test(block) && block.includes(ev),
     `the unlock listener covers '${ev}'`);
}
// And it must detach every listener it attached, or the handler leaks on each of them.
const attaches = (block.match(/addEventListener/g) ?? []).length;
const removes = (block.match(/removeEventListener/g) ?? []).length;
ok(removes >= 1 && attaches >= 1, `unlock attaches (${attaches}) and detaches (${removes}) its listeners`);

console.log(fails ? `\n✗ ${fails} problem(s) — some players get no sound at all` : '\n✓ any first interaction unlocks audio');
if (fails) process.exitCode = 1;
