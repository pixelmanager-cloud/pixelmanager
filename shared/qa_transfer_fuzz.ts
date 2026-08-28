// Validates the transfer economy: buy/sell fees, the tier-scaled market list, contract negotiation, and
// incoming bids. Run standalone or via `npm run qa`. Locks in the money math so a future change can't
// silently break it (fees going negative, lowballs getting accepted, the top tier selling pub players…).
import { transferList, transferFee, sellValue, incomingBid } from './src/transfermarket.js';
import { contractDemand, wageForLength, evaluateContractOffer } from './src/contracts.js';

let failures = 0;
const check = (cond: boolean, msg: string) => { if (cond) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); failures++; } };

// 1. fees + sell values
check(transferFee(5) > 0 && sellValue(5) > 0, 'fees + sell values are positive');
let feeMono = true, sellUnder = true;
for (let ov = 4; ov <= 19; ov++) {
  if (transferFee(ov + 1) <= transferFee(ov)) feeMono = false;
  if (sellValue(ov) >= transferFee(ov)) sellUnder = false;
}
check(feeMono, 'transferFee strictly increases with ability');
check(sellUnder, 'sell value is always below the buy fee (a haircut)');

// 2. the market list scales with tier + is well-formed
const avgOv = (tier: number, seed = 1) => { const l = transferList(seed, 3, tier); return l.reduce((s, x) => s + x.ov, 0) / l.length; };
check(avgOv(1) > avgOv(10) + 3, `the top tier offers clearly better players than the bottom (t1 ${avgOv(1).toFixed(1)} vs t10 ${avgOv(10).toFixed(1)})`);
const l5 = transferList(999, 3, 5);
check(l5.length > 0 && l5.every((x) => ['GK', 'DF', 'MF', 'FW'].includes(x.player.role) && x.fee > 0 && x.age >= 18 && x.age <= 32 && x.ov >= 1), 'every listing is a valid player with a positive fee + sane age/OV');
check(new Set(l5.map((x) => x.player.id)).size === l5.length, 'listing ids are unique (no accidental double-buy)');
check(JSON.stringify(transferList(7, 4, 6)) === JSON.stringify(transferList(7, 4, 6)), 'the market is deterministic per (seed, season, tier)');

// 3. contract negotiation
const dMerc = contractDemand(15, 27, 18, 'maverick');
const dLoyal = contractDemand(15, 27, 5, 'leader');
check(wageForLength(dMerc, 6) > wageForLength(dMerc, 2), 'a mercenary demands MORE wage for a longer deal');
check(wageForLength(dLoyal, 6) < wageForLength(dLoyal, 2), 'a loyal player accepts LESS wage for a longer (secure) deal');
const d = contractDemand(14, 28, 12);
const rank: Record<string, number> = { reject: 0, counter: 1, accept: 2 };
let outMono = true;
for (const L of [2, 4, 6]) {
  const ask = wageForLength(d, L); let prev = -1;
  for (const mult of [0.7, 0.85, 0.95, 1.0, 1.2]) {
    const o = evaluateContractOffer(d, Math.round(ask * mult), L).outcome;
    if (rank[o] < prev) outMono = false;
    prev = rank[o];
  }
}
check(outMono, 'raising the offer never worsens the outcome (reject → counter → accept)');
check(evaluateContractOffer(d, wageForLength(d, 4), 4).outcome === 'accept', 'meeting his ask is accepted');
check(evaluateContractOffer(d, Math.round(wageForLength(d, 4) * 0.5), 4).outcome === 'reject', 'a big lowball is rejected');
check(evaluateContractOffer(d, Math.round(wageForLength(d, 4) * 0.5), 4).outcome !== 'accept', 'a lowball is never ACCEPTED (so the facade never charges for it)');

// 4. incoming bids
check(incomingBid(1, 3, 8, 24) === null, 'no bid for a weak player (OV 8)');
check(incomingBid(1, 3, 16, 33) === null, 'no bid for an over-the-hill star (age 33)');
let bid = null as ReturnType<typeof incomingBid>;
for (let s = 0; s < 40 && !bid; s++) bid = incomingBid(s * 7 + 1, 3, 16, 24);
check(!!bid && bid.fee > sellValue(16), 'a bid, when it comes, beats the plain sell value (a premium)');
check(JSON.stringify(incomingBid(42, 5, 15, 25)) === JSON.stringify(incomingBid(42, 5, 15, 25)), 'bids are deterministic per (seed, season)');

console.log(failures === 0 ? '\n✓ all transfer checks passed' : `\n✗ ${failures} transfer check(s) FAILED`);
if (failures > 0) process.exit(1);
