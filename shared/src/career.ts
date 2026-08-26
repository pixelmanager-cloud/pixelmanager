// Career Sim — Layer 1. A turn-by-turn card game that DEVELOPS a player into a Player NFT.
// Each turn you're dealt a HAND from your deck and face a seeded SCENARIO demanding certain
// playing-style tags; you play one card. How your choices PATTERN out over a career becomes the
// player's stat SHAPE (playstyle); how WELL you played becomes the MAGNITUDE. Fully deterministic
// (seeded, no Date.now/Math.random) so a career is a pure function of (seed, choices) — replayable
// and verifiable on-chain later. See docs/two-layer-architecture.md.

// ── deterministic RNG (mulberry32) ──
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function seedFrom(...parts: Array<string | number>): number {
  let h = 2166136261; const s = parts.join(':');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) || 1;
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ── style tags: the vocabulary linking card-play to stats ──
export type Tag = 'composure' | 'aggression' | 'creativity' | 'teamwork' | 'leadership' | 'stamina' | 'flair' | 'keeping';
export const TAGS: Tag[] = ['composure', 'aggression', 'creativity', 'teamwork', 'leadership', 'stamina', 'flair', 'keeping'];
// outfield play never demands the keeping tag (that's the goalkeeper track's domain)
const OUTFIELD_TAGS: Tag[] = ['composure', 'aggression', 'creativity', 'teamwork', 'leadership', 'stamina', 'flair'];

export type Track = 'outfield' | 'goalkeeper';
export interface SeasonEvent { id: string; name: string; desc: string }
/** A factual look-back at a completed age chapter (for chapter-transition narration). */
export interface ChapterSummary { chapter: string; age: number; avgSuccess: number; bigMoments: number; seasonEvent: SeasonEvent | null }
/** One recorded development decision. A career is fully reconstructable from (seed, track, actions). */
export interface Action { type: 'play' | 'draft' | 'coach' | 'offer'; cardId: string }
/** Everything needed to persist/trade an in-progress prospect (stored off-chain, keyed by tokenId).
 *  Deterministic → the current stats can be re-derived + verified by replaying it. */
export interface CareerSnapshot { seed: number; track: Track; agentId?: string; actions: Action[] }

export type Rarity = 'common' | 'rare' | 'epic';
export interface Card { id: string; name: string; tags: Tag[]; rarity?: Rarity }
export const RARITY_POWER: Record<Rarity, number> = { common: 1, rare: 2, epic: 3 };
export const cardPower = (c: Card) => RARITY_POWER[c.rarity ?? 'common'];
// Differentiated deck: each tag has both PURE (single-tag) and BLEND (dual-tag) cards, so a
// player can specialise cleanly or mix. No tag routes exclusively through another.
export const DECK: Card[] = [
  { id: 'ice-veins',   name: 'Ice in the Veins', tags: ['composure'] },
  { id: 'cool-finish', name: 'Cool Finish',      tags: ['composure', 'flair'] },
  { id: 'read-game',   name: 'Read the Game',    tags: ['composure', 'aggression'] },
  { id: 'crunch',      name: 'Crunching Tackle', tags: ['aggression'] },
  { id: 'last-ditch',  name: 'Last-Ditch Block', tags: ['aggression', 'teamwork'] },
  { id: 'dark-arts',   name: 'Dark Arts',        tags: ['aggression', 'leadership'] },
  { id: 'splitter',    name: 'Defence-Splitter', tags: ['creativity'] },
  { id: 'killer-ball', name: 'Killer Ball',      tags: ['creativity', 'teamwork'] },
  { id: 'no-look',     name: 'No-look Pass',     tags: ['creativity', 'flair'] },
  { id: 'anchor',      name: 'Anchor the Middle', tags: ['teamwork'] },
  { id: 'hold-up',     name: 'Hold-up Play',     tags: ['teamwork', 'composure'] },
  { id: 'captain',     name: "Captain's Speech", tags: ['leadership'] },
  { id: 'rally',       name: 'Rally the Team',   tags: ['leadership', 'stamina'] },
  { id: 'lung-buster', name: 'Lung-buster Run',  tags: ['stamina'] },
  { id: 'box-to-box',  name: 'Box-to-Box',       tags: ['stamina', 'creativity'] },
  { id: 'overlap',     name: 'Overlapping Run',  tags: ['stamina', 'flair'] },
  { id: 'stepover',    name: 'Stepover',         tags: ['flair'] },
  { id: 'mazy',        name: 'Mazy Dribble',     tags: ['flair', 'creativity'], rarity: 'rare' },
  // RARE / EPIC signature cards — drafting one is a big identity commitment (higher power → bigger stat pull)
  { id: 'wand',        name: 'A Wand of a Left Foot', tags: ['creativity', 'flair'], rarity: 'epic' },
  { id: 'poacher',     name: "Poacher's Instinct",    tags: ['composure', 'flair'], rarity: 'epic' },
  { id: 'general',     name: 'Defensive General',     tags: ['aggression', 'composure'], rarity: 'epic' },
  { id: 'engine-epic', name: 'Relentless Engine',     tags: ['stamina', 'teamwork'], rarity: 'epic' },
  { id: 'talisman',    name: 'Talisman',              tags: ['leadership', 'creativity'], rarity: 'epic' },
  { id: 'enforcer',    name: 'The Enforcer',          tags: ['aggression', 'leadership'], rarity: 'rare' },
  // expansion batch — more variety of moments
  { id: 'trivela',     name: 'Trivela',               tags: ['flair', 'creativity'], rarity: 'rare' },
  { id: 'nutmeg',      name: 'Nutmeg',                tags: ['flair'] },
  { id: 'recovery',    name: 'Recovery Sprint',       tags: ['stamina', 'aggression'] },
  { id: 'thru-lines',  name: 'Through the Lines',     tags: ['creativity', 'composure'] },
  { id: 'streetwise',  name: 'Streetwise',            tags: ['aggression', 'composure'] },
  { id: 'trigger',     name: 'Trigger the Press',     tags: ['aggression', 'teamwork'] },
  { id: 'switch',      name: 'Switch the Play',       tags: ['creativity', 'leadership'] },
  { id: 'clutch',      name: 'Clutch Moment',         tags: ['composure', 'leadership'], rarity: 'epic' },
];

// The small deck EVERY outfield career starts with; the rest is drafted between seasons.
const STARTER_IDS = ['ice-veins', 'crunch', 'splitter', 'anchor', 'lung-buster', 'stepover', 'hold-up'];
export const STARTER_DECK: Card[] = DECK.filter((c) => STARTER_IDS.includes(c.id));
export const DRAFT_POOL: Card[] = DECK.filter((c) => !STARTER_IDS.includes(c.id));

// The goalkeeper track's deck: keeping-focused with a few shared mental cards. A GK career draws
// from this instead of the outfield DECK, so `keeping` (and the calm/commanding traits that suit a
// keeper) is what grows.
export const GK_DECK: Card[] = [
  { id: 'shot-stop',   name: 'Shot-Stopper',      tags: ['keeping'] },
  { id: 'point-blank', name: 'Point-Blank Save',  tags: ['keeping', 'composure'] },
  { id: 'one-on-one',  name: 'Smother the 1-on-1', tags: ['keeping', 'aggression'] },
  { id: 'command',     name: 'Command the Area',  tags: ['keeping', 'leadership'] },
  { id: 'claim-cross', name: 'Claim the Cross',   tags: ['keeping', 'composure'] },
  { id: 'sweeper',     name: 'Sweeper-Keeper',    tags: ['keeping', 'stamina'] },
  { id: 'distribution', name: 'Quick Distribution', tags: ['keeping', 'creativity'] },
  { id: 'goal-kick',   name: 'Pinged Goal-Kick',  tags: ['keeping', 'flair'] },
  { id: 'organise',    name: 'Organise the Wall',  tags: ['leadership', 'composure'] },
  { id: 'calm-back',   name: 'Calm it at the Back', tags: ['composure', 'teamwork'] },
  { id: 'penalty-hero', name: 'Penalty Hero',      tags: ['keeping', 'composure'], rarity: 'epic' },
  { id: 'sweeper-elite', name: 'Modern Sweeper',   tags: ['keeping', 'creativity'], rarity: 'rare' },
];
const GK_STARTER_IDS = ['shot-stop', 'claim-cross', 'organise', 'calm-back'];
const GK_STARTER: Card[] = GK_DECK.filter((c) => GK_STARTER_IDS.includes(c.id));
const GK_DRAFT_POOL: Card[] = GK_DECK.filter((c) => !GK_STARTER_IDS.includes(c.id));
/** A card's display name by id (across both decks) — for narration/UI. */
export const cardName = (id: string): string => [...DECK, ...GK_DECK].find((c) => c.id === id)?.name ?? id;

/** What the player actually DOES when a card is played — the story-mode "meaning" of each choice. */
export const CARD_DESC: Record<string, string> = {
  'ice-veins': 'Keep a cool head when it matters most.', 'cool-finish': 'Pick your spot and finish with ice-cold composure.',
  'read-game': 'Read the danger early and step in before it develops.', crunch: 'Fly into a hard, committed tackle to win it back.',
  'last-ditch': 'Throw your body in the way with a desperate block.', 'dark-arts': 'Use the dark arts — a clever foul, a word in the ear — to break up play.',
  splitter: 'Slide a defence-splitting pass through the eye of a needle.', 'killer-ball': 'Pick out the killer ball to release a runner.',
  'no-look': 'Disguise it with a no-look pass to wrong-foot everyone.', anchor: 'Sit in and anchor the midfield, keeping it all ticking.',
  'hold-up': 'Hold the ball up, back to goal, and bring others into play.', captain: "Rally the team with a rousing captain's speech.",
  rally: 'Dig in and drive the team on when legs are tiring.', 'lung-buster': 'Make a lung-busting run from deep to support the attack.',
  'box-to-box': 'Cover every blade of grass, box to box.', overlap: 'Bomb forward on the overlap to stretch the play.',
  stepover: 'Take your man on with a stepover and a burst of pace.', mazy: 'Set off on a mazy dribble, gliding past challenges.',
  wand: 'Produce a moment of pure magic with that wand of a left foot.', poacher: "Ghost in with a poacher's instinct to pounce.",
  general: 'Marshal the defence like a general, organising everything.', 'engine-epic': 'Run and run — a relentless engine that never stops.',
  talisman: 'Drag the team forward on your own, the talisman.', enforcer: "Impose yourself — no one's getting past.",
  trivela: 'Wrap your foot round it with an outrageous trivela.', nutmeg: "Slip it through your marker's legs — nutmeg!",
  recovery: 'Turn and sprint back to snuff out the danger.', 'thru-lines': 'Carry it calmly through the lines, breaking the press.',
  streetwise: 'Do the streetwise thing — buy the foul, kill the tempo.', trigger: 'Trigger the press and hunt the ball down as a unit.',
  switch: 'Switch the play with one sweep of the boot to the free man.', clutch: 'Stand up in the clutch and deliver when it counts.',
  'shot-stop': 'Spring across your goal to make a vital save.', 'point-blank': 'Somehow keep out a point-blank effort.',
  'one-on-one': 'Rush out and smother the one-on-one.', command: 'Come and claim it, commanding your box.',
  'claim-cross': 'Rise to pluck the cross out of the air.', sweeper: 'Sweep up behind the defence like an extra outfielder.',
  distribution: 'Launch a swift counter with sharp distribution.', 'goal-kick': 'Ping a pinpoint goal-kick to start the attack.',
  organise: 'Organise the wall and bark out the orders.', 'calm-back': 'Calm it down at the back — no panic.',
  'penalty-hero': 'Guess right and become the hero from the spot.', 'sweeper-elite': 'Play as a modern sweeper-keeper, starting moves from the back.',
};

// deck-building config
export const OFFER_SIZE = 4;   // cards shown at a between-season draft
export const DRAFT_PICKS = 2;  // how many you add each draft

// ── BACKROOM STAFF: at each age-chapter break you appoint a mentor/coach for the coming chapter.
// A coach amplifies your work in their SPECIALTY — you get better SUCCESS playing cards in those tags,
// so that development compounds. Appoint one that matches your identity to sharpen it, or one that
// shores up a weakness. A strategic layer on top of deck-building.
export interface Coach { id: string; name: string; kind: 'coach' | 'mentor'; desc: string; specialty: Tag[]; bonus: number }
export const COACHES: Coach[] = [
  { id: 'finishing',  name: 'Finishing Coach',   kind: 'coach',  desc: 'Hours drilling the work in front of goal',   specialty: ['composure', 'flair'], bonus: 0.12 },
  { id: 'technical',  name: 'Technical Coach',    kind: 'coach',  desc: 'Endless reps on close control & vision',      specialty: ['creativity', 'flair'], bonus: 0.12 },
  { id: 'defensive',  name: 'Defensive Coach',    kind: 'coach',  desc: 'Drills the dark arts of defending',           specialty: ['aggression', 'teamwork'], bonus: 0.12 },
  { id: 'fitness',    name: 'Fitness Coach',      kind: 'coach',  desc: 'Runs you into the ground — and back',         specialty: ['stamina'], bonus: 0.14 },
  { id: 'mentality',  name: 'Mentality Coach',    kind: 'coach',  desc: 'Builds the mind as much as the body',         specialty: ['composure', 'leadership'], bonus: 0.12 },
  { id: 'veteran',    name: 'Veteran Mentor',     kind: 'mentor', desc: 'A wise old pro takes you under his wing',     specialty: ['composure', 'leadership', 'teamwork'], bonus: 0.1 },
  { id: 'playmaker',  name: 'Playmaker Mentor',   kind: 'mentor', desc: 'A legendary no.10 shows you how to see it',   specialty: ['creativity', 'teamwork'], bonus: 0.12 },
  { id: 'warrior',    name: 'Warrior Mentor',     kind: 'mentor', desc: 'An old-school hard man teaches you to bite',  specialty: ['aggression', 'stamina'], bonus: 0.12 },
  { id: 'gk-coach',   name: 'Goalkeeping Coach',  kind: 'coach',  desc: 'Shot-stopping, handling, commanding the box', specialty: ['keeping'], bonus: 0.14 },
];
export const COACH_OFFER = 3; // choices shown at each appointment

// ── SPORTS AGENTS: chosen when you start a career, an agent shapes your whole trajectory — how much
// EXPOSURE you get (big-stage moments), how good your opportunities are (draft luck), your market
// VALUE, and how GREEDY you turn out (what it'll cost a manager to keep you). A super-agent maximises
// fame and fees but makes you mercenary; a family advisor keeps you loyal and cheap.
export interface Agent { id: string; name: string; desc: string; exposure: number; draftLuck: number; greed: number; valueMod: number }
export const AGENTS: Agent[] = [
  { id: 'ambitious', name: 'Ambitious Agent',  desc: 'Chases the big stage and the big move',        exposure: 1.4,  draftLuck: 1.2,  greed: 3,  valueMod: 1.1 },
  { id: 'loyal',     name: 'Loyal Agent',      desc: 'Keeps you grounded, settled and well-liked',   exposure: 1.0,  draftLuck: 1.0,  greed: -3, valueMod: 1.0 },
  { id: 'super',     name: 'Super-Agent',      desc: 'Elite connections and elite fees — for a cut', exposure: 1.6,  draftLuck: 1.35, greed: 6,  valueMod: 1.25 },
  { id: 'family',    name: 'Family Advisor',   desc: 'A trusted relative — in it for you, not money', exposure: 0.95, draftLuck: 1.0,  greed: -5, valueMod: 0.95 },
];
export const agentById = (id?: string) => AGENTS.find((a) => a.id === id) ?? null;
/** how each temperament tilts greed (nature) — layered on the agent's influence */
const PERSONALITY_GREED: Record<string, number> = { maverick: 3, mercurial: 2, biggame: 1, fragile: 0, workhorse: -1, pro: -2, leader: -2 };

// Manager-side contract economics (contractCost / contractLength / releaseClause / Contract …) live in
// contracts.ts so the Manager game gets them via the barrel without the Layer-1 sim. Re-exported here
// for the career harness's convenience.
export { contractCost, contractLength, releaseClause, breederRevenue, contractExpirySeason, contractActive, contractView, signContract, type Contract, type PlayerContractView } from './contracts.js';

// ── FINANCIAL DECISIONS: at most age-chapter breaks (from the Academy on) an OFFER lands on the table.
// This is the money layer of a player's life — and it MUST trade against the pitch. Chase the money and
// your earnings, fame and greed climb but you lose a step of development that chapter (a distracted,
// unsettled season); stay grounded and you develop keenly, stay cheap, but never cash in. `earn` is a
// coin figure (a signing/deal), `form` a one-chapter success nudge, the rest permanent temperament.
export interface Offer { id: string; name: string; desc: string; earn: number; greed: number; market: number; form: number }
export const OFFERS: Offer[] = [
  { id: 'money',   name: 'Big-Money Move',   desc: 'A rich club abroad triples your wages — but it means uprooting and settling in all over again', earn: 900, greed: 2,  market: 2, form: -0.08 },
  { id: 'brand',   name: 'Boot & Kit Deal',  desc: 'A lucrative sponsorship and a rising profile — and the distractions that come with fame',       earn: 500, greed: 1,  market: 3, form: -0.05 },
  { id: 'develop', name: 'Stay & Develop',   desc: 'Turn the money down, knuckle down at your club — you develop keenly and the fans adore you',    earn: 120, greed: -2, market: 0, form:  0.06 },
];
export const OFFER_CHOICES = 3;
/** Deterministic financial offer set for a chapter (all three archetypes; the player picks their path). */
export function rollOffer(_rng: () => number, _turn: number): Offer[] { return OFFERS; }

/** Seeded coach choices for a track: outfield sees no GK-only coach, GK sees the GK coach + mental ones. */
export function rollCoaches(rng: () => number, track: Track, n = COACH_OFFER): Coach[] {
  const pool = COACHES.filter((c) => (track === 'goalkeeper' ? true : !c.specialty.includes('keeping')));
  const shuffled = [...pool].sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(n, pool.length));
}

// ── scenarios: each moment demands a weighted mix of tags; kind biases the demand ──
// stakes 1 (normal) / 2 (big) / 3 (huge). Big moments are worth MORE (shape you harder) and are
// riskier (more variance) — this is where reputations are made and the Big-Game Player trait is earned.
export interface Scenario { id: string; kind: 'match' | 'social' | 'training'; demand: Partial<Record<Tag, number>>; label: string; stakes: 1 | 2 | 3 }
const KIND_BIAS: Record<Scenario['kind'], Tag[]> = {
  match: TAGS,                                                   // anything can come up in a match
  social: ['leadership', 'composure', 'teamwork'],              // dressing room / media
  training: ['stamina', 'creativity', 'flair', 'aggression'],   // sharpen the tools
};
const KIND_POOL: Scenario['kind'][] = ['match', 'match', 'match', 'social', 'training'];
// goalkeeper moments demand keeping heavily, plus the calm/commanding traits that suit a keeper
const GK_BIAS: Tag[] = ['keeping', 'keeping', 'keeping', 'composure', 'leadership', 'creativity'];
const BIG_MOMENTS = ['Derby Day', 'Cup Quarter-Final', 'Relegation Six-Pointer', 'Live on TV'];
const HUGE_MOMENTS = ['CUP FINAL', 'Title Decider', 'Promotion Play-Off Final'];

/** A seeded scenario. Tag demand comes from the current AGE BAND (age-appropriate); stakes are gated
 *  by the band (no cup finals at grassroots). `demandBias` (a gaffer's demand) leans the demand. */
export function makeScenario(rng: () => number, i: number, track: Track = 'outfield', demandBias?: Tag | null, band?: AgeBand, exposure = 1): Scenario {
  const kind = KIND_POOL[Math.floor(rng() * KIND_POOL.length)];
  const bias = track === 'goalkeeper' ? GK_BIAS : (band ? band.demand : OUTFIELD_TAGS);
  const n = 1 + Math.floor(rng() * Math.min(3, bias.length));
  const pool = [...new Set([...bias].sort(() => rng() - 0.5))].slice(0, n);
  const raw = pool.map(() => 0.3 + rng());
  const demand: Partial<Record<Tag, number>> = {};
  pool.forEach((t, k) => { demand[t] = raw[k]; });
  if (demandBias) demand[demandBias] = (demand[demandBias] ?? 0) + 0.6;  // the gaffer wants more of this
  const sum = Object.values(demand).reduce((a, b) => a + (b ?? 0), 0) || 1;
  for (const t of Object.keys(demand) as Tag[]) demand[t] = (demand[t] ?? 0) / sum;
  const maxStakes = band ? band.maxStakes : 3;
  const r = rng();
  const stakes: 1 | 2 | 3 = maxStakes >= 3 && r < 0.05 * exposure ? 3 : maxStakes >= 2 && r < 0.22 * exposure ? 2 : 1; // an agent's exposure = more big stages
  const moment = stakes === 3 ? HUGE_MOMENTS[Math.floor(rng() * HUGE_MOMENTS.length)]
    : stakes === 2 ? BIG_MOMENTS[Math.floor(rng() * BIG_MOMENTS.length)] : null;
  const label = moment ? `★ ${moment}` : `${kind}: ${Object.keys(demand).join(' / ')}`;
  return { id: `sc${i}`, kind, demand, label, stakes };
}

/** How well a card's tags satisfy a scenario's demand, 0..1. */
export function fit(card: Card, sc: Scenario): number {
  let f = 0;
  for (const t of card.tags) f += sc.demand[t] ?? 0;
  return clamp(f, 0, 1);
}

export interface Choice { cardId: string; tags: Tag[]; power: number; fit: number; bestFit: number; success: number; scenario: string; stakes: number }

// ── career config ──
export const HAND_SIZE = 4;

// A player's DEVELOPMENT is a human life from age 10 → 25, rendered as ~5 age chapters (not a 300-turn
// grind). Scenarios + stakes are age-gated: a 12-year-old plays park football; cup finals only come once
// you're breaking into the first team. A draft + an age-milestone event fires at each chapter boundary.
export const START_AGE = 10, PRO_AGE = 25, RETIRE_AGE = 40;
export interface AgeBand { name: string; from: number; to: number; turns: number; maxStakes: 1 | 2 | 3; demand: Tag[] }
export const AGE_BANDS: AgeBand[] = [
  { name: 'Grassroots',   from: 10, to: 13, turns: 8,  maxStakes: 1, demand: ['flair', 'stamina', 'creativity', 'teamwork'] },
  { name: 'Academy',      from: 14, to: 16, turns: 10, maxStakes: 1, demand: ['flair', 'stamina', 'creativity', 'teamwork', 'composure', 'aggression'] },
  { name: 'Youth Team',   from: 17, to: 19, turns: 12, maxStakes: 2, demand: OUTFIELD_TAGS },
  { name: 'Breakthrough', from: 20, to: 22, turns: 12, maxStakes: 3, demand: OUTFIELD_TAGS },
  { name: 'Establishing', from: 23, to: 25, turns: 12, maxStakes: 3, demand: OUTFIELD_TAGS },
];
export const TOTAL_TURNS = AGE_BANDS.reduce((s, b) => s + b.turns, 0);
// cumulative turn index at which each band ENDS (last band end = TOTAL_TURNS)
const BAND_ENDS = AGE_BANDS.reduce<number[]>((acc, b) => [...acc, (acc[acc.length - 1] ?? 0) + b.turns], []);
/** The band a given development turn falls in, plus the player's age at that turn. */
export function bandAt(turn: number): { index: number; band: AgeBand; age: number } {
  let index = BAND_ENDS.findIndex((end) => turn < end);
  if (index < 0) index = AGE_BANDS.length - 1;
  const band = AGE_BANDS[index];
  const start = index === 0 ? 0 : BAND_ENDS[index - 1];
  const frac = band.turns > 1 ? (turn - start) / (band.turns - 1) : 0;
  return { index, band, age: Math.round(band.from + frac * (band.to - band.from)) };
}

/**
 * A stateful career the client drives one turn at a time. Deterministic given (seed, choices):
 * RNG is consumed in a fixed order (scenario → resolve → draw) regardless of which card is picked,
 * so replaying the same choice ids reproduces the exact same player.
 */
export class Career {
  private rng: () => number;
  private drawPile: Card[] = [];
  private discard: Card[] = [];
  private pool: Card[];              // the cards this career can DRAFT between seasons
  hand: Card[] = [];
  deck: Card[];                      // the player's growing deck (identity)
  scenario!: Scenario;
  turn = 0;
  log: Choice[] = [];
  actions: Action[] = [];           // every play/draft decision — the trade-able, resumable record
  finished = false;
  /** When set, the career is paused for a between-chapter DRAFT: pick DRAFT_PICKS of these to add. */
  pendingDraft: { options: Card[]; picksLeft: number } | null = null;
  /** When set, the career is paused to APPOINT a mentor/coach for the coming chapter. */
  pendingCoaches: Coach[] | null = null;
  coach: Coach | null = null;              // the staff member active this chapter (boosts their specialty)
  /** When set, a FINANCIAL OFFER is on the table (choose your path) before appointing a coach. */
  pendingOffer: Offer[] | null = null;
  earnings = 0;                            // running career earnings (coins) — wages + deals taken
  marketBonus = 0;                         // fame accrued from financial/brand decisions (→ marketability)
  greedBonus = 0;                          // greed accrued from chasing money in-career (→ final greed)
  seriousInjuries = 0;                     // major injuries suffered in development → lasting fragility
  /** The narrative event coloring the current age chapter (a new gaffer, a hot streak, a knock…). */
  seasonEvent: SeasonEvent | null = null;
  private demandBias: Tag | null = null;   // the gaffer's demand this chapter → scenarios lean this tag
  private formBonus = 0;                    // hot streak / slump → success nudge this chapter
  private extraPicks = 0;                   // a breakthrough chapter → +draft picks at the next draft

  readonly personality: Personality;
  readonly agent: Agent | null;            // the sports agent signed at career start — shapes exposure, opportunities, greed, value
  constructor(readonly seed: number, readonly track: Track = 'outfield', agentId?: string) {
    this.rng = mulberry32(seed);
    this.personality = rollPersonality(seed);   // innate temperament shapes how big moments / slumps play out
    this.agent = agentById(agentId);
    this.deck = [...(track === 'goalkeeper' ? GK_STARTER : STARTER_DECK)];
    this.pool = track === 'goalkeeper' ? GK_DRAFT_POOL : DRAFT_POOL;
    this.drawPile = this.shuffle([...this.deck]);
    this.refillHand();
    this.scenario = makeScenario(this.rng, this.turn, track, null, bandAt(0).band, this.exposure);
  }
  private get exposure() { return this.agent?.exposure ?? 1; }

  /** The player's current age + life chapter (Grassroots … Establishing). */
  get age() { return bandAt(Math.min(this.turn, TOTAL_TURNS - 1)).age; }
  get chapter() { return bandAt(Math.min(this.turn, TOTAL_TURNS - 1)).band.name; }

  /** Persist/trade this in-progress prospect: everything needed to resume it later or elsewhere. */
  snapshot(): CareerSnapshot { return { seed: this.seed, track: this.track, agentId: this.agent?.id, actions: [...this.actions] }; }

  /** At a between-chapter pause (offer/coach/draft), a factual summary of the chapter that just ended —
   *  which chapter, his age at the boundary, how he fared, big moments he rose to, and the season event
   *  colouring it. Null during normal play. Deterministic (derived from the career log) → for narration. */
  chapterSummary(): ChapterSummary | null {
    if (!this.pendingOffer && !this.pendingCoaches && !this.pendingDraft) return null;
    const doneIdx = BAND_ENDS.indexOf(this.turn);   // the band whose final turn was just played
    if (doneIdx < 0) return null;
    const band = AGE_BANDS[doneIdx];
    const slice = this.log.slice(Math.max(0, this.log.length - band.turns)); // just this chapter's plays
    const avgSuccess = slice.reduce((s, c) => s + c.success, 0) / Math.max(1, slice.length);
    const bigMoments = slice.filter((c) => c.stakes >= 2 && c.success >= 0.6).length;
    return { chapter: band.name, age: band.to, avgSuccess, bigMoments, seasonEvent: this.seasonEvent };
  }

  /** The financial/agent context graduate() needs (greed, fame, earnings, injuries, exposure). */
  finContext(): GraduateCtx {
    return { seriousInjuries: this.seriousInjuries, agentGreed: this.agent?.greed ?? 0, agentExposure: this.agent?.exposure ?? 1, greedBonus: this.greedBonus, marketBonus: this.marketBonus, earnings: this.earnings };
  }

  /** Reconstruct a career from a snapshot by replaying its actions (deterministic → exact state). A
   *  buyer resumes development from precisely where the seller left off. */
  static resume(snap: CareerSnapshot): Career {
    const c = new Career(snap.seed, snap.track, snap.agentId);
    for (const a of snap.actions) { if (a.type === 'draft') c.draft(a.cardId); else if (a.type === 'coach') c.appointCoach(a.cardId); else if (a.type === 'offer') c.resolveOffer(a.cardId); else c.play(a.cardId); }
    return c;
  }

  /** Current state: a 'coach' phase (appoint staff), a 'draft' phase (add a card), or a 'play' phase. */
  current() {
    if (this.pendingOffer) return { phase: 'offer' as const, age: this.age, chapter: this.chapter, offers: this.pendingOffer, earnings: this.earnings, deck: this.deck, finished: this.finished };
    if (this.pendingCoaches) return { phase: 'coach' as const, age: this.age, chapter: this.chapter, coaches: this.pendingCoaches, deck: this.deck, finished: this.finished };
    if (this.pendingDraft) return { phase: 'draft' as const, age: this.age, chapter: this.chapter, options: this.pendingDraft.options, picksLeft: this.pendingDraft.picksLeft, deck: this.deck, finished: this.finished };
    return { phase: 'play' as const, turn: this.turn, age: this.age, chapter: this.chapter, scenario: this.scenario, coach: this.coach, hand: this.hand, deck: this.deck, finished: this.finished };
  }

  /** RESOLVE the financial offer on the table: apply its money/fame/greed/form, then move to the coach. */
  resolveOffer(offerId: string) {
    if (!this.pendingOffer) throw new Error('no offer pending');
    const offer = this.pendingOffer.find((o) => o.id === offerId);
    if (!offer) throw new Error('offer not on table');
    this.earnings += offer.earn;
    this.greedBonus += offer.greed;
    this.marketBonus += offer.market;
    this.formBonus += offer.form;                 // added on top of the chapter's season-event form
    this.actions.push({ type: 'offer', cardId: offerId });
    this.pendingOffer = null;
    this.pendingCoaches = rollCoaches(this.rng, this.track);
  }

  /** APPOINT a mentor/coach for the coming chapter; then proceed to the card draft. */
  appointCoach(coachId: string) {
    if (!this.pendingCoaches) throw new Error('no coach appointment pending');
    const coach = this.pendingCoaches.find((c) => c.id === coachId);
    if (!coach) throw new Error('coach not on offer');
    this.coach = coach;
    this.actions.push({ type: 'coach', cardId: coachId });
    this.pendingCoaches = null;
    this.openDraft();
  }

  /** DRAFT: add one of the offered cards to your deck (identity-building). */
  draft(cardId: string) {
    if (!this.pendingDraft) throw new Error('no draft pending');
    const i = this.pendingDraft.options.findIndex((c) => c.id === cardId);
    if (i < 0) throw new Error('card not on offer');
    const card = this.pendingDraft.options.splice(i, 1)[0];
    this.actions.push({ type: 'draft', cardId });
    this.deck.push(card);
    this.discard.push(card);        // it enters the draw rotation right away
    if (--this.pendingDraft.picksLeft <= 0) { this.pendingDraft = null; this.startNextChapter(); }
  }

  /** Play a card from the current hand; resolves, logs, advances (into a draft at a season break). */
  play(cardId: string): Choice {
    if (this.finished) throw new Error('career finished');
    if (this.pendingOffer) throw new Error('resolve the financial offer first');
    if (this.pendingCoaches) throw new Error('appoint a coach first');
    if (this.pendingDraft) throw new Error('resolve the draft first');
    const idx = this.hand.findIndex((c) => c.id === cardId);
    if (idx < 0) throw new Error('card not in hand');
    this.actions.push({ type: 'play', cardId });
    const bestFit = Math.max(...this.hand.map((c) => fit(c, this.scenario))); // best you COULD have played this turn
    const card = this.hand.splice(idx, 1)[0];
    const f = fit(card, this.scenario);
    // stakes add variance (nerves), scaled by temperament; personality lifts/sinks big moments and
    // dampens slumps; form (season event) nudges success.
    const variance = (0.3 + 0.15 * (this.scenario.stakes - 1)) * this.personality.variance;
    const bigGame = this.scenario.stakes >= 2 ? this.personality.bigGame : 0;
    const form = this.formBonus < 0 ? this.formBonus * this.personality.resilience : this.formBonus;
    // your coach lifts success when you play to their specialty (good coaching → that development compounds)
    const coaching = this.coach && card.tags.some((t) => this.coach!.specialty.includes(t)) ? this.coach.bonus : 0;
    const success = clamp(f + (this.rng() - 0.5) * variance + form + bigGame + coaching, 0, 1);
    const choice: Choice = { cardId: card.id, tags: card.tags, power: cardPower(card), fit: f, bestFit, success, scenario: this.scenario.label, stakes: this.scenario.stakes };
    this.log.push(choice);
    this.discard.push(card);
    this.turn++;
    if (this.turn >= TOTAL_TURNS) { this.finished = true; return choice; }
    // at an age-chapter boundary: a narrative EVENT fires, then you APPOINT a coach, then a DRAFT
    if (BAND_ENDS.includes(this.turn)) { this.advanceSeasonEvent(); this.earnings += 40 + this.turn * 12; this.pendingOffer = rollOffer(this.rng, this.turn); }
    else { this.refillHand(); this.scenario = makeScenario(this.rng, this.turn, this.track, this.demandBias, bandAt(this.turn).band, this.exposure); }
    return choice;
  }

  /** Roll the narrative event for the upcoming age chapter and apply its mechanical effect. */
  private advanceSeasonEvent() {
    this.demandBias = null; this.formBonus = 0;                  // last chapter's effect clears
    const doneIdx = BAND_ENDS.indexOf(this.turn);               // the chapter that just ended
    const window = doneIdx >= 0 ? AGE_BANDS[doneIdx].turns : HAND_SIZE;
    const from = Math.max(0, this.log.length - window);
    const lastAvg = this.log.slice(from).reduce((s, c) => s + c.success, 0) / Math.max(1, this.log.length - from);
    const playedWell = lastAvg >= 0.55;
    // a rare SERIOUS INJURY: months out (a big dip this chapter) AND lasting fragility (durability↓)
    if (this.rng() < 0.06) { this.formBonus = -0.2; this.seriousInjuries++; this.seasonEvent = { id: 'serious-injury', name: 'Serious Injury', desc: 'Months on the sidelines — a setback that will linger.' }; return; }
    const r = this.rng();
    if (playedWell && r < 0.25) { this.extraPicks += 1; this.seasonEvent = { id: 'breakthrough', name: 'Breakthrough Season', desc: 'A breakout campaign earns you extra coaching time — an extra draft pick.' }; }
    else if (r < 0.45) { const pool = this.track === 'goalkeeper' ? (['keeping', 'composure', 'leadership'] as Tag[]) : OUTFIELD_TAGS; this.demandBias = pool[Math.floor(this.rng() * pool.length)]; this.seasonEvent = { id: 'new-gaffer', name: 'New Manager', desc: `The new gaffer wants more ${this.demandBias} out of you.` }; }
    else if (r < 0.62) { this.formBonus = 0.12; this.seasonEvent = { id: 'hot-streak', name: 'Purple Patch', desc: "You're in the form of your life — everything comes off." }; }
    else if (r < 0.79) { this.formBonus = -0.12; this.seasonEvent = { id: 'slump', name: 'Loss of Form', desc: 'A dip in confidence to battle through.' }; }
    else if (r < 0.9) { this.formBonus = -0.06; this.seasonEvent = { id: 'knock', name: 'Niggling Injury', desc: 'A knock to manage — not quite at your sharpest.' }; }
    else { this.seasonEvent = { id: 'steady', name: 'Steady Progress', desc: 'A solid, unremarkable season of graft.' }; }
  }

  /** Offer OFFER_SIZE cards from the pool, weighted so epics are rare. */
  private openDraft() {
    const luck = this.agent?.draftLuck ?? 1;   // a good agent gets you better opportunities (rarer cards on offer)
    const weight = (c: Card) => Math.max(1, Math.round(c.rarity === 'epic' ? luck * luck : c.rarity === 'rare' ? 3 * luck : 6));
    const bag = this.pool.flatMap((c) => Array(weight(c)).fill(c) as Card[]);
    const options: Card[] = [];
    const picked = new Set<string>();
    let guard = 0;
    while (options.length < Math.min(OFFER_SIZE, this.pool.length) && guard++ < 200) {
      const c = bag[Math.floor(this.rng() * bag.length)];
      if (!picked.has(c.id)) { picked.add(c.id); options.push(c); }
    }
    this.pendingDraft = { options, picksLeft: Math.min(DRAFT_PICKS + this.extraPicks, options.length) };
    this.extraPicks = 0;
  }

  private startNextChapter() {
    this.refillHand();
    this.scenario = makeScenario(this.rng, this.turn, this.track, this.demandBias, bandAt(this.turn).band, this.exposure);
  }

  private refillHand() { while (this.hand.length < HAND_SIZE) this.hand.push(this.drawOne()); }
  private drawOne(): Card {
    if (this.drawPile.length === 0) { this.drawPile = this.shuffle(this.discard); this.discard = []; }
    return this.drawPile.pop()!;
  }
  private shuffle(cards: Card[]): Card[] {
    const a = [...cards];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
}

// ── derivation: compress a finished career into a Player (PlayerAttrs v2 + role) ──
// SHAPE = tag frequency → which stats grow (peaked). MAGNITUDE = avg success → how high.
// + regression toward baseline + seeded noise so identical styles ≠ identical players.
export interface CareerPlayerAttrs {
  // physical / technical (what the Manager engine reads today)
  pace: number; strength: number; stamina: number;
  passing: number; shooting: number; tackling: number; positioning: number; workrate: number; keeping: number; setPiece: number;
  // mental (NEW — shaped by career play; the engine will read these for diversity)
  composure: number; aggression: number; creativity: number; teamwork: number; leadership: number;
  // injury resistance — robust physique, dented by serious injuries suffered in development
  durability: number;
}
export type Role = 'GK' | 'DF' | 'MF' | 'FW';
export interface CareerPlayer { attrs: CareerPlayerAttrs; role: Role; overall: number; genes: Genes; traits: string[]; personality: string; greed: number; marketability: number; earnings: number }
/** Financial/agent context carried out of a career into graduation (all optional → neutral defaults). */
export interface GraduateCtx { seriousInjuries?: number; agentGreed?: number; agentExposure?: number; greedBonus?: number; marketBonus?: number; earnings?: number; legacyBonus?: Partial<Record<keyof CareerPlayerAttrs, number>> }

// ── PERSONALITY: an innate temperament (nature), seeded at genesis like genes. It shapes HOW a player
// handles their career — steadiness vs volatility, and whether they rise or wilt under pressure — and
// becomes a permanent, human, Manager-engine-readable attribute (a Big-Game Player is calmer in finals,
// a Fragile one is not). Genes = physical nature; personality = mental nature; the stats are nurture.
export interface Personality { id: string; name: string; desc: string; variance: number; bigGame: number; resilience: number; signature?: keyof CareerPlayerAttrs }
export const PERSONALITIES: Personality[] = [
  { id: 'pro',       name: 'Model Professional', desc: 'Metronomic, dependable, no drama',        variance: 0.75, bigGame: 0.02, resilience: 0.6 },
  { id: 'biggame',   name: 'Big-Game Player',    desc: 'Lives for the big occasion',             variance: 1.0,  bigGame: 0.14, resilience: 0.8, signature: 'composure' },
  { id: 'fragile',   name: 'Fragile',            desc: 'Wilts when the heat comes on',           variance: 1.1,  bigGame: -0.12, resilience: 1.35 },
  { id: 'leader',    name: 'Born Leader',        desc: 'Drags everyone up to his level',         variance: 0.9,  bigGame: 0.06, resilience: 0.6, signature: 'leadership' },
  { id: 'workhorse', name: 'Workhorse',          desc: 'Never stops, never hides',               variance: 0.85, bigGame: 0.02, resilience: 0.4, signature: 'stamina' },
  { id: 'mercurial', name: 'Mercurial',          desc: 'Genius one week, anonymous the next',    variance: 1.45, bigGame: 0.05, resilience: 1.1 },
  { id: 'maverick',  name: 'Maverick',           desc: 'Brilliant, infuriating, his own man',    variance: 1.5,  bigGame: 0.08, resilience: 1.1, signature: 'creativity' },
];
const PERSONALITY_WEIGHTS = [5, 2, 2, 2, 3, 2, 1]; // Model Pro most common; Maverick rarest
export function rollPersonality(seed: number): Personality {
  const rng = mulberry32(seed ^ 0x9e37b1);
  const bag = PERSONALITIES.flatMap((p, i) => Array(PERSONALITY_WEIGHTS[i]).fill(p) as Personality[]);
  return bag[Math.floor(rng() * bag.length)];
}

// ── HYBRID model: raw physical stats are INNATE (a floor→ceiling band seeded at genesis and
// inherited via lineage); the career only decides how much of that band you REALISE. Technical +
// mental stats are fully career-developed. This makes natural pace/strength scarce (can't be
// grinded → market value) and gives bloodlines a real purpose (you inherit physical potential,
// then earn everything else — so "optimal bloodlines" can't be solved).
export interface Band { floor: number; ceiling: number }
export interface Genes { pace: Band; strength: Band; stamina: Band }
export const INNATE: ReadonlyArray<keyof CareerPlayerAttrs> = ['pace', 'strength', 'stamina'];

/** Genesis genes: each innate stat gets a random floor and a ceiling above it. Some players are
 *  naturally quick/strong (high band), others never will be (low band) no matter how they train. */
export function rollGenes(seed: number): Genes {
  const rng = mulberry32(seed ^ 0x6e6ee5);
  const band = (): Band => {
    const floor = Math.round(2 + rng() * 10);                                  // 2..12
    const ceiling = clamp(Math.round(floor + 4 + rng() * 10), floor + 3, 20);  // floor+3 .. 20
    return { floor, ceiling };
  };
  return { pace: band(), strength: band(), stamina: band() };
}

/** Child genes for lineage: inherited bands biased toward the parent's, regressed toward the
 *  population mean and re-rolled with variance — inheritance is a BIAS ON A RANDOM ROLL, never a
 *  deterministic copy, so bloodlines stay diverse and un-solvable. keepPct = how strongly the
 *  parent shows through (~0.5–0.7). */
export function inheritGenes(parent: Genes, seed: number, keepPct = 0.6, ceilingLift = 0): Genes {
  const rng = mulberry32(seed ^ 0x50f);
  const MEAN_FLOOR = 7, MEAN_CEIL = 13;
  const inheritBand = (b: Band): Band => {
    const floor = clamp(Math.round(b.floor * keepPct + MEAN_FLOOR * (1 - keepPct) + (rng() - 0.5) * 4), 1, 15);
    // a decorated, durable bloodline lifts the son's physical CEILING (better potential — earned, bounded)
    const ceiling = clamp(Math.round(b.ceiling * keepPct + MEAN_CEIL * (1 - keepPct) + (rng() - 0.5) * 4 + ceilingLift), floor + 3, 20);
    return { floor, ceiling };
  };
  return { pace: inheritBand(parent.pace), strength: inheritBand(parent.strength), stamina: inheritBand(parent.stamina) };
}

// ── ACHIEVEMENT LEGACY: a player's on-pitch career follows the NFT into the next generation. A father
// who won things and lasted at the top breeds a son with a head-start — but from TEAM achievements only
// (trophies, promotions, the level he competed at, longevity), NEVER personal tallies like goals/assists
// which would unfairly favour attackers. So a decorated centre-back or keeper passes on exactly as much
// pedigree as a decorated striker. The boosts are position-neutral (a winner's mentality + physical
// pedigree) and bounded — an earned edge, not pay-to-win.
export interface PlayerAchievements {
  seasons: number;         // seasons played (longevity)
  apps: number;            // appearances
  leagueTitles: number;    // league championships won with the squad
  cupTitles: number;       // cups won with the squad
  promotions: number;      // times the club climbed a division while he was in it
  highestTierIdx: number;  // the highest division he competed in (0 Sunday … 9 World Class)
}
export interface LegacyBoost {
  ceilingLift: number;                                  // +0..3 to the son's inherited physical ceilings
  devBonus: Partial<Record<keyof CareerPlayerAttrs, number>>; // small post-development nudges (mentality)
  pedigree: number;                                     // 0..1 summary (fame of the bloodline; UI/market)
  note: string;
}
/** Turn a player's TEAM achievements into the (bounded, position-neutral) pedigree his son is born with. */
export function legacyBoost(a: PlayerAchievements): LegacyBoost {
  const tierMult = 1 + a.highestTierIdx * 0.4;                       // winning higher up is worth more
  const trophyPts = (a.leagueTitles + a.cupTitles * 0.7 + a.promotions * 0.4) * tierMult;
  const winner = clamp(trophyPts / 12, 0, 1);                        // 0..1 how decorated the father was
  const longevity = clamp((a.seasons + a.apps * 0.05) / 16, 0, 1);   // 0..1 durability of the career
  const ceilingLift = clamp(Math.round(longevity * 2 + winner), 0, 3); // athletic + winning bloodline
  const devBonus: Partial<Record<keyof CareerPlayerAttrs, number>> = {
    leadership: Math.round(winner * 2),                              // winners breed a winning mentality…
    composure: Math.round(winner * 1.5),                            // …calm on the big stage (position-neutral)
  };
  const pedigree = clamp(0.6 * winner + 0.4 * longevity, 0, 1);
  const note = winner > 0.66 ? 'elite pedigree — a dynasty bloodline' : winner > 0.33 ? 'proven pedigree' : longevity > 0.5 ? 'a long, dependable career' : 'a modest playing record';
  return { ceilingLift, devBonus, pedigree, note };
}

// each stat's source tags (≥1 each); keeping has none (GK is a future dedicated path)
const STAT_SOURCES: Record<Exclude<keyof CareerPlayerAttrs, 'durability'>, Tag[]> = { // durability is computed from physique below, not from tags
  pace: ['stamina', 'flair'], strength: ['aggression', 'stamina'], stamina: ['stamina'],
  passing: ['creativity', 'teamwork'], shooting: ['flair', 'composure'], tackling: ['aggression'],
  positioning: ['teamwork', 'composure'], workrate: ['stamina', 'teamwork'], keeping: ['keeping'], setPiece: ['composure', 'creativity'],
  composure: ['composure'], aggression: ['aggression'], creativity: ['creativity'], teamwork: ['teamwork'], leadership: ['leadership'],
};
const BASELINE = 7, SPREAD = 12, PEAK = 1.5;

export function deriveStats(log: Choice[], seed: number, genes: Genes = rollGenes(seed)): CareerPlayerAttrs {
  const rng = mulberry32(seed ^ 0x9e3779b9);
  const innate = new Set<keyof CareerPlayerAttrs>(INNATE);
  const freq = Object.fromEntries(TAGS.map((t) => [t, 0])) as Record<Tag, number>;
  // weight by card power AND stakes: a great play in a cup final shapes you more than a training drill
  for (const c of log) for (const t of c.tags) freq[t] += c.power * c.stakes;
  const maxFreq = Math.max(1, ...TAGS.map((t) => freq[t]));
  const norm = Object.fromEntries(TAGS.map((t) => [t, freq[t] / maxFreq])) as Record<Tag, number>;
  // MAGNITUDE = how well you actually played (avg success across the career). With a capped flywheel
  // this spreads by skill: a player who plays high-fit cards banks more success → higher stats.
  const avgSuccess = log.reduce((s, c) => s + c.success, 0) / Math.max(1, log.length);
  const magnitude = 0.5 + 0.7 * avgSuccess; // ~0.5x (played poorly) .. ~1.2x (played superbly)

  const out = {} as CareerPlayerAttrs;
  for (const stat of Object.keys(STAT_SOURCES) as (keyof typeof STAT_SOURCES)[]) {
    const src = STAT_SOURCES[stat];
    const shape = src.length ? src.reduce((s, t) => s + norm[t], 0) / src.length : 0;
    const peaked = Math.pow(shape, PEAK);
    const noise = (rng() - 0.5) * 3;
    if (innate.has(stat)) {
      // INNATE: the career only decides how far up your genetic band [floor, ceiling] you realise.
      const band = genes[stat as 'pace' | 'strength' | 'stamina'];
      const realised = clamp(peaked * magnitude, 0, 1); // 0 = never trained it, 1 = maxed your potential
      out[stat] = clamp(Math.round(band.floor + realised * (band.ceiling - band.floor) + noise * 0.4), 1, 20);
    } else {
      // DEVELOPED: technical/mental grow freely with play.
      out[stat] = clamp(Math.round((BASELINE + peaked * SPREAD) * magnitude + noise), 1, 20);
    }
  }
  out.durability = clamp(Math.round(5 + 0.3 * out.strength + 0.3 * out.stamina + (rng() - 0.5) * 3), 1, 20); // ~11-12 for a healthy career; injury penalty applied at graduate
  return out;
}

// Per-role baselines subtract the "easy" stats so roles come out ~balanced (attacking stats are
// generally higher, which used to over-produce FW/MF and starve DF). A career is the role it's
// most ABOVE its own baseline in. GK is decided first: a real keeping stat means a goalkeeper.
const ROLE_CORE: Record<Role, (keyof CareerPlayerAttrs)[]> = {
  GK: ['keeping', 'positioning', 'composure'],
  DF: ['tackling', 'strength', 'aggression', 'positioning'],
  MF: ['passing', 'creativity', 'teamwork', 'stamina'],
  FW: ['shooting', 'pace', 'composure', 'creativity'],
};
// baselines = the population mean core-avg per role (measured), so a career is whichever role it's
// most ABOVE its own typical in → DF/MF/FW come out ~balanced instead of attacking stats winning.
const ROLE_BASELINE: Record<Role, number> = { GK: 8, DF: 11.77, MF: 12.56, FW: 12.86 };

/** Derive the role: a goalkeeper if `keeping` is genuinely developed, else the outfield role the
 *  player is most above-baseline in (baselines calibrated so DF/MF/FW come out roughly balanced). */
export function deriveRole(a: CareerPlayerAttrs): Role {
  if (a.keeping >= 12) return 'GK'; // only the GK track develops keeping this high
  const score = (r: Role) => ROLE_CORE[r].reduce((s, k) => s + a[k], 0) / ROLE_CORE[r].length - ROLE_BASELINE[r];
  return (['DF', 'MF', 'FW'] as Role[]).reduce((best, r) => (score(r) > score(best) ? r : best), 'DF');
}

/** Role-weighted overall (each role values the stats that matter to it). */
export function careerOverall(a: CareerPlayerAttrs, role: Role): number {
  const core: Record<Role, (keyof CareerPlayerAttrs)[]> = {
    GK: ['keeping', 'positioning', 'composure'],
    DF: ['tackling', 'strength', 'positioning', 'aggression', 'composure'],
    MF: ['passing', 'creativity', 'teamwork', 'stamina', 'composure'],
    FW: ['shooting', 'pace', 'composure', 'creativity'],
  };
  const keys = core[role];
  return Math.round(keys.reduce((s, k) => s + a[k], 0) / keys.length);
}

// ── TRAITS: earned identity perks that differentiate players beyond raw stats and give the Manager
// engine hooks to read later ("Big-Game Player" → composure in finals, etc.). A career becomes
// ELIGIBLE for a trait by how it developed; the player locks in up to MAX_TRAITS (the client lets a
// human choose; the sim auto-picks). Some traits also nudge a stat.
export const MAX_TRAITS = 2;
export interface Trait { id: string; name: string; desc: string; eligible: (a: CareerPlayerAttrs, log: Choice[]) => boolean; apply?: (a: CareerPlayerAttrs) => void }
export const TRAITS: Trait[] = [
  { id: 'clinical',  name: 'Clinical Finisher',    desc: 'Ice-cold in front of goal',        eligible: (a) => a.shooting >= 15 && a.composure >= 14, apply: (a) => { a.shooting = clamp(a.shooting + 1, 1, 20); } },
  { id: 'ballwinner', name: 'Ball-Winner',         desc: 'Wins it back relentlessly',        eligible: (a) => a.tackling >= 15 && a.aggression >= 13, apply: (a) => { a.tackling = clamp(a.tackling + 1, 1, 20); } },
  { id: 'metronome', name: 'Metronome',            desc: 'Never misplaces a pass',           eligible: (a) => a.passing >= 15 && a.teamwork >= 13 },
  { id: 'maestro',   name: 'Creative Maestro',     desc: 'Unlocks the tightest defences',    eligible: (a) => a.creativity >= 16 },
  { id: 'leader',    name: 'Born Leader',          desc: 'Lifts the whole team',             eligible: (a) => a.leadership >= 15 },
  { id: 'livewire',  name: 'Livewire',             desc: 'Blistering, frightening pace',     eligible: (a) => a.pace >= 16 },
  { id: 'ironman',   name: 'Iron Man',             desc: 'Runs all day, every day',          eligible: (a) => a.stamina >= 15 && a.strength >= 13 },
  { id: 'deadball',  name: 'Dead-Ball Specialist', desc: 'Lethal from set pieces',           eligible: (a) => a.setPiece >= 15, apply: (a) => { a.setPiece = clamp(a.setPiece + 1, 1, 20); } },
  { id: 'wall',      name: 'The Wall',             desc: 'Unbeatable between the sticks',     eligible: (a) => a.keeping >= 16 },
  { id: 'biggame',   name: 'Big-Game Player',      desc: 'Turns up when it matters most',    eligible: (_a, log) => log.filter((c) => c.stakes >= 2 && c.success >= 0.75).length >= 5 },
];

/** Which traits a finished career qualifies for (before the player locks any in). */
export function eligibleTraits(attrs: CareerPlayerAttrs, log: Choice[]): Trait[] {
  return TRAITS.filter((t) => t.eligible(attrs, log));
}

/** Finish a career log into a complete Player (attrs + role + overall + traits). Genes default to a
 *  fresh genesis roll; pass inherited genes (lineage). `pickTraits` chooses among the eligible traits
 *  (the client lets a human pick; defaults to the first MAX_TRAITS for the sim). */
export function graduate(log: Choice[], seed: number, genes: Genes = rollGenes(seed), pickTraits?: (eligible: Trait[]) => Trait[], ctx: GraduateCtx = {}): CareerPlayer {
  const { seriousInjuries = 0, agentGreed = 0, agentExposure = 1, greedBonus = 0, marketBonus = 0, earnings = 0, legacyBonus } = ctx;
  const attrs = deriveStats(log, seed, genes);
  const personality = rollPersonality(seed);                          // same temperament the career developed under
  if (personality.signature) attrs[personality.signature] = clamp(attrs[personality.signature] + 1, 1, 20);
  // inherited pedigree from a decorated father (team achievements) — a bounded, position-neutral head-start
  if (legacyBonus) for (const k of Object.keys(legacyBonus) as (keyof CareerPlayerAttrs)[]) attrs[k] = clamp(attrs[k] + (legacyBonus[k] ?? 0), 1, 20);
  // serious injuries in development leave a lasting fragility (injury-proneness the Manager game reads)
  attrs.durability = clamp(attrs.durability - Math.round(seriousInjuries * 2.5), 1, 20);
  // GREED (financial temperament): what it'll cost a manager to keep this player. Set by the AGENT he
  // signed with, his nature, and the money he chased in-career. High → mercenary; low → a loyal one-club man.
  const gRng = mulberry32(seed ^ 0x9e3779b9);
  const greed = clamp(Math.round(9 + agentGreed + greedBonus + (PERSONALITY_GREED[personality.id] ?? 0) + (gRng() - 0.5) * 4), 1, 20);
  // MARKETABILITY (brand/fame): star turns on the big stage, a flashy temperament, agent exposure and
  // brand deals build it. The Manager game turns it into COMMERCIAL income — so a fan-favourite helps
  // pay his own wages, giving greed a genuine upside instead of being a pure tax.
  const starTurns = log.filter((c) => c.stakes >= 2 && c.success >= 0.7).length;
  const flair = personality.id === 'maverick' || personality.id === 'mercurial' ? 3 : personality.id === 'biggame' ? 2 : 0;
  const marketability = clamp(Math.round(5 + starTurns * 0.6 + flair + (agentExposure - 1) * 8 + marketBonus + (gRng() - 0.5) * 2), 1, 20);
  const eligible = eligibleTraits(attrs, log);
  const chosen = (pickTraits ? pickTraits(eligible) : eligible.slice(0, MAX_TRAITS)).slice(0, MAX_TRAITS);
  for (const t of chosen) t.apply?.(attrs); // trait bonuses apply before role/overall
  const flaws = attrs.durability <= 6 ? ['injury_prone'] : []; // a flaw flag, separate from earned perks
  if (greed >= 15) flaws.push('mercenary');                    // financially greedy — costs a fortune to extend
  else if (greed <= 5) flaws.push('loyal');                    // a bargain to keep — a one-club man
  if (marketability >= 15) flaws.push('marketable');           // a brand — boosts commercial income for his club
  const role = deriveRole(attrs);
  return { attrs, role, overall: careerOverall(attrs, role), genes, traits: [...chosen.map((t) => t.id), ...flaws], personality: personality.id, greed, marketability, earnings };
}

// ── AGE CURVE (playing phase, age 25 → 40) ──
// The minted Player NFT's stats are the PRIME (age 25, graduation). The Manager game applies this
// read-time curve so ability truly ARCS — RISE → PEAK → DECLINE — over the 15 pro seasons. The prime
// isn't the top: PHYSICAL (pace/strength/stamina/workrate) peaks ~25 and then falls STEADILY (a
// pace-merchant fades hard by his 30s), CRAFT (technique) matures a touch then plateaus, and WISDOM
// (composure/leadership/positioning/keeping) keeps rising into the 30s. Net effect: athletic players
// peak early and depreciate; cerebral players peak ~29-31 and age gracefully — so WHEN you sell, hold,
// or retire a player actually matters (and young prospects appreciate). Immutable base + this curve.
const PHYSICAL: (keyof CareerPlayerAttrs)[] = ['pace', 'strength', 'stamina', 'workrate'];
const WISDOM: (keyof CareerPlayerAttrs)[] = ['composure', 'leadership', 'positioning', 'keeping'];
const CRAFT: (keyof CareerPlayerAttrs)[] = ['passing', 'shooting', 'tackling', 'creativity', 'setPiece', 'teamwork'];
export function ageCurve(prime: CareerPlayerAttrs, age: number): CareerPlayerAttrs {
  const phys = age <= 26 ? 1 : clamp(1 - (age - 26) * 0.042, 0.4, 1);  // peaks ~25-26, then −4.2%/yr (floor .40)
  const wis = clamp(1 + (age - 25) * 0.02, 1, 1.16);                   // experience rises +2%/yr into the 30s (cap +16%)
  const craft = clamp(1 + (age - 25) * 0.01, 1, 1.05);                 // technique matures then plateaus (cap +5%)
  const out = { ...prime };
  for (const k of PHYSICAL) out[k] = clamp(Math.round(prime[k] * phys), 1, 20);
  for (const k of WISDOM) out[k] = clamp(Math.round(prime[k] * wis), 1, 20);
  for (const k of CRAFT) out[k] = clamp(Math.round(prime[k] * craft), 1, 20);
  return out;
}

// ── PROSPECT VALUATION (the market for in-development players) ──
// A half-developed prospect is priced on: current ability, how much upside remains (age → turns left),
// and its physical gene ceiling (the scarce, un-grindable part). Deterministic + verifiable.
export interface ProspectValue { age: number; chapter: string; role: Role; currentOverall: number; potential: number; physicalCeiling: number; stars: number }
export function prospectValuation(c: Career, genes: Genes): ProspectValue {
  const partial = deriveStats(c.log, c.seed, genes);           // stats so far (deterministic)
  const role = deriveRole(partial);
  const current = careerOverall(partial, role);
  const remaining = Math.max(0, 1 - c.turn / TOTAL_TURNS);     // fraction of the career still to develop
  const geneCeil = (genes.pace.ceiling + genes.strength.ceiling + genes.stamina.ceiling) / 3;
  // a rough prime-overall ceiling: physical bounded by genes, technique/mental by a well-played nominal ~17
  const ceiling = clamp(Math.round(0.45 * geneCeil + 0.55 * 17), current, 20);
  const potential = Math.round(current + remaining * (ceiling - current)); // projected prime if developed well
  const stars = clamp(Math.round((potential + remaining * 3) / 4.2 * (c.agent?.valueMod ?? 1)), 1, 5); // a good agent markets the prospect (higher perceived value)
  return { age: c.age, chapter: c.chapter, role, currentOverall: current, potential, physicalCeiling: Math.round(geneCeil), stars };
}

// ── balance helper: auto-play a career under a "style" policy (picks the best hand card) ──
export interface Style { name: string; pref: Partial<Record<Tag, number>>; skill: number }
export function simCareer(seed: number, style: Style, genes: Genes = rollGenes(seed), track: Track = 'outfield', agentId?: string): CareerPlayer {
  const career = new Career(seed, track, agentId);
  const rng = mulberry32(seed ^ 0x1234567);
  const prefScore = (c: Card) => c.tags.reduce((s, t) => s + (style.pref[t] ?? 0), 0);
  while (!career.finished) {
    const st = career.current();
    if (st.phase === 'offer') {
      // financial path: ambitious/mercenary careers chase the money; grounded ones stay & develop.
      const wantsMoney = (career.agent?.greed ?? 0) + (PERSONALITY_GREED[career.personality.id] ?? 0) + (rng() - 0.5) * 4;
      const pick = wantsMoney > 1 ? (rng() < 0.5 ? 'money' : 'brand') : wantsMoney < -1 ? 'develop' : (rng() < 0.5 ? 'brand' : 'develop');
      career.resolveOffer(pick);
      continue;
    }
    if (st.phase === 'coach') {
      // appoint the coach whose specialty best matches your identity (amplify your strengths).
      let best = st.coaches[0], bs = -Infinity;
      for (const c of st.coaches) { const score = c.specialty.reduce((s, t) => s + (style.pref[t] ?? 0), 0) + rng() * 0.05; if (score > bs) { bs = score; best = c; } }
      career.appointCoach(best.id);
      continue;
    }
    if (st.phase === 'draft') {
      // DRAFT: take the offered card that best advances your identity (pref × power).
      let best = st.options[0], bestScore = -Infinity;
      for (const c of st.options) { const score = prefScore(c) * cardPower(c) + rng() * 0.05; if (score > bestScore) { bestScore = score; best = c; } }
      career.draft(best.id);
      continue;
    }
    // PLAY: style drives choice (shape); skill sharpens how much you also weigh fit (magnitude).
    let best = st.hand[0], bestScore = -Infinity;
    for (const c of st.hand) {
      const score = prefScore(c) * 2 + style.skill * 3 * fit(c, st.scenario) + rng() * 0.05;
      if (score > bestScore) { bestScore = score; best = c; }
    }
    career.play(best.id);
  }
  return graduate(career.log, seed, genes, undefined, career.finContext());
}
