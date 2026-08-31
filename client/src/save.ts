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

  autoPickXI, TACTIC_PRESETS,} from '@fm/shared';

// The whole save belongs to one local profile — server-era `ownerId`/`accountId` params are accepted
// (for signature-compatibility with lifted server logic, see GameStore doc-comment) but ignored.
const OWNER = 'local';

// ── the SaveModel — everything that persists (see docs/offline-savestore-design.md) ──
export interface SaveModel {
  version: number; // save-format version; see migrate() below
  /** Collections that arrived in a shape `migrate()` could not read as an array, kept VERBATIM. Repair by
   *  deletion plus write-back is PERMANENT loss; parking the original bytes here means a save that loads
   *  diminished can still be repaired later — by hand or by a tool — instead of simply being gone. */
  __unreadable?: Record<string, unknown>;
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
  // BACKFILL EVERY COLLECTION FIRST, unconditionally — before the version gate, because a save that is
  // already v2 can still be missing an array. This repaired only tokens: a save with no `injuries` threw
  // inside me(), no `honours` broke prestige and the season reward, no `legacies` broke the Hall of
  // Legends — and a save with no `tokens` made migrate() itself throw `m.tokens is not iterable`. Every
  // one of those is a permanently unloadable save, reported to the player as "may be corrupted", with no
  // repair path and the entry left in the save list for ever. One absent array should never cost a dynasty.
  // `...m` FIRST, then fill the gaps — spreading m over the defaults would put an explicit `undefined`
  // straight back and undo the repair.
  // `?? []` REPAIRS ABSENT, NOT MALFORMED — and the difference is a dynasty. A save whose `tokens` is an
  // object, a string or a number sails past every one of these defaults and then kills migrate itself
  // ("m.tokens is not iterable", "m.tokens.map is not a function"), and a null entry inside the array kills
  // it on `.generation`. Four such shapes were reproducible, each a permanently unloadable save reported to
  // the player as "may be corrupted" with no repair path — which is precisely the outcome the comment
  // above says one absent array should never cost. A structured-clone failure or a truncated write is all
  // it takes. Anything that is not a usable array becomes an empty one; junk entries are dropped.
  // ARRAY-LIKE FIRST, EMPTY ONLY AS A LAST RESORT. Coercing straight to [] destroys data that was fully
  // recoverable: `{0:{…},1:{…},length:2}` — what a truncated structured clone or a sparse-array round-trip
  // yields — has two intact men in it. Before the malformed-save fix that shape THREW, and the bytes
  // survived on disk as "may be corrupted", recoverable by hand. After it, the save loaded clean and the
  // first ordinary action's autosave overwrote the recoverable data with the emptied version. Repair by
  // deletion plus write-back is permanent loss, and is a worse outcome than the crash it replaced.
  // THIS COULD NOT TELL "ABSENT" FROM "UNREADABLE" AND ANSWERED BOTH WITH `[]`. The comment above is
  // right that one missing array should never cost a dynasty — but answering an UNREADABLE array with an
  // empty one, and then writing that back at the next autosave, destroys data a refusal would have kept.
  // Measured on the shipping version, against a `tokens` collection holding two intact men: a record
  // keyed by id (`{'nft:1':…}`), a Set, a Map, `{0,1,length:'2'}`, a JSON string of the array and a JSON
  // string of a record ALL returned 0 men and were then persisted as empty. Six shapes, every one of
  // which still had every man in it.
  //
  // So: recover every shape whose rows are unambiguous, and park the ORIGINAL bytes for anything else
  // rather than deleting them. Nothing ever refuses, so the comment's principle is fully preserved;
  // nothing is ever destroyed, so a refusal's one real benefit is preserved too. Every recovering branch
  // ALSO quarantines, deliberately — a recovery guess costs a few duplicated bytes and can be undone, a
  // wrong guess with the original deleted cannot. Only a genuine plain array skips it.
  const quarantine: Record<string, unknown> = { ...(m.__unreadable ?? {}) };
  const arr = <T,>(key: string, v: unknown): T[] => {
    const clean = (xs: unknown[]) => xs.filter((x) => x != null) as T[];
    const park = (): T[] => { quarantine[key] = v; return []; };
    if (v == null) return [];                                        // ABSENT — nothing was there to lose
    if (Array.isArray(v)) return clean(v);
    if (v instanceof Map) { quarantine[key] = v; return clean([...v.values()]); }
    if (v instanceof Set) { quarantine[key] = v; return clean([...v]); }
    if (typeof v === 'string') {
      if (v === '') return [];
      let parsed: unknown;
      try { parsed = JSON.parse(v); } catch { return park(); }        // not JSON — keep the bytes
      if (parsed == null || typeof parsed !== 'object') return park();
      quarantine[key] = v;
      return arr<T>(key + ':parsed', parsed);
    }
    if (typeof v !== 'object') return [];                            // a number/boolean held no rows
    const o = v as Record<string, unknown> & { length?: unknown };
    if (typeof o.length === 'number') {
      try { quarantine[key] = v; return clean(Array.from(v as ArrayLike<unknown>)); } catch { return park(); }
    }
    if (typeof (o as { [Symbol.iterator]?: unknown })[Symbol.iterator] === 'function') {
      try { quarantine[key] = v; return clean(Array.from(v as Iterable<unknown>)); } catch { return park(); }
    }
    // a RECORD keyed by row id — `{ 'nft:1': {…}, 'nft:2': {…} }` holds every man intact
    const vals = Object.values(o);
    if (vals.length && vals.every((x) => x != null && typeof x === 'object')) { quarantine[key] = v; return clean(vals); }
    return vals.length ? park() : [];                                // an empty object held no rows
  };
  const repaired: SaveModel = {
    ...m,
    tokens: arr<Token>('tokens', m.tokens), injuries: arr('injuries', m.injuries), legacies: arr('legacies', m.legacies),
    honours: arr('honours', m.honours), awards: arr('awards', m.awards), missions: arr('missions', m.missions),
    loanees: arr('loanees', m.loanees), retiredNumbers: arr('retiredNumbers', m.retiredNumbers), playerStats: arr('playerStats', m.playerStats),
    facilities: { ...DEFAULT_FACILITIES, ...(m.facilities && typeof m.facilities === 'object' ? m.facilities : {}) },
    // THE ONE COLLECTION THIS REPAIR SKIPPED. Every array above is guarded and `facilities` is defaulted,
    // but `standingOrders` was passed through untouched — so a save that lost it loads with the field
    // `undefined`, survives a season rollover still undefined (the sheet reconciler early-returns it and
    // `saveClub` re-persists it), and then `openLineup`'s `{ ...this.standingOrders.tactics }` throws a
    // TypeError. Permanently: the club can never be managed again. A sheet whose `playerIds` is not an
    // array is the same shape, so both get a usable default rather than a crash.
    standingOrders: (m.standingOrders && Array.isArray((m.standingOrders as any).playerIds))
      ? m.standingOrders
      : { formation: '4-4-2', playerIds: autoPickXI(m.club, '4-4-2').playerIds, tactics: { ...TACTIC_PRESETS.Balanced } },
  };
  // attached only when something was actually unreadable, so a clean save passes through untouched
  if (Object.keys(quarantine).length) repaired.__unreadable = quarantine;
  m = repaired;
  if ((m.version ?? 1) >= SAVE_VERSION) return m;
  // v1 → v2. Before branching there was exactly one heir per generation, so the forest is recoverable
  // from the generation counter alone: each token's father is the one generation above it. Anyone with
  // no generation above is a root, which is correct for the founder.
  const byGen = new Map<number, Token[]>();
  for (const t of m.tokens) {
    const g = t.generation ?? 0;
    (byGen.get(g) ?? byGen.set(g, []).get(g)!).push(t);
  }
  // COPY, don't mutate. The doc-comment promises this is pure and it was not: it wrote through to the
  // caller's own token objects and then returned a spread of the container, so a caller who kept its
  // original reference saw it change underneath.
  const tokens = m.tokens.map((t) => {
    const anyT = t as any;
    const branch = anyT.branch ?? 'played';            // every pre-branching token was a played line
    let parent_id = anyT.parent_id;
    if (parent_id === undefined) {
      // ONLY LINK WHAT THE ID ACTUALLY PROVES. Matching on "one generation above" fabricates relationships:
      // a founder line at generation 3 alongside an independent `api.genesis()` line at generation 2 made
      // two unrelated men father and son on the Family Record — a tree that asserts something untrue is
      // worse than one that admits it does not know.
      //
      // And there is nothing to reconstruct anyway. Pre-branching, the played line REUSED one token id and
      // bumped its generation in place, so a real v1 save holds exactly one token per line however many
      // generations were played; that history lives in `legacies`, keyed `${id}:g<gen>`, not in tokens.
      // Siblings are the one case the id proves, because it encodes the father: `${parentId}:b<gen>.<i>`.
      const sib = /^(.*):b\d+\.\d+$/.exec(t.id);
      parent_id = sib && m.tokens.some((o) => o.id === sib[1]) ? sib[1] : null;
    }
    // NEVER SPREAD A PRIMITIVE. `{ ...'{"id":"a"}' }` becomes a character map and `{ ...1 }` becomes an
    // empty object with the number gone — api.ts:173 already names and guards this exact hazard, and this
    // line had the same bug unfixed. Wrong-shaped ELEMENTS survive arr() above; they were destroyed here.
    if (t == null || typeof t !== 'object') return t as Token;
    return { ...t, branch, parent_id } as Token;
  });
  return { ...m, tokens, version: SAVE_VERSION };
}

/** An empty new-game save. `Date.now()`/`Math.random()` here are fine — this is client, not @fm/shared.
 *
 *  ...EXCEPT IN A TEST, where an unseeded world is a flaky test. client/qa_branch_switch.ts asserts that a
 *  cousin is offered within six generations, and whether one IS depends on the world this draws — so that
 *  assertion failed about one run in eight, inside `npm run verify`, for reasons no diff could explain.
 *  A flaky gate is worse than no gate: it trains you to re-run until green, which is how a real regression
 *  gets waved through. `seed` lets a harness pin the world; production still passes nothing and stays
 *  random. */
export function freshSave(name: string, seed = Math.floor(Math.random() * 2 ** 31)): SaveModel {
  const shirtColor = (seed * 2654435761) % 0xffffff;
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
  async addCoins(_id: string, delta: number): Promise<void> {
    // REFUSE A NON-FINITE DELTA. `coins += NaN` is irreversible — the wallet never recovers, and worse it
    // fails silently, because every later `coins < cost` test is false against NaN so nothing is ever
    // refused. One bad number upstream used to end the save's economy without a single error.
    if (!Number.isFinite(delta)) { console.warn('[save] refused a non-finite coin delta', delta); return; }
    this.m.profile.coins += delta; this.touch();
  }

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

// NOTHING PERSISTS WITHOUT INDEXEDDB, AND THE GAME USED TO SAY IT WAS FINE. When `indexedDB` is absent —
// a webview, a worker, a hardened Steam wrapper, storage disabled, some private modes — this falls back to
// an in-memory store held in module scope. Every write "succeeds", `listSaves()` returns the save, and
// `saveHealth` stays green forever, so the player builds a dynasty for an evening and closes the tab on it.
// `writeSlotInner`'s own comment calls a silent failed write "the worst bug this file can have"; this was
// the same bug through a different door, and the only door with no warning at all.
const HAS_IDB = typeof indexedDB !== 'undefined';
/** True while the active backend cannot outlive the tab. Tracked separately from HAS_IDB so a deliberately
 *  chosen durable backend (a test seam, or the Steam FileBackend) clears the warning and a volatile one
 *  keeps it — the flag follows what the backend IS, not what the environment happened to offer at load. */
let volatileBackend = !HAS_IDB;
const defaultBackend: SaveBackend = HAS_IDB ? new IndexedDBBackend() : createInMemoryBackend();

// ── the save-slot manager (replaces the `fm_saves` localStorage concept) ──
let backend: SaveBackend = defaultBackend;
let activeSlotId: string | null = null;
const modelBox: { model: SaveModel } = { model: freshSave('New Manager') };
let persistTimer: ReturnType<typeof setTimeout> | null = null;
const PERSIST_DEBOUNCE_MS = 500;

/** Set when the last write to disk failed. The UI reads this to warn that play is not being saved.
 *  Starts UNHEALTHY when there is no IndexedDB at all, because in that state nothing will ever be written
 *  no matter how many times a write reports success. */
let saveHealth: { ok: boolean; error?: string } = HAS_IDB
  ? { ok: true }
  : { ok: false, error: 'This browser is not letting the game store saves, so your progress will be lost when you close it.' };
/** Whether the last write to disk succeeded. The UI polls this so a failing autosave cannot stay silent. */
export function getSaveHealth(): { ok: boolean; error?: string } { return saveHealth; }

/** Slots with a write in flight, so a delete that races one can re-remove after it lands. */
const inFlight = new Set<string>();

async function writeSlot(id: string, model: SaveModel): Promise<void> {
  inFlight.add(id);
  try { await writeSlotInner(id, model); } finally { inFlight.delete(id); }
}

async function writeSlotInner(id: string, model: SaveModel): Promise<void> {
  // A SWALLOWED WRITE IS THE WORST BUG THIS FILE CAN HAVE. This was `void backend.save(...)`: every
  // rejection became an unhandled rejection the app never saw. No retry, no error state, no warning — and
  // IndexedDBBackend caches its open promise, so once opening fails (Safari private browsing, a corrupt
  // DB, a blocked upgrade) EVERY later write rejects for the whole session. The game goes on accepting
  // moves and reporting success while nothing reaches disk; you close the tab and the evening is gone.
  try {
    await backend.save(id, model);
    // A verified write clears the warning whatever backend is in use. The `HAS_IDB` guard I added here was
    // wrong: it meant that with no IndexedDB the flag could NEVER return to healthy, even for a backend
    // that demonstrably works — which re-breaks the banner it was meant to serve, and would bite the Steam
    // FileBackend this file already anticipates. The no-storage warning is raised at module load and by
    // `markVolatile()`; it does not need to be sticky here as well.
    if (!saveHealth.ok && !volatileBackend) saveHealth = { ok: true };
  } catch (e) {
    try { await backend.save(id, model); if (!saveHealth.ok && !volatileBackend) saveHealth = { ok: true }; return; } catch { /* fall through */ }
    saveHealth = { ok: false, error: (e as Error)?.message ?? String(e) };
  }
}

function schedulePersist(): void {
  if (!activeSlotId) return;
  if (persistTimer != null) clearTimeout(persistTimer);
  const id = activeSlotId;
  // CAPTURE THE MODEL, NOT JUST THE SLOT. This read `modelBox.model` at FIRE time while capturing `id` at
  // SCHEDULE time, so a slot swap inside the 500ms debounce wrote the NEW save's contents into the OLD
  // save's slot. Reproduced: mutate slot A, start a new game, wait — slot A then holds slot B's save and
  // both dynasties are the same dynasty, with no undo.
  const model = modelBox.model;
  persistTimer = setTimeout(() => { persistTimer = null; void writeSlot(id, model); }, PERSIST_DEBOUNCE_MS);
}

/** Swap the persistence backend (tests inject `createInMemoryBackend()`; real code never needs to). */
export function setSaveBackend(b: SaveBackend, opts?: { volatile?: boolean }): void {
  backend = b;
  // Choosing a backend deliberately is not the "no storage available" failure state, so clear the warning
  // that a missing IndexedDB raises at module load — otherwise every Node harness runs permanently
  // unhealthy, which masks a regression rather than revealing one. Callers that know their backend does not
  // persist should say so; a bare `setSaveBackend` used to clear a live "disk full" warning with no
  // evidence of anything, which is the same silent-success failure this file exists to prevent.
  volatileBackend = opts?.volatile ?? false;
  saveHealth = volatileBackend
    ? { ok: false, error: 'Progress is being kept in memory only and will be lost when you close the game.' }
    : { ok: true };
}
export function getActiveSlotId(): string | null { return activeSlotId; }
export function getActiveModel(): SaveModel { return modelBox.model; }

export async function listSaves(): Promise<SaveMeta[]> { return backend.list(); }

/** Start a brand-new game: creates a fresh save, makes it active, and persists it immediately
 *  (not debounced) so it shows up in `listSaves()` right away. Returns the new slot id. */
export async function newGame(name: string, seed?: number, slotId?: string): Promise<string> {
  // `slotId` is for HARNESSES ONLY. Career seeds are world-mixed through the ACTIVE SLOT ID
  // (careerSeedFor(..., getActiveSlotId()) in api.ts) so that two saves play out differently — which is
  // correct and worth keeping, but it means a random UUID here leaks into every succession. Pinning the
  // world seed alone left qa_branch_switch failing ~1 run in 20; this is the other half.
  await flushSave();          // settle the outgoing save before its slot stops being active
  const id = slotId ?? crypto.randomUUID();
  modelBox.model = freshSave(name, seed);
  activeSlotId = id;
  await backend.save(id, modelBox.model);
  return id;
}

/** Continue an existing save: loads it into the active in-memory model. */
export async function continueSave(id: string): Promise<SaveModel> {
  await flushSave();          // ...and before loading another one over it
  const raw = await backend.load(id);
  if (!raw) throw new Error(`save not found: ${id}`);
  const m = migrate(raw);
  // SWAP THE MODEL AND THE SLOT ID IN THE SAME BREATH. These used to be separated by an `await` — the
  // version-upgrade write below — so any failure or even any suspension between them left `modelBox.model`
  // holding the NEW save while `activeSlotId` still named the OLD one. The next `touch()` from any ordinary
  // action then scheduled a write of the new dynasty INTO THE OLD DYNASTY'S SLOT. Reproduced with a quota
  // error on the upgrade write: slot-A ("House Alba", 9,500 coins) came back as a copy of slot-B, and
  // `saveHealth` read `{ok:true}` throughout. The player opens an old save, sees an error, loads a
  // different one, plays five minutes, and the first dynasty is gone.
  //
  // This is the same defect the `schedulePersist` fix addressed from the other side: capturing the model at
  // schedule time closed one door and left this one open, because the pair was still updated across an await.
  modelBox.model = m;
  activeSlotId = id;
  if (m.version !== raw.version) await backend.save(id, m);   // write the upgrade back once
  return m;
}

export async function deleteSave(id: string): Promise<void> {
  // CANCEL ANY PENDING WRITE TO THIS SLOT FIRST, or the debounced timer fires after the removal and the
  // save comes back: "Delete forever" un-deleting itself. Reproduced.
  if (activeSlotId === id && persistTimer != null) { clearTimeout(persistTimer); persistTimer = null; }
  await backend.remove(id);
  // ...AND CANCELLING THE TIMER IS NOT ENOUGH. A write already IN FLIGHT when the player hits delete lands
  // afterwards and re-creates the slot — reproduced at 20ms and 50ms, which is an ordinary IndexedDB write
  // for a save carrying a full squad and a dynasty's history. Wait for it, then remove again.
  if (inFlight.has(id)) {
    for (let i = 0; i < 40 && inFlight.has(id); i++) await new Promise((r) => setTimeout(r, 25));
    await backend.remove(id);
  }
  if (activeSlotId === id) activeSlotId = null;
}

/** Force an immediate (non-debounced) write of the active model — e.g. before the tab closes. */
export async function flushSave(): Promise<void> {
  if (persistTimer != null) { clearTimeout(persistTimer); persistTimer = null; }
  if (activeSlotId) await writeSlot(activeSlotId, modelBox.model);
}

/** The one `LocalStore` instance the Phase 3 facade will point `db` at — reads/writes `modelBox.model`,
 *  so swapping the active save (via `continueSave`/`newGame`) doesn't require constructing a new one. */
export const localStore: GameStore = new LocalStore(modelBox, schedulePersist);
