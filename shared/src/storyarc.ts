// ── STORY ARCS: multi-turn, branching, consequential storylines that make each career unique ─────────
// A career threads a DIFFERENT subset of these (seeded probability + trigger conditions), each unfolds over
// a few turns, branches on the player's choices, and leaves lasting marks (stats, meters, fame, earnings,
// form) — so no two playthroughs feel the same. Deterministic: arc selection + progression are pure
// functions of (seed, turn, prior choices), so the Career's snapshot-replay stays byte-identical.
import type { Tag } from './career.js';

/** What a chosen branch does to the player — every field optional; applied on top of normal development. */
export interface ArcEffect {
  energy?: number; form?: number; earnings?: number; market?: number; greed?: number;
  meters?: Partial<Record<string, number>>;      // relationship nudges (authority/family/peers/school/agent/fans/sponsors/partner)
  attr?: Partial<Record<Tag, number>>;            // a small, permanent development lean (valid Tags only)
  injury?: boolean;                               // marks a serious injury (lasting fragility)
  tag?: string;                                   // a short state flag remembered on the career (opens/closes later beats)
}
export interface ArcChoice {
  id: string; label: string; desc: string;
  outcome: string;                                // the resolution prose shown after picking
  effect?: ArcEffect;
  next?: string | null;                           // next beat id (branch), or null/undefined = the arc ends here
  requires?: string;                              // (reserved) only offered if this state flag was set earlier in the arc
}
export interface ArcBeat { id: string; prompt: string; choices: ArcChoice[] }
export interface StoryArc {
  id: string; title: string; icon: string;
  category: 'saga' | 'crisis' | 'triumph' | 'relationship' | 'signature' | 'offpitch';
  minTurn: number; maxTurn: number;               // when it may start (turn = career age progression, 0..~200)
  weight: number;                                 // relative likelihood among eligible arcs
  rare?: boolean;                                 // a low-probability "signature" one-off
  first: string;                                  // the opening beat id
  beats: Record<string, ArcBeat>;
}

// ── the arc library ───────────────────────────────────────────────────────────────────────────────
// Arcs live in per-category files under ./storyarcs/ (so authoring scales without merge conflicts) and are
// aggregated here. {RIVAL} is substituted with the career's seeded academy nemesis so stories feel personal.
import { SAGA_ARCS } from './storyarcs/saga.js';
import { CRISIS_ARCS } from './storyarcs/crisis.js';
import { SIGNATURE_ARCS } from './storyarcs/signature.js';
import { RELATIONSHIP_ARCS } from './storyarcs/relationship.js';
import { TRIUMPH_ARCS } from './storyarcs/triumph.js';
import { OFFPITCH_ARCS } from './storyarcs/offpitch.js';
import { YOUTH_ARCS } from './storyarcs/youth.js';
import { YOUTH_FAMILY_ARCS } from './storyarcs/youth_family.js';
import { YOUTH_MATES_ARCS } from './storyarcs/youth_mates.js';
import { YOUTH_PITCH_ARCS } from './storyarcs/youth_pitch.js';
import { YOUTH_COACH_ARCS } from './storyarcs/youth_coach.js';
import { YOUTH_WORLD_ARCS } from './storyarcs/youth_world.js';
import { YOUTH_BODY_ARCS } from './storyarcs/youth_body.js';
import { YOUTH_AWAY_ARCS } from './storyarcs/youth_away.js';
import { YOUTH_DOUBT_ARCS } from './storyarcs/youth_doubt.js';
import { YOUTH_JOY_ARCS } from './storyarcs/youth_joy.js';
import { YOUTH_SEASON_ARCS } from './storyarcs/youth_season.js';
export const ARCS: StoryArc[] = [...SAGA_ARCS, ...CRISIS_ARCS, ...SIGNATURE_ARCS, ...RELATIONSHIP_ARCS, ...TRIUMPH_ARCS, ...OFFPITCH_ARCS,
  // the childhood library — see storyarcs/youth*.ts (Grassroots + Academy, ages 10-14)
  ...YOUTH_ARCS, ...YOUTH_FAMILY_ARCS, ...YOUTH_MATES_ARCS, ...YOUTH_PITCH_ARCS, ...YOUTH_COACH_ARCS, ...YOUTH_WORLD_ARCS,
  ...YOUTH_BODY_ARCS, ...YOUTH_AWAY_ARCS, ...YOUTH_DOUBT_ARCS, ...YOUTH_JOY_ARCS, ...YOUTH_SEASON_ARCS];

const arcById = new Map(ARCS.map((a) => [a.id, a]));
export const arcByIdOf = (id: string): StoryArc | undefined => arcById.get(id);

/** Pure 32-bit hash → [0,1). Mirrors the technique used for life/rival gating (no rng draw). */
function h01(a: number, b: number, c = 0x9e3779b1): number {
  let h = (a ^ Math.imul(b + 0x6d2b79f5, 0x85ebca6b) ^ Math.imul(c, 0xc2b2ae35)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0; h = Math.imul(h ^ (h >>> 13), 0x297a2d39) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** How many story arcs a single career should surface — the career is cut into this many equal slots and
 *  each fires one arc, so the storytelling is paced evenly from age 10 to graduation. */
export const ARCS_PER_CAREER = 20;

/** Should a NEW arc start at this turn? Deterministic per (seed, turn); respects each arc's window, avoids
 *  repeats (fired set), and keeps arcs rare enough to feel special. Returns the arc id, or null. */
export function pickArcStart(seed: number, turn: number, fired: ReadonlySet<string>, totalTurns = 120): string | null {
  const eligible = ARCS.filter((a) => !fired.has(a.id) && turn >= a.minTurn && turn <= a.maxTurn);
  if (!eligible.length) return null;
  // EVEN SPACING, not a flat per-turn dice roll. A constant probability clusters by luck — three arcs in one
  // chapter, then twenty barren turns — which reads as feast-or-famine. Instead the career is cut into
  // ARCS_PER_CAREER equal SLOTS and each slot fires exactly one arc, at a seed-jittered turn inside it. That
  // guarantees a steady drumbeat of story from the first chapter to the last while staying fully
  // deterministic (pure hash of seed+slot — no rng draw, so replay is unaffected).
  const spacing = totalTurns / ARCS_PER_CAREER;
  const slot = Math.floor(turn / spacing);
  const slotStart = slot * spacing;
  const fireTurn = Math.floor(slotStart + h01(seed >>> 0, slot * 7717 + 3, 0x51a3) * spacing);
  // Fire at the jittered turn — but SELF-CORRECT: `fired.size <= slot` means the career is behind schedule
  // (an earlier slot found nothing eligible in its window), so the next turn with something eligible catches
  // up instead of silently losing that slot's story. Once a slot has delivered, fired.size outruns the slot
  // index and the gate closes until the next one.
  if (turn < fireTurn || fired.size > slot) return null;
  // CATEGORY-BALANCED PICK: choose a CATEGORY first, then an arc inside it. Picking straight from the flat
  // weighted pool let one category crowd out the rest — relationship arcs (widest windows, earliest start)
  // averaged ~4 per career while SIGNATURE arcs, all 34 of which carry `rare`, totalled 3.5% of the pool and
  // averaged 0.3, so most playthroughs never saw a single one. Balancing by category makes every playthrough
  // range across saga/crisis/signature/relationship/triumph/offpitch, which is where the variety is felt.
  const byCat = new Map<string, StoryArc[]>();
  for (const a of eligible) { const l = byCat.get(a.category) ?? []; l.push(a); byCat.set(a.category, l); }
  const cats = [...byCat.keys()].sort(); // sorted → deterministic regardless of ARCS order
  const catW = cats.map((c) => Math.sqrt(byCat.get(c)!.length));
  const catTotal = catW.reduce((s, w) => s + w, 0);
  let cr = h01(seed >>> 0, turn * 613 + 29, 0x7f11) * catTotal;
  let cat = cats[cats.length - 1];
  for (let i = 0; i < cats.length; i++) { cr -= catW[i]; if (cr <= 0) { cat = cats[i]; break; } }
  const pool = byCat.get(cat)!;
  // inside the category, `rare` still means rare — it just no longer suppresses a whole category
  const weights = pool.map((a) => a.weight * (a.rare ? 0.4 : 1));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = h01(seed >>> 0, turn * 977 + 13, 0x2bd1) * total;
  for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i].id; }
  return pool[0].id;
}

/** Substitute story placeholders (currently the seeded rival name) into a beat's prose. */
export function fillArcText(text: string, rivalName: string): string {
  return text.replace(/\{RIVAL\}/g, rivalName);
}
