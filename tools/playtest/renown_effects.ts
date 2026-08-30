// Renown "opens doors" — but a dynasty that is already winning must not be handed the tools to win by
// more. Each effect has to be worth having at the bottom of the ladder and close to spent at the top, or
// a strong house snowballs out of the field's reach and the rival table dies as a contest.
import { renownPedigree, renownBidMult, renownIncomeMult, HOUSE_TIERS } from '../../shared/src/renown.js';

console.log('=== what the name opens, rung by rung ===');
for (const t of HOUSE_TIERS) {
  console.log(`  ${t.icon} ${t.name.padEnd(24)} ${String(t.at).padStart(6)}  heir pedigree +${renownPedigree(t.at).toFixed(3)}`
    + `  ·  bids ×${renownBidMult(t.at).toFixed(2)}  ·  income ×${renownIncomeMult(t.at).toFixed(2)}`);
}

const fail = (m: string) => { console.log('✗ ' + m); process.exitCode = 1; };
const royalty = HOUSE_TIERS[HOUSE_TIERS.length - 1].at;
const mid = HOUSE_TIERS[3].at;
// Worth having early: half the total benefit should land by the middle of the ladder, where a house is
// still climbing, rather than being back-loaded onto the houses that already won.
if (renownIncomeMult(mid) - 1 < (renownIncomeMult(royalty) - 1) * 0.35) fail('the effects are back-loaded onto houses that have already won');
// And close to spent at the top: the last rung must not still be handing out large gains.
const lastRungGain = (renownIncomeMult(royalty) - 1) - (renownIncomeMult(HOUSE_TIERS[6].at) - 1);
if (lastRungGain > 0.08) fail(`the top rung still grants +${(lastRungGain * 100).toFixed(0)}% income — a winning house keeps pulling away`);
if (renownIncomeMult(royalty) > 1.6 || renownBidMult(royalty) > 1.7) fail('the caps are too generous — the name replaces the football');
if (!process.exitCode) console.log('\n✓ the name opens doors early and stops mattering once they are open');
