// A LIFE EVENT'S BAD BRANCH HAS TO BITE, IN THE CHAPTER IT CAN ACTUALLY FIRE IN.
//
// LIFE_CONSEQUENCE is the entire reason a life event is not a re-skinned dressing-room beat, and it has two
// silent ways of being nothing. `Career.life()` DROPS a delta for a meter the current chapter has not
// activated — fans and sponsors do not exist before Breakthrough/First Team, while life events start at
// Scholar — so a row written in senior meters is a no-op for the whole youth run. And a `bad` branch
// carrying a positive number PAYS the player for the outcome narrate.ts prints "that didn't land" prose
// over. Both have shipped from this one table: `social_storm` had no youth consequence at all and `media`'s
// good branch was worth nothing there (F-101), and `charity`'s bad branch was `{ fans: 2 }` — dropped
// entirely at Scholar/Youth Team, and a +2 reward for failing from Breakthrough on (F-312).
//
// Neither is visible by reading the table. The row looks populated and the meter it names is real; it is
// only nothing once you cross it with the chapter it fires in. So this crosses them.
//
// Anti-vacuity: the pairs are not a list kept by hand — they are the pools makeScenario draws from
// (`bandIdx >= 4 ? LIFE_KINDS : YOUTH_LIFE_KINDS`, from Scholar on) crossed with `activeMeters`, and the
// reachability pass drives real careers and refuses to go green unless those events actually fire, in the
// chapters this cross claims, with bad outcomes among them. Every meter starts at 50 so no delta is
// swallowed by the 0..100 clamp. Mutation-tested: turn any one `bad` number positive, or empty any `bad`
// row, and the matching line goes red naming the kind and the chapter.
//
// Run: `npx tsx tools/playtest/life_branch_bites.ts`
import { Career, LIFE_KINDS, YOUTH_LIFE_KINDS, AGE_BANDS, TOTAL_TURNS, GOOD_OUTCOME, activeMeters, bandAt, mulberry32, fit } from '../../shared/src/career.js';
import type { LifeKind } from '../../shared/src/career.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== Every life-event branch moves a meter the chapter has, in the direction it claims ===');

// Life events start at bandIdx >= 2 (makeScenario); the senior bands draw the full pool, the youth bands
// the age-appropriate subset. Read the rule off the engine's own exports rather than restating it.
const BANDS = AGE_BANDS.map((b, i) => ({ i, name: b.name })).filter((b) => b.i >= 2);
const poolFor = (i: number) => (i >= 4 ? LIFE_KINDS : YOUTH_LIFE_KINDS);
const firstTurnOf = (i: number) => { for (let t = 0; t < TOTAL_TURNS; t++) if (bandAt(t).index === i) return t; return -1; };

/** Fire one life-event branch at a career parked in one chapter, and report what actually moved. */
function fire(bandIdx: number, kind: LifeKind, good: boolean) {
  const c = new Career(1, 'outfield') as any;
  c.turn = firstTurnOf(bandIdx);
  for (const k of Object.keys(c.standing)) c.standing[k] = 50;   // mid-range: nothing is eaten by the clamp
  const before = { ...c.standing } as Record<string, number>, earn0 = c.earnings as number;
  c.applyLifeConsequence(kind, good ? GOOD_OUTCOME : GOOD_OUTCOME - 0.2);
  const moves: Array<[string, number]> = [];
  for (const k of Object.keys(c.standing)) if (c.standing[k] !== before[k]) moves.push([k, c.standing[k] - before[k]]);
  return { chapter: c.chapter as string, moves, earn: (c.earnings as number) - earn0 };
}

const pairs: Array<{ i: number; chapter: string; kind: LifeKind }> = [];
for (const b of BANDS) for (const kind of poolFor(b.i)) pairs.push({ i: b.i, chapter: b.name, kind });
for (const b of BANDS) console.log(`  ..   ${b.name.padEnd(13)} ${poolFor(b.i).length} life kinds, active meters [${activeMeters(b.name).map((m) => m.key).join(' ')}]`);
console.log(`  ..   ${pairs.length} (chapter, kind) pairs to grade, both branches each`);
ok(pairs.length >= 60, `the cross is populated (${pairs.length} pairs) — this is not about to grade an empty set`);
ok(BANDS.every((b) => firstTurnOf(b.i) >= 0 && bandAt(firstTurnOf(b.i)).band.name === b.name), 'every chapter under test resolves to a turn a career can be parked on');

const deadBad: string[] = [], paidBad: string[] = [], deadGood: string[] = [];
let cells = 0;
for (const p of pairs) {
  const bad = fire(p.i, p.kind, false), good = fire(p.i, p.kind, true);
  cells += 2;
  if (bad.chapter !== p.chapter || good.chapter !== p.chapter) { ok(false, `parking a career at ${p.chapter} landed in ${bad.chapter} — the harness is not measuring what it says`); break; }
  if (!bad.moves.length && !bad.earn) deadBad.push(`${p.kind}@${p.chapter}`);
  if (bad.moves.some(([, d]) => d > 0) || bad.earn > 0) paidBad.push(`${p.kind}@${p.chapter} (${bad.moves.filter(([, d]) => d > 0).map(([k, d]) => `${k}+${d}`).join(' ')}${bad.earn > 0 ? ` £+${bad.earn}` : ''})`);
  if (!good.moves.some(([, d]) => d > 0) && good.earn <= 0) deadGood.push(`${p.kind}@${p.chapter}`);
}
console.log(`  ..   ${cells} branch cells fired; ${cells - deadBad.length - deadGood.length} moved something`);
ok(deadGood.length === 0, deadGood.length ? `good branches that pay nothing at that stage: ${deadGood.join(' · ')}` : `every good branch pays into a meter the chapter has active (${cells / 2} checked)`);
ok(deadBad.length === 0, deadBad.length ? `bad branches that cost nothing at that stage: ${deadBad.join(' · ')}` : `every bad branch costs a meter the chapter has active (${cells / 2} checked)`);
ok(paidBad.length === 0, paidBad.length ? `bad branches that REWARD the player: ${paidBad.join(' · ')}` : `no bad branch pays out (${cells / 2} checked)`);

// ── REACHABILITY: the cross above is only worth grading if these events fire in real careers, in those
// chapters, and land on the bad branch often enough for the sign to matter. Best-fit play, the same policy
// _life.ts uses, so this is the honest side of the distribution rather than a worst case.
const N = 150;
const seenPairs = new Set<string>(), seenKinds = new Set<string>(), outside: string[] = [];
let fired = 0, badOutcomes = 0;
for (let s = 0; s < N; s++) {
  const c = new Career(s, 'outfield') as any;
  const rng = mulberry32(s ^ 0x1234567);
  let guard = 0;
  while (!c.finished && guard++ < 3000) {
    const st = c.current() as any;
    if (st.phase === 'arc') { c.resolveArc(st.arc.choices[Math.floor(rng() * st.arc.choices.length)].id); continue; }
    if (st.phase === 'focus') { c.chooseFocus(st.focus[0].id); continue; }
    if (st.phase === 'offer') { c.resolveOffer('develop'); continue; }
    if (st.phase === 'coach') { c.appointCoach(st.coaches[0].id); continue; }
    if (st.phase === 'draft') { c.draft(st.options[0].id); continue; }
    const kind: LifeKind | null = st.scenario?.life ?? null;
    const chapter = c.chapter as string;
    c.play([...st.hand].sort((a: any, b: any) => fit(b, st.scenario) - fit(a, st.scenario))[0].id);
    if (!kind) continue;
    fired++; seenKinds.add(kind); seenPairs.add(`${kind}@${chapter}`);
    if (!pairs.some((p) => p.kind === kind && p.chapter === chapter)) outside.push(`${kind}@${chapter}`);
    if (c.lastLifeEvent && !c.lastLifeEvent.good) badOutcomes++;
  }
}
console.log(`  ..   ${N} careers: ${fired} life events, ${seenKinds.size}/${LIFE_KINDS.length} kinds, ${seenPairs.size} distinct (kind, chapter) pairs, ${badOutcomes} bad outcomes`);
ok(fired >= N, `life events reach real careers (${fired} across ${N})`);
ok(seenKinds.size === LIFE_KINDS.length, `every life kind fires (${seenKinds.size}/${LIFE_KINDS.length})`);
ok(badOutcomes >= fired * 0.05, `bad outcomes are reachable, so the sign of the bad branch is played (${badOutcomes}/${fired})`);
ok(outside.length === 0, outside.length ? `fired in a chapter the cross above never graded: ${[...new Set(outside)].join(' · ')}` : 'every event observed was graded above — the cross matches the engine\'s own pool gate');

console.log(fails ? `\n✗ ${fails} — a life event's branch is nothing, or pays for failing` : '\n✓ every life-event branch costs or pays something the player can see, in every chapter it fires in');
if (fails) process.exitCode = 1;
