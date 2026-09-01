// Mental-layer + trait effects the match engine reads (from the Career Sim). Every modifier is
// CENTRED at the neutral stat (10): a player WITHOUT mental stats (all existing base/NFT/test
// players) yields 1.0 / 0.0 and behaves exactly as before — only career-built players deviate.
// This keeps `npm run verify` green while letting developed players play differently.
import type { Player } from './types.js';

const NEUTRAL = 0.5; // norm(10)
// GUARDED AGAINST NON-FINITE INPUT, which `?? 10` does not catch. NaN passed straight through here and
// poisoned teamLeadership (Math.max with NaN stays NaN) -> finish -> goalProb, and `rng() < NaN` is false
// for ever: measured, ONE outfielder with a NaN leadership took a side from ~78 goals in 60 matches to 4,
// with no throw, no log, and the match completing normally. `overall()` in teams.ts already guards exactly
// this class, and its own comment records that it once "permanently poisoned the wallet" — the lesson was
// learned twelve files away and never applied here.
const norm = (v: number | undefined) => (Number.isFinite(v as number) ? (v as number) : 10) / 20;

/** Centred multiplier: 1.0 at stat=10, 1±k*0.5 at the extremes. */
export const mMul = (stat: number | undefined, k: number) => 1 + k * (norm(stat) - NEUTRAL);
/** Centred additive: 0 at stat=10, ±k*0.5 at the extremes. */
export const mAdd = (stat: number | undefined, k: number) => k * (norm(stat) - NEUTRAL);
/** Does this player carry an earned career trait? (base/NFT players have none → false.) */
export const hasTrait = (p: Player, id: string) => !!p.traits?.includes(id);
/** A team-wide leadership steadiness bonus from the side's best leader (centred, small). */
export function teamLeadership(players: Player[]): number {
  // a NAMED captain leads the side (his leadership drives it, slightly amplified for the armband);
  // with no captain set, the best natural leader carries it. Naming your best leader = strictly best.
  //
  // THAT LAST SENTENCE USED TO BE FALSE, AND BACKWARDS WHERE IT MATTERED MOST. The armband was applied by
  // raising the COEFFICIENT (0.045 -> 0.05), and `mAdd` is centred: it returns k * (lead/20 - 0.5), which
  // is NEGATIVE for any leader below 10. Multiplying a negative by a bigger k makes it worse, so naming
  // your best leader was a strict PENALTY for every squad whose best leader is under neutral. Measured on
  // real minted squads: 30% of tier-7 clubs and 100% of tier 8, 9 and 10. Every dynasty starts at the
  // bottom of the pyramid, so this was live for the opening seasons of every save ever played.
  //
  // The armband is a BONUS now, never a penalty: the base is the leader's own centred value, and the
  // captain's extra is clamped at zero so wearing it can never cost you.
  const cap = players.find((p) => p.captain);
  // EMPTY means neutral; it does not mean a FLOOR. Seeding the reduce at 0 made an empty squad return
  // mAdd(0, 0.045) = -0.0225, the single worst value this function can produce, where neutral is the only
  // defensible answer for "no players" — every other absent-data path in this file answers 10. But seeding
  // it at 10 instead is just as wrong in the other direction: it would floor the real maximum, so a
  // genuinely weak back four would read as neutral and the bottom divisions would lose their weakness.
  // Handle the empty case on its own and take the true maximum otherwise.
  const leads = players.map((p) => p.attrs.leadership ?? 10);
  const best = leads.length ? Math.max(...leads) : 10;
  const lead = cap ? (cap.attrs.leadership ?? 10) : best;
  // BORN LEADER, which until now was the most-held trait in the game that did nothing. "Lifts the whole
  // team" is exactly what this function computes, so the trait belongs here and nowhere else. It is a flat
  // bonus on top of the leadership the side already has, and it is bounded: a leaderless XI cannot conjure
  // one, because the man carrying it still has to be the captain or the best natural leader on the pitch.
  const bearer = cap ?? (players.length
    ? players.reduce((a, b) => ((b.attrs.leadership ?? 10) > (a.attrs.leadership ?? 10) ? b : a), players[0])
    : undefined);
  const born = bearer ? hasTrait(bearer, 'leader') : false;
  return mAdd(lead, 0.045) + (cap ? Math.max(0, mAdd(lead, 0.005)) : 0) + (born ? 0.012 : 0);
}
