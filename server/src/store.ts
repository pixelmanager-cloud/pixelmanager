// Storage interface. Two backends implement it: node:sqlite (local dev) and
// Postgres (production). Everything is async so both fit the same shape.
import type { Club, Lineup, Tactics } from '@fm/shared';

export interface StandingOrders { formation: Lineup['formation']; playerIds: string[]; tactics: Tactics }
export interface Account { id: string; handle: string; rating: number; createdAt: number }
export interface OpponentRow { id: string; handle: string; rating: number; clubName: string }
export interface LeaderRow { id: string; handle: string; rating: number }
export interface MatchRow { id: string; home_id: string; away_id: string; home_score: number; away_score: number; created_at: number }
export interface ResultRow extends MatchRow { home_handle: string; away_handle: string }
export interface StoredMatch {
  id: string; homeId: string; awayId: string;
  homeTeam: unknown; awayTeam: unknown; homeTactics: Tactics; awayTactics: Tactics;
  seed: number; homeScore: number; awayScore: number; createdAt: number;
}

export interface Store {
  init(): Promise<void>;
  createAccount(id: string, handle: string, token: string, createdAt: number): Promise<void>;
  accountByToken(token: string): Promise<Account | undefined>;
  accountById(id: string): Promise<Account | undefined>;
  handleTaken(handle: string): Promise<boolean>;
  setRating(id: string, rating: number): Promise<void>;
  opponents(exceptId: string, myRating: number, limit?: number): Promise<OpponentRow[]>;
  leaderboard(limit?: number): Promise<LeaderRow[]>;
  saveClub(accountId: string, club: Club, so: StandingOrders): Promise<void>;
  saveStandingOrders(accountId: string, so: StandingOrders): Promise<void>;
  getClub(accountId: string): Promise<{ club: Club; standingOrders: StandingOrders } | undefined>;
  saveMatch(m: StoredMatch): Promise<void>;
  getMatch(id: string): Promise<StoredMatch | undefined>;
  matchesFor(accountId: string, limit?: number): Promise<MatchRow[]>;
  recentResults(limit?: number): Promise<ResultRow[]>;
  allAccounts(): Promise<LeaderRow[]>;
  allResults(): Promise<Array<{ home_id: string; away_id: string; home_score: number; away_score: number }>>;
  reset(): Promise<void>;
}
