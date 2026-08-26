// Storage interface. Two backends implement it: node:sqlite (local dev) and
// Postgres (production). Everything is async so both fit the same shape.
import type { Club, Duty, Lineup, Tactics } from '@fm/shared';

export interface StandingOrders { formation: Lineup['formation']; playerIds: string[]; tactics: Tactics; duties?: Duty[]; captainIdx?: number; takers?: { pen?: number; fk?: number; corner?: number } }
/** Serialize / parse the manager squad roles (captain + set-piece takers) for the so_roles column. */
export const rolesJson = (so: StandingOrders): string | null =>
  so.captainIdx != null || so.takers ? JSON.stringify({ captainIdx: so.captainIdx, takers: so.takers }) : null;
export const parseRoles = (s: string | null | undefined): { captainIdx?: number; takers?: { pen?: number; fk?: number; corner?: number } } =>
  s ? JSON.parse(s) : {};
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
export interface HonourRow { season_number: number; tier: string; final_pos: number; title: number; ended_at: number; coin_reward: number; kind: string }
/** A player's placement within the division pyramid for a season (Phase B). */
export interface PodRef { tier: string; pod: number }
/** A dispatched scouting trip (Scouting Network). Outcome is sealed at dispatch; the
 *  found player (if any) is stored as JSON and revealed once ready_at passes. */
export interface MissionRow {
  id: string; account_id: string; season_id: string; destination: string;
  dispatched_at: number; ready_at: number; found: number; player_json: string | null;
  band: string | null; status: string; // 'travelling' | 'signed'
}
/** A transfer-market listing (a squad player put up for coins). */
export interface Listing {
  id: string; seller_id: string; seller_handle: string; player_id: string;
  player_json: string; price: number; status: 'active' | 'sold' | 'cancelled';
  created_at: number; buyer_id: string | null; sold_at: number | null;
}

/** Auth row used by /login: the account plus its bearer token and password hash. */
export interface AuthRow { id: string; handle: string; rating: number; token: string; passwordHash: string | null }

export interface ProspectRow { id: string; name: string; parent_id: string | null; role_hint: string; genes_json: string; pedigree: number; dev_bonus_json: string; born_season: number; developed: number; career_seed: number | null; agent_id: string | null; track: string | null; career_actions: string | null; developed_player_id: string | null }

/** The UNIFIED, fixed-supply NFT — one persistent id through the whole lifecycle (prospect→pro→retired→
 *  reborn). All lifecycle state lives on this one row. */
export interface Token {
  id: string; owner_id: string; generation: number; state: 'prospect' | 'pro' | 'retired'; name: string;
  genes_json: string; pedigree: number; dev_bonus_json: string;
  career_seed: number | null; agent_id: string | null; track: string | null; career_actions: string | null;
  attrs_json: string | null; role: string | null; traits_json: string | null; personality: string | null;
  greed: number | null; marketability: number | null; earnings: number | null; prime_season: number | null; peak_overall: number;
  signed_season: number | null; length_seasons: number | null; staked_since: number | null;
  ach_seasons: number; ach_apps: number; ach_league: number; ach_cup: number; ach_promotions: number; ach_tier: number; morale: number;
  ach_goals: number; ach_assists: number; ach_potm: number;
  kit_json: string | null;   // cosmetic kit & identity (number, boots, celebration, nickname) — carries to the pro
}
/** Columns updateToken() may set (whitelist — guards the dynamic UPDATE). */
export const TOKEN_COLS = new Set<string>(['owner_id', 'generation', 'state', 'name', 'genes_json', 'pedigree', 'dev_bonus_json',
  'career_seed', 'agent_id', 'track', 'career_actions', 'attrs_json', 'role', 'traits_json', 'personality',
  'greed', 'marketability', 'earnings', 'prime_season', 'peak_overall', 'signed_season', 'length_seasons', 'staked_since',
  'ach_seasons', 'ach_apps', 'ach_league', 'ach_cup', 'ach_promotions', 'ach_tier', 'morale',
  'ach_goals', 'ach_assists', 'ach_potm', 'kit_json']);

/** A player's per-season tallies (all players — base + NFT — for leaderboards). */
export interface PlayerSeasonStat {
  season_id: string; account_id: string; player_id: string; player_name: string;
  goals: number; assists: number; apps: number; potm: number;
}
/** An individual end-of-season award won by a player (Golden Boot / Playmaker / League Best / …). */
export interface Award {
  season_id: string; season_number: number; tier: string; pod: number;
  kind: string; account_id: string; player_id: string; player_name: string; value: number; awarded_at: number;
}

export interface Store {
  init(): Promise<void>;
  createAccount(id: string, handle: string, token: string, createdAt: number, passwordHash: string): Promise<void>;
  accountByToken(token: string): Promise<Account | undefined>;
  accountById(id: string): Promise<Account | undefined>;
  accountAuthByHandle(handle: string): Promise<AuthRow | undefined>;
  setPassword(accountId: string, passwordHash: string): Promise<void>;
  // wallet sign-in (web3 Step 1): address ⇄ account
  walletAccount(address: string): Promise<{ id: string; handle: string; rating: number; token: string } | undefined>;
  linkWallet(accountId: string, address: string): Promise<void>;
  walletOf(accountId: string): Promise<string | null>;
  handleTaken(handle: string): Promise<boolean>;
  setRating(id: string, rating: number): Promise<void>;
  // transfer-market economy (coins + listings)
  getCoins(id: string): Promise<number>;
  addCoins(id: string, delta: number): Promise<void>;
  createListing(l: Listing): Promise<void>;
  activeListings(limit?: number): Promise<Listing[]>;
  listingsBySeller(sellerId: string): Promise<Listing[]>;
  listingById(id: string): Promise<Listing | undefined>;
  activeListingForPlayer(playerId: string): Promise<Listing | undefined>;
  setListingStatus(id: string, status: 'sold' | 'cancelled', buyerId: string | null, soldAt: number | null): Promise<void>;
  opponents(exceptId: string, myRating: number, limit?: number): Promise<OpponentRow[]>;
  leaderboard(limit?: number): Promise<LeaderRow[]>;
  saveClub(accountId: string, club: Club, so: StandingOrders): Promise<void>;
  saveStandingOrders(accountId: string, so: StandingOrders): Promise<void>;
  getClub(accountId: string): Promise<{ club: Club; standingOrders: StandingOrders } | undefined>;
  // per-opponent saved plans (the strategy you last used vs a specific opponent)
  savePlan(ownerId: string, opponentId: string, plan: StandingOrders): Promise<void>;
  getPlan(ownerId: string, opponentId: string): Promise<StandingOrders | undefined>;
  // trial/loan academy: signed loanees (expire at season rollover)
  // club facilities (persistent per-club upgrade levels)
  getFacilities(accountId: string): Promise<{ stadium: number; training: number; youth: number; scouting: number; medical: number; sponsor: number; fanzone: number }>;
  setFacilityLevel(accountId: string, key: string, level: number): Promise<void>;
  // injuries (per-club player unavailability, counts down as the club plays matches)
  getInjuries(accountId: string): Promise<Array<{ player_id: string; matches_remaining: number }>>;
  addInjury(accountId: string, playerId: string, matches: number): Promise<void>;
  decrementInjuries(accountId: string): Promise<void>;
  // contracts (off-chain terms gating selection of owned NFT players) + owner-independent player age
  getContracts(ownerId: string): Promise<Array<{ player_id: string; signed_season: number; length_seasons: number; staked_since: number }>>;
  setContract(ownerId: string, playerId: string, signedSeason: number, lengthSeasons: number, stakedSince: number): Promise<void>;
  deleteContract(ownerId: string, playerId: string): Promise<void>;
  getPrimeSeason(playerId: string): Promise<number | undefined>;
  ensurePrimeSeason(playerId: string, season: number): Promise<number>;
  // lifecycle (age/retirement/peak) + team achievements + retirement legacy cards — all owner-independent
  getLifecycle(playerId: string): Promise<{ prime_season: number; retired: number; peak_overall: number } | undefined>;
  setPeakOverall(playerId: string, overall: number): Promise<void>;
  retirePlayer(playerId: string): Promise<void>;
  getAchievements(playerId: string): Promise<{ seasons: number; apps: number; league_titles: number; cup_titles: number; promotions: number; highest_tier_idx: number }>;
  addApps(playerId: string, n: number): Promise<void>;
  recordPlayerSeason(playerId: string, a: { league: number; cup: number; promotion: number; tierIdx: number }): Promise<void>;
  setAchievements(playerId: string, a: { seasons: number; apps: number; league_titles: number; cup_titles: number; promotions: number; highest_tier_idx: number }): Promise<void>;
  saveLegacy(playerId: string, ownerId: string, name: string, cardJson: string, retiredSeason: number): Promise<void>;
  getLegacy(playerId: string): Promise<{ player_id: string; owner_id: string; name: string; card_json: string; retired_season: number; reborn_id: string | null } | undefined>;
  legaciesFor(ownerId: string): Promise<Array<{ player_id: string; name: string; card_json: string; retired_season: number; reborn_id: string | null }>>;
  setReborn(playerId: string, rebornId: string): Promise<void>;
  // prospects — reborn 10-year-olds awaiting development in the Career sim (Layer 1)
  createProspect(p: { id: string; owner_id: string; name: string; parent_id: string | null; role_hint: string; genes_json: string; pedigree: number; dev_bonus_json: string; born_season: number }): Promise<void>;
  prospectsFor(ownerId: string): Promise<ProspectRow[]>;
  getProspect(id: string): Promise<(ProspectRow & { owner_id: string }) | undefined>;
  startProspectCareer(id: string, seed: number, agentId: string | null, track: string): Promise<void>;
  saveProspectActions(id: string, actionsJson: string): Promise<void>;
  setProspectDeveloped(id: string, playerId: string): Promise<void>;
  // unified tokens (fixed-supply NFT flowing through the lifecycle)
  createToken(t: { id: string; owner_id: string; generation: number; state: string; name: string; genes_json: string; pedigree: number; dev_bonus_json: string }): Promise<void>;
  getToken(id: string): Promise<Token | undefined>;
  tokensOwnedBy(ownerId: string): Promise<Token[]>;
  countTokens(): Promise<number>;
  updateToken(id: string, fields: Partial<Token>): Promise<void>;
  // per-season player stats (goals/assists/apps/potm for ALL players, for leaderboards + awards)
  bumpPlayerStats(seasonId: string, accountId: string, playerId: string, playerName: string, d: { goals?: number; assists?: number; apps?: number; potm?: number }): Promise<void>;
  seasonPlayerStats(seasonId: string, accountIds: string[]): Promise<PlayerSeasonStat[]>;
  // individual season awards (Golden Boot / Playmaker / League Best)
  addAward(a: Award): Promise<void>;
  awardsFor(accountId: string, limit?: number): Promise<Award[]>;
  // scouting network: dispatched trips (sealed at dispatch, revealed after travel)
  createMission(m: MissionRow): Promise<void>;
  missionsInSeason(accountId: string, seasonId: string): Promise<MissionRow[]>;
  missionById(id: string): Promise<MissionRow | undefined>;
  setMissionSigned(id: string): Promise<void>;
  countMissionsInSeason(accountId: string, seasonId: string): Promise<number>;
  addLoanee(ownerId: string, seasonId: string, playerId: string): Promise<void>;
  countLoanees(ownerId: string, seasonId: string): Promise<number>;
  loaneeIds(ownerId: string, seasonId: string): Promise<string[]>;
  loaneesInSeason(seasonId: string): Promise<Array<{ owner_id: string; player_id: string }>>;
  deleteLoaneesInSeason(seasonId: string): Promise<void>;
  saveMatch(m: StoredMatch): Promise<void>;
  getMatch(id: string): Promise<StoredMatch | undefined>;
  matchesFor(accountId: string, limit?: number): Promise<MatchRow[]>;
  recentResults(limit?: number, seasonId?: string): Promise<ResultRow[]>;
  /** every match an account has ever played (any season), newest first, with opponent handles — for club records */
  resultsFor(accountId: string, limit?: number): Promise<ResultRow[]>;
  /** an account's players' goals/apps summed across ALL seasons (not just the current one) — for club records */
  allTimePlayerStats(accountId: string): Promise<Array<{ player_id: string; player_name: string; goals: number; apps: number }>>;
  allAccounts(): Promise<LeaderRow[]>;
  allResults(): Promise<Array<{ home_id: string; away_id: string; home_score: number; away_score: number }>>;
  // seasons (Phase A)
  currentSeason(): Promise<Season | undefined>;
  createSeason(id: string, number: number, startsAt: number, endsAt: number): Promise<Season>;
  closeSeason(id: string): Promise<void>;
  seasonResults(seasonId: string): Promise<Array<{ home_id: string; away_id: string; home_score: number; away_score: number }>>;
  /** count of matches this account initiated (was home) in a season since a timestamp — for the daily cap */
  matchesToday(accountId: string, seasonId: string, sinceMs: number): Promise<number>;
  addHonour(accountId: string, seasonId: string, seasonNumber: number, tier: string, finalPos: number, title: number, endedAt: number, coinReward: number, kind: string): Promise<void>;
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
