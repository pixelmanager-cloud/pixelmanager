// THE GATE'S OWN PARSER, TESTED -- because the gate is the thing that catches everything else.
//
// `npm run gate` was `verify && playtest && qa`, and `verify` ends in a leg that exits 1 BY DESIGN (four
// strategy_test assertions documented in section 68 as permanently red). A POSIX && chain short-circuits, so
// playtest and qa had not run from that command since the redness was accepted -- nor had the fourteen
// verify legs sitting after `test:engine` in its own chain. CI had the same shape, and agent/run.sh used
// `if ! npm run verify` as its authoritative gate, so the overnight runner deleted its branch and opened no
// PR on every single run.
//
// The runner now judges against a committed baseline of accepted failures. Its FIRST collector recorded the
// four strategy_test assertions, silently missed both qa reds, and would therefore have printed PASSED with
// qa exiting 1 -- a gate that could not fail, which is the exact class it exists to catch. This harness
// exists so that cannot happen again quietly.
import { collect, norm } from '../scripts/gate-parse.mjs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const has = (s: Set<string>, sub: string) => [...s].some((x) => x.includes(sub));

console.log('=== the gate parser sees every leg\'s failure shape ===');

// 1. verify / strategy_test: a bare assertion line
{
  const s = collect("ENGINE REGRESSION — assertions failed:\n  ✗ 4-2-2-2's second striker should beat 4-1-4-1's shape (got 7 vs 34)\n");
  ok(s.size === 1, `a verify assertion yields one identity (got ${s.size})`);
  ok(has(s, "4-2-2-2's second striker"), 'and it keeps the assertion text');
}

// 2. THE REGRESSION. qa names the failing harness on its own line; the runner's first collector dropped
//    both of these and reported a green gate while qa exited 1.
{
  const s = collect('── shared/qa_matchstats.ts … FAIL (3.5s)\n✗ 1 matchstats check(s) failed — the post-match report does not describe the match\n');
  ok(has(s, 'harness shared/qa_matchstats.ts'), 'a failing qa harness is identified by name');
  ok(s.size >= 1, `and a qa failure is never invisible (got ${s.size})`);
}

// 2b. THE SECOND REGRESSION. Harness-level identity is not enough: qa_matchstats swapped which of its own
//     checks was red and the gate reported PASSED, because "harness shared/qa_matchstats.ts" was unchanged.
{
  const s = collect('── shared/qa_matchstats.ts … FAIL (3.5s)\n  FAIL the strong side at HOME outscores the weak one several times over  (164-57)\n  ok   real goalless matches occur  (5/120)\n');
  ok(has(s, 'the strong side at HOME outscores'), 'the individual failing assertion inside a qa harness is captured');
  ok(![...s].some((x) => x.includes('goalless')), 'and a PASSING check in the same output is not');
}

// 3. playtest names the failing probe
{
  const s = collect('[playtest] ✗ golden_replay.ts FAILED (exit 1, 0.4s)\n');
  ok(has(s, 'probe golden_replay.ts'), 'a failing playtest probe is identified by name');
}

// 4. Roll-ups restate what is already captured and carry counts that drift. They must not become identities
//    of their own, or the baseline churns every time a count changes.
{
  const s = collect('✗ 2/40 QA harness(es) FAILED: shared/qa_matchstats.ts, shared/qa_mental.ts\n✗ 1 probe(s) failed\n');
  ok(s.size === 0, `count roll-ups add no identity of their own (got ${s.size})`);
}

// 5. A GREEN RUN MUST PRODUCE NOTHING. If ok-lines leaked in, the baseline would swallow the whole suite and
//    the gate could never fail again.
{
  const s = collect('  ok   a top-vs-bottom fixture is a thrashing at most 15% of the time (worst: tier 4, 15%)\n✓ all 53 probes passed\n=== Wiring ===\n');
  ok(s.size === 0, `passing output yields no failure identities (got ${s.size})`);
}

// 6. Measured numbers drift between runs; the same assertion must stay ONE identity or the baseline rots.
{
  const a = norm('wide-playmaker should generate more shots than ball-winner in the wide slot (got 588 vs 602)');
  const b = norm('wide-playmaker should generate more shots than ball-winner in the wide slot (got 591 vs 604)');
  ok(a === b, 'the same assertion with different measurements is one identity');
  ok(a.length > 20, 'and normalising does not gut the text to nothing');
}

// 6b. MEASUREMENTS NEST. qa_mental prints "(1.07 goals/match (GD 0.86 vs -0.21))". One pass of a
//     non-nested-paren strip removes only the inner group and leaves "(1.07 goals/match )" -- still holding
//     a number that drifts -- so the baseline entry never matched again and the gate reported the SAME
//     assertion as both "now passes" and "new failure" in a single run.
{
  const a = norm('swings goal difference by 2+ a match  (1.07 goals/match (GD 0.86 vs -0.21))');
  const b = norm('swings goal difference by 2+ a match  (1.21 goals/match (GD 0.91 vs -0.30))');
  ok(a === b, 'a nested measurement is stripped entirely, not just its inner group');
  // Digits inside the assertion's own words ("by 2+ a match") are text, not measurement -- only the
  // parenthesised groups are stripped.
  ok(!/[()]/.test(a), `and no parenthesised measurement survives (${a})`);
}

// 7. Two DIFFERENT assertions must not collapse together -- otherwise a new failure could hide behind an
//    accepted one.
{
  ok(norm('wide-playmaker should beat box-to-box (a)') !== norm('wide-playmaker should beat ball-winner (b)'),
    'different assertions stay distinct after normalising');
}

console.log(fails ? `\n✗ ${fails} gate-parser check(s) failed` : `\n✓ the gate can see every kind of failure it must catch`);
if (fails) process.exitCode = 1;
