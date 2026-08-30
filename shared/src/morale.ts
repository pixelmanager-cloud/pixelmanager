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
const MORALE_DELTA: Record<MoraleEvent, number> = {
  played_win: 6, played_draw: 2, played_loss: -1,
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
