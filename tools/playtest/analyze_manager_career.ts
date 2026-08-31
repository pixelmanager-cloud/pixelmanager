// ── WHAT THIS FILE IS ALLOWED TO ASSERT ───────────────────────────────────────────────────────────────
//
// This probe used to end in six OK/FLAG lines and `console.log`. It never set an exit code, so the build
// could not tell six passes from six failures — the same defect §36 of docs/decisions-for-ck.md found in
// `manager_career_real.ts`, `settings_persist.ts`, `objectives.ts` and `arc_windows.ts`.
//
// Arming those six checks as they stood would have been WORSE than leaving the hole. All six were computed
// downstream of `strengthAt` — a hand-written straight line with an invented per-save "investment rate".
// There is no such formula anywhere in the game. A club's real league strength is the weighted average
// overall of its best eleven, out of a squad bought with coins it actually earned, that ages, needs
// re-signing, and decays if the training ground is not paid for. Modelling that as `7 + season * invest` is
// why this file reports a 31% top-flight title rate where a critic driving the real economy measured
// 57-74% (docs/decisions-for-ck.md §9), and why PT-905 found its own `strengthAt` made failure
// mathematically impossible. Putting a gate on those numbers would mean a future correction to the REAL
// season engine could only be landed by first satisfying a fiction — which is how you get someone
// "fixing" shipped code to keep a fake climb green.
//
// So the file is split, and only one half is a gate:
//
//   PART 1 — GATED. The season engine itself: `seededLeague` + `seasonTable` + the pyramid's promotion
//            rule, swept across every tier and a range of strength edges. No hand-written trajectory is
//            involved: the club's strength is measured RELATIVE TO THE DIVISION THE GAME GENERATES, by
//            asking `seededOpponents` rather than by restating its arithmetic (the same discipline
//            `division_balance.ts` adopted after a mutation test walked straight through its copied
//            `SPREAD = 3`). Everything asserted below is a property of shipped code.
//
//   PART 2 — NOT GATED, and says so. The old career-climb model, kept because it is cheap and its SHAPE
//            questions are worth glancing at, but printed as bare diagnostics with no OK/FLAG pills. The
//            gate for "is the climb achievable / does anyone get stuck / are titles a real prize" is
//            `tools/playtest/manager_career_real.ts`, which drives client/src/api.ts against an in-memory
//            backend with real coins, wages, aging, transfers and facility upkeep. That is the number.
//
// Deterministic, browser-free. Run: npx tsx tools/playtest/analyze_manager_career.ts [N] [SEASONS]
import { seededLeague, seededOpponents, seasonTable, tierStrength, TIERS } from '../../shared/src/clubseason.js';

const N = Number(process.argv[2] ?? 300);
const SEASONS = Number(process.argv[3] ?? 15);
/** Seasons simulated per (tier, edge) cell of the response sweep. Fixed rather than derived from N so the
 *  gated half cannot be quietly re-scaled by the caller. 250 x 10 tiers x 9 edges = 22,500 seasons, ~1.5s.
 *  Re-measured at 150/250/400: every asserted statistic below moves by under 2 points across that range. */
const CURVE_SEEDS = Number(process.env.CURVE_SEEDS ?? 250);

let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

const finish = (strength: number, tier: number, seed: number): number =>
  seasonTable(seededLeague('Bloodline FC', strength, seed, tier), seed).findIndex((r) => r.mine) + 1;

// ══ PART 1 — THE SEASON ENGINE'S RESPONSE TO STRENGTH (GATED) ═════════════════════════════════════════
//
// "Does progress feel earned rather than random?" is the only one of this probe's four original questions
// that can be answered without a club-strength trajectory: hold the club at a known edge over the division
// and ask where the table puts it. PT-905's audit measured exactly this and marked it VERIFIED ALREADY
// WELL-TUNED, DO NOT TOUCH — a graded reward for investment, a knife-edge at parity. Nothing gates it.
// It does now.

/** The mean strength of the nine clubs the game ACTUALLY generates at this tier, measured by calling
 *  `seededOpponents`. Not `tierStrength(tier)`: that is the pre-clamp baseline, and at the ends of the
 *  pyramid the `clamp(..., 3, 20)` inside `seededOpponents` bites — tier 10's baseline is 3.8 but the
 *  division it fields averages 4.4. An edge measured against the baseline would be measuring the clamp. */
const meanOpponent = (tier: number, samples = 200): number => {
  let sum = 0, n = 0;
  for (let k = 0; k < samples; k++) for (const c of seededOpponents('Bloodline FC', (k * 7919 + 13) >>> 0, tier)) { sum += c.strength; n++; }
  return sum / n;
};

const EDGES = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
const iOf = (e: number) => EDGES.indexOf(e);
const promo: number[][] = [], releg: number[][] = [], meanPos: number[][] = [];
let cells = 0, offTable = 0;

console.log(`=== Manager-career probe — PART 1: the season engine's response to strength (GATED) ===`);
console.log(`    ${CURVE_SEEDS} seasons per cell; "edge" = club strength minus the MEASURED mean of its division\n`);
console.log('  tier  baseline  division  |  promotion% (top 2) at edge  -4  -3  -2  -1  +0  +1  +2  +3  +4');

for (let tier = 1; tier <= TIERS; tier++) {
  const mo = meanOpponent(tier);
  const pr: number[] = [], re: number[] = [], mp: number[] = [];
  for (const e of EDGES) {
    let up = 0, down = 0, sum = 0;
    for (let k = 0; k < CURVE_SEEDS; k++) {
      const seed = (k * 2654435761) >>> 0;
      const pos = finish(mo + e, tier, seed);
      // `findIndex` returns -1 when the club is missing from its own table, and -1 + 1 = 0 reads as a
      // PROMOTION under `pos <= 2`. A silent name collision in `seededOpponents` would therefore show up
      // as a perfect climb rather than as an error. Counted, and gated below.
      if (pos < 1 || pos > 10) offTable++;
      sum += pos; if (pos <= 2) up++; if (pos >= 9) down++;
    }
    pr.push(100 * up / CURVE_SEEDS); re.push(100 * down / CURVE_SEEDS); mp.push(sum / CURVE_SEEDS); cells++;
  }
  promo.push(pr); releg.push(re); meanPos.push(mp);
  console.log(`   ${String(tier).padStart(2)}     ${tierStrength(tier).toFixed(1).padStart(4)}      ${mo.toFixed(2).padStart(5)}  |                          ${pr.map((v) => String(Math.round(v)).padStart(4)).join('')}`);
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const col = (m: number[][], e: number) => m.map((r) => r[iOf(e)]);
const parityUp = avg(col(promo, 0)), parityDown = avg(col(releg, 0));
const up3 = avg(col(promo, 3)), up4 = avg(col(promo, 4)), down3 = avg(col(releg, -3));
const p2 = col(promo, 2), p2spread = Math.max(...p2) - Math.min(...p2);

// The smallest improvement in mean finishing position bought by one extra point of strength, taken over
// every tier and every adjacent pair of edges (72 steps). The MINIMUM, not the average: an engine that
// responds beautifully in nine divisions and goes flat in the tenth is the "pyramid was three different
// games" defect (docs/decisions-for-ck.md §7) and an average would hide it.
let worstStep = Infinity, worstAt = '';
for (let t = 0; t < TIERS; t++) for (let i = 1; i < EDGES.length; i++) {
  const step = meanPos[t][i - 1] - meanPos[t][i];   // positive = a stronger club finishes higher
  if (step < worstStep) { worstStep = step; worstAt = `tier ${t + 1}, edge ${EDGES[i - 1]}→${EDGES[i]}`; }
}

console.log(`\n  pooled over all ten tiers:`);
console.log(`    at parity:  promoted ${parityUp.toFixed(1)}%   relegated ${parityDown.toFixed(1)}%   mean finish ${avg(col(meanPos, 0)).toFixed(2)}`);
console.log(`    +3 clear:   promoted ${up3.toFixed(1)}%      +4 clear: ${up4.toFixed(1)}%      -3 adrift: relegated ${down3.toFixed(1)}%`);
console.log(`    weakest response to +1 strength: ${worstStep.toFixed(3)} places (${worstAt})`);
console.log(`    promotion at +3 vs at parity:    ${(up3 / Math.max(0.01, parityUp)).toFixed(2)}x`);
console.log(`    spread of the +2 promotion rate across the ten divisions: ${p2spread.toFixed(1)}pts\n`);

console.log('=== season-engine verdict (GATED) ===');

// ── The bars. Every one is set from what the engine measures TODAY, with room, and every one would have
// to be a real regression to trip. Today's values are in the comment beside each.

// A gate that measured nothing must not pass by default — division_balance.ts had exactly this hole.
check(cells === TIERS * EDGES.length,
  `every division was measured (${cells}/${TIERS * EDGES.length} cells)`);
check(offTable === 0,
  `the club appears in its own league table every season (${offTable} seasons off the table)`);

// today 0.540 places per point of strength, at its weakest tier. Flat (≤ 0) would mean the pyramid no
// longer rewards a better squad at all; 0.25 is "still clearly graded everywhere", at ~2.2x headroom.
check(worstStep >= 0.25,
  `one more point of squad strength is worth a place in EVERY division (weakest: ${worstStep.toFixed(3)} places at ${worstAt}, floor 0.25)`);

// today 14.7% up / 13.7% down. PT-905 called this "a genuinely knife-edge mid-table" and marked it
// do-not-touch. Both bounds matter: below the floor a parity club is stranded, above the ceiling the
// division stops being a contest and the climb becomes a formality (the PT-802 lesson — one-sided
// "is it achievable?" checks passed at 100% while every simulated career ended at the summit).
check(parityUp >= 6 && parityUp <= 26,
  `a club level with its division is on a knife-edge, not walking it (promoted ${parityUp.toFixed(1)}% of seasons, band 6-26%)`);
check(parityDown >= 5 && parityDown <= 26,
  `...and can still go DOWN (relegated ${parityDown.toFixed(1)}% of seasons, band 5-26%)`);

// today 54.4% and 3.71x. Investment has to buy something, or the ladder is decoration. Asserted as a
// ratio as well as a floor: an absolute threshold alone is scale-dependent, so rebalancing promotion
// rates downward across the board would flag a game that had not got worse (the PT-706 lesson).
check(up3 >= 35,
  `a club three points clear of its division usually goes up (${up3.toFixed(1)}%, floor 35%)`);
check(up3 >= parityUp * 2.0,
  `strength PAYS — +3 promotes far more often than parity (${(up3 / Math.max(0.01, parityUp)).toFixed(2)}x, floor 2.0x)`);

// today 68.0%. The other side of the same coin: a strong squad must not make the season a formality.
check(up4 <= 90,
  `...but even +4 does not GUARANTEE promotion (${up4.toFixed(1)}%, ceiling 90%)`);

// today 53.5%. Neglect has to be punished, or relegation is a threat the engine never carries out.
check(down3 >= 25,
  `a club three points adrift is in real relegation trouble (${down3.toFixed(1)}%, floor 25%)`);

// today 8.8pts. THE PYRAMID MUST BE ONE GAME. §7 of decisions-for-ck.md is a 33-fold goals/match spread
// across the tiers that every gate missed because each gate measured a single squad quality; this is the
// same failure expressed on the season engine — the same investment buying wildly different odds
// depending on which division you happen to be in.
check(p2spread <= 20,
  `+2 of strength buys the same odds in every division (promotion rate spread ${p2spread.toFixed(1)}pts across the ten tiers, ceiling 20pts)`);

// ══ PART 2 — THE OLD CLIMB MODEL (DIAGNOSTIC ONLY — NOT A GATE, DELIBERATELY) ═════════════════════════
//
// ⚠ EVERY NUMBER BELOW COMES OUT OF A HAND-WRITTEN STRENGTH CURVE THE GAME DOES NOT HAVE. It is printed
// without OK/FLAG pills and without an exit code on purpose: giving it a bar would gate the build on a
// fiction. `manager_career_real.ts` answers all four of these questions against the real economy and IS
// gated. If this block ever disagrees loudly with that one, believe that one.
const strengthAt = (season: number, seed = 0): number => {
  const invest = 0.25 + (((seed >>> 5) % 100) / 100) * 1.25;
  return Math.max(5, Math.min(19, Math.round(7 + season * invest)));
};

let reachedTop = 0, titles = 0, topFlightSeasons = 0, stuck = 0, endTierSum = 0;
let seasonsToTopSum = 0, reachedCount = 0;
for (let i = 0; i < N; i++) {
  let tier = TIERS, everTop = false, firstTopSeason = -1, movesUp = 0;
  for (let s = 0; s < SEASONS; s++) {
    const seed = (((i + 1) * 2654435761) ^ (s * 40503)) >>> 0;
    const pos = finish(strengthAt(s, ((i + 1) * 2654435761) >>> 0), tier, seed);
    if (tier === 1) { topFlightSeasons++; if (pos === 1) titles++; }
    if (pos <= 2 && tier > 1) { tier--; movesUp++; }
    else if (pos >= 9 && tier < TIERS) tier++;
    if (tier === 1 && !everTop) { everTop = true; firstTopSeason = s; }
  }
  endTierSum += tier;
  if (everTop) { reachedTop++; seasonsToTopSum += firstTopSeason + 1; reachedCount++; }
  if (movesUp === 0) stuck++;
}
const p = (x: number) => (100 * x / N).toFixed(0);
console.log(`\n=== PART 2: the old straight-line climb model — DIAGNOSTIC ONLY, NOT GATED ===`);
console.log(`    ${N} careers x ${SEASONS} seasons from tier ${TIERS}, on a club-strength curve that exists nowhere in the game.`);
console.log(`    The gate for these four questions is tools/playtest/manager_career_real.ts (real coins, wages, aging, transfers).\n`);
console.log(`  reached the top flight at least once: ${p(reachedTop)}%   (real economy: 90%)`);
console.log(`  avg seasons to first reach the top:   ${reachedCount ? (seasonsToTopSum / reachedCount).toFixed(1) : '—'}`);
console.log(`  avg tier at career end:               ${(endTierSum / N).toFixed(1)}  (1 = top, ${TIERS} = basement)`);
console.log(`  never earned a single promotion:      ${p(stuck)}%`);
console.log(`  title rate while IN the top flight:   ${topFlightSeasons ? (100 * titles / topFlightSeasons).toFixed(0) : '—'}%   ← known WRONG; the real economy gives 57-74% (decisions-for-ck.md §9)`);

console.log(fails
  ? `\n✗ ${fails} season-engine check(s) failed — the pyramid no longer rewards a better squad the way it did`
  : `\n✓ the season engine grades the pyramid by strength (part 2 is diagnostic and gates nothing)`);
if (fails) process.exit(1);
