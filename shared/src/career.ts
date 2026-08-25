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
export type Tag = 'composure' | 'aggression' | 'creativity' | 'teamwork' | 'leadership' | 'stamina' | 'flair';
export const TAGS: Tag[] = ['composure', 'aggression', 'creativity', 'teamwork', 'leadership', 'stamina', 'flair'];

export interface Card { id: string; name: string; tags: Tag[] }
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
  { id: 'mazy',        name: 'Mazy Dribble',     tags: ['flair', 'creativity'] },
];

// ── scenarios: each moment demands a weighted mix of tags; kind biases the demand ──
export interface Scenario { id: string; kind: 'match' | 'social' | 'training'; demand: Partial<Record<Tag, number>>; label: string }
const KIND_BIAS: Record<Scenario['kind'], Tag[]> = {
  match: TAGS,                                                   // anything can come up in a match
  social: ['leadership', 'composure', 'teamwork'],              // dressing room / media
  training: ['stamina', 'creativity', 'flair', 'aggression'],   // sharpen the tools
};
const KIND_POOL: Scenario['kind'][] = ['match', 'match', 'match', 'social', 'training'];

/** A seeded scenario: pick 1–3 demanded tags (biased by kind) with weights summing to 1. */
export function makeScenario(rng: () => number, i: number): Scenario {
  const kind = KIND_POOL[Math.floor(rng() * KIND_POOL.length)];
  const bias = KIND_BIAS[kind];
  const n = 1 + Math.floor(rng() * Math.min(3, bias.length));
  const pool = [...bias].sort(() => rng() - 0.5).slice(0, n);
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

export interface Choice { cardId: string; tags: Tag[]; fit: number; bestFit: number; success: number; scenario: string }

// ── career config ──
export const HAND_SIZE = 4;
export const SCENARIOS_PER_SEASON = 20;
export const SEASONS_TO_GRADUATE = 3; // → 60 turns to a finished player
export const FLYWHEEL_CAP = 2;        // max extra copies of a card the flywheel can grant (bounds runaway)

/**
 * A stateful career the client drives one turn at a time. Deterministic given (seed, choices):
 * RNG is consumed in a fixed order (scenario → resolve → draw) regardless of which card is picked,
 * so replaying the same choice ids reproduces the exact same player.
 */
export class Career {
  private rng: () => number;
  private drawPile: Card[] = [];
  private discard: Card[] = [];
  hand: Card[] = [];
  scenario!: Scenario;
  turn = 0;
  season = 1;
  log: Choice[] = [];
  finished = false;
  private copies = new Map<string, number>(); // flywheel: extra copies gained per card (capped)

  constructor(readonly seed: number) {
    this.rng = mulberry32(seed);
    this.drawPile = this.shuffle([...DECK]);
    this.refillHand();
    this.scenario = makeScenario(this.rng, this.turn);
  }

  /** The current decision: which of these hand cards for this scenario. */
  current() { return { turn: this.turn, season: this.season, scenario: this.scenario, hand: this.hand, finished: this.finished }; }

  /** Play a card from the current hand; resolves, logs, deals the next turn. Returns the outcome. */
  play(cardId: string): Choice {
    if (this.finished) throw new Error('career finished');
    const idx = this.hand.findIndex((c) => c.id === cardId);
    if (idx < 0) throw new Error('card not in hand');
    const bestFit = Math.max(...this.hand.map((c) => fit(c, this.scenario))); // best you COULD have played this turn
    const card = this.hand.splice(idx, 1)[0];
    const f = fit(card, this.scenario);
    const success = clamp(f + (this.rng() - 0.5) * 0.3, 0, 1); // good fit usually succeeds, with variance
    const choice: Choice = { cardId: card.id, tags: card.tags, fit: f, bestFit, success, scenario: this.scenario.label };
    this.log.push(choice);
    this.discard.push(card);
    // FLYWHEEL: play a card WELL and you get better at that style — a copy joins your deck, so
    // your hand skews toward your identity over the career. This is what creates specialisation
    // (a fixed shared deck averages everyone out); your deck-shape IS your developing playstyle.
    // FLYWHEEL (capped): a good play compounds — a copy joins your deck so your hand skews to your
    // identity — but only up to FLYWHEEL_CAP copies per card, so decks skew without running away.
    const got = this.copies.get(card.id) ?? 0;
    if (success >= 0.6 && got < FLYWHEEL_CAP) { this.discard.push({ ...card }); this.copies.set(card.id, got + 1); }
    this.turn++;
    if (this.turn >= SCENARIOS_PER_SEASON * SEASONS_TO_GRADUATE) { this.finished = true; return choice; }
    this.season = 1 + Math.floor(this.turn / SCENARIOS_PER_SEASON);
    this.refillHand();
    this.scenario = makeScenario(this.rng, this.turn);
    return choice;
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
export interface CareerPlayer { attrs: CareerPlayerAttrs; role: Role; overall: number }

// each stat's source tags (≥1 each); keeping has none (GK is a future dedicated path)
const STAT_SOURCES: Record<keyof CareerPlayerAttrs, Tag[]> = {
  pace: ['stamina', 'flair'], strength: ['aggression', 'stamina'], stamina: ['stamina'],
  passing: ['creativity', 'teamwork'], shooting: ['flair', 'composure'], tackling: ['aggression'],
  positioning: ['teamwork', 'composure'], workrate: ['stamina', 'teamwork'], keeping: [], setPiece: ['composure', 'creativity'],
  composure: ['composure'], aggression: ['aggression'], creativity: ['creativity'], teamwork: ['teamwork'], leadership: ['leadership'],
};
const BASELINE = 7, SPREAD = 12, PEAK = 1.5;

export function deriveStats(log: Choice[], seed: number): CareerPlayerAttrs {
  const rng = mulberry32(seed ^ 0x9e3779b9);
  const freq = Object.fromEntries(TAGS.map((t) => [t, 0])) as Record<Tag, number>;
  for (const c of log) for (const t of c.tags) freq[t] += 1;
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
    const raw = (BASELINE + peaked * SPREAD) * magnitude + noise;
    out[stat] = clamp(Math.round(raw), 1, 20);
  }
  out.keeping = clamp(Math.round(4 + (rng() - 0.5) * 3), 1, 8); // outfield keeper skill: low by design
  return out;
}

/** Derive an outfield role from the finished stat sheet (GK is a future dedicated career path). */
export function deriveRole(a: CareerPlayerAttrs): Role {
  const fw = a.shooting + a.pace + a.composure + a.creativity * 0.5;
  const mf = a.passing + a.creativity + a.teamwork + a.stamina * 0.5;
  const df = a.tackling + a.aggression + a.strength + a.positioning * 0.5;
  return fw >= mf && fw >= df ? 'FW' : mf >= df ? 'MF' : 'DF';
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

/** Finish a career log into a complete Player (attrs + role + overall). */
export function graduate(log: Choice[], seed: number): CareerPlayer {
  const attrs = deriveStats(log, seed);
  const role = deriveRole(attrs);
  return { attrs, role, overall: careerOverall(attrs, role) };
}

// ── balance helper: auto-play a career under a "style" policy (picks the best hand card) ──
export interface Style { name: string; pref: Partial<Record<Tag, number>>; skill: number }
export function simCareer(seed: number, style: Style): CareerPlayer {
  const career = new Career(seed);
  const rng = mulberry32(seed ^ 0x1234567);
  while (!career.finished) {
    const { hand, scenario } = career.current();
    // STYLE drives card choice (→ shape); SKILL only sharpens how much you also weigh fit (→ magnitude).
    // pref dominates so a style always specialises; a skilled player picks the best-fitting of their
    // style's cards → higher success → higher magnitude. Small noise breaks ties deterministically.
    let best = hand[0], bestScore = -Infinity;
    for (const c of hand) {
      const pref = c.tags.reduce((s, t) => s + (style.pref[t] ?? 0), 0);
      // style (pref) keeps shape; skill scales how strongly you also TIME for fit → magnitude
      const score = pref * 2 + style.skill * 3 * fit(c, scenario) + rng() * 0.05;
      if (score > bestScore) { bestScore = score; best = c; }
    }
    career.play(best.id);
  }
  return graduate(career.log, seed);
}
