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
export { Career, graduate, AGENTS, TOTAL_TURNS, bandAt, AGE_BANDS, type Agent, type CareerSnapshot, type CareerPlayer, type Track } from './career.js';
export { prospectValuation, deriveStats, eligibleTraits, cardName, CARD_DESC, clubInvestOf, type ProspectValue, type CareerPlayerAttrs, type Personality } from './career.js';
export { LIFE_KINDS, LIFE_LABEL, type LifeKind } from './career.js';
export { narratePlay, narrateLifeEvent, scenarioStory, chapterRecap, graduationEpilogue, careerCast, narrateCoach, narrateDraft, narrateOffer, type NarrateCtx, type ScenarioCtx, type RecapCtx, type EpilogueCtx, type CareerCast } from './narrate.js';
export { rivalMomentStory, narrateRivalMoment, rivalNews, lifeAction, type RivalPayoff } from './narrate.js';

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
  // Carried so a RETIRED generation can be scored on its own record once the token has been reborn.
  // Optional because cards written before this existed simply have no figure; they read as 0, which is
  // what the house was already getting for them.
  caps?: number;
  bigNights?: number;
  legendRating: number;   // 0-100 career greatness (peak ability + trophies + longevity)
  tier: string;           // named tier from legendRating
  icon: string;
  testimonial: number;    // one-off coin send-off at retirement (bounded)
  mintable: boolean;      // Icon+ → qualifies for a soulbound legacy NFT
  note: string;
}

// Several possible retirement notes per tier — a genuine goodbye reads differently depending on the
// shape of the career (trophies vs longevity vs simply showing up), even at the same legendRating.
// Deterministic: picked by a hash of the seed + the exact numbers that produced this tier, so the same
// career always gets the same send-off, but different careers landing in the same tier don't feel identical.
const RETIREMENT_NOTES: Record<'legendary' | 'great' | 'fond' | 'decorated' | 'dependable', string[]> = {
  legendary:  ['a career for the ages', 'a bona fide club legend', 'the stuff a statue outside the ground is made of', 'a name this club will not forget'],
  great:      ['a true great of the club', 'one of the names supporters will tell their kids about', 'a genuine club great, through and through', 'a player who defined an era here'],
  fond:       ['a fondly-remembered servant', 'a player the terraces always warmed to', 'a reliable, well-loved presence for years', 'the sort of pro every club needs a few of'],
  decorated:  ['a decorated squad player', 'a career with real silverware to show for it', 'a squad player who still has medals to his name', 'someone who turned up on the big days and delivered'],
  dependable: ['a dependable pro', 'a career built on graft rather than glory', 'a solid, unspectacular career, and no shame in that', 'a journeyman who gave everything he had'],
};
function hash32Legacy(...nums: number[]): number { let h = 2166136261 >>> 0; for (const n of nums) { h ^= (n >>> 0); h = Math.imul(h, 16777619); } return h >>> 0; }

/** Build the legacy card for a player retiring at the end of his career. TEAM achievements only (fair
 *  across positions) + how good he actually got. `peakOverall` is the best overall he ever recorded — written at graduation
 *  from `grad.overall` (tokens.ts) and maxed each rollover from `overall(player)` (api.ts).
 *  `seed`, if given, varies which of several notes is picked for the tier (deterministic, purely cosmetic). */
export function legacyCard(role: Role, primeOverall: number, peakOverall: number, ach: PlayerAchievements, seed = 0): LegacyCard {
  const tierMult = 1 + ach.highestTierIdx * 0.3;                         // winning higher up counts for more
  const trophyPts = (ach.leagueTitles + ach.cupTitles * 0.7 + ach.promotions * 0.3) * tierMult;
  const longevity = clamp(ach.seasons / 15, 0, 1);
  const legendRating = clamp(Math.round(peakOverall * 2 + trophyPts * 3 + longevity * 12), 0, 100);
  let ti = 0;
  for (let i = 0; i < LEGEND_TIERS.length; i++) if (legendRating >= LEGEND_TIERS[i].at) ti = i;
  const tier = LEGEND_TIERS[ti];
  const testimonial = clamp(Math.round(legendRating * 6 * (1 + ach.highestTierIdx * 0.08)), 0, 2000);
  const trophies = ach.leagueTitles + ach.cupTitles;
  const noteKey: keyof typeof RETIREMENT_NOTES = legendRating >= 82 ? 'legendary' : legendRating >= 65 ? 'great' : legendRating >= 45 ? 'fond' : trophies > 0 ? 'decorated' : 'dependable';
  const notePool = RETIREMENT_NOTES[noteKey];
  const note = notePool[hash32Legacy(seed, legendRating, ach.seasons, ach.apps) % notePool.length];
  return {
    role, primeOverall, peakOverall, seasons: ach.seasons, apps: ach.apps,
    leagueTitles: ach.leagueTitles, cupTitles: ach.cupTitles,
    legendRating, tier: tier.name, icon: tier.icon, testimonial,
    mintable: legendRating >= 65,   // only Icons and above get a soulbound legacy NFT
    note,
  };
}
