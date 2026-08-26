// The retirement end of the player lifecycle. At each season rollover every owned NFT banks a season of
// TEAM achievements (position-neutral), and once he ages past 40 he RETIRES: a legacy card is minted as
// a keepsake, a testimonial pays the owner a bounded coin send-off, his contract is dropped, and he's
// benched for good (the NFT stays owned, ready to be reborn). Achievements + lifecycle are owner-
// independent so they follow the NFT through sales.
import { overall, legacyCard, legacyBoost, inheritGenes, type PlayerAchievements, type Player, type Genes } from '@fm/shared';
import type { Store } from './store.js';
import { isNftPlayer, ageOf } from './contracts.js';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
function seedFrom(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) || 1; }

/** A reborn is a 10-YEAR-OLD PROSPECT (not a prime player): it re-enters the Career sim to be DEVELOPED
 *  10→25, inheriting the parent's physical GENES (biased roll) + the decorated parent's team-achievement
 *  pedigree (a higher potential ceiling + a winner's-mentality development bonus). The realised stats are
 *  earned through the breeder card game, not handed over. */
export interface RebornProspect { genes: Genes; pedigree: number; devBonus: Record<string, number>; roleHint: string; note: string; potentialStars: number }
export function rebornProspect(parent: Player, ach: PlayerAchievements): RebornProspect {
  const boost = legacyBoost(ach);
  // approximate the parent's genetic bands from his realised physical stats, then inherit (biased roll +
  // regression + variance, never a copy), with the pedigree lifting the son's ceilings.
  const band = (stat: number) => ({ floor: clamp(stat - 6, 1, 15), ceiling: clamp(stat + 2, clamp(stat - 6, 1, 15) + 3, 20) });
  const parentGenes: Genes = { pace: band(parent.attrs.pace), strength: band(parent.attrs.strength), stamina: band(parent.attrs.stamina) };
  const genes = inheritGenes(parentGenes, seedFrom(parent.id + ':heir'), 0.6, boost.ceilingLift);
  const geneCeil = (genes.pace.ceiling + genes.strength.ceiling + genes.stamina.ceiling) / 3;
  const potentialStars = clamp(Math.round((geneCeil / 4) + boost.pedigree * 1.5), 1, 5); // upside from physical ceiling + bloodline fame
  return { genes, pedigree: boost.pedigree, devBonus: boost.devBonus as Record<string, number>, roleHint: parent.role, note: boost.note, potentialStars };
}

/** DB achievement row → the shared PlayerAchievements shape. */
export function toAchievements(r: { seasons: number; apps: number; league_titles: number; cup_titles: number; promotions: number; highest_tier_idx: number }): PlayerAchievements {
  return { seasons: r.seasons, apps: r.apps, leagueTitles: r.league_titles, cupTitles: r.cup_titles, promotions: r.promotions, highestTierIdx: r.highest_tier_idx };
}

export interface Retirement { playerId: string; name: string; testimonial: number; tier: string; legendRating: number }

/** Advance one owner's NFT squad by a season: record achievements from the club's result, track peak
 *  ability, and retire anyone who has aged out (returning the retirements for notification). */
export async function advanceAccountLifecycle(
  db: Store, ownerId: string, players: Player[], currentSeason: number,
  outcome: { league: number; cup: number; promotion: number; tierIdx: number },
): Promise<Retirement[]> {
  const retirements: Retirement[] = [];
  for (const p of players) {
    if (!isNftPlayer(p.id)) continue;
    const life = await db.getLifecycle(p.id);
    if (life?.retired) continue;                         // already retired — skip
    const prime = life?.prime_season ?? await db.ensurePrimeSeason(p.id, currentSeason);
    await db.setPeakOverall(p.id, overall(p));           // best ability reached (prime proxy; ageCurve holds it)
    await db.recordPlayerSeason(p.id, outcome);          // +1 season + this season's team honours
    const age = ageOf(prime, currentSeason);
    if (age >= 40) {                                      // RETIRE — mint the legacy keepsake + testimonial
      const ach = toAchievements(await db.getAchievements(p.id));
      const peak = Math.max(overall(p), life?.peak_overall ?? 0);
      const card = legacyCard(p.role, overall(p), peak, ach);
      await db.saveLegacy(p.id, ownerId, p.name, JSON.stringify(card), currentSeason);
      await db.addCoins(ownerId, card.testimonial);
      await db.retirePlayer(p.id);
      await db.deleteContract(ownerId, p.id);
      retirements.push({ playerId: p.id, name: p.name, testimonial: card.testimonial, tier: card.tier, legendRating: card.legendRating });
    }
  }
  return retirements;
}
