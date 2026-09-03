// THE COACH-MARKS WRITTEN FOR THE HARDEST SCREEN MUST BE ABLE TO APPEAR ON IT.
//
// tutorialHint authors seven hints: four for ordinary play and three for the chapter break — the summer
// screen sequence where focus, offer, coach and draft all arrive at once, which is both the most confusing
// moment in the first hour and the only one the player has never seen before.
//
// It retired itself with `if (turn >= 11)`. Chapter 1 is Grassroots, 12 turns, i.e. turns 0-11 — so the
// done-flag was written during the last play turn and the very next render, the turn-12 focus screen, was
// already suppressed. All three break hints were unreachable, on a gen-0-only path, which is to say the
// loss landed on exactly the first-time player they were written for.
//
// `turn >= 12` alone does not fix it: every phase of the break reports turn 12 (tokens.ts stamps the
// career's turn counter onto each one), so the flag would still fire on the focus screen and kill the
// draft and coach hints later in the same sequence. The phase test is the load-bearing half.
//
// Run: `npx tsx tools/playtest/onboarding_reach.ts`
import { readFileSync } from 'node:fs';
import { AGE_BANDS } from '../../shared/src/career.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== The tutorial survives long enough to explain the summer break ===');

// Where chapter 1 actually ends, read from the engine rather than hardcoded — the whole bug was a constant
// that had drifted out of step with this number.
const ch1 = AGE_BANDS[0].turns;
console.log(`  ..   chapter 1 is ${ch1} turns (0..${ch1 - 1}); the first break renders at turn ${ch1}`);
ok(ch1 > 0, 'AGE_BANDS still describes a first chapter (this is not measuring an empty set)');

const fn = src.slice(src.indexOf('tutorialHint'), src.indexOf('tutorialHint') + 4000);
const graduate = (fn.match(/if \(([^)]*)\) localStorage\.setItem\(this\.onbKey\('fm_tut_done'\), '1'\);/) ?? [, ''])[1];
console.log(`  ..   graduation test: \`${graduate}\``);
ok(!!graduate, 'the tutorial still graduates itself somewhere in tutorialHint');

// It must not fire before the break screens have had their turn.
const bound = Number((graduate.match(/turn >= (\d+)/) ?? [, '0'])[1]);
ok(bound >= ch1, `it graduates no earlier than turn ${ch1}, when the break actually renders (found ${bound})`);
ok(/phase === 'play'/.test(graduate), 'and only once ordinary play has resumed, so the break screens are not cut off mid-sequence');

// The three hints it exists to deliver must still be authored and still be keyed to break phases.
for (const phase of ['focus', 'draft', 'coach']) {
  ok(new RegExp(`s\\.phase === '${phase}'\\) hint =`).test(fn), `the '${phase}' hint is still written`);
}

console.log(fails ? `\n✗ ${fails} — the summer break is explained by hints that cannot render` : '\n✓ every authored hint can reach the screen it describes');
if (fails) process.exitCode = 1;
