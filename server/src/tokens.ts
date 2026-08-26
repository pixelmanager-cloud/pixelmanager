// The UNIFIED, fixed-supply NFT. One persistent token id flows through the whole lifecycle — prospect
// (develop 10→25 in the Career game) → pro (play 25→40 in the manager game) → retired → reborn (→ a new
// generation as a prospect) — the SAME token, state flips, never minted anew. This module is the single
// home for every transition, replacing the old prospects/contracts/lifecycle/achievements split.
import {
  overall, contractView, signContract, contractLength, legacyCard, legacyBoost, inheritGenes, rollGenes, graduate,
  Career, TOTAL_TURNS, prospectValuation, deriveStats, eligibleTraits, AGENTS, moraleEffects, narratePlay, narrateCoach, narrateDraft, narrateOffer, scenarioStory, cardName, cardOf, CARD_DESC,
  type Player, type Track, type PlayerAchievements, type Genes, type CareerPlayerAttrs,
} from '@fm/shared';
import type { Token, Store } from './store.js';

export const SUPPLY_CAP = Number(process.env.SUPPLY_CAP ?? 10000); // fixed total NFTs in the economy
// Lifecycle SINKS (coins now — the seam that becomes a PTEST spend later; see docs/economy-and-web3.md).
// With fixed supply, token demand comes from the ACTIVITY of cycling the set, not from minting more.
export const GENESIS_COST = Number(process.env.GENESIS_COST ?? 300);   // mint a brand-new prospect
export const REBORN_COST = Number(process.env.REBORN_COST ?? 150);     // breed a retiree's next generation
export const MARKET_FEE_PCT = Number(process.env.MARKET_FEE_PCT ?? 5); // % skimmed off every token sale (a burn)
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
function seedFrom(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) || 1; }

const FIRST = ['Leo', 'Sam', 'Rico', 'Milo', 'Kai', 'Noah', 'Enzo', 'Theo', 'Luca', 'Ravi', 'Omar', 'Nils', 'Jude', 'Cole', 'Dane', 'Yuki'];
const LAST = ['Marsh', 'Oakes', 'Vance', 'Cruz', 'Reyes', 'Frost', 'Voss', 'Hale', 'Marin', 'Sato', 'Diaz', 'Kane', 'Wolfe', 'Boyd', 'Rossi', 'Ferro'];
export const nameFor = (seed: number) => `${FIRST[(seed >>> 0) % FIRST.length]} ${LAST[(seed >>> 8) % LAST.length]}`;
export const roleHintOf = (t: Token): string => t.role ?? 'MF';
export const trackFor = (roleHint: string): Track => (roleHint === 'GK' ? 'goalkeeper' : 'outfield');
export const ageOf = (primeSeason: number, season: number) => Math.min(40, Math.max(25, 25 + (season - primeSeason)));
export const careerSeedFor = (id: string, gen: number) => seedFrom(`${id}:career:g${gen}`);
export const agentsList = () => AGENTS.map((a) => ({ id: a.id, name: a.name, desc: a.desc }));

// ── conversions ──
export function tokenToPlayer(t: Token): Player {
  return {
    id: t.id, name: t.name, role: (t.role as any) ?? 'MF', attrs: JSON.parse(t.attrs_json ?? '{}'), anchor: { x: 0, y: 0 },
    traits: JSON.parse(t.traits_json ?? '[]'), personality: t.personality ?? undefined,
    greed: t.greed ?? undefined, marketability: t.marketability ?? undefined, earnings: t.earnings ?? undefined,
  };
}
export function tokenAch(t: Token): PlayerAchievements {
  return { seasons: t.ach_seasons, apps: t.ach_apps, leagueTitles: t.ach_league, cupTitles: t.ach_cup, promotions: t.ach_promotions, highestTierIdx: t.ach_tier };
}

// ── genesis: mint a fresh 10yo prospect (fresh genes, no pedigree). Enforces the fixed supply cap. ──
export async function mintGenesis(db: Store, ownerId: string): Promise<Token> {
  if ((await db.countTokens()) >= SUPPLY_CAP) throw new Error('supply cap reached');
  const n = (await db.countTokens()) + 1;
  const id = `nft:${n}`;
  const seed = seedFrom(id + ':genesis');
  const genes = rollGenes(seed);
  await db.createToken({ id, owner_id: ownerId, generation: 0, state: 'prospect', name: nameFor(seed), genes_json: JSON.stringify(genes), pedigree: 0, dev_bonus_json: '{}' });
  await db.updateToken(id, { role: seedFrom(id + ':gk') % 100 < 12 ? 'GK' : 'MF' }); // track hint (~12% keepers)
  return (await db.getToken(id))!;
}

// ── contract / selection info for a PRO token ──
export interface TokenContract { id: string; age: number; available: boolean; seasonsLeft: number; lengthSeasons: number; extendCost: number; sellValue: number; stakedSeasons: number; staked: boolean; morale: number; moraleLabel: string; retired?: boolean }
export function tokenContract(t: Token, season: number): TokenContract {
  const age = ageOf(t.prime_season ?? season, season);
  const me = moraleEffects(t.morale ?? 65);
  if (t.state === 'retired') return { id: t.id, age, available: false, seasonsLeft: 0, lengthSeasons: 0, extendCost: 0, sellValue: 0, stakedSeasons: 0, staked: false, morale: t.morale ?? 65, moraleLabel: me.label, retired: true };
  const isStaked = t.staked_since != null;                       // must be STAKED to be selectable
  const contract = t.signed_season != null ? { signedSeason: t.signed_season, lengthSeasons: t.length_seasons ?? 3 } : null;
  const stakedSeasons = isStaked ? Math.max(0, season - t.staked_since!) : 0;
  const v = contractView(overall(tokenToPlayer(t)), age, t.greed ?? 10, t.marketability ?? 10, t.personality ?? undefined, contract, season, t.earnings ?? 0, stakedSeasons);
  // morale bends the numbers: an unhappy player holds out for more to re-sign and sells for less
  return { id: t.id, age, available: v.available && isStaked, seasonsLeft: v.seasonsLeft, lengthSeasons: v.lengthSeasons, extendCost: Math.round(v.extendCost * me.extendMult), sellValue: Math.round(v.sellValue * me.sellMult), stakedSeasons, staked: isStaked, morale: t.morale ?? 65, moraleLabel: me.label };
}

// ── career (prospect state) — the breeder card game ──
export type CareerAction = { type: 'play' | 'draft' | 'coach' | 'offer'; cardId: string };
export function applyAction(c: Career, a: CareerAction) {
  if (a.type === 'draft') c.draft(a.cardId);
  else if (a.type === 'coach') c.appointCoach(a.cardId);
  else if (a.type === 'offer') c.resolveOffer(a.cardId);
  else c.play(a.cardId);
}
export function loadCareer(t: Token): Career {
  const c = new Career(t.career_seed!, (t.track as Track) ?? 'outfield', t.agent_id ?? undefined);
  for (const a of JSON.parse(t.career_actions ?? '[]') as CareerAction[]) applyAction(c, a);
  return c;
}
// Seed each beat off (career seed, turn, action-type salt, card id) so every off-pitch choice reads
// differently yet replays identically. Salts keep the offer/coach/draft beats of one boundary distinct.
function narrateSeed(c: Career, salt: number, cardId: string): number {
  let h = ((c as any).seed >>> 0) ^ salt;
  h = (h + c.turn * 2654435761) >>> 0;
  for (let i = 0; i < cardId.length; i++) { h ^= cardId.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function ctxFor(c: Career, seed: number) {
  return { age: c.age, chapter: c.chapter, stakes: c.scenario?.stakes ?? 1, personalityId: c.personality.id, seasonEventId: c.seasonEvent?.id ?? null, seed };
}

/** Apply an action and return an immersive narration of the moment (play, coach, draft, or offer). */
export function actWithNarration(c: Career, a: CareerAction): string | null {
  if (a.type === 'coach') {
    applyAction(c, a);
    return c.coach ? narrateCoach(c.coach.name, c.coach.kind, c.coach.specialty, ctxFor(c, narrateSeed(c, 0x2222, a.cardId))) : null;
  }
  if (a.type === 'draft') {
    const card = cardOf(a.cardId);
    applyAction(c, a);
    return card ? narrateDraft(card.name, card.tags, card.rarity, ctxFor(c, narrateSeed(c, 0x3333, a.cardId))) : null;
  }
  if (a.type === 'offer') {
    const offer = c.pendingOffer?.find((o) => o.id === a.cardId) ?? null;   // capture before it's consumed
    applyAction(c, a);
    return offer ? narrateOffer(offer.name, { greed: offer.greed, earn: offer.earn, market: offer.market, form: offer.form }, ctxFor(c, narrateSeed(c, 0x1111, a.cardId))) : null;
  }
  const ctx = ctxFor(c, (((c as any).seed >>> 0) + c.turn * 2654435761) >>> 0);
  applyAction(c, a);
  const choice = c.log[c.log.length - 1];
  return narratePlay(cardName(a.cardId), choice.tags, choice.success, ctx);
}
export function careerProfile(t: Token, c: Career) {
  const genes = JSON.parse(t.genes_json);
  const attrs = deriveStats(c.log, (c as any).seed, genes);
  const val = prospectValuation(c, genes);
  return {
    role: val.role, currentOverall: val.currentOverall, potential: val.potential, stars: val.stars, physicalCeiling: val.physicalCeiling, attrs,
    personality: { id: c.personality.id, name: c.personality.name, desc: c.personality.desc },
    agent: c.agent ? c.agent.name : null, coach: c.coach ? c.coach.name : null, earnings: c.earnings,
    traitsForming: eligibleTraits(attrs, c.log).map((tt) => tt.name),
  };
}
const withDesc = (cards: any[]) => cards?.map((c) => ({ ...c, desc: CARD_DESC[c.id] ?? '' }));
export function careerState(t: Token, c: Career) {
  const st = c.current() as any;
  // STORY MODE: describe the situation + what each card would do
  if (st.phase === 'play' && st.scenario) {
    const demand = st.scenario.demand as Record<string, number>;
    const topTag = Object.keys(demand).sort((a, b) => (demand[b] ?? 0) - (demand[a] ?? 0))[0] ?? 'teamwork';
    const moment = st.scenario.stakes >= 2 ? String(st.scenario.label).replace(/^★\s*/, '') : null;
    st.story = scenarioStory(st.scenario.kind, topTag, moment, ((c as any).seed >>> 0) + c.turn * 40503);
    st.hand = withDesc(st.hand);
  }
  if (st.options) st.options = withDesc(st.options); // draft cards get their "what he does" too
  return {
    prospectId: t.id, name: t.name, generation: t.generation, pedigree: t.pedigree, agentId: t.agent_id, track: t.track,
    turn: c.turn, totalTurns: TOTAL_TURNS, seasonEvent: c.seasonEvent, earnings: c.earnings, profile: careerProfile(t, c), ...st,
  };
}
/** Graduate the finished career → the pro attrs to write onto the SAME token (state → pro). */
export function graduatedFields(t: Token, c: Career): Partial<Token> {
  const genes = JSON.parse(t.genes_json);
  const devBonus = JSON.parse(t.dev_bonus_json ?? '{}');
  const grad = graduate(c.log, t.career_seed!, genes, undefined, { ...c.finContext(), legacyBonus: devBonus });
  return {
    state: 'pro', attrs_json: JSON.stringify(grad.attrs), role: grad.role, traits_json: JSON.stringify(grad.traits),
    personality: grad.personality, greed: grad.greed, marketability: grad.marketability, earnings: grad.earnings, peak_overall: grad.overall,
  };
}

// ── reborn: retired token → a fresh prospect of the NEXT generation (same id), inheriting genes + pedigree ──
export function rebornFields(t: Token): Partial<Token> {
  const boost = legacyBoost(tokenAch(t));
  const parent: CareerPlayerAttrs = JSON.parse(t.attrs_json ?? '{}');
  const band = (s: number) => ({ floor: clamp(s - 6, 1, 15), ceiling: clamp(s + 2, clamp(s - 6, 1, 15) + 3, 20) });
  const parentGenes: Genes = { pace: band(parent.pace ?? 10), strength: band(parent.strength ?? 10), stamina: band(parent.stamina ?? 10) };
  const genes = inheritGenes(parentGenes, seedFrom(`${t.id}:heir:g${t.generation}`), 0.6, boost.ceilingLift);
  const firstName = t.name.split(' ')[0];
  return {
    generation: t.generation + 1, state: 'prospect', name: `${firstName} Jr`,
    genes_json: JSON.stringify(genes), pedigree: boost.pedigree, dev_bonus_json: JSON.stringify(boost.devBonus),
    // clear pro + career + achievement state for the new generation (role kept as a track hint)
    career_seed: null, agent_id: null, track: null, career_actions: null,
    attrs_json: null, traits_json: null, personality: null, greed: null, marketability: null, earnings: null,
    prime_season: null, peak_overall: 0, signed_season: null, length_seasons: null, staked_since: null,
    ach_seasons: 0, ach_apps: 0, ach_league: 0, ach_cup: 0, ach_promotions: 0, ach_tier: 0,
  };
}
/** Token ids that CANNOT be selected this season (lapsed contract or retired) — benched like injuries. */
export async function unavailableTokenIds(db: Store, ownerId: string, season: number): Promise<Set<string>> {
  const out = new Set<string>();
  for (const t of await db.tokensOwnedBy(ownerId)) if (t.state !== 'prospect' && !tokenContract(t, season).available) out.add(t.id);
  return out;
}

/** The retirement legacy card for a retired (or retiring) token. */
export function legendCardOf(t: Token) {
  const ovr = overall(tokenToPlayer(t));
  return legacyCard((t.role as any) ?? 'MF', ovr, Math.max(t.peak_overall, ovr), tokenAch(t));
}

/** A prospect token's upside — from its (stored) inherited pedigree + physical gene ceilings. */
export const rebornPotential = (t: Token): { pedigree: number; stars: number } => {
  const genes: Genes = JSON.parse(t.genes_json);
  const geneCeil = (genes.pace.ceiling + genes.strength.ceiling + genes.stamina.ceiling) / 3;
  return { pedigree: t.pedigree, stars: clamp(Math.round(geneCeil / 4 + t.pedigree * 1.5), 1, 5) };
};
