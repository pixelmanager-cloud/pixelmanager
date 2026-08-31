// ── Transfer market — buy/sell fictional players + incoming bids for your star ────────────────────────
// Single-player, deterministic, coin-based. A per-season market of fictional players (quality scaled to
// the club's pyramid TIER — you can only shop at your level), so buying strengthens the squad and helps
// you climb. Plus occasional rival BIDS for the bloodline star (cash in, or keep the dynasty player). Pure
// + seeded (no rng/wall-clock); the coin economy and squad live in the save.
import type { Player } from './types.js';
import { overall } from './teams.js';
import { generateClub } from './teams.js';
import { tierStrength } from './clubseason.js';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
function hash32(...nums: number[]): number { let h = 2166136261 >>> 0; for (const n of nums) { h ^= (n >>> 0); h = Math.imul(h, 16777619); } return h >>> 0; }

export const TRANSFER_LIST_SIZE = 12;   // fictional players offered for sale each season
// squad bounds (MIN_SQUAD/MAX_SQUAD) live in market.ts — reused by the buy/sell facade

/** Transfer FEE (coins) to buy a player — ability-driven, tuned to the season-prize economy so a couple of
 *  buys a season is realistic. A rising fee is the cost of climbing the pyramid. */
export function transferFee(ov: number): number { return Math.round(Math.pow(clamp(ov, 1, 20), 2) * 2.4 + 40); }
/** SELL value (coins) for offloading a squad player — a bit under the buy fee (you take a haircut). */
export function sellValue(ov: number): number { return Math.round(Math.pow(clamp(ov, 1, 20), 2) * 1.6 + 20); }

// ── SQUAD LIFECYCLE — bought players age, decline, cost wages, and their sale value fades (PT-90/PT-92) ──
export const SQUAD_PEAK_AGE = 30;                 // physical prime; decline starts after this
export const SQUAD_CONTRACT_SEASONS = 3;          // a bought player is signed for this many seasons
/** A bought player's recurring per-season WAGE (coins) — the ongoing cost of holding a squad, ~15% of his
 *  buy fee each season. Charged every season he's on the books (PT-92). */
// 5% of his transfer value per season. Measured against the real income curve (spSeasonReward 120c at the
// bottom to 800c for a title, plus up to 700c sponsor): a 20-man squad costs ~154c/season in the basement
// and ~642c in the top flight, so wages are a genuine pressure that CLIMBING relieves, rather than a bill no
// tier can pay. (Was 0.15, which billed 461-1,926c/season and exceeded every income source at every tier —
// even a title-winning season ran a deficit, so the club was pinned at 0 coins forever.)
// RECALIBRATED AGAINST AN ECONOMY THAT NOW EXISTS. The 0.05 rate above was set when 0.15 was measured as
// unpayable "at every tier" — but that measurement was taken while TEN OF THE TWELVE FACILITIES PAID
// NOTHING. They were decorative: stadiumIncome, sponsorIncome, shopIncome, womensIncome and fanIncomeMult
// were computed only to render their own description strings. Connecting them added ~9,400 coins a season
// to a maxed top-flight club, and the wage rate was never revisited, so it stayed tuned to a game where
// the club had no off-pitch income at all. At 0.05 a 20-man squad cost 740 a season against ~15,100 of
// income — 5%, a rounding error rather than the "genuine pressure" the comment claims it is.
const WAGE_RATE = 0.11;
/** How much the sport's money has grown since the dynasty began. Football gets more expensive; a wage bill
 *  that is fixed forever means the third generation runs the same club as the first, and the late game has
 *  no shape. Capped, and on the same saturating curve renown uses, so it bites early and then settles —
 *  inflation that compounded without limit would eventually make any squad unaffordable. Season 0 → 1.00,
 *  season 20 → 1.35, season 45 → 1.63, season 100 → 1.86, ceiling 2.00. */
export function wageEra(season: number): number {
  return 1 + 1.0 * (1 - Math.exp(-Math.max(0, season) / 42));
}
export function squadSeasonWage(ov: number, season = 0): number { return Math.round(transferFee(ov) * WAGE_RATE * wageEra(season)); }
/** The lump cost to RENEW an expiring bought player for another SQUAD_CONTRACT_SEASONS (wage × length). */
export function squadRenewCost(ov: number, season = 0): number { return squadSeasonWage(ov, season) * SQUAD_CONTRACT_SEASONS; }
/** Age-adjusted SALE value: a declining veteran is worth progressively less, so there's a real reason to
 *  cash in before he rots (PT-90). -12%/yr past the peak, floored at 20% of the flat value. */
export function squadSaleValue(ov: number, age: number): number {
  const mult = age <= SQUAD_PEAK_AGE ? 1 : Math.max(0.2, 1 - (age - SQUAD_PEAK_AGE) * 0.12);
  return Math.round(sellValue(ov) * mult);
}
/** Age a bought player's attributes ONE season (mutating-safe copy). Before the peak he holds; past it,
 *  physical attrs fade fastest, technical ones slowly, mentals untouched (experience). Applied once per
 *  season rollover — pure + deterministic, so it never touches the career rng stream. */
export function ageSquadAttrs(attrs: Record<string, number | undefined>, newAge: number): Record<string, number | undefined> {
  if (newAge <= SQUAD_PEAK_AGE) return { ...attrs };
  const drop = (v: number | undefined, d: number) => (v == null ? v : clamp(Math.round((v - d) * 10) / 10, 1, 20));
  return {
    ...attrs,
    pace: drop(attrs.pace, 0.9), stamina: drop(attrs.stamina, 0.9), strength: drop(attrs.strength, 0.6),
    passing: drop(attrs.passing, 0.3), shooting: drop(attrs.shooting, 0.3), tackling: drop(attrs.tackling, 0.3),
    positioning: drop(attrs.positioning, 0.2), workrate: drop(attrs.workrate, 0.3), keeping: drop(attrs.keeping, 0.25),
    setPiece: drop(attrs.setPiece, 0.2), durability: drop(attrs.durability, 0.7),
  };
}

export interface Listing { player: Player; fee: number; age: number; ov: number }

/** The fictional players available to BUY this season — quality scaled to the club's tier (shop at your
 *  level), across all four positions, deterministic per (seed, season, tier). */
export function transferList(seed: number, season: number, tier: number, size = TRANSFER_LIST_SIZE): Listing[] {
  // Market quality sits above the tier baseline — and at the TOP tiers it opens up to genuine title-contender
  // signings (+3) so a dynasty that INVESTS can build a squad that exceeds the league and actually wins the
  // top flight (fees scale with ov², so it's a real, coin-gated reward — not a freebie). Lower tiers keep the
  // tight +1 that made the pyramid climb feel earned. Fixes the "top flight is unwinnable at ~5%" balance flag.
  // Headroom trimmed (was 3/1). Taking the best of ~20 listings with ±3 jitter already puts the top name ~5
  // above the tier baseline, so the MARKET — not the match engine — was erasing the difficulty: two signings a
  // season took every simulated career to the top flight. (PT-903)
  // Top-flight clubs keep a little more reach (2 vs 0): with headroom trimmed everywhere the title rate at
  // tier 1 collapsed to 4% — reaching the summit but being unable to ever win there is its own dead end.
  // RAISED 2/0 -> 7/5 when the club's own rating was put on the same scale as its opponents'.
  // `clubLeagueStrength` was a mean of `overall()` measured against opponents expressed as a QUALITY, and
  // `generateClub(q)` yields an XI measuring q + 2.35 — so the club carried ~2.35 unearned points, nearly
  // two divisions, in every simmed fixture and in its own row of the table. Correcting that took a dynasty
  // from reaching the top flight in 100% of 30-season runs to 17%, ending at tier 3.5 with no titles: the
  // climb had been resting on the bug.
  //
  // The compensation belongs HERE rather than in `tierStrength`, and that is not a preference. Lowering the
  // pyramid moves the opposition and the shop together — `tierStrength` feeds both `seededOpponents` and
  // this line — so it cancels exactly; measured, intercepts of 16.8, 15.9, 15.6 and 15.3 all produce the
  // same 17%. Headroom is the only lever that lets a club outgrow its division, and it is the better place
  // for the difference to live anyway: strength now has to be BOUGHT with coins the club earned, instead of
  // being handed over by a scale mismatch nobody could see. Measured at 7/5: 90% of dynasties reach the top
  // flight after ~19 seasons, ending tier 1.8, titles 11% of top-flight seasons, and one manager's tenure
  // still ends at tier 5.5 having never got there — the family arrives, no single generation does.
  const headroom = tier <= 2 ? 7 : 5;
  const quality = clamp(tierStrength(tier) + headroom, 4, 18);
  // generate a couple of squads' worth at this quality, then take a spread across positions
  // rich=true: market players are FULL characters (15 stats + personality + traits) — you're signing a
  // person into your squad, not a stat line, so the card must read as richly as the bloodline star's.
  const club = generateClub(`market-${season}-${tier}`, 'Free Agents', 0x888888, quality, hash32(seed, season * 7919, tier * 131), true);
  const pool = club.players.slice();
  const out: Listing[] = [];
  for (let i = 0; i < size && i < pool.length; i++) {
    const p = pool[i];
    const ov = overall(p);
    const age = 18 + (hash32(seed, season, i * 97) % 15);          // 18..32, flavour + fee nudge
    const youthPremium = age <= 23 ? 1.25 : age >= 30 ? 0.8 : 1;    // young + able = dearer
    // stamp the listing's age ONTO the player so a signing carries it into the squad (it used to be
    // sidecar-only and was discarded at purchase, leaving bought players ageless — PT-90)
    out.push({ player: { ...p, id: `mk:${season}:${tier}:${i}`, age }, fee: Math.round(transferFee(ov) * youthPremium), age, ov });
  }
  return out.sort((a, b) => b.ov - a.ov);
}

// ── incoming bids for your star ────────────────────────────────────────────────────────────────────
const BIDDER_CLUBS = ['Real Valmonte', 'Internazionale Brava', 'Atlético Kesport', 'Bayern Hoffung',
  'Olympique Marenne', 'Sporting Duruvia', 'AC Trentia', 'FC Norhavn', 'Club Volenza', 'Ajax Poranto'];

export interface Bid { club: string; fee: number }
/** An occasional rival BID for the bloodline star — the drama of cashing in vs keeping the dynasty player.
 *  Only fires for a genuinely good star, and not every season (deterministic ~1-in-3). Null = no bid. */
export function incomingBid(seed: number, season: number, starOverall: number, starAge: number): Bid | null {
  if (starOverall < 13 || starAge > 31) return null;             // only real assets attract bids
  const h = hash32(seed, season * 104729, Math.round(starOverall));
  if (h % 3 !== 0) return null;                                   // ~1 season in 3
  const club = BIDDER_CLUBS[h % BIDDER_CLUBS.length];
  // a MARQUEE offer for your dynasty star — priced off the BUY fee (a release-clause premium over what he'd
  // cost to sign), not the offload-haircut sell value, so cashing in is genuinely franchise-sized money and
  // the "sell vs keep" beat has real weight (PT-62). Younger = pricier; up to ~40% variance.
  const premium = starAge <= 24 ? 2.2 : starAge <= 28 ? 1.8 : 1.4;
  const fee = Math.round(transferFee(starOverall) * premium * (1 + (h % 40) / 100));
  return { club, fee };
}
