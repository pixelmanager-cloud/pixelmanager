// THE PROSE AND THE PAYOUT HAVE TO NAME THE SAME OUTCOME.
//
// `applyLifeConsequence`, `applyRivalConsequence` and `applyCallupConsequence` (shared/src/career.ts) each
// decide "this went well" at one threshold: they pay the `.good` meters, credit `earnGood`, and persist the
// flag on `lastLifeEvent` / `lastRivalMoment` / `lastCallupMoment` — which tokens.ts turns into the literal
// on-screen verdict "That went well — Injury comeback, handled."
//
// The three resolution beats in narrate.ts used to grade that SAME number themselves, off `band(success)`,
// whose 'good' band starts at 0.62. So on every resolution landing in [0.55, 0.62) the meters climbed, the
// money was credited, the verdict line said it went well — and the sentence rendered directly above it came
// out of the `.bad` bank ("The same injury, in the same place, and now with a history attached"). Two
// authored sentences in one frame saying opposite things, on ~15% of life events, ~12% of rivalry moments
// and ~9% of shock call-ups under skilled play. (W15-15)
//
// THIS PROBE READS NEITHER CONSTANT — a probe that compared two literals would go green the moment somebody
// changed both to the same wrong number, and would never have caught the original drift either, since both
// sides were already "correct" in isolation. It drives real careers, takes the `good` the MECHANICS actually
// paid off the public last*Moment fields, and asks the NARRATOR which bank it drew from by its own output.
// Which bank a resolution uses is a pure function of `success` (ctx only steers WHICH line inside the bank),
// so `narrate(…, s, …) === narrate(…, 0.99, …)` is exactly "the narrator called this one good".
//
// Run: `npx tsx tools/playtest/outcome_verdict_truth.ts`
import { Career, fit, seedFrom } from '../../shared/src/career.js';
import { narrateLifeEvent, narrateRivalMoment, narrateCallupMoment, type NarrateCtx } from '../../shared/src/narrate.js';

const N = Number(process.argv[2] ?? 160);
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

// A probe-owned ctx. Its contents pick WHICH sentence comes out of a bank, never WHICH bank — that is the
// property the classifier below rests on, and the distinguishability guards prove it holds for this ctx.
const CTX: NarrateCtx = { age: 19, chapter: 'Academy', stakes: 2, personalityId: 'loyal', turn: 40, seed: 0x5eed51, careerSeed: 0x77777 };
const lifeOut = (kind: string, s: number) => narrateLifeEvent(kind, 'Reverse Ball', s, CTX, undefined, ['creativity'], 'c_rev');
const rivalOut = (s: number) => narrateRivalMoment('Reverse Ball', s, CTX, { rivalName: 'Haines', leadBefore: 5, leadAfter: 6 }, ['creativity']);
const callOut = (s: number) => narrateCallupMoment('Reverse Ball', s, CTX, ['creativity']);

/** "Did the narrator draw from the GOOD bank at this success?" — answered by the narrator, not by a constant. */
const saysGood = (out: (s: number) => string) => (s: number) => out(s) === out(0.99);
/** The narrator's own threshold, recovered by bisection so the report can state the seam it is guarding. */
function narratorThreshold(good: (s: number) => boolean): number {
  let lo = 0, hi = 1;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (good(m)) hi = m; else lo = m; }
  return hi;
}

interface Ev { kind: string; success: number; good: boolean }
const life: Ev[] = [], rival: Ev[] = [], callup: Ev[] = [];

// SKILLED play — always the best-fit card, the same policy analyze_player_career.ts measures the game by.
// A weaker policy pushes successes down and away from the seam, which would understate the disagreement.
for (let i = 0; i < N; i++) {
  const c = new Career(seedFrom('verdict', i), i % 2 ? 'goalkeeper' : 'outfield', 'loyal');
  let guard = 0;
  while (!c.finished && guard++ < 3000) {
    const st = c.current() as any;
    if (st.phase === 'arc') { c.resolveArc(st.arc.choices[0].id); continue; }
    if (st.phase === 'focus') { c.chooseFocus(st.focus[0].id); continue; }
    if (st.phase === 'offer') { c.resolveOffer(st.offers[0].id); continue; }
    if (st.phase === 'coach') { c.appointCoach(st.coaches[0].id); continue; }
    if (st.phase === 'draft') { c.draft(st.options[0].id); continue; }
    const hand = st.hand as any[], sc = st.scenario;
    if (!hand?.length) break;
    // read the flags BEFORE playing — play() advances to the next scenario
    const isLife = c.scenario.life, isRival = c.scenario.rival, isCallup = c.scenario.callup;
    c.play(hand.reduce((b, x) => (fit(x, sc) > fit(b, sc) ? x : b), hand[0]).id);
    if (isLife && c.lastLifeEvent) life.push({ kind: c.lastLifeEvent.kind, success: c.lastLifeEvent.success, good: c.lastLifeEvent.good });
    if (isRival && c.lastRivalMoment) rival.push({ kind: 'rival', success: c.lastRivalMoment.success, good: c.lastRivalMoment.good });
    if (isCallup && c.lastCallupMoment) callup.push({ kind: 'callup', success: c.lastCallupMoment.success, good: c.lastCallupMoment.good });
  }
}

console.log('=== Does the resolution prose agree with the outcome the mechanics paid? ===');
const KINDS = [...new Set(life.map((e) => e.kind))].sort();
console.log(`  ..   ${N} skilled careers → ${life.length} life events (${KINDS.length} kinds), ${rival.length} rivalry moments, ${callup.length} shock call-ups`);

// VACUITY GUARD #1 — every check below iterates these lists. With none collected, "nothing disagreed" is
// trivially true. Mutation-test by forcing makeScenario's life/rival/callup gates off: this must go red first.
ok(life.length >= 200 && rival.length >= 60 && callup.length >= 20,
  `enough real resolutions to measure (life ${life.length}, rival ${rival.length}, call-up ${callup.length}) — with none the checks below are vacuous`);

// VACUITY GUARD #2 — the classifier is "the output matches the output at 0.99". If a bank pair happened to
// render identically for this ctx, every success would classify as good and the probe would be blind.
const blind = KINDS.filter((k) => lifeOut(k, 0.99) === lifeOut(k, 0.01));
ok(blind.length === 0, `both banks are distinguishable for all ${KINDS.length} life kinds${blind.length ? ` (blind: ${blind.join(',')})` : ''}`);
ok(rivalOut(0.99) !== rivalOut(0.01) && callOut(0.99) !== callOut(0.01), 'both banks are distinguishable for the rivalry and call-up beats');

const T = {
  life: narratorThreshold(saysGood((s) => lifeOut(KINDS[0] ?? 'setback', s))),
  rival: narratorThreshold(saysGood(rivalOut)),
  callup: narratorThreshold(saysGood(callOut)),
};
console.log(`  ..   narrator's own good-bank threshold, by bisection: life ${T.life.toFixed(4)}, rivalry ${T.rival.toFixed(4)}, call-up ${T.callup.toFixed(4)}`);

/** Disagreements, plus the seam coverage that stops "zero disagreements" from being an accident of sampling. */
function audit(label: string, evs: Ev[], good: (kind: string, s: number) => boolean, t: number) {
  const bad = evs.filter((e) => good(e.kind, e.success) !== e.good);
  const near = evs.filter((e) => Math.abs(e.success - t) < 0.1);
  const below = near.filter((e) => e.success < t).length;
  console.log(`  ..   ${label}: ${near.length} of ${evs.length} resolved within ±0.10 of the seam (${below} below it, ${near.length - below} above)`);
  // VACUITY GUARD #3 — if no career ever resolves near the threshold, the two thresholds could sit far apart
  // and still never disagree on real data. Assert the seam is genuinely exercised from both sides.
  ok(near.length >= Math.max(8, evs.length * 0.1) && below > 0 && near.length - below > 0,
    `${label}: the seam is exercised from both sides (${below} below / ${near.length - below} above)`);
  if (bad.length) {
    const s = bad.slice(0, 4).map((e) => `${e.kind} ${e.success.toFixed(3)} → mechanics paid ${e.good ? 'GOOD' : 'BAD'}, prose read from the ${e.good ? 'bad' : 'good'} bank`);
    console.log(`  ..   ${s.join('\n  ..   ')}`);
  }
  ok(bad.length === 0, `${label}: every resolution's prose names the outcome the mechanics paid (${bad.length} of ${evs.length} contradict it)`);
}
audit('life event  ', life, (k, s) => saysGood((x) => lifeOut(k, x))(s), T.life);
audit('rivalry     ', rival, (_k, s) => saysGood(rivalOut)(s), T.rival);
audit('shock call-up', callup, (_k, s) => saysGood(callOut)(s), T.callup);

console.log(fails ? `\n✗ ${fails} — the game pays one outcome and tells the story of the other` : '\n✓ prose and payout name the same outcome on every resolution');
if (fails) process.exitCode = 1;
