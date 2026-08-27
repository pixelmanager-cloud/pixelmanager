// The single-player "A-subset" of server/src/store.ts's `Store` interface — the persistence surface the
// deterministic game actually needs once PvP/wallet/pod/season-clock infra is dropped (see
// docs/offline-savestore-design.md). `client/src/save.ts`'s `LocalStore` implements this directly;
// `server/src/store.ts`'s `Store` still satisfies it structurally during the transition (same method
// names/params/return types — copied verbatim so Phase 3 can lift endpoint bodies against either one).
//
// `ownerId`/`accountId` params are kept for signature-compatibility with the lifted server logic but are
// IGNORED by `LocalStore` — a local save has exactly one owner.
import type { Club } from './teams.js';
import type { Token } from './token.js';
import type { StandingOrders } from './standingOrders.js';

/** A player's archived finish in a past (local) season, for the honours board. */
export interface HonourRow { season_number: number; tier: string; final_pos: number; title: number; ended_at: number; coin_reward: number; kind: string }

/** A dispatched scouting trip (Scouting Network). Outcome is sealed at dispatch; the found player (if
 *  any) is stored as JSON and revealed once ready_at passes. */
export interface MissionRow {
  id: string; account_id: string; season_id: string; destination: string;
  dispatched_at: number; ready_at: number; found: number; player_json: string | null;
  band: string | null; status: string; // 'travelling' | 'signed'
}

/** A reborn 10-year-old awaiting development in the Career sim (Layer 1). Structurally identical to a
 *  `Token` in `state === 'prospect'` — `LocalStore` derives these rows from `tokens`, it does not keep a
 *  parallel collection (see docs/offline-savestore-design.md's "Collapse" section). */
export interface ProspectRow { id: string; name: string; parent_id: string | null; role_hint: string; genes_json: string; pedigree: number; dev_bonus_json: string; born_season: number; developed: number; career_seed: number | null; agent_id: string | null; track: string | null; career_actions: string | null; developed_player_id: string | null }

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

export interface GameStore {
  init(): Promise<void>;
  reset(): Promise<void>;
  // economy
  getCoins(id: string): Promise<number>;
  addCoins(id: string, delta: number): Promise<void>;
  // club
  saveClub(accountId: string, club: Club, so: StandingOrders): Promise<void>;
  saveStandingOrders(accountId: string, so: StandingOrders): Promise<void>;
  getClub(accountId: string): Promise<{ club: Club; standingOrders: StandingOrders } | undefined>;
  // facilities
  getFacilities(accountId: string): Promise<{ stadium: number; training: number; youth: number; scouting: number; medical: number; sponsor: number; fanzone: number }>;
  setFacilityLevel(accountId: string, key: string, level: number): Promise<void>;
  // injuries
  getInjuries(accountId: string): Promise<Array<{ player_id: string; matches_remaining: number }>>;
  addInjury(accountId: string, playerId: string, matches: number): Promise<void>;
  decrementInjuries(accountId: string): Promise<void>;
  // tokens (central — the unified fixed-supply NFT flowing through the lifecycle)
  createToken(t: { id: string; owner_id: string; generation: number; state: string; name: string; genes_json: string; pedigree: number; dev_bonus_json: string }): Promise<void>;
  getToken(id: string): Promise<Token | undefined>;
  tokensOwnedBy(ownerId: string): Promise<Token[]>;
  countTokens(): Promise<number>;
  updateToken(id: string, fields: Partial<Token>): Promise<void>;
  // prospects (folded into tokens — see ProspectRow doc-comment)
  createProspect(p: { id: string; owner_id: string; name: string; parent_id: string | null; role_hint: string; genes_json: string; pedigree: number; dev_bonus_json: string; born_season: number }): Promise<void>;
  prospectsFor(ownerId: string): Promise<ProspectRow[]>;
  getProspect(id: string): Promise<(ProspectRow & { owner_id: string }) | undefined>;
  startProspectCareer(id: string, seed: number, agentId: string | null, track: string): Promise<void>;
  saveProspectActions(id: string, actionsJson: string): Promise<void>;
  setProspectDeveloped(id: string, playerId: string): Promise<void>;
  // contracts (thin wrappers over Token fields) + owner-independent player age
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
  // per-season player stats (goals/assists/apps/potm) + individual season awards
  bumpPlayerStats(seasonId: string, accountId: string, playerId: string, playerName: string, d: { goals?: number; assists?: number; apps?: number; potm?: number }): Promise<void>;
  seasonPlayerStats(seasonId: string, accountIds: string[]): Promise<PlayerSeasonStat[]>;
  addAward(a: Award): Promise<void>;
  awardsFor(accountId: string, limit?: number): Promise<Award[]>;
  // scouting network: dispatched trips (sealed at dispatch, revealed after travel) + loanees
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
  // honours
  addHonour(accountId: string, seasonId: string, seasonNumber: number, tier: string, finalPos: number, title: number, endedAt: number, coinReward: number, kind: string): Promise<void>;
  honoursFor(accountId: string, limit?: number): Promise<HonourRow[]>;
}
