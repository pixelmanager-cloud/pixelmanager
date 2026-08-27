// The UNIFIED, fixed-supply NFT. One persistent token id flows through the whole lifecycle — prospect
// (develop 10→25 in the Career game) → pro (play 25→40 in the manager game) → retired → reborn (→ a new
// generation as a prospect) — the SAME token, state flips, never minted anew. This module is the single
// home for every transition, replacing the old prospects/contracts/lifecycle/achievements split.
import {
  overall, contractView, signContract, contractLength, legacyCard, legacyBoost, inheritGenes, rollGenes, graduate,
  Career, TOTAL_TURNS, prospectValuation, deriveStats, eligibleTraits, AGENTS, AGE_BANDS, moraleEffects, narratePlay, narrateLifeEvent, scenarioStory, chapterRecap, narrateCoach, narrateDraft, narrateOffer, careerCast, bandAt, cardName, CARD_DESC, LIFE_LABEL,
  type Player, type Track, type PlayerAchievements, type Genes, type CareerPlayerAttrs, type LifeKind,
} from '@fm/shared';
import type { Token, Store } from './store.js';
import { clubSeason, squadRole, firstTeamReady, homeNation, nationalFixture, computeOffPitch } from '@fm/shared';

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

/** Bank a match's individual output onto an NFT token (career goals/assists/POTM — permanent, tradable). */
export async function bumpTokenStats(db: Store, tokenId: string, d: { goals?: number; assists?: number; potm?: number }): Promise<void> {
  const t = await db.getToken(tokenId);
  if (!t) return;
  await db.updateToken(tokenId, {
    ach_goals: t.ach_goals + (d.goals ?? 0),
    ach_assists: t.ach_assists + (d.assists ?? 0),
    ach_potm: t.ach_potm + (d.potm ?? 0),
  });
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
export interface TokenContract { id: string; age: number; available: boolean; seasonsLeft: number; lengthSeasons: number; extendCost: number; sellValue: number; stakedSeasons: number; staked: boolean; morale: number; moraleLabel: string; retired?: boolean; careerGoals?: number; careerAssists?: number; careerPotm?: number; careerApps?: number }
export function tokenContract(t: Token, season: number): TokenContract {
  const age = ageOf(t.prime_season ?? season, season);
  const me = moraleEffects(t.morale ?? 65);
  const career = { careerGoals: t.ach_goals ?? 0, careerAssists: t.ach_assists ?? 0, careerPotm: t.ach_potm ?? 0, careerApps: t.ach_apps ?? 0 };
  if (t.state === 'retired') return { id: t.id, age, available: false, seasonsLeft: 0, lengthSeasons: 0, extendCost: 0, sellValue: 0, stakedSeasons: 0, staked: false, morale: t.morale ?? 65, moraleLabel: me.label, retired: true, ...career };
  const isStaked = t.staked_since != null;                       // must be STAKED to be selectable
  const contract = t.signed_season != null ? { signedSeason: t.signed_season, lengthSeasons: t.length_seasons ?? 3 } : null;
  const stakedSeasons = isStaked ? Math.max(0, season - t.staked_since!) : 0;
  const v = contractView(overall(tokenToPlayer(t)), age, t.greed ?? 10, t.marketability ?? 10, t.personality ?? undefined, contract, season, t.earnings ?? 0, stakedSeasons);
  // morale bends the numbers: an unhappy player holds out for more to re-sign and sells for less
  return { id: t.id, age, available: v.available && isStaked, seasonsLeft: v.seasonsLeft, lengthSeasons: v.lengthSeasons, extendCost: Math.round(v.extendCost * me.extendMult), sellValue: Math.round(v.sellValue * me.sellMult), stakedSeasons, staked: isStaked, morale: t.morale ?? 65, moraleLabel: me.label, ...career };
}

// ── career (prospect state) — the breeder card game ──
export type CareerAction = { type: 'play' | 'draft' | 'coach' | 'offer' | 'focus' | 'lifestyle'; cardId: string };
export function applyAction(c: Career, a: CareerAction, tolerant = false) {
  if (a.type === 'draft') c.draft(a.cardId, tolerant);
  else if (a.type === 'coach') c.appointCoach(a.cardId, tolerant);
  else if (a.type === 'offer') c.resolveOffer(a.cardId);
  else if (a.type === 'focus') c.chooseFocus(a.cardId, tolerant);
  else if (a.type === 'lifestyle') c.buyLifestyle(a.cardId, tolerant);
  else c.play(a.cardId, tolerant);
}
export function loadCareer(t: Token): Career {
  const c = new Career(t.career_seed!, (t.track as Track) ?? 'outfield', t.agent_id ?? undefined);
  // REPLAY is tolerant: content added since a career started can't brick it (a drifted card/coach
  // degrades to a best-fit fallback). A structural change (e.g. new age stages that move the chapter
  // boundaries) can still desync an action from its phase — rather than 500, stop replaying at that
  // point and resume from the last consistent state.
  const actions = JSON.parse(t.career_actions ?? '[]') as CareerAction[];
  for (const a of actions) {
    try { applyAction(c, a, true); }
    catch { break; }
  }
  return c;
}
/** Milestone this beat represents, detected from career state BEFORE the play is applied. */
function careerMilestone(c: Career): string | null {
  if (c.turn === 0) return 'debut';
  if (c.scenario.stakes === 3 && !c.log.some((l) => l.stakes >= 3)) return 'cup_final';
  return null;
}
/** Apply an action and return an immersive narration of the moment (play, or a coach/draft/offer choice). */
export function actWithNarration(c: Career, a: CareerAction): string | null {
  const baseCtx = { age: c.age, chapter: c.chapter, stakes: 1 as 1 | 2 | 3, personalityId: c.personality.id, seasonEventId: c.seasonEvent?.id ?? null, careerSeed: (c as any).seed >>> 0, milestone: null as string | null, seed: (((c as any).seed >>> 0) + c.turn * 2654435761) >>> 0 };
  if (a.type === 'play') {
    const ctx = { ...baseCtx, stakes: c.scenario.stakes, milestone: careerMilestone(c) };
    const lifeKind = c.scenario.life; // capture BEFORE applying — play() advances to the NEXT scenario
    applyAction(c, a);
    const choice = c.log[c.log.length - 1];
    return lifeKind ? narrateLifeEvent(lifeKind, cardName(a.cardId), choice.success, ctx) : narratePlay(cardName(a.cardId), choice.tags, choice.success, ctx);
  }
  // coach / draft / offer — read the chosen item from the current phase BEFORE applying
  const st = c.current() as any;
  let narr: string | null = null;
  if (a.type === 'coach') { const ch = (st.coaches ?? []).find((x: any) => x.id === a.cardId); if (ch) narr = narrateCoach(ch.name, ch.kind, ch.specialty ?? [], baseCtx); }
  else if (a.type === 'draft') { const cd = (st.options ?? []).find((x: any) => x.id === a.cardId); if (cd) narr = narrateDraft(cd.name, cd.tags ?? [], baseCtx); }
  else if (a.type === 'offer') { const of = (st.offers ?? []).find((x: any) => x.id === a.cardId); if (of) narr = narrateOffer(of.name, of, baseCtx); }
  else if (a.type === 'focus') { const fo = (st.focus ?? []).find((x: any) => x.id === a.cardId); if (fo) narr = `${fo.icon} ${fo.desc}`; }
  else if (a.type === 'lifestyle') { const li = (st.lifestyle ?? []).find((x: any) => x.id === a.cardId); if (li) narr = `${li.icon} ${li.blurb}`; }
  applyAction(c, a);
  return narr;
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

// MATCHDAY CONTEXT: gives a match-kind moment a real scoreboard (opponent, scoreline, minute,
// competition) so it reads like a game, not a generic prompt. Presentational + deterministic (hashed
// from seed+turn, no rng) — the engine, graduation and replay are untouched.
const OPPONENTS = ['Riverside Rovers', 'Ashcombe Town', 'Kingsford United', 'Dockside FC', 'Marlow Athletic', 'Hallby City', 'Fenwick Rangers', 'Stonebridge', 'Portland Vale', 'Oakfield United', 'Brightmoor', 'Cranleigh Town', 'Whitlow Wanderers', 'Eastgate FC', 'Redhaven', 'Millbrook County'];
function matchContext(seed: number, turn: number, stakes: number, big: string | null, clubName?: string | null) {
  const h0 = ((seed >>> 0) ^ Math.imul(turn + 7, 2246822519)) >>> 0;
  const pick = (n: number, mod: number) => ((h0 >>> (n & 15)) ^ (h0 >>> ((n + 5) & 15))) % mod;
  // the bloodline player plays FOR your club — so the opponent is any club in the league but yours.
  const pool = clubName ? OPPONENTS.filter((o) => o !== clubName) : OPPONENTS;
  const opponent = pool[h0 % pool.length];
  const home = (pick(1, 2) === 0);
  // close scorelines carry the most drama — weight toward level / a goal in it
  const SCORES = ['0-0', '1-1', '0-1', '1-0', '2-2', '1-2', '2-1', '2-2'];
  const score = SCORES[pick(3, SCORES.length)];
  const minute = Math.min(90, (stakes >= 3 ? 68 : stakes >= 2 ? 52 : 26) + pick(7, 22));
  // competition line: the occasion for big games, otherwise a league round
  const comp = big ?? (stakes >= 2 ? 'a cup tie' : `Matchday ${1 + (turn % 38)}`);
  return { opponent, home, score, minute, comp, club: clubName ?? null };
}

// LEGACY PRESSURE: an heir of a club LEGEND (high inherited pedigree) carries the weight of the family
// name. When his form dips, the fanbase's expectations turn to pressure — a re-skinned moment about living
// in the shadow. Presentational (deterministic, sim-safe); handling it well silences the doubters.
const LEGEND_PEDIGREE = 0.6;   // pedigree at/above this ⇒ the father was a revered club great (see legacyBoost)
const POOR_FORM = 0.42;        // recent avg success below this ⇒ he's struggling and the crowd notices
function legacyPressureStory(surname: string, seed: number): string {
  const lines = [
    `The name on his back is ${surname} — and this crowd remembers what that used to mean. A run of poor games has the terraces restless; every misplaced pass draws a groan. “He’s no ${surname},” someone jeers.`,
    `They expected another ${surname}. Right now they’ve got a kid buckling under the weight of it — the boos aren’t loud yet, but they’re there, and he can hear every single one.`,
    `Being a ${surname} opened every door. Today it feels like a target on his back: the phone-ins have started, the pundits are circling — is the boy simply not good enough to carry the name?`,
    `His father is a banner on the terrace. The son is one mistake from the same crowd turning on him. This is the moment that decides whether the name lifts him or buries him.`,
    `“And of course, the great ${surname}’s son,” the commentator sighs, “who has been a shadow of the father so far.” He hears it in his head every time he gets the ball.`,
  ];
  return lines[seed % lines.length];
}

export function careerState(t: Token, c: Career, clubName?: string | null, clubLevel = 0) {
  const st = c.current() as any;
  const recentForm = (() => { const r = c.log.slice(-6); return r.length ? r.reduce((s, e) => s + e.success, 0) / r.length : 0.5; })();
  // STORY MODE: describe the situation + what each card would do
  if (st.phase === 'play' && st.scenario) {
    const demand = st.scenario.demand as Record<string, number>;
    const topTag = Object.keys(demand).sort((a, b) => (demand[b] ?? 0) - (demand[a] ?? 0))[0] ?? 'teamwork';
    let moment = st.scenario.stakes >= 2 ? String(st.scenario.label).replace(/^★\s*/, '') : null;
    let kind = String(st.scenario.kind);
    // LEGACY PRESSURE (checked first): a struggling heir of a legend faces the weight of the name.
    const surname = t.name.trim().split(/\s+/).slice(1).join(' ') || t.name;
    const heirOfLegend = t.generation > 0 && t.pedigree >= LEGEND_PEDIGREE;
    const pressureGate = ((((c as any).seed >>> 0) ^ Math.imul(c.turn + 3, 40503)) >>> 0) % 100;
    let legacyPressure = false;
    if (heirOfLegend && recentForm < POOR_FORM && (kind === 'social' || kind === 'match') && c.age >= 15 && pressureGate < 55) {
      legacyPressure = true;
      st.lifeEvent = 'the weight of the name';
      st.momentKind = 'life';
      st.story = legacyPressureStory(surname, (((c as any).seed >>> 0) + c.turn * 40503) >>> 0);
      moment = null;
    }
    // LIFE EVENTS: a REAL engine mechanic now (shared/src/career.ts — `Scenario.life`, chosen by a pure
    // hash of seed+turn, never drawn from the rng() stream). Each of the 14 kinds carries its own good/bad
    // meter+earnings consequence (LIFE_CONSEQUENCE), applied when the card resolves. Here we just SURFACE
    // it: the label + story text, and — once it resolves — how it actually went (c.lastLifeEvent).
    const lifeKind: LifeKind | null = st.scenario.life ?? null;
    if (!legacyPressure && lifeKind) {
      kind = lifeKind;
      st.scenario = { ...st.scenario, kind, label: LIFE_LABEL[lifeKind] };
      st.lifeEvent = lifeKind;
      moment = null;
    }
    if (!legacyPressure) {
      st.story = scenarioStory(kind, topTag, moment, { seed: (((c as any).seed >>> 0) + c.turn * 40503) >>> 0, age: c.age, chapter: c.chapter, seasonEventId: c.seasonEvent?.id ?? null, careerSeed: (c as any).seed >>> 0 });
      st.momentKind = kind === 'match' ? 'match' : (st.lifeEvent || kind === 'social') ? 'life' : 'training';
      if (kind === 'match') st.matchCtx = matchContext((c as any).seed >>> 0, c.turn, st.scenario.stakes, moment, clubName);
    }
    st.hand = withDesc(st.hand);
  }
  if (st.options) st.options = withDesc(st.options); // draft cards get their "what he does" too
  const prof = careerProfile(t, c);
  // CHAPTER RECAP: at an age-chapter boundary, a short "the story so far" beat about the chapter just closed
  const prevChapter = c.turn > 0 ? bandAt(c.turn - 1).band.name : null;
  if (prevChapter && prevChapter !== c.chapter && !c.finished) {
    st.recap = chapterRecap({ chapter: prevChapter, nextChapter: c.chapter, age: c.age, careerSeed: (c as any).seed >>> 0, personalityId: c.personality.id, seasonEventId: c.seasonEvent?.id ?? null });
    // HANDOFF: if he just completed a full season as a first-team REGULAR (Regular starter+), the game is
    // ready to switch to manager mode — you take the reins with him as your star. Offered once, at the boundary.
    const prevBand = bandAt(c.turn - 1).index;
    const prevRole = squadRole(prevBand, prof.currentOverall);
    if (clubName && firstTeamReady(prevBand, prof.currentOverall, clubLevel) && prevRole.apps >= 11) {
      st.handoff = { season: prevChapter, apps: prevRole.apps, status: prevRole.status, overall: prof.currentOverall };
    }
  }
  // CLUB SEASON: from the senior stages on (Breakthrough+, ~age 19), the player's club competes in a small
  // simulated league. His league strength = his overall + recent form, so a strong career season lifts the
  // club up the table. Deterministic (seeded from the career + stage); youth stages have no senior league.
  let clubSeasonData: (ReturnType<typeof clubSeason> & { apps: number; status: string }) | null = null;
  const bandIdx = bandAt(Math.min(c.turn, TOTAL_TURNS - 1)).index;
  // NOT a fixed age: he gets a senior club season once he's broken into the first team — a prodigy early,
  // a late developer later, and a higher-level club is harder to break into (see firstTeamReady).
  if (clubName && firstTeamReady(bandIdx, prof.currentOverall, clubLevel)) {
    const strength = prof.currentOverall + (recentForm - 0.5) * 6; // his ability + current form
    const { share, apps, status } = squadRole(bandIdx, prof.currentOverall); // how much he features this season
    const seasonSeed = (((c as any).seed >>> 0) ^ Math.imul(bandIdx + 1, 2654435761)) >>> 0;
    clubSeasonData = { ...clubSeason(clubName, strength, share, seasonSeed), apps, status };
  }
  // CAREER SCORE — a single headline number that climbs with every good moment (weighted by the stakes).
  // A satisfying meta-number + the replay hook (beat your best run). Presentational (from the log).
  const careerScore = Math.round(c.log.reduce((s, ch) => s + ch.success * 8 * (ch.stakes ?? 1), 0));
  // RIVAL TO CHASE — a named academy rival running his own career alongside yours. His score climbs at a
  // steady seeded rate; you're measured against him, so out-performing him is the motivation. Presentational.
  const cast = careerCast((c as any).seed >>> 0);
  const rivalRate = 6 + ((((c as any).seed >>> 0) >>> 3) % 4); // 6..9 points/turn — competitive
  const rivalScore = Math.round(c.turn * rivalRate);
  const rival = { name: cast.rival, score: rivalScore, lead: careerScore - rivalScore };
  // INTERNATIONAL CALL-UP — perform well at the senior stages and you earn a national call-up + caps: an
  // aspirational ceiling to chase. Presentational, from overall × stage (only the good get capped).
  let international: { capped: boolean; caps: number; nation?: string; lastCap?: ReturnType<typeof nationalFixture> } | null = null;
  if (bandIdx >= 4) {
    const ov = prof.currentOverall;
    const rate = ov >= 15 ? 0.4 : ov >= 13 ? 0.25 : ov >= 11 ? 0.12 : 0;
    const caps = Math.max(0, Math.round((c.turn - 60) * rate));
    // the surname decides the fictional home nation; the most recent call-up is surfaced as a career moment
    const surname = (t.name || '').trim().split(/\s+/).slice(1).join(' ') || t.name || 'Astoria';
    const nation = homeNation(surname);
    const lastCap = caps > 0 ? nationalFixture((c as any).seed >>> 0, caps, nation, ov) : undefined;
    international = { capped: caps > 0, caps, nation, lastCap };
  }
  // SEASON OBJECTIVE — a per-stage target that gives each chapter direction + a reward beat. Seeded per
  // stage, progress read from this stage's log entries. Deterministic; presentational (no engine change).
  let objective: { desc: string; target: number; progress: number; done: boolean } | null = null;
  if (st.phase === 'play' && !c.finished) {
    const bandStart = AGE_BANDS.slice(0, bandIdx).reduce((s, b) => s + b.turns, 0);
    const bandLog = c.log.slice(bandStart, c.turn);
    const band = AGE_BANDS[bandIdx];
    const OBJS = [
      { id: 'strong', test: (ch: any) => ch.success >= 0.68, target: Math.max(2, Math.round(band.turns * 0.35)), label: (n: number) => `Turn in ${n} strong displays this stage` },
      { id: 'big', test: (ch: any) => ch.stakes >= 2 && ch.success >= 0.6, target: 2, label: (n: number) => `Rise to the occasion in ${n} big-game moments` },
      { id: 'reads', test: (ch: any) => ch.fit >= ch.bestFit - 0.05, target: Math.max(3, Math.round(band.turns * 0.3)), label: (n: number) => `Read the game right ${n} times (perfect reads)` },
    ].filter((o) => o.id !== 'big' || band.maxStakes >= 2); // big-game target only where big games happen
    const pick = OBJS[((((c as any).seed >>> 0) ^ Math.imul(bandIdx + 1, 2654435761)) >>> 0) % OBJS.length];
    const progress = Math.min(pick.target, bandLog.filter(pick.test).length);
    objective = { desc: pick.label(pick.target), target: pick.target, progress, done: progress >= pick.target };
  }
  // OFF-PITCH LIFE — fame/image, reputation, endorsement deals, earned signature boots and risky-lifestyle
  // temptations. Senior stages only; fully derived from the log (deterministic, sim-safe — no engine change).
  let offPitch: ReturnType<typeof computeOffPitch> | null = null;
  if (bandIdx >= 4) {
    const tagCounts: Record<string, number> = {};
    for (const l of c.log) for (const tag of (l.tags ?? [])) tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    const bigWins = c.log.filter((l) => (l.stakes ?? 1) >= 2 && l.success >= 0.6).length;
    offPitch = computeOffPitch({
      careerScore, caps: international?.caps ?? 0, seed: (c as any).seed >>> 0, turn: c.turn,
      tags: tagCounts, bigWins, flair: tagCounts.flair ?? 0,
    });
  }
  // LIFE EVENT RESOLUTION: a short "how it went" beat once the last life-event card resolves — surfaced
  // once, right after the moment (read from Career.lastLifeEvent, cleared on the next chapter boundary).
  const lastLife = (c as any).lastLifeEvent as { kind: string; success: number; good: boolean } | null;
  const lastLifeOutcome = lastLife
    ? (lastLife.good ? `That went well — ${LIFE_LABEL[lastLife.kind as keyof typeof LIFE_LABEL]}, handled.` : `That didn't land — ${LIFE_LABEL[lastLife.kind as keyof typeof LIFE_LABEL]} leaves a mark.`)
    : null;
  return {
    prospectId: t.id, name: t.name, generation: t.generation, pedigree: t.pedigree, agentId: t.agent_id, track: t.track,
    turn: c.turn, totalTurns: TOTAL_TURNS, seasonEvent: c.seasonEvent, earnings: c.earnings, energy: c.energy, meters: c.meters, profile: prof, clubSeason: clubSeasonData, careerScore, objective, rival, international, offPitch, kit: t.kit_json ? JSON.parse(t.kit_json) : null, lastLifeOutcome, ...st,
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
  // BLOODLINE: the FAMILY NAME carries down the generations; each heir gets a fresh first name.
  const parts = t.name.trim().split(/\s+/);
  const surname = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
  const heirFirst = FIRST[(seedFrom(`${t.id}:heirname:g${t.generation}`) >>> 0) % FIRST.length];
  return {
    generation: t.generation + 1, state: 'prospect', name: `${heirFirst} ${surname}`,
    genes_json: JSON.stringify(genes), pedigree: boost.pedigree, dev_bonus_json: JSON.stringify(boost.devBonus),
    // clear pro + career + achievement state for the new generation (role kept as a track hint)
    career_seed: null, agent_id: null, track: null, career_actions: null,
    attrs_json: null, traits_json: null, personality: null, greed: null, marketability: null, earnings: null,
    prime_season: null, peak_overall: 0, signed_season: null, length_seasons: null, staked_since: null,
    ach_seasons: 0, ach_apps: 0, ach_league: 0, ach_cup: 0, ach_promotions: 0, ach_tier: 0,
    ach_goals: 0, ach_assists: 0, ach_potm: 0,
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
  const card = legacyCard((t.role as any) ?? 'MF', ovr, Math.max(t.peak_overall, ovr), tokenAch(t));
  const number = t.kit_json ? (JSON.parse(t.kit_json).number ?? null) : null; // squad number, if the manager set one — for number retirement
  return { ...card, number };
}

/** A prospect token's upside — from its (stored) inherited pedigree + physical gene ceilings. */
export const rebornPotential = (t: Token): { pedigree: number; stars: number } => {
  const genes: Genes = JSON.parse(t.genes_json);
  const geneCeil = (genes.pace.ceiling + genes.strength.ceiling + genes.stamina.ceiling) / 3;
  return { pedigree: t.pedigree, stars: clamp(Math.round(geneCeil / 4 + t.pedigree * 1.5), 1, 5) };
};
