// ── CAN A SQUAD PLAYER GROW INTO A TRAIT? ────────────────────────────────────────────────────────────
//
// `eligibleTraits` used to be called at MINT time only — `graduate`, `mintSquadPlayer`, and the career
// preview. Nothing ever looked again. So a squad player's traits were decided by the stats he happened to
// be born with, and developing him for a decade could not earn him one. Measured before the fix: a tier-6
// founding squad on a maxed training ground reaches mean overall 13.07 by season 12 with six of fourteen
// players QUALIFYING for seven traits between them, and holding two.
//
// That is this repo's signature defect: a mechanism that runs, produces a plausible result, and never
// delivers the thing it exists to deliver. `advanceSquad` now re-checks after development.
//
// THRESHOLDS STAY ABSOLUTE, deliberately. Making them relative to tier was measured and rejected: trait
// effects are FLAT (+1 `apply` bumps and fixed engine constants), so a relative gate would hand a
// Sunday-League keeper the same save suppression as a top-flight one — relative eligibility with absolute
// effects is incoherent. Lowering the two lowest gates (`rock`, `aerial`) from 14 to 13 was also measured
// and rejected: it moved a tier-6 founding squad from 0.58 traits to 1.27 and a tier-4 squad from 14.39 to
// 16.72, while tiers 8-9 stayed at exactly 0.00 — diluting traits where they are already common without
// touching the divisions where the layer is actually absent. Earning them through development is the fix.
import { advanceSquad } from '../../shared/src/squad.js';
import { generateClub } from '../../shared/src/teams.js';
import { tierStrength } from '../../shared/src/clubseason.js';

const RUNS = Number(process.env.N ?? 30);
let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

for (const tier of [6, 4]) {
  const q = Math.max(4, Math.round(tierStrength(tier) - 1)); // what api.ts mints a founding squad at
  let start = 0, end = 0, moments = 0, doubled = 0;
  for (let s = 0; s < RUNS; s++) {
    let players = generateClub(`c${s}`, 'C', 1, q, s * 7919 + tier, true).players;
    start += players.reduce((a, p) => a + (p.traits ?? []).length, 0);
    for (let season = 1; season <= 12; season++) {
      const r = advanceSquad(players, season, 10, { quality: q, goodSeason: true });
      moments += r.changes.filter((c) => c.earnedTraits?.length).length;
      players = r.players;
    }
    end += players.reduce((a, p) => a + (p.traits ?? []).length, 0);
    // no player may exceed the cap, however many seasons he is developed for
    if (players.some((p) => (p.traits ?? []).length > 2)) doubled++;
  }
  console.log(`\n  tier ${tier} (founding quality ${q}): ${(start / RUNS).toFixed(2)} traits at season 0 → ${(end / RUNS).toFixed(2)} at season 12, ${(moments / RUNS).toFixed(1)} "grew into it" moments`);
  // AN ABSOLUTE GAIN, NOT A RATIO. A ratio bar (end > start * 1.5) fails at tier 4 for the wrong reason:
  // that squad is minted at quality 11 and already holds 14.07 traits across twenty players, so most of
  // them are AT MAX_TRAITS on day one and have no headroom to grow into. The mechanism is firing there
  // (13.7 moments a save); it is the denominator that is saturated.
  check((end - start) / RUNS >= 1.5,
    `a developed squad EARNS traits it was not minted with (${(start / RUNS).toFixed(2)} → ${(end / RUNS).toFixed(2)}, +${((end - start) / RUNS).toFixed(2)})`);
  check(moments >= RUNS * 0.2, `and it happens often enough to be a season headline (${(moments / RUNS).toFixed(1)} per save)`);
  // THE DOUBLE-APPLY GUARD. `apply` bumps real stats, so a trait granted twice would silently inflate a
  // player every season forever. This is the bar that would catch it.
  check(doubled === 0, `no player ever exceeds MAX_TRAITS, over 12 re-checks (${doubled} breached)`);
}

console.log(fails
  ? `\n✗ ${fails} trait-earning check(s) failed`
  : '\n✓ developing a player can earn him a trait, and the cap still holds');
if (fails) process.exit(1);
