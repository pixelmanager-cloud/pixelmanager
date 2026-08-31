// Same power question for the anchor duty and the play-out-of-defence instruction: is the assertion wrong
// about the engine, or is the engine wrong about football? A paired design (identical seeds either side)
// removes the match-to-match variance that a bare sum over 60 matches cannot see past.
//
// ── WHAT THIS GATE ASSERTS, AND WHAT IT DELIBERATELY DOES NOT ────────────────────────────────────────
//
// It does NOT assert that the anchor is the better defensive duty. It is not. §11/§15/§40 of
// docs/decisions-for-ck.md track that measurement all the way to its conclusion: five of the six midfield
// duties are defensively identical, and at n=900 the anchor concedes MORE than a ball-winner —
// +0.217 [0.101, 0.333], an interval that excludes zero — while its card says "pure destroyer, sits,
// screens the back four". Writing a bar that says "anchor < ball-winner" would be asserting a model the
// game does not have, which is the defect §9 records in `analyze_manager_career.ts`.
//
// So this asserts the two things that ARE real:
//
//   1. REACHABILITY. The duty the player picked has to reach the pitch and change the match. §14 records
//      that until it was fixed, *every tactical setting the player made was thrown away after each
//      match* — and no gate noticed, because a setting that does nothing produces a paired difference of
//      exactly 0.000 and a tidy CI around it, which reads exactly like "no effect" in the output above.
//      Comparing full match signatures separates "the duty did something small" from "the duty was
//      dropped on the floor", and only the second is a bug this file can see.
//   2. NO COLLAPSE. Whatever the duties do, none of them may become a hole. A ceiling on the worst
//      anchor-vs-other gap fails loudly if a change turns a 0.19-goal shrug into a real defect.
//
// Same shape for play-out-of-defence against a high press: it must reach the match, and it must not
// invert into a liability. Its possession trade-off measures -0.001 (i.e. nothing), so nothing is
// asserted about possession — see the note by MAX_POD_PENALTY.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import type { Team, Duty, Tactics } from '../../shared/src/types.js';

const N = Number(process.env.N ?? 400);
const withMfDuty = (t: Team, duty: Duty): Team => ({ ...t, players: t.players.map((p) => (p.role === 'MF' ? { ...p, duty } : p)) });
const direct: Tactics = { ...DEFAULT_TACTICS, formation: '4-3-3', mentality: 1, tempo: 2 } as any;

// ── THRESHOLDS ───────────────────────────────────────────────────────────────────────────────────────
// Measured 2026-08-31 on the shipped (post-revert) engine at the default N=400. See the run log in the
// verdict block below for the numbers each bar is set against.

/** Worst permitted anchor-minus-other-duty gap in goals conceded per match. Today the worst of the three
 *  is +0.190 (vs deep-lying-playmaker) with a 95% CI that still touches zero, so the honest reading is
 *  "these duties are indistinguishable, and if anything the anchor is slightly worse". This is a
 *  MUST-NOT-GET-WORSE ceiling on that, not a blessing: 0.6 goals a match is a quarter of every goal in
 *  the game, and a duty that leaks that much against its own card text is a defect, not a trade-off.
 *  The bar sits well clear of the +/-0.19 CI half-width this fixture carries at N=400. */
const MAX_ANCHOR_PENALTY = 0.60;
/** Same, for play-out-of-defence against a high press. Today -0.080 [-0.187, 0.027] — the instruction is
 *  very slightly helpful and mostly noise. The bar catches an INVERSION: the instruction turning into a
 *  way to lose goals. Nothing is asserted about the possession trade-off it is supposed to buy, because
 *  the measured trade-off is -0.001 share and asserting an effect the game does not have is exactly the
 *  failure §9 records. */
const MAX_POD_PENALTY = 0.40;
/** Fraction of paired matches in which swapping the duty (or the instruction) must actually change the
 *  match — the §14 "the setting was thrown away after every match" alarm. A duty that is read and used
 *  moves every one of these fixtures: measured today, all three duty swaps change 100% of the 400 pairs,
 *  and play-out-of-defence changes 86%. A duty that is silently dropped changes 0%, and would otherwise
 *  print a perfectly respectable +0.000 [-0.000, 0.000] and pass every effect-size bar in this file. */
const MIN_DUTY_REACH = 0.90;
const MIN_POD_REACH = 0.65;
/** The fixture has to be a football match. `division_balance` learned this the hard way: a mutation that
 *  disabled a goal path made ~80% of matches goalless and passed every ceiling in the file, because
 *  nobody scoring is never a defect by any upper bound. Every difference in this probe is a difference of
 *  goals conceded, so if nothing is conceded this probe measures nothing while printing 0.000 everywhere. */
const MIN_CONCEDED = 0.65;

let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

/** Everything about a finished match that a changed duty could move. Score alone is far too coarse: two
 *  completely different matches end 1-0, so a duty that was silently discarded and a duty that genuinely
 *  changed nothing about the scoreline are the same number. Possession ticks, event count and the final
 *  ball position separate them. */
const sig = (m: any) => `${m.state.score[0]}-${m.state.score[1]}|${m.state.possession[0]}-${m.state.possession[1]}|${m.state.events.length}|${m.state.ball.x.toFixed(2)},${m.state.ball.y.toFixed(2)}`;

function stat(d: number[], label: string, changed: number) {
  const mean = d.reduce((a, b) => a + b, 0) / d.length;
  const sd = Math.sqrt(d.reduce((a, b) => a + (b - mean) ** 2, 0) / (d.length - 1));
  const se = sd / Math.sqrt(d.length);
  console.log(`${label.padEnd(44)} ${mean >= 0 ? '+' : ''}${mean.toFixed(3)}  95% CI [${(mean - 1.96 * se).toFixed(3)}, ${(mean + 1.96 * se).toFixed(3)}]   changed the match in ${(100 * changed / d.length).toFixed(0)}%`);
  return { mean, reach: changed / d.length };
}

const concede = (duty: Duty, i: number) => {
  const def = withMfDuty(generateTeam('d', 'D', 'D', 0x1, 13, i * 7 + 1, '4-4-2'), duty);
  const atk = generateTeam('a', 'A', 'A', 0x2, 13, i * 11 + 3, '4-3-3');
  const m = new MatchEngine([def, atk], i * 31 + 5, [DEFAULT_TACTICS, direct]);
  while (!m.state.finished) m.tick();
  return { ga: m.state.score[1], sig: sig(m) };
};
const aBw: number[] = [], aB2b: number[] = [], aDlp: number[] = [];
let cBw = 0, cB2b = 0, cDlp = 0, anchorGa = 0;
for (let i = 0; i < N; i++) {
  const a = concede('anchor', i);
  const bw = concede('ball-winner', i), b2b = concede('box-to-box', i), dlp = concede('deep-lying-playmaker', i);
  anchorGa += a.ga;
  aBw.push(a.ga - bw.ga); aB2b.push(a.ga - b2b.ga); aDlp.push(a.ga - dlp.ga);
  if (a.sig !== bw.sig) cBw++;
  if (a.sig !== b2b.sig) cB2b++;
  if (a.sig !== dlp.sig) cDlp++;
}
console.log(`anchor vs the other MF duties, goals conceded (negative = anchor is better), N=${N}`);
const rBw = stat(aBw, '  anchor - ball-winner', cBw);
const rB2b = stat(aB2b, '  anchor - box-to-box', cB2b);
const rDlp = stat(aDlp, '  anchor - deep-lying-playmaker', cDlp);

console.log(`\nplay-out-of-defence vs a high press, goals conceded, N=${N}`);
const hp: Tactics = { ...DEFAULT_TACTICS, press: 2 } as any;
const po: number[] = [], poss: number[] = [];
let cPo = 0, offGa = 0;
for (let i = 0; i < N; i++) {
  const run = (on: boolean) => {
    const a = generateTeam('a', 'A', 'A', 0x1, 13, i * 7 + 1, '4-4-2');
    const b = generateTeam('b', 'B', 'B', 0x2, 13, i * 11 + 3, '4-4-2');
    const m = new MatchEngine([a, b], i * 31 + 5, [{ ...DEFAULT_TACTICS, playOutOfDefence: on } as any, hp]);
    while (!m.state.finished) m.tick();
    const tot = m.state.possession[0] + m.state.possession[1] || 1;
    return { ga: m.state.score[1], gf: m.state.score[0], poss: m.state.possession[0] / tot, sig: sig(m) };
  };
  const on = run(true), off = run(false);
  offGa += off.ga;
  po.push(on.ga - off.ga); poss.push(on.poss - off.poss);
  if (on.sig !== off.sig) cPo++;
}
const rPo = stat(po, '  ON - OFF, goals conceded (want negative)', cPo);
stat(poss, '  ON - OFF, possession share (the trade-off?)', cPo);

// ── THE GATE ─────────────────────────────────────────────────────────────────────────────────────────
console.log('');
if (aBw.length !== N || po.length !== N || N < 30) {
  console.log(`  FAIL only ${aBw.length}/${po.length} of ${N} pairs were played — too little to measure, which is a failure and not a pass`);
  process.exit(1);
}
const worstDuty = [{ n: 'ball-winner', r: rBw }, { n: 'box-to-box', r: rB2b }, { n: 'deep-lying-playmaker', r: rDlp }]
  .reduce((a, b) => (b.r.mean > a.r.mean ? b : a));
const leastReach = [{ n: 'ball-winner', r: rBw }, { n: 'box-to-box', r: rB2b }, { n: 'deep-lying-playmaker', r: rDlp }]
  .reduce((a, b) => (b.r.reach < a.r.reach ? b : a));
const anchorPerMatch = anchorGa / N;
const offPerMatch = offGa / N;

check(Math.min(anchorPerMatch, offPerMatch) >= MIN_CONCEDED,
  `both fixtures are real matches with goals in them (anchor side concedes ${anchorPerMatch.toFixed(2)}/match, high-press fixture ${offPerMatch.toFixed(2)}/match, floor ${MIN_CONCEDED.toFixed(2)})`);
check(leastReach.r.reach >= MIN_DUTY_REACH,
  `the duty the player picked reaches the pitch: weakest is anchor vs ${leastReach.n}, a different match in ${(100 * leastReach.r.reach).toFixed(0)}% of pairs (floor ${(100 * MIN_DUTY_REACH).toFixed(0)}%)`);
check(rPo.reach >= MIN_POD_REACH,
  `play-out-of-defence reaches the pitch: a different match in ${(100 * rPo.reach).toFixed(0)}% of pairs (floor ${(100 * MIN_POD_REACH).toFixed(0)}%)`);
check(worstDuty.r.mean <= MAX_ANCHOR_PENALTY,
  `no midfield duty has collapsed into a hole: worst gap is anchor - ${worstDuty.n} at ${worstDuty.r.mean >= 0 ? '+' : ''}${worstDuty.r.mean.toFixed(3)} goals/match, ceiling +${MAX_ANCHOR_PENALTY.toFixed(2)}`);
check(rPo.mean <= MAX_POD_PENALTY,
  `play-out-of-defence has not inverted into a liability against a high press: ${rPo.mean >= 0 ? '+' : ''}${rPo.mean.toFixed(3)} goals/match, ceiling +${MAX_POD_PENALTY.toFixed(2)}`);

console.log(fails
  ? `\n✗ ${fails} duty-power check(s) failed — a duty or instruction the player deliberately chose either stopped reaching the match or started costing goals. Read §11/§15/§40 before touching these bars: this gate is calibrated on an engine where the duties are already known to be near-identical, so a break here is a NEW defect, not the old one.`
  : '\n✓ every duty reaches the pitch, and none of them is a hole');
if (fails) process.exit(1);
