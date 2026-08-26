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
// Stats the manager can develop post-graduation (physical/technical). Mentals + durability are
// career-forged identity and stay fixed. Physical stats are capped by the player's genes ceiling;
// other developable stats cap at 18 so elite 19-20 remains something only the Career game produces.
const DEVELOPABLE = ['pace', 'strength', 'stamina', 'passing', 'shooting', 'tackling', 'positioning', 'workrate', 'keeping', 'setPiece'] as const;
const PHYSICAL = new Set(['pace', 'strength', 'stamina']);
const clampStat = (v: number) => Math.max(1, Math.min(20, Math.round(v * 10) / 10));

/** Deterministic post-graduation development (the "Finisher" model): a young pro grows toward his
 *  ceiling, an old one declines — driven by the Training facility. Late curve tuned for the 25→40
 *  pro window: 25–31 growth, 32–34 prime plateau, 35+ decline (physical fades fastest). */
export function developAttrs(attrs: any, genes: any, age: number, trainingLvl: number): any {
  const tf = 0.55 + 0.12 * (Math.max(1, trainingLvl) - 1); // training 1 → 0.55 … 5 → 1.03
  const out = { ...attrs };
  for (const s of DEVELOPABLE) {
    const v = out[s];
    if (typeof v !== 'number') continue;
    const ceil = PHYSICAL.has(s) ? (genes?.[s]?.ceiling ?? 18) : 18;
    if (age <= 31) { // GROWTH — a real ~7-season runway toward the ceiling
      const room = ceil - v;
      if (room > 0.05) out[s] = clampStat(v + Math.min(room, 0.45 * tf * (0.4 + 0.6 * Math.min(1, room / 5))));
    } else if (age >= 35) { // DECLINE — physical fades faster; good training slows it
      const rate = (PHYSICAL.has(s) ? 0.6 : 0.3) * (age - 34) * (1.15 - 0.06 * Math.max(1, trainingLvl));
      out[s] = clampStat(v - rate);
    } // 32–34: prime plateau
  }
  return out;
}

export async function advanceTokensAtRollover(
  db: Store, ownerId: string, season: number,
  outcome: { league: number; cup: number; promotion: number; tierIdx: number },
): Promise<Retirement[]> {
  const retirements: Retirement[] = [];
  const trainingLvl = (await db.getFacilities(ownerId)).training; // the club's development driver
  for (const t of await db.tokensOwnedBy(ownerId)) {
    if (t.state !== 'pro') continue;
    // DEVELOPMENT: grow/decline the pro's stats for the season just played (before ageing to retire)
    const age0 = ageOf(t.prime_season ?? season, season);
    if (t.attrs_json && age0 < 40) {
      const dev = developAttrs(JSON.parse(t.attrs_json), JSON.parse(t.genes_json ?? '{}'), age0, trainingLvl);
      await db.updateToken(t.id, { attrs_json: JSON.stringify(dev) });
      t.attrs_json = JSON.stringify(dev); // reflect in the peak calc below
    }
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
