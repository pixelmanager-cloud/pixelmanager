// WHICH CALL-UP BANK A REAL CAREER CAN ACTUALLY REACH.
//
// `callUpBlurb` (shared/src/intl.ts) branches three ways — CALLUP_DEBUT when `capNo === 1`, CALLUP_SCORED
// when `scored > 0`, CALLUP_QUIET otherwise — and `authored_reach.ts` already proves the corpus exists and
// has a production caller. But that probe varies `capNo` and `scored` ITSELF, so it stays green whatever
// the caller passes. It did: `careerHonours` hard-coded `scored: 0`, so 93 of the ~305 authored lines
// could not be produced by any career in any dynasty, and every capped man in every bloodline was
// described as having had a quiet night for his country.
//
// So this walks the production path instead — drive careers to graduation, read the frozen
// `career_honours_json` that `graduatedFields` writes onto the token — and asks which bank each sentence
// came from. The banks are enumerated through their only public door, `callUpBlurb` itself, and the three
// are disjoint; the probe never reads `scored`, only the sentence, so it cannot be satisfied by a caller
// that passes the right argument to the wrong place.
//
// BOTH directions matter. Asserting only that SCORED is reached would pass for a caller that hard-codes
// `scored: 1`, and a caller that keyed `capNo` on `caps > 0 ? 1 : caps` would strand the other 176 lines
// instead. QUIET has to keep reaching a player too.
//
// CALLUP_DEBUT is deliberately NOT asserted. `capNo` here is a career TOTAL frozen at graduation, and the
// one turn where it could arithmetically be 1 (turn 66 at rate 0.12) can never graduate — the mid-career
// handoff needs `prevRole.apps >= 11` and `squadRole(3, ov)` tops out at 8 apps. Making a debut line
// reachable means changing what `capLine` means, which is a design decision, not a fix. (W8-8)
//
// Run: `npx tsx tools/playtest/callup_bank_reach.ts`
import { Career, rollGenes } from '../../shared/src/career.js';
import { graduatedFields } from '../../shared/src/tokens.js';
import { callUpBlurb } from '../../shared/src/intl.js';
import type { Token } from '../../shared/src/token.js';
import type { Track } from '../../shared/src/types.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

/** Enumerate a bank by the only door it has: `callUpBlurb` picks `h % list.length`, so sweeping the seed
 *  walks the whole list. `capNo` is kept off 1 for the two non-debut banks so the branch under it is the
 *  one being enumerated. */
function bank(capNoOf: (s: number) => number, scored: number): Set<string> {
  const out = new Set<string>();
  for (let s = 1; s <= 20000; s++) out.add(callUpBlurb(s, capNoOf(s), 'Trentino', scored));
  return out;
}
const DEBUT = bank(() => 1, 0);
const SCORED = bank((s) => 2 + (s % 40), 1);
const QUIET = bank((s) => 2 + (s % 40), 0);

/** Drive a career to the end, answering every phase — the same shape golden_replay.ts uses. */
function drive(seed: number, track: Track) {
  const c = new Career(seed, track);
  let step = 0;
  while (!c.finished && step < 600) {
    const st = c.current() as any;
    const pick = (xs: any[]): any => xs[step % xs.length];
    try {
      if (st.phase === 'arc') c.resolveArc(pick(st.arc.choices).id);
      else if (st.phase === 'focus') c.chooseFocus(pick(st.focus).id);
      else if (st.phase === 'offer') c.resolveOffer(pick(['develop', 'money', 'brand']) as string);
      else if (st.phase === 'coach') c.appointCoach(pick(st.coaches).id);
      else if (st.phase === 'draft') c.draft(pick(st.options).id);
      else if (st.phase === 'lifestyle') c.buyLifestyle(pick(st.items).id);
      else { if (!c.hand.length) break; c.play(c.hand[step % c.hand.length].id); }
    } catch { break; }
    step++;
  }
  return c;
}

const SURNAMES = ['Ashcombe', 'Baldini', 'Corrigan', 'Delacroix', 'Egerton', 'Fenwick', 'Grieve', 'Halvorsen'];
/** The record the game really writes at graduation, for a token whose id and surname vary per career —
 *  `capLine`'s own seed is `${t.id}:capline`, so a fixed id would sample one draw over and over. */
function honoursOf(seed: number, track: Track): { caps: number; capLine?: string } {
  const c = drive(seed, track);
  const token = {
    id: `cb-${seed}-${track}`, name: `Rafa ${SURNAMES[seed % SURNAMES.length]}`, state: 'prospect',
    career_seed: seed, track, agent_id: null,
    genes_json: JSON.stringify(rollGenes(seed)), dev_bonus_json: '{}',
    career_actions: JSON.stringify(c.actions), career_action_count: c.actions.length,
  } as unknown as Token;
  const grad = graduatedFields(token, c) as Record<string, unknown>;
  return JSON.parse(String(grad.career_honours_json ?? '{}'));
}

console.log('=== The call-up banks a graduated career can reach ===');
console.log(`  ..   banks enumerated: DEBUT ${DEBUT.size}, SCORED ${SCORED.size}, QUIET ${QUIET.size} line(s)`);
ok(DEBUT.size > 0 && SCORED.size > 0 && QUIET.size > 0, 'all three banks enumerate (otherwise the classifier below is meaningless)');
const overlap = [...SCORED].filter((s) => QUIET.has(s) || DEBUT.has(s)).length + [...DEBUT].filter((s) => QUIET.has(s)).length;
ok(overlap === 0, `the three banks share no line (${overlap} shared) — a sentence names exactly one branch`);

const TRACKS: Track[] = ['outfield', 'goalkeeper'];
let capped = 0, unclassified = 0;
const seen = { debut: new Set<string>(), scored: new Set<string>(), quiet: new Set<string>() };
for (const track of TRACKS) {
  for (let seed = 1; seed <= 24; seed++) {
    const h = honoursOf(seed, track);
    if (!h.caps || !h.capLine) continue;
    capped++;
    if (SCORED.has(h.capLine)) seen.scored.add(h.capLine);
    else if (QUIET.has(h.capLine)) seen.quiet.add(h.capLine);
    else if (DEBUT.has(h.capLine)) seen.debut.add(h.capLine);
    else unclassified++;
  }
}
console.log(`  ..   ${capped} of ${TRACKS.length * 24} driven careers graduated capped`);
console.log(`  ..   banks reached: SCORED ${seen.scored.size} distinct line(s), QUIET ${seen.quiet.size}, DEBUT ${seen.debut.size}`);

// VACUITY GUARD. Every assertion below counts capped careers; with none, "no career reached the wrong
// bank" is trivially true. Mutation-test this probe by forcing the cap rate to 0 in careerHonours — this
// line must go red before any of the reach checks do.
ok(capped >= 8, `enough capped careers to measure (${capped}) — with none, every check below is vacuous`);
ok(unclassified === 0, `every frozen call-up line belongs to a known bank (${unclassified} unclassified)`);
ok(seen.scored.size > 0, 'a graduated career can reach CALLUP_SCORED — the "he scored for his country" bank is not dead prose');
ok(seen.quiet.size > 0, 'a graduated career can still reach CALLUP_QUIET — the fix did not swap one dead bank for another');

console.log(fails ? `\n✗ ${fails} — the call-up corpus is not reachable the way it reads` : '\n✓ a real career reaches more than one call-up bank');
if (fails) process.exitCode = 1;
