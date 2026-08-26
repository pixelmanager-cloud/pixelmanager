// RETIREMENT & LEGACY — the end of a player's playing life (age ~40). He retires, and the manager is
// left with a permanent LEGACY CARD: a summary of the career (peak ability + what he WON + how long he
// lasted) that becomes a keepsake, feeds the owner's prestige, and — for genuine greats — qualifies for
// a soulbound "legend" NFT. A one-off testimonial pays a bounded coin send-off. Pure + deterministic.
//
// This module also SURFACES the lineage API (achievements → next-gen pedigree) to the manager game via
// the package barrel — the reborn/breeding logic itself lives in career.ts (Layer 1).
import type { Role } from './types.js';
export { legacyBoost, type LegacyBoost, rollGenes, inheritGenes, type Genes, type Band } from './career.js';
export type { PlayerAchievements } from './career.js';
import type { PlayerAchievements } from './career.js';
// Career sim (Layer 1) — the breeder card-game engine, for the server to run authoritatively.
export { Career, graduate, AGENTS, TOTAL_TURNS, type Agent, type CareerSnapshot, type CareerPlayer, type Track } from './career.js';
export { prospectValuation, deriveStats, eligibleTraits, cardName, CARD_DESC, TRAITS, type ProspectValue, type CareerPlayerAttrs, type Personality } from './career.js';
export { narratePlay, scenarioStory, narrateGraduation, type NarrateCtx, type GraduationCtx } from './narrate.js';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Named greatness tiers for a finished playing career (parallels manager prestige, at player scale). */
export interface LegendTier { name: string; at: number; icon: string }
export const LEGEND_TIERS: LegendTier[] = [
  { name: 'Squad Player', at: 0,  icon: '👟' },
  { name: 'Cult Hero',    at: 25, icon: '🎗️' },
  { name: 'Club Great',   at: 45, icon: '🌟' },
  { name: 'Icon',         at: 65, icon: '🏅' },
  { name: 'Legend',       at: 82, icon: '👑' },
  { name: 'Immortal',     at: 95, icon: '🐐' },
];

export interface LegacyCard {
  role: Role;
  primeOverall: number;   // overall at graduation (25)
  peakOverall: number;    // best overall reached across the playing years
  seasons: number;
  apps: number;
  leagueTitles: number;
  cupTitles: number;
  legendRating: number;   // 0-100 career greatness (peak ability + trophies + longevity)
  tier: string;           // named tier from legendRating
  icon: string;
  testimonial: number;    // one-off coin send-off at retirement (bounded)
  mintable: boolean;      // Icon+ → qualifies for a soulbound legacy NFT
  note: string;
}

/** Build the legacy card for a player retiring at the end of his career. TEAM achievements only (fair
 *  across positions) + how good he actually got. `peakOverall` is the best overall the ageCurve produced. */
export function legacyCard(role: Role, primeOverall: number, peakOverall: number, ach: PlayerAchievements): LegacyCard {
  const tierMult = 1 + ach.highestTierIdx * 0.3;                         // winning higher up counts for more
  const trophyPts = (ach.leagueTitles + ach.cupTitles * 0.7 + ach.promotions * 0.3) * tierMult;
  const longevity = clamp(ach.seasons / 15, 0, 1);
  const legendRating = clamp(Math.round(peakOverall * 2 + trophyPts * 3 + longevity * 12), 0, 100);
  let ti = 0;
  for (let i = 0; i < LEGEND_TIERS.length; i++) if (legendRating >= LEGEND_TIERS[i].at) ti = i;
  const tier = LEGEND_TIERS[ti];
  const testimonial = clamp(Math.round(legendRating * 6 * (1 + ach.highestTierIdx * 0.08)), 0, 2000);
  const trophies = ach.leagueTitles + ach.cupTitles;
  const note = legendRating >= 82 ? 'a career for the ages' : legendRating >= 65 ? 'a true great of the club' : legendRating >= 45 ? 'a fondly-remembered servant' : trophies > 0 ? 'a decorated squad player' : 'a dependable pro';
  return {
    role, primeOverall, peakOverall, seasons: ach.seasons, apps: ach.apps,
    leagueTitles: ach.leagueTitles, cupTitles: ach.cupTitles,
    legendRating, tier: tier.name, icon: tier.icon, testimonial,
    mintable: legendRating >= 65,   // only Icons and above get a soulbound legacy NFT
    note,
  };
}
