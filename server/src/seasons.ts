// Seasons & divisions — Phase A (time-boxed seasons) + Phase B (division pyramid
// + ~POD_SIZE-club pods + promotion/relegation). Standings are always scoped to a
// player's pod, so a table is a legible ~20-row race no matter the population.
// See docs/seasons-and-divisions.md.
import { randomUUID } from 'node:crypto';
import type { Store, Season, PodRef } from './store.js';
import { buildTable } from './game.js';

const SEASON_MS = Math.max(1, Number(process.env.SEASON_DAYS ?? 7)) * 24 * 60 * 60 * 1000;
export const POD_SIZE = Math.max(2, Number(process.env.POD_SIZE ?? 20));
export const PROMOTE = 3;
export const RELEGATE = 3;

/** Bottom → top. A pure config array; resize freely (see the design doc). */
export const TIERS = [
  'SUNDAY LEAGUE', 'COUNTY', 'REGIONAL', 'NATIONAL', 'LEAGUE TWO',
  'LEAGUE ONE', 'CHAMPIONSHIP', 'PREMIER', 'CONTINENTAL', 'WORLD CLASS',
] as const;
const BOTTOM = TIERS[0];

/**
 * Return the active season, creating the first one on demand and rolling an
 * expired season over (archive + open the next) before returning it. Lazy on
 * request — no cron. Server wall-clock only (seasons are bookkeeping around
 * matches, never inside the deterministic engine).
 */
export async function ensureSeason(db: Store, now: number): Promise<Season> {
  let s = await db.currentSeason();
  if (!s) return db.createSeason(randomUUID(), 1, now, now + SEASON_MS);
  if (now >= s.endsAt) {
    await rollover(db, s, now);
    s = await db.createSeason(randomUUID(), s.number + 1, now, now + SEASON_MS);
  }
  return s;
}

/** Force the current season to close and a fresh one to open (ops/testing). */
export async function forceRollover(db: Store, now: number): Promise<Season> {
  const s = await db.currentSeason();
  if (s) await rollover(db, s, now);
  return db.createSeason(randomUUID(), (s?.number ?? 0) + 1, now, now + SEASON_MS);
}

/**
 * Ensure the account is placed in a pod for the active season. Placement: their
 * persistent tier (promotion/relegation progress; new players start at the bottom),
 * dropped into the first pod with room, else a fresh pod. Idempotent.
 */
export async function ensurePod(db: Store, season: Season, accountId: string): Promise<PodRef> {
  const existing = await db.podOf(season.id, accountId);
  if (existing) return existing;
  const tier = await db.accountTier(accountId);
  const counts = await db.tierPodCounts(season.id, tier);
  let pod = 0;
  for (; ; pod++) {
    const c = counts.find((x) => x.pod === pod);
    if (!c || c.count < POD_SIZE) break; // first pod with a free slot (or a brand-new pod)
  }
  await db.assignPod(season.id, accountId, tier, pod);
  return { tier, pod };
}

/** Results among a specific set of accounts (a pod), so standings never leak cross-pod. */
export function resultsAmong(results: Array<{ home_id: string; away_id: string; home_score: number; away_score: number }>, ids: Set<string>) {
  return results.filter((r) => ids.has(r.home_id) && ids.has(r.away_id));
}

/**
 * Archive a finished season pod-by-pod: rank each pod's participants, record
 * honours, and move the top PROMOTE up a tier / bottom RELEGATE down a tier
 * (persistent account.tier). Re-podding happens lazily next season via ensurePod.
 */
async function rollover(db: Store, s: Season, now: number): Promise<void> {
  let pods = await db.seasonPods(s.id);
  const allResults = await db.seasonResults(s.id);
  // transitional fallback: a pre-Phase-B season has no pod rows → treat everyone as one bottom-tier pod
  const fallback = pods.length === 0;
  if (fallback) pods = [{ tier: BOTTOM, pod: 0 }];

  for (const { tier, pod } of pods) {
    const members = fallback ? await db.allAccounts() : await db.podMembers(s.id, tier, pod);
    const ids = new Set(members.map((m) => m.id));
    const results = resultsAmong(allResults, ids);
    const played = new Set<string>();
    for (const r of results) { played.add(r.home_id); played.add(r.away_id); }
    const ranked = buildTable(members, results).filter((row) => played.has(row.id));
    const tierIdx = TIERS.indexOf(tier as typeof TIERS[number]);
    const bigEnough = ranked.length > PROMOTE + RELEGATE; // only relegate where there was a real race

    for (let i = 0; i < ranked.length; i++) {
      const acct = ranked[i];
      await db.addHonour(acct.id, s.id, s.number, tier, i + 1, i === 0 ? 1 : 0, now);
      let newIdx = tierIdx;
      if (i < PROMOTE && tierIdx < TIERS.length - 1) newIdx = tierIdx + 1;
      else if (bigEnough && i >= ranked.length - RELEGATE && tierIdx > 0) newIdx = tierIdx - 1;
      if (newIdx !== tierIdx) await db.setTier(acct.id, TIERS[newIdx]);
    }
  }
  await db.closeSeason(s.id);
}
