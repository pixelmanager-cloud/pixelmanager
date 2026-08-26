// STAKING — commit an NFT to an account to make it usable, and reward loyalty (holding) over time.
//
// MANAGER side: a Player NFT must be STAKED to your club to be ELIGIBLE for selection this season (the
// on-chain "he's in my squad" commitment, composed with the off-chain contract terms). The longer he
// stays CONTINUOUSLY staked with the same account, the cheaper he is to re-sign — a loyalty/tenure
// discount, and a HODL incentive that discourages flipping (good for a stable NFT economy).
//
// BREEDER side: a prospect NFT staked while it develops earns a small "settled academy" bonus the
// longer it's kept — patient development beats churning half-baked prospects.
//
// Pure + deterministic. On-chain locking + tenure tracking is the server/web3 piece; these are the rules.
// Loyalty is a RETENTION reward available to everyone (hold long → pay less), not pay-to-win.
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Discount MULTIPLIER on a player's extension cost from continuous staking tenure with one account:
 *  −4% per season, capped at −25%. (Apply to contractCost / contractView's extendCost.) */
export const loyaltyDiscount = (seasonsStaked: number) => clamp(1 - Math.max(0, seasonsStaked) * 0.04, 0.75, 1);

/** Selectable this season? Requires BOTH: the NFT is staked to the club AND its contract is current. */
export const stakingEligible = (staked: boolean, contractActive: boolean) => staked && contractActive;

/** Fraction of a season's loyalty already accrued between renewals — for a UI progress bar (0..1). */
export const loyaltyProgress = (seasonsStaked: number) => clamp((seasonsStaked % 1 === 0 ? 0 : seasonsStaked % 1), 0, 1);

/** Development BONUS (0..0.10) for patiently developing a staked prospect: +2%/season kept, capped +10%.
 *  A prospect settled at one academy develops better than one flipped around. */
export const prospectStakeBonus = (seasonsStaked: number) => clamp(Math.max(0, seasonsStaked) * 0.02, 0, 0.1);

/** Human label for a staking tenure, for the squad UI. */
export function loyaltyLabel(seasonsStaked: number): string {
  return seasonsStaked >= 6 ? 'one-club loyalty' : seasonsStaked >= 3 ? 'settled' : seasonsStaked >= 1 ? 'bedding in' : 'new signing';
}
