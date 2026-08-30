// Club facilities — a persistent, per-club upgrade layer that gives clubs an identity beyond the squad, and
// the main way a dynasty's investment shows up as something you can see. All effects are deterministic
// numeric multipliers — replay-safe, no rng.
//
// EXPANDED 2026-08-30 on three axes at once (user decision):
//   1. MORE of them — twelve now. The five new ones are a data department, a club shop, an academy
//      dormitory, a women's team and a community trust: things a real club builds once it can afford to
//      look beyond the first team.
//   2. DEEPER — levels 1→10 rather than 1→5, so a facility is a project across a whole dynasty rather than
//      something maxed in one good season, and every single level has its own line of narration.
//   3. CONTENT SOURCES — facilities gate story arcs (see managerarc.ts `when.facility`), so a good academy
//      generates youth stories and a community trust opens local ones. They are not just multipliers.
export type FacilityKey = 'stadium' | 'training' | 'youth' | 'scouting' | 'medical' | 'sponsor' | 'fanzone'
  | 'data' | 'shop' | 'dorm' | 'women' | 'community';
export interface Facilities {
  stadium: number; training: number; youth: number; scouting: number; medical: number; sponsor: number; fanzone: number;
  data?: number; shop?: number; dorm?: number; women?: number; community?: number;
}
/** Level of a facility, defaulting to 1 — the five newer keys are absent from older saves. */
export const facLevel = (f: Partial<Facilities> | undefined, k: FacilityKey): number => Math.max(1, Number(f?.[k] ?? 1));
export const FACILITY_KEYS: FacilityKey[] = ['stadium', 'training', 'youth', 'scouting', 'medical', 'sponsor', 'fanzone', 'data', 'shop', 'dorm', 'women', 'community'];
export const MAX_LEVEL = 10;
export const DEFAULT_FACILITIES: Facilities = { stadium: 1, training: 1, youth: 1, scouting: 1, medical: 1, sponsor: 1, fanzone: 1, data: 1, shop: 1, dorm: 1, women: 1, community: 1 };

/** Coins to REACH a given level. Levels 6-10 are a dynasty-scale project, not a season's saving: the top
 *  end deliberately costs more than any single season can produce, so a maxed facility is inherited. */
const COST_TO_REACH: Record<number, number> = {
  2: 250, 3: 550, 4: 1100, 5: 2000,
  6: 3200, 7: 4800, 8: 7000, 9: 10000, 10: 14000,
};
/** Coins to go from `level` to `level+1`, or null if already maxed. */
export function upgradeCost(level: number): number | null {
  return level >= MAX_LEVEL ? null : COST_TO_REACH[level + 1] ?? null;
}

export const FACILITY_META: Record<FacilityKey, { icon: string; name: string; blurb: string }> = {
  stadium:  { icon: '🏟️', name: 'Stadium',        blurb: 'A bigger ground packs in more fans — every home match pays gate receipts. Winning at home, and in a higher division, pays more.' },
  training: { icon: '🏋️', name: 'Training Ground', blurb: 'Fitter legs. Your squad drains less over 90 minutes, so you fade less in the closing stages.' },
  youth:    { icon: '🎓', name: 'Youth Academy',   blurb: 'Home-grown talent. A better academy widens your Local Tryouts pool and raises the odds a walk-up is worth signing.' },
  scouting: { icon: '🔭', name: 'Scouting HQ',      blurb: 'A sharper scouting operation lifts every network trip: better odds, cheaper travel, and — at the top levels — extra trips per season.' },
  medical:  { icon: '🏥', name: 'Medical Centre',   blurb: 'Physios and sports science. Cuts how often your players pick up injuries and gets the injured back on the pitch sooner.' },
  sponsor:  { icon: '📣', name: 'Commercial Dept',  blurb: 'Sponsors and merchandising. Pays a lump of income every season — more in a higher division and for every trophy in your cabinet.' },
  data:      { icon: '📊', name: 'Data Department', blurb: 'Analysts, video, and numbers nobody used to keep. Sharper opposition scouting and a small edge in every tight match.' },
  shop:      { icon: '🛍️', name: 'Club Shop',       blurb: 'Shirts, scarves and a queue on matchday. Steady commercial income that grows with the crowd.' },
  dorm:      { icon: '🛏️', name: 'Academy Digs',    blurb: 'Somewhere for the young ones to live. Keeps the boys you would otherwise lose to the travel, and widens the intake.' },
  women:     { icon: '⚽', name: "Women's Team",     blurb: 'A second side sharing the training ground and the badge. Standing, income, and a whole other set of people at the club.' },
  community: { icon: '🤝', name: 'Community Trust',  blurb: 'Schools, a food bank, a hundred small things in the town. It does not win matches; it decides what the club is for.' },
  fanzone:  { icon: '🎉', name: 'Fan Zone',         blurb: 'A roaring home crowd. Gives your side a real edge in home matches and swells the gate on matchday.' },
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
/** Medical Centre: injury-chance multiplier (1.0 at L1 → 0.40 at L5). */
// A LINE written for the old five-level cap. When MAX_LEVEL went to 10 this was not rescaled, so it
// crossed zero at level 8: a maxed Medical Centre made injuries mathematically impossible (measured — 0.0
// per season against 7.8 at level 1), deleting squad depth, the treatment room and the injury feed
// outright, and the effect string offered the player "−135% injury chance". Decay instead of a line, so
// every level is worth buying and none of them ends the system: L1 1.00 → L5 0.63 → L10 0.35.
export function injuryChanceMult(level: number): number { return Math.pow(0.89, Math.max(0, level - 1)); }
/** Medical Centre: matches shaved off a fresh injury's recovery (0 at L1 → 2 at L5). */
// Capped at 2 for the same reason: at the 10-level cap this reached 4, which is the longest injury the
// roll can produce, so every knock healed before the next match.
export function recoveryCut(level: number): number { return Math.min(2, Math.floor((level - 1) / 3)); }
/** Commercial Dept: per-season sponsorship income (division- and trophy-scaled), lifted by the squad's
 *  MARKETABILITY — a fan-favourite/brand-name squad pulls bigger sponsors, so a marketable star helps pay
 *  his own wages. marketabilityAvg is centred at 10 (neutral), so an all-ordinary squad earns as before. */
export function sponsorIncome(level: number, tierIdx: number, trophies: number, marketabilityAvg = 10): number {
  if (level <= 1) return 0;
  const base = (60 * (level - 1)) * (1 + tierIdx * 0.12) + trophies * 25 * (level - 1);
  const brandMult = clampNum(1 + 0.03 * (marketabilityAvg - 10), 0.7, 1.5); // avg 20 → +30%, avg 5 → −15%
  return Math.round(base * brandMult);
}
const clampNum = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
/** Average marketability of a squad (career-built players carry it; ordinary players read neutral). */
export function squadMarketability(players: Array<{ marketability?: number }>): number {
  if (!players.length) return 10;
  return players.reduce((s, p) => s + (p.marketability ?? 10), 0) / players.length;
}
/** Fan Zone: home-side attacking edge in the match engine (1.0 at L1 → 1.08 at L5). */
export function fanHomeBoost(level: number): number { return 1 + (level - 1) * 0.02; }
/** Fan Zone: matchday (gate) income multiplier (1.0 at L1 → 1.32 at L5). */
export function fanIncomeMult(level: number): number { return 1 + (level - 1) * 0.08; }

// ── the five newer facilities ──────────────────────────────────────────────────────────────────────
/** Data Dept: a small edge in tight matches — opposition prep turned into a real number. */
export function dataEdge(level: number): number { return (level - 1) * 0.012; }
/** Club Shop: commercial income per season, scaling with the crowd you can pull. */
export function shopIncome(level: number, tierIdx: number): number { return Math.round((level - 1) * 45 * (1 + tierIdx * 0.18)); }
/** Academy Digs: extra youth intake places, and fewer promising kids lost to the travel. */
export function dormIntakeBonus(level: number): number { return Math.floor((level - 1) / 2); }
/** Women's Team: standing and a second income stream. */
export function womensStanding(level: number): number { return (level - 1) * 2; }
export function womensIncome(level: number, tierIdx: number): number { return Math.round((level - 1) * 30 * (1 + tierIdx * 0.12)); }
/** Community Trust: local goodwill. Does not win matches; changes what the club is worth to the town. */
export function communityStanding(level: number): number { return (level - 1) * 3; }

/** A short human description of a facility's effect AT a given level (for the UI). */
export function effectAt(key: FacilityKey, level: number): string {
  switch (key) {
    case 'stadium':  return `Home gate ≈ ${20 * level}–${Math.round(20 * level * 2.35 * 1.5)} coins per match (by division & result)`;
    case 'training': return level === 1 ? 'No conditioning bonus yet' : `−${Math.round((1 - trainingConditioning(level)) * 100)}% fitness drain over a match`;
    case 'youth':    return level === 1 ? 'Standard walk-ups' : `+${youthPoolBonus(level)} tryout slot(s), ${Math.round(youthUpgradeChance(level) * 100)}% quality-upgrade chance`;
    case 'scouting': return level === 1 ? 'Standard trips' : `+${Math.round((scoutHitMult(level) - 1) * 100)}% odds, −${Math.round(scoutCostDiscount(level) * 100)}% cost${scoutExtraTrips(level) ? `, +${scoutExtraTrips(level)} trip(s)` : ''}`;
    case 'medical':  return level === 1 ? 'Standard injury risk' : `−${Math.round((1 - injuryChanceMult(level)) * 100)}% injury chance${recoveryCut(level) ? `, −${recoveryCut(level)} match recovery` : ''}`;
    case 'sponsor':  return level === 1 ? 'No sponsors yet' : `≈ ${60 * (level - 1)}+ coins/season (more per division & trophy)`;
    case 'data':      return level === 1 ? 'No analysts yet' : `+${(dataEdge(level) * 100).toFixed(1)}% edge in tight matches from opposition prep`;
    case 'shop':      return level === 1 ? 'A table and a cash box' : `≈ ${shopIncome(level, 4)}+ coins/season, more as the crowd grows`;
    case 'dorm':      return level === 1 ? 'The boys live at home' : `+${dormIntakeBonus(level)} academy intake place(s), and fewer lost to the travel`;
    case 'women':     return level === 1 ? 'No second side yet' : `+${womensStanding(level)} standing, ≈ ${womensIncome(level, 4)} coins/season`;
    case 'community': return level === 1 ? 'Nothing organised' : `+${communityStanding(level)} standing in the town`;
    case 'fanzone':  return level === 1 ? 'No home edge yet' : `+${Math.round((fanHomeBoost(level) - 1) * 100)}% home attack, +${Math.round((fanIncomeMult(level) - 1) * 100)}% gate`;
  }
}


// ── LEVEL NARRATION ─────────────────────────────────────────────────────────────────────────────────
// One line per facility per level — the club physically changing around you across a dynasty. This is the
// "deeper levels with real character" half of the expansion: an upgrade should read as something that
// happened to a place, not as a number going up. Authored packs extend this (see manager/pack_*.ts style).
import { FAC_LEVEL_STORY_1 } from './facilitylevels/pack_1.js';
import { FAC_LEVEL_STORY_2 } from './facilitylevels/pack_2.js';

const BASE_LEVEL_STORY: Record<string, string[]> = {
  stadium: [], training: [], youth: [], scouting: [], medical: [], sponsor: [], fanzone: [],
  data: [], shop: [], dorm: [], women: [], community: [],
};

/** The line for reaching `level` in `key`, or null. Indexed level-2 first (level 1 is the starting state). */
export function facilityLevelStory(key: FacilityKey, level: number): string | null {
  for (const bank of [FAC_LEVEL_STORY_1, FAC_LEVEL_STORY_2, BASE_LEVEL_STORY]) {
    const lines = (bank as Record<string, string[]>)[key];
    const hit = lines?.[level - 2];
    if (hit) return hit;
  }
  return null;
}
