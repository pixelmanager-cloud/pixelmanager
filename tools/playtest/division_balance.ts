// ── THE FIXTURE THE PYRAMID ACTUALLY STAGES ──────────────────────────────────────────────────────────
//
// Every calibration gate in this project measured EQUAL squads. `strategy_test`'s goals/match check is
// 13 v 13; the quality sweep added during the rebuild is q v q at each point; `fuzz_test` samples quality
// uniformly over [3,20], which is dominated by pairings the game never creates. Not one of them looks at
// the fixture the league generates every single week.
//
// `seededOpponents` sets each club to `tierStrength(tier) + (hash % 7) - 3` (clubseason.ts). That is a
// SIX-POINT spread INSIDE one division: tier 1 fields clubs at 13 and 19, tier 5 at 7 and 13, tier 8 at
// 3 and 9. The top club plays the bottom club twice a season, in every division, forever.
//
// Measured on that fixture, the engine rebuild took it from a 2.7-0.1 win to a 6.2-0.1 win, and from 5%
// of matches won by six or more to 53%. Every gate stayed green — and the one gate that did break,
// `fuzz_test`'s goals/match band, was widened from 6.0 to 8.0 in the same commit that broke it, on the
// stated grounds that "a division's clubs sit within about 1.3 of tierStrength of each other." That is
// the gap BETWEEN adjacent tiers. Within a division it is six.
//
// So this asserts the thing a player would actually notice: a league in which the good side beats the
// poor side 6-0 most weeks is not a league. Real football's widest ordinary mismatch is not a 6-0 habit.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import { tierStrength, TIERS, seededOpponents } from '../../shared/src/clubseason.js';

const N = Number(process.env.N ?? 150);
let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

/** The strongest and weakest club a division ACTUALLY generates — measured by asking `seededOpponents`,
 *  not by restating its arithmetic.
 *
 *  This was `const SPREAD = 3`, a local copy of the `(hash % 7) - 3` inside `clubseason.ts`. A mutation
 *  test widened the real draw to +/-8 and this probe's output was BYTE-IDENTICAL, because it never called
 *  the function it exists to measure. That is the same defect as the manager-career probe that modelled
 *  club strength with a straight line: a gate that re-derives its fixture from a copy of the thing under
 *  test cannot see the thing under test change. */
function measuredSpread(tier: number, samples = 400): number {
  let widest = 0;
  for (let s = 0; s < samples; s++) {
    const clubs = seededOpponents('Mine', s * 7919 + 13, tier);
    if (!clubs.length) continue;
    const strengths = clubs.map((c) => c.strength);
    widest = Math.max(widest, (Math.max(...strengths) - Math.min(...strengths)) / 2);
  }
  return Math.max(1, Math.round(widest));
}

function fixture(qa: number, qb: number) {
  let gd = 0, gf = 0, ga = 0, big = 0, wins = 0;
  for (let i = 0; i < N; i++) {
    const a = generateTeam('a', 'A', 'A', 0x1, qa, i * 7 + 1, '4-4-2');
    const b = generateTeam('b', 'B', 'B', 0x2, qb, i * 11 + 3, '4-4-2');
    const m = new MatchEngine([a, b], i * 31 + 5, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
    while (!m.state.finished) m.tick();
    const d = m.state.score[0] - m.state.score[1];
    gd += d; gf += m.state.score[0]; ga += m.state.score[1];
    if (d >= 6) big++;
    if (d > 0) wins++;
  }
  return { gd: gd / N, gf: gf / N, ga: ga / N, big: big / N, win: wins / N };
}

console.log(`[division-balance] top club vs bottom club of the SAME division, n=${N} each\n`);
console.log('  tier  strength      fixture      GD     scoreline    won by 6+   fav win%');

// EVERY tier, not a sample of five. The first version tested 1, 3, 5, 8 and 10 — and the mismatch is an
// inverted U, because the clamp on `seededOpponents` compresses both ends of the range. The peak sits at
// tier 6, which was never measured. A gate that samples around a maximum and reports the samples is the
// same defect as the goals/match gate that measured one squad quality and called it the pyramid.
const rows: { tier: number; gf: number; ga: number }[] = [];
let worstThrash = { tier: 0, v: -1 };
let worstMargin = { tier: 0, v: -1 };
for (let tier = 1; tier <= TIERS; tier++) {
  const base = tierStrength(tier);
  const spread = measuredSpread(tier);
  const hi = Math.max(3, Math.min(20, Math.round(base + spread)));
  const lo = Math.max(3, Math.min(20, Math.round(base - spread)));
  const r = fixture(hi, lo);
  console.log(`   ${String(tier).padStart(2)}    ${base.toFixed(1).padStart(4)}      ${hi} v ${String(lo).padEnd(2)}   ${r.gd >= 0 ? '+' : ''}${r.gd.toFixed(2).padStart(5)}   ${r.gf.toFixed(2)}-${r.ga.toFixed(2)}      ${(100 * r.big).toFixed(0).padStart(3)}%       ${(100 * r.win).toFixed(0)}%`);
  // TRACKED INDEPENDENTLY. These used to share one `worst` record, so the margin assertion reported the
  // margin of the worst-THRASHING tier rather than the worst margin — and because that record started at
  // `{big: 0, gd: 0}` and was only replaced when a tier beat it, an engine that won 5-0 in every division
  // and never once by six left the placeholder in place and passed both checks while violating the stated
  // bound by 25%. An engine that never scored at all also passed.
  rows.push({ tier, gf: r.gf, ga: r.ga });
  if (r.big > worstThrash.v) worstThrash = { tier, v: r.big };
  if (Math.abs(r.gd) > worstMargin.v) worstMargin = { tier, v: Math.abs(r.gd) };
}

console.log('');
if (worstThrash.tier === 0 || worstMargin.tier === 0) {
  console.log('  FAIL no division was measured at all — the gate cannot pass by default');
  process.exit(1);
}
// A six-goal win is a thrashing. It happens in real leagues; it is not most weeks. The pre-rebuild engine
// this bar is calibrated against produces it in 1-7% of top-vs-bottom fixtures; the rebuilt one made it 53%.
// UPPER BOUNDS ONLY WAS NOT ENOUGH. A mutation that disabled one of the engine's four goal paths — average
// scoreline 0.41-0.01, about 80% goalless — passed both of these perfectly, because a league in which
// nobody scores is never a thrashing and never a wide margin. A football match has goals in it.
const goalsPerFixture = rows.reduce((a, r) => a + r.gf + r.ga, 0) / rows.length;
check(goalsPerFixture >= 1.2,
  `the widest league fixture is still a football match (${goalsPerFixture.toFixed(2)} goals in it, not a goalless procession)`);
check(worstThrash.v <= 0.15,
  `a top-vs-bottom fixture is a thrashing at most 15% of the time (worst: tier ${worstThrash.tier}, ${(100 * worstThrash.v).toFixed(0)}%)`);
check(worstMargin.v <= 4.0,
  `the widest ordinary league fixture stays inside 4 goals of average margin (worst: tier ${worstMargin.tier}, ${worstMargin.v.toFixed(2)})`);

console.log(fails
  ? `\n✗ ${fails} division-balance check(s) failed — the league the game actually generates is not competitive`
  : '\n✓ the fixture the pyramid stages every week is a football match');
if (fails) process.exit(1);
