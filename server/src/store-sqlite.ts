// Local-dev backend on Node's built-in SQLite (no native deps).
import { DatabaseSync } from 'node:sqlite';
import type { Club } from '@fm/shared';
import type { Store, Account, AuthRow, StandingOrders, StoredMatch, OpponentRow, LeaderRow, MatchRow, ResultRow, Season, HonourRow, PodRef, Listing } from './store.js';

export function makeSqliteStore(file: string): Store {
  const db = new DatabaseSync(file);
  return {
    async init() {
      db.exec(`
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY, handle TEXT UNIQUE NOT NULL, token TEXT NOT NULL,
          rating INTEGER NOT NULL DEFAULT 1000, created_at INTEGER NOT NULL, password_hash TEXT);
        CREATE TABLE IF NOT EXISTS clubs (
          account_id TEXT PRIMARY KEY, club TEXT NOT NULL,
          so_formation TEXT NOT NULL, so_player_ids TEXT NOT NULL, so_tactics TEXT NOT NULL, so_duties TEXT);
        CREATE TABLE IF NOT EXISTS matches (
          id TEXT PRIMARY KEY, home_id TEXT NOT NULL, away_id TEXT NOT NULL,
          home_team TEXT NOT NULL, away_team TEXT NOT NULL,
          home_tactics TEXT NOT NULL, away_tactics TEXT NOT NULL,
          seed INTEGER NOT NULL, home_score INTEGER NOT NULL, away_score INTEGER NOT NULL,
          created_at INTEGER NOT NULL, season_id TEXT, initiator_id TEXT);
        CREATE TABLE IF NOT EXISTS seasons (
          id TEXT PRIMARY KEY, number INTEGER NOT NULL, starts_at INTEGER NOT NULL,
          ends_at INTEGER NOT NULL, status TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS honours (
          account_id TEXT NOT NULL, season_id TEXT NOT NULL, season_number INTEGER NOT NULL,
          tier TEXT NOT NULL, final_pos INTEGER NOT NULL, title INTEGER NOT NULL, ended_at INTEGER NOT NULL);
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
        CREATE TABLE IF NOT EXISTS listings (
          id TEXT PRIMARY KEY, seller_id TEXT NOT NULL, player_id TEXT NOT NULL,
          player_json TEXT NOT NULL, price INTEGER NOT NULL, status TEXT NOT NULL,
          created_at INTEGER NOT NULL, buyer_id TEXT, sold_at INTEGER);
      `);
      // migrate pre-existing tables (adds columns; throws-and-ignored if already present)
      try { db.exec('ALTER TABLE matches ADD COLUMN season_id TEXT'); } catch { /* already added */ }
      try { db.exec('ALTER TABLE matches ADD COLUMN initiator_id TEXT'); } catch { /* already added */ }
      try { db.exec('ALTER TABLE clubs ADD COLUMN so_duties TEXT'); } catch { /* already added */ }
      try { db.exec('ALTER TABLE accounts ADD COLUMN tier TEXT'); } catch { /* already added */ }
      try { db.exec('ALTER TABLE accounts ADD COLUMN password_hash TEXT'); } catch { /* already added */ }
      try { db.exec('ALTER TABLE accounts ADD COLUMN coins INTEGER NOT NULL DEFAULT 500'); } catch { /* already added */ }
      try { db.exec('ALTER TABLE honours ADD COLUMN coin_reward INTEGER NOT NULL DEFAULT 0'); } catch { /* already added */ }
    },
    async createAccount(id, handle, token, createdAt, passwordHash) {
      db.prepare('INSERT INTO accounts (id, handle, token, rating, created_at, password_hash) VALUES (?,?,?,1000,?,?)').run(id, handle, token, createdAt, passwordHash);
    },
    async accountByToken(token) {
      const r = db.prepare('SELECT id, handle, rating, created_at FROM accounts WHERE token=?').get(token) as any;
      return r && { id: r.id, handle: r.handle, rating: r.rating, createdAt: r.created_at } as Account;
    },
    async accountAuthByHandle(handle) {
      const r = db.prepare('SELECT id, handle, rating, token, password_hash FROM accounts WHERE handle=?').get(handle) as any;
      return r && { id: r.id, handle: r.handle, rating: r.rating, token: r.token, passwordHash: r.password_hash ?? null } as AuthRow;
    },
    async setPassword(accountId, passwordHash) { db.prepare('UPDATE accounts SET password_hash=? WHERE id=?').run(passwordHash, accountId); },
    async accountById(id) {
      const r = db.prepare('SELECT id, handle, rating, created_at FROM accounts WHERE id=?').get(id) as any;
      return r && { id: r.id, handle: r.handle, rating: r.rating, createdAt: r.created_at } as Account;
    },
    async handleTaken(handle) { return !!db.prepare('SELECT 1 FROM accounts WHERE handle=?').get(handle); },
    async setRating(id, rating) { db.prepare('UPDATE accounts SET rating=? WHERE id=?').run(rating, id); },
    async getCoins(id) { const r = db.prepare('SELECT coins FROM accounts WHERE id=?').get(id) as any; return r ? r.coins : 0; },
    async addCoins(id, delta) { db.prepare('UPDATE accounts SET coins = coins + ? WHERE id=?').run(delta, id); },
    async createListing(l) {
      db.prepare('INSERT INTO listings (id, seller_id, player_id, player_json, price, status, created_at, buyer_id, sold_at) VALUES (?,?,?,?,?,?,?,?,?)')
        .run(l.id, l.seller_id, l.player_id, l.player_json, l.price, l.status, l.created_at, l.buyer_id, l.sold_at);
    },
    async activeListings(limit = 100) {
      return db.prepare(`SELECT l.*, a.handle AS seller_handle FROM listings l JOIN accounts a ON a.id=l.seller_id
        WHERE l.status='active' ORDER BY l.created_at DESC LIMIT ?`).all(limit) as any as Listing[];
    },
    async listingsBySeller(sellerId) {
      return db.prepare(`SELECT l.*, a.handle AS seller_handle FROM listings l JOIN accounts a ON a.id=l.seller_id
        WHERE l.seller_id=? AND l.status='active' ORDER BY l.created_at DESC`).all(sellerId) as any as Listing[];
    },
    async listingById(id) {
      return db.prepare(`SELECT l.*, a.handle AS seller_handle FROM listings l JOIN accounts a ON a.id=l.seller_id WHERE l.id=?`).get(id) as any as Listing | undefined;
    },
    async activeListingForPlayer(playerId) {
      return db.prepare(`SELECT l.*, a.handle AS seller_handle FROM listings l JOIN accounts a ON a.id=l.seller_id
        WHERE l.player_id=? AND l.status='active'`).get(playerId) as any as Listing | undefined;
    },
    async setListingStatus(id, status, buyerId, soldAt) {
      db.prepare('UPDATE listings SET status=?, buyer_id=?, sold_at=? WHERE id=?').run(status, buyerId, soldAt, id);
    },
    async opponents(exceptId, myRating, limit = 20) {
      return (db.prepare(
        `SELECT a.id, a.handle, a.rating, c.club FROM accounts a JOIN clubs c ON c.account_id=a.id
         WHERE a.id != ? ORDER BY ABS(a.rating - ?) ASC LIMIT ?`,
      ).all(exceptId, myRating, limit) as any[]).map((r) => ({ id: r.id, handle: r.handle, rating: r.rating, clubName: JSON.parse(r.club).name } as OpponentRow));
    },
    async leaderboard(limit = 50) {
      return db.prepare('SELECT id, handle, rating FROM accounts ORDER BY rating DESC LIMIT ?').all(limit) as LeaderRow[];
    },
    async saveClub(accountId, club: Club, so: StandingOrders) {
      db.prepare(
        `INSERT INTO clubs (account_id, club, so_formation, so_player_ids, so_tactics, so_duties) VALUES (?,?,?,?,?,?)
         ON CONFLICT(account_id) DO UPDATE SET club=excluded.club, so_formation=excluded.so_formation,
           so_player_ids=excluded.so_player_ids, so_tactics=excluded.so_tactics, so_duties=excluded.so_duties`,
      ).run(accountId, JSON.stringify(club), so.formation, JSON.stringify(so.playerIds), JSON.stringify(so.tactics), so.duties ? JSON.stringify(so.duties) : null);
    },
    async saveStandingOrders(accountId, so: StandingOrders) {
      db.prepare('UPDATE clubs SET so_formation=?, so_player_ids=?, so_tactics=?, so_duties=? WHERE account_id=?')
        .run(so.formation, JSON.stringify(so.playerIds), JSON.stringify(so.tactics), so.duties ? JSON.stringify(so.duties) : null, accountId);
    },
    async getClub(accountId) {
      const r = db.prepare('SELECT club, so_formation, so_player_ids, so_tactics, so_duties FROM clubs WHERE account_id=?').get(accountId) as any;
      if (!r) return undefined;
      return { club: JSON.parse(r.club), standingOrders: { formation: r.so_formation, playerIds: JSON.parse(r.so_player_ids), tactics: JSON.parse(r.so_tactics), duties: r.so_duties ? JSON.parse(r.so_duties) : undefined } };
    },
    async savePlan(ownerId, opponentId, plan) {
      db.prepare(
        `INSERT INTO plans (owner_id, opponent_id, formation, player_ids, tactics, duties) VALUES (?,?,?,?,?,?)
         ON CONFLICT(owner_id, opponent_id) DO UPDATE SET formation=excluded.formation, player_ids=excluded.player_ids, tactics=excluded.tactics, duties=excluded.duties`,
      ).run(ownerId, opponentId, plan.formation, JSON.stringify(plan.playerIds), JSON.stringify(plan.tactics), plan.duties ? JSON.stringify(plan.duties) : null);
    },
    async getPlan(ownerId, opponentId) {
      const r = db.prepare('SELECT formation, player_ids, tactics, duties FROM plans WHERE owner_id=? AND opponent_id=?').get(ownerId, opponentId) as any;
      return r && { formation: r.formation, playerIds: JSON.parse(r.player_ids), tactics: JSON.parse(r.tactics), duties: r.duties ? JSON.parse(r.duties) : undefined };
    },
    async addLoanee(ownerId, seasonId, playerId) {
      db.prepare('INSERT OR IGNORE INTO loanees (owner_id, season_id, player_id) VALUES (?,?,?)').run(ownerId, seasonId, playerId);
    },
    async countLoanees(ownerId, seasonId) {
      const r = db.prepare('SELECT COUNT(*) AS c FROM loanees WHERE owner_id=? AND season_id=?').get(ownerId, seasonId) as any;
      return r ? r.c : 0;
    },
    async loaneeIds(ownerId, seasonId) {
      return (db.prepare('SELECT player_id FROM loanees WHERE owner_id=? AND season_id=?').all(ownerId, seasonId) as any[]).map((r) => r.player_id);
    },
    async loaneesInSeason(seasonId) {
      return db.prepare('SELECT owner_id, player_id FROM loanees WHERE season_id=?').all(seasonId) as Array<{ owner_id: string; player_id: string }>;
    },
    async deleteLoaneesInSeason(seasonId) { db.prepare('DELETE FROM loanees WHERE season_id=?').run(seasonId); },
    async saveMatch(m: StoredMatch) {
      db.prepare(
        `INSERT INTO matches (id, home_id, away_id, home_team, away_team, home_tactics, away_tactics, seed, home_score, away_score, created_at, season_id, initiator_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).run(m.id, m.homeId, m.awayId, JSON.stringify(m.homeTeam), JSON.stringify(m.awayTeam),
        JSON.stringify(m.homeTactics), JSON.stringify(m.awayTactics), m.seed, m.homeScore, m.awayScore, m.createdAt, m.seasonId ?? null, m.initiatorId ?? null);
    },
    async getMatch(id) {
      const r = db.prepare('SELECT * FROM matches WHERE id=?').get(id) as any;
      return r && {
        id: r.id, homeId: r.home_id, awayId: r.away_id,
        homeTeam: JSON.parse(r.home_team), awayTeam: JSON.parse(r.away_team),
        homeTactics: JSON.parse(r.home_tactics), awayTactics: JSON.parse(r.away_tactics),
        seed: r.seed, homeScore: r.home_score, awayScore: r.away_score, createdAt: r.created_at,
      } as StoredMatch;
    },
    async matchesFor(accountId, limit = 30) {
      return db.prepare(
        'SELECT id, home_id, away_id, home_score, away_score, created_at FROM matches WHERE home_id=? OR away_id=? ORDER BY created_at DESC LIMIT ?',
      ).all(accountId, accountId, limit) as MatchRow[];
    },
    async recentResults(limit = 40, seasonId) {
      const base = `SELECT m.id, m.home_id, m.away_id, m.home_score, m.away_score, m.created_at,
                ha.handle AS home_handle, aa.handle AS away_handle
         FROM matches m JOIN accounts ha ON ha.id=m.home_id JOIN accounts aa ON aa.id=m.away_id`;
      return seasonId
        ? db.prepare(base + ' WHERE m.season_id=? ORDER BY m.created_at DESC LIMIT ?').all(seasonId, limit) as ResultRow[]
        : db.prepare(base + ' ORDER BY m.created_at DESC LIMIT ?').all(limit) as ResultRow[];
    },
    async allAccounts() { return db.prepare('SELECT id, handle, rating FROM accounts').all() as LeaderRow[]; },
    async allResults() { return db.prepare('SELECT home_id, away_id, home_score, away_score FROM matches').all() as any[]; },
    async currentSeason() {
      const r = db.prepare("SELECT id, number, starts_at, ends_at, status FROM seasons WHERE status='active' ORDER BY number DESC LIMIT 1").get() as any;
      return r && { id: r.id, number: r.number, startsAt: r.starts_at, endsAt: r.ends_at, status: r.status } as Season;
    },
    async createSeason(id, number, startsAt, endsAt) {
      db.prepare("INSERT INTO seasons (id, number, starts_at, ends_at, status) VALUES (?,?,?,?,'active')").run(id, number, startsAt, endsAt);
      return { id, number, startsAt, endsAt, status: 'active' } as Season;
    },
    async closeSeason(id) { db.prepare("UPDATE seasons SET status='closed' WHERE id=?").run(id); },
    async seasonResults(seasonId) {
      return db.prepare('SELECT home_id, away_id, home_score, away_score FROM matches WHERE season_id=?').all(seasonId) as any[];
    },
    async matchesToday(accountId, seasonId, sinceMs) {
      const r = db.prepare('SELECT COUNT(*) AS c FROM matches WHERE initiator_id=? AND season_id=? AND created_at>=?').get(accountId, seasonId, sinceMs) as any;
      return r ? r.c : 0;
    },
    async addHonour(accountId, seasonId, seasonNumber, tier, finalPos, title, endedAt, coinReward) {
      db.prepare('INSERT INTO honours (account_id, season_id, season_number, tier, final_pos, title, ended_at, coin_reward) VALUES (?,?,?,?,?,?,?,?)')
        .run(accountId, seasonId, seasonNumber, tier, finalPos, title, endedAt, coinReward);
    },
    async honoursFor(accountId, limit = 30) {
      return db.prepare('SELECT season_number, tier, final_pos, title, ended_at, coin_reward FROM honours WHERE account_id=? ORDER BY season_number DESC LIMIT ?').all(accountId, limit) as HonourRow[];
    },
    async accountTier(accountId) {
      const r = db.prepare('SELECT tier FROM accounts WHERE id=?').get(accountId) as any;
      return (r && r.tier) || 'SUNDAY LEAGUE';
    },
    async setTier(accountId, tier) { db.prepare('UPDATE accounts SET tier=? WHERE id=?').run(tier, accountId); },
    async podOf(seasonId, accountId) {
      const r = db.prepare('SELECT tier, pod FROM pod_members WHERE season_id=? AND account_id=?').get(seasonId, accountId) as any;
      return r && { tier: r.tier, pod: r.pod } as PodRef;
    },
    async assignPod(seasonId, accountId, tier, pod) {
      db.prepare('INSERT OR REPLACE INTO pod_members (season_id, account_id, tier, pod) VALUES (?,?,?,?)').run(seasonId, accountId, tier, pod);
    },
    async tierPodCounts(seasonId, tier) {
      return db.prepare('SELECT pod, COUNT(*) AS count FROM pod_members WHERE season_id=? AND tier=? GROUP BY pod ORDER BY pod').all(seasonId, tier) as Array<{ pod: number; count: number }>;
    },
    async podMembers(seasonId, tier, pod) {
      return db.prepare('SELECT a.id, a.handle, a.rating FROM pod_members pm JOIN accounts a ON a.id=pm.account_id WHERE pm.season_id=? AND pm.tier=? AND pm.pod=?').all(seasonId, tier, pod) as LeaderRow[];
    },
    async seasonPods(seasonId) {
      return db.prepare('SELECT DISTINCT tier, pod FROM pod_members WHERE season_id=? ORDER BY tier, pod').all(seasonId) as PodRef[];
    },
    async reset() { db.exec('DELETE FROM matches; DELETE FROM clubs; DELETE FROM accounts; DELETE FROM seasons; DELETE FROM honours; DELETE FROM pod_members; DELETE FROM plans; DELETE FROM loanees; DELETE FROM listings;'); },
  };
}
