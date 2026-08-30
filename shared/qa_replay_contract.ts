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
import type { Token } from './src/types.js';
import type { CareerAction } from './src/career.js';

let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

/** Drive a career headlessly and return the token it would have been stored as. */
function record(seed: number, turns: number): { token: Token; finalTurn: number } {
  const c = new Career(seed, 'outfield');
  const actions: CareerAction[] = [];
  for (let i = 0; i < turns && !c.finished; i++) {
    if (c.pendingDraft) {
      const pick = c.pendingDraft.options[0];
      if (!pick) break;
      const a: CareerAction = { type: 'draft', cardId: pick.id } as CareerAction;
      try { c.draft(pick.id); actions.push(a); } catch { break; }
      continue;
    }
    const card = c.hand[0];
    if (!card) break;
    const a: CareerAction = { type: 'play', cardId: card.id } as CareerAction;
    try { c.play(card.id); actions.push(a); } catch { break; }
  }
  const token = {
    id: 't1', name: 'Test Player', state: 'prospect', career_seed: seed, track: 'outfield',
    career_actions: JSON.stringify(actions),
  } as unknown as Token;
  return { token, finalTurn: c.turn };
}

console.log('[qa-replay] a clean replay must be exact, and must not flag itself...');
{
  let exact = 0, flagged = 0;
  for (const seed of [11, 2027, 90210, 7, 123456]) {
    const { token, finalTurn } = record(seed, 60);
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
    const { token } = record(seed, 60);
    const acts = JSON.parse(token.career_actions!) as CareerAction[];
    acts.splice(Math.floor(acts.length / 2), 0, { type: 'play', cardId: '__no_such_card__' } as CareerAction);
    const broken = { ...token, career_actions: JSON.stringify(acts) };
    const back = loadCareer(broken);
    if (back.replay && back.replay.applied < back.replay.stored) detected++; else silent++;
  }
  check(silent === 0, `every broken replay is flagged, none truncates silently (${detected} detected, ${silent} silent)`);
}

console.log('\n[qa-replay] malformed stored actions must not throw out of loadCareer...');
{
  const { token } = record(11, 20);
  let threw = 0;
  for (const bad of ['{"unterminated', 'null', '42', '"corrupt"', '{"0":{"type":"play"}}']) {
    try { loadCareer({ ...token, career_actions: bad } as Token); } catch { threw++; }
  }
  check(threw === 0, `5 malformed action payloads all load without throwing (${threw} threw)`);
  // a non-array payload must apply NOTHING — iterating a string's characters used to fabricate history
  const fabricated = loadCareer({ ...token, career_actions: '"corrupt"' } as Token);
  check(fabricated.turn === 0, `a non-array payload plays no turns rather than fabricating them (turn=${fabricated.turn})`);
}

console.log(fails ? `\n✗ ${fails} replay-contract check(s) failed` : '\n✓ the replay contract holds: exact when clean, detected when broken, never silent');
if (fails) process.exit(1);
