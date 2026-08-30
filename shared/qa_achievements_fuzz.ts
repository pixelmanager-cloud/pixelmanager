// Sanity harness for the achievements definitions (shared/src/achievements.ts). Run standalone or via
// `npm run qa`. Checks: unique ids, a zero snapshot earns nothing, a maxed snapshot earns everything, and
// evaluation is MONOTONIC — bumping any single progress field never *removes* an already-earned achievement
// (a regression guard against a predicate accidentally using the wrong comparison direction).
import { ACHIEVEMENTS, evaluateAchievements, type AchSnapshot } from './src/achievements.js';

let failures = 0;
const check = (cond: boolean, msg: string) => { if (cond) { console.log(`  ok   ${msg}`); } else { console.log(`  FAIL ${msg}`); failures++; } };

const ZERO: AchSnapshot = { leagueTitles: 0, contTitles: 0, wcWins: 0, wcFinals: 0, seasons: 0, wins: 0, prestigeIdx: 0, generation: 0, legends: 0, topLegendRating: 0, graduated: 0, topTier: 0, promotions: 0 };
const MAX: AchSnapshot = { leagueTitles: 99, contTitles: 99, wcWins: 99, wcFinals: 99, seasons: 999, wins: 9999, prestigeIdx: 8, generation: 20, legends: 99, topLegendRating: 100, graduated: 99, topTier: 20, promotions: 20 };
const FIELDS = Object.keys(ZERO) as Array<keyof AchSnapshot>;

// unique ids
// THE FIXTURES MUST COVER EVERY FIELD. This suite went red the moment `promotions` was added to
// AchSnapshot, because a missing field reads undefined and every comparison against it is false — an
// achievement silently becomes unearnable. tsx does not typecheck, so nothing caught it. Now the next
// field added fails HERE, with a name, instead of as a mystery count mismatch.
check(FIELDS.every((f) => typeof MAX[f] === 'number' && typeof ZERO[f] === 'number'),
  `ZERO/MAX fixtures cover every AchSnapshot field (missing: ${FIELDS.filter((f) => typeof MAX[f] !== 'number' || typeof ZERO[f] !== 'number').join(', ') || 'none'})`);
check(new Set(ACHIEVEMENTS.map((a) => a.id)).size === ACHIEVEMENTS.length, 'all achievement ids are unique');
// every achievement has non-empty name/desc/icon
check(ACHIEVEMENTS.every((a) => a.name && a.desc && a.icon), 'every achievement has name + desc + icon');
// zero earns nothing, max earns everything
check(evaluateAchievements(ZERO).length === 0, 'a zero-progress snapshot earns no achievements');
check(evaluateAchievements(MAX).length === ACHIEVEMENTS.length, 'a maxed snapshot earns every achievement');

// MONOTONICITY: from many random snapshots, bumping any one field up never drops an earned achievement.
function rngSnap(seed: number): AchSnapshot {
  let h = (seed * 2654435761) >>> 0;
  const nx = (n: number) => { h = (h ^ (h << 13)) >>> 0; h = (h ^ (h >>> 17)) >>> 0; h = (h ^ (h << 5)) >>> 0; return h % n; };
  return { leagueTitles: nx(12), contTitles: nx(5), wcWins: nx(4), wcFinals: nx(5), seasons: nx(60), wins: nx(400), prestigeIdx: nx(9), generation: nx(7), legends: nx(8), topLegendRating: nx(101), graduated: nx(8), topTier: nx(11), promotions: nx(9) };
}
let monoOk = true;
for (let s = 0; s < 3000 && monoOk; s++) {
  const base = rngSnap(s + 1);
  const before = new Set(evaluateAchievements(base));
  for (const f of FIELDS) {
    const bumped = { ...base, [f]: (base[f] as number) + 1 };
    const after = new Set(evaluateAchievements(bumped));
    for (const id of before) if (!after.has(id)) { monoOk = false; console.log(`  FAIL monotonicity broke bumping ${String(f)} at seed ${s}: lost "${id}"`); break; }
    if (!monoOk) break;
  }
}
check(monoOk, 'evaluation is monotonic — more progress never un-earns an achievement (3000 seeds × every field)');

console.log(failures === 0 ? '\n✓ all achievements checks passed' : `\n✗ ${failures} achievements check(s) FAILED`);
if (failures > 0) process.exit(1);
