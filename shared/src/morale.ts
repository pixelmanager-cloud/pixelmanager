// Player MORALE — a live manager-game state (0-100), NOT an on-chain stat. It rises with playing time
// and winning, and falls when a player is benched, frozen out, or left on a lapsed contract. An unhappy
// player agitates to leave: he costs MORE to re-sign (holding out) and sells for LESS (an unsettled
// asset) — a squeeze that forces the owner's hand. This turns the contract mechanic into a living squad
// instead of a spreadsheet. Pure + deterministic; the server owns the number, this owns the rules.
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const START_MORALE = 65;

/** Things that happen to a player in a season, each nudging morale. */
export type MoraleEvent =
  | 'played_win' | 'played_draw' | 'played_loss'  // featured in a result
  | 'benched'                                       // in the squad but left on the bench
  | 'unused'                                        // not selected at all
  | 'contract_lapsed'                               // his deal expired and wasn't renewed (benched by the rules)
  | 'extended'                                       // re-signed — a vote of confidence
  | 'transfer_listed'                                // put up for sale — unsettling
  | 'won_trophy';                                    // shared in a title/cup — a big lift
// THE LADDER, AND WHY played_loss IS -3 AND NOT -1 OR -4.
//
// Each of these is applied at most ONCE per season and then drifts 15% toward 60, so what matters is not
// the delta but the fixed point it settles at. Measured over 40 seasons of the same event from START_MORALE:
//
//   played_win      +6  ->  91   settled and happy
//   played_draw     +2  ->  69   content
//   played_loss     -3  ->  46   content, one point above the unsettled cut
//   benched         -3  ->  46   content
//   unused          -5  ->  35   unsettled
//   contract_lapsed -8  ->  18   wants to leave
//
// played_loss was -1, settling at 57 — and because it had no emitter at all (see squad.ts), a losing season
// actually paid played_draw's +2 and settled at 69. A first-team regular at a club beaten every week for
// twelve years ended HAPPIER than the day he signed. Losing was free.
//
// -3 makes it cost something real: 69 -> 46 is a 23-point swing, and it moves the club from a 5% discount
// and a 4% premium on that player to paying 8% more to re-sign him and getting 6% less when it sells —
// about a 13% swing on the re-sign either side of a winning season.
//
// NOT -4, which was the first suggestion. -4 settles at 40, BELOW `benched` — and since a player receives
// exactly one of these per season, that would say a man who plays every week in a losing side is unhappier
// than one who is never picked at all. That inverts the selection axis, which is the thing this model is
// actually about. -3 sits level with `benched` instead: a season of losing is as corrosive as a season on
// the bench, and neither on its own makes him agitate.
//
// The deliberate consequence: at 46 a losing regular is ONE point above `unsettled` (<= 45), so a losing
// season alone does not put him on the squad report's unhappy list — but a losing season plus anything else
// (a lapsed deal, a year out of the side) does. If a losing spell should surface on its own, the honest
// change is to move the unsettled threshold or the whole selection half of this ladder, not to push
// played_loss underneath `benched`. That is a bigger re-tune and it is not this.
const MORALE_DELTA: Record<MoraleEvent, number> = {
  played_win: 6, played_draw: 2, played_loss: -3,
  benched: -3, unused: -5, contract_lapsed: -8, extended: 10, transfer_listed: -6, won_trophy: 12,
};
/** Apply one event to a morale value (clamped 0-100). */
export function updateMorale(current: number, event: MoraleEvent): number {
  return clamp(Math.round(current + MORALE_DELTA[event]), 0, 100);
}
/** Between-season drift toward a neutral baseline — grudges fade, complacency creeps in. */
export function driftMorale(current: number): number {
  return clamp(Math.round(current + (60 - current) * 0.15), 0, 100);
}

export interface MoraleEffects {
  happy: boolean;        // ≥75 — settled, a small discount to re-sign
  unsettled: boolean;    // ≤45 — restless
  wantsAway: boolean;    // ≤25 — agitating for a move (hand-forcing)
  extendMult: number;    // multiplier on the contract-extension cost (unhappy → holds out for more)
  sellMult: number;      // multiplier on the sale/release value (unsettled → worth less on the market)
  label: string;
}
/** How a player's current morale bends what it costs to keep him and what he'd sell for. */
export function moraleEffects(morale: number): MoraleEffects {
  return {
    happy: morale >= 75,
    unsettled: morale <= 45,
    wantsAway: morale <= 25,
    extendMult: clamp(1 + (60 - morale) * 0.006, 0.85, 1.3),  // ≤ +30% to re-sign an unhappy player, −15% for a happy one
    sellMult: clamp(1 - (60 - morale) * 0.004, 0.8, 1.1),     // an unsettled player sells for up to 20% less
    // BOUNDARIES MUST AGREE WITH THE FLAGS. The flags above use `<=` and this ternary used `>=`, so both
    // bounds were inclusive on both sides: at exactly 45 the player was flagged `unsettled` while the squad
    // screen labelled him 'content', and at exactly 25 he was flagged `wantsAway` while reading 'unsettled'.
    // Two values out of 101 where the game told the player the opposite of what it had decided.
    label: morale >= 75 ? 'settled and happy' : morale > 45 ? 'content' : morale > 25 ? 'unsettled' : 'wants to leave',
  };
}
