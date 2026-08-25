// Career Sim — Layer 1 prototype. A turn-based card game that DEVELOPS a player:
// seeded scenarios each demand certain playing-style tags; you play a card from your
// hand; how your CHOICES pattern out becomes the player's stat SHAPE (playstyle) and
// how WELL you played becomes the MAGNITUDE. Fully deterministic (seeded, no Date.now/
// Math.random) so a career is a pure function of its choices — verifiable on-chain later.
//
// This module is intentionally standalone (its own RNG) so it can be prototyped and
// tuned before the PlayerAttrs v2 schema is frozen. See docs/two-layer-architecture.md.

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

// ── style tags: the vocabulary that links card-play to stats ──
export type Tag = 'composure' | 'aggression' | 'creativity' | 'teamwork' | 'leadership' | 'stamina' | 'flair';
export const TAGS: Tag[] = ['composure', 'aggression', 'creativity', 'teamwork', 'leadership', 'stamina', 'flair'];

export interface Card { id: string; name: string; tags: Tag[] }
// A starter hand — cards are multi-tag so choices express a *blend* of styles.
export const STARTER_DECK: Card[] = [
  { id: 'cool-finish', name: 'Cool Finish', tags: ['composure', 'flair'] },
  { id: 'killer-ball', name: 'Killer Ball', tags: ['creativity', 'teamwork'] },
  { id: 'crunch-tackle', name: 'Crunching Tackle', tags: ['aggression'] },
  { id: 'press-trap', name: 'Press & Trap', tags: ['aggression', 'teamwork', 'stamina'] },
  { id: 'stepover', name: 'Stepover', tags: ['flair', 'creativity'] },
  { id: 'rally', name: 'Rally the Team', tags: ['leadership', 'teamwork'] },
  { id: 'hold-up', name: 'Hold-up Play', tags: ['teamwork', 'composure'] },
  { id: 'lung-buster', name: 'Lung-buster Run', tags: ['stamina', 'flair'] },
  { id: 'calm-head', name: 'Calm Head', tags: ['composure', 'leadership'] },
  { id: 'no-look', name: 'No-look Pass', tags: ['creativity', 'flair'] },
  { id: 'dark-arts', name: 'Dark Arts', tags: ['aggression', 'leadership'] },
  { id: 'box-to-box', name: 'Box-to-Box', tags: ['stamina', 'teamwork'] },
];

// ── scenarios: each match/social/training moment demands a weighted mix of tags ──
export interface Scenario { id: string; kind: 'match' | 'social' | 'training'; demand: Partial<Record<Tag, number>> }
const KINDS: Scenario['kind'][] = ['match', 'match', 'match', 'social', 'training']; // matches dominate

/** A seeded scenario demanding 1–3 tags with weights summing to 1. */
export function makeScenario(rng: () => number, i: number): Scenario {
  const kind = KINDS[Math.floor(rng() * KINDS.length)];
  const n = 1 + Math.floor(rng() * 3);
  const pool = [...TAGS].sort(() => rng() - 0.5).slice(0, n);
  const raw = pool.map(() => 0.3 + rng());
  const sum = raw.reduce((a, b) => a + b, 0);
  const demand: Partial<Record<Tag, number>> = {};
  pool.forEach((t, k) => { demand[t] = raw[k] / sum; });
  return { id: `sc${i}`, kind, demand };
}

/** How well a card's tags satisfy a scenario's demand, 0..1. */
export function fit(card: Card, sc: Scenario): number {
  let f = 0;
  for (const t of card.tags) f += sc.demand[t] ?? 0;
  return clamp(f, 0, 1);
}

export interface Choice { cardId: string; tags: Tag[]; fit: number; success: number }

/** A "career style": a bias toward certain tags (the SHAPE the player will grow into) plus a
 *  skill 0..1 (how reliably they pick the best-fitting card for the moment → MAGNITUDE). */
export interface Style { name: string; pref: Partial<Record<Tag, number>>; skill: number }

/** Play one card for a scenario under a style. With prob=skill, pick the card that best fits
 *  THIS scenario (weighted by preference); otherwise pick by raw preference (style over fit). */
function pickCard(sc: Scenario, style: Style, rng: () => number): Card {
  const prefScore = (c: Card) => c.tags.reduce((s, t) => s + (style.pref[t] ?? 0), 0);
  const skilled = rng() < style.skill;
  let best = STARTER_DECK[0], bestScore = -Infinity;
  for (const c of STARTER_DECK) {
    const score = skilled ? fit(c, sc) * 2 + prefScore(c) : prefScore(c) + rng() * 0.01;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return best;
}

/** Play a full career (many scenarios) under a style; returns the choice log. */
export function playCareer(seed: number, style: Style, scenarios = 120): Choice[] {
  const rng = mulberry32(seed);
  const log: Choice[] = [];
  for (let i = 0; i < scenarios; i++) {
    const sc = makeScenario(rng, i);
    const card = pickCard(sc, style, rng);
    const f = fit(card, sc);
    // success = how well the card fit + a little variance; a good fit usually succeeds
    const success = clamp(f + (rng() - 0.5) * 0.3, 0, 1);
    log.push({ cardId: card.id, tags: card.tags, fit: f, success });
  }
  return log;
}

// ── derivation: compress a career log into a stat sheet ──
// SHAPE = which tags you played most (tag frequency → which stats grow).
// MAGNITUDE = your average success (how high those stats go).
// + regression toward the mean + seeded noise so identical styles ≠ identical players.
export type CareerStats = {
  composure: number; aggression: number; creativity: number; teamwork: number; leadership: number;
  stamina: number; pace: number; shooting: number; tackling: number; passing: number;
};
// which tags feed which stats (each stat has ≥1 source tag)
const STAT_SOURCES: Record<keyof CareerStats, Tag[]> = {
  composure: ['composure'], aggression: ['aggression'], creativity: ['creativity'],
  teamwork: ['teamwork'], leadership: ['leadership'], stamina: ['stamina'],
  pace: ['stamina', 'flair'], shooting: ['flair', 'composure'], tackling: ['aggression'],
  passing: ['creativity'],
};
const BASELINE = 7;   // regression anchor
const SPREAD = 12;    // how far a dominant tag pushes its stat above baseline
const PEAK = 1.5;     // >1 makes the shape peaked: heavily-played tags rise, the rest regress

export function deriveStats(log: Choice[], seed: number): CareerStats {
  const rng = mulberry32(seed ^ 0x9e3779b9);
  // tag frequency (shape) — normalized to the most-played tag
  const freq: Record<Tag, number> = Object.fromEntries(TAGS.map((t) => [t, 0])) as Record<Tag, number>;
  for (const c of log) for (const t of c.tags) freq[t] += 1;
  const maxFreq = Math.max(1, ...TAGS.map((t) => freq[t]));
  const norm: Record<Tag, number> = Object.fromEntries(TAGS.map((t) => [t, freq[t] / maxFreq])) as Record<Tag, number>;
  // magnitude (skill) — average success scales the whole sheet
  const avgSuccess = log.reduce((s, c) => s + c.success, 0) / Math.max(1, log.length);
  const magnitude = 0.75 + 0.45 * avgSuccess; // 0.75x (poor) .. 1.2x (elite)

  const out = {} as CareerStats;
  for (const stat of Object.keys(STAT_SOURCES) as (keyof CareerStats)[]) {
    const src = STAT_SOURCES[stat];
    const shape = src.reduce((s, t) => s + norm[t], 0) / src.length;   // 0..1 how much this stat was "played"
    const peaked = Math.pow(shape, PEAK);                              // peaked: dominant tags rise, rest regress
    const noise = (rng() - 0.5) * 3;                                   // seeded ±1.5
    const raw = (BASELINE + peaked * SPREAD) * magnitude + noise;
    out[stat] = clamp(Math.round(raw), 1, 20);
  }
  return out;
}

/** A rough overall for the prototype (mean of stats). */
export function careerOverall(s: CareerStats): number {
  const vals = Object.values(s);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}
