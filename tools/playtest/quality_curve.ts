// The calibration gate measures goals/match at ONE squad quality (13). The pyramid spans tier strengths
// from the basement to the top flight, so this sweeps the whole range the game actually generates.
//
// ── WHY THIS PROBE NOW HAS A FAILURE PATH ────────────────────────────────────────────────────────────
//
// This is the exact axis §19 of docs/decisions-for-ck.md is written about. On the shipped engine the
// sweep is a gentle curve — a 1.7x spread from the basement to the top flight. Parts 1-5 of the
// match-engine rebuild (§1, branch `engine/shot-geometry`, reverted) turned it into a **33x spread**:
// 0.19 goals/match at one end of the pyramid and 6.22 at the other, which is not one football game but
// three. Every gate in the project stayed green through that, and this probe in particular printed the
// whole curve and **exited 0**, so the regression was reported to the owner as a discovery about the
// shipped game rather than as damage the rebuild had just done.
//
// Re-attempting that rebuild is a live option the owner has been asked to decide on. When it is
// re-attempted, this file and `division_balance.ts` are the two gates that have to refuse it on day one
// instead of a week in. So: bars, not scrollback.
//
// The bars are calibrated on the DEFAULT sweep (QS/N below). Override QS or N and you are running a
// research sweep, not the gate.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';

const N = Number(process.env.N ?? 120);
const QS = (process.env.QS ?? '4,6,8,10,12,13,14,16,18').split(',').map(Number);

// ── THRESHOLDS ───────────────────────────────────────────────────────────────────────────────────────
// Measured 2026-08-31 on the shipped (post-revert) engine, N=120 per point:
//   q4 4.46  q6 4.14  q8 3.79  q10 3.75  q12 3.30  q13 2.60  q14 2.26  q16 2.56  q18 2.81
//   spread (max/min) = 1.97x, floor 2.26 @ q14, ceiling 4.46 @ q4.

/** How much the top and bottom of the pyramid may differ before they are different games.
 *  Today 1.97x. The reverted rebuild put 33x here. This is a wide bar on purpose — it is not a claim
 *  that 2.5x would be good, it is the line past which the pyramid has stopped being one sport. */
const MAX_SPREAD = 2.5;
/** A league where nobody scores is not a league. UPPER BOUNDS ALONE ARE NOT ENOUGH — `division_balance`
 *  learned this from a mutation that disabled a goal path, produced ~80% goalless matches, and passed
 *  every ceiling in the file perfectly. A flat curve at 0.0 has a beautiful spread ratio. */
const MIN_GOALS = 1.5;
/** The other end: an arcade blowout. 6.0 is `fuzz_test`'s original band ceiling, before it was widened
 *  to 8.0 in the same commit that broke it (§19). Today's worst point is 4.46. */
const MAX_GOALS = 6.0;

let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

console.log('quality  goals/match');
const rows: { q: number; gpm: number }[] = [];
for (const q of QS) {
  let g = 0;
  for (let i = 0; i < N; i++) {
    const a = generateTeam(`a${i}`, 'A', 0x1, q, i * 7 + 1, '4-4-2');
    const b = generateTeam(`b${i}`, 'B', 0x2, q, i * 11 + 3, '4-4-2');
    const m = new MatchEngine([a, b], i * 31 + 5, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
    while (!m.state.finished) m.tick();
    g += m.state.score[0] + m.state.score[1];
  }
  rows.push({ q, gpm: g / N });
  console.log(`  ${String(q).padStart(2)}     ${(g / N).toFixed(2).padStart(6)}`);
}

console.log('');
// CANNOT PASS BY DEFAULT. `division_balance` shipped with a `worst` record that started at zero and was
// only ever replaced by something bigger, so an engine that measured nothing at all passed every check.
// An empty or single-point sweep has no spread to measure and must be an error, not a pass.
if (rows.length !== QS.length || rows.length < 2) {
  console.log(`  FAIL the sweep measured ${rows.length} of ${QS.length} quality points — nothing to compare, so this is a failure and not a pass`);
  process.exit(1);
}

const lo = rows.reduce((a, b) => (b.gpm < a.gpm ? b : a));
const hi = rows.reduce((a, b) => (b.gpm > a.gpm ? b : a));
const spread = hi.gpm / Math.max(lo.gpm, 1e-6);

check(spread <= MAX_SPREAD,
  `the whole pyramid is one game: ${spread.toFixed(2)}x between q${hi.q} (${hi.gpm.toFixed(2)}) and q${lo.q} (${lo.gpm.toFixed(2)}), bar ${MAX_SPREAD.toFixed(2)}x — the reverted rebuild put 33x here`);
check(lo.gpm >= MIN_GOALS,
  `every rung of the pyramid still plays football: quietest is q${lo.q} at ${lo.gpm.toFixed(2)} goals/match, floor ${MIN_GOALS.toFixed(2)}`);
check(hi.gpm <= MAX_GOALS,
  `no rung is a shooting gallery: loudest is q${hi.q} at ${hi.gpm.toFixed(2)} goals/match, ceiling ${MAX_GOALS.toFixed(2)}`);

console.log(fails
  ? `\n✗ ${fails} quality-curve check(s) failed — squad quality no longer maps to results the way the shipped engine does. This is the §19 regression signature: check what changed in the match engine before changing this bar.`
  : `\n✓ goals/match holds together across the pyramid (${spread.toFixed(2)}x from best to worst rung)`);
if (fails) process.exit(1);
