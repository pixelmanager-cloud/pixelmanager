// Production backend on Postgres (e.g. Neon/Supabase). JSON stored as text and
// (de)serialised in code, identical semantics to the SQLite backend.
import pg from 'pg';
import type { Club } from '@fm/shared';
import type { Store, Account, AuthRow, StandingOrders, StoredMatch, OpponentRow, LeaderRow, MatchRow, ResultRow, Season, HonourRow, PodRef, Listing } from './store.js';

export function makePostgresStore(connectionString: string): Store {
  // Railway's internal DB (postgres.railway.internal) and localhost don't use SSL;
  // managed providers (Neon/Supabase, public URLs) do. Auto-detect, override with PGSSL.
  const ssl = process.env.PGSSL === 'require' ? { rejectUnauthorized: false }
    : process.env.PGSSL === 'false' ? false
    : /\.railway\.internal|localhost|127\.0\.0\.1/.test(connectionString) ? false
    : { rejectUnauthorized: false };
  const pool = new pg.Pool({ connectionString, ssl });
  const q = (text: string, params: any[] = []) => pool.query(text, params);
  return {
    async init() {
      await q(`
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY, handle TEXT UNIQUE NOT NULL, token TEXT NOT NULL,
          rating INTEGER NOT NULL DEFAULT 1000, created_at BIGINT NOT NULL, password_hash TEXT);
        CREATE TABLE IF NOT EXISTS clubs (
          account_id TEXT PRIMARY KEY, club TEXT NOT NULL,
          so_formation TEXT NOT NULL, so_player_ids TEXT NOT NULL, so_tactics TEXT NOT NULL, so_duties TEXT);
        CREATE TABLE IF NOT EXISTS matches (
          id TEXT PRIMARY KEY, home_id TEXT NOT NULL, away_id TEXT NOT NULL,
          home_team TEXT NOT NULL, away_team TEXT NOT NULL,
          home_tactics TEXT NOT NULL, away_tactics TEXT NOT NULL,
          seed BIGINT NOT NULL, home_score INTEGER NOT NULL, away_score INTEGER NOT NULL,
          created_at BIGINT NOT NULL, season_id TEXT, initiator_id TEXT);
        CREATE TABLE IF NOT EXISTS seasons (
          id TEXT PRIMARY KEY, number INTEGER NOT NULL, starts_at BIGINT NOT NULL,
          ends_at BIGINT NOT NULL, status TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS honours (
          account_id TEXT NOT NULL, season_id TEXT NOT NULL, season_number INTEGER NOT NULL,
          tier TEXT NOT NULL, final_pos INTEGER NOT NULL, title INTEGER NOT NULL, ended_at BIGINT NOT NULL);
        CREATE TABLE IF NOT EXISTS pod_members (
          season_id TEXT NOT NULL, account_id TEXT NOT NULL, tier TEXT NOT NULL, pod INTEGER NOT NULL,
          PRIMARY KEY (season_id, account_id));
        CREATE TABLE IF NOT EXISTS plans (
          owner_id TEXT NOT NULL, opponent_id TEXT NOT NULL,
          formation TEXT NOT NULL, player_ids TEXT NOT NULL, tactics TEXT NOT NULL, duties TEXT,
          PRIMARY KEY (owner_id, opponent_id));
        CREATE TABLE IF NOT EXISTS loanees (
          owner_id TEXT NOT NULL, season_id TEXT NOT NULL, player_id TEXT NOT NULL,
          PRIMARY KEY (owner_id, player_id));
        ALTER TABLE matches ADD COLUMN IF NOT EXISTS season_id TEXT;
        ALTER TABLE matches ADD COLUMN IF NOT EXISTS initiator_id TEXT;
        ALTER TABLE clubs ADD COLUMN IF NOT EXISTS so_duties TEXT;
        CREATE TABLE IF NOT EXISTS listings (
          id TEXT PRIMARY KEY, seller_id TEXT NOT NULL, player_id TEXT NOT NULL,
          player_json TEXT NOT NULL, price INTEGER NOT NULL, status TEXT NOT NULL,
          created_at BIGINT NOT NULL, buyer_id TEXT, sold_at BIGINT);
        ALTER TABLE matches ADD COLUMN IF NOT EXISTS season_id TEXT;
        ALTER TABLE matches ADD COLUMN IF NOT EXISTS initiator_id TEXT;
        ALTER TABLE clubs ADD COLUMN IF NOT EXISTS so_duties TEXT;
        ALTER TABLE accounts ADD COLUMN IF NOT EXISTS tier TEXT;
        ALTER TABLE accounts ADD COLUMN IF NOT EXISTS password_hash TEXT;
        ALTER TABLE accounts ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 500;
        ALTER TABLE honours ADD COLUMN IF NOT EXISTS coin_reward INTEGER NOT NULL DEFAULT 0;
      `);
    },
    async createAccount(id, handle, token, createdAt, passwordHash) {
      await q('INSERT INTO accounts (id, handle, token, rating, created_at, password_hash) VALUES ($1,$2,$3,1000,$4,$5)', [id, handle, token, createdAt, passwordHash]);
    },
    async accountByToken(token) {
      const r = (await q('SELECT id, handle, rating, created_at FROM accounts WHERE token=$1', [token])).rows[0];
      return r && { id: r.id, handle: r.handle, rating: r.rating, createdAt: Number(r.created_at) } as Account;
    },
    async accountAuthByHandle(handle) {
      const r = (await q('SELECT id, handle, rating, token, password_hash FROM accounts WHERE handle=$1', [handle])).rows[0];
      return r && { id: r.id, handle: r.handle, rating: r.rating, token: r.token, passwordHash: r.password_hash ?? null } as AuthRow;
    },
    async setPassword(accountId, passwordHash) { await q('UPDATE accounts SET password_hash=$1 WHERE id=$2', [passwordHash, accountId]); },
    async accountById(id) {
      const r = (await q('SELECT id, handle, rating, created_at FROM accounts WHERE id=$1', [id])).rows[0];
      return r && { id: r.id, handle: r.handle, rating: r.rating, createdAt: Number(r.created_at) } as Account;
    },
    async handleTaken(handle) { return (await q('SELECT 1 FROM accounts WHERE handle=$1', [handle])).rowCount! > 0; },
    async setRating(id, rating) { await q('UPDATE accounts SET rating=$1 WHERE id=$2', [rating, id]); },
    async getCoins(id) { const r = (await q('SELECT coins FROM accounts WHERE id=$1', [id])).rows[0]; return r ? r.coins : 0; },
    async addCoins(id, delta) { await q('UPDATE accounts SET coins = coins + $1 WHERE id=$2', [delta, id]); },
    async createListing(l) {
      await q('INSERT INTO listings (id, seller_id, player_id, player_json, price, status, created_at, buyer_id, sold_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [l.id, l.seller_id, l.player_id, l.player_json, l.price, l.status, l.created_at, l.buyer_id, l.sold_at]);
    },
    async activeListings(limit = 100) {
      return (await q(`SELECT l.*, a.handle AS seller_handle FROM listings l JOIN accounts a ON a.id=l.seller_id
        WHERE l.status='active' ORDER BY l.created_at DESC LIMIT $1`, [limit])).rows as Listing[];
    },
    async listingsBySeller(sellerId) {
      return (await q(`SELECT l.*, a.handle AS seller_handle FROM listings l JOIN accounts a ON a.id=l.seller_id
        WHERE l.seller_id=$1 AND l.status='active' ORDER BY l.created_at DESC`, [sellerId])).rows as Listing[];
    },
    async listingById(id) {
      return (await q(`SELECT l.*, a.handle AS seller_handle FROM listings l JOIN accounts a ON a.id=l.seller_id WHERE l.id=$1`, [id])).rows[0] as Listing | undefined;
    },
    async activeListingForPlayer(playerId) {
      return (await q(`SELECT l.*, a.handle AS seller_handle FROM listings l JOIN accounts a ON a.id=l.seller_id
        WHERE l.player_id=$1 AND l.status='active'`, [playerId])).rows[0] as Listing | undefined;
    },
    async setListingStatus(id, status, buyerId, soldAt) {
      await q('UPDATE listings SET status=$1, buyer_id=$2, sold_at=$3 WHERE id=$4', [status, buyerId, soldAt, id]);
    },
    async opponents(exceptId, myRating, limit = 20) {
      const rows = (await q(
        `SELECT a.id, a.handle, a.rating, c.club FROM accounts a JOIN clubs c ON c.account_id=a.id
         WHERE a.id <> $1 ORDER BY ABS(a.rating - $2) ASC LIMIT $3`, [exceptId, myRating, limit],
      )).rows;
      return rows.map((r) => ({ id: r.id, handle: r.handle, rating: r.rating, clubName: JSON.parse(r.club).name } as OpponentRow));
    },
    async leaderboard(limit = 50) {
      return (await q('SELECT id, handle, rating FROM accounts ORDER BY rating DESC LIMIT $1', [limit])).rows as LeaderRow[];
    },
    async saveClub(accountId, club: Club, so: StandingOrders) {
      await q(
        `INSERT INTO clubs (account_id, club, so_formation, so_player_ids, so_tactics, so_duties) VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT(account_id) DO UPDATE SET club=EXCLUDED.club, so_formation=EXCLUDED.so_formation,
           so_player_ids=EXCLUDED.so_player_ids, so_tactics=EXCLUDED.so_tactics, so_duties=EXCLUDED.so_duties`,
        [accountId, JSON.stringify(club), so.formation, JSON.stringify(so.playerIds), JSON.stringify(so.tactics), so.duties ? JSON.stringify(so.duties) : null],
      );
    },
    async saveStandingOrders(accountId, so: StandingOrders) {
      await q('UPDATE clubs SET so_formation=$1, so_player_ids=$2, so_tactics=$3, so_duties=$4 WHERE account_id=$5',
        [so.formation, JSON.stringify(so.playerIds), JSON.stringify(so.tactics), so.duties ? JSON.stringify(so.duties) : null, accountId]);
    },
    async getClub(accountId) {
      const r = (await q('SELECT club, so_formation, so_player_ids, so_tactics, so_duties FROM clubs WHERE account_id=$1', [accountId])).rows[0];
      if (!r) return undefined;
      return { club: JSON.parse(r.club), standingOrders: { formation: r.so_formation, playerIds: JSON.parse(r.so_player_ids), tactics: JSON.parse(r.so_tactics), duties: r.so_duties ? JSON.parse(r.so_duties) : undefined } };
    },
    async savePlan(ownerId, opponentId, plan) {
      await q(
        `INSERT INTO plans (owner_id, opponent_id, formation, player_ids, tactics, duties) VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT(owner_id, opponent_id) DO UPDATE SET formation=EXCLUDED.formation, player_ids=EXCLUDED.player_ids, tactics=EXCLUDED.tactics, duties=EXCLUDED.duties`,
        [ownerId, opponentId, plan.formation, JSON.stringify(plan.playerIds), JSON.stringify(plan.tactics), plan.duties ? JSON.stringify(plan.duties) : null],
      );
    },
    async getPlan(ownerId, opponentId) {
      const r = (await q('SELECT formation, player_ids, tactics, duties FROM plans WHERE owner_id=$1 AND opponent_id=$2', [ownerId, opponentId])).rows[0];
      return r && { formation: r.formation, playerIds: JSON.parse(r.player_ids), tactics: JSON.parse(r.tactics), duties: r.duties ? JSON.parse(r.duties) : undefined };
    },
    async addLoanee(ownerId, seasonId, playerId) {
      await q('INSERT INTO loanees (owner_id, season_id, player_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [ownerId, seasonId, playerId]);
    },
    async countLoanees(ownerId, seasonId) {
      const r = (await q('SELECT COUNT(*)::int AS c FROM loanees WHERE owner_id=$1 AND season_id=$2', [ownerId, seasonId])).rows[0];
      return r ? r.c : 0;
    },
    async loaneeIds(ownerId, seasonId) {
      return (await q('SELECT player_id FROM loanees WHERE owner_id=$1 AND season_id=$2', [ownerId, seasonId])).rows.map((r) => r.player_id);
    },
    async loaneesInSeason(seasonId) {
      return (await q('SELECT owner_id, player_id FROM loanees WHERE season_id=$1', [seasonId])).rows as Array<{ owner_id: string; player_id: string }>;
    },
    async deleteLoaneesInSeason(seasonId) { await q('DELETE FROM loanees WHERE season_id=$1', [seasonId]); },
    async saveMatch(m: StoredMatch) {
      await q(
        `INSERT INTO matches (id, home_id, away_id, home_team, away_team, home_tactics, away_tactics, seed, home_score, away_score, created_at, season_id, initiator_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [m.id, m.homeId, m.awayId, JSON.stringify(m.homeTeam), JSON.stringify(m.awayTeam),
          JSON.stringify(m.homeTactics), JSON.stringify(m.awayTactics), m.seed, m.homeScore, m.awayScore, m.createdAt, m.seasonId ?? null, m.initiatorId ?? null],
      );
    },
    async getMatch(id) {
      const r = (await q('SELECT * FROM matches WHERE id=$1', [id])).rows[0];
      return r && {
        id: r.id, homeId: r.home_id, awayId: r.away_id,
        homeTeam: JSON.parse(r.home_team), awayTeam: JSON.parse(r.away_team),
        homeTactics: JSON.parse(r.home_tactics), awayTactics: JSON.parse(r.away_tactics),
        seed: Number(r.seed), homeScore: r.home_score, awayScore: r.away_score, createdAt: Number(r.created_at),
      } as StoredMatch;
    },
    async matchesFor(accountId, limit = 30) {
      return (await q(
        'SELECT id, home_id, away_id, home_score, away_score, created_at FROM matches WHERE home_id=$1 OR away_id=$1 ORDER BY created_at DESC LIMIT $2',
        [accountId, limit],
      )).rows.map((r) => ({ ...r, created_at: Number(r.created_at) })) as MatchRow[];
    },
    async recentResults(limit = 40, seasonId) {
      const base = `SELECT m.id, m.home_id, m.away_id, m.home_score, m.away_score, m.created_at,
                ha.handle AS home_handle, aa.handle AS away_handle
         FROM matches m JOIN accounts ha ON ha.id=m.home_id JOIN accounts aa ON aa.id=m.away_id`;
      const rows = seasonId
        ? (await q(base + ' WHERE m.season_id=$1 ORDER BY m.created_at DESC LIMIT $2', [seasonId, limit])).rows
        : (await q(base + ' ORDER BY m.created_at DESC LIMIT $1', [limit])).rows;
      return rows.map((r) => ({ ...r, created_at: Number(r.created_at) })) as ResultRow[];
    },
    async allAccounts() { return (await q('SELECT id, handle, rating FROM accounts')).rows as LeaderRow[]; },
    async allResults() { return (await q('SELECT home_id, away_id, home_score, away_score FROM matches')).rows as any[]; },
    async currentSeason() {
      const r = (await q("SELECT id, number, starts_at, ends_at, status FROM seasons WHERE status='active' ORDER BY number DESC LIMIT 1")).rows[0];
      return r && { id: r.id, number: r.number, startsAt: Number(r.starts_at), endsAt: Number(r.ends_at), status: r.status } as Season;
    },
    async createSeason(id, number, startsAt, endsAt) {
      await q("INSERT INTO seasons (id, number, starts_at, ends_at, status) VALUES ($1,$2,$3,$4,'active')", [id, number, startsAt, endsAt]);
      return { id, number, startsAt, endsAt, status: 'active' } as Season;
    },
    async closeSeason(id) { await q("UPDATE seasons SET status='closed' WHERE id=$1", [id]); },
    async seasonResults(seasonId) {
      return (await q('SELECT home_id, away_id, home_score, away_score FROM matches WHERE season_id=$1', [seasonId])).rows as any[];
    },
    async matchesToday(accountId, seasonId, sinceMs) {
      const r = (await q('SELECT COUNT(*)::int AS c FROM matches WHERE initiator_id=$1 AND season_id=$2 AND created_at>=$3', [accountId, seasonId, sinceMs])).rows[0];
      return r ? r.c : 0;
    },
    async addHonour(accountId, seasonId, seasonNumber, tier, finalPos, title, endedAt, coinReward) {
      await q('INSERT INTO honours (account_id, season_id, season_number, tier, final_pos, title, ended_at, coin_reward) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [accountId, seasonId, seasonNumber, tier, finalPos, title, endedAt, coinReward]);
    },
    async honoursFor(accountId, limit = 30) {
      return (await q('SELECT season_number, tier, final_pos, title, ended_at, coin_reward FROM honours WHERE account_id=$1 ORDER BY season_number DESC LIMIT $2', [accountId, limit]))
        .rows.map((r) => ({ ...r, ended_at: Number(r.ended_at) })) as HonourRow[];
    },
    async accountTier(accountId) {
      const r = (await q('SELECT tier FROM accounts WHERE id=$1', [accountId])).rows[0];
      return (r && r.tier) || 'SUNDAY LEAGUE';
    },
    async setTier(accountId, tier) { await q('UPDATE accounts SET tier=$1 WHERE id=$2', [tier, accountId]); },
    async podOf(seasonId, accountId) {
      const r = (await q('SELECT tier, pod FROM pod_members WHERE season_id=$1 AND account_id=$2', [seasonId, accountId])).rows[0];
      return r && { tier: r.tier, pod: r.pod } as PodRef;
    },
    async assignPod(seasonId, accountId, tier, pod) {
      await q(`INSERT INTO pod_members (season_id, account_id, tier, pod) VALUES ($1,$2,$3,$4)
               ON CONFLICT (season_id, account_id) DO UPDATE SET tier=EXCLUDED.tier, pod=EXCLUDED.pod`, [seasonId, accountId, tier, pod]);
    },
    async tierPodCounts(seasonId, tier) {
      return (await q('SELECT pod, COUNT(*)::int AS count FROM pod_members WHERE season_id=$1 AND tier=$2 GROUP BY pod ORDER BY pod', [seasonId, tier]))
        .rows as Array<{ pod: number; count: number }>;
    },
    async podMembers(seasonId, tier, pod) {
      return (await q('SELECT a.id, a.handle, a.rating FROM pod_members pm JOIN accounts a ON a.id=pm.account_id WHERE pm.season_id=$1 AND pm.tier=$2 AND pm.pod=$3', [seasonId, tier, pod]))
        .rows as LeaderRow[];
    },
    async seasonPods(seasonId) {
      return (await q('SELECT DISTINCT tier, pod FROM pod_members WHERE season_id=$1 ORDER BY tier, pod', [seasonId])).rows as PodRef[];
    },
    async reset() { await q('TRUNCATE accounts, clubs, matches, seasons, honours, pod_members, plans, loanees, listings'); },
  };
}
