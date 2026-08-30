// The local SaveStore (phase 2 offline migration — see docs/offline-savestore-design.md). Replaces the
// Fastify + SQLite/Postgres persistence with one in-memory `SaveModel`, mutated synchronously by
// `LocalStore` (the single-player A-subset of server/src/store.ts's `Store`, defined as `GameStore` in
// @fm/shared) and persisted (debounced) to a pluggable backend.
//
// NOT WIRED IN YET — this module is additive and unused until Phase 3 points the `api.ts` facade at a
// `LocalStore` singleton. Built + tested standalone here (see shared/qa_savestore.ts).
import {
  makeClub, DEFAULT_FACILITIES, type FacilityKey, type Facilities,
  type Club, type StandingOrders, type Token,
  type GameStore, type HonourRow, type MissionRow, type ProspectRow, type PlayerSeasonStat, type Award,
} from '@fm/shared';

// The whole save belongs to one local profile — server-era `ownerId`/`accountId` params are accepted
// (for signature-compatibility with lifted server logic, see GameStore doc-comment) but ignored.
const OWNER = 'local';

// ── the SaveModel — everything that persists (see docs/offline-savestore-design.md) ──
export interface SaveModel {
  version: number; // save-format version; see migrate() below
  profile: { name: string; coins: number; createdAt: number; season: number; wins?: number; draws?: number; losses?: number }; // season = local counter; W/D/L = lifetime manager record (accrued at each season-end, powers prestige)
  club: Club;
  standingOrders: StandingOrders;
  tokens: Token[]; // THE HEART — unified lifecycle records (prospect/pro/retired)
  /** The shared Facilities shape, not a hand-copy of it. This listed only the original seven while the
   *  game had long shipped twelve, so the five newer ones were present in every save and invisible to the
   *  type — which is how their effects went unwired without a single compile error. */
  facilities: Facilities;
  injuries: { playerId: string; matchesRemaining: number }[];
  legacies: { playerId: string; name: string; cardJson: string; retiredSeason: number; rebornId: string | null }[];
  honours: HonourRow[];
  awards: Award[];
  missions: MissionRow[];
  loanees: { seasonId: string; playerId: string }[];
  retiredNumbers: { n: number; name: string }[];
  // per-season tallies backing bumpPlayerStats/seasonPlayerStats (goals/assists/apps/potm for ALL
  // fielded players, base + NFT — the design doc's SaveModel sketch folds this into no other collection,
  // so it gets its own here; a Token's ach_* fields are lifetime totals, these are per-season).
  playerStats: PlayerSeasonStat[];
}

// 2 — the bloodline became a FOREST. Token gained `parent_id` and `branch`, so a save written before
// branching has neither and every generation would render as its own separate trunk on the Family Record.
export const SAVE_VERSION = 2;

/** Bring an older save up to SAVE_VERSION. Pure and idempotent — running it twice must be a no-op. */
export function migrate(m: SaveModel): SaveModel {
  if ((m.version ?? 1) >= SAVE_VERSION) return m;
  // v1 → v2. Before branching there was exactly one heir per generation, so the forest is recoverable
  // from the generation counter alone: each token's father is the one generation above it. Anyone with
  // no generation above is a root, which is correct for the founder.
  const byGen = new Map<number, Token[]>();
  for (const t of m.tokens) {
    const g = t.generation ?? 0;
    (byGen.get(g) ?? byGen.set(g, []).get(g)!).push(t);
  }
  for (const t of m.tokens) {
    const anyT = t as any;
    if (anyT.branch == null) anyT.branch = 'played';   // every pre-branching token was a played line
    if (anyT.parent_id === undefined) {
      const parents = byGen.get((t.generation ?? 0) - 1) ?? [];
      anyT.parent_id = parents.length === 1 ? parents[0].id : null;
    }
  }
  return { ...m, version: SAVE_VERSION };
}

/** An empty new-game save. `Date.now()`/`Math.random()` here are fine — this is client, not @fm/shared. */
export function freshSave(name: string): SaveModel {
  const seed = Math.floor(Math.random() * 2 ** 31);
  const shirtColor = Math.floor(Math.random() * 0xffffff);
  const { club, standingOrders } = makeClub(OWNER, name, seed, shirtColor);
  return {
    version: SAVE_VERSION,
    profile: { name, coins: 500, createdAt: Date.now(), season: 0 },
    club, standingOrders,
    tokens: [],
    facilities: { ...DEFAULT_FACILITIES },
    injuries: [],
    legacies: [],
    honours: [],
    awards: [],
    missions: [],
    loanees: [],
    retiredNumbers: [],
    playerStats: [],
  };
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

// ── LocalStore — the GameStore, operating synchronously on an in-memory SaveModel ──
export class LocalStore implements GameStore {
  constructor(private readonly box: { model: SaveModel }, private readonly onMutate: () => void) {}
  private get m(): SaveModel { return this.box.model; }
  private touch(): void { this.onMutate(); }

  async init(): Promise<void> { /* no-op: the slot manager owns loading the model into the box */ }
  async reset(): Promise<void> { this.box.model = freshSave(this.m.profile.name); this.touch(); }

  // ── economy ──
  async getCoins(_id: string): Promise<number> { return this.m.profile.coins; }
  async addCoins(_id: string, delta: number): Promise<void> { this.m.profile.coins += delta; this.touch(); }

  // ── club ──
  async saveClub(_accountId: string, club: Club, so: StandingOrders): Promise<void> {
    this.m.club = club; this.m.standingOrders = so; this.touch();
  }
  async saveStandingOrders(_accountId: string, so: StandingOrders): Promise<void> {
    this.m.standingOrders = so; this.touch();
  }
  async getClub(_accountId: string): Promise<{ club: Club; standingOrders: StandingOrders } | undefined> {
    return { club: this.m.club, standingOrders: this.m.standingOrders };
  }

  // ── facilities ──
  async getFacilities(_accountId: string) { return { ...this.m.facilities }; }
  async setFacilityLevel(_accountId: string, key: string, level: number): Promise<void> {
    (this.m.facilities as unknown as Record<string, number>)[key] = level; this.touch();
  }

  // ── injuries ──
  async getInjuries(_accountId: string): Promise<Array<{ player_id: string; matches_remaining: number }>> {
    return this.m.injuries.map((i) => ({ player_id: i.playerId, matches_remaining: i.matchesRemaining }));
  }
  async addInjury(_accountId: string, playerId: string, matches: number): Promise<void> {
    const existing = this.m.injuries.find((i) => i.playerId === playerId);
    if (existing) existing.matchesRemaining = matches;
    else this.m.injuries.push({ playerId, matchesRemaining: matches });
    this.touch();
  }
  async decrementInjuries(_accountId: string): Promise<void> {
    for (const i of this.m.injuries) i.matchesRemaining -= 1;
    this.m.injuries = this.m.injuries.filter((i) => i.matchesRemaining > 0);
    this.touch();
  }

  // ── tokens (central) ──
  async createToken(t: { id: string; owner_id: string; generation: number; state: string; name: string; genes_json: string; pedigree: number; dev_bonus_json: string }): Promise<void> {
    const token: Token = {
      id: t.id, owner_id: t.owner_id, generation: t.generation, state: t.state as Token['state'], name: t.name,
      genes_json: t.genes_json, pedigree: t.pedigree, dev_bonus_json: t.dev_bonus_json,
      career_seed: null, agent_id: null, track: null, career_actions: null,
      attrs_json: null, role: null, traits_json: null, personality: null,
      greed: null, marketability: null, earnings: null, prime_season: null, peak_overall: 0,
      signed_season: null, length_seasons: null, staked_since: null,
      ach_seasons: 0, ach_apps: 0, ach_league: 0, ach_cup: 0, ach_promotions: 0, ach_tier: 0, morale: 65,
      ach_goals: 0, ach_assists: 0, ach_potm: 0, kit_json: null, career_honours_json: null, parent_id: null, branch: 'played',
    };
    this.m.tokens.push(token); this.touch();
  }
  async getToken(id: string): Promise<Token | undefined> { return this.m.tokens.find((t) => t.id === id); }
  async tokensOwnedBy(_ownerId: string): Promise<Token[]> { return this.m.tokens.slice(); }
  async countTokens(): Promise<number> { return this.m.tokens.length; }
  async updateToken(id: string, fields: Partial<Token>): Promise<void> {
    const t = this.m.tokens.find((x) => x.id === id);
    if (!t) return;
    Object.assign(t, fields);
    this.touch();
  }

  // ── prospects — folded into tokens (state === 'prospect'); see docs/offline-savestore-design.md ──
  private toProspectRow(t: Token): ProspectRow & { owner_id: string } {
    return {
      id: t.id, owner_id: t.owner_id, name: t.name, parent_id: null, role_hint: t.role ?? 'MF',
      genes_json: t.genes_json, pedigree: t.pedigree, dev_bonus_json: t.dev_bonus_json,
      born_season: this.m.profile.season, developed: t.state === 'prospect' ? 0 : 1,
      career_seed: t.career_seed, agent_id: t.agent_id, track: t.track, career_actions: t.career_actions,
      developed_player_id: t.state === 'prospect' ? null : t.id,
    };
  }
  async createProspect(p: { id: string; owner_id: string; name: string; parent_id: string | null; role_hint: string; genes_json: string; pedigree: number; dev_bonus_json: string; born_season: number }): Promise<void> {
    await this.createToken({ id: p.id, owner_id: p.owner_id, generation: 0, state: 'prospect', name: p.name, genes_json: p.genes_json, pedigree: p.pedigree, dev_bonus_json: p.dev_bonus_json });
    await this.updateToken(p.id, { role: p.role_hint });
  }
  async prospectsFor(_ownerId: string): Promise<ProspectRow[]> {
    return this.m.tokens.filter((t) => t.state === 'prospect').map((t) => this.toProspectRow(t));
  }
  async getProspect(id: string): Promise<(ProspectRow & { owner_id: string }) | undefined> {
    const t = this.m.tokens.find((x) => x.id === id && x.state === 'prospect');
    return t ? this.toProspectRow(t) : undefined;
  }
  async startProspectCareer(id: string, seed: number, agentId: string | null, track: string): Promise<void> {
    await this.updateToken(id, { career_seed: seed, agent_id: agentId, track, career_actions: '[]' });
  }
  async saveProspectActions(id: string, actionsJson: string): Promise<void> {
    await this.updateToken(id, { career_actions: actionsJson });
  }
  async setProspectDeveloped(id: string, _playerId: string): Promise<void> {
    // the token IS the developed player (same id) — nothing to link, kept for interface compatibility
    void id;
  }

  // ── contracts (thin wrappers over Token fields) ──
  async getContracts(_ownerId: string): Promise<Array<{ player_id: string; signed_season: number; length_seasons: number; staked_since: number }>> {
    return this.m.tokens
      .filter((t) => t.signed_season != null)
      .map((t) => ({ player_id: t.id, signed_season: t.signed_season!, length_seasons: t.length_seasons ?? 3, staked_since: t.staked_since ?? 0 }));
  }
  async setContract(_ownerId: string, playerId: string, signedSeason: number, lengthSeasons: number, stakedSince: number): Promise<void> {
    await this.updateToken(playerId, { signed_season: signedSeason, length_seasons: lengthSeasons, staked_since: stakedSince });
  }
  async deleteContract(_ownerId: string, playerId: string): Promise<void> {
    await this.updateToken(playerId, { signed_season: null, length_seasons: null, staked_since: null });
  }
  async getPrimeSeason(playerId: string): Promise<number | undefined> {
    return this.m.tokens.find((t) => t.id === playerId)?.prime_season ?? undefined;
  }
  async ensurePrimeSeason(playerId: string, season: number): Promise<number> {
    const t = this.m.tokens.find((x) => x.id === playerId);
    if (!t) return season;
    if (t.prime_season == null) { t.prime_season = season; this.touch(); }
    return t.prime_season;
  }

  // ── lifecycle / achievements / legacy ──
  async getLifecycle(playerId: string): Promise<{ prime_season: number; retired: number; peak_overall: number } | undefined> {
    const t = this.m.tokens.find((x) => x.id === playerId);
    return t ? { prime_season: t.prime_season ?? 0, retired: t.state === 'retired' ? 1 : 0, peak_overall: t.peak_overall } : undefined;
  }
  async setPeakOverall(playerId: string, overall: number): Promise<void> { await this.updateToken(playerId, { peak_overall: overall }); }
  async retirePlayer(playerId: string): Promise<void> { await this.updateToken(playerId, { state: 'retired' }); }
  async getAchievements(playerId: string): Promise<{ seasons: number; apps: number; league_titles: number; cup_titles: number; promotions: number; highest_tier_idx: number }> {
    const t = this.m.tokens.find((x) => x.id === playerId);
    if (!t) return { seasons: 0, apps: 0, league_titles: 0, cup_titles: 0, promotions: 0, highest_tier_idx: 0 };
    return { seasons: t.ach_seasons, apps: t.ach_apps, league_titles: t.ach_league, cup_titles: t.ach_cup, promotions: t.ach_promotions, highest_tier_idx: t.ach_tier };
  }
  async addApps(playerId: string, n: number): Promise<void> {
    const t = this.m.tokens.find((x) => x.id === playerId);
    if (!t) return;
    t.ach_apps += n; this.touch();
  }
  async recordPlayerSeason(playerId: string, a: { league: number; cup: number; promotion: number; tierIdx: number }): Promise<void> {
    const t = this.m.tokens.find((x) => x.id === playerId);
    if (!t) return;
    t.ach_seasons += 1; t.ach_league += a.league; t.ach_cup += a.cup; t.ach_promotions += a.promotion;
    t.ach_tier = Math.max(t.ach_tier, a.tierIdx);
    this.touch();
  }
  async setAchievements(playerId: string, a: { seasons: number; apps: number; league_titles: number; cup_titles: number; promotions: number; highest_tier_idx: number }): Promise<void> {
    await this.updateToken(playerId, { ach_seasons: a.seasons, ach_apps: a.apps, ach_league: a.league_titles, ach_cup: a.cup_titles, ach_promotions: a.promotions, ach_tier: a.highest_tier_idx });
  }
  async saveLegacy(playerId: string, ownerId: string, name: string, cardJson: string, retiredSeason: number): Promise<void> {
    const existing = this.m.legacies.find((l) => l.playerId === playerId);
    const rebornId = existing?.rebornId ?? null;
    this.m.legacies = this.m.legacies.filter((l) => l.playerId !== playerId);
    this.m.legacies.push({ playerId, name, cardJson, retiredSeason, rebornId });
    void ownerId; // single owner — kept for signature compatibility
    this.touch();
  }
  async getLegacy(playerId: string): Promise<{ player_id: string; owner_id: string; name: string; card_json: string; retired_season: number; reborn_id: string | null } | undefined> {
    const l = this.m.legacies.find((x) => x.playerId === playerId);
    return l ? { player_id: l.playerId, owner_id: OWNER, name: l.name, card_json: l.cardJson, retired_season: l.retiredSeason, reborn_id: l.rebornId } : undefined;
  }
  async legaciesFor(_ownerId: string): Promise<Array<{ player_id: string; name: string; card_json: string; retired_season: number; reborn_id: string | null }>> {
    return this.m.legacies.slice().sort((a, b) => b.retiredSeason - a.retiredSeason)
      .map((l) => ({ player_id: l.playerId, name: l.name, card_json: l.cardJson, retired_season: l.retiredSeason, reborn_id: l.rebornId }));
  }
  async setReborn(playerId: string, rebornId: string): Promise<void> {
    const l = this.m.legacies.find((x) => x.playerId === playerId);
    if (l) { l.rebornId = rebornId; this.touch(); }
  }

  // ── per-season player stats + awards ──
  async bumpPlayerStats(seasonId: string, accountId: string, playerId: string, playerName: string, d: { goals?: number; assists?: number; apps?: number; potm?: number }): Promise<void> {
    let s = this.m.playerStats.find((x) => x.season_id === seasonId && x.account_id === accountId && x.player_id === playerId);
    if (!s) { s = { season_id: seasonId, account_id: accountId, player_id: playerId, player_name: playerName, goals: 0, assists: 0, apps: 0, potm: 0 }; this.m.playerStats.push(s); }
    s.player_name = playerName; s.goals += d.goals ?? 0; s.assists += d.assists ?? 0; s.apps += d.apps ?? 0; s.potm += d.potm ?? 0;
    this.touch();
  }
  async seasonPlayerStats(seasonId: string, accountIds: string[]): Promise<PlayerSeasonStat[]> {
    const ids = new Set(accountIds);
    return this.m.playerStats.filter((s) => s.season_id === seasonId && ids.has(s.account_id));
  }
  async addAward(a: Award): Promise<void> { this.m.awards.push(a); this.touch(); }
  async awardsFor(accountId: string, limit = 50): Promise<Award[]> {
    return this.m.awards.filter((a) => a.account_id === accountId).sort((a, b) => b.awarded_at - a.awarded_at).slice(0, limit);
  }

  // ── scouting missions + loanees ──
  async createMission(m: MissionRow): Promise<void> { this.m.missions.push(m); this.touch(); }
  async missionsInSeason(accountId: string, seasonId: string): Promise<MissionRow[]> {
    return this.m.missions.filter((x) => x.account_id === accountId && x.season_id === seasonId).sort((a, b) => b.dispatched_at - a.dispatched_at);
  }
  async missionById(id: string): Promise<MissionRow | undefined> { return this.m.missions.find((x) => x.id === id); }
  async setMissionSigned(id: string): Promise<void> {
    const m = this.m.missions.find((x) => x.id === id);
    if (m) { m.status = 'signed'; this.touch(); }
  }
  async countMissionsInSeason(accountId: string, seasonId: string): Promise<number> {
    return this.m.missions.filter((x) => x.account_id === accountId && x.season_id === seasonId).length;
  }
  async addLoanee(ownerId: string, seasonId: string, playerId: string): Promise<void> {
    if (!this.m.loanees.some((l) => l.seasonId === seasonId && l.playerId === playerId)) {
      this.m.loanees.push({ seasonId, playerId }); this.touch();
    }
    void ownerId;
  }
  async countLoanees(_ownerId: string, seasonId: string): Promise<number> {
    return this.m.loanees.filter((l) => l.seasonId === seasonId).length;
  }
  async loaneeIds(_ownerId: string, seasonId: string): Promise<string[]> {
    return this.m.loanees.filter((l) => l.seasonId === seasonId).map((l) => l.playerId);
  }
  async loaneesInSeason(seasonId: string): Promise<Array<{ owner_id: string; player_id: string }>> {
    return this.m.loanees.filter((l) => l.seasonId === seasonId).map((l) => ({ owner_id: OWNER, player_id: l.playerId }));
  }
  async deleteLoaneesInSeason(seasonId: string): Promise<void> {
    this.m.loanees = this.m.loanees.filter((l) => l.seasonId !== seasonId); this.touch();
  }

  // ── honours ──
  async addHonour(_accountId: string, _seasonId: string, seasonNumber: number, tier: string, finalPos: number, title: number, endedAt: number, coinReward: number, kind: string): Promise<void> {
    this.m.honours.push({ season_number: seasonNumber, tier, final_pos: finalPos, title, ended_at: endedAt, coin_reward: coinReward, kind });
    this.touch();
  }
  async honoursFor(_accountId: string, limit = 30): Promise<HonourRow[]> {
    return this.m.honours.slice().sort((a, b) => b.season_number - a.season_number).slice(0, limit);
  }
}

// ── persistence backend (pluggable) ──
export interface SaveMeta { id: string; name: string; lastPlayed: number }
export interface SaveBackend {
  list(): Promise<SaveMeta[]>;
  load(id: string): Promise<SaveModel | null>;
  save(id: string, model: SaveModel): Promise<void>;
  remove(id: string): Promise<void>;
}

/** A tiny in-memory backend — used by the standalone test harness (no IndexedDB under tsx/node), and as
 *  the safe default when `indexedDB` isn't available (e.g. SSR). */
export function createInMemoryBackend(): SaveBackend {
  const meta = new Map<string, SaveMeta>();
  const models = new Map<string, SaveModel>();
  return {
    async list() { return Array.from(meta.values()).sort((a, b) => b.lastPlayed - a.lastPlayed); },
    async load(id) { const m = models.get(id); return m ? clone(m) : null; },
    async save(id, model) {
      models.set(id, clone(model));
      meta.set(id, { id, name: model.profile.name, lastPlayed: Date.now() });
    },
    async remove(id) { models.delete(id); meta.delete(id); },
  };
}

const DB_NAME = 'fm-saves';
const DB_VERSION = 1;
const META_STORE = 'meta';
const MODEL_STORE = 'models';

/** IndexedDB-backed save slots (web/dev build). A desktop (Steam Cloud) FileBackend — one JSON file per
 *  slot on disk — can implement the same `SaveBackend` interface later; not needed until the wrapper exists. */
export class IndexedDBBackend implements SaveBackend {
  private dbp: Promise<IDBDatabase> | null = null;

  private open(): Promise<IDBDatabase> {
    if (!this.dbp) {
      this.dbp = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE, { keyPath: 'id' });
          if (!db.objectStoreNames.contains(MODEL_STORE)) db.createObjectStore(MODEL_STORE, { keyPath: 'id' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this.dbp;
  }
  private async tx<T>(stores: string[], mode: IDBTransactionMode, fn: (tx: IDBTransaction) => Promise<T> | T): Promise<T> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(stores, mode);
      let result: T;
      Promise.resolve(fn(t)).then((r) => { result = r; }).catch(reject);
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }
  private static req<T>(r: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
  }

  async list(): Promise<SaveMeta[]> {
    return this.tx([META_STORE], 'readonly', async (t) => {
      const all = await IndexedDBBackend.req<SaveMeta[]>(t.objectStore(META_STORE).getAll());
      return all.sort((a, b) => b.lastPlayed - a.lastPlayed);
    });
  }
  async load(id: string): Promise<SaveModel | null> {
    return this.tx([MODEL_STORE], 'readonly', async (t) => {
      const rec = await IndexedDBBackend.req<{ id: string; model: SaveModel } | undefined>(t.objectStore(MODEL_STORE).get(id));
      return rec ? rec.model : null;
    });
  }
  async save(id: string, model: SaveModel): Promise<void> {
    await this.tx([META_STORE, MODEL_STORE], 'readwrite', (t) => {
      t.objectStore(MODEL_STORE).put({ id, model });
      t.objectStore(META_STORE).put({ id, name: model.profile.name, lastPlayed: Date.now() });
    });
  }
  async remove(id: string): Promise<void> {
    await this.tx([META_STORE, MODEL_STORE], 'readwrite', (t) => {
      t.objectStore(META_STORE).delete(id);
      t.objectStore(MODEL_STORE).delete(id);
    });
  }
}

const defaultBackend: SaveBackend = typeof indexedDB !== 'undefined' ? new IndexedDBBackend() : createInMemoryBackend();

// ── the save-slot manager (replaces the `fm_saves` localStorage concept) ──
let backend: SaveBackend = defaultBackend;
let activeSlotId: string | null = null;
const modelBox: { model: SaveModel } = { model: freshSave('New Manager') };
let persistTimer: ReturnType<typeof setTimeout> | null = null;
const PERSIST_DEBOUNCE_MS = 500;

function schedulePersist(): void {
  if (!activeSlotId) return;
  if (persistTimer != null) clearTimeout(persistTimer);
  const id = activeSlotId;
  persistTimer = setTimeout(() => { persistTimer = null; void backend.save(id, modelBox.model); }, PERSIST_DEBOUNCE_MS);
}

/** Swap the persistence backend (tests inject `createInMemoryBackend()`; real code never needs to). */
export function setSaveBackend(b: SaveBackend): void { backend = b; }
export function getActiveSlotId(): string | null { return activeSlotId; }
export function getActiveModel(): SaveModel { return modelBox.model; }

export async function listSaves(): Promise<SaveMeta[]> { return backend.list(); }

/** Start a brand-new game: creates a fresh save, makes it active, and persists it immediately
 *  (not debounced) so it shows up in `listSaves()` right away. Returns the new slot id. */
export async function newGame(name: string): Promise<string> {
  const id = crypto.randomUUID();
  modelBox.model = freshSave(name);
  activeSlotId = id;
  await backend.save(id, modelBox.model);
  return id;
}

/** Continue an existing save: loads it into the active in-memory model. */
export async function continueSave(id: string): Promise<SaveModel> {
  const raw = await backend.load(id);
  if (!raw) throw new Error(`save not found: ${id}`);
  const m = migrate(raw);
  modelBox.model = m;
  if (m.version !== raw.version) await backend.save(id, m);   // write the upgrade back once
  activeSlotId = id;
  return m;
}

export async function deleteSave(id: string): Promise<void> {
  await backend.remove(id);
  if (activeSlotId === id) activeSlotId = null;
}

/** Force an immediate (non-debounced) write of the active model — e.g. before the tab closes. */
export async function flushSave(): Promise<void> {
  if (persistTimer != null) { clearTimeout(persistTimer); persistTimer = null; }
  if (activeSlotId) await backend.save(activeSlotId, modelBox.model);
}

/** The one `LocalStore` instance the Phase 3 facade will point `db` at — reads/writes `modelBox.model`,
 *  so swapping the active save (via `continueSave`/`newGame`) doesn't require constructing a new one. */
export const localStore: GameStore = new LocalStore(modelBox, schedulePersist);
