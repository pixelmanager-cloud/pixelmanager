// ── THE BRANCHING BLOODLINE: several heirs per generation ──────────────────────────────────────────
//
// A one-child-per-generation dynasty is a straight line, and a straight line is a boring family tree. This
// mints SIBLINGS: two or three heirs the player chooses between at succession, so the tree actually branches
// and the choice of who carries the name is a real decision.
//
// The design problem is the interesting part. Three heirs who are identical are not a choice; three heirs
// who are unrelated strangers break the whole premise of a bloodline. Real siblings are CORRELATED BUT
// DISTINCT — recognisably their father's sons, and visibly different from each other, because each one
// inherits a different sample of the same inheritance.
//
// So each heir is built from three layers:
//   1. FAMILY RESEMBLANCE — one physical attribute runs strongly in this bloodline (the family's pace, or
//      its strength). Every sibling inherits it hard. This is what makes them read as brothers.
//   2. INDEPENDENT SAMPLING — the other attributes are drawn per-child, biased toward the father but rolled
//      separately, so one brother gets his engine and another gets his frame.
//   3. TEMPERAMENT — personality is rolled per-child and deliberately never inherited. Two brothers raised
//      the same way turning out completely different people is true to life, and it is the difference the
//      player will actually feel across a whole career.
//
// Everything here is a PURE FUNCTION of (parent, parentSeed, childIndex) — no rng draws, no wall clock — so
// an heir list is identical on every replay and costs nothing to recompute. (PT-404 follow-on / branching)
import { inheritGenes, rollPersonality, type Genes } from './career.js';
import { mintSquadPlayer } from './teams.js';
import type { Player, Role } from './types.js';

export const MAX_HEIRS = 3;

/** How many sons a generation produces: 1, 2 or 3, weighted 20/40/40. A generation with a single heir is
 *  DELIBERATE — it is lifelike, and it makes the generations that do offer a choice feel like an event. The
 *  UI must say so in words, or a one-heir succession reads as a bug rather than a fact of the family. */
export function heirCount(parentSeed: number, generation = 0): number {
  let h = (parentSeed ^ Math.imul(generation + 1, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  const r = ((h ^ (h >>> 16)) >>> 0) % 100;
  return r < 20 ? 1 : r < 60 ? 2 : 3;
}

/** Deterministic per-child seed. Mixed hard rather than added, so sibling 0 and sibling 1 do not land on
 *  neighbouring seeds and produce near-identical rolls. */
export function heirSeed(parentSeed: number, childIndex: number): number {
  let h = (parentSeed ^ Math.imul(childIndex + 1, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 2246822507) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** Which physical attribute runs in THIS family. Fixed per bloodline, not per child — that is the point. */
export function familyTrait(parentSeed: number): keyof Genes {
  const keys: Array<keyof Genes> = ['pace', 'strength', 'stamina'];
  return keys[(Math.imul(parentSeed >>> 3, 2654435761) >>> 0) % keys.length];
}

export interface Heir {
  index: number;
  seed: number;
  genes: Genes;
  personality: string;
  /** the attribute that runs in the family — surfaced so the heir-selection screen can say so */
  familyTrait: keyof Genes;
}

/** The heirs a retiring player leaves behind. `keepPct` is how strongly the father shows through on the
 *  NON-family attributes; the family trait is inherited far harder (see FAMILY_KEEP). */
export function mintHeirs(parent: Genes, parentSeed: number, count = MAX_HEIRS, ceilingLift = 0): Heir[] {
  const trait = familyTrait(parentSeed);
  // The variance is controlled HERE rather than inside inheritGenes, because that function applies a fixed
  // ±2 jitter on every call: `keepPct` governs how far a son regresses from his FATHER, and says nothing
  // about how much two BROTHERS differ. Rolling it per child made siblings vary on the family attribute
  // almost as much as on anything else (1.36 vs 1.42) — the resemblance was not actually being modelled.
  //
  // So each attribute gets a FAMILY MEAN, shared by every sibling and rolled once, plus a per-child
  // deviation whose SIZE is the design lever: tiny on the family attribute (brothers are alike), wide on
  // everything else (brothers are different in parts).
  const POP_FLOOR = 7, POP_CEIL = 13;
  // The family attribute regresses far LESS from the father than the others do — that is what makes it the
  // family's, rather than merely a trait the brothers happen to share.
  const KEEP_FAMILY = 0.86, KEEP_OTHER = 0.50;
  const FAMILY_DEV = 0.6;                 // brothers barely differ on the family attribute
  const OTHER_DEV = 3.2;                  // and differ a lot on the rest
  const h01 = (a: number, b: number) => {
    let x = (a ^ Math.imul(b + 1, 0x27d4eb2d)) >>> 0;
    x = Math.imul(x ^ (x >>> 15), 2246822507) >>> 0;
    x = Math.imul(x ^ (x >>> 13), 3266489909) >>> 0;
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  };
  const keys: Array<keyof Genes> = ['pace', 'strength', 'stamina'];
  const famFloor: Record<string, number> = {}, famCeil: Record<string, number> = {};
  for (const k of keys) {
    const keep = k === trait ? KEEP_FAMILY : KEEP_OTHER;
    famFloor[k] = parent[k].floor * keep + POP_FLOOR * (1 - keep);
    famCeil[k] = parent[k].ceiling * keep + POP_CEIL * (1 - keep) + ceilingLift;
  }
  const out: Heir[] = [];
  for (let i = 0; i < count; i++) {
    const seed = heirSeed(parentSeed, i);
    const genes = {} as Genes;
    for (let ki = 0; ki < keys.length; ki++) {
      const k = keys[ki];
      const dev = k === trait ? FAMILY_DEV : OTHER_DEV;
      const f = Math.round(famFloor[k] + (h01(seed, ki) - 0.5) * 2 * dev);
      const c = Math.round(famCeil[k] + (h01(seed, ki + 32) - 0.5) * 2 * dev);
      const floor = Math.max(1, Math.min(15, f));
      genes[k] = { floor, ceiling: Math.max(floor + 3, Math.min(20, c)) };
    }
    // Two brothers coming out byte-identical is rare (bands are quantised, so it happens) but it is exactly
    // the thing this feature exists to avoid — a choice between two identical heirs is not a choice. Nudge
    // the later one until he is his own player.
    let g = genes;
    for (let bump = 1; out.some((o) => JSON.stringify(o.genes) === JSON.stringify(g)) && bump <= 3; bump++) {
      const k = keys[(i + bump) % keys.length];
      const floor = Math.max(1, Math.min(15, g[k].floor + bump));
      g = { ...g, [k]: { floor, ceiling: Math.max(floor + 3, Math.min(20, g[k].ceiling + bump)) } } as Genes;
    }
    out.push({ index: i, seed, genes: g, personality: rollPersonality(seed).id, familyTrait: trait });
  }
  return out;
}


/** An unplayed brother as a FULL PLAYER — the user's requirement, in their words: "they become full players,
 *  the same as other generated players with their own stats, mentalities, characteristics, etc."
 *
 *  So he goes through `mintSquadPlayer`, the same path every rich squad player takes: 15 stats, a
 *  personality, earned traits, an age, durability and morale. He is not a summary row and not a card career.
 *  His three PHYSICAL attributes are then pulled toward the gene bands he actually inherited, so the family
 *  attribute shows up in the player you can scout, sign and play — otherwise the genetics would be invisible
 *  the moment he walked onto a pitch. */
export function heirAsPlayer(heir: Heir, id: string, role: Role, age: number): Player {
  const mid = (k: keyof Genes) => (heir.genes[k].floor + heir.genes[k].ceiling) / 2;
  // his overall quality follows his inheritance rather than being independent of it
  const quality = Math.max(4, Math.min(18, Math.round((mid('pace') + mid('strength') + mid('stamina')) / 3)));
  const p = mintSquadPlayer(id, role, quality, heir.seed, age);
  const attrs: any = { ...p.attrs };
  for (const k of ['pace', 'strength', 'stamina'] as Array<keyof Genes>) {
    const band = heir.genes[k];
    // clamp the minted stat into his inherited band, so a fast family produces visibly fast brothers
    attrs[k] = Math.max(band.floor, Math.min(band.ceiling, Number(attrs[k] ?? 10)));
  }
  return { ...p, attrs };
}
