// Two assertions in the strategy suite compare shot COUNTS summed over 60 matches and call a difference of
// nine shots in ~1,780 a result. That is a fifth of a standard deviation. This runs the same comparison at
// enough matches to say whether the effect exists at all, and reports the paired difference with its own
// error bar rather than a bare inequality.
//
// ── WHAT THIS GATE ASSERTS, AND WHAT IT DELIBERATELY DOES NOT ────────────────────────────────────────
//
// It does NOT assert that playing wide in a wide shape helps. It does not, and that is a known open item.
// §1 of docs/decisions-for-ck.md has the cause down to the line: a hard `gain > -6` veto kills 80% of all
// wide passes, so width does not PAY, and the last piece of the fix "needs an overlapping run, which is a
// behaviour to design rather than a constant to tune". §9 records the same shape one layer up — every
// career focus variant "scored at or below always press Rest". Writing a bar here that says wide focus
// beats central in a 3-4-3 would be asserting a model the game does not have, and turning the build red
// on a design decision the owner has not made yet.
//
// So it asserts the two things that ARE real, and a ceiling on the known defect:
//
//   1. REACHABILITY. `attackFocus` has to reach the match. §14 records that every tactical setting the
//      player made was thrown away after each match, and no gate saw it, because a setting that does
//      nothing produces a paired difference of exactly 0.000 with a tight CI — which reads in this
//      probe's output exactly like an honest "no effect" finding. Comparing full match signatures is the
//      only thing here that can tell "the focus did little" apart from "the focus was discarded".
//   2. NO INVERSION IN THE NARROW SHAPE. A 4-1-2-1-2 has no wingers. It measures +0.045 [-0.605, 0.695]
//      for wide-over-central today, i.e. nothing, and it must not develop a taste for wide play.
//   3. A CEILING ON THE WIDTH DEFECT ITSELF. In the 3-4-3, CENTRAL focus currently beats WIDE focus by
//      +4.567 shots a match. That is the §1 defect, measured. The bar below is a MUST-NOT-GET-WORSE
//      ceiling on it and is not a statement that it is acceptable — it is not, it is the reason the
//      engine rebuild exists.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';

const N = Number(process.env.N ?? 600);
const shots = (m: any, idx: 0 | 1) => m.state.events.filter((e: any) => e.teamIdx === idx && (e.type === 'goal' || e.type.startsWith('shot'))).length;
/** Everything about a finished match that a changed focus could move. Shot count alone is far too coarse
 *  — two entirely different matches produce 31 shots each — so a focus that was silently discarded and a
 *  focus that happened not to change the shot total are indistinguishable by the number this probe
 *  prints. Possession ticks, event count and the final ball position separate them. */
const sig = (m: any) => `${m.state.score[0]}-${m.state.score[1]}|${m.state.possession[0]}-${m.state.possession[1]}|${m.state.events.length}|${m.state.ball.x.toFixed(2)},${m.state.ball.y.toFixed(2)}`;

// ── THRESHOLDS ───────────────────────────────────────────────────────────────────────────────────────
// Measured 2026-08-31 on the shipped (post-revert) engine at the default N=600. Numbers in each comment.

/** THE KNOWN DEFECT, FENCED — NOT BLESSED. In a 3-4-3, central focus beats wide focus by +4.567 shots a
 *  match today. A wide formation in which playing wide is a penalty is broken football, it is §1's open
 *  item, and it is one of the things the reverted `engine/shot-geometry` branch exists to fix. This
 *  ceiling exists so the defect cannot quietly deepen while nobody is looking; when the fix lands this
 *  number goes negative and the check keeps passing. If this bar ever fails, width has got WORSE. */
const MAX_WIDE_SHAPE_CENTRAL_EDGE = 6.0;
/** The narrow shape must not invert. 4-1-2-1-2 has no wingers; wide-over-central measures +0.045
 *  [-0.605, 0.695] today, which is zero. A formation with no width developing a real preference FOR wide
 *  play would mean the focus setting had come unhooked from the shape it is supposed to work with. */
const MAX_NARROW_WIDE_EDGE = 1.5;
/** Fraction of paired matches the focus must actually change — the §14 alarm. Measured today: swapping
 *  `attackFocus` changes 100% of the 600 pairs in BOTH shapes. A focus that is read and used moves every
 *  match; a focus that is dropped on the floor moves none, and prints +0.000 [-0.000, 0.000] while every
 *  effect-size bar in this file passes. */
const MIN_FOCUS_REACH = 0.90;
/** The match has to still be happening. `fuzz_test` shipped a mutation that ended every match at
 *  half-time and printed `✓ fuzz clean` with `maxTicks=5400` on the same line. If shots collapse, every
 *  difference in this file collapses with them and the probe reports a tidy no-effect result.
 *  This is a LIVENESS floor, not a calibration one — the absolute shot rate is a known catastrophe
 *  (~65 shots/match, §1/§19) owned by `shot_geometry.ts`, and it is deliberately set low enough that
 *  the rebuild's much more realistic ~26 shots/match would sail through it. */
const MIN_SHOTS_PER_MATCH = 8.0;

let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

function paired(formation: any, fa: 'wide' | 'central', fb: 'wide' | 'central') {
  const d: number[] = [];
  let changed = 0, shotTotal = 0;
  for (let i = 0; i < N; i++) {
    const mk = () => [generateTeam('a', 'A', 0x1, 13, i * 7 + 1, formation), generateTeam('b', 'B', 0x2, 13, i * 11 + 3, '4-4-2')] as any;
    const run = (f: 'wide' | 'central') => {
      const [a, b] = mk();
      const m = new MatchEngine([a, b], i * 31 + 5, [{ ...DEFAULT_TACTICS, formation, attackFocus: f }, DEFAULT_TACTICS]);
      while (!m.state.finished) m.tick();
      return { shots: shots(m, 0), sig: sig(m) };
    };
    const ra = run(fa), rb = run(fb);
    d.push(ra.shots - rb.shots);
    shotTotal += ra.shots + rb.shots;
    if (ra.sig !== rb.sig) changed++;
  }
  const mean = d.reduce((x, y) => x + y, 0) / N;
  const sd = Math.sqrt(d.reduce((x, y) => x + (y - mean) ** 2, 0) / (N - 1));
  const se = sd / Math.sqrt(N);
  const ident = d.filter((x) => x === 0).length;
  const line = `${fa}-${fb} = ${mean >= 0 ? '+' : ''}${mean.toFixed(3)} shots/match  95% CI [${(mean - 1.96 * se).toFixed(3)}, ${(mean + 1.96 * se).toFixed(3)}]  identical in ${(100 * ident / N).toFixed(0)}% of matches, changed the match in ${(100 * changed / N).toFixed(0)}%`;
  return { line, mean, reach: changed / N, shotsPerMatch: shotTotal / (2 * N), n: d.length };
}
console.log(`N=${N} paired matches per comparison`);
const wide = paired('3-4-3', 'central', 'wide');
console.log(`3-4-3 (wide shape)      ${wide.line}`);
const narrow = paired('4-1-2-1-2', 'wide', 'central');
console.log(`4-1-2-1-2 (narrow)      ${narrow.line}`);

// ── THE GATE ─────────────────────────────────────────────────────────────────────────────────────────
console.log('');
if (wide.n !== N || narrow.n !== N || N < 50) {
  console.log(`  FAIL only ${wide.n}/${narrow.n} of ${N} pairs were played — too little to measure, which is a failure and not a pass`);
  process.exit(1);
}
const worstReach = wide.reach <= narrow.reach ? { n: '3-4-3', r: wide } : { n: '4-1-2-1-2', r: narrow };
const leanestShots = Math.min(wide.shotsPerMatch, narrow.shotsPerMatch);

check(leanestShots >= MIN_SHOTS_PER_MATCH,
  `the matches are still being played to the end (leanest fixture takes ${leanestShots.toFixed(1)} shots/match, floor ${MIN_SHOTS_PER_MATCH.toFixed(1)})`);
check(worstReach.r.reach >= MIN_FOCUS_REACH,
  `attackFocus reaches the pitch: weakest is ${worstReach.n}, a different match in ${(100 * worstReach.r.reach).toFixed(0)}% of pairs (floor ${(100 * MIN_FOCUS_REACH).toFixed(0)}%)`);
check(wide.mean <= MAX_WIDE_SHAPE_CENTRAL_EDGE,
  `the width defect has not deepened: in a 3-4-3, central focus beats wide by ${wide.mean >= 0 ? '+' : ''}${wide.mean.toFixed(3)} shots/match, ceiling +${MAX_WIDE_SHAPE_CENTRAL_EDGE.toFixed(2)} (KNOWN OPEN ITEM, §1 — a wide shape should not punish width at all)`);
check(narrow.mean <= MAX_NARROW_WIDE_EDGE,
  `the narrow shape has not inverted: in a 4-1-2-1-2, wide focus beats central by ${narrow.mean >= 0 ? '+' : ''}${narrow.mean.toFixed(3)} shots/match, ceiling +${MAX_NARROW_WIDE_EDGE.toFixed(2)}`);

console.log(fails
  ? `\n✗ ${fails} focus-power check(s) failed — the attack focus the player chose has either stopped reaching the match or moved further away from the shape it is set on. The 3-4-3 ceiling in particular is a REGRESSION ALARM on an already-broken axis (§1): passing it is not a certificate that width works, and failing it means width just got worse.`
  : '\n✓ attack focus reaches the pitch, and the width defect has not deepened');
if (fails) process.exit(1);
