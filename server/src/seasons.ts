// Seasons — Phase A. One league for everyone (a single pod); the league runs in
// fixed-length seasons that automatically close, crown a champion, archive every
// participant's finish to the honours board, and open the next season. Divisions
// and pods layer on in Phase B (see docs/seasons-and-divisions.md).
import { randomUUID } from 'node:crypto';
import type { Store, Season } from './store.js';
import { buildTable } from './game.js';

const SEASON_MS = Math.max(1, Number(process.env.SEASON_DAYS ?? 7)) * 24 * 60 * 60 * 1000;
// Phase A has no tiers yet; everyone sits on the bottom rung of the pyramid.
const PHASE_A_TIER = 'SUNDAY LEAGUE';

/**
 * Return the active season, creating the first one on demand and rolling an
 * expired season over (archive + open the next) before returning it. Called at
 * the top of the season-aware routes, so time advances lazily on real traffic —
 * no cron needed. Uses server wall-clock (fine: seasons are bookkeeping around
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

/** Archive a finished season: rank the participants, record honours, close it. */
async function rollover(db: Store, s: Season, now: number): Promise<void> {
  const [accounts, results] = await Promise.all([db.allAccounts(), db.seasonResults(s.id)]);
  const played = new Set<string>();
  for (const r of results) { played.add(r.home_id); played.add(r.away_id); }
  // buildTable sorts by Pts/GD/GF/name; keep only clubs that actually played so
  // finishing positions are 1..N among participants (a champion, not a 0-0-0 filler).
  const ranked = buildTable(accounts, results).filter((row) => played.has(row.id));
  for (let i = 0; i < ranked.length; i++) {
    await db.addHonour(ranked[i].id, s.id, s.number, PHASE_A_TIER, i + 1, i === 0 ? 1 : 0, now);
  }
  await db.closeSeason(s.id);
}
