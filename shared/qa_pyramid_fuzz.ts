// Validates the 10-tier pyramid's difficulty curve + that the climb is actually feasible. Run standalone
// or via `npm run qa`. A club's finishing position must respond sensibly to its strength and its tier: a
// fresh graduate should climb out of the basement, a peak star should compete in the top flight, and weak
// clubs up top should face relegation — so the pyramid is a real growth arc, not a wall or a cakewalk.
import { seededLeague, seasonTable, tierStrength, TIERS } from './src/clubseason.js';

let failures = 0;
const check = (cond: boolean, msg: string) => { if (cond) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); failures++; } };

/** Full-season finishing position (1..10) for a club of `strength` at `tier`, seeded. */
function finish(strength: number, tier: number, seed: number): number {
  const clubs = seededLeague('Bloodline FC', strength, seed, tier);
  return seasonTable(clubs, seed).findIndex((r) => r.mine) + 1;
}
function avgFinish(strength: number, tier: number, seeds = 80): number {
  let s = 0; for (let i = 0; i < seeds; i++) s += finish(strength, tier, ((i + 1) * 2654435761) >>> 0);
  return s / seeds;
}

// 1. the tier strength curve
let mono = true;
for (let t = 2; t <= TIERS; t++) if (tierStrength(t) > tierStrength(t - 1)) mono = false;
check(mono, 'tierStrength decreases from tier 1 (elite) down to tier 10 (weak)');
check(tierStrength(1) >= 13 && tierStrength(TIERS) <= 6, `tier 1 elite (${tierStrength(1)}), tier 10 weak (${tierStrength(TIERS)}) — matches the club strength range ~9..15`);

// 2. at a fixed tier, a stronger club finishes higher
let strengthMono = true;
for (const tier of [3, 6, 9]) {
  const weak = avgFinish(9, tier), strong = avgFinish(16, tier);
  console.log(`  tier ${tier}: avg finish  S9=${weak.toFixed(1)}  S16=${strong.toFixed(1)}`);
  if (!(strong < weak - 0.5)) strengthMono = false;
}
check(strengthMono, 'a stronger club finishes clearly higher than a weaker one at the same tier');

// 3. the same club finishes worse in a higher (harder) tier
let tierMono = true;
for (const s of [12, 15]) {
  const bottom = avgFinish(s, 10), top = avgFinish(s, 1);
  console.log(`  strength ${s}: avg finish  tier10=${bottom.toFixed(1)}  tier1=${top.toFixed(1)}`);
  if (!(top > bottom + 1)) tierMono = false;
}
check(tierMono, 'the same club finishes worse in a higher tier (the climb gets harder)');

// 4. the climb is FEASIBLE and has stakes (club strength ranges ~9 fresh graduate … ~15 peak squad)
check(avgFinish(10, TIERS) <= 4, `a fresh graduate (S10) averages a promotion place at tier ${TIERS} (avg ${avgFinish(10, TIERS).toFixed(1)})`);
check(avgFinish(15, 1) <= 6, `a peak squad (S15) is competitive in the top flight (avg ${avgFinish(15, 1).toFixed(1)})`);
check(avgFinish(11, 1) >= 7, `a modest star (S11) struggles in the top flight — relegation pressure (avg ${avgFinish(11, 1).toFixed(1)})`);
// a club whose strength MATCHES its tier's baseline (tierStrength(5)=10 → S10 at tier 5) plateaus mid-table
// — neither promoted nor relegated: the stable level a club settles at until its star grows or declines
check(avgFinish(10, 5) >= 3 && avgFinish(10, 5) <= 8, `a club matched to its tier lands mid-table — a stable plateau (S10@tier5 avg ${avgFinish(10, 5).toFixed(1)})`);

// 5. determinism + bounds
check(finish(13, 5, 42) === finish(13, 5, 42), 'same inputs → same finish (deterministic)');
let bounded = true;
for (let t = 1; t <= TIERS; t++) for (const s of [6, 10, 14, 18]) { const p = finish(s, t, 777); if (p < 1 || p > 10) bounded = false; }
check(bounded, 'finishing position always within 1..10');

console.log(failures === 0 ? '\n✓ all pyramid checks passed' : `\n✗ ${failures} pyramid check(s) FAILED`);
if (failures > 0) process.exit(1);
