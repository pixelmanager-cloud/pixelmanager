// A MUTE SWITCH MUST SILENCE WHAT IT SAYS IT SILENCES.
//
// The game has two: "Mute music — Silence the soundtrack" and "Mute sound effects — The reward chimes on
// big moments. No routine click sounds." Those are promises to the player, and the trophy fanfare broke
// both at once: sting() gated on the MUSIC mute and mixed at the MUSIC volume, so muting sound effects left
// the fanfare playing and muting music silenced it. Its sibling chime() has always been on the SFX bus, and
// the two fire together on every celebration — so one obeyed the player and the other did not.
//
// Two more in the same subsystem, which had never been audited under any lens before this:
//   Winning a division below the top tier satisfied BOTH the champions branch and the promotion branch,
//   with no return between them, so the sting and the chime played twice in one synchronous tick.
//   The music context tested `momentKind === 'life'`, which is true for EVERY social scenario — one turn in
//   five — so the crisis pool played over routine turns, and over nothing but routine turns for the first
//   28, where no life event can fire at all.
//
// audio.ts is coupled to HTMLAudioElement and AudioContext with no headless seam, so this guards the rules
// at the SOURCE level. That is cruder than a behavioural test and it is what is actually available.
//
// Run: `npx tsx tools/playtest/audio_buses.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const audio = readFileSync('client/src/audio.ts', 'utf8');
const main = readFileSync('client/src/main.ts', 'utf8');

/** The body of a named method in audio.ts, brace-matched. */
function method(src: string, sig: string): string {
  const i = src.indexOf(sig);
  if (i < 0) return '';
  let depth = 0;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(i, j + 1); }
  }
  return '';
}

console.log('=== The mute switches silence what their labels promise ===');

const sting = method(audio, 'sting(context: MusicContext)');
const chime = method(audio, 'chime(name: keyof typeof CHIMES | string)');
ok(sting.length > 0 && chime.length > 0, 'both one-shot cue paths were found (this is not measuring an empty set)');

// The settings copy is the promise these are measured against. If it changes, this probe should be revisited.
ok(/Mute sound effects/.test(main) && /reward chimes on big moments/i.test(main),
   'the settings still promise that "sound effects" covers the reward cues on big moments');
ok(/Silence the soundtrack/.test(main), 'and that "music" covers the soundtrack');

for (const [name, body] of [['sting', sting], ['chime', chime]] as const) {
  ok(/sfxMuted/.test(body), `${name}() is gated by the sound-effects switch`);
  ok(!/this\.settings\.muted/.test(body), `${name}() is NOT gated by the music switch`);
  ok(/sfxVolume/.test(body), `${name}() is mixed at the sound-effects volume`);
  ok(!/effectiveVolume\(\)/.test(body), `${name}() does not take the music volume`);
}

console.log('\n=== A celebration fires once ===');
// The champions cue and the promotion cue sit in the same function with no return between them.
const champ = main.indexOf("if (t.pos === 1) { audio.sting('triumph')");
const promo = main.indexOf('if (promoted) {', champ);
ok(champ > 0 && promo > champ, 'both celebration branches are still in the rollover, in that order');
const between = main.slice(champ, promo);
ok(!/\breturn\b/.test(between), 'there is still no return between them (which is why the guard is needed)');
const promoBlock = main.slice(promo, promo + 700);
ok(/t\.pos !== 1/.test(promoBlock), 'the promotion cue is guarded against also being the champions cue');

console.log('\n=== The crisis pool plays on a crisis ===');
const play = (main.match(/audio\.play\(s\.callupMoment[^;]*;/) ?? [''])[0];
console.log(`  ..   ${play.replace(/\s+/g, ' ').slice(0, 120)}`);
ok(play.length > 0, 'the career screen still chooses its music context here');
ok(!/momentKind/.test(play), "the choice does not key on momentKind, which is 'life' for every social turn");
ok(/s\.lifeEvent/.test(play), 'it keys on lifeEvent, which is set only on a genuine life event');

console.log(fails ? `\n✗ ${fails} — the audio does not do what the settings screen promises` : '\n✓ every cue is on the bus its label claims, and fires once');
if (fails) process.exitCode = 1;
