// A PROMPT MUST NOT OPEN BY GETTING HIS AGE WRONG.
//
// `ageFraming(turn, salt, age?, chapter?)` returns on its first line: if a chapter frame exists it uses it
// and NEVER LOOKS AT `age`. The file's own comment confirms FRAME_BY_CHAPTER "covers all seven chapters the
// game has, so the guard on the line below always returns" — so the age-banded fallback beneath it is dead,
// and the `age` argument is inert at every call site.
//
// That would be harmless if the chapter frames were age-neutral. Sixty-five of them are not: they open by
// declaring a specific age — "Nineteen, and the youngest man in the room by five years,", "Twenty-five, and
// the third-longest-serving player at the club,". The chapter bands are two and three years wide, so the
// declared age is right about a third of the time. The HUD header on the same screen shows the real one.
//
// The fix filters the chapter's pool to frames that state no age, or state THIS age, before picking. It
// keeps every line and adds none: at any given age roughly a third of the age-stating frames survive
// alongside all ~300 neutral ones, so the pool barely narrows.
//
// Run: `npx tsx tools/playtest/age_framing_truth.ts`
import { scenarioStory } from '../../shared/src/narrate.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== A prompt that states an age states the right one ===');

const WORD: Record<string, number> = {
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, 'twenty-one': 21, 'twenty-two': 22, 'twenty-three': 23,
  'twenty-four': 24, 'twenty-five': 25, 'twenty-six': 26, 'twenty-seven': 27, 'twenty-eight': 28,
  'twenty-nine': 29, thirty: 30, 'thirty-one': 31, 'thirty-two': 32, 'thirty-three': 33, 'thirty-four': 34,
};
// The chapter -> plausible age range the game actually runs each chapter over.
const CHAPTERS: Array<[string, number, number]> = [
  ['Grassroots', 10, 12], ['Academy', 13, 14], ['Scholar', 15, 16], ['Youth Team', 17, 18],
  ['Breakthrough', 19, 20], ['First Team', 21, 22], ['Establishing', 23, 25],
];

let stated = 0, wrong = 0, total = 0;
const samples: string[] = [];
for (const [chapter, lo, hi] of CHAPTERS) {
  for (let age = lo; age <= hi; age++) {
    for (let seed = 0; seed < 260; seed++) {
      const out = scenarioStory('match', 'teamwork', null, {
        seed, careerSeed: seed * 13 + 5, turn: seed % 120, age, chapter, castAvoid: 'Vance',
      });
      total++;
      // Only the OPENER declares an age; a number later in the sentence is about something else.
      const m = /^([A-Za-z-]+)\s*,/.exec(out.trim());
      const said = m ? WORD[m[1].toLowerCase()] : undefined;
      if (said == null) continue;
      stated++;
      if (said !== age) { wrong++; if (samples.length < 5) samples.push(`${chapter} age ${age} -> "${out.trim().slice(0, 72)}"`); }
    }
  }
}
console.log(`  ..   ${total} prompt(s); ${stated} open by declaring an age; ${wrong} of those declare the wrong one`);
// VACUITY GUARDS. If no prompt ever states an age — a corpus change, or a broken opener regex — then
// "none of them is wrong" is true and meaningless. Assert the population before asserting the property.
ok(total > 4000, `the sweep actually ran (${total} prompts)`);
// The floor is 20, and it was 110 before the fix — that drop is the fix working, not the probe being
// relaxed to pass. Filtering the pool removes the wrong-age frames from every draw, so pickByTurn lands
// on a neutral frame more often and age-stating openers go from 110 of 4,160 prompts to 44. What the
// guard is for is the other failure: if this ever reads 0, the age-stating frames have stopped being
// reachable altogether and the assertion below would be true by vacancy rather than by correctness.
ok(stated > 20, `age-stating frames are still reachable and still being drawn (${stated}) — a 0 here means this probe stopped measuring, not that the bug was fixed`);
for (const s of samples) console.log(`       ${s}`);
ok(wrong === 0, `no prompt opens by declaring an age the player is not (${wrong} of ${stated})`);

console.log(fails === 0 ? '\n✓ the prompt knows how old he is' : `\n✗ ${fails} problem(s)`);
process.exit(fails === 0 ? 0 : 1);
