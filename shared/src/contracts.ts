// Manager-side player economics — what it costs to KEEP or SELL a player, and whether his contract
// lets you pick him. The NFT is ALWAYS an owned asset in the wallet; a contract only gates SELECTION.
// When a contract lapses the player stays owned but is BENCHED (unavailable) until you either extend it
// (pay the wage) or sell the NFT (its release clause). Pure + deterministic — server and client both
// read this so the rule is identical everywhere. Kept out of career.ts so it's barrel-exported to the
// Manager game without dragging the Layer-1 breeder sim along.
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Wage (coins) to EXTEND a contract: better + greedier players cost more; veterans get cheaper; and a
 *  proven high-EARNER commands an established wage (a retention COST, not power — a bounded +0..40%). */
export function contractCost(overall: number, age: number, greed: number, earnings = 0): number {
  const ageFactor = age <= 30 ? 1 : clamp(1 - (age - 30) * 0.06, 0.4, 1);
  const greedFactor = 0.6 + 0.08 * greed;                          // greed 10 → 1.4x, 20 → 2.2x, 1 → 0.68x
  const wageMult = 1 + clamp(earnings / 12000, 0, 0.4);            // established name → dearer to keep (cap +40%)
  return Math.round(overall * overall * 1.2 * ageFactor * greedFactor * wageMult);
}

/** The breeder's PAYOUT (coins) when a career-built NFT first sells: the earnings it banked in
 *  development — so developing a player well is itself rewarded (the breeder side of the economy). */
export const breederRevenue = (earnings: number) => Math.max(0, Math.round(earnings));

/** Deal LENGTH (seasons) a player commits to: a loyal one-club man signs long (5), a mercenary short
 *  (2) — so greed drives how often you face the expensive re-sign decision. */
export function contractLength(greed: number, personality?: string): number {
  const nudge = personality === 'leader' || personality === 'workhorse' ? 0.7
    : personality === 'maverick' || personality === 'mercurial' ? -0.7 : 0;
  return clamp(Math.round(5 - greed * 0.18 + nudge), 2, 5);
}

/** Asking price (coins) to SELL the NFT instead of extending: ability-driven, inflated by fame + greed. */
export function releaseClause(overall: number, marketability = 10, greed = 10): number {
  return Math.round(overall * overall * 3 * (1 + (marketability - 10) * 0.03) * (1 + (greed - 10) * 0.02));
}

/** Off-chain contract state, keyed by (owner, tokenId). The NFT itself is owned on-chain regardless. */
export interface Contract { signedSeason: number; lengthSeasons: number }
export const contractExpirySeason = (c: Contract) => c.signedSeason + c.lengthSeasons;
/** Selectable this season? False once the contract has lapsed → the owner must extend or sell. */
export const contractActive = (c: Contract, currentSeason: number) => currentSeason < contractExpirySeason(c);
/** Sign/re-sign now: a fresh deal of the player's preferred length starting this season. */
export function signContract(currentSeason: number, greed: number, personality?: string): Contract {
  return { signedSeason: currentSeason, lengthSeasons: contractLength(greed, personality) };
}

/** Everything the UI needs to render one owned player's contract situation + the two choices. */
export interface PlayerContractView {
  available: boolean;    // can he be selected this season?
  seasonsLeft: number;   // seasons until the current deal lapses (0 = lapsed/unsigned → benched)
  lengthSeasons: number; // length of the deal he'll sign on renewal
  extendCost: number;    // coins to re-sign him now
  sellValue: number;     // coins you'd get by selling the NFT instead
}
/** Compute a player's contract situation. `contract` is null for a never-signed / just-acquired NFT
 *  (benched until you sign him). greed/marketability default to neutral for non-career-built players. */
export function contractView(
  overall: number, age: number, greed = 10, marketability = 10, personality: string | undefined,
  contract: Contract | null, currentSeason: number, earnings = 0, seasonsStaked = 0,
): PlayerContractView {
  // continuous staking tenure with one account earns a loyalty discount on the re-sign cost (−4%/season, cap −25%)
  const loyalty = clamp(1 - Math.max(0, seasonsStaked) * 0.04, 0.75, 1);
  return {
    available: contract ? contractActive(contract, currentSeason) : false,
    seasonsLeft: contract ? Math.max(0, contractExpirySeason(contract) - currentSeason) : 0,
    lengthSeasons: contractLength(greed, personality),
    extendCost: Math.round(contractCost(overall, age, greed, earnings) * loyalty),
    sellValue: releaseClause(overall, marketability, greed),
  };
}
