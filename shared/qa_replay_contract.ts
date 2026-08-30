// ── THE REPLAY CONTRACT ──────────────────────────────────────────────────────────────────────────────
//
// A career is stored as (career_seed, career_actions[]) and rebuilt by replaying it. When a replay can no
// longer apply every stored action, `loadCareer` stops early. That used to be COMPLETELY SILENT, and the
// consequence was not a shorter career — it was a dead bloodline:
//
//   `careerAct` appends each new action to the STORED list, which still holds all 120, while the replay
//   keeps stopping at (say) 10. So play moves the counter by one, vanishes on the next load, `finished` is
//   never reached, `graduatedFields` never runs, the prospect never becomes a pro, and the dynasty can
//   never advance another generation. Measured on 20 recorded careers, one turn of schedule drift lost
//   108-115 of 120 turns in every one of them.
//
// Every OTHER determinism test in this repo records an action list and replays it inside the same build,
// in the same process (qa_career_fuzz, qa_dynasty_fuzz, qa_strategy_fuzz, qa_new_content_fuzz,
// qa_savestore). None of them can fail on this, because the thing that breaks is a change BETWEEN builds.
// This one asserts the contract itself: a clean replay is exact, a broken replay is DETECTED, and a
// detected break refuses to write rather than quietly destroying the record.
import { Career } from './src/career.js';
import { loadCareer } from './src/tokens.js';
import type { Token } from './src/token.js';
import type { CareerAction } from './src/tokens.js';

let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

/** Drive a career to the end and return the token it would have been stored as.
 *
 *  IT MUST ANSWER EVERY PHASE, not just plays and drafts. The first version handled `pendingDraft` and
 *  `play` only, so every seed died at turn 1-4 on `resolve the story beat first`, was swallowed by the
 *  `catch { break }`, and recorded 1-4 actions where a real career is ~198. The contract was therefore
 *  being asserted over 1.1% of a career, and five of the seven action types — `arc`, `focus`, `offer`,
 *  `coach`, `lifestyle` — were never emitted and never replayed.
 *
 *  The phase set is `simCareer`'s (shared/src/career.ts); this mirrors its structure deliberately so the
 *  two cannot drift apart silently. And the action list is READ BACK from `career.actions` rather than
 *  assembled here, because that field IS the record the game stores — building a parallel copy is how a
 *  fixture ends up testing something the product does not do.
 *
 *  Choices vary by index rather than always taking `[0]`, or arcs never branch and the recorded path is
 *  degenerate. */
function record(seed: number, maxSteps = 600): { token: Token; finalTurn: number; finished: boolean } {
  const c = new Career(seed, 'outfield');
  let step = 0;
  while (!c.finished && step < maxSteps) {
    const st = c.current() as any;
    const pick = (xs: any[]): any => xs[step % xs.length];
    try {
      if (st.phase === 'arc') c.resolveArc(pick(st.arc.choices).id);
      else if (st.phase === 'focus') c.chooseFocus(pick(st.focus).id);
      else if (st.phase === 'offer') c.resolveOffer(pick(['develop', 'money', 'brand']) as string);
      else if (st.phase === 'coach') c.appointCoach(pick(st.coaches).id);
      else if (st.phase === 'draft') c.draft(pick(st.options).id);
      else if (st.phase === 'lifestyle') c.buyLifestyle(pick(st.items).id);
      else {
        const hand = c.hand;
        if (!hand.length) break;
        c.play(hand[step % hand.length].id);
      }
    } catch { break; }
    step++;
  }
  const token = {
    id: 't1', name: 'Test Player', state: 'prospect', career_seed: seed, track: 'outfield',
    career_actions: JSON.stringify(c.actions),
    career_action_count: c.actions.length,
  } as unknown as Token;
  return { token, finalTurn: c.turn, finished: c.finished };
}

// A fixture that does not reach the end of a career proves the contract over the part it reached, and this
// file exists precisely because a short record looks healthy. So assert the fixture itself first.
{
  let short = 0;
  const depths: number[] = [];
  for (const seed of [11, 2027, 90210, 7, 123456]) {
    const { token, finalTurn, finished } = record(seed);
    const n = (JSON.parse(token.career_actions!) as unknown[]).length;
    depths.push(n);
    if (n < 100 || !finished) short++;
    void finalTurn;
  }
  check(short === 0, `every fixture drives a WHOLE career (action counts: ${depths.join(', ')})`);
}

console.log('[qa-replay] a clean replay must be exact, and must not flag itself...');
{
  let exact = 0, flagged = 0;
  for (const seed of [11, 2027, 90210, 7, 123456]) {
    const { token, finalTurn } = record(seed);
    const back = loadCareer(token);
    if (back.turn === finalTurn) exact++;
    if (back.replay) flagged++;
  }
  check(exact === 5, `all 5 recorded careers replay to the same turn (${exact}/5)`);
  check(flagged === 0, `no clean replay reports a shortfall (${flagged} did)`);
}

console.log('\n[qa-replay] a BROKEN replay must be detected, never silently truncated...');
{
  // an action the engine cannot apply, spliced into the middle — stands in for any structural change that
  // desyncs a stored action from its phase (a moved chapter boundary, a changed arc beat graph, a shifted
  // draft-pick count). Its cause does not matter; being noticed does.
  let detected = 0, silent = 0;
  for (const seed of [11, 2027, 90210, 7, 123456]) {
    const { token } = record(seed);
    const acts = JSON.parse(token.career_actions!) as CareerAction[];
    acts.splice(Math.floor(acts.length / 2), 0, { type: 'play', cardId: '__no_such_card__' } as CareerAction);
    const broken = { ...token, career_actions: JSON.stringify(acts) };
    const back = loadCareer(broken);
    if (back.replay && back.replay.applied < back.replay.stored) detected++; else silent++;
  }
  check(silent === 0, `every broken replay is flagged, none truncates silently (${detected} detected, ${silent} silent)`);
}

console.log('\n[qa-replay] a PHYSICALLY TRUNCATED record must be detected...');
{
  // The subtle one. Every surviving action still applies, so `applied === actions.length` and the career
  // reports perfect health while sitting well short of where it was. Nothing inside the array can reveal
  // that; only a count written outside it can. Measured before the invariant: 8 of 8 truncated careers
  // loaded clean, and the next move appended onto the shortened record.
  let detected = 0, silent = 0;
  for (const seed of [11, 2027, 90210, 7, 123456]) {
    const { token } = record(seed);
    const acts = JSON.parse(token.career_actions!) as CareerAction[];
    if (acts.length < 2) continue;                                   // nothing to truncate
    const half = Math.max(1, Math.floor(acts.length / 2));
    const cut = { ...token, career_actions: JSON.stringify(acts.slice(0, half)), career_action_count: acts.length } as Token;
    const back = loadCareer(cut);
    if (back.replay && back.replay.stored > back.replay.applied) detected++; else silent++;
  }
  check(silent === 0, `a truncated array is caught by the count invariant (${detected} detected, ${silent} silent)`);

  // ...and a save written before the invariant existed must NOT be condemned by its absence
  const { token } = record(11);
  const legacy = { ...token, career_action_count: undefined } as Token;
  check(!loadCareer(legacy).replay, 'a save with no recorded count is not falsely flagged');
}

console.log('\n[qa-replay] malformed stored actions must not throw out of loadCareer...');
{
  const { token } = record(11);
  let threw = 0;
  for (const bad of ['{"unterminated', 'null', '42', '"corrupt"', '{"0":{"type":"play"}}']) {
    try { loadCareer({ ...token, career_actions: bad } as Token); } catch { threw++; }
  }
  check(threw === 0, `5 malformed action payloads all load without throwing (${threw} threw)`);
  // a non-array payload must apply NOTHING — iterating a string's characters used to fabricate history
  const fabricated = loadCareer({ ...token, career_actions: '"corrupt"' } as Token);
  check(fabricated.turn === 0, `a non-array payload plays no turns rather than fabricating them (turn=${fabricated.turn})`);
  // ...and it must be FLAGGED, not treated as an empty career. `applied 0 of stored 0` is not a shortfall
  // by arithmetic, so this used to pass every guard and silently restart the career from turn zero.
  check(!!fabricated.replay, 'a non-array payload is flagged as damaged rather than read as an empty career');
}

console.log(fails ? `\n✗ ${fails} replay-contract check(s) failed` : '\n✓ the replay contract holds: exact when clean, detected when broken, never silent');
if (fails) process.exit(1);
