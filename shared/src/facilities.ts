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
  // RECALIBRATED when this was finally connected. Nothing had ever called it, so its constants had never
  // been measured against the economy they feed: at `20 * level` a maxed stadium paid over 18,000 coins a
  // season against a top-flight title prize of 1,280, and even at level 1 — the documented neutral
  // baseline, where every other facility pays nothing — it was already paying about 1,000. Now `level - 1`
  // like its neighbours, and scaled so a maxed ground is a real income stream that repays its 14,000-coin
  // cost across roughly a manager's career rather than in a season and a half.
  return Math.round(2.5 * (level - 1) * (1 + tierIdx * 0.15) * resultMult);
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
  // THE TROPHY TERM IS CAPPED. It was linear and unbounded, so a long dynasty's sponsorship climbed
  // forever: measured at level 10 in the top flight, 200 titles paid 46,123 coins a season against a
  // 1,280 title prize, and a traced 80-season run finished with 565,527 coins and nothing left to buy.
  // Twenty titles is still a monumental haul and worth 4,500 a season; beyond that the name is as famous
  // as it is going to get.
  const base = (60 * (level - 1)) * (1 + tierIdx * 0.12) + Math.min(trophies, 20) * 25 * (level - 1);
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

// ── UPKEEP — the recurring cost of BEING a big club ────────────────────────────────────────────────
// Facilities were a one-way ratchet: you bought a level and it was yours forever, free. Measured over a
// long dynasty that produced the game's flattest failure — everything in the club maxed by around season
// 92, after which ~14,000 coins a season accrued against nothing to spend them on, reaching 609,906 by
// season 149. The only recurring cost in the entire game was the squad wage bill, and at ~1,000 a season
// against ~15,100 of income it was 7% of the club's earnings: a rounding error, not a pressure.
//
// Upkeep makes a big club something you must keep AFFORDING. It is quadratic in level, so the early
// levels are nearly free (L2 costs 7 a season) and the top end is a genuine commitment (L10 costs 567).
//
// RECALIBRATED, because the first cut of this was wrong and wrong in the way that matters. It claimed the
// summit earned "roughly 15,100" a season. MEASURED THROUGH THE ACTUAL SEASON ROLL, a club with all twelve
// at level 10, winning the top flight, with the sponsor trophy term saturated, earns 10,686:
//
//   prize 1,280 + gate 1,223 + sponsor 5,623 + shop 1,061 + women's 562 + sponsor bonus 700 = 10,449
//
// The 15,100 was assembled two mistakes deep: it used seasonPlacementReward (2,886) where the real prize
// is 1,280, and it added 2,810 of per-match WIN/DRAW/LOSS earnings that the manager season roll does not
// pay at all.
//
// AND THE CORRECTION WAS WRONG THE SAME WAY, which is worth recording because it is the second time. It
// published gate 2,160 — a figure that needs ~34 home-and-away fixtures, when seasonFixtures returns 18 at
// every tier, so the real gate is 1,223 — and it omitted the 700 sponsor bonus a champion always has
// (pos <= 3 on a performance deal). The two errors partly cancel, 10,686 against a measured 10,449, so the
// coefficient fit below survives; but a number assembled from a term that cannot occur plus an omitted
// real one is exactly the failure this comment block exists to correct. Income was overstated by 45%, and
// the upkeep coefficient was fitted to it — so the best
// possible season in the game ran a deficit before a single wage was paid, levels 6-10 were unreachable
// (a 150-season run of title wins never reached level 10, and an ordinary good top-flight side plateaued
// at level 5 forever), and a relegated club sat on exactly 0 coins for sixty consecutive seasons with
// every purchase in the game disabled.
//
// Fitted to the real figure: all twelve at maximum now costs 6,804 a season against 10,686 of income, so
// a champion clears its bill and its wages with something left, a mid-table side has to choose, and
// nothing below the top flight can hold all twelve. Relegation still has teeth, because upkeep does not
// fall with the division while income does.
//
// Level 1 is free, like every other neutral baseline in this module, so a young club feels none of this.
export const UPKEEP_COEFF = 7;
export function facilityUpkeep(level: number): number {
  // `facLevel` is documented as the defensive clamp, so it has to survive a corrupt save: Math.max(1, NaN)
  // is NaN, and a NaN bill makes `Math.min(have, due)` NaN and `due > have` false — the club would be
  // charged NaN coins once and then never billed again.
  const l = Number.isFinite(level) ? level : 1;
  return Math.round(UPKEEP_COEFF * Math.pow(Math.max(0, l - 1), 2));
}
/** The club's whole upkeep bill for a season. */
export function seasonUpkeep(fac: Partial<Facilities> | undefined): number {
  return FACILITY_KEYS.reduce((t, k) => t + facilityUpkeep(facLevel(fac, k)), 0);
}
/** When the club cannot pay, facilities fall into disrepair until the bill is one the club could meet.
 *
 *  ONE LEVEL A SEASON IS NOT ENOUGH. A maxed club that gets relegated runs a ~4,000-coin deficit, and
 *  shedding that much upkeep takes about 36 level-drops — at one a season the club would sit in permanent,
 *  un-arrestable deficit for over thirty years. So the slide is proportional to how badly you overreached:
 *  it cuts until the bill fits the income, capped at MAX_DISREPAIR levels so it is always a decline you can
 *  see coming and act on, never a collapse in a single season.
 *
 *  Always the most expensive facility to run, which is both the one the club can least afford and the one
 *  that recovers the most. Deterministic — ties break on the fixed FACILITY_KEYS order, never on rng — so
 *  this is replay-safe.
 */
export const MAX_DISREPAIR = 3;
export function facilityToDowngrade(fac: Partial<Facilities> | undefined): FacilityKey | null {
  let best: FacilityKey | null = null, bestLvl = 1;
  for (const k of FACILITY_KEYS) {
    const l = facLevel(fac, k);
    if (l > bestLvl) { best = k; bestLvl = l; }
  }
  return best;
}
/** Cut upkeep toward `budget`. Returns the facilities that lost a level (may repeat a key). Pure. */
export function applyDisrepair(fac: Facilities, budget: number): { cut: FacilityKey[]; salvage: number } {
  const cut: FacilityKey[] = [];
  let salvage = 0;
  for (let i = 0; i < MAX_DISREPAIR && seasonUpkeep(fac) > budget; i++) {
    const k = facilityToDowngrade(fac);
    if (!k) break;
    const lv = facLevel(fac, k);
    // SELLING OFF A LEVEL PAYS THE SAME WHETHER YOU CHOSE IT OR NOT. Disrepair used to pay nothing while
    // the player's own Scale Back paid 40%, and because the slide is fully deterministic — always the
    // highest level, ties on fixed key order — anyone who knew that front-ran it. Measured: identical
    // clubs five seasons apart, the informed one ended 66,524 coins richer for one extra level lost. A
    // hidden 100% tax on not having read the source is not a difficulty curve.
    salvage += mothballRefund(lv);
    (fac as any)[k] = Math.max(1, lv - 1);
    cut.push(k);
  }
  return { cut, salvage };
}

/** SCALING BACK ON PURPOSE — the lever that makes upkeep a decision instead of a trap.
 *  Without this the only answer to a bill you cannot pay is to win your way out of it, which is precisely
 *  the thing a struggling club cannot do; the player would watch the slide with no control over WHICH parts
 *  of the club survive it. Mothballing lets a dynasty choose its identity under pressure — sell the Data
 *  Department to keep the Academy — and returns part of what the level cost, since you are selling
 *  something real. Deliberately less than half, so churning levels is never a way to make money. */
export const MOTHBALL_REFUND = 0.4;
export function mothballRefund(level: number): number {
  return level <= 1 ? 0 : Math.round((COST_TO_REACH[level] ?? 0) * MOTHBALL_REFUND);
}

/** A short human description of a facility's effect AT a given level (for the UI). */
export function effectAt(key: FacilityKey, level: number): string {
  switch (key) {
    // DERIVED FROM stadiumIncome, NOT A COPY OF IT. This still printed the pre-recalibration formula sixty
    // lines below the function it describes — promising "≈ 200–705 coins per match" at level 10 against an
    // actual 34–79, and "≈ 20–70" at level 1 where the function returns exactly 0. That is the precise
    // failure the recalibration was written to end, reproduced one function above it.
    case 'stadium':  return level <= 1 ? 'No gate receipts yet'
      : `Home gate ≈ ${stadiumIncome(level, 0, 'draw')}–${stadiumIncome(level, 9, 'win')} coins per match (by division & result)`;
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

/** EVERY FACILITY THAT PROMISES MONEY, PAID ONCE A SEASON, IN ONE PLACE.
 *
 *  Ten of the twelve facilities were decorative: `stadiumIncome`, `sponsorIncome`, `shopIncome`,
 *  `womensIncome` and `fanIncomeMult` were computed only to render their own description string and were
 *  applied to no game state at all. `stadiumIncome` was not even reached by that — `effectAt` inlines the
 *  formula — so the Stadium, at 14,000 coins the most expensive purchase in the game, returned exactly
 *  nothing while its card promised "≈ 200–705 coins per match". A player saved across several seasons for
 *  a number that never moved, and the UI told him it had.
 *
 *  Gate receipts are the one that needs care: they are per HOME match and depend on the result, so the
 *  season's record is split half home and the home results are assumed to mirror the overall record — a
 *  simplification, but a far smaller lie than paying nothing.
 */
/** Per-season CENTRAL DISTRIBUTION from the division itself — the game's answer to a broadcast deal, paid
 *  for being in the division rather than for anything the club owns or does.
 *
 *  THE TOP OF THE FACILITY LADDER WAS UNREACHABLE. Levels 9 and 10 cost 10,000 and 14,000; measured across
 *  130 seasons of top-flight dominance under every purchasing policy tried, the peak treasury a club ever
 *  held while also buying players was 8,668. Not once in four seeds, under any line of play, did a dynasty
 *  reach level 9 — and a 130-season run bought 34% of the facility content and made its last purchase
 *  around season 100, leaving the final thirty seasons with nothing to decide.
 *
 *  Three fixes were measured. Cutting the top-end costs reaches those levels but empties the ladder by
 *  season 91. Flattening upkeep does nothing at all — a summit club earns 10,428 against 6,804 of upkeep,
 *  so the running cost was never the constraint; the 14,000 capital cost was. Income that scales with the
 *  CLIMB is the only lever that moved it: at +600 a division, level 9 arrives around season 28 and level 10
 *  around season 66, while seven of twelve facilities are still unbuilt at season 130 and purchases are
 *  still arriving at season 117.
 *
 *  It also fixes the shape of the incentive. The climb previously paid off almost entirely through prize
 *  money, which is won; this pays for being there, which is what promotion is actually worth. */
export const DIVISION_MERIT = 600;

export interface SeasonIncome { gate: number; sponsor: number; shop: number; womens: number; merit: number; total: number }
export function seasonFacilityIncome(
  fac: Facilities, tierIdx: number, trophies: number, marketabilityAvg: number,
  record: { wins: number; draws: number; losses: number },
): SeasonIncome {
  const homeOf = (n: number) => Math.round(n / 2);
  const gatePer = (outcome: 'win' | 'draw' | 'loss') => stadiumIncome(fac.stadium, tierIdx, outcome);
  const gate = Math.round(
    (homeOf(record.wins) * gatePer('win') + homeOf(record.draws) * gatePer('draw') + homeOf(record.losses) * gatePer('loss'))
    * fanIncomeMult(fac.fanzone));
  const sponsor = sponsorIncome(fac.sponsor, tierIdx, trophies, marketabilityAvg);
  // The five newer facilities are optional on the interface, so a save written before they existed reads
  // undefined here — level 1 is the neutral baseline and pays nothing, which is the right default.
  const shop = shopIncome(fac.shop ?? 1, tierIdx);
  const womens = womensIncome(fac.women ?? 1, tierIdx);
  // tierIdx runs 0 (bottom) .. TIERS-1 (top flight), which is already the number of divisions climbed.
  const merit = Math.max(0, Math.round(tierIdx)) * DIVISION_MERIT;
  return { gate, sponsor, shop, womens, merit, total: gate + sponsor + shop + womens + merit };
}
