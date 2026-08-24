// Local dev storage on Node's built-in SQLite (no native deps). Swap to Postgres
// for production behind this same small function surface.
import { DatabaseSync } from 'node:sqlite';
import type { Club, Lineup, Tactics } from '@fm/shared';

export interface StandingOrders { formation: Lineup['formation']; playerIds: string[]; tactics: Tactics }
export interface Account { id: string; handle: string; rating: number; createdAt: number }
export interface StoredMatch {
  id: string; homeId: string; awayId: string;
  homeTeam: unknown; awayTeam: unknown; homeTactics: Tactics; awayTactics: Tactics;
  seed: number; homeScore: number; awayScore: number; createdAt: number;
}

const db = new DatabaseSync(process.env.FM_DB ?? 'fm.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY, handle TEXT UNIQUE NOT NULL, token TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 1000, created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS clubs (
    account_id TEXT PRIMARY KEY, club TEXT NOT NULL,
    so_formation TEXT NOT NULL, so_player_ids TEXT NOT NULL, so_tactics TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY, home_id TEXT NOT NULL, away_id TEXT NOT NULL,
    home_team TEXT NOT NULL, away_team TEXT NOT NULL,
    home_tactics TEXT NOT NULL, away_tactics TEXT NOT NULL,
    seed INTEGER NOT NULL, home_score INTEGER NOT NULL, away_score INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

// ---- accounts ----
export function createAccount(id: string, handle: string, token: string, createdAt: number) {
  db.prepare('INSERT INTO accounts (id, handle, token, rating, created_at) VALUES (?,?,?,1000,?)').run(id, handle, token, createdAt);
}
export function accountByToken(token: string): Account | undefined {
  const r = db.prepare('SELECT id, handle, rating, created_at FROM accounts WHERE token=?').get(token) as any;
  return r && { id: r.id, handle: r.handle, rating: r.rating, createdAt: r.created_at };
}
export function accountById(id: string): Account | undefined {
  const r = db.prepare('SELECT id, handle, rating, created_at FROM accounts WHERE id=?').get(id) as any;
  return r && { id: r.id, handle: r.handle, rating: r.rating, createdAt: r.created_at };
}
export function handleTaken(handle: string): boolean {
  return !!db.prepare('SELECT 1 FROM accounts WHERE handle=?').get(handle);
}
export function setRating(id: string, rating: number) {
  db.prepare('UPDATE accounts SET rating=? WHERE id=?').run(rating, id);
}
/** Opponents = everyone else, closest by rating first. */
export function opponents(exceptId: string, myRating: number, limit = 20) {
  return (db.prepare(
    `SELECT a.id, a.handle, a.rating, c.club FROM accounts a JOIN clubs c ON c.account_id=a.id
     WHERE a.id != ? ORDER BY ABS(a.rating - ?) ASC LIMIT ?`,
  ).all(exceptId, myRating, limit) as any[]).map((r) => ({ id: r.id, handle: r.handle, rating: r.rating, clubName: JSON.parse(r.club).name }));
}
export function leaderboard(limit = 50) {
  return (db.prepare('SELECT id, handle, rating FROM accounts ORDER BY rating DESC LIMIT ?').all(limit) as any[]);
}

// ---- clubs ----
export function saveClub(accountId: string, club: Club, so: StandingOrders) {
  db.prepare(
    `INSERT INTO clubs (account_id, club, so_formation, so_player_ids, so_tactics) VALUES (?,?,?,?,?)
     ON CONFLICT(account_id) DO UPDATE SET club=excluded.club, so_formation=excluded.so_formation,
       so_player_ids=excluded.so_player_ids, so_tactics=excluded.so_tactics`,
  ).run(accountId, JSON.stringify(club), so.formation, JSON.stringify(so.playerIds), JSON.stringify(so.tactics));
}
export function saveStandingOrders(accountId: string, so: StandingOrders) {
  db.prepare('UPDATE clubs SET so_formation=?, so_player_ids=?, so_tactics=? WHERE account_id=?')
    .run(so.formation, JSON.stringify(so.playerIds), JSON.stringify(so.tactics), accountId);
}
export function getClub(accountId: string): { club: Club; standingOrders: StandingOrders } | undefined {
  const r = db.prepare('SELECT club, so_formation, so_player_ids, so_tactics FROM clubs WHERE account_id=?').get(accountId) as any;
  if (!r) return undefined;
  return {
    club: JSON.parse(r.club),
    standingOrders: { formation: r.so_formation, playerIds: JSON.parse(r.so_player_ids), tactics: JSON.parse(r.so_tactics) },
  };
}

// ---- matches ----
export function saveMatch(m: StoredMatch) {
  db.prepare(
    `INSERT INTO matches (id, home_id, away_id, home_team, away_team, home_tactics, away_tactics, seed, home_score, away_score, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(m.id, m.homeId, m.awayId, JSON.stringify(m.homeTeam), JSON.stringify(m.awayTeam),
    JSON.stringify(m.homeTactics), JSON.stringify(m.awayTactics), m.seed, m.homeScore, m.awayScore, m.createdAt);
}
export function getMatch(id: string): StoredMatch | undefined {
  const r = db.prepare('SELECT * FROM matches WHERE id=?').get(id) as any;
  return r && {
    id: r.id, homeId: r.home_id, awayId: r.away_id,
    homeTeam: JSON.parse(r.home_team), awayTeam: JSON.parse(r.away_team),
    homeTactics: JSON.parse(r.home_tactics), awayTactics: JSON.parse(r.away_tactics),
    seed: r.seed, homeScore: r.home_score, awayScore: r.away_score, createdAt: r.created_at,
  };
}
export function matchesFor(accountId: string, limit = 30) {
  return (db.prepare(
    'SELECT id, home_id, away_id, home_score, away_score, created_at FROM matches WHERE home_id=? OR away_id=? ORDER BY created_at DESC LIMIT ?',
  ).all(accountId, accountId, limit) as any[]);
}
