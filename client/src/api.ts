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
import { applyMorale } from '../../shared/src/managerarc.js';   // raw-delta morale — contract terms produce a number, not a named event
import {
  makeClub as _makeClub, // re-exported nowhere — freshSave() (save.ts) already calls this; kept for reference
  validateLineup, cleanDuties,
  overall, managerPrestige, signContract, graduationEpilogue, clubInvestOf, TIERS, tierStrength, mintSquadPlayer,
  mintHeirs, heirCount, familyTrait, nephewCount, BRANCHES_KEPT,
  transferList, transferFee, sellValue, squadSaleValue, incomingBid, MIN_SQUAD, MAX_SQUAD,
  signSquadContract, staggeredContractSeasons, advanceSquad, squadSeasonsLeft, squadRenewCost, squadSeasonWage, squadStorylines,
  contractDemand, evaluateContractOffer, wageForLength, lengthPremiumFor,
  FACILITY_KEYS, FACILITY_META, MAX_LEVEL, upgradeCost, effectAt, seasonFacilityIncome, squadMarketability,
  seasonUpkeep, facilityUpkeep, UPKEEP_WEIGHT, applyDisrepair, mothballRefund, facLevel,
  youthPoolBonus, youthUpgradeChance, dormIntakeBonus, scoutHitMult, scoutCostDiscount, scoutExtraTrips,
  generatePool, trialistAt, LOANEE_CAP, DESTINATIONS, destinationById, rollMission, travelMatchdays, previewOdds,
  gaffersDiaryEntry,
  rollGenes, updateMorale, moraleEffects, rollMatchInjuries, developAttrs,
  deriveMatchStats, type MatchPlayerStat,
  seasonAwards, AWARD_LABEL, type AwardKind,
  houseRenown, branchCareer, rivalStandings, renownPedigree, renownBidMult, renownIncomeMult, type HouseMember,
  tokenToPlayer, tokenContract, legendCardOf, loadCareer, actWithNarration, careerState, graduatedFields, careerCast, fillArcText,
  heirGeneBasis, rebornFields, rebornPotential, prospectTemper, careerSeedFor, trackFor, agentsList, foundingNameFor, nameFor,
  type FacilityKey, type MissionRow, type Token, type CareerAction,
  FORMATIONS,

  reconcileSheet, isDutyForRole, defaultDuty,} from '@fm/shared';
import {
  localStore, getActiveModel, getActiveSlotId, newGame as newGameSlot, continueSave, listSaves, deleteSave as deleteSaveSlot, setSaveBackend, type SaveBackend,
} from './save';

void _makeClub; // silence unused-import — see comment above

/** Test-only seam: point the facade's persistence at an injected backend (e.g. `createInMemoryBackend()`
 *  from save.ts) so headless tests (client/qa_offline_facade.ts) don't need IndexedDB/a browser. Never
 *  called by the real app. */
export function __setBackendForTests(b: SaveBackend): void { setSaveBackend(b); }

const OWNER = 'local'; // the single local owner every GameStore call is scoped to (see save.ts)
const TRIPS_PER_SEASON = 3;
// Scout quality now comes from the Scouting HQ facility, not a wallet. 'base' remains the neutral floor
// for the legacy tier table; the real dial is the facility level passed alongside it. (2026-08-30)
const TIER = 'base';
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
  id: string; destination: string; destName: string; dispatchedAt: number; readyAt: number; readyInMs: number; matchdaysLeft: number;
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
  /** What this level costs to run each season, and what the next one would. */
  upkeep: number; nextUpkeep: number | null;
}
export interface FacilitiesData { coins: number; facilities: Facility[]; upkeep: number }
export interface MatchPayload {
  // NO `gateIncome` FIELD, DELIBERATELY. One was declared here and the full-time card carried the matching
  // "🏟️ Gate receipts: +N coins" line (`#ft-gate` in client/index.html, `this.lastGate` in main.ts) — and
  // nothing in the codebase ever WROTE it. `startMatch` has exactly one call site, the single-player kickoff
  // in main.ts, and it builds this payload without the field, so `lastGate` fell through `?? 0` on every
  // match and the line stayed hidden on every full-time card the game has ever shown. Wiring a value in is
  // NOT the repair: gate money is already paid ONCE A SEASON by `seasonFacilityIncome().gate`
  // (shared/src/facilities.ts), which derives the takings from that season's home record and result mix and
  // reports them in the rollover income breakdown. Crediting it again per match pays the same crowd twice —
  // the over-payment shape `shared/qa_facilities.ts` already guards against. A per-match gate line is a
  // design change to the economy, not a missing assignment.
  matchId: string; seed: number; result: [number, number]; mySide: 0 | 1; coinsEarned?: number; injuries?: Array<{ name: string; matches: number }>;
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
// DERIVED, not duplicated. This was a hand-written list of EIGHT while the lineup editor offers ELEVEN
// (`client/src/main.ts:203`), so saving a sheet set to `4-1-4-1`, `5-4-1` or `4-2-2-2` threw 'bad formation'
// — into a bare `catch {}` at the kickoff persist, which meant the team sheet silently did not save at all
// for three of the eleven shapes the game invites the player to pick. `FORMATIONS` in shared/src/formations.ts
// is the single source of truth: a formation is valid exactly when the engine knows where to stand for it.
/** The stored action record, or null when it is not a record at all. A non-array payload must never be
 *  spread: `'"corrupt"'` spreads to its characters and writes fabricated turns into the save. */
function parseActions(raw: string | null | undefined): unknown[] | null {
  if (raw == null) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : null; } catch { return null; }
}

/** Refuse to advance a career whose stored record did not fully replay, or could not be read.
 *
 *  Refusing keeps the record intact and therefore recoverable. Continuing overwrites it: `careerAct`
 *  appends to the stored list while the replay stops short, so play moves the counter by one, vanishes on
 *  reload, and `finished` is never reached — which strands the bloodline permanently. */
function assertReplayable(c: { replay?: { applied: number; stored: number } }, t: { career_actions?: string | null }): void {
  if (parseActions(t.career_actions) === null) {
    throw apiErr('This career\'s record could not be read. It has NOT been changed — playing on would overwrite it.', {}, 409);
  }
  if (c.replay) {
    throw apiErr(
      `This career can't be continued safely — ${c.replay.applied} of ${c.replay.stored} recorded moments could be replayed. `
      + 'Your record is intact and has not been changed; playing on would overwrite it.',
      { replay: c.replay }, 409,
    );
  }
}

const isFormation = (f: unknown): f is Lineup['formation'] =>
  typeof f === 'string' && Object.prototype.hasOwnProperty.call(FORMATIONS, f);

/** Load the club with the owner's PRO/RETIRED tokens merged in as fieldable players — read/gameplay
 *  only, mirrors server/src/index.ts's `loadSquad`. Never feed this into `saveClub`/`saveStandingOrders`. */
/** PRUNE THE SAVED XI of players who no longer exist, backfilling from the rest of the squad.
 *  Retirements, departures AND SUCCESSION leave dangling ids in the standing orders, and buildXI then
 *  throws on a player who is not there — the second half of the bricked-save bug (PT-300).
 *
 *  This lived inline in advanceSquadSeason and so covered only the rollover. It did NOT cover succession,
 *  where the outgoing star's token flips from 'pro' back to 'prospect' and he therefore drops out of
 *  mergedClub() — so EVERY handover left an XI referencing a player who is no longer in the squad, and the
 *  save's own standing orders were rejected by setStandingOrders from that point on. The lineup editor
 *  repairs it on screen, but the repair was never written back, so the hand-picked XI and its per-slot
 *  duties were silently discarded at every generation.
 */
/** Repair a stored team sheet against the squad that now exists, or leave it alone if it cannot be.
 *
 *  Replaces `pruneXI`, which kept the surviving ids and COMPACTED them while leaving `duties`,
 *  `captainIdx` and `takers` pinned to the old slot numbers — so every designation slid onto a different
 *  man. Measured over 20 seasons of ordinary play: 18 scrambled the sheet, the armband moved 17 times, 52
 *  taker reassignments, 118 illegal duties, and none of it was ever reported because the result is a VALID
 *  sheet. `reconcileSheet` is in shared/src/teamsheet.ts and is unit-tested by shared/qa_teamsheet.ts. */
function reconciled(club: Club, so: StandingOrders): StandingOrders {
  const squad = fieldablePlayers(club).map((p) => ({ id: p.id, role: p.role as string, ovr: overall(p) }));
  const fixed = reconcileSheet(so as any, squad, (role, duty) => isDutyForRole(role as any, duty as any),
    (sp) => defaultDuty(club.players.find((p) => p.id === sp.id) ?? ({ role: sp.role } as any)));
  return (fixed as StandingOrders | null) ?? so;
}

/** club.players PLUS the merged pro/retired tokens — the squad a team sheet is allowed to name.
 *
 *  Factored out of `mergedClub` because passing the RAW club to the sheet code was a live defect: the
 *  bloodline star is a Token and is never in `club.players`, so every season he counted as departed, was
 *  evicted from the saved XI, and the armband moved to someone else. Measured over three seasons with no
 *  squad churn at all: ejected 3 of 3. */
function fieldablePlayers(club: Club): Player[] {
  const m = getActiveModel();
  const have = new Set(club.players.map((p) => p.id));
  const merged = [...club.players];
  for (const t of m.tokens) {
    if (t.state !== 'pro' && t.state !== 'retired') continue;
    if (have.has(t.id)) continue;
    // A PERSON ON THE TREE IS NOT A FOOTBALLER IN THE SQUAD. Branching retires every passed-over brother
    // at the succession after his own, and those men never played a career — no attrs_json, so
    // tokenToPlayer yields `attrs: {}` and overall() is NaN. Merging them put one NaN body into the club
    // per generation, permanently: the season header rendered "wage bill ~NaNc" from generation 2,
    // autoPickXI selected ghosts in every formation tested, and setStandingOrders accepted the XI because
    // validateLineup has no finite-rating check. They could not even be sold — sellPlayer does not know
    // them. attrs_json is the honest test of "did this person ever actually play".
    // "DID THIS MAN EVER ACTUALLY PLAY", not "is the field present". `'{}'` is truthy, so the old
    // `!t.attrs_json` admitted a token with an empty attrs object. It no longer yields NaN — overall()
    // defaults a missing attribute to 10 — but an attribute-less person is still not a footballer, and a
    // passed-over brother should not appear in the squad at a flat 10. JSON.stringify always emits a digit
    // for a real number, so any token with one genuine attribute passes.
    if (!t.attrs_json || !/[0-9]/.test(t.attrs_json)) continue;
    merged.push(tokenToPlayer(t)); have.add(t.id);
  }
  return merged;
}

function mergedClub(): { club: Club; standingOrders: StandingOrders } {
  const m = getActiveModel();
  return { club: { ...m.club, players: fieldablePlayers(m.club) }, standingOrders: m.standingOrders };
}

/** Mint a brand-new 10-year-old prospect (fresh genes, generation 0) — lifted from server/src/tokens.ts's
 *  `mintGenesis`, against the local store. Enforces the fixed SUPPLY_CAP. */
async function mintGenesisLocal(): Promise<Token> {
  if ((await localStore.countTokens()) >= SUPPLY_CAP) throw new Error('supply cap reached');
  const n = (await localStore.countTokens()) + 1;
  const id = `nft:${n}`;
  // A BOUGHT PROSPECT IS AN OUTSIDER, NOT FAMILY. This used foundingNameFor, so a 300-coin purchase came
  // back carrying the player's own surname and the academy called him "first of the line" — the same
  // billing as the actual founder. For a game whose entire pitch is that heirs carry the family name,
  // handing that name to every stranger you buy off the street guts the premise. The three candidates on
  // the NEW GAME scout board keep the family name, because one of them becomes the founder; this one is a
  // spare body with a life of his own.
  const seed = seedFrom(id + ':genesis');
  const genes = rollGenes(seed);
  // The save id is mixed in so two saves do not mint the same stranger — the id is a counter, not a UUID.
  await localStore.createToken({ id, owner_id: OWNER, generation: 0, state: 'prospect', name: nameFor(seedFrom(`${getActiveSlotId() ?? OWNER}:${id}:genesis`)), genes_json: JSON.stringify(genes), pedigree: 0, dev_bonus_json: '{}' });
  await localStore.updateToken(id, { role: seedFrom(id + ':gk') % 100 < 12 ? 'GK' : 'MF' });
  return (await localStore.getToken(id))!;
}

/** Nudge a token's morale by one event — lifted from server/src/lifecycle.ts's `bumpMorale`. */
async function bumpMoraleLocal(tokenId: string, event: Parameters<typeof updateMorale>[1]): Promise<void> {
  const t = await localStore.getToken(tokenId);
  if (t) await localStore.updateToken(tokenId, { morale: updateMorale(t.morale ?? 65, event) });
}
/** The same, for a raw delta rather than a named event — contract terms produce a number, not an event. */
async function bumpMoraleByLocal(tokenId: string, delta: number): Promise<void> {
  const t = await localStore.getToken(tokenId);
  if (t) await localStore.updateToken(tokenId, { morale: applyMorale(t.morale ?? 65, delta) });
}

/** Serialise a stored scouting trip, hiding the outcome until travel completes — lifted from
 *  server/src/index.ts's `missionView`. */
/** Matches this dynasty has played, ever. The lifetime W/D/L on the profile only ever increments and is
 *  not reset at a season rollover or a succession, which makes it the one counter a scouting trip can be
 *  measured against without a season-boundary special case. */
function matchesPlayed(): number {
  const p = getActiveModel().profile;
  return (p.wins ?? 0) + (p.draws ?? 0) + (p.losses ?? 0);
}

/** `ready_at` IS NOW A MATCHDAY ORDINAL, NOT A TIMESTAMP. The unit changed; the column did not, so no save
 *  migration is needed — a legacy value is a millisecond timestamp and therefore astronomically larger than
 *  any matchday count, which is exactly how the two are told apart below. A trip dispatched under the old
 *  wall-clock rule is treated as already home rather than left unreachable for ever. */
const LEGACY_TIMESTAMP = 1e12;
function missionView(m: MissionRow, played: number) {
  const dest = destinationById(m.destination);
  const legacy = m.ready_at > LEGACY_TIMESTAMP;
  const revealed = legacy || played >= m.ready_at || m.status === 'signed';
  const player = revealed && m.found && m.player_json ? (JSON.parse(m.player_json) as Player) : null;
  return {
    id: m.id, destination: m.destination, destName: dest?.name ?? m.destination,
    dispatchedAt: m.dispatched_at, readyAt: m.ready_at,
    readyInMs: 0,                                            // kept for shape; the wall clock no longer gates anything
    matchdaysLeft: legacy ? 0 : Math.max(0, m.ready_at - played),
    revealed, status: m.status, found: revealed ? !!m.found : null, band: revealed ? m.band : null,
    player: player ? { id: player.id, name: player.name, role: player.role, overall: overall(player), attrs: player.attrs as unknown as Record<string, number> } : null,
  };
}


/** Everyone the house is scored on, drawn straight off the tokens. Module-level because both the Houses
 *  table and the places renown OPENS DOORS need it, and a second derivation would be a second thing to
 *  drift. */
async function membersOf(model: ReturnType<typeof getActiveModel>): Promise<HouseMember[]> {
  // EVERY GENERATION THE FAMILY EVER PLAYED, not just the one alive right now.
  //
  // The played line is ONE token, reused: succeed() reworks it in place with generation +1, and
  // rebornFields zeroes ach_league / ach_cup / ach_seasons on the way through. So the retiring man's
  // silverware — 100 renown per league title — left the house at the handover and nothing put it back,
  // against a Houses screen that tells the player in as many words that renown never falls.
  //
  // The rows to score him from already existed: succeed() snapshots each generation as a legend card under
  // `<id>:g<gen>` for the Family Record. Read them the same way bloodline() does, with the same `g < gen`
  // bound — which is also what keeps the just-written card for the generation now retiring from being
  // counted twice, since the token's generation has not been incremented yet at that call site.
  const legs = await localStore.legaciesFor(OWNER).catch(() => [] as any[]);
  const cardBy = new Map<string, any>();
  const nameBy = new Map<string, string>();
  for (const l of (legs as any[])) {
    const key = String(l.player_id ?? l.playerId ?? '');
    try { cardBy.set(key, JSON.parse(l.card_json ?? l.cardJson ?? '{}')); } catch { /* skip */ }
    nameBy.set(key, String(l.name ?? ''));
  }
  const ancestors: HouseMember[] = model.tokens.flatMap((t) => {
    const gen = t.generation ?? 0;
    const out: HouseMember[] = [];
    for (let g = 0; g < gen; g++) {
      const card = cardBy.get(`${t.id}:g${g}`);
      if (!card) continue; // a pre-suffix save has no snapshot for that generation; he scores nothing
      out.push({
        name: nameBy.get(`${t.id}:g${g}`) || t.name, generation: g, played: true,
        peakOverall: Number(card.peakOverall) || 0,
        caps: Number(card.caps) || 0,
        leagueTitles: Number(card.leagueTitles) || 0,
        cups: Number(card.cupTitles) || 0,
        seasons: Number(card.seasons) || 0,
        bigNights: Number(card.bigNights) || 0,
      });
    }
    return out;
  });
  const live = model.tokens.map((t) => {
      let hon: any = null;
      try { hon = t.career_honours_json ? JSON.parse(t.career_honours_json) : null; } catch { /* none */ }
      const played = ((t as any).branch ?? 'played') !== 'sibling';
      if (!played && !hon) {
        // He played somewhere; the game just never watched. Without this the branches sit at zero and
        // contribute nothing, in the one place the design says they should count.
        const c = branchCareer(((t as any).branch_seed ?? 0) >>> 0, t.pedigree ?? 0);
        return { name: t.name, generation: t.generation ?? 0, played: false, ...c };
      }
      return {
        name: t.name, generation: t.generation ?? 0, played,
        // Math.max, not `??`: hon.peakOverall is frozen at graduation while t.peak_overall keeps rising
        // each rollover, so the `??` fallback could never be reached and a decade of development scored
        // nothing. legendCardOf already takes this same max (shared/src/tokens.ts) — now the house does
        // too, and the tree, the legend card and the Houses table finally read one man off one number.
        peakOverall: Math.max(hon?.peakOverall ?? 0, t.peak_overall ?? 0),
        caps: hon?.caps ?? 0,
        leagueTitles: t.ach_league ?? 0,
        cups: t.ach_cup ?? 0,
        seasons: t.ach_seasons ?? 0,
        bigNights: hon?.bigNights?.length ?? 0,
      };
    });
  return [...live, ...ancestors];
}

export const api = {
  // ── new game / continue (no server accounts — a "save" IS the local profile) ──
  /** `worldSeed` is for HARNESSES ONLY — it pins the generated world so a test is reproducible. The game
   *  never passes it, so a real new game is as random as it ever was. */
  register: async (_handle: string, _password: string, clubName?: string, worldSeed?: number, slotId?: string) => {
    const name = (clubName && clubName.trim()) || 'My Club';
    const id = await newGameSlot(name, worldSeed, slotId); // freshSave() (save.ts) already builds the starting club + standing orders
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

  /** Tick the treatment room WITHOUT rolling new injuries — for a fixture the player did not watch.
   *
   *  settleInjuries only runs on the live-played league path: the cup branches return before it and
   *  simRemainingFixtures never reached it at all. So a manager who simmed the rest of a season left an
   *  injured man in the treatment room permanently — nothing else in the game clears an injury, and the
   *  Medical Centre, 14,000 coins to max, bought him nothing. Matches he did not watch still pass. */
  tickInjuries: async (matches = 1) => {
    await ensureActive();
    const before = await localStore.getInjuries(OWNER);
    for (let i = 0; i < Math.max(1, Math.min(60, matches)); i++) await localStore.decrementInjuries(OWNER);
    const still = new Set((await localStore.getInjuries(OWNER)).map((x) => x.player_id));
    return { returned: before.filter((x) => !still.has(x.player_id)).map((x) => x.player_id) };
  },

  /** Tick every existing knock down one match and report who is FIT AGAIN, then roll the XI that just
   *  played for fresh injuries.
   *
   *  The whole injury system was built and then never connected. `addInjury`, `decrementInjuries` and
   *  `rollMatchInjuries` had no callers anywhere in the project, so `me().injuries` was permanently empty
   *  and everything downstream of it was dead code: the lineup editor's "🤕 Injured" panel, the
   *  auto-selection that skips the unavailable, the squad screen's injury list, and the Medical Centre,
   *  a facility whose entire advertised effect is on a roll that never happened. A player narrated as
   *  "out for six matches" played the next one. */
  settleInjuries: async (team: Team, endFitness: number[], matchSeed: number) => {
    await ensureActive();
    const model = getActiveModel();
    const before = await localStore.getInjuries(OWNER);
    await localStore.decrementInjuries(OWNER);
    const still = new Set((await localStore.getInjuries(OWNER)).map((i) => i.player_id));
    const returned = before.filter((i) => !still.has(i.player_id)).map((i) => i.player_id);
    // A man already in the treatment room did not play, so he cannot pick up a second knock today.
    const fresh = rollMatchInjuries(team, endFitness, model.facilities.medical, matchSeed >>> 0)
      .filter((n) => !still.has(n.playerId));
    for (const n of fresh) await localStore.addInjury(OWNER, n.playerId, n.matches);
    return { fresh, returned };
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
    // Squad ids must be unique and STABLE. This used to STRIP the separators out of a listing id
    // (`mk:${season}:${tier}:${i}`), so `mk:1:1:11` and `mk:11:1:1` both collapsed to `mk1111` — and it
    // keyed off `players.length`, which moves as players leave. Two squad members could end up sharing an
    // id, at which point sellPlayer's filter removes BOTH. Keep the separators, stamp the season, and
    // check the squad rather than trusting the shape. (PT-304)
    const safe = String(player.id || 'p').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
    const season = getActiveModel().profile.season;
    let uid = `bought-${season}-${safe}`;
    for (let n = 2; c.club.players.some((p) => p.id === uid); n++) uid = `bought-${season}-${safe}-${n}`;
    // A signing joins on a real CONTRACT (Living Squad): he keeps the age the listing advertised, and his
    // deal runs from this season — so he'll age, cost wages, and eventually force a renew-or-lose call
    // instead of being a free permanent asset (PT-90/PT-92).
    c.club.players.push(signSquadContract({ ...player, id: uid }, getActiveModel().profile.season));
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
    // He isn't yours to sell. A trialist costs nothing to sign, so without this the squad screen is a coin
    // printer: sign a free trialist, sell him, repeat. He leaves for nothing when his trial ends. (PT-303)
    if ((await localStore.loaneeIds(OWNER, String(getActiveModel().profile.season))).includes(playerId)) {
      throw apiErr("he's only here on trial — you can't sell a player you don't own", {}, 409);
    }
    // A fading veteran is worth less than his rating suggests -- and so is an unsettled one, which is what
    // the squad report has been telling the manager all along ("unsettled players sell for less, up to 20%
    // less"). `moraleEffects().sellMult` existed and reached no call site, while the +30% RE-SIGN half of
    // the same effect was wired, which is exactly what made the claim look credible.
    const value = squadSaleValue(overall(p), p.age ?? 26, moraleEffects(p.morale ?? 65).sellMult);
    await localStore.addCoins(OWNER, value);
    c.club.players = c.club.players.filter((x) => x.id !== playerId);
    // ...and repair the sheet, or the next editor open rebuilds it and the next kickoff COMMITS the wipe
    await localStore.saveClub(OWNER, c.club, reconciled(c.club, c.standingOrders));
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
    const lengthPremium = lengthPremiumFor(p);   // one copy of the rule, in contracts.ts
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
    const lengthPremium = lengthPremiumFor(p);   // one copy of the rule, in contracts.ts
    const demand = { baseWage: ci.extendCost, prefLength: ci.lengthSeasons, minLength: 2, maxLength: 6, lengthPremium };
    const result = evaluateContractOffer(demand, Math.round(wage), Math.round(length));
    // HOW YOU TREATED HIM COUNTED FOR NOTHING. evaluateContractOffer returns a moraleDelta — +6 for terms he
    // is delighted with, +3 for terms he merely accepts, 0 for a counter, and -6 for an offer he is insulted
    // by — and no caller had ever applied it. So a generous deal and a grudging one landed identically (both
    // got only the flat `extended` +10), and walking your star to the table and lowballing him was entirely
    // free: this function returns on the non-accept paths before any morale is touched at all.
    if (result.moraleDelta) await bumpMoraleByLocal(playerId, result.moraleDelta);
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
    // GRADUATION IS IRREVERSIBLE. On a career that replayed short this would sign the player at the age the
    // truncated replay reached — 18 instead of 25, with 62-72% less in earnings — and flip the token out of
    // `prospect` for good. `careerAct` refuses on the same condition; this path had no guard at all.
    assertReplayable(c, t);
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
    // ONLY THE CUPS ARE BANKED HERE NOW. Seasons, apps and league titles accrue at each season roll (see
    // spSeasonReward), so adding them again at the succession counted every campaign twice.
    await localStore.updateToken(pid, { ach_cup: (t.ach_cup ?? 0) + cups });
    void seasons; void titles;
    const decorated = (await localStore.getToken(pid))!;
    // SNAPSHOT THE LEGEND before the token is reborn — this is what populates the Bloodline Tree / Hall of
    // Legends. Keyed with a :g<gen> suffix so every generation is a distinct node (legends() groups by the
    // base id, splitting on ':g'). Without this the game's signature generational chain never fills (PT-18).
    let testimonial = 0; // the retirement send-off gate receipt — a bounded, greatness-scaled one-off (PT-116)
    try {
      const card = legendCardOf(decorated) as any;
      // Fold the frozen honours onto the card BEFORE the token is reborn. rebornFields clears
      // career_honours_json, so this is the last moment his caps and big nights exist anywhere.
      try {
        const h = decorated.career_honours_json ? JSON.parse(decorated.career_honours_json) : null;
        if (h) { card.caps = Number(h.caps) || 0; card.bigNights = (h.bigNights?.length ?? 0) || 0; }
      } catch { /* a card without them scores 0, which is what it scored before */ }
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
    // CAPTURED BEFORE rebornFields, and that ordering is the whole ballgame. `getToken` hands back the
    // live object out of the in-memory model, not a copy, so `updateToken(pid, rf)` MUTATES `decorated`
    // underneath us — after which its career_seed reads null and its generation has already advanced.
    // Every dynasty in the game therefore fell through to the `generation * K` fallback below, which is a
    // constant: heirCount saw the same number for every save at every playthrough, and it happens to be 1
    // at generations 1 and 2. The branching bloodline was inert in the shipping game, and the pure-maths
    // harness could never have seen it — only driving the real facade did.
    // The father's bands and his earned ceiling lift, from the SINGLE derivation rebornFields uses.
    // This used to read decorated.genes_json — the bands he was BORN with, which no career ever
    // updates — so nothing a father did on the pitch reached his sons at all.
    const { parentGenes, ceilingLift } = heirGeneBasis(decorated);
    const parentGen = decorated.generation ?? 0;
    // Same reason: rebornFields RENAMES the token to the heir, so reading it later gives the son's name
    // where the father's belongs and a cousin would be captioned with his own boy's name.
    const parentName = decorated.name;
    // A career that ended without a seed still needs one, and it must be stable across replays and unique
    // per person: careerSeedFor is exactly that, and is what startCareer would have used.
    const parentSeed = ((decorated.career_seed ?? 0) >>> 0) || (careerSeedFor(decorated.id, parentGen, getActiveSlotId() ?? OWNER) >>> 0)  /* world-mixed, like startCareer — a bare two-arg call reinstates the constant-across-all-saves seed */;

    const rf = rebornFields(decorated);
    const dev = JSON.parse(rf.dev_bonus_json ?? '{}');
    if (mentorship > 0) { const b = Math.min(3, Math.ceil(mentorship / 2)); dev.composure = (dev.composure ?? 0) + b; dev.leadership = (dev.leadership ?? 0) + b; }
    // THE CRAFT — his footballing brain passes down: a mental development head-start for the heir.
    if (inheritance === 'craft') { dev.composure = (dev.composure ?? 0) + 2; dev.leadership = (dev.leadership ?? 0) + 2; }
    rf.dev_bonus_json = JSON.stringify(dev);
    // THE NAME — the family renown opens doors: a pedigree (potential) head-start for the heir.
    if (inheritance === 'name') rf.pedigree = Math.min(1, (rf.pedigree ?? 0) + 0.15);
    // AND THE HOUSE'S OWN STANDING, on top and unconditionally. A famous surname gets a boy seen by the
    // right people at the right age; it does not make him better, it makes him NOTICED, which is what
    // pedigree already means here. Sublinear, so a house that is already winning is not handed more.
    const houseBefore = houseRenown(await membersOf(getActiveModel())).renown;
    rf.pedigree = Math.min(1, (rf.pedigree ?? 0) + renownPedigree(houseBefore));
    // THE SON YOU PLAY WAS THE ONE SON WITH NO FAMILY RESEMBLANCE. mintHeirs models a family deliberately:
    // each attribute gets a family mean shared by every brother, plus a per-child deviation that is tiny on
    // the family attribute (KEEP_FAMILY 0.86, FAMILY_DEV 0.6) and wide on the others — "that is what makes
    // it the family's, rather than merely a trait the brothers happen to share". It mints `nHeirs` of them
    // and the sibling loop below consumes heirs[1..n-1], because heirs[0] IS the played heir. But his genes
    // came from rebornFields' own plain inheritGenes roll instead, so every brother carried the family
    // attribute and the boy the player actually embodies did not. The whole model, missing at its centre.
    const nHeirs = heirCount(parentSeed, parentGen);
    // ceilingLift passed, finally. Overwriting rf.genes_json below (so the played heir shares his
    // brothers' family attribute) also discarded rebornFields' lift-bearing roll, which left the
    // whole earned-inheritance mechanism dead in the shipped game — a fix that quietly severed
    // another. mintHeirs threads it into famCeil for every sibling, so all of them get it now.
    const heirs = mintHeirs(parentGenes, parentSeed, nHeirs, ceilingLift);
    rf.genes_json = JSON.stringify(heirs[0].genes);
    await localStore.updateToken(pid, rf);
    // ── THE BRANCHING BLOODLINE ────────────────────────────────────────────────────────────────────
    // A generation produces 1-3 heirs. The PLAYED line keeps the parent's token id (above), because the
    // legend chain snapshots by `${id}:g<gen>` and reusing the id is what makes a dynasty's history
    // contiguous. The BROTHERS are new tokens hanging off it by `parent_id`, so the save becomes a forest
    // without breaking anything that walks the old chain.
    //
    // A brother is a FULL PLAYER, not a summary row — the user was explicit. He is minted through the same
    // path every rich squad player takes, so he can be scouted, signed, played against, and can father the
    // next generation himself.
    // TWO BROTHERS CALLED MILO. The played heir is named by rebornFields and the brothers by
    // foundingNameFor, independently, out of the same first-name pool — so a sibling set could and did
    // come out with duplicates, which on the succession screen reads as a rendering fault rather than as
    // a family. Names are drawn against everyone already on this rank.
    const takenNames = new Set<string>([String(rf.name ?? '')]);
    const distinctName = (seed: number) => {
      for (let salt = 0; salt < 24; salt++) {
        const nm = foundingNameFor((seed ^ Math.imul(salt, 0x9e3779b1)) >>> 0, getActiveModel().profile.name);
        if (!takenNames.has(nm)) { takenNames.add(nm); return nm; }
      }
      return foundingNameFor(seed, getActiveModel().profile.name);   // pool exhausted; a repeat beats a hang
    };

    const siblings: Array<{ id: string; name: string; temper: string; potentialStars: number; familyTrait: string; fatherName: string; cousin: boolean }> = [];
    for (let i = 1; i < heirs.length; i++) {
      const h = heirs[i];
      const sid = `${pid}:b${parentGen + 1}.${i}`;
      const nm = distinctName(h.seed);
      await localStore.createToken({
        id: sid, owner_id: OWNER, generation: parentGen + 1, state: 'prospect', name: nm,
        genes_json: JSON.stringify(h.genes), pedigree: rf.pedigree ?? 0, dev_bonus_json: rf.dev_bonus_json ?? '{}',
      });
      // The temperament the screen promises has to be the one the career will roll — `h.personality` is a
      // roll off `heirSeed` that nothing downstream ever reads again (91% mismatch, measured).
      const sTemper = prospectTemper({ id: sid, generation: parentGen + 1, career_seed: null } as unknown as Token, getActiveSlotId() ?? OWNER);
      await localStore.updateToken(sid, { parent_id: pid, branch: 'sibling', personality: sTemper, branch_seed: h.seed, father_name: parentName } as any);
      siblings.push({ id: sid, name: nm, temper: sTemper, potentialStars: rebornPotential({ genes_json: JSON.stringify(h.genes), pedigree: rf.pedigree ?? 0 } as unknown as Token).stars, familyTrait: h.familyTrait, fatherName: parentName, cousin: false });
    }

    // ── THE COUSINS ────────────────────────────────────────────────────────────────────────────────
    // The brother you passed over a generation ago had a life. Some of those lives produced a boy who can
    // play, and at THIS succession he stands alongside your own sons — which is what makes passing a
    // brother over a decision with a future rather than a discard.
    //
    // Only the retiring star's OWN generation is swept. A branch gets exactly one chance to carry on, at
    // the succession where its sons would be the right age; after that the generation counter has moved
    // past it and it is never revisited. That is both the spec's "no branches older than the grandfather"
    // and the thing that stops the forest growing without bound.
    // Sons of the retiring star before cousins, then BRANCHES_KEPT of them. Both halves matter: every
    // unchosen candidate is itself a branch that could carry on, so without the cap the population feeds
    // back on itself — measured over 300 ten-generation dynasties, one succession offered twenty-one
    // candidates. The family keeps in touch with the branches nearest the trunk and loses the rest.
    // NOT filtered on branch === 'sibling'. When the player switched the line onto a cousin last time, the
    // son he passed over is a token marked 'played' sitting in the prospect pool — he is a passed-over
    // branch in every sense that matters here, and excluding him would both deny his sons a chance and
    // leave him in the pool for ever. The star's own brothers sort first (same father), cousins after.
    const starParent = (decorated as any).parent_id ?? null;
    const sameGen = getActiveModel().tokens
      .filter((t) => t.id !== pid && (t.generation ?? 0) === parentGen && t.state === 'prospect')
      .sort((a, b) => Number((b as any).parent_id === starParent) - Number((a as any).parent_id === starParent));
    const uncles = sameGen.slice(0, BRANCHES_KEPT);
    for (const uncle of uncles) {
      const useed = ((uncle as any).branch_seed ?? 0) >>> 0;
      if (!useed) continue;                                  // pre-branching token: nothing to derive from
      const n = nephewCount(useed);
      if (!n) continue;                                      // his line ends here, and that is normal
      const kids = mintHeirs(JSON.parse(uncle.genes_json), useed, n);
      for (let i = 0; i < kids.length; i++) {
        const k = kids[i];
        const nid = `${uncle.id}.n${i}`;
        const nnm = distinctName(k.seed);
        await localStore.createToken({
          id: nid, owner_id: OWNER, generation: parentGen + 1, state: 'prospect', name: nnm,
          genes_json: JSON.stringify(k.genes), pedigree: uncle.pedigree ?? 0, dev_bonus_json: uncle.dev_bonus_json ?? '{}',
        });
        const nTemper = prospectTemper({ id: nid, generation: parentGen + 1, career_seed: null } as unknown as Token, getActiveSlotId() ?? OWNER);
        await localStore.updateToken(nid, { parent_id: uncle.id, branch: 'sibling', personality: nTemper, branch_seed: k.seed, father_name: uncle.name } as any);
        siblings.push({ id: nid, name: nnm, temper: nTemper, potentialStars: rebornPotential({ genes_json: JSON.stringify(k.genes), pedigree: uncle.pedigree ?? 0 } as unknown as Token).stars, familyTrait: k.familyTrait, fatherName: uncle.name, cousin: true });
      }
    }
    // Every branch of the retiring star's generation is settled now, swept or not — those men are his age,
    // far too old to begin a career. Retiring them keeps them on the Family Record while taking them out of
    // the prospect pool, which they were never leaving before: siblings were minted as prospects and left
    // there, so a fifth-generation save was offering a great-great-uncle as a boy to take on.
    for (const t of sameGen) await localStore.updateToken(t.id, { state: 'retired' } as any);

    // The played line needs a branch seed of its own: if the player takes a cousin at some later succession,
    // THIS is the branch that was passed over, and without a seed his sons could never be derived.
    await localStore.updateToken(pid, { branch_seed: heirs[0].seed, father_name: parentName } as any);

    const fresh = (await localStore.getToken(pid))!;
    const pot = rebornPotential(fresh);
    // THE OUTGOING STAR IS NO LONGER IN THE SQUAD, so the saved XI now names a player who does not exist.
    // Write the repair back rather than leaving the save carrying an invalid lineup for the next manager.
    {
      const cc = await localStore.getClub(OWNER);
      if (cc) {
        const pruned = reconciled(cc.club, cc.standingOrders);
        if (pruned !== cc.standingOrders) await localStore.saveClub(OWNER, cc.club, pruned);
      }
    }
    return { ok: true as const, legacy, saleFee, testimonial, siblings, familyTrait: familyTrait(parentSeed), coins: getActiveModel().profile.coins, inheritance: inheritance ?? null, prospect: { id: pid, name: fresh.name, roleHint: fresh.role ?? 'MF', generation: fresh.generation, pedigree: fresh.pedigree, careerStarted: false, potentialStars: pot.stars, temper: prospectTemper(fresh, getActiveSlotId() ?? OWNER), genes: JSON.parse(fresh.genes_json) } };
  },
  // SP SEASON PRIZE — also where the local season counter advances (see docs note in save.ts's
  // profile.season) and where a league finish is banked as an honour (the old pod/wall-clock season
  // rollover that used to write honours is gone; this is the one call-per-season-end main.ts makes).
  /** A coin-only prize (no honour, no season bump) — for escalating cup-round rewards (PT-96). */
  cupPrize: async (amount: number) => { await ensureActive(); const a = Math.max(0, Math.round(Number(amount) || 0)); await localStore.addCoins(OWNER, a); return { ok: true as const, coins: getActiveModel().profile.coins, prize: a }; },
  spSeasonReward: async (body: { arcCoins?: number; pos: number; size: number; sponsor?: string; wins?: number; draws?: number; losses?: number; tier?: number; starId?: string; promoted?: boolean; kind?: 'league' | 'continental' | 'world' }) => {
    await ensureActive();
    const model = getActiveModel();
    // THE COMMERCIAL PULL OF A FAMOUS HOUSE — sponsorship and gate follow the name, so the season's money
    // rises with the family's standing. Sublinear and capped at +39%: real money, never the reason you
    // can afford a squad.
    const houseMult = renownIncomeMult(houseRenown(await membersOf(model)).renown);
    const size = Math.max(2, Math.min(30, Math.floor(Number(body?.size) || 10)));
    const pos = Math.max(1, Math.min(size, Math.floor(Number(body?.pos) || 10)));
    const frac = (pos - 1) / (size - 1);
    // THE CLIMB HAS TO PAY. `tier` was passed in, filed on the honour, and then ignored by the prize — so
    // winning the top flight paid exactly what winning the Sunday league paid, and nine of the ten tiers
    // were content with no economic reason to leave them.
    //
    // Corrected by making the BOTTOM poorer rather than the top richer. The economy already only ever goes
    // up — a straight four-generation run went 500 to 45,101 coins without once falling toward zero — so
    // inflating the summit would have made a solved economy worse. A 4x gradient from basement to top
    // flight instead makes the early game genuinely tight and the climb worth making.
    // A CUP IS NOT A DIVISION. Defaulting a missing `tier` to TIERS taxed every cup payout 60% — winning
    // the Continental Cup paid 320 against the 800 its own comment documents. The first attempt at this
    // fixed the default AND made the cup call sites pass `this.clubTier()`, which cancelled out: a
    // basement club winning a continental trophy still got 320, the exact number the fix existed to
    // remove. The cup sites now pass no tier, so continental and world silverware pays a flat top rate
    // wherever the club sits domestically — which is what winning a continental trophy means.
    const rawTier = Number(body?.tier);
    // A garbage tier resolves to the TOP flight and its 1.6x, so an upstream bug would quadruple a prize
    // rather than fail. Only a value genuinely inside the pyramid is honoured; anything else takes the
    // documented cup default, and says so.
    const validTier = Number.isFinite(rawTier) && rawTier >= 1 && rawTier <= TIERS;
    if (rawTier !== undefined && !Number.isNaN(rawTier) && !validTier) console.warn('[reward] tier out of range, using the cup default:', rawTier);
    const tierIdx = TIERS - (validTier ? Math.round(rawTier) : 1);  // 0 = basement … 9 = top flight
    const tierMult = 0.4 + tierIdx * (1.2 / Math.max(1, TIERS - 1));                                 // 0.4x … 1.6x
    const prize = Math.round(Math.max(0, pos === 1 ? 800 : Math.round(120 + (1 - frac) * 480)) * tierMult * houseMult);
    const sponsorBonus = String(body?.sponsor) === 'performance' && pos <= 3 ? (pos === 1 ? 700 : 400) : 0;
    const season = model.profile.season;
    // accrue this season's W/D/L into the lifetime manager record (drives prestige, now that the PvP
    // match history is gone) — the caller (nextSeason) passes it from the local season results.
    const clampN = (n: unknown) => Math.max(0, Math.floor(Number(n) || 0));
    model.profile.wins = (model.profile.wins ?? 0) + clampN(body?.wins);
    model.profile.draws = (model.profile.draws ?? 0) + clampN(body?.draws);
    model.profile.losses = (model.profile.losses ?? 0) + clampN(body?.losses);
    // THE FACILITIES FINALLY PAY. Everything the club built that promised money now returns it, once a
    // season, through the one shared function so the sum can never drift from what the facility cards say.
    const honoursSoFar = await localStore.honoursFor(OWNER, 9999).catch(() => [] as any[]);
    // ONCE A SEASON, NOT ONCE A PAYOUT. spSeasonReward is called by the league roll AND by three cup
    // payouts, and this was unconditional — so sponsorship, shop and women's-team income, all explicitly
    // per-season lumps, were re-paid in full up to four times. A group-stage EXIT described in its own
    // comment as "a small payoff" banked 1,890 coins of sponsorship the club had already been paid.
    // Same `kind === 'league'` guard the season counter one block below already uses.
    const isLeagueRoll = body?.kind !== 'continental' && body?.kind !== 'world';
    const starTok = body?.starId ? await localStore.getToken(String(body.starId)) : null;
    const starMarketability = starTok?.marketability ?? 10;
    const facIncome = !isLeagueRoll ? { gate: 0, sponsor: 0, shop: 0, womens: 0, merit: 0, total: 0 } : seasonFacilityIncome(
      model.facilities, tierIdx,
      // A SUNDAY LEAGUE TITLE DOES NOT PRICE A SPONSORSHIP DEAL. This passed a raw count, and the trophy
      // term inside sponsorIncome has no tier scaling — so a club that never left the basement banked the
      // same +4,500 as a top-flight champion, while winning 47 titles in the time the top flight yields 1.
      // Measured, refusing to climb out-earned the summit by 40% over fifty seasons. Each title is now
      // weighted by the division it was won in, so five top-flight titles are worth twenty Sunday League
      // ones and the cap is reached by winning things that are hard to win.
      (honoursSoFar as any[]).filter((h) => h.title && h.kind === 'league')
        .reduce((n, h) => { const ct = Number(h.tier); const idx = ct >= 1 && ct <= TIERS ? TIERS - ct : 0; return n + 1 + idx * 0.35; }, 0),
      // COMMERCIAL INCOME FOLLOWS YOUR STAR, NOT A SQUAD AVERAGE.
      // This was `squadMarketability(model.club.players)`, and it returned EXACTLY 10 for every club in
      // every season of every save. Two reasons, and both had to be true: no mint path sets
      // `marketability` on a squad player, and the one man who has it -- the bloodline star, whose brand
      // is built through his card career -- is not in `club.players` at all. He lives as a Token and is
      // merged in only for reads. So `brandMult` was pinned at 1.0 and the whole commercial layer was a
      // constant. career.ts's own note says this stat exists so "a fan-favourite helps pay his own wages,
      // giving greed a genuine upside instead of being a pure tax" -- and greed was a pure tax.
      //
      // Including the star in the AVERAGE was measured and rejected: diluted across twenty players he
      // moves sponsor income from 1197 to 1215, about 1.5%, which is a fix that looks like one and is not.
      // Real commercial income follows the biggest name at the club, so it reads him directly. A club with
      // no star reads the neutral 10 and is unchanged.
      starMarketability,
      { wins: clampN(body?.wins), draws: clampN(body?.draws), losses: clampN(body?.losses) },
    );

    // store the pyramid TIER in the honour's `tier` field (was a 'Local' placeholder), so prestige can weight
    // a top-flight title far above a Sunday-league one and credit the climb (PT-86).
    const kind = body?.kind === 'continental' ? 'continental' : body?.kind === 'world' ? 'world' : 'league';
    await localStore.addHonour(OWNER, String(season), season, String(body?.tier ?? ''), pos, pos === 1 ? 1 : 0, Date.now(), prize + sponsorBonus, kind);
    // ONLY the league season roll advances the season counter — a cup (continental/world) banks coins + a
    // distinctly-kinded honour but must not bump profile.season or it desyncs the ledger and files a phantom
    // LEAGUE title mid-season (PT-94).
    if (kind === 'league') model.profile.season = season + 1;
    // THE HOUSE'S RECORD ACCRUES AS THE SEASON HAPPENS, not only at the succession. `membersOf()` scores
    // renown from `ach_seasons` / `ach_league` on the star's token, and those were written in exactly one
    // place — succeed(). So the Houses table was frozen for an ENTIRE GENERATION: measured, a manager won
    // the league with 24 wins and his renown stayed at 47 across all six seasons, moving only when he
    // retired. The game's whole meta-progression was inert for nine or ten seasons at a time, in a panel
    // whose own copy reads "every family climbing the same ladder".
    // Reported back so the season screen can READ THE HONOURS OUT. Writing an award the player never
    // hears about would repeat the exact defect this whole wiring exists to fix.
    const wonAwards: Array<{ kind: string; player_name: string; value: number; label: string }> = [];
    if (isLeagueRoll) {
      // SEASON AWARDS. The Award row and its store methods have existed since the server era with nothing
      // ever calling them -- and for a simpler reason than the usual: there was no per-player season data
      // to derive an award FROM, because `deriveMatchStats` was itself unwired. Now that matches record
      // who scored, the honours are derivable. Computed from the season being closed, before the season
      // counter advances. Failures are swallowed: an honour is worth less than the result card.
      try {
        // `season`, NOT profile.season: the counter was already advanced ~15 lines up, so reading it back
        // here would score the honours against the empty season that has not been played yet -- awarding
        // nothing, every time. The stats being judged belong to the season that just CLOSED.
        const closingId = String(season);
        const rows = await localStore.seasonPlayerStats(closingId, [OWNER]);
        for (const a of seasonAwards(rows, {
          seasonId: closingId, seasonNumber: season,
          tier: String(tierIdx), accountId: OWNER, awardedAt: season,
        })) {
          // STAMPED WITH THE GENERATION for a bloodline player, following saveLegacy's `:g<gen>` convention.
          // Without it every generation's honours pile onto whoever currently holds the reused token id.
          const tok = a.player_id ? await localStore.getToken(a.player_id).catch(() => null) : null;
          const row = tok ? { ...a, player_id: `${a.player_id}:g${tok.generation ?? 0}` } : a;
          await localStore.addAward(row);
          wonAwards.push({ ...a, label: AWARD_LABEL[a.kind as AwardKind] ?? a.kind });
        }
      } catch { /* never let an honour cost the player his season */ }
      const starId = body?.starId;
      const st = starId ? await localStore.getToken(String(starId)) : null;
      // HIS ACTUAL SEASON, not a flat assumption. `ach_goals`, `ach_assists` and `ach_potm` were declared
      // (token.ts:23), read (tokens.ts:95) and RENDERED (main.ts careerRecordHtml) but written nowhere
      // except as the literal 0 in two initialisers -- while `ach_apps` WAS written, as a flat +18. The
      // strip shows as soon as apps are non-zero, so from the star's first completed season every legend
      // card in the game permanently read "0 goals · 0 assists · 0 ★ · 18 apps", under a doc comment
      // promising a record "banked across matches". The data was being thrown away three lines above this,
      // where the awards read the very same rows back.
      const mine = st ? (await localStore.seasonPlayerStats(String(season), [OWNER])
        .catch(() => [] as any[])).find((r: any) => r.player_id === st.id) : undefined;
      if (st) await localStore.updateToken(st.id, {
        ach_seasons: (st.ach_seasons ?? 0) + 1,
        // Fall back to the old flat +18 only when no per-player rows exist for the season -- a save that
        // predates match-stat recording, or a season the manager never played a fixture in.
        ach_apps: (st.ach_apps ?? 0) + (mine?.apps ?? 18),
        ach_goals: (st.ach_goals ?? 0) + (mine?.goals ?? 0),
        ach_assists: (st.ach_assists ?? 0) + (mine?.assists ?? 0),
        ach_potm: (st.ach_potm ?? 0) + (mine?.potm ?? 0),
        ach_league: (st.ach_league ?? 0) + (pos === 1 ? 1 : 0),
        // THE TIER HE DID IT IN, and every division he climbed. Neither was ever written — the only
        // writers, recordPlayerSeason and setAchievements, have no callers — so tokenAch() always returned
        // highestTierIdx 0, and legacyCard's `tierMult = 1 + highestTierIdx * 0.3` was permanently 1
        // instead of up to 3.7. Every legend card in the game was deflated: a career of four league titles
        // and two cups scored 64 where the design intends 100, one point short of even qualifying as an
        // Icon, and `testimonial` was capped at 600 against a 2,000 ceiling.
        ach_tier: Math.max(st.ach_tier ?? 0, tierIdx),
        ach_promotions: (st.ach_promotions ?? 0) + (body?.promoted ? 1 : 0),
      });
    }
    // `arcCoins` is the season's banked manager-arc coin effects (see applyArcEffect). They were applied
    // to a display-only field and never persisted, so every one of the 1,031 arc options carrying a
    // coins effect was inert. Clamped so a run of penalties cannot drive the treasury negative.
    const arcCoins = Number.isFinite(body?.arcCoins) ? Number(body?.arcCoins) : 0;
    const credit = prize + sponsorBonus + facIncome.total + arcCoins;
    await localStore.addCoins(OWNER, Math.max(credit, -getActiveModel().profile.coins)); // also schedules the persist that banks the season bump above

    // UPKEEP — charged in the same league roll that pays the facility income, because it is the other half
    // of the same transaction: what the club earns by being a club, minus what it costs to BE one. Only on
    // a league roll, for the same reason the income is (a cup run must not re-bill a per-season cost).
    let upkeep = 0, salvage = 0, fellIn: FacilityKey[] = [];
    if (isLeagueRoll) {
      const due = seasonUpkeep(model.facilities);
      // `have` is deliberately read AFTER the season's income has been banked (line above): a club pays its
      // bills out of what it has once the prize money is in, which is what a real one does. A prior review
      // called this a bug on the grounds that disrepair almost never fires — it does not, 9 times in 4,680
      // measured seasons — but the cause is that upkeep is not a binding constraint on the income curve
      // (6,804 a season against 10,428 at the summit), not that the test reads the wrong number. Logged as
      // an economy-balance item rather than patched here, where it would make the club pay bills it can
      // afford out of money it does not yet have.
      const have = getActiveModel().profile.coins;
      upkeep = Math.max(0, Math.min(have, due));
      if (upkeep > 0) await localStore.addCoins(OWNER, -upkeep);
      // CANNOT PAY THE BILL: something in the club falls into disrepair. This is the failure state that
      // makes upkeep a decision rather than a tax — you overreached, and the club physically shrinks back
      // to what you can run. One level per season, so it is a slide you can arrest, not a collapse.
      // Cut toward what the club actually earned this season, not toward zero — the target is a bill it can
      // carry next year, so the slide stops as soon as the club fits inside its own means.
      if (due > have) {
        const dis = applyDisrepair(model.facilities, Math.max(0, prize + sponsorBonus + facIncome.total));
        fellIn = dis.cut;
        // SELLING OFF A LEVEL PAYS THE SAME WHETHER YOU CHOSE IT OR NOT (see applyDisrepair). This also
        // gives a club in trouble the cash to arrest the slide, instead of draining it to exactly 0 and
        // leaving it there — measured, a relegated maxed club sat on 0 coins for SIXTY consecutive
        // seasons with every purchase in the game disabled.
        salvage = dis.salvage;
        if (salvage > 0) await localStore.addCoins(OWNER, salvage);
        // PERSIST each cut. applyDisrepair mutates the in-memory object, which does NOT schedule a write —
        // the club would repair itself on reload and upkeep would be unenforceable.
        for (const k of new Set(fellIn)) await localStore.setFacilityLevel(OWNER, k, facLevel(model.facilities, k as FacilityKey));
      }
    }
    return { ok: true as const, awards: wonAwards, prize, sponsorBonus, houseMult, tierMult, facilities: facIncome, upkeep, salvage, disrepair: fellIn, coins: getActiveModel().profile.coins };
  },
  spSponsor: async (deal: string) => {
    await ensureActive();
    const upfront = deal === 'steady' ? 450 : deal === 'performance' ? 150 : null;
    if (upfront == null) throw apiErr('unknown deal');
    await localStore.addCoins(OWNER, upfront);
    return { ok: true as const, upfront, coins: getActiveModel().profile.coins };
  },
  /** THE LIVING SQUAD season rollover: age the manager's whole squad a year, develop the young, fade the
   *  veterans, retire whoever is done, charge the season's wage bill, and report whose deal is now up.
   *  The bloodline star is NOT here — he keeps his own token path (developPlayer + MgrState.starAge). */
  advanceSquadSeason: async (body: { trainingLvl?: number; wonSomething?: boolean; goodSeason?: boolean }) => {
    await ensureActive();
    const c = await localStore.getClub(OWNER);
    if (!c) throw apiErr('club not found', {}, 404);
    const season = getActiveModel().profile.season;
    // THE SEASON THAT CLOSED, not the one just opened. `spSeasonReward` runs first from nextSeason and
    // advances `profile.season`, so by the time we get here the counter is already N+1 -- while `signTrial`
    // filed the loanee under N. Asking for N+1's loanees returned nothing, so a trialist NEVER went home:
    // he was grandfathered onto a real contract by the next line and then freely sellable, and LOANEE_CAP
    // resets each season, so three free players a year could be signed and sold in perpetuity.
    const closing = Math.max(0, season - 1);
    // grandfather any player with no deal (a pre-Living-Squad save, or the founding squad) onto one that
    // starts now, so nobody is silently free forever
    // TRIALISTS GO HOME. A loan/trial is documented as expiring at season end, but nothing ever removed
    // them: `deleteLoaneesInSeason` cleared the RECORD and left the player in the squad, and it had no
    // callers anyway. So a free trialist became a permanent, sellable asset — sign, sell, repeat, and the
    // coin economy prints money from nothing. Their trial ends here. (PT-303)
    const loaneeIds = new Set(await localStore.loaneeIds(OWNER, String(closing)));
    const stayed = c.club.players.filter((p) => !loaneeIds.has(p.id));
    const wentHome = c.club.players.length - stayed.length;
    if (wentHome > 0) { c.club.players = stayed; await localStore.deleteLoaneesInSeason(String(closing)); }
    const roster = c.club.players.map((p) => (p.signedSeason == null ? signSquadContract(p, season, staggeredContractSeasons(p.id)) : p));
    // who actually played matters: a man who spent the season in the XI of a winning side is settled, one who
    // never got a game is agitating — that's what makes selection a relationship, not just a number (Phase 3)
    const xi = new Set(c.standingOrders?.playerIds ?? []);
    const avgOv = roster.length ? roster.reduce((t, p) => t + overall(p), 0) / roster.length : 8;
    const roll = advanceSquad(roster, season, Math.max(1, Math.floor(Number(body?.trainingLvl) || 1)),
      { xi, wonSomething: !!body?.wonSomething, goodSeason: !!body?.goodSeason, quality: avgOv });
    // wages are a real cost, but never bankrupt the club into a stuck state — charge what's affordable
    const coinsNow = getActiveModel().profile.coins;
    const charged = Math.max(0, Math.min(coinsNow, Math.round(roll.wageBill)));
    if (charged > 0) await localStore.addCoins(OWNER, -charged);
    // WAGES CAN FORCE DISREPAIR TOO — and until now nothing could. Disrepair lived only in the league roll,
    // where it tested `due > have` with `have` read AFTER the season's income had been banked, so it needed
    // upkeep to exceed the treasury PLUS a whole season's earnings. Measured: 0 disrepair events in 194
    // seasons, and 0 across 101 more with an aggressive build policy, despite 27 seasons ending under 200
    // coins and one ending on 1. Meanwhile the bill that actually empties a club is the wage bill, charged
    // here and absent from that test entirely — so the real failure state was silent permanent poverty
    // rather than the visible, arrestable slide applyDisrepair was written to be.
    //
    // An unpaid wage is the honest trigger: the club has run out of money meeting its obligations, which is
    // exactly what "living beyond its means" means. It cuts toward the shortfall, pays the same 40% salvage
    // as every other route out of a level, and is capped per season like the league-roll path.
    const unpaidWages = Math.max(0, Math.round(roll.wageBill) - charged);
    let wageCut: FacilityKey[] = [], wageSalvage = 0;
    const forcedOut: Player[] = [];
    // WITH THE PRICE HE WENT FOR. These men were folded into `departed` and reported to the player as
    // contract expiries — "their deals ran out and weren't renewed" — which is not what happened: the
    // club could not pay its wages and sold them at 60% of value to cover the bill. The player was told
    // an untruth about the one event that most needed explaining, and given no figure for what the fire
    // sale actually raised.
    const forcedSales: Array<{ p: Player; fee: number }> = [];
    if (unpaidWages > 0) {
      const model = getActiveModel();
      const dis = applyDisrepair(model.facilities, Math.max(0, seasonUpkeep(model.facilities) - unpaidWages));
      wageCut = dis.cut;
      wageSalvage = dis.salvage;
      if (wageSalvage > 0) await localStore.addCoins(OWNER, wageSalvage);
      for (const k of new Set(wageCut)) await localStore.setFacilityLevel(OWNER, k, facLevel(model.facilities, k as FacilityKey));
      // AND WHEN THERE IS NOTHING LEFT TO SELL, THE MECHANISM DISARMED ITSELF. `facilityToDowngrade` returns
      // null once every facility is at level 1, so `applyDisrepair` returned an empty cut and the shortfall
      // was simply forgiven. Measured: 40 seasons at level 1 billed 320,000 coins of wages, PAID ZERO, and
      // lost nothing — a club that keeps its treasury at zero could run an unlimited wage bill forever. And
      // level 1 is precisely where the disrepair slide ENDS, so the penalty switched itself off at the exact
      // moment it was needed. The football answer is the obvious one: a club that cannot pay its wages sells
      // a player, at a price that reflects everyone knowing it has to. Cheapest first, so the slide costs the
      // squad's fringe before its spine, and never below MIN_SQUAD.
      if (wageCut.length === 0) {
        let owed = unpaidWages;
        // the bloodline star is a Token merged in for reads and is never in `club.players`, so the squad
        // list here is already only the men the club actually pays.
        const sellable = roll.players
          .slice()
          .sort((a, b) => squadSaleValue(overall(a), a.age ?? 26) - squadSaleValue(overall(b), b.age ?? 26));
        while (owed > 0 && roll.players.length - forcedOut.length > MIN_SQUAD) {
          const p = sellable.find((x) => !forcedOut.includes(x));
          if (!p) break;
          const distressed = Math.round(squadSaleValue(overall(p), p.age ?? 26) * 0.6); // forced sale, forced price
          forcedOut.push(p);
          forcedSales.push({ p, fee: distressed });
          // THE SALE PAYS THE WAGES. `owed` was decremented here and then never read again, while every
          // forced sale credited the club the full proceeds -- so a club that could not pay its bill sold
          // players, kept every coin, and had the shortfall written off. Being insolvent was strictly more
          // profitable than being solvent: 69c against a 749c bill ended the rollover on ~689c. Only the
          // surplus above the debt reaches the treasury now.
          const toDebt = Math.min(distressed, owed);
          owed -= toDebt;
          wageSalvage += distressed;
          const surplus = distressed - toDebt;
          if (surplus > 0) await localStore.addCoins(OWNER, surplus);
        }
        if (forcedOut.length) roll.players = roll.players.filter((p) => !forcedOut.includes(p));
      }
    }
    c.club.players = roll.players;
    const so = reconciled(c.club, c.standingOrders);
    await localStore.saveClub(OWNER, c.club, so);
    const lite = (p: Player) => ({ id: p.id, name: p.name, role: p.role, age: p.age ?? 0, ovr: overall(p) });
    return {
      ok: true as const,
      coins: getActiveModel().profile.coins,
      wageBill: Math.round(roll.wageBill), charged, unpaid: Math.round(roll.wageBill) - charged,
      disrepair: wageCut, salvage: wageSalvage,
      retired: roll.retired.map(lite),
      departed: roll.departed.map(lite),
      sold: forcedSales.map(({ p, fee }) => ({ ...lite(p), fee })),
      intake: roll.intake.map(lite),
      expiring: roll.expiring.map((p) => ({ ...lite(p), renewCost: Math.round(squadRenewCost(overall(p), season) * moraleEffects(p.morale ?? 65).extendMult), morale: p.morale ?? 65, moraleLabel: moraleEffects(p.morale ?? 65).label })),
      // the season's human headlines — who arrived, who faded, who's being circled (Phase 4)
      storylines: squadStorylines(roll, season),
      unhappy: roll.changes.filter((ch) => !ch.retired && moraleEffects(ch.moraleAfter).unsettled).map((ch) => ({ ...lite(ch.player), morale: ch.moraleAfter, moraleLabel: moraleEffects(ch.moraleAfter).label })),
      // A PLAYER GROWING INTO A TRAIT IS A SEASON HEADLINE, not a silent stat edit. `advanceSquad` now
      // re-checks eligibility after development; without this line the manager would never learn it
      // happened, which is the same invisible-mechanism defect the re-check exists to fix.
      earned: roll.changes.filter((ch) => !ch.retired && ch.earnedTraits?.length)
        .map((ch) => ({ ...lite(ch.player), traits: ch.earnedTraits })),
      risers: roll.changes.filter((ch) => ch.ovrAfter > ch.ovrBefore && !ch.retired).map((ch) => ({ ...lite(ch.player), from: ch.ovrBefore, to: ch.ovrAfter })),
      fallers: roll.changes.filter((ch) => ch.ovrAfter < ch.ovrBefore && !ch.retired).map((ch) => ({ ...lite(ch.player), from: ch.ovrBefore, to: ch.ovrAfter })),
    };
  },
  /** Renew an expiring squad player's contract (wage x length, paid up front). */
  renewSquadPlayer: async (playerId: string) => {
    await ensureActive();
    const c = await localStore.getClub(OWNER);
    if (!c) throw apiErr('club not found', {}, 404);
    const p = c.club.players.find((x) => x.id === playerId);
    if (!p) throw apiErr('no such player', {}, 404);
    const cost = Math.round(squadRenewCost(overall(p), getActiveModel().profile.season) * moraleEffects(p.morale ?? 65).extendMult); // an unhappy player holds out for more
    if (getActiveModel().profile.coins < cost) throw apiErr('not enough coins', { need: cost }, 402);
    await localStore.addCoins(OWNER, -cost);
    c.club.players = c.club.players.map((x) => (x.id === playerId ? signSquadContract(x, getActiveModel().profile.season) : x));
    await localStore.saveClub(OWNER, c.club, c.standingOrders);
    return { ok: true as const, coins: getActiveModel().profile.coins, cost };
  },
  /** Let an expiring squad player walk (frees his wage, no fee). */
  releaseSquadPlayer: async (playerId: string) => {
    await ensureActive();
    const c = await localStore.getClub(OWNER);
    if (!c) throw apiErr('club not found', {}, 404);
    if (c.club.players.length <= MIN_SQUAD) throw apiErr(`you can't drop below ${MIN_SQUAD} players`, {}, 409);
    const p = c.club.players.find((x) => x.id === playerId);
    if (!p) throw apiErr('no such player', {}, 404);
    // The bloodline star is not a squad member you can release. sellPlayer has carried this guard since
    // PT-90; release never did, so the one irreplaceable player in the game could be deleted from a
    // routine squad screen with no confirmation and no way back. (PT-307)
    if (await localStore.getToken(playerId)) throw apiErr('the bloodline star can only leave via a transfer offer', {}, 409);
    // RELEASING MID-CONTRACT COSTS. Wages are only charged at the rollover, so releasing (or selling) the
    // week before Next Season dodged the entire bill — the squad screen was a way to play the season and
    // then not pay for it. A player with seasons left is paid off for one season's wage. (PT-307)
    const season = getActiveModel().profile.season;
    const left = squadSeasonsLeft(p, season);
    let payoff = 0;
    if (left > 0) {
      payoff = Math.round(squadSeasonWage(overall(p), season));
      const coins = getActiveModel().profile.coins;
      if (coins < payoff) throw apiErr(`he has ${left} season${left > 1 ? 's' : ''} left — paying up his deal costs ${payoff}c`, { need: payoff }, 402);
      await localStore.addCoins(OWNER, -payoff);
    }
    c.club.players = c.club.players.filter((x) => x.id !== playerId);
    // ...and repair the sheet, or the next editor open rebuilds it and the next kickoff COMMITS the wipe
    await localStore.saveClub(OWNER, c.club, reconciled(c.club, c.standingOrders));
    return { ok: true as const, squadSize: c.club.players.length, payoff, coins: getActiveModel().profile.coins };
  },
  developPlayer: async (pid: string, body: { focus: string; age: number }) => {
    await ensureActive();
    const t = await localStore.getToken(pid);
    if (!t) throw apiErr('no such token', {}, 404);
    if (t.state !== 'pro') throw apiErr('not an active pro', {}, 409);
    const age = Math.max(18, Math.min(42, Math.floor(Number(body?.age) || 27)));
    const focus = String(body?.focus ?? '');
    const attrs = JSON.parse(t.attrs_json ?? '{}') as Record<string, number>;
    // THE STAR NOW DEVELOPS ON THE SAME MODEL AS HIS OWN SQUAD — which is where he should always have been.
    //
    // This used to bump ONE focused attribute and stamina by a whole point a season. Overall is a mean over
    // fifteen attributes, so +2 across fifteen is about +0.13 overall a year: measured, the star went 8 → 9
    // and stopped. Meanwhile every bought squad player ran through developAttrs, a real growth-toward-
    // ceiling curve driven by the Training facility. The one player the entire game is about was on a
    // weaker development path than the men he plays alongside, and it showed everywhere downstream — a
    // graduate peaks at 8-11, `incomingBid` needs 13, so the "a rival club wants your star" beat had never
    // fired once, and renownBidMult (advertised on the Houses screen) multiplied a bid that never came.
    const genes = JSON.parse(t.genes_json ?? '{}');
    const grown = developAttrs(attrs, genes, age, getActiveModel().facilities.training) as Record<string, number>;
    // The manager's TRAINING FOCUS on top, and it stays a real choice: a deliberate extra push on one
    // attribute, above what the lifecycle gives everyone. Half a point, not a whole one — a point a season
    // compounding on a single stat is how you get a 20-rated passer with nothing else.
    if (focus && grown[focus] != null) grown[focus] = Math.max(1, Math.min(20, Math.round((grown[focus] + 0.5) * 10) / 10));
    for (const k of Object.keys(grown)) attrs[k] = grown[k];
    const player = tokenToPlayer({ ...t, attrs_json: JSON.stringify(attrs) } as Token);
    await localStore.updateToken(pid, { attrs_json: JSON.stringify(attrs), peak_overall: Math.max(t.peak_overall ?? 0, overall(player)) });
    return { ok: true as const, player, overall: overall(player) };
  },
  hireStaff: async (staffId: string, alreadyHired: string[] = []) => {
    await ensureActive();
    const cost = STAFF_COSTS[staffId];
    if (cost == null) throw apiErr('unknown staff');
    // The UI hides the button once he is hired, but a double click races it and the facade charged again
    // without a murmur. The roster lives in MgrState (localStorage) so the facade cannot see it on its own
    // — the caller passes it, which is weaker than owning the state but closes the door that costs coins.
    if (alreadyHired.includes(staffId)) throw apiErr('already on the payroll', {}, 409);
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
    if (t.career_seed == null) await localStore.updateToken(pid, { career_seed: careerSeedFor(t.id, t.generation, getActiveSlotId() ?? OWNER), agent_id: agentId ?? null, track: trackFor(t.role ?? 'MF'), career_actions: '[]', career_action_count: 0 });
    // TAKING HIM ON IS WHAT MAKES A BRANCH THE LINE. If the player chose a brother or a cousin, this is the
    // moment the trunk moves onto him — every candidate is minted as 'sibling' precisely because which one
    // becomes the played line is not decided until here. The brothers he was picked over keep 'sibling',
    // which is what the Family Record draws paler: present, and visibly a road not taken.
    if ((t as any).branch !== 'played') await localStore.updateToken(pid, { branch: 'played' } as any);
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
    const loaded = loadCareer(t);
    // Surface a truncated replay rather than quietly returning a shorter career. The UI can then say what
    // happened instead of showing a 12-year-old where a 25-year-old international used to be.
    return {
      ok: true as const,
      state: careerState(t, loaded, clubName),
      ...(loaded.replay ? { replayIssue: loaded.replay } : {}),
    };
  },
  careerAct: async (pid: string, action: { type: string; cardId: string }) => {
    await ensureActive();
    const t = await localStore.getToken(pid);
    if (!t) throw apiErr('no such token', {}, 404);
    if (t.state !== 'prospect') throw apiErr('not a prospect', {}, 409);
    if (t.career_seed == null) throw apiErr('career not started');
    const c = loadCareer(t);
    assertReplayable(c, t);
    const earningsBefore = c.earnings;
    let narration: string | null = null;
    try {
      if (action.type === 'arc') { narration = fillArcText(c.resolveArc(action.cardId), careerCast((c as any).seed >>> 0, (c as any).familyName).rival); } // story-arc branch: apply + fill {RIVAL} (surname-avoided — PT-602)
      else narration = actWithNarration(c, action as CareerAction);
    } catch (e: any) { throw apiErr(e?.message ?? 'illegal move'); }
    let clubGain = Math.round(Math.max(0, c.earnings - earningsBefore) * CLUB_WAGE_CUT);
    if (action.type === 'lifestyle') clubGain += clubInvestOf(action.cardId);
    let outcome: CareerOutcome | null = null;
    if (action.type === 'play' && c.log.length) {
      const ch = c.log[c.log.length - 1];
      outcome = { fit: ch.fit, bestFit: ch.bestFit, success: ch.success, tags: ch.tags, answeredAsk: ch.fit >= ch.bestFit - 0.05, matchedAsk: ch.matchedAsk };
    }
    // Append to the STORED record, having first established it is a record. This used to spread
    // `JSON.parse(t.career_actions)` directly: with a corrupt payload of `'"corrupt"'` the next move wrote
    // ["c","o","r","r","u","p","t",{...}] — seven fabricated turns, permanently. `assertReplayable` above
    // now rejects that payload before we get here; this is the belt to its braces.
    const stored = parseActions(t.career_actions);
    if (!stored) throw apiErr('this career\'s record could not be read, so it has not been changed', {}, 409);
    const next = [...stored, action];
    await localStore.updateToken(pid, { career_actions: JSON.stringify(next), career_action_count: next.length });
    if (c.finished) {
      const fresh = (await localStore.getToken(pid))!;
      const season = getActiveModel().profile.season;
      const grad = graduatedFields(fresh, c);
      const deal = signContract(season, grad.greed ?? 10, grad.personality ?? undefined);
      await localStore.updateToken(pid, { ...grad, prime_season: season, signed_season: deal.signedSeason, length_seasons: deal.lengthSeasons, staked_since: season });
      const windfall = Math.round((grad.earnings ?? 0) * PRO_SIGNING_SHARE);
      clubGain += windfall;
      if (clubGain > 0) await localStore.addCoins(OWNER, clubGain);
      const epilogue = graduationEpilogue({ name: fresh.name, careerSeed: fresh.career_seed!, castAvoid: (c as any).familyName, personalityId: grad.personality ?? c.personality.id, overall: grad.peak_overall ?? 10, role: grad.role ?? undefined, topTraits: JSON.parse(grad.traits_json ?? '[]') });
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
  /** THE BLOODLINE FOREST — every member of the family, with the edge that makes it a tree.
   *  Used by the Family Record. Returns the played line AND the brothers who were passed over, because a
   *  tree with only the chosen sons on it is a chain with decoration. */
  bloodline: async () => {
    await ensureActive();
    const tokens = getActiveModel().tokens;
    const legs = await localStore.legaciesFor(OWNER).catch(() => [] as any[]);
    const legendBy = new Map<string, any>();
    const legendName = new Map<string, string>();
    for (const l of (legs as any[])) {
      // KEYED BY THE FULL id, generation suffix included. Stripping `:g<gen>` collapsed every generation
      // onto one key, and `legaciesFor` sorts NEWEST FIRST -- so last-write-wins left the FOUNDER's card
      // rendered under his great-grandson's name, permanently, on the one screen the whole dynasty fantasy
      // is displayed. The suffix is deliberate; saveLegacy writes it for exactly this reason.
      try { legendBy.set(String(l.player_id ?? l.playerId ?? ''), JSON.parse(l.card_json ?? l.cardJson ?? '{}')); } catch { /* skip */ }
      legendName.set(String(l.player_id ?? l.playerId ?? ''), String(l.name ?? ''));
    }
    // HONOURS FOLLOW THE MAN ONTO THE TREE. An award won by a bloodline player is part of his record,
    // not just the club's, so the Family Record shows it against him. Squad players still win awards --
    // they simply have no node to hang them on.
    const wonBy = new Map<string, Array<{ kind: string; label: string; season: number; value: number }>>();
    for (const a of await localStore.awardsFor(OWNER, 500)) {
      const list = wonBy.get(a.player_id) ?? [];
      list.push({ kind: a.kind, label: AWARD_LABEL[a.kind as AwardKind] ?? a.kind, season: a.season_number, value: a.value });
      wonBy.set(a.player_id, list);
    }
    // THE FOREBEARS. `succeed()` reworks the played token IN PLACE — same id, generation +1 — so a save
    // four generations deep holds exactly ONE token for the line the player actually played. Built from
    // `tokens` alone the Family Record therefore showed the living star and the brothers he was picked
    // over, and left out his father, his grandfather and the founder: the dynasty was missing from the
    // dynasty screen, and the "founder at the base" layout had nobody to put there.
    //
    // Each retired generation does survive — as the legend snapshot `succeed()` writes under `<id>:g<gen>`
    // — so the men are recoverable; they simply had no node. These are those nodes, chained father to son.
    const ancestors = tokens.flatMap((t) => {
      const gen = t.generation ?? 0;
      const out: any[] = [];
      for (let g = 0; g < gen; g++) {
        const key = `${t.id}:g${g}`;
        const card = legendBy.get(key);
        if (!card) continue; // a generation with no snapshot (a pre-suffix save) simply has no node
        out.push({
          id: key, name: legendName.get(key) || t.name, generation: g,
          awards: wonBy.get(key) ?? [],
          // Chain to the nearest EARLIER generation that actually has a node, so one missing snapshot
          // leaves a gap in the tree rather than breaking the line below it. The FIRST man of a chain is a
          // root only if he is generation 0: when the line switches to a cousin, that cousin's own retired
          // generations start partway up the tree and must still hang off the father he was born to, or
          // the record renders as two unrelated families.
          parentId: out.length ? out[out.length - 1].id : (g === 0 ? null : ((t as any).parent_id ?? null)),
          fatherName: out.length ? out[out.length - 1].name : ((t as any).father_name ?? null),
          branch: 'played', state: 'retired', overall: card.peak ?? card.overall ?? 0,
          personality: null, honours: null, legend: card,
        });
      }
      return out;
    });
    const lastAncestorOf = new Map<string, any>();
    for (const a of ancestors) lastAncestorOf.set(a.id.split(':g')[0], a);
    const ancestorIds = new Set(ancestors.map((a) => a.id));
    // Sons hang off the man of the PREVIOUS generation. A sibling records his father as the bare token id,
    // which now names whoever that line has reached — so a gen-1 brother pointed at his own great-grandson
    // and drew a branch running backwards up the page.
    const forefatherFor = (tokenId: string, generation: number): string | null => {
      const key = `${tokenId}:g${generation - 1}`;
      return ancestorIds.has(key) ? key : null;
    };
    // A forebear inherited his son's stored father id above; that id names a LINE, so resolve it to the man
    // of the generation above him the same way a sibling's does.
    for (const a of ancestors) {
      if (a.parentId && !ancestorIds.has(a.parentId)) a.parentId = forefatherFor(a.parentId, a.generation) ?? a.parentId;
    }
    return {
      nodes: [...ancestors, ...tokens.map((t) => {
        let honours: any = null;
        try { honours = t.career_honours_json ? JSON.parse(t.career_honours_json) : null; } catch { /* none */ }
        return {
          id: t.id, name: t.name, generation: t.generation ?? 0,
          // `succeed()` rewrites the retired token IN PLACE and keeps the same id, so a bare id lookup
          // handed the grandfather's medals to a ten-year-old who has never played -- and the men who
          // actually won them had no node to sit on. Same generation-qualified key as the legend card.
          awards: wonBy.get(`${t.id}:g${t.generation ?? 0}`) ?? wonBy.get(t.id) ?? [],
          // The living man's father is the last ancestor on his own line; a sibling's is the forefather of
          // the generation above him, when that man has a node.
          parentId: ((): string | null => {
            const raw = (t as any).parent_id ?? null;
            const gen = t.generation ?? 0;
            if ((t as any).branch && (t as any).branch !== 'played') return (raw && forefatherFor(raw, gen)) || raw;
            return lastAncestorOf.get(t.id)?.id ?? raw;
          })(),
          // WHOSE SON HE IS. Token.father_name was written at every succession and read by NOTHING — the
          // succession screen's "Dane's boy" caption comes from a transient field on the response, so the
          // persisted column had no reader at all and field_wiring.ts flagged it. The Family Record is
          // where it earns its place: the tree draws lineage as lines, and this says it in words.
          fatherName: (t as any).father_name ?? null,
          branch: (t as any).branch ?? 'played',
          state: t.state, overall: t.peak_overall ?? 0,
          personality: t.personality ?? null,
          // Try the generation-qualified key first, then the bare id for rows written before the
          // suffix existed, so an old save keeps its legend cards.
          honours, legend: legendBy.get(`${t.id}:g${t.generation ?? 0}`) ?? legendBy.get(t.id) ?? null,
        };
      })],
    };
  },
  /** The house's renown, as a bare number, for the places it OPENS DOORS. Recomputed rather than cached:
   *  it is derived from the tokens, and a cached copy is a copy that can be stale or wrong. */
  listSaves: () => listSaves(),

  houses: async () => {
    await ensureActive();
    const model = getActiveModel();
    const members = await membersOf(model);    const mine = houseRenown(members);
    const generations = Math.max(0, ...model.tokens.map((t) => t.generation ?? 0));
    // The same derivation main.ts uses for the league, so the rival families belong to THIS save's world
    // rather than to a second, unrelated one.
    const handle = getActiveSlotId() ?? OWNER;
    const seed = [...handle].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) >>> 0;
    const rivals = rivalStandings(seed, generations);
    const table = [
      ...rivals.map((r) => ({ name: r.house.name, blurb: r.house.blurb, arc: r.house.arc, renown: r.renown, tier: r.tier, latest: r.latest.name, latestPeak: r.latest.peakOverall, you: false })),
      { name: model.profile.name, blurb: 'Your house.', arc: 'yours', renown: mine.renown, tier: mine.tier, latest: mine.greatest?.name ?? '—', latestPeak: 0, you: true },
    ].sort((a, b) => b.renown - a.renown);
    return { mine, table, generations };
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
    // Academy Digs add intake places on top of the Youth academy's — the facility promised 'extra youth
    // intake places' on its card and delivered none.
    const extra = youthPoolBonus(model.facilities.youth) + dormIntakeBonus(model.facilities.dorm ?? 1), youthUp = youthUpgradeChance(model.facilities.youth);
    const pool = generatePool(OWNER, model.profile.season, TIER, extra, youthUp).map((t) => ({ ...t, signed: signedSet.has(t.id) }));
    return { season: model.profile.season, cap: LOANEE_CAP, signedCount: count, pool };
  },
  signTrial: async (index: number) => {
    await ensureActive();
    const model = getActiveModel();
    const seasonId = String(model.profile.season);
    if ((await localStore.countLoanees(OWNER, seasonId)) >= LOANEE_CAP) throw apiErr(`you can sign at most ${LOANEE_CAP} loanees a season`, {}, 409);
    // Academy Digs add intake places on top of the Youth academy's — the facility promised 'extra youth
    // intake places' on its card and delivered none.
    const extra = youthPoolBonus(model.facilities.youth) + dormIntakeBonus(model.facilities.dorm ?? 1), youthUp = youthUpgradeChance(model.facilities.youth);
    const player = trialistAt(OWNER, model.profile.season, index, TIER, extra, youthUp);
    if (!player) throw apiErr('no such trialist', {}, 404);
    const c = await localStore.getClub(OWNER);
    if (!c) throw apiErr('club not found', {}, 404);
    if (c.club.players.some((p) => p.id === player.id)) throw apiErr('already signed', {}, 409);
    // MAX_SQUAD, the same bound `buyPlayer` enforces. LOANEE_CAP limits how many loanees a SEASON,
    // which is a different question from how many players a squad may hold -- so the cap the UI shows
    // the player ("Squad full (max 28)") was enforced on the buy path and nowhere else, and a free
    // walk-up trialist or a scouted loanee walked straight past it.
    if (c.club.players.length >= MAX_SQUAD) throw apiErr(`your squad is full (max ${MAX_SQUAD})`, {}, 409);
    c.club.players.push(player);
    await localStore.saveClub(OWNER, c.club, c.standingOrders);
    await localStore.addLoanee(OWNER, seasonId, player.id);
    return { ok: true as const, player: { name: player.name, role: player.role }, signedCount: await localStore.countLoanees(OWNER, seasonId) };
  },
  /** Bring the inherited squad up to the DIVISION the career earned. The manager's roster is minted at
   *  BASE_QUALITY 6 when the save is first created — before a single career turn is played — and nothing in
   *  the handoff ever touched it, so a star who reached a Continental Final was handed a pub team and was
   *  the best player at his own club by a distance. The tier is already derived from his career (PT-950);
   *  the squad now follows it, so the club he takes over is the club his career built. Keeps the star, his
   *  contracts and anyone already signed — only the untouched founding roster is levelled up. (PT-956) */
  alignSquadToTier: async (tier: number) => {
    await ensureActive();
    const c = await localStore.getClub(OWNER);
    if (!c) throw apiErr('club not found', {}, 404);
    const target = Math.max(4, Math.round(tierStrength(Math.max(1, Math.min(TIERS, tier))) - 1));
    const starIds = new Set(getActiveModel().tokens.map((t) => t.id));
    let lifted = 0;
    c.club.players = c.club.players.map((p, i) => {
      if (starIds.has(p.id) || p.signedSeason != null) return p;   // the star, and anyone you actually signed
      if (overall(p) >= target) return p;                          // already good enough for this level
      lifted++;
      const seed = (((tier * 7919) ^ (i * 104729)) >>> 0);
      return { ...mintSquadPlayer(p.id, p.role, target, seed, p.age ?? 24), name: p.name };
    });
    await localStore.saveClub(OWNER, c.club, c.standingOrders);
    return { ok: true as const, lifted, target };
  },
  facilities: async () => {
    await ensureActive();
    const model = getActiveModel();
    const fac = model.facilities;
    const coins = model.profile.coins;
    const facilities: Facility[] = FACILITY_KEYS.map((key) => {
      const level = (fac as any)[key] as number;
      const cost = upgradeCost(level);
      return { key, ...FACILITY_META[key], level, maxLevel: MAX_LEVEL, effect: effectAt(key, level), nextEffect: level < MAX_LEVEL ? effectAt(key, level + 1) : null, upgradeCost: cost, canAfford: cost != null && coins >= cost, // WEIGHTED, like the bill. The total on this same return object goes through seasonUpkeep, which
        // applies UPKEEP_WEIGHT (women 0.45, community 0.25); these per-card figures did not. A Women's
        // Team at L10 advertised 567c a season and was billed 255c, and the twelve cards summed to 6,804c
        // under a "Season upkeep" header, rendered directly above them, reading 6,067c.
        upkeep: facilityUpkeep(level, UPKEEP_WEIGHT[key] ?? 1),
        nextUpkeep: level < MAX_LEVEL ? facilityUpkeep(level + 1, UPKEEP_WEIGHT[key] ?? 1) : null };
    });
    return { coins, facilities, upkeep: seasonUpkeep(fac) };
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
  /** Scale a facility back a level and recover part of what it cost — the player's own lever against a
   *  bill they cannot pay. Refuses at level 1: there is nothing below the neutral baseline. */
  mothballFacility: async (key: string) => {
    await ensureActive();
    const model = getActiveModel();
    if (!FACILITY_KEYS.includes(key as any)) throw apiErr('unknown facility', {}, 400);
    const level = facLevel(model.facilities, key as any);
    if (level <= 1) throw apiErr('already at its lowest', {}, 409);
    const refund = mothballRefund(level);
    await localStore.setFacilityLevel(OWNER, key, level - 1);
    if (refund > 0) await localStore.addCoins(OWNER, refund);
    return { ok: true as const, key, level: level - 1, refund, coins: getActiveModel().profile.coins };
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
      ...previewOdds(d, TIER, hqMult, fac.scouting),
    }));
    return {
      season: model.profile.season, tier: TIER, tripsPerSeason, tripsUsed: count,
      tripsLeft: Math.max(0, tripsPerSeason - count), loaneeCap: LOANEE_CAP, loaneeCount, coins: model.profile.coins,
      destinations, missions: trips.map((m) => missionView(m, matchesPlayed())),
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
    // REFUSE BEFORE TAKING THE MONEY. The cap was enforced at SIGNING and nowhere else, while the trip
    // budget is far larger than it: 3 + scoutExtraTrips(MAX_LEVEL) = 7 paid trips a season against
    // LOANEE_CAP = 3, and the 3-11 FREE walk-up trialists compete for the same three slots through the same
    // counter. So a player who signed three free trialists could pay for all seven trips — 64 coins each at
    // a maxed HQ — and every one of them was guaranteed dead money, refused at the end by a rule nothing
    // had mentioned at dispatch. Worse, section 51's roll happens HERE, so the save already contained the
    // prospect at the moment the fee was taken: the game charged for a sealed result its own rules would
    // then refuse to hand over.
    if ((await localStore.countLoanees(OWNER, seasonId)) >= LOANEE_CAP) {
      throw apiErr(`your ${LOANEE_CAP} loanee places are already filled this season — a scouting trip could not bring anyone back`, {}, 409);
    }
    const cost = Math.round(dest.cost * (1 - scoutCostDiscount(fac.scouting)));
    if (model.profile.coins < cost) throw apiErr(`not enough coins — ${dest.name} costs ${cost}`, {}, 409);
    await localStore.addCoins(OWNER, -cost);
    const id = crypto.randomUUID();
    const outcome = rollMission(id, dest, TIER, scoutHitMult(fac.scouting), fac.scouting);
    const now = Date.now();
    const row: MissionRow = {
      id, account_id: OWNER, season_id: seasonId, destination: dest.id,
      dispatched_at: now, ready_at: matchesPlayed() + travelMatchdays(dest),
      found: outcome.found ? 1 : 0, player_json: outcome.player ? JSON.stringify(outcome.player) : null,
      band: outcome.band, status: 'travelling',
    };
    await localStore.createMission(row);
    return { ok: true as const, mission: missionView(row, matchesPlayed()), coins: getActiveModel().profile.coins };
  },
  signMission: async (id: string) => {
    await ensureActive();
    const model = getActiveModel();
    const seasonId = String(model.profile.season);
    const m = await localStore.missionById(id);
    if (!m) throw apiErr('no such trip', {}, 404);
    if (m.status === 'signed') throw apiErr('already signed', {}, 409);
    if (m.ready_at <= LEGACY_TIMESTAMP && matchesPlayed() < m.ready_at) {
      throw apiErr(`the scout is still travelling — ${m.ready_at - matchesPlayed()} more matchday(s)`, {}, 409);
    }
    if (!m.found || !m.player_json) throw apiErr('that trip came back empty-handed', {}, 409);
    if ((await localStore.countLoanees(OWNER, seasonId)) >= LOANEE_CAP) throw apiErr(`you can field at most ${LOANEE_CAP} loanees a season`, {}, 409);
    const player = JSON.parse(m.player_json) as Player;
    const c = await localStore.getClub(OWNER);
    if (!c) throw apiErr('club not found', {}, 404);
    // MAX_SQUAD, the same bound `buyPlayer` enforces. LOANEE_CAP limits how many loanees a SEASON,
    // which is a different question from how many players a squad may hold -- so the cap the UI shows
    // the player ("Squad full (max 28)") was enforced on the buy path and nowhere else, and a free
    // walk-up trialist or a scouted loanee walked straight past it.
    if (c.club.players.length >= MAX_SQUAD) throw apiErr(`your squad is full (max ${MAX_SQUAD})`, {}, 409);
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
  /** Record one finished match into the season's per-player stat table.
   *
   *  THE LAST WIRE IN A FOUR-PIECE CHAIN THAT WAS NEVER CONNECTED. `deriveMatchStats` turns an event
   *  stream into per-player rows, `bumpPlayerStats` accumulates them, `seasonPlayerStats` reads them back
   *  and `SaveModel.playerStats` persists them — four pieces, all built, all hardened, all tested, and
   *  none of them ever calling another. `deriveMatchStats`' only importer was its own QA harness.
   *
   *  Only the manager's own side is recorded: opponents are regenerated per fixture from a seed and their
   *  ids do not survive the match, so accumulating them would grow the save with rows nothing can read. */
  recordMatchStats: async (body: { rows: MatchPlayerStat[] }) => {
    await ensureActive();
    const seasonId = String(getActiveModel().profile.season);
    for (const r of body.rows ?? []) {
      if (!r?.id) continue;
      await localStore.bumpPlayerStats(seasonId, OWNER, r.id, r.name,
        { goals: r.goals, assists: r.assists, apps: r.apps, potm: r.potm });
    }
    return { ok: true as const };
  },
  /** Every honour won across the dynasty, newest first, with display labels resolved. */
  awards: async () => {
    await ensureActive();
    const rows = await localStore.awardsFor(OWNER, 200);
    return { awards: rows.map((a) => ({ ...a, label: AWARD_LABEL[a.kind as AwardKind] ?? a.kind })) };
  },
  /** This season's per-player totals for the manager's squad. */
  seasonStats: async () => {
    await ensureActive();
    const seasonId = String(getActiveModel().profile.season);
    return { season: getActiveModel().profile.season, stats: await localStore.seasonPlayerStats(seasonId, [OWNER]) };
  },
  scoutTiers: async () => ({ opp: TIER, player: TIER, nft: { address: '', chainId: 0, enabled: false } }),
};
