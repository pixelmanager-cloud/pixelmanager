// ── HOUSE RENOWN — what the FAMILY is worth, across every generation of it ──────────────────────────
//
// The game already scores two things and neither of them is the dynasty. `prestige.ts` scores the GAFFER
// — one human manager's career. `legacy.ts` scores ONE MAN's playing career. Nothing scored the name
// itself, which is odd in a game whose whole subject is a bloodline, and it left the dynasty with history
// but no spine: you accumulated generations without ever being told what they added up to, or measured
// against anyone.
//
// Renown is that number. Three properties, all deliberate:
//
//   IT ONLY EVER GOES UP. A bad generation is a generation that added little, never one that took
//   something away. What your great-grandfather did is done, and the game should not be able to
//   retroactively make him smaller.
//
//   THE BRANCHES COUNT. A brother you passed over still carried the name, and what he did with it still
//   accrues to the house — at a discount, because you did not live it. This falls straight out of the
//   branching build and is the strongest argument the tree has for existing: the sons you did not take
//   are not decoration, they are renown you earned by having them.
//
//   LENGTH COMPOUNDS. Generations are scored quadratically, so a line that simply keeps going is worth
//   something that no single great career can match. That is the difference between a famous player and
//   a famous family, and it is the whole reason to play a dynasty rather than a career.
//
// Pure and deterministic — no wall-clock, no rng. Given the same people it returns the same number, which
// is what lets the rival houses be scored on the identical scale.

/** One person's record, reduced to what renown cares about. Everything here is already on a Token. */
export interface HouseMember {
  name: string;
  generation: number;
  /** false for a brother the player passed over — his contribution is discounted, not discarded. */
  played: boolean;
  peakOverall: number;
  caps: number;
  leagueTitles: number;
  cups: number;
  seasons: number;
  bigNights: number;
}

/** What a passed-over branch contributes, as a fraction of what a played career would. He carried the
 *  name and the name got the credit — but you did not live it, so it is not worth the same. */
export const BRANCH_SHARE = 0.55;

/** Flat credit for a branch that reached professional football at all, on top of the discounted career.
 *
 *  This exists because scaling a brother's whole contribution by his ability got the reasoning wrong. A
 *  passed-over brother is weaker than the line you developed by hand — no card career, no player-driven
 *  growth — so a pure percentage compounded a discount onto a smaller number and left the branches worth
 *  4% of the house. Measured, that made passing a brother over cost nothing either way, which defeats the
 *  point of having brothers. What he contributes is mostly that THE NAME WAS IN THE GAME, and that is
 *  worth the same whether he was very good or merely good. */
export const BRANCH_FLAT = 60;

/** Renown from ONE man's playing career. Peak ability dominates, because that is what a name is built on;
 *  silverware, caps and longevity accrue on top of it. */
export function manRenown(m: HouseMember): number {
  // Squared above the journeyman line: the gap between a good player and a great one is not linear, and a
  // house is made by the greats. Below 8 he contributes nothing but his generation.
  const peak = m.peakOverall > 8 ? Math.pow(m.peakOverall - 8, 2) * 4 : 0;
  const raw = peak
    + m.caps * 3
    + m.leagueTitles * 100
    + m.cups * 40
    + m.seasons * 8
    + m.bigNights * 6;
  if (m.played) return Math.round(raw);
  // A branch that never made it as a professional adds nothing but his place on the tree.
  return Math.round(raw * BRANCH_SHARE) + (m.peakOverall >= 8 ? BRANCH_FLAT : 0);
}

/** Renown from the LINE itself, independent of any one career. Quadratic, so continuity compounds. */
export function lineageRenown(generations: number): number {
  const g = Math.max(0, generations);
  return Math.round(g * g * 25);
}

export interface HouseTier { name: string; at: number; icon: string }
/** Where a house stands. The ladder is roughly geometric, so a strong generation always moves you and a
 *  weak one never undoes you — and the top rung is the game's own name, which is the point of the climb. */
export const HOUSE_TIERS: HouseTier[] = [
  // Thresholds are SET FROM THE MEASURED CURVE (tools/playtest/renown_curve.ts), not chosen by eye. The
  // first pass put Royalty at generation 21 for an ordinary dynasty — a top rung nobody would ever stand
  // on. These land it around 13, and a line that keeps producing greats gets there in half that, which is
  // the right shape: excellence shortens the climb, persistence still completes it.
  { name: 'Unknown Name',      at: 0,     icon: '·' },
  { name: 'Known in the Parks', at: 400,  icon: '🌱' },
  { name: 'A Local Name',      at: 1100,  icon: '🏠' },
  { name: 'A Football Family', at: 1900,  icon: '👨‍👦' },
  { name: 'A Respected House', at: 3400,  icon: '🛡️' },
  { name: 'A Great Name',      at: 5300,  icon: '⚜️' },
  { name: 'A Footballing Dynasty', at: 8200, icon: '🌳' },
  { name: 'Royalty',           at: 12000, icon: '👑' },
];

export function houseTier(renown: number): HouseTier {
  let out = HOUSE_TIERS[0];
  for (const t of HOUSE_TIERS) if (renown >= t.at) out = t;
  return out;
}
/** Points to the next rung, and how far along it you are (0..1). Null once the house is Royalty. */
export function nextHouseTier(renown: number): { tier: HouseTier; need: number; progress: number } | null {
  const idx = HOUSE_TIERS.findIndex((t) => renown < t.at);
  if (idx < 0) return null;
  const from = HOUSE_TIERS[idx - 1]?.at ?? 0;
  const tier = HOUSE_TIERS[idx];
  return { tier, need: tier.at - renown, progress: (renown - from) / (tier.at - from) };
}

export interface HouseStanding {
  renown: number;
  tier: HouseTier;
  generations: number;
  /** The single biggest earner in the family's history — the man the name is really built on. */
  greatest: { name: string; points: number } | null;
  /** How much of the total came from branches the player never played. */
  fromBranches: number;
}

/** Score a whole house. `generations` is counted as DISTINCT generation numbers present, so a wide family
 *  is not mistaken for a long one — breadth is scored through its members, length through the line. */
export function houseRenown(members: HouseMember[]): HouseStanding {
  let total = 0, fromBranches = 0;
  let greatest: { name: string; points: number } | null = null;
  for (const m of members) {
    const p = manRenown(m);
    total += p;
    if (!m.played) fromBranches += p;
    if (p > 0 && (!greatest || p > greatest.points)) greatest = { name: m.name, points: p };
  }
  const generations = new Set(members.map((m) => m.generation)).size;
  total += lineageRenown(generations);
  return { renown: total, tier: houseTier(total), generations, greatest, fromBranches };
}


/** The career a PASSED-OVER BROTHER had offscreen.
 *
 *  He is a real professional somewhere — the spec asks for a brother who amounts to more than a stat line
 *  (§3, unimplemented in every other respect: nothing mints him into a squad) — but the game never
 *  simulates his seasons, so without this he sits on the Family Record with a peak of zero and contributes
 *  nothing. That would make the branches worthless in exactly the place the design says they should count.
 *  Derived from his own seed and the family's standing, so it is stable across reloads and a strong
 *  bloodline's brothers are good players too. */
export function branchCareer(branchSeed: number, pedigree: number): { peakOverall: number; caps: number; leagueTitles: number; cups: number; seasons: number; bigNights: number } {
  let h = (branchSeed ^ 0x2c1b3c6d) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
  const r = ((h ^ (h >>> 13)) >>> 0) / 4294967296;
  const r2 = ((Math.imul(h ^ (h >>> 7), 0xc2b2ae35) >>> 0) >>> 0) / 4294967296;
  // Centred a little below the played line — he had no card career and nobody was steering him — but a
  // good family still produces good brothers, so pedigree lifts the whole band.
  const peak = Math.round(8 + r * 8 + Math.max(0, Math.min(1, pedigree)) * 4);
  return {
    peakOverall: peak,
    caps: peak >= 15 ? Math.round(r2 * 40) : peak >= 12 ? Math.round(r2 * 12) : 0,
    leagueTitles: peak >= 17 ? (r2 > 0.6 ? 1 : 0) : 0,
    cups: peak >= 15 && r2 > 0.7 ? 1 : 0,
    seasons: peak >= 13 ? 10 : peak >= 10 ? 8 : 5,
    bigNights: Math.round(peak / 3),
  };
}


// ── WHAT THE NAME OPENS ────────────────────────────────────────────────────────────────────────────
//
// Renown that only ranks you is a scoreboard, and scoreboards stop mattering. These are the three places
// it bites, chosen because each one is felt in a different part of the game — the card career, the
// transfer window, and the club itself.
//
// All three are DELIBERATELY SUBLINEAR. A dynasty that is already winning must not be handed the tools to
// win by more; the point of a famous name is that doors open, not that the game gets easier. Each effect
// therefore rises fast at the bottom of the ladder, where it changes a struggling house's prospects, and
// flattens hard at the top, where the house needs no help.
// The 3500 is set against the LADDER, not chosen for feel: at 6000 the curve was still climbing steeply
// when the ladder ran out, so roughly two-thirds of every effect landed on houses that had already won.
const curve = (renown: number, cap: number) => cap * (1 - Math.exp(-Math.max(0, renown) / 3500));

/** PEDIGREE the name buys an heir, added to what he inherited. A famous surname gets a boy seen by the
 *  right people at the right age — it does not make him better, it makes him NOTICED, which in this game
 *  is what pedigree already means. Caps at +0.18 on a 0-1 scale. */
export function renownPedigree(renown: number): number {
  return Math.round(curve(renown, 0.18) * 1000) / 1000;
}

/** Multiplier on incoming BIDS for your star. Big clubs pay over the odds for a name their supporters
 *  already know. Caps at +45%. */
export function renownBidMult(renown: number): number {
  return Math.round((1 + curve(renown, 0.45)) * 100) / 100;
}

/** Extra coins on the season prize — the commercial pull of a famous house. It lifts that prize and
 *  nothing else; this line used to add "in sponsorship and gate", the false mechanic F-186 struck off the
 *  Houses panel and missed here (client/src/api.ts's `spSeasonReward` shows what reaches the treasury raw).
 *  Caps at +40%, which is real money without ever being the reason you can afford a squad. */
export function renownIncomeMult(renown: number): number {
  return Math.round((1 + curve(renown, 0.40)) * 100) / 100;
}
