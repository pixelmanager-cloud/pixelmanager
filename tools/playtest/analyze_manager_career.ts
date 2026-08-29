// Headless manager-career playtest probe. Simulates a full dynasty climb up the 10-tier pyramid over many
// managerial careers, using the shared season engine (seededLeague + seasonTable) and the game's real
// promotion/relegation rule (top 2 up, bottom 2 down). Measures the player-experience questions:
//   • is the climb from the basement to the top flight actually achievable in a career?
//   • does progress feel earned (strength → higher finish) rather than random?
//   • do you get stuck / yo-yo forever?
//   • once at the top, are titles a real but hard prize (not a coin-flip, not impossible)?
// Deterministic, browser-free. Run: npx tsx tools/playtest/analyze_manager_career.ts [N] [SEASONS]
import { seededLeague, seasonTable, TIERS } from '../../shared/src/clubseason.js';

const N = Number(process.argv[2] ?? 300);
const SEASONS = Number(process.argv[3] ?? 15);

const finish = (strength: number, tier: number, seed: number): number =>
  seasonTable(seededLeague('Bloodline FC', strength, seed, tier), seed).findIndex((r) => r.mine) + 1;

// a plausible club-strength arc for a dynasty that INVESTS its coins: a fresh club grows as the bloodline
// star develops, facilities improve, and (at the top tiers) title-contender signings become available —
// ramping from weak (~7) to a peak (~16) by late career. A club that doesn't invest peaks lower (~15).
const strengthAt = (season: number): number => {
  const ramp = 7 + season * 1.15;     // growth from facilities + the maturing star + top-tier signings
  return Math.max(5, Math.min(16, Math.round(ramp)));
};

let reachedTop = 0, titles = 0, topFlightSeasons = 0, stuck = 0;
const tierBySeasonEnd: number[] = [];
let secondsToTopSum = 0, reachedCount = 0;

for (let i = 0; i < N; i++) {
  let tier = TIERS; // start in the basement (tier 10)
  let everTop = false, firstTopSeason = -1, movesUp = 0;
  for (let s = 0; s < SEASONS; s++) {
    const seed = (((i + 1) * 2654435761) ^ (s * 40503)) >>> 0;
    const strength = strengthAt(s);
    const pos = finish(strength, tier, seed);
    if (tier === 1) { topFlightSeasons++; if (pos === 1) titles++; }
    // real promotion/relegation rule: top 2 up, bottom 2 down (size 10)
    if (pos <= 2 && tier > 1) { tier--; movesUp++; }
    else if (pos >= 9 && tier < TIERS) tier++;
    if (tier === 1 && !everTop) { everTop = true; firstTopSeason = s; }
  }
  tierBySeasonEnd.push(tier);
  if (everTop) { reachedTop++; secondsToTopSum += firstTopSeason + 1; reachedCount++; }
  if (movesUp === 0) stuck++; // never earned a single promotion across the whole career
}

const p = (x: number) => (100 * x / N).toFixed(0);
const avgEndTier = (tierBySeasonEnd.reduce((a, b) => a + b, 0) / N).toFixed(1);
const titleRateTop = topFlightSeasons ? (100 * titles / topFlightSeasons).toFixed(0) : '—';
console.log(`=== Manager-career playtest probe — ${N} careers × ${SEASONS} seasons (climb from tier ${TIERS}) ===\n`);
console.log(`  reached the top flight at least once: ${p(reachedTop)}%`);
console.log(`  avg seasons to first reach the top:   ${reachedCount ? (secondsToTopSum / reachedCount).toFixed(1) : '—'}`);
console.log(`  avg tier at career end:               ${avgEndTier}  (1 = top, ${TIERS} = basement)`);
console.log(`  never earned a single promotion:      ${p(stuck)}%`);
console.log(`  title rate while IN the top flight:    ${titleRateTop}%\n`);

const checks: Array<[string, boolean, string]> = [
  ['the climb to the top is achievable in a career (≥ 55%)', reachedTop / N >= 0.55, `${p(reachedTop)}%`],
  // ...but it must not be GUARANTEED. These one-sided "is it achievable?" checks passed at 100% while a live
  // playthrough went P18 W18 D0 L0 and every single simulated career ended in the top flight — the harness
  // reported "healthy" for a mode with no difficulty at all. A climb nobody can fail is not a climb. (PT-802)
  ['the climb is NOT guaranteed — some careers fall short (≤ 90%)', reachedTop / N <= 0.90, `${p(reachedTop)}%`],
  ['careers do not ALL end at the summit (avg end tier ≥ 1.5)', +avgEndTier >= 1.5, `${avgEndTier}`],
  ['progress is earned — few careers stay stuck (< 20%)', stuck / N < 0.20, `${p(stuck)}%`],
  ['top-flight titles are a real but hard prize (8–45%)', +titleRateTop >= 8 && +titleRateTop <= 45, `${titleRateTop}%`],
  ['careers end high on average (avg end tier ≤ 4)', +avgEndTier <= 4, `${avgEndTier}`],
];
let fails = 0;
console.log('=== manager-career verdict ===');
for (const [name, ok, val] of checks) { console.log(`  ${ok ? 'OK  ' : 'FLAG'} ${name}  (${val})`); if (!ok) fails++; }
console.log(fails ? `\n⚠ ${fails} concern(s) flagged` : `\n✓ manager-career climb reads healthy`);
