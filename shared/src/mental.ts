// Mental-layer + trait effects the match engine reads (from the Career Sim). Every modifier is
// CENTRED at the neutral stat (10): a player WITHOUT mental stats (all existing base/NFT/test
// players) yields 1.0 / 0.0 and behaves exactly as before — only career-built players deviate.
// This keeps `npm run verify` green while letting developed players play differently.
import type { Player } from './types.js';

const NEUTRAL = 0.5; // norm(10)
const norm = (v: number | undefined) => (v ?? 10) / 20;

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
  const cap = players.find((p) => p.captain);
  const best = players.reduce((m, p) => Math.max(m, p.attrs.leadership ?? 10), 0);
  const lead = cap ? (cap.attrs.leadership ?? 10) : best;
  return mAdd(lead, cap ? 0.05 : 0.045); // ±small to teammates' finishing composure
}
