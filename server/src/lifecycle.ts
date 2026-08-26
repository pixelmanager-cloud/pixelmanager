// The season-rollover lifecycle for the unified tokens: every owned PRO token banks a season of TEAM
// achievements + peak ability, and once it ages past 40 it RETIRES — a legacy card is saved as a
// keepsake and a testimonial pays the owner. The SAME token stays owned (state → retired), ready to be
// reborn into the next generation. Achievements live on the token, so they follow it through sales.
import { overall, updateMorale, driftMorale, type MoraleEvent } from '@fm/shared';
import type { Store } from './store.js';
import { tokenToPlayer, ageOf, legendCardOf } from './tokens.js';

/** Nudge a token's morale by one event (played/benched/extended/trophy). */
export async function bumpMorale(db: Store, tokenId: string, event: MoraleEvent): Promise<void> {
  const t = await db.getToken(tokenId);
  if (t) await db.updateToken(tokenId, { morale: updateMorale(t.morale ?? 65, event) });
}

export interface Retirement { playerId: string; name: string; testimonial: number; tier: string; legendRating: number }

/** Advance one owner's PRO tokens by a season: record achievements + peak, retire anyone past 40. */
export async function advanceTokensAtRollover(
  db: Store, ownerId: string, season: number,
  outcome: { league: number; cup: number; promotion: number; tierIdx: number },
): Promise<Retirement[]> {
  const retirements: Retirement[] = [];
  for (const t of await db.tokensOwnedBy(ownerId)) {
    if (t.state !== 'pro') continue;
    const peak = Math.max(t.peak_overall, overall(tokenToPlayer(t)));
    let morale = driftMorale(t.morale ?? 65);                 // grudges fade / complacency creeps each season
    if (outcome.league || outcome.cup) morale = updateMorale(morale, 'won_trophy'); // a title lifts the mood
    await db.updateToken(t.id, {
      ach_seasons: t.ach_seasons + 1, ach_league: t.ach_league + outcome.league, ach_cup: t.ach_cup + outcome.cup,
      ach_promotions: t.ach_promotions + outcome.promotion, ach_tier: Math.max(t.ach_tier, outcome.tierIdx), peak_overall: peak, morale,
    });
    const age = ageOf(t.prime_season ?? season, season);
    if (age >= 40) { // RETIRE → legacy keepsake + testimonial, same token stays owned
      const fresh = (await db.getToken(t.id))!;
      const card = legendCardOf(fresh);
      await db.saveLegacy(`${t.id}:g${t.generation}`, ownerId, fresh.name, JSON.stringify(card), season);
      await db.addCoins(ownerId, card.testimonial);
      await db.updateToken(t.id, { state: 'retired', signed_season: null });
      retirements.push({ playerId: t.id, name: fresh.name, testimonial: card.testimonial, tier: card.tier, legendRating: card.legendRating });
    }
  }
  return retirements;
}

/** Bank one appearance for a token that featured in a match (feeds longevity in the legacy). */
export async function bumpApps(db: Store, tokenId: string): Promise<void> {
  const t = await db.getToken(tokenId);
  if (t) await db.updateToken(tokenId, { ach_apps: t.ach_apps + 1 });
}
