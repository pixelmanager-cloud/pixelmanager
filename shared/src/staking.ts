// STAKING — commit an NFT to an account to make it usable, and reward loyalty (holding) over time.
//
// MANAGER side: a Player NFT must be STAKED to your club to be ELIGIBLE for selection this season (the
// on-chain "he's in my squad" commitment, composed with the off-chain contract terms). The longer he
// stays CONTINUOUSLY staked with the same account, the cheaper he is to re-sign — a loyalty/tenure
// discount, and a HODL incentive that discourages flipping (good for a stable NFT economy).
//
// There is no BREEDER side any more: a prospect cannot be registered at all — `api.stake` refuses with
// "only pros can be staked" (client/src/api.ts:656) — so the academy-tenure bonus this header used to
// promise had no path to a player. See the tombstone below.
//
// Pure + deterministic. Registration + tenure state is just `staked_since` on the token; these are the rules.
// Loyalty is a RETENTION reward available to everyone (hold long → pay less), not pay-to-win.
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Discount MULTIPLIER on a player's extension cost from continuous staking tenure with one account:
 *  −4% per season, capped at −25%. (Apply to contractCost / contractView's extendCost.) */
export const loyaltyDiscount = (seasonsStaked: number) => clamp(1 - Math.max(0, seasonsStaked) * 0.04, 0.75, 1);

/** Selectable this season? Requires BOTH: the NFT is staked to the club AND its contract is current. */
export const stakingEligible = (staked: boolean, contractActive: boolean) => staked && contractActive;

// `loyaltyProgress`, `prospectStakeBonus` and `loyaltyLabel` REMOVED 2026-09-04. Three declared rules with no
// production caller between them: `shared/qa_economy_fuzz.ts` was the only file in the repo that imported any
// of them, which is why fuzzing them stayed green for months while the game never ran a line of them.
//
// `loyaltyProgress` was `clamp(seasonsStaked % 1 === 0 ? 0 : seasonsStaked % 1, 0, 1)`, documented as "for a
// UI progress bar (0..1)". It could not return anything but 0. The sole producer of `seasonsStaked` is
// `tokenContract` in tokens.ts — `Math.max(0, season - t.staked_since)`, two integers — so the modulus is
// always 0 and the first branch always wins. A probe over tenures 0..40, and over real `tokenContract` output,
// got exactly one distinct value: 0. Had anyone ever bound it to a bar, a player would have watched that bar
// sit empty for a forty-season dynasty. Nobody bound it, so nobody ever saw it fail.
//
// `prospectStakeBonus` (+2%/season, cap +10%, "for patiently developing a staked prospect") was unreachable by
// construction, not merely uncalled: `staked_since` is written in exactly two places — `api.stake`, which
// refuses anything that is not a pro, and graduation, where the token has already become a pro. No prospect
// can ever hold tenure, so the settled-academy incentive this module advertised was never on offer.
//
// `loyaltyLabel` ('one-club loyalty' / 'settled' / 'bedding in' / 'new signing') said "for the squad UI"; the
// squad UI writes its own tenure line (client/src/main.ts:1165) and never imported it. Not broken, just never
// wired — and putting that word on the card is a copy decision, not a repair, so it goes with the rest.
//
// Deleted rather than left standing: this file is the stated home of the loyalty rules, and three of its five
// exports described mechanics the game does not have. That shape has already cost this codebase twice —
// `breederRevenue` (contracts.ts) was twice read as live while reasoning about the economy, and the loyalty
// discount itself ran as two inlined copies (F-050) while the version here sat unimported one file away.
