// The in-process facade for the offline single-player game (phase 3 offline migration — see
// docs/offline-savestore-design.md and .claude/plans/jazzy-wobbling-peacock.md). Every function below
// keeps its ORIGINAL signature + return shape (main.ts is unchanged) but now runs against a local
// `LocalStore` (client/src/save.ts) instead of `fetch`ing the fm-server. Each body is LIFTED — as
// verbatim as the new substrate allows — from the corresponding server/src/index.ts endpoint, with
// `db.*` → the local store singleton and `req.account!.id` → the single local OWNER.
//
// Multiplayer (async-PvP) support was removed in phase 4 along with the server. `scoutTiers` is the
// one exception kept below — it still backs the single-player youth-scouting network's tier display.
import type { Club, Lineup, Tactics, Team, Player, StandingOrders } from '@fm/shared';
export type { StandingOrders };
import {
  makeClub as _makeClub, // re-exported nowhere — freshSave() (save.ts) already calls this; kept for reference
  validateLineup, cleanDuties,
  overall, managerPrestige, signContract, graduationEpilogue, clubInvestOf, TIERS,
  transferList, transferFee, sellValue, incomingBid, MIN_SQUAD, MAX_SQUAD,
  contractDemand, evaluateContractOffer, wageForLength,
  FACILITY_KEYS, FACILITY_META, MAX_LEVEL, upgradeCost, effectAt,
  youthPoolBonus, youthUpgradeChance, scoutHitMult, scoutCostDiscount, scoutExtraTrips,
  generatePool, trialistAt, LOANEE_CAP, DESTINATIONS, destinationById, rollMission, travelMs as travelMsPure, previewOdds,
  gaffersDiaryEntry,
  rollGenes, updateMorale,
  tokenToPlayer, tokenContract, legendCardOf, loadCareer, actWithNarration, careerState, graduatedFields, careerCast, fillArcText,
  rebornFields, rebornPotential, careerSeedFor, trackFor, agentsList, foundingNameFor,
  type FacilityKey, type MissionRow, type Token, type CareerAction,
} from '@fm/shared';
import {
  localStore, getActiveModel, getActiveSlotId, newGame as newGameSlot, continueSave, deleteSave as deleteSaveSlot, setSaveBackend, type SaveBackend,
} from './save';

void _makeClub; // silence unused-import — see comment above

/** Test-only seam: point the facade's persistence at an injected backend (e.g. `createInMemoryBackend()`
 *  from save.ts) so headless tests (client/qa_offline_facade.ts) don't need IndexedDB/a browser. Never
 *  called by the real app. */
export function __setBackendForTests(b: SaveBackend): void { setSaveBackend(b); }

const OWNER = 'local'; // the single local owner every GameStore call is scoped to (see save.ts)
const TRIPS_PER_SEASON = 3;
const TIER = 'base'; // scout tiers were wallet/NFT-gated; off-chain the game always ran at 'base' by default
const SUPPLY_CAP = 10000;
const GENESIS_COST = 300;
const REBORN_COST = 150;
const STAFF_COSTS: Record<string, number> = { fitness: 350, attack: 350, assistant: 500 };
// ONE FAMILY ENTERPRISE knobs (see server/src/index.ts's original comment) — the bloodline player's
// career money feeds his club.
const CLUB_WAGE_CUT = 0.25;
const PRO_SIGNING_SHARE = 0.4;
const RETIREMENT_LEGACY_SHARE = 0.6;

function seedFrom(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) || 1; }

// ── which local save is active (repurposed from the old bearer-token concept) ──
// `setToken` used to arm a Bearer header; now it names a save-slot id. Loading is deferred to
// `ensureActive()` (called by every facade method) so `setToken(id)` + an immediate `api.me()` — the
// only pattern main.ts uses — works without making `setToken` itself async.
let pendingSlotId: string | null = null;
export const hasToken = () => !!pendingSlotId || !!getActiveSlotId();
export function setToken(t: string) { pendingSlotId = t; }
export function clearToken() { pendingSlotId = null; }
async function ensureActive(): Promise<void> {
  if (pendingSlotId && pendingSlotId !== getActiveSlotId()) await continueSave(pendingSlotId);
  pendingSlotId = null;
}

export interface ApiError extends Error { status: number; body: any }
function apiErr(error: string, extra: Record<string, any> = {}, status = 400): ApiError {
  return Object.assign(new Error(error), { status, body: { error, ...extra } }) as ApiError;
}

export interface LegacyCard { role: string; primeOverall: number; peakOverall: number; seasons: number; apps: number; leagueTitles: number; cupTitles: number; legendRating: number; tier: string; icon: string; testimonial: number; mintable: boolean; note: string; number?: number | null }
export interface Prospect { id: string; name: string; roleHint: string; pedigree: number; potentialStars: number; generation?: number; bornSeason?: number; developed?: boolean; note?: string; genes?: any; careerStarted?: boolean; developedPlayerId?: string | null }
export interface CareerCard { id: string; name: string; tags: string[]; rarity?: string; desc?: string }
export interface Kit { number: number; boots: string; celebration: string; nickname: string; hairstyle?: string; accessory?: string }
/** Immediate feedback on a moment just played: how well the card fit the demand, and how it went. */
export interface CareerOutcome { fit: number; bestFit: number; success: number; tags: string[]; answeredAsk: boolean; matchedAsk: boolean }
export interface LeagueRow { name: string; mine: boolean; P: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number }
export interface CareerState {
  prospectId: string; name: string; pedigree: number; agentId?: string | null; phase: 'play' | 'coach' | 'draft' | 'offer' | 'focus' | 'arc';
  arc?: { id: string; title: string; icon: string; category: string; prompt: string; rivalName?: string; choices: Array<{ id: string; label: string; desc: string }> };
  age: number; chapter: string; turn: number; totalTurns: number; finished: boolean;
  seasonEvent?: { id: string; name: string; desc: string } | null; earnings?: number; deck?: CareerCard[];
  chemistry?: { id: string; name: string; tags: string[]; desc: string }[];
  scenario?: { id: string; kind: string; demand: Record<string, number>; label: string; stakes: number };
  story?: string; recap?: string; lifeEvent?: string; lastLifeOutcome?: string | null;
  energy?: number; meters?: Array<{ key: string; icon: string; label: string; value: number }>;
  focus?: Array<{ id: string; icon: string; name: string; desc: string; energy: number; effects: Record<string, number>; tag?: string }>;
  side?: boolean;
  lifestyle?: Array<{ id: string; icon: string; name: string; blurb: string; cost: number; recovery?: number; market?: number; greed?: number; perks?: Record<string, number>; clubInvest?: number }>;
  consequences?: string[];
  momentKind?: 'match' | 'training' | 'life';
  rivalMoment?: boolean;
  callupMoment?: boolean;
  matchCtx?: { opponent: string; home: boolean; score: string; minute: number; comp: string; club?: string | null };
  clubSeason?: { pos: number; size: number; me: LeagueRow; table: LeagueRow[]; apps: number; fixtures: number; status: string } | null;
  handoff?: { season: string; apps: number; status: string; overall: number } | null;
  careerScore?: number;
  objective?: { desc: string; target: number; progress: number; done: boolean } | null;
  rival?: { name: string; score: number; lead: number; news?: string } | null;
  international?: { capped: boolean; caps: number; nation?: string; lastCap?: { oppNation: string; venue: 'H' | 'A' | 'N'; kind: 'friendly' | 'qualifier'; forGoals: number; ourGoals: number; scored: number } } | null;
  offPitch?: {
    image: { score: number; tier: string };
    reputation: { score: number; label: string; edge: 'clean' | 'edgy' };
    endorsements: { brand: string; category: string; tier: 'Local' | 'National' | 'Global'; payout: number; obligation: string; strain?: string }[];
    boots: { owned: { id: string; name: string; edge: string; unlock: string }[]; next: { boot: { id: string; name: string; edge: string; unlock: string }; progress: number; target: number } | null };
    temptation: { kind: string; title: string; blurb: string } | null;
  } | null;
  kit?: Kit | null;
  hand?: CareerCard[]; coach?: { id: string; name: string } | null;
  coaches?: Array<{ id: string; name: string; kind: string; desc: string; specialty: string[]; bonus: number }>;
  options?: CareerCard[]; picksLeft?: number;
  offers?: Array<{ id: string; name: string; desc: string; earn: number; greed: number; market: number; form: number }>;
  profile?: CareerProfile;
}
export interface CareerProfile {
  role: string; currentOverall: number; potential: number; stars: number; physicalCeiling: number;
  attrs: Record<string, number>; personality: { id: string; name: string; desc: string };
  agent: string | null; coach: string | null; earnings: number; traitsForming: string[];
}
export interface ContractInfo { playerId: string; age: number; available: boolean; seasonsLeft: number; lengthSeasons: number; extendCost: number; sellValue: number; stakedSeasons: number; staked?: boolean; morale?: number; moraleLabel?: string; retired?: boolean; legend?: LegacyCard | null; rebornId?: string | null; careerGoals?: number; careerAssists?: number; careerPotm?: number; careerApps?: number }

export interface Account { id: string; handle: string; rating: number; coins?: number }
export interface Trialist { index: number; id: string; name: string; role: string; overall: number; band: 'raw' | 'squad' | 'quality' | 'gem'; signed: boolean }
export interface ScoutDestination { id: string; name: string; blurb: string; hitRate: number; upgradeChance: number; weights: Record<string, number>; travelMins: number; cost: number }
export interface MissionProspect { id: string; name: string; role: string; overall: number; attrs: Record<string, number> }
export interface Mission {
  id: string; destination: string; destName: string; dispatchedAt: number; readyAt: number; readyInMs: number;
  revealed: boolean; status: string; found: boolean | null; band: string | null; player: MissionProspect | null;
}
export interface MissionsData {
  season: number; tier: string; tripsPerSeason: number; tripsUsed: number; tripsLeft: number;
  loaneeCap: number; loaneeCount: number; coins: number; destinations: ScoutDestination[]; missions: Mission[];
}
export interface HonourRow { season_number: number; tier: string; final_pos: number; title: number; ended_at: number; coin_reward?: number; kind?: string }
export interface AwardRow { season_number: number; tier: string; pod: number; kind: string; player_name: string; value: number; awarded_at: number }
export interface Facility {
  key: string; icon: string; name: string; blurb: string; level: number; maxLevel: number;
  effect: string; nextEffect: string | null; upgradeCost: number | null; canAfford: boolean;
}
export interface FacilitiesData { coins: number; facilities: Facility[] }
export interface MatchPayload {
  matchId: string; seed: number; result: [number, number]; mySide: 0 | 1; coinsEarned?: number; gateIncome?: number; injuries?: Array<{ name: string; matches: number }>;
  home: { id: string; handle: string; rating?: number; team: Team; tactics: Tactics };
  away: { id: string; handle: string; rating?: number; team: Team; tactics: Tactics };
}

// ── small helpers lifted from server/src/index.ts (roles-cleaning) + server/src/tokens.ts (genesis mint)
// + server/src/lifecycle.ts (morale bump) — the DB-touching orchestration that stays a thin wrapper
// around the store, now the LOCAL store instead of the SQL one. ──
const validSlot = (n: any): number | undefined => (Number.isInteger(n) && n >= 0 && n < 11 ? n : undefined);
function cleanRoles(body: any): { captainIdx?: number; takers?: { pen?: number; fk?: number; corner?: number } } {
  const captainIdx = validSlot(body?.captainIdx);
  const t = body?.takers ?? {};
  const takers = { pen: validSlot(t.pen), fk: validSlot(t.fk), corner: validSlot(t.corner) };
  const hasTakers = takers.pen != null || takers.fk != null || takers.corner != null;
  return { ...(captainIdx != null ? { captainIdx } : {}), ...(hasTakers ? { takers } : {}) };
}
const isFormation = (f: unknown): f is Lineup['formation'] => typeof f === 'string' &&
  (['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '3-4-3', '4-1-2-1-2', '5-3-2', '4-5-1'] as string[]).includes(f);

/** Load the club with the owner's PRO/RETIRED tokens merged in as fieldable players — read/gameplay
 *  only, mirrors server/src/index.ts's `loadSquad`. Never feed this into `saveClub`/`saveStandingOrders`. */
function mergedClub(): { club: Club; standingOrders: StandingOrders } {
  const m = getActiveModel();
  const have = new Set(m.club.players.map((p) => p.id));
  const merged = [...m.club.players];
  for (const t of m.tokens) if ((t.state === 'pro' || t.state === 'retired') && !have.has(t.id)) { merged.push(tokenToPlayer(t)); have.add(t.id); }
  return { club: { ...m.club, players: merged }, standingOrders: m.standingOrders };
}

/** Mint a brand-new 10-year-old prospect (fresh genes, generation 0) — lifted from server/src/tokens.ts's
 *  `mintGenesis`, against the local store. Enforces the fixed SUPPLY_CAP. */
async function mintGenesisLocal(): Promise<Token> {
  if ((await localStore.countTokens()) >= SUPPLY_CAP) throw new Error('supply cap reached');
  const n = (await localStore.countTokens()) + 1;
  const id = `nft:${n}`;
  const seed = seedFrom(id + ':genesis');
  const genes = rollGenes(seed);
  await localStore.createToken({ id, owner_id: OWNER, generation: 0, state: 'prospect', name: foundingNameFor(seed, getActiveModel().profile.name), genes_json: JSON.stringify(genes), pedigree: 0, dev_bonus_json: '{}' });
  await localStore.updateToken(id, { role: seedFrom(id + ':gk') % 100 < 12 ? 'GK' : 'MF' });
  return (await localStore.getToken(id))!;
}

/** Nudge a token's morale by one event — lifted from server/src/lifecycle.ts's `bumpMorale`. */
async function bumpMoraleLocal(tokenId: string, event: Parameters<typeof updateMorale>[1]): Promise<void> {
  const t = await localStore.getToken(tokenId);
  if (t) await localStore.updateToken(tokenId, { morale: updateMorale(t.morale ?? 65, event) });
}

/** Serialise a stored scouting trip, hiding the outcome until travel completes — lifted from
 *  server/src/index.ts's `missionView`. */
function missionView(m: MissionRow, now: number) {
  const dest = destinationById(m.destination);
  const revealed = now >= m.ready_at || m.status === 'signed';
  const player = revealed && m.found && m.player_json ? (JSON.parse(m.player_json) as Player) : null;
  return {
    id: m.id, destination: m.destination, destName: dest?.name ?? m.destination,
    dispatchedAt: m.dispatched_at, readyAt: m.ready_at, readyInMs: Math.max(0, m.ready_at - now),
    revealed, status: m.status, found: revealed ? !!m.found : null, band: revealed ? m.band : null,
    player: player ? { id: player.id, name: player.name, role: player.role, overall: overall(player), attrs: player.attrs as unknown as Record<string, number> } : null,
  };
}

const travelMs = (dest: Parameters<typeof travelMsPure>[0]) => travelMsPure(dest);

export const api = {
  // ── new game / continue (no server accounts — a "save" IS the local profile) ──
  register: async (_handle: string, _password: string, clubName?: string) => {
    const name = (clubName && clubName.trim()) || 'My Club';
    const id = await newGameSlot(name); // freshSave() (save.ts) already builds the starting club + standing orders
    // NO auto-mint — the player scouts + PICKS their founding prospect (see scoutProspects/signProspect).
    const model = getActiveModel();
    return { token: id, account: { id: OWNER, handle: id, rating: 1000, coins: model.profile.coins }, ...mergedClub() };
  },
  /** Scout board: `n` seeded 10-year-old candidates to choose from. Deliberately shows only what a scout
   *  could glimpse — a position, ONE physical trait, and a hedged note — never the true ceiling. The
   *  potential is a mystery that only emerges by developing him. Deterministic per save (no reroll). */
  /** Permanently remove a save's MODEL from the backend (by its slot/token id). The caller also clears the
   *  per-handle localStorage keys — together this makes "Delete forever" actually delete everything (PT-77). */
  deleteSave: async (slotId: string) => { await deleteSaveSlot(slotId); return { ok: true as const }; },
  scoutProspects: async (n = 3) => {
    await ensureActive();
    const slot = getActiveSlotId() ?? 'x';
    const TRAIT: Record<string, string[]> = {
      pace: ['looks lightning quick', 'has electric feet', 'quick as a whip'],
      strength: ['a strong, sturdy frame', 'built sturdy for his age', 'wins every physical duel'],
      stamina: ['an engine that never quits', 'runs all day', 'boundless energy'],
    };
    const NOTES = [
      "Raw, but there's something about him.", 'Fearless on the ball — the temperament, time will tell.',
      "A rough diamond. Could be special, could fizzle — that's scouting.", 'Quiet lad who reads the game beyond his years.',
      'All heart. The rest is yours to shape.', "The coaches are split on him — usually a sign he's interesting.",
      'A natural. Whether he does the work is up to you.', 'Nothing flashy yet, but he never stops learning.',
    ];
    const cands = [];
    for (let i = 0; i < n; i++) {
      const seed = seedFrom(`${slot}:scout:${i}`);
      const genes = rollGenes(seed);
      const rh = seed % 100, roleHint = rh < 10 ? 'GK' : rh < 40 ? 'DF' : rh < 72 ? 'MF' : 'FW';
      const ceils: Array<[string, number]> = [['pace', genes.pace.ceiling], ['strength', genes.strength.ceiling], ['stamina', genes.stamina.ceiling]];
      const top = ceils.sort((a, b) => b[1] - a[1])[0][0];
      const glimpse = TRAIT[top][seedFrom(`${slot}:g:${i}`) % TRAIT[top].length];
      const note = NOTES[seedFrom(`${slot}:n:${i}`) % NOTES.length];
      cands.push({ seed, name: foundingNameFor(seed, getActiveModel().profile.name), roleHint, glimpse, note });
    }
    return { candidates: cands };
  },
  /** Sign the scouted prospect identified by its candidate `seed` — mints it (with that kid's exact genes
   *  and name) as the founding, generation-0 token; the unpicked candidates are simply never minted. */
  signProspect: async (seed: number) => {
    await ensureActive();
    if ((await localStore.countTokens()) >= SUPPLY_CAP) throw apiErr('supply cap reached', {}, 409);
    const id = `nft:${(await localStore.countTokens()) + 1}`;
    const genes = rollGenes(seed);
    const rh = seed % 100, roleHint = rh < 10 ? 'GK' : rh < 40 ? 'DF' : rh < 72 ? 'MF' : 'FW';
    await localStore.createToken({ id, owner_id: OWNER, generation: 0, state: 'prospect', name: foundingNameFor(seed, getActiveModel().profile.name), genes_json: JSON.stringify(genes), pedigree: 0, dev_bonus_json: '{}' });
    await localStore.updateToken(id, { role: roleHint });
    const t = (await localStore.getToken(id))!;
    return { ok: true as const, prospect: { id, name: t.name, roleHint, generation: 0, pedigree: 0, careerStarted: false, potentialStars: rebornPotential(t).stars, genes } };
  },
  login: async (handle: string, _password: string) => {
    // no passwords locally — `handle` here is a save-slot id (kept for signature-compatibility; unused
    // by main.ts, which drives loading purely through setToken()+me()).
    await continueSave(handle);
    const model = getActiveModel();
    return { token: handle, account: { id: OWNER, handle, rating: 1000, coins: model.profile.coins }, ...mergedClub() };
  },
  me: async () => {
    await ensureActive();
    const model = getActiveModel();
    const season = model.profile.season;
    const injuries = await localStore.getInjuries(OWNER);
    const contracts = Object.fromEntries(model.tokens.filter((t) => t.state !== 'prospect').map((t) => {
      const ci = tokenContract(t, season);
      const legend = t.state === 'retired' ? legendCardOf(t) : undefined;
      return [t.id, { playerId: t.id, ...ci, legend, rebornId: null }];
    }));
    return { account: { id: OWNER, handle: getActiveSlotId() ?? OWNER, rating: 1000, coins: model.profile.coins }, ...mergedClub(), injuries, contracts, season };
  },

  extendContract: async (playerId: string) => {
    await ensureActive();
    const model = getActiveModel();
    const t = await localStore.getToken(playerId);
    if (!t) throw apiErr('no such token', {}, 404);
    if (t.state !== 'pro') throw apiErr('not a pro under contract');
    const season = model.profile.season;
    const ci = tokenContract(t, season);
    const coins = model.profile.coins;
    // NOTE: no live caller — extendPlayer routes through negotiateStar. Kept aligned to the wage × length cost
    // model (NOT a flat one-season debit) so re-wiring this can't reintroduce the "length is free" exploit (PT-32/PT-127).
    const dealCost = ci.extendCost * ci.lengthSeasons;
    if (coins < dealCost) throw apiErr('not enough coins', { need: dealCost, have: coins });
    await localStore.addCoins(OWNER, -dealCost);
    const fresh = signContract(season, t.greed ?? 10, t.personality ?? undefined);
    await localStore.updateToken(playerId, { signed_season: fresh.signedSeason, length_seasons: fresh.lengthSeasons });
    await bumpMoraleLocal(playerId, 'extended');
    const updated = (await localStore.getToken(playerId))!;
    return { ok: true as const, coins: getActiveModel().profile.coins, contract: { playerId, ...tokenContract(updated, season) } };
  },
  // ── transfer market: buy/sell fictional squad players (coin-based; strengthens the squad → climb) ──
  buyPlayer: async (player: Player, fee: number) => {
    await ensureActive();
    const f = Math.max(0, Math.round(fee));
    const c = await localStore.getClub(OWNER);
    if (!c) throw apiErr('club not found', {}, 404);
    if (c.club.players.length >= MAX_SQUAD) throw apiErr(`your squad is full (max ${MAX_SQUAD})`, {}, 409);
    if (getActiveModel().profile.coins < f) throw apiErr('not enough coins', { need: f }, 402);
    await localStore.addCoins(OWNER, -f);
    const uid = `bought-${c.club.players.length}-${String(player.id || 'p').replace(/[^a-z0-9]/gi, '')}`;
    c.club.players.push({ ...player, id: uid });
    await localStore.saveClub(OWNER, c.club, c.standingOrders);
    return { ok: true as const, coins: getActiveModel().profile.coins, squadSize: c.club.players.length };
  },
  sellPlayer: async (playerId: string) => {
    await ensureActive();
    const c = await localStore.getClub(OWNER);
    if (!c) throw apiErr('club not found', {}, 404);
    if (c.club.players.length <= MIN_SQUAD) throw apiErr(`you can't sell below ${MIN_SQUAD} players`, {}, 409);
    const p = c.club.players.find((x) => x.id === playerId);
    if (!p) throw apiErr('no such player', {}, 404);
    if (await localStore.getToken(playerId)) throw apiErr('the bloodline star can only leave via a transfer offer', {}, 409);
    const value = sellValue(overall(p));
    await localStore.addCoins(OWNER, value);
    c.club.players = c.club.players.filter((x) => x.id !== playerId);
    await localStore.saveClub(OWNER, c.club, c.standingOrders);
    return { ok: true as const, coins: getActiveModel().profile.coins, value, squadSize: c.club.players.length };
  },
  /** The bloodline star's contract-demand shape (for the negotiation UI). baseWage = the loyalty-adjusted
   *  re-sign cost (== the old extendCost); prefLength = the length he'd sign happily. */
  starContractInfo: async (playerId: string) => {
    await ensureActive();
    const model = getActiveModel();
    const t = await localStore.getToken(playerId);
    if (!t) throw apiErr('no such token', {}, 404);
    if (t.state !== 'pro') throw apiErr('not a pro under contract');
    const ci = tokenContract(t, model.profile.season);
    const p = t.personality ?? undefined;
    const lengthPremium = (p === 'maverick' || p === 'mercurial') ? 0.14 : (p === 'leader' || p === 'workhorse') ? -0.07 : 0.05;
    return { baseWage: ci.extendCost, prefLength: ci.lengthSeasons, minLength: 2, maxLength: 6, lengthPremium, seasonsLeft: ci.seasonsLeft, coins: model.profile.coins };
  },
  /** Make a contract OFFER (wage × length) to the star — he accepts / counters / rejects. On accept the
   *  wage is banked as the re-sign cost and a fresh deal of that length is signed. */
  negotiateStar: async (playerId: string, wage: number, length: number) => {
    await ensureActive();
    const model = getActiveModel();
    const t = await localStore.getToken(playerId);
    if (!t) throw apiErr('no such token', {}, 404);
    if (t.state !== 'pro') throw apiErr('not a pro under contract');
    const season = model.profile.season;
    const ci = tokenContract(t, season);
    const p = t.personality ?? undefined;
    const lengthPremium = (p === 'maverick' || p === 'mercurial') ? 0.14 : (p === 'leader' || p === 'workhorse') ? -0.07 : 0.05;
    const demand = { baseWage: ci.extendCost, prefLength: ci.lengthSeasons, minLength: 2, maxLength: 6, lengthPremium };
    const result = evaluateContractOffer(demand, Math.round(wage), Math.round(length));
    if (result.outcome !== 'accept') return { outcome: result.outcome, askWage: result.askWage, note: result.note, coins: model.profile.coins };
    // COST is the wage across the WHOLE deal (per-season wage × length), so a longer contract genuinely costs
    // more up front — length is a real trade-off (locks him in longer for more coins now), not a free choice (PT-32).
    const L = Math.max(2, Math.min(6, Math.round(length)));
    const cost = Math.max(0, Math.round(wage) * L);
    if (model.profile.coins < cost) throw apiErr('not enough coins', { need: cost }, 402);
    await localStore.addCoins(OWNER, -cost);
    await localStore.updateToken(playerId, { signed_season: season, length_seasons: L });
    await bumpMoraleLocal(playerId, 'extended');
    return { outcome: 'accept' as const, askWage: result.askWage, note: result.note, coins: getActiveModel().profile.coins, lengthSeasons: Math.max(2, Math.min(6, Math.round(length))) };
  },
  /** Accept a transfer bid for the star: bank the fee (the succession to the heir is handled client-side,
   *  the same reborn mechanic as retirement — his son carries the bloodline on). */
  // (sellStar removed: the incoming-bid fee is now banked atomically inside succeed(), so an abandoned
  //  succession can't keep the cash while the star stays owned — see PT-60.)
  /** A rival's incoming BID for the star this season (or null). Deterministic per (seed, season). */
  starBid: async (playerId: string, seed: number) => {
    await ensureActive();
    const model = getActiveModel();
    const t = await localStore.getToken(playerId);
    if (!t || t.state !== 'pro') return { bid: null };
    const ov = overall(tokenToPlayer(t));
    const age = (t as any).age ?? 26;
    return { bid: incomingBid(seed >>> 0, model.profile.season, ov, age) };
  },
  stake: async (playerId: string, on: boolean) => {
    await ensureActive();
    const t = await localStore.getToken(playerId);
    if (!t) throw apiErr('no such token', {}, 404);
    const season = getActiveModel().profile.season;
    if (on) {
      if (t.state !== 'pro') throw apiErr('only pros can be staked');
      if (t.staked_since == null) await localStore.updateToken(playerId, { staked_since: season });
    } else {
      await localStore.updateToken(playerId, { staked_since: null });
    }
    const updated = (await localStore.getToken(playerId))!;
    return { ok: true as const, contract: { playerId, ...tokenContract(updated, season) } };
  },
  reborn: async (playerId: string) => {
    await ensureActive();
    const t = await localStore.getToken(playerId);
    if (!t) throw apiErr('no such token', {}, 404);
    if (t.state !== 'retired') throw apiErr('not retired', {}, 409);
    const coins = getActiveModel().profile.coins;
    if (coins < REBORN_COST) throw apiErr('not enough coins', { need: REBORN_COST, have: coins });
    const legacy = Math.round((t.earnings ?? 0) * RETIREMENT_LEGACY_SHARE);
    await localStore.addCoins(OWNER, -REBORN_COST);
    if (legacy > 0) await localStore.addCoins(OWNER, legacy);
    await localStore.updateToken(playerId, rebornFields(t));
    const fresh = (await localStore.getToken(playerId))!;
    const pot = rebornPotential(fresh);
    return { ok: true as const, cost: REBORN_COST, legacy, coins: getActiveModel().profile.coins, prospect: { id: playerId, name: fresh.name, roleHint: fresh.role ?? 'MF', generation: fresh.generation, pedigree: pot.pedigree, potentialStars: pot.stars, genes: JSON.parse(fresh.genes_json) } };
  },
  careerHandoff: async (pid: string) => {
    await ensureActive();
    const t = await localStore.getToken(pid);
    if (!t) throw apiErr('no such token', {}, 404);
    if (t.state !== 'prospect') throw apiErr('not a prospect', {}, 409);
    if (t.career_seed == null) throw apiErr('career not started');
    const c = loadCareer(t);
    const season = getActiveModel().profile.season;
    const grad = graduatedFields(t, c);
    const deal = signContract(season, grad.greed ?? 10, grad.personality ?? undefined);
    await localStore.updateToken(pid, { ...grad, prime_season: season, signed_season: deal.signedSeason, length_seasons: deal.lengthSeasons, staked_since: season });
    return { ok: true as const, player: tokenToPlayer((await localStore.getToken(pid))!) };
  },
  succeed: async (pid: string, body: { seasons: number; titles: number; cups?: number; mentorship: number; inheritance?: 'craft' | 'fortune' | 'name'; saleFee?: number }) => {
    await ensureActive();
    const t = await localStore.getToken(pid);
    if (!t) throw apiErr('no such token', {}, 404);
    if (t.state === 'prospect') throw apiErr('not a graduated player', {}, 409);
    const seasons = Math.max(0, Math.min(20, Math.floor(Number(body?.seasons) || 0)));
    const titles = Math.max(0, Math.min(20, Math.floor(Number(body?.titles) || 0)));
    const cups = Math.max(0, Math.min(40, Math.floor(Number(body?.cups) || 0))); // continental + World-Finals silverware, banked onto the permanent legend card (PT-113)
    const mentorship = Math.max(0, Math.min(10, Math.floor(Number(body?.mentorship) || 0)));
    const inheritance = body?.inheritance; // the will/heirloom decision (see client's showWillDecision)
    await localStore.updateToken(pid, { ach_seasons: (t.ach_seasons ?? 0) + seasons, ach_apps: (t.ach_apps ?? 0) + seasons * 18, ach_league: (t.ach_league ?? 0) + titles, ach_cup: (t.ach_cup ?? 0) + cups });
    const decorated = (await localStore.getToken(pid))!;
    // SNAPSHOT THE LEGEND before the token is reborn — this is what populates the Bloodline Tree / Hall of
    // Legends. Keyed with a :g<gen> suffix so every generation is a distinct node (legends() groups by the
    // base id, splitting on ':g'). Without this the game's signature generational chain never fills (PT-18).
    let testimonial = 0; // the retirement send-off gate receipt — a bounded, greatness-scaled one-off (PT-116)
    try {
      const card = legendCardOf(decorated);
      testimonial = Math.max(0, Math.round(Number((card as any).testimonial) || 0));
      const retiredSeason = getActiveModel().profile.season ?? (decorated.generation ?? 0);
      await localStore.saveLegacy(`${pid}:g${decorated.generation ?? 0}`, OWNER, decorated.name, JSON.stringify(card), retiredSeason);
    } catch { /* legend snapshot is best-effort — never block the succession itself */ }
    // THE FORTUNE — the family wealth passes down: a larger cash inheritance to the club.
    let legacy = Math.round((decorated.earnings ?? 0) * RETIREMENT_LEGACY_SHARE);
    if (inheritance === 'fortune') legacy = Math.round(legacy * 1.75) + 200;
    if (legacy > 0) await localStore.addCoins(OWNER, legacy);
    // THE TESTIMONIAL — a great servant's send-off match pays a bounded, greatness-scaled purse. legacyCard
    // models it (legacy.ts) but succeed() used to discard it; pay it now so a legendary career has a tangible
    // farewell reward (a one-off coin credit — no rng, determinism-safe) (PT-116).
    if (testimonial > 0) await localStore.addCoins(OWNER, testimonial);
    // An incoming-bid sale banks its fee HERE — atomically with the star actually leaving the club — not up
    // front. succeed() throws on an already-reborn (prospect) token, so this runs at most once per succession;
    // abandoning the will screen credits nothing and leaves the star owned (no free-money loop) (PT-60).
    const saleFee = Math.max(0, Math.round(Number(body?.saleFee) || 0));
    if (saleFee > 0) await localStore.addCoins(OWNER, saleFee);
    const rf = rebornFields(decorated);
    const dev = JSON.parse(rf.dev_bonus_json ?? '{}');
    if (mentorship > 0) { const b = Math.min(3, Math.ceil(mentorship / 2)); dev.composure = (dev.composure ?? 0) + b; dev.leadership = (dev.leadership ?? 0) + b; }
    // THE CRAFT — his footballing brain passes down: a mental development head-start for the heir.
    if (inheritance === 'craft') { dev.composure = (dev.composure ?? 0) + 2; dev.leadership = (dev.leadership ?? 0) + 2; }
    rf.dev_bonus_json = JSON.stringify(dev);
    // THE NAME — the family renown opens doors: a pedigree (potential) head-start for the heir.
    if (inheritance === 'name') rf.pedigree = Math.min(1, (rf.pedigree ?? 0) + 0.15);
    await localStore.updateToken(pid, rf);
    const fresh = (await localStore.getToken(pid))!;
    const pot = rebornPotential(fresh);
    return { ok: true as const, legacy, saleFee, testimonial, coins: getActiveModel().profile.coins, inheritance: inheritance ?? null, prospect: { id: pid, name: fresh.name, roleHint: fresh.role ?? 'MF', generation: fresh.generation, pedigree: fresh.pedigree, careerStarted: false, potentialStars: pot.stars, genes: JSON.parse(fresh.genes_json) } };
  },
  // SP SEASON PRIZE — also where the local season counter advances (see docs note in save.ts's
  // profile.season) and where a league finish is banked as an honour (the old pod/wall-clock season
  // rollover that used to write honours is gone; this is the one call-per-season-end main.ts makes).
  /** A coin-only prize (no honour, no season bump) — for escalating cup-round rewards (PT-96). */
  cupPrize: async (amount: number) => { await ensureActive(); const a = Math.max(0, Math.round(Number(amount) || 0)); await localStore.addCoins(OWNER, a); return { ok: true as const, coins: getActiveModel().profile.coins, prize: a }; },
  spSeasonReward: async (body: { pos: number; size: number; sponsor?: string; wins?: number; draws?: number; losses?: number; tier?: number; kind?: 'league' | 'continental' | 'world' }) => {
    await ensureActive();
    const model = getActiveModel();
    const size = Math.max(2, Math.min(30, Math.floor(Number(body?.size) || 10)));
    const pos = Math.max(1, Math.min(size, Math.floor(Number(body?.pos) || 10)));
    const frac = (pos - 1) / (size - 1);
    const prize = Math.max(0, pos === 1 ? 800 : Math.round(120 + (1 - frac) * 480));
    const sponsorBonus = String(body?.sponsor) === 'performance' && pos <= 3 ? (pos === 1 ? 700 : 400) : 0;
    const season = model.profile.season;
    // accrue this season's W/D/L into the lifetime manager record (drives prestige, now that the PvP
    // match history is gone) — the caller (nextSeason) passes it from the local season results.
    const clampN = (n: unknown) => Math.max(0, Math.floor(Number(n) || 0));
    model.profile.wins = (model.profile.wins ?? 0) + clampN(body?.wins);
    model.profile.draws = (model.profile.draws ?? 0) + clampN(body?.draws);
    model.profile.losses = (model.profile.losses ?? 0) + clampN(body?.losses);
    // store the pyramid TIER in the honour's `tier` field (was a 'Local' placeholder), so prestige can weight
    // a top-flight title far above a Sunday-league one and credit the climb (PT-86).
    const kind = body?.kind === 'continental' ? 'continental' : body?.kind === 'world' ? 'world' : 'league';
    await localStore.addHonour(OWNER, String(season), season, String(body?.tier ?? ''), pos, pos === 1 ? 1 : 0, Date.now(), prize + sponsorBonus, kind);
    // ONLY the league season roll advances the season counter — a cup (continental/world) banks coins + a
    // distinctly-kinded honour but must not bump profile.season or it desyncs the ledger and files a phantom
    // LEAGUE title mid-season (PT-94).
    if (kind === 'league') model.profile.season = season + 1;
    await localStore.addCoins(OWNER, prize + sponsorBonus); // also schedules the persist that banks the season bump above
    return { ok: true as const, prize, sponsorBonus, coins: getActiveModel().profile.coins };
  },
  spSponsor: async (deal: string) => {
    await ensureActive();
    const upfront = deal === 'steady' ? 450 : deal === 'performance' ? 150 : null;
    if (upfront == null) throw apiErr('unknown deal');
    await localStore.addCoins(OWNER, upfront);
    return { ok: true as const, upfront, coins: getActiveModel().profile.coins };
  },
  developPlayer: async (pid: string, body: { focus: string; age: number }) => {
    await ensureActive();
    const t = await localStore.getToken(pid);
    if (!t) throw apiErr('no such token', {}, 404);
    if (t.state !== 'pro') throw apiErr('not an active pro', {}, 409);
    const age = Math.max(18, Math.min(42, Math.floor(Number(body?.age) || 27)));
    const focus = String(body?.focus ?? '');
    const attrs = JSON.parse(t.attrs_json ?? '{}') as Record<string, number>;
    const bump = (k: string, d: number) => { if (attrs[k] != null) attrs[k] = Math.max(1, Math.min(20, Math.round(attrs[k] + d))); };
    if (age < 27) { bump(focus || 'passing', 1); bump('stamina', 1); }
    else if (age < 31) { bump(focus || 'passing', 1); bump('pace', -1); }
    else { bump('pace', -1); bump('stamina', -1); if (age >= 34) bump('strength', -1); }
    const player = tokenToPlayer({ ...t, attrs_json: JSON.stringify(attrs) } as Token);
    await localStore.updateToken(pid, { attrs_json: JSON.stringify(attrs), peak_overall: Math.max(t.peak_overall ?? 0, overall(player)) });
    return { ok: true as const, player, overall: overall(player) };
  },
  hireStaff: async (staffId: string) => {
    await ensureActive();
    const cost = STAFF_COSTS[staffId];
    if (cost == null) throw apiErr('unknown staff');
    const coins = getActiveModel().profile.coins;
    if (coins < cost) throw apiErr(`not enough coins — ${staffId} costs ${cost}`, {}, 409);
    await localStore.addCoins(OWNER, -cost);
    return { ok: true as const, cost, coins: getActiveModel().profile.coins };
  },
  prospects: async () => {
    await ensureActive();
    const model = getActiveModel();
    const tokens = model.tokens.filter((t) => t.state === 'prospect');
    return { supply: model.tokens.length, cap: SUPPLY_CAP, prospects: tokens.map((t) => { const pot = rebornPotential(t); return { id: t.id, name: t.name, roleHint: t.role ?? 'MF', generation: t.generation, pedigree: t.pedigree, careerStarted: t.career_seed != null, potentialStars: pot.stars, genes: JSON.parse(t.genes_json) }; }) };
  },
  genesis: async () => {
    await ensureActive();
    const coins = getActiveModel().profile.coins;
    if (coins < GENESIS_COST) throw apiErr('not enough coins', { need: GENESIS_COST, have: coins });
    let t: Token;
    try { t = await mintGenesisLocal(); } catch (e: any) { throw apiErr(e?.message ?? 'mint failed', {}, 409); }
    await localStore.addCoins(OWNER, -GENESIS_COST);
    const pot = rebornPotential(t);
    return { ok: true as const, supply: getActiveModel().tokens.length, cap: SUPPLY_CAP, cost: GENESIS_COST, coins: getActiveModel().profile.coins, prospect: { id: t.id, name: t.name, roleHint: t.role ?? 'MF', generation: 0, pedigree: 0, potentialStars: pot.stars, genes: JSON.parse(t.genes_json) } };
  },
  careerAgents: async () => ({ agents: agentsList() }),
  startCareer: async (pid: string, agentId: string | null) => {
    await ensureActive();
    const t = await localStore.getToken(pid);
    if (!t) throw apiErr('no such token', {}, 404);
    if (t.state !== 'prospect') throw apiErr('not a prospect', {}, 409);
    if (t.career_seed == null) await localStore.updateToken(pid, { career_seed: careerSeedFor(t.id, t.generation), agent_id: agentId ?? null, track: trackFor(t.role ?? 'MF'), career_actions: '[]' });
    const fresh = (await localStore.getToken(pid))!;
    const clubName = getActiveModel().club.name ?? null;
    return { ok: true as const, state: careerState(fresh, loadCareer(fresh), clubName) };
  },
  getCareer: async (pid: string) => {
    await ensureActive();
    const t = await localStore.getToken(pid);
    if (!t) throw apiErr('no such token', {}, 404);
    if (t.state !== 'prospect') throw apiErr('not a prospect', {}, 409);
    if (t.career_seed == null) throw apiErr('career not started');
    const clubName = getActiveModel().club.name ?? null;
    return { ok: true as const, state: careerState(t, loadCareer(t), clubName) };
  },
  careerAct: async (pid: string, action: { type: string; cardId: string }) => {
    await ensureActive();
    const t = await localStore.getToken(pid);
    if (!t) throw apiErr('no such token', {}, 404);
    if (t.state !== 'prospect') throw apiErr('not a prospect', {}, 409);
    if (t.career_seed == null) throw apiErr('career not started');
    const c = loadCareer(t);
    const earningsBefore = c.earnings;
    let narration: string | null = null;
    try {
      if (action.type === 'arc') { narration = fillArcText(c.resolveArc(action.cardId), careerCast((c as any).seed >>> 0).rival); } // story-arc branch: apply + fill {RIVAL}
      else narration = actWithNarration(c, action as CareerAction);
    } catch (e: any) { throw apiErr(e?.message ?? 'illegal move'); }
    let clubGain = Math.round(Math.max(0, c.earnings - earningsBefore) * CLUB_WAGE_CUT);
    if (action.type === 'lifestyle') clubGain += clubInvestOf(action.cardId);
    let outcome: CareerOutcome | null = null;
    if (action.type === 'play' && c.log.length) {
      const ch = c.log[c.log.length - 1];
      outcome = { fit: ch.fit, bestFit: ch.bestFit, success: ch.success, tags: ch.tags, answeredAsk: ch.fit >= ch.bestFit - 0.05, matchedAsk: ch.matchedAsk };
    }
    await localStore.updateToken(pid, { career_actions: JSON.stringify([...JSON.parse(t.career_actions ?? '[]'), action]) });
    if (c.finished) {
      const fresh = (await localStore.getToken(pid))!;
      const season = getActiveModel().profile.season;
      const grad = graduatedFields(fresh, c);
      const deal = signContract(season, grad.greed ?? 10, grad.personality ?? undefined);
      await localStore.updateToken(pid, { ...grad, prime_season: season, signed_season: deal.signedSeason, length_seasons: deal.lengthSeasons, staked_since: season });
      const windfall = Math.round((grad.earnings ?? 0) * PRO_SIGNING_SHARE);
      clubGain += windfall;
      if (clubGain > 0) await localStore.addCoins(OWNER, clubGain);
      const epilogue = graduationEpilogue({ name: fresh.name, careerSeed: fresh.career_seed!, personalityId: grad.personality ?? c.personality.id, overall: grad.peak_overall ?? 10, role: grad.role ?? undefined, topTraits: JSON.parse(grad.traits_json ?? '[]') });
      return { ok: true as const, graduated: true as const, narration, outcome, clubGain, windfall, epilogue, player: tokenToPlayer((await localStore.getToken(pid))!) };
    }
    if (clubGain > 0) await localStore.addCoins(OWNER, clubGain);
    const clubName = getActiveModel().club.name ?? null;
    return { ok: true as const, narration, outcome, clubGain, state: careerState((await localStore.getToken(pid))!, c, clubName) };
  },
  saveKit: async (pid: string, kit: Kit) => {
    await ensureActive();
    const t = await localStore.getToken(pid);
    if (!t) throw apiErr('no such token', {}, 404);
    const clean = (s: any, max: number) => String(s ?? '').slice(0, max).replace(/[<>]/g, '');
    const clamped: Kit = {
      number: Math.max(1, Math.min(99, Math.round(Number((kit as any)?.number) || 10))),
      boots: clean((kit as any)?.boots, 16) || 'white',
      celebration: clean((kit as any)?.celebration, 24) || 'kneeslide',
      nickname: clean((kit as any)?.nickname, 20),
      hairstyle: clean((kit as any)?.hairstyle, 16) || 'buzz',
      accessory: clean((kit as any)?.accessory, 16) || 'none',
    };
    await localStore.updateToken(pid, { kit_json: JSON.stringify(clamped) });
    return { ok: true as const, kit: clamped };
  },
  legends: async () => {
    await ensureActive();
    const rows = await localStore.legaciesFor(OWNER);
    return { legends: rows.map((r) => ({ playerId: r.player_id.split(':g')[0], name: r.name, card: JSON.parse(r.card_json), retiredSeason: r.retired_season })) };
  },
  prestige: async () => {
    await ensureActive();
    // Rebuilt for offline: the lifetime W/D/L record is accrued locally at each season-end (see
    // spSeasonReward), and honours (title count) come from the banked league finishes. No tier pyramid
    // in single-player, so highestTierIdx stays 0 (titles + wins + longevity carry the prestige).
    const model = getActiveModel();
    const honours = await localStore.honoursFor(OWNER, 9999);
    const wins = model.profile.wins ?? 0, draws = model.profile.draws ?? 0, losses = model.profile.losses ?? 0;
    // tierIdx is 0 (bottom) .. TIERS-1 (top flight): a title won in a higher tier is worth far more prestige,
    // and the highest tier ever reached is itself an achievement — so the pyramid climb finally registers (PT-86).
    const tierIdxOf = (h: { tier: string }) => { const ct = Number(h.tier); return ct >= 1 && ct <= TIERS ? TIERS - ct : 0; };
    const highestTierIdx = honours.reduce((m, h) => Math.max(m, tierIdxOf(h)), 0);
    // continental/world cup wins count as CUP titles (not league championships) toward prestige (PT-94)
    const honourLites = honours.map((h) => ({ tierIdx: tierIdxOf(h), title: h.title, kind: (h.kind === 'league' ? 'league' : 'cup') as 'cup' | 'league' }));
    const seasons = new Set(honours.map((h) => h.season_number)).size;
    return { prestige: managerPrestige({ wins, draws, losses, honours: honourLites, highestTierIdx, seasons }), record: { wins, draws, losses, seasons }, highestTierIdx }; // highestTierIdx also surfaced for the climb achievements (PT-121)
  },
  setStandingOrders: async (so: StandingOrders) => {
    await ensureActive();
    if (!isFormation(so.formation)) throw apiErr('bad formation');
    const { club } = mergedClub(); // NFT stars are valid XI picks too
    const roles = cleanRoles(so as any);
    const lineup: Lineup = { formation: so.formation, playerIds: so.playerIds, duties: so.duties, ...roles };
    if (!validateLineup(club, lineup)) throw apiErr('invalid lineup');
    const clean: StandingOrders = { formation: so.formation, playerIds: so.playerIds, tactics: so.tactics as Tactics, duties: cleanDuties(club, lineup), ...roles };
    await localStore.saveStandingOrders(OWNER, clean);
    return { ok: true as const, standingOrders: clean };
  },
  trials: async () => {
    await ensureActive();
    const model = getActiveModel();
    const seasonId = String(model.profile.season);
    const signed = await localStore.loaneeIds(OWNER, seasonId);
    const count = await localStore.countLoanees(OWNER, seasonId);
    const signedSet = new Set(signed);
    const extra = youthPoolBonus(model.facilities.youth), youthUp = youthUpgradeChance(model.facilities.youth);
    const pool = generatePool(OWNER, model.profile.season, TIER, extra, youthUp).map((t) => ({ ...t, signed: signedSet.has(t.id) }));
    return { season: model.profile.season, cap: LOANEE_CAP, signedCount: count, pool };
  },
  signTrial: async (index: number) => {
    await ensureActive();
    const model = getActiveModel();
    const seasonId = String(model.profile.season);
    if ((await localStore.countLoanees(OWNER, seasonId)) >= LOANEE_CAP) throw apiErr(`you can sign at most ${LOANEE_CAP} loanees a season`, {}, 409);
    const extra = youthPoolBonus(model.facilities.youth), youthUp = youthUpgradeChance(model.facilities.youth);
    const player = trialistAt(OWNER, model.profile.season, index, TIER, extra, youthUp);
    if (!player) throw apiErr('no such trialist', {}, 404);
    const c = await localStore.getClub(OWNER);
    if (!c) throw apiErr('club not found', {}, 404);
    if (c.club.players.some((p) => p.id === player.id)) throw apiErr('already signed', {}, 409);
    c.club.players.push(player);
    await localStore.saveClub(OWNER, c.club, c.standingOrders);
    await localStore.addLoanee(OWNER, seasonId, player.id);
    return { ok: true as const, player: { name: player.name, role: player.role }, signedCount: await localStore.countLoanees(OWNER, seasonId) };
  },
  facilities: async () => {
    await ensureActive();
    const model = getActiveModel();
    const fac = model.facilities;
    const coins = model.profile.coins;
    const facilities: Facility[] = FACILITY_KEYS.map((key) => {
      const level = (fac as any)[key] as number;
      const cost = upgradeCost(level);
      return { key, ...FACILITY_META[key], level, maxLevel: MAX_LEVEL, effect: effectAt(key, level), nextEffect: level < MAX_LEVEL ? effectAt(key, level + 1) : null, upgradeCost: cost, canAfford: cost != null && coins >= cost };
    });
    return { coins, facilities };
  },
  upgradeFacility: async (key: string) => {
    await ensureActive();
    if (!FACILITY_KEYS.includes(key as FacilityKey)) throw apiErr('unknown facility');
    const model = getActiveModel();
    const level = (model.facilities as any)[key] as number;
    const cost = upgradeCost(level);
    if (cost == null) throw apiErr('already at max level', {}, 409);
    if (model.profile.coins < cost) throw apiErr(`not enough coins — upgrade costs ${cost}`, {}, 409);
    await localStore.addCoins(OWNER, -cost);
    await localStore.setFacilityLevel(OWNER, key, level + 1);
    return { ok: true as const, key, level: level + 1, coins: getActiveModel().profile.coins };
  },
  missions: async () => {
    await ensureActive();
    const model = getActiveModel();
    const seasonId = String(model.profile.season);
    const [trips, count, loaneeCount] = await Promise.all([
      localStore.missionsInSeason(OWNER, seasonId), localStore.countMissionsInSeason(OWNER, seasonId), localStore.countLoanees(OWNER, seasonId),
    ]);
    const now = Date.now();
    const fac = model.facilities;
    const hqMult = scoutHitMult(fac.scouting), discount = scoutCostDiscount(fac.scouting);
    const tripsPerSeason = TRIPS_PER_SEASON + scoutExtraTrips(fac.scouting);
    const destinations: ScoutDestination[] = DESTINATIONS.map((d) => ({
      id: d.id, name: d.name, blurb: d.blurb, weights: d.weights, travelMins: d.travelMins,
      cost: Math.round(d.cost * (1 - discount)),
      ...previewOdds(d, TIER, hqMult),
    }));
    return {
      season: model.profile.season, tier: TIER, tripsPerSeason, tripsUsed: count,
      tripsLeft: Math.max(0, tripsPerSeason - count), loaneeCap: LOANEE_CAP, loaneeCount, coins: model.profile.coins,
      destinations, missions: trips.map((m) => missionView(m, now)),
    };
  },
  dispatchScout: async (destination: string) => {
    await ensureActive();
    const model = getActiveModel();
    const dest = destinationById(destination);
    if (!dest) throw apiErr('unknown destination');
    const fac = model.facilities;
    const seasonId = String(model.profile.season);
    const tripsPerSeason = TRIPS_PER_SEASON + scoutExtraTrips(fac.scouting);
    if ((await localStore.countMissionsInSeason(OWNER, seasonId)) >= tripsPerSeason) throw apiErr(`you can dispatch at most ${tripsPerSeason} scouting trips a season`, {}, 409);
    const cost = Math.round(dest.cost * (1 - scoutCostDiscount(fac.scouting)));
    if (model.profile.coins < cost) throw apiErr(`not enough coins — ${dest.name} costs ${cost}`, {}, 409);
    await localStore.addCoins(OWNER, -cost);
    const id = crypto.randomUUID();
    const outcome = rollMission(id, dest, TIER, scoutHitMult(fac.scouting));
    const now = Date.now();
    const row: MissionRow = {
      id, account_id: OWNER, season_id: seasonId, destination: dest.id,
      dispatched_at: now, ready_at: now + travelMs(dest),
      found: outcome.found ? 1 : 0, player_json: outcome.player ? JSON.stringify(outcome.player) : null,
      band: outcome.band, status: 'travelling',
    };
    await localStore.createMission(row);
    return { ok: true as const, mission: missionView(row, now), coins: getActiveModel().profile.coins };
  },
  signMission: async (id: string) => {
    await ensureActive();
    const model = getActiveModel();
    const seasonId = String(model.profile.season);
    const m = await localStore.missionById(id);
    if (!m) throw apiErr('no such trip', {}, 404);
    if (m.status === 'signed') throw apiErr('already signed', {}, 409);
    if (Date.now() < m.ready_at) throw apiErr('the scout is still travelling', {}, 409);
    if (!m.found || !m.player_json) throw apiErr('that trip came back empty-handed', {}, 409);
    if ((await localStore.countLoanees(OWNER, seasonId)) >= LOANEE_CAP) throw apiErr(`you can field at most ${LOANEE_CAP} loanees a season`, {}, 409);
    const player = JSON.parse(m.player_json) as Player;
    const c = await localStore.getClub(OWNER);
    if (!c) throw apiErr('club not found', {}, 404);
    if (!c.club.players.some((p) => p.id === player.id)) c.club.players.push(player);
    await localStore.saveClub(OWNER, c.club, c.standingOrders);
    await localStore.addLoanee(OWNER, seasonId, player.id);
    await localStore.setMissionSigned(m.id);
    return { ok: true as const, player: { name: player.name, role: player.role }, signedCount: await localStore.countLoanees(OWNER, seasonId) };
  },
  diary: async () => {
    await ensureActive();
    // The old diary was a running story over PvP pod matches; those no longer exist locally. A
    // reduced (but non-throwing) version: the same deterministic template, fed the local season number
    // with no match/table context. Worth a look in the browser — this is a real feature downgrade.
    const model = getActiveModel();
    const entry = gaffersDiaryEntry({ seasonNumber: model.profile.season, matches: [], table: null });
    return { entry };
  },
  honours: async (limit?: number) => { await ensureActive(); return { honours: await localStore.honoursFor(OWNER, limit) }; },
  awards: async () => { await ensureActive(); return { awards: [] as AwardRow[] }; }, // superseded, not downgraded: the old Golden Boot/Playmaker awards were PvP-pod individual-stat leaderboards; single-player surfaces the star's real achievements via honours/caps/legends in the Trophy Room instead. Kept as a stub (no caller remains).
  scoutTiers: async () => ({ opp: TIER, player: TIER, nft: { address: '', chainId: 0, enabled: false } }),
};
