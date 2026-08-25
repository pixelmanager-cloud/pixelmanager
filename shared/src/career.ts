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

// deck-building config
export const OFFER_SIZE = 4;   // cards shown at a between-season draft
export const DRAFT_PICKS = 2;  // how many you add each draft

// ── scenarios: each moment demands a weighted mix of tags; kind biases the demand ──
export interface Scenario { id: string; kind: 'match' | 'social' | 'training'; demand: Partial<Record<Tag, number>>; label: string }
const KIND_BIAS: Record<Scenario['kind'], Tag[]> = {
  match: TAGS,                                                   // anything can come up in a match
  social: ['leadership', 'composure', 'teamwork'],              // dressing room / media
  training: ['stamina', 'creativity', 'flair', 'aggression'],   // sharpen the tools
};
const KIND_POOL: Scenario['kind'][] = ['match', 'match', 'match', 'social', 'training'];
// goalkeeper moments demand keeping heavily, plus the calm/commanding traits that suit a keeper
const GK_BIAS: Tag[] = ['keeping', 'keeping', 'keeping', 'composure', 'leadership', 'creativity'];

/** A seeded scenario: pick 1–3 demanded tags (biased by kind + track) with weights summing to 1. */
export function makeScenario(rng: () => number, i: number, track: Track = 'outfield'): Scenario {
  const kind = KIND_POOL[Math.floor(rng() * KIND_POOL.length)];
  const bias = track === 'goalkeeper' ? GK_BIAS : KIND_BIAS[kind].filter((t) => OUTFIELD_TAGS.includes(t));
  const n = 1 + Math.floor(rng() * Math.min(3, bias.length));
  const pool = [...new Set([...bias].sort(() => rng() - 0.5))].slice(0, n);
  const raw = pool.map(() => 0.3 + rng());
  const sum = raw.reduce((a, b) => a + b, 0);
  const demand: Partial<Record<Tag, number>> = {};
  pool.forEach((t, k) => { demand[t] = raw[k] / sum; });
  const label = `${kind}: ${pool.join(' / ')}`;
  return { id: `sc${i}`, kind, demand, label };
}

/** How well a card's tags satisfy a scenario's demand, 0..1. */
export function fit(card: Card, sc: Scenario): number {
  let f = 0;
  for (const t of card.tags) f += sc.demand[t] ?? 0;
  return clamp(f, 0, 1);
}

export interface Choice { cardId: string; tags: Tag[]; power: number; fit: number; bestFit: number; success: number; scenario: string }

// ── career config ──
export const HAND_SIZE = 4;
export const SCENARIOS_PER_SEASON = 20;
export const SEASONS_TO_GRADUATE = 3; // → 60 turns to a finished player

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
  season = 1;
  log: Choice[] = [];
  finished = false;
  /** When set, the career is paused for a between-season DRAFT: pick DRAFT_PICKS of these to add. */
  pendingDraft: { options: Card[]; picksLeft: number } | null = null;

  constructor(readonly seed: number, readonly track: Track = 'outfield') {
    this.rng = mulberry32(seed);
    this.deck = [...(track === 'goalkeeper' ? GK_STARTER : STARTER_DECK)];
    this.pool = track === 'goalkeeper' ? GK_DRAFT_POOL : DRAFT_POOL;
    this.drawPile = this.shuffle([...this.deck]);
    this.refillHand();
    this.scenario = makeScenario(this.rng, this.turn, track);
  }

  /** Current state: a 'play' phase (pick a hand card) or a 'draft' phase (pick a card to add). */
  current() {
    if (this.pendingDraft) return { phase: 'draft' as const, season: this.season, options: this.pendingDraft.options, picksLeft: this.pendingDraft.picksLeft, deck: this.deck, finished: this.finished };
    return { phase: 'play' as const, turn: this.turn, season: this.season, scenario: this.scenario, hand: this.hand, deck: this.deck, finished: this.finished };
  }

  /** DRAFT: add one of the offered cards to your deck (identity-building). */
  draft(cardId: string) {
    if (!this.pendingDraft) throw new Error('no draft pending');
    const i = this.pendingDraft.options.findIndex((c) => c.id === cardId);
    if (i < 0) throw new Error('card not on offer');
    const card = this.pendingDraft.options.splice(i, 1)[0];
    this.deck.push(card);
    this.discard.push(card);        // it enters the draw rotation right away
    if (--this.pendingDraft.picksLeft <= 0) { this.pendingDraft = null; this.startNextSeason(); }
  }

  /** Play a card from the current hand; resolves, logs, advances (into a draft at a season break). */
  play(cardId: string): Choice {
    if (this.finished) throw new Error('career finished');
    if (this.pendingDraft) throw new Error('resolve the draft first');
    const idx = this.hand.findIndex((c) => c.id === cardId);
    if (idx < 0) throw new Error('card not in hand');
    const bestFit = Math.max(...this.hand.map((c) => fit(c, this.scenario))); // best you COULD have played this turn
    const card = this.hand.splice(idx, 1)[0];
    const f = fit(card, this.scenario);
    const success = clamp(f + (this.rng() - 0.5) * 0.3, 0, 1); // good fit usually succeeds, with variance
    const choice: Choice = { cardId: card.id, tags: card.tags, power: cardPower(card), fit: f, bestFit, success, scenario: this.scenario.label };
    this.log.push(choice);
    this.discard.push(card);
    this.turn++;
    if (this.turn >= SCENARIOS_PER_SEASON * SEASONS_TO_GRADUATE) { this.finished = true; return choice; }
    // at a season boundary, open a DRAFT before dealing next season (your deck grows by your choices)
    if (this.turn % SCENARIOS_PER_SEASON === 0) this.openDraft(); else { this.refillHand(); this.scenario = makeScenario(this.rng, this.turn, this.track); }
    return choice;
  }

  /** Offer OFFER_SIZE cards from the pool, weighted so epics are rare. */
  private openDraft() {
    const weight = (c: Card) => (c.rarity === 'epic' ? 1 : c.rarity === 'rare' ? 3 : 6);
    const bag = this.pool.flatMap((c) => Array(weight(c)).fill(c) as Card[]);
    const options: Card[] = [];
    const picked = new Set<string>();
    let guard = 0;
    while (options.length < Math.min(OFFER_SIZE, this.pool.length) && guard++ < 200) {
      const c = bag[Math.floor(this.rng() * bag.length)];
      if (!picked.has(c.id)) { picked.add(c.id); options.push(c); }
    }
    this.pendingDraft = { options, picksLeft: Math.min(DRAFT_PICKS, options.length) };
  }

  private startNextSeason() {
    this.season = 1 + Math.floor(this.turn / SCENARIOS_PER_SEASON);
    this.refillHand();
    this.scenario = makeScenario(this.rng, this.turn, this.track);
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
}
export type Role = 'GK' | 'DF' | 'MF' | 'FW';
export interface CareerPlayer { attrs: CareerPlayerAttrs; role: Role; overall: number; genes: Genes; traits: string[] }

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
export function inheritGenes(parent: Genes, seed: number, keepPct = 0.6): Genes {
  const rng = mulberry32(seed ^ 0x50f);
  const MEAN_FLOOR = 7, MEAN_CEIL = 13;
  const inheritBand = (b: Band): Band => {
    const floor = clamp(Math.round(b.floor * keepPct + MEAN_FLOOR * (1 - keepPct) + (rng() - 0.5) * 4), 1, 15);
    const ceiling = clamp(Math.round(b.ceiling * keepPct + MEAN_CEIL * (1 - keepPct) + (rng() - 0.5) * 4), floor + 3, 20);
    return { floor, ceiling };
  };
  return { pace: inheritBand(parent.pace), strength: inheritBand(parent.strength), stamina: inheritBand(parent.stamina) };
}

// each stat's source tags (≥1 each); keeping has none (GK is a future dedicated path)
const STAT_SOURCES: Record<keyof CareerPlayerAttrs, Tag[]> = {
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
  for (const c of log) for (const t of c.tags) freq[t] += c.power; // higher-power (drafted rare/epic) cards pull harder
  const maxFreq = Math.max(1, ...TAGS.map((t) => freq[t]));
  const norm = Object.fromEntries(TAGS.map((t) => [t, freq[t] / maxFreq])) as Record<Tag, number>;
  // MAGNITUDE = how well you actually played (avg success across the career). With a capped flywheel
  // this spreads by skill: a player who plays high-fit cards banks more success → higher stats.
  const avgSuccess = log.reduce((s, c) => s + c.success, 0) / Math.max(1, log.length);
  const magnitude = 0.5 + 0.7 * avgSuccess; // ~0.5x (played poorly) .. ~1.2x (played superbly)

  const out = {} as CareerPlayerAttrs;
  for (const stat of Object.keys(STAT_SOURCES) as (keyof CareerPlayerAttrs)[]) {
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
  { id: 'biggame',   name: 'Big-Game Player',      desc: 'Turns up when it matters most',    eligible: (_a, log) => log.filter((c) => c.fit >= 0.6 && c.success >= 0.8).length >= 18 },
];

/** Which traits a finished career qualifies for (before the player locks any in). */
export function eligibleTraits(attrs: CareerPlayerAttrs, log: Choice[]): Trait[] {
  return TRAITS.filter((t) => t.eligible(attrs, log));
}

/** Finish a career log into a complete Player (attrs + role + overall + traits). Genes default to a
 *  fresh genesis roll; pass inherited genes (lineage). `pickTraits` chooses among the eligible traits
 *  (the client lets a human pick; defaults to the first MAX_TRAITS for the sim). */
export function graduate(log: Choice[], seed: number, genes: Genes = rollGenes(seed), pickTraits?: (eligible: Trait[]) => Trait[]): CareerPlayer {
  const attrs = deriveStats(log, seed, genes);
  const eligible = eligibleTraits(attrs, log);
  const chosen = (pickTraits ? pickTraits(eligible) : eligible.slice(0, MAX_TRAITS)).slice(0, MAX_TRAITS);
  for (const t of chosen) t.apply?.(attrs); // trait bonuses apply before role/overall
  const role = deriveRole(attrs);
  return { attrs, role, overall: careerOverall(attrs, role), genes, traits: chosen.map((t) => t.id) };
}

// ── balance helper: auto-play a career under a "style" policy (picks the best hand card) ──
export interface Style { name: string; pref: Partial<Record<Tag, number>>; skill: number }
export function simCareer(seed: number, style: Style, genes: Genes = rollGenes(seed), track: Track = 'outfield'): CareerPlayer {
  const career = new Career(seed, track);
  const rng = mulberry32(seed ^ 0x1234567);
  const prefScore = (c: Card) => c.tags.reduce((s, t) => s + (style.pref[t] ?? 0), 0);
  while (!career.finished) {
    const st = career.current();
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
  return graduate(career.log, seed, genes);
}
