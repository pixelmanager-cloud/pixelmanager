// Club facilities — a persistent, per-club upgrade layer that gives clubs an
// identity beyond the squad. Four facilities, each leveled 1→5 with coins:
//   🏟️ Stadium       — home matchday income (the economy's coin FAUCET)
//   🏋️ Training Ground — less in-match fitness drain (NFT-safe per-match edge)
//   🎓 Youth Academy   — better Local Tryouts (bigger pool + quality upgrades)
//   🔭 Scouting HQ     — better scouting-network odds, cheaper trips, +trips
// All effects are deterministic numeric multipliers — no LLM, replay-safe.
export type FacilityKey = 'stadium' | 'training' | 'youth' | 'scouting';
export interface Facilities { stadium: number; training: number; youth: number; scouting: number }
export const FACILITY_KEYS: FacilityKey[] = ['stadium', 'training', 'youth', 'scouting'];
export const MAX_LEVEL = 5;
export const DEFAULT_FACILITIES: Facilities = { stadium: 1, training: 1, youth: 1, scouting: 1 };

/** Coins to REACH a given level (index by target level 2..5). */
const COST_TO_REACH: Record<number, number> = { 2: 250, 3: 550, 4: 1100, 5: 2000 };
/** Coins to go from `level` to `level+1`, or null if already maxed. */
export function upgradeCost(level: number): number | null {
  return level >= MAX_LEVEL ? null : COST_TO_REACH[level + 1] ?? null;
}

export const FACILITY_META: Record<FacilityKey, { icon: string; name: string; blurb: string }> = {
  stadium:  { icon: '🏟️', name: 'Stadium',        blurb: 'A bigger ground packs in more fans — every home match pays gate receipts. Winning at home, and in a higher division, pays more.' },
  training: { icon: '🏋️', name: 'Training Ground', blurb: 'Fitter legs. Your squad drains less over 90 minutes, so you fade less in the closing stages.' },
  youth:    { icon: '🎓', name: 'Youth Academy',   blurb: 'Home-grown talent. A better academy widens your Local Tryouts pool and raises the odds a walk-up is worth signing.' },
  scouting: { icon: '🔭', name: 'Scouting HQ',      blurb: 'A sharper scouting operation lifts every network trip: better odds, cheaper travel, and — at the top levels — extra trips per season.' },
};

// ── Effects (pure functions of level; level 1 is always the neutral baseline) ──

/** Home matchday income after a match you hosted. tierIdx 0..9; outcome per your result. */
export function stadiumIncome(level: number, tierIdx: number, outcome: 'win' | 'draw' | 'loss'): number {
  const resultMult = outcome === 'win' ? 1.5 : outcome === 'draw' ? 1.0 : 0.6;
  return Math.round(20 * level * (1 + tierIdx * 0.15) * resultMult);
}
/** Training-ground fitness-drain multiplier: 1.0 at L1 → 0.80 at L5 (fades less). */
export function trainingConditioning(level: number): number { return 1 - (level - 1) * 0.05; }
/** Youth academy: extra Local-Tryout slots (0 at L1-2, 1 at L3-4, 2 at L5). */
export function youthPoolBonus(level: number): number { return Math.floor((level - 1) / 2); }
/** Youth academy: chance a tryout walk-up is bumped up a rarity band (0 at L1 → 0.32 at L5). */
export function youthUpgradeChance(level: number): number { return (level - 1) * 0.08; }
/** Scouting HQ: hit-rate multiplier on network trips (1.0 at L1 → 1.20 at L5), stacks with scout tier. */
export function scoutHitMult(level: number): number { return 1 + (level - 1) * 0.05; }
/** Scouting HQ: trip-cost discount fraction (0 at L1 → 0.24 at L5). */
export function scoutCostDiscount(level: number): number { return (level - 1) * 0.06; }
/** Scouting HQ: extra scouting trips per season (0 at L1-2, 1 at L3-4, 2 at L5). */
export function scoutExtraTrips(level: number): number { return Math.floor((level - 1) / 2); }

/** A short human description of a facility's effect AT a given level (for the UI). */
export function effectAt(key: FacilityKey, level: number): string {
  switch (key) {
    case 'stadium':  return `Home gate ≈ ${20 * level}–${Math.round(20 * level * 2.35 * 1.5)} coins per match (by division & result)`;
    case 'training': return level === 1 ? 'No conditioning bonus yet' : `−${Math.round((1 - trainingConditioning(level)) * 100)}% fitness drain over a match`;
    case 'youth':    return level === 1 ? 'Standard walk-ups' : `+${youthPoolBonus(level)} tryout slot(s), ${Math.round(youthUpgradeChance(level) * 100)}% quality-upgrade chance`;
    case 'scouting': return level === 1 ? 'Standard trips' : `+${Math.round((scoutHitMult(level) - 1) * 100)}% odds, −${Math.round(scoutCostDiscount(level) * 100)}% cost${scoutExtraTrips(level) ? `, +${scoutExtraTrips(level)} trip(s)` : ''}`;
  }
}
