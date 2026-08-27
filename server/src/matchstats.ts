// Persist per-player match output (goals / assists / apps / POTM) derived by
// @fm/shared's `deriveMatchStats` — season stats for EVERY player (leaderboards +
// awards) and permanent career tallies on NFT tokens.
import type { Store } from './store.js';
import { deriveMatchStats, type MatchEvent, type MatchPlayerStat, type Team } from '@fm/shared';
import { bumpTokenStats } from './tokens.js';

const isNft = (id: string) => id.startsWith('nft:');

export async function recordMatchStats(
  db: Store, seasonId: string, homeId: string, awayId: string,
  homeTeam: Team, awayTeam: Team, events: MatchEvent[], result: [number, number],
): Promise<void> {
  const [homeStats, awayStats] = deriveMatchStats(homeTeam, awayTeam, events, result);
  const persistSide = async (ownerId: string, stats: MatchPlayerStat[]) => {
    for (const s of stats) {
      await db.bumpPlayerStats(seasonId, ownerId, s.id, s.name, { goals: s.goals, assists: s.assists, apps: s.apps, potm: s.potm });
      if (isNft(s.id)) await bumpTokenStats(db, s.id, { goals: s.goals, assists: s.assists, potm: s.potm });
    }
  };
  await persistSide(homeId, homeStats);
  await persistSide(awayId, awayStats);
}
