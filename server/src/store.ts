// Storage interface. Two backends implement it: node:sqlite (local dev) and
// Postgres (production). Everything is async so both fit the same shape.
import type { Club, Duty, Lineup, Tactics } from '@fm/shared';

export interface StandingOrders { formation: Lineup['formation']; playerIds: string[]; tactics: Tactics; duties?: Duty[] }
export interface Account { id: string; handle: string; rating: number; createdAt: number }
export interface OpponentRow { id: string; handle: string; rating: number; clubName: string }
export interface LeaderRow { id: string; handle: string; rating: number }
export interface MatchRow { id: string; home_id: string; away_id: string; home_score: number; away_score: number; created_at: number }
export interface ResultRow extends MatchRow { home_handle: string; away_handle: string }
export interface StoredMatch {
  id: string; homeId: string; awayId: string;
  homeTeam: unknown; awayTeam: unknown; homeTactics: Tactics; awayTactics: Tactics;
  seed: number; homeScore: number; awayScore: number; createdAt: number; seasonId?: string;
  /** who triggered the match (may be the away side); drives the per-player daily cap */
  initiatorId?: string;
}
export interface Season { id: string; number: number; startsAt: number; endsAt: number; status: 'active' | 'closed' }
/** A player's archived finish in a past season (for the honours board). */
export interface HonourRow { season_number: number; tier: string; final_pos: number; title: number; ended_at: number }
/** A player's placement within the division pyramid for a season (Phase B). */
export interface PodRef { tier: string; pod: number }

/** Auth row used by /login: the account plus its bearer token and password hash. */
export interface AuthRow { id: string; handle: string; rating: number; token: string; passwordHash: string | null }

export interface Store {
  init(): Promise<void>;
  createAccount(id: string, handle: string, token: string, createdAt: number, passwordHash: string): Promise<void>;
  accountByToken(token: string): Promise<Account | undefined>;
  accountById(id: string): Promise<Account | undefined>;
  accountAuthByHandle(handle: string): Promise<AuthRow | undefined>;
  setPassword(accountId: string, passwordHash: string): Promise<void>;
  handleTaken(handle: string): Promise<boolean>;
  setRating(id: string, rating: number): Promise<void>;
  opponents(exceptId: string, myRating: number, limit?: number): Promise<OpponentRow[]>;
  leaderboard(limit?: number): Promise<LeaderRow[]>;
  saveClub(accountId: string, club: Club, so: StandingOrders): Promise<void>;
  saveStandingOrders(accountId: string, so: StandingOrders): Promise<void>;
  getClub(accountId: string): Promise<{ club: Club; standingOrders: StandingOrders } | undefined>;
  // per-opponent saved plans (the strategy you last used vs a specific opponent)
  savePlan(ownerId: string, opponentId: string, plan: StandingOrders): Promise<void>;
  getPlan(ownerId: string, opponentId: string): Promise<StandingOrders | undefined>;
  // trial/loan academy: signed loanees (expire at season rollover)
  addLoanee(ownerId: string, seasonId: string, playerId: string): Promise<void>;
  countLoanees(ownerId: string, seasonId: string): Promise<number>;
  loaneeIds(ownerId: string, seasonId: string): Promise<string[]>;
  loaneesInSeason(seasonId: string): Promise<Array<{ owner_id: string; player_id: string }>>;
  deleteLoaneesInSeason(seasonId: string): Promise<void>;
  saveMatch(m: StoredMatch): Promise<void>;
  getMatch(id: string): Promise<StoredMatch | undefined>;
  matchesFor(accountId: string, limit?: number): Promise<MatchRow[]>;
  recentResults(limit?: number, seasonId?: string): Promise<ResultRow[]>;
  allAccounts(): Promise<LeaderRow[]>;
  allResults(): Promise<Array<{ home_id: string; away_id: string; home_score: number; away_score: number }>>;
  // seasons (Phase A)
  currentSeason(): Promise<Season | undefined>;
  createSeason(id: string, number: number, startsAt: number, endsAt: number): Promise<Season>;
  closeSeason(id: string): Promise<void>;
  seasonResults(seasonId: string): Promise<Array<{ home_id: string; away_id: string; home_score: number; away_score: number }>>;
  /** count of matches this account initiated (was home) in a season since a timestamp — for the daily cap */
  matchesToday(accountId: string, seasonId: string, sinceMs: number): Promise<number>;
  addHonour(accountId: string, seasonId: string, seasonNumber: number, tier: string, finalPos: number, title: number, endedAt: number): Promise<void>;
  honoursFor(accountId: string, limit?: number): Promise<HonourRow[]>;
  // divisions & pods (Phase B)
  accountTier(accountId: string): Promise<string>;
  setTier(accountId: string, tier: string): Promise<void>;
  podOf(seasonId: string, accountId: string): Promise<PodRef | undefined>;
  assignPod(seasonId: string, accountId: string, tier: string, pod: number): Promise<void>;
  tierPodCounts(seasonId: string, tier: string): Promise<Array<{ pod: number; count: number }>>;
  podMembers(seasonId: string, tier: string, pod: number): Promise<LeaderRow[]>;
  seasonPods(seasonId: string): Promise<PodRef[]>;
  reset(): Promise<void>;
}
