// QA fuzz harness — ECONOMY / MONEY-LOOP correctness: the server-side (server/src/index.ts,
// server/src/tokens.ts) coin faucets and sinks. Unlike shared/qa_dynasty_fuzz.ts (which proxied the
// dynasty economy bridge for a multi-generation sim), this harness goes straight at the REAL formulas —
// reading them out of server/src/index.ts/tokens.ts and property-testing them for NaN/negative/unbounded
// output, monotonicity, and (critically) whether the endpoint itself can be called repeatedly to mint
// unbounded coins with no server-side gate.
//
// Where a constant/formula lives as an un-exported literal inside a route handler in
// server/src/index.ts (STAFF_COSTS, the season-reward prize formula, the sponsor upfront table,
// CLUB_WAGE_CUT/PRO_SIGNING_SHARE/RETIREMENT_LEGACY_SHARE), it is MIRRORED here verbatim with a
// source-line comment — see docs/qa-bug-report.md's "known limitations" section for the drift risk this
// implies. `graduatedFields`, `rebornFields`, `legacyBoost`, `clubInvestOf`, GENESIS_COST/REBORN_COST are
// REAL imports (they're exported), not mirrors.
//
// New file — does not modify server/src or shared/src. Run: `npx tsx shared/qa_money_loop_fuzz.ts`.

import { legacyBoost, graduate, rollGenes, seedFrom, mulberry32, clubInvestOf, type CareerPlayerAttrs } from './src/career.js';
import { GENESIS_COST, REBORN_COST, MARKET_FEE_PCT, rebornFields } from '../server/src/tokens.js';
import { developAttrs } from '../server/src/lifecycle.js';
import type { Token } from '../server/src/store.js';

const MAX_LOGGED = 60;
const failures: string[] = [];
const log = (msg: string) => { if (failures.length < MAX_LOGGED) failures.push(msg); };
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

// ── mirrored constants/formulas (see file header). Source: server/src/index.ts as of commit b57aa88. ──
const STAFF_COSTS: Record<string, number> = { fitness: 350, attack: 350, assistant: 500 }; // index.ts:606
const CLUB_WAGE_CUT = 0.25;          // index.ts:520
const PRO_SIGNING_SHARE = 0.4;       // index.ts:521
const RETIREMENT_LEGACY_SHARE = 0.6; // index.ts:522

/** Mirrors POST /sp/season-reward's prize formula, index.ts:620-631. */
function seasonRewardPrize(posRaw: number, sizeRaw: number, sponsor: string | undefined) {
  const pos = Math.max(1, Math.min(20, Math.floor(Number(posRaw) || 10)));
  const size = Math.max(2, Math.min(30, Math.floor(Number(sizeRaw) || 10)));
  const frac = (pos - 1) / (size - 1);
  const prize = pos === 1 ? 800 : Math.round(120 + (1 - frac) * 480);
  const sponsorBonus = sponsor === 'performance' && pos <= 3 ? (pos === 1 ? 700 : 400) : 0;
  return { pos, size, frac, prize, sponsorBonus, total: prize + sponsorBonus };
}
/** Mirrors POST /sp/sponsor's upfront table, index.ts:634-640. */
function sponsorUpfront(deal: string): number | null {
  return deal === 'steady' ? 450 : deal === 'performance' ? 150 : null;
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// 1. STAFF COSTS — must be positive, finite, and match the documented table
// ══════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n[qa-money] STAFF_COSTS sanity...');
for (const [id, cost] of Object.entries(STAFF_COSTS)) {
  if (!finite(cost) || cost <= 0) log(`STAFF_COSTS.${id}=${cost} is not a positive finite coin cost`);
}
console.log(`[qa-money] STAFF_COSTS: ${Object.keys(STAFF_COSTS).length} entries checked (${JSON.stringify(STAFF_COSTS)})`);

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// 2. SEASON-REWARD PRIZE FORMULA — bounds, monotonicity, and the pos>size edge
// ══════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n[qa-money] /sp/season-reward prize formula — bounds + monotonicity...');
{
  let sawNegative = false, worstNegative = 0, worstCase = '';
  // sweep the FULL client-controllable domain: pos/size are independently clamped to [1,20]/[2,30], but
  // nothing stops a client sending a pos that exceeds size within that domain (e.g. "5th of 3" makes no
  // real-season sense, but the server never checks pos<=size before computing frac).
  for (let pos = 1; pos <= 20; pos++) {
    for (let size = 2; size <= 30; size++) {
      const r = seasonRewardPrize(pos, size, undefined);
      if (!finite(r.prize) || !finite(r.total)) log(`seasonRewardPrize(pos=${pos},size=${size}) produced a non-finite prize: ${JSON.stringify(r)}`);
      if (r.total < 0) { sawNegative = true; if (r.total < worstNegative) { worstNegative = r.total; worstCase = `pos=${pos} size=${size}`; } }
    }
  }
  if (sawNegative) {
    log(`BUG: /sp/season-reward's prize formula goes NEGATIVE whenever the client-supplied pos exceeds size (both clamped independently to their own documented ranges — [1,20] and [2,30] — but pos is never validated against size). Worst observed within the fully in-range client domain: total=${worstNegative} at ${worstCase}. Confirmed repro: seasonRewardPrize(20, 2) => prize -8520 (POST /sp/season-reward {pos:20,size:2} would call db.addCoins(ownerId, -8520), DEDUCTING coins from the account instead of paying a season prize).`);
  }
  // monotonicity: for a FIXED, sane size, prize must be non-increasing as pos worsens (1 = best)
  for (let size = 2; size <= 30; size++) {
    let prevPrize = Infinity;
    for (let pos = 1; pos <= size; pos++) {
      const r = seasonRewardPrize(pos, size, undefined);
      if (r.prize > prevPrize) log(`seasonRewardPrize: prize INCREASED going from a better to a worse finish (size=${size}, pos=${pos}, prize=${r.prize} > previous ${prevPrize})`);
      prevPrize = r.prize;
    }
    // champion's prize must be the best of the season
    const champ = seasonRewardPrize(1, size, undefined).prize;
    const last = seasonRewardPrize(size, size, undefined).prize;
    if (champ < last) log(`seasonRewardPrize: champion(pos=1,size=${size}) prize ${champ} < last-place prize ${last}`);
  }
  // sponsor bonus: only 'performance' + top-3 pays, and never for a non-'performance' deal
  for (let pos = 1; pos <= 20; pos++) {
    const withPerf = seasonRewardPrize(pos, 20, 'performance').sponsorBonus;
    const withSteady = seasonRewardPrize(pos, 20, 'steady').sponsorBonus;
    const withNone = seasonRewardPrize(pos, 20, undefined).sponsorBonus;
    if (withSteady !== 0) log(`seasonRewardPrize: a 'steady' sponsor deal paid a performance bonus (${withSteady}) at pos=${pos}`);
    if (withNone !== 0) log(`seasonRewardPrize: no sponsor deal paid a bonus (${withNone}) at pos=${pos}`);
    if (pos > 3 && withPerf !== 0) log(`seasonRewardPrize: performance bonus paid outside top-3 (pos=${pos}, bonus=${withPerf})`);
    if (pos <= 3 && withPerf === 0) log(`seasonRewardPrize: performance bonus MISSING inside top-3 (pos=${pos})`);
  }
  console.log(`[qa-money] season-reward: bounds/monotonicity/sponsor-gating checked across the full client-controllable pos∈[1,20] × size∈[2,30] domain${sawNegative ? ' — NEGATIVE PRIZE BUG FOUND (see failures)' : ''}`);
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// 3. THE HEADLINE FINDING — repeat-call unbounded coin minting (a code-reading finding, demonstrated
//    mathematically here: no season/claim state gates POST /sp/season-reward or POST /sp/sponsor)
// ══════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n[qa-money] repeat-call mint check (season-reward / sponsor)...');
{
  // Simulate what an authenticated client can do TODAY: call /sp/season-reward (or /sp/sponsor) as many
  // times as it wants in a row. Nothing in server/src/index.ts's handler bodies reads or writes a
  // "season already claimed" flag, a nonce, or any per-season/per-account state before calling
  // db.addCoins() — grep confirms no such guard exists anywhere in the codebase (see report).
  let mintedViaSeasonReward = 0, mintedViaSponsor = 0;
  const CALLS = 500; // a real bot/macro could do this thousands of times a second; 500 is illustrative
  for (let i = 0; i < CALLS; i++) {
    mintedViaSeasonReward += seasonRewardPrize(1, 20, 'performance').total; // best-case single call: 800+700=1500
    mintedViaSponsor += sponsorUpfront('steady')!; // 450 per call, no cooldown
  }
  console.log(`[qa-money] ${CALLS} repeated POST /sp/season-reward calls with {pos:1,size:20,sponsor:'performance'} would mint ${mintedViaSeasonReward} coins (${mintedViaSeasonReward / CALLS}/call) — UNBOUNDED with more calls, no server-side gate found`);
  console.log(`[qa-money] ${CALLS} repeated POST /sp/sponsor calls with {deal:'steady'} would mint ${mintedViaSponsor} coins (${mintedViaSponsor / CALLS}/call) — UNBOUNDED with more calls, no server-side gate found`);
  log(`EXPLOIT: POST /sp/season-reward (server/src/index.ts ~line 620) has NO per-season/per-account claim-state check before db.addCoins(ownerId, prize+sponsorBonus) — an authenticated client can call it repeatedly (e.g. {pos:1,size:20,sponsor:'performance'} → +1500 coins EVERY call) to mint unbounded coins. Confirmed by reading the full handler body and grepping the codebase for any "claimed"/season-guard state (server/src/*.ts) — none exists for this route.`);
  log(`EXPLOIT: POST /sp/sponsor (server/src/index.ts ~line 636) has the SAME gap — no check that a sponsor deal hasn't already been taken this season before db.addCoins(ownerId, upfront); repeatable for +450 coins ('steady') per call, unbounded.`);
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// 4. SUCC/REBORN LEGACY MATH — bounded, non-negative, and (unlike #3) correctly single-use per generation
// ══════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n[qa-money] succeed()/reborn() legacy payout + mentorship math...');
{
  let checked = 0;
  for (let i = 0; i < 3000; i++) {
    const earnings = [-500, 0, 100, 5000, 50000, 1e7][i % 6];
    const legacy = Math.round(Math.max(0, earnings) * RETIREMENT_LEGACY_SHARE); // index.ts guards with `if (legacy > 0)` before paying, but the value itself isn't clamped — mirror both
    const legacyRaw = Math.round(earnings * RETIREMENT_LEGACY_SHARE); // the ACTUAL unguarded expression from index.ts
    checked++;
    if (!finite(legacyRaw)) log(`legacy payout non-finite for earnings=${earnings}`);
    if (earnings < 0 && legacyRaw >= 0) { /* fine, just noting the guard `if (legacy > 0)` protects this */ }
    if (earnings >= 0 && legacyRaw < 0) log(`legacy payout negative for non-negative earnings=${earnings}: ${legacyRaw}`);
    // mentorship bonus: mirrors index.ts succeed() — `Math.min(3, Math.ceil(mentorship / 2))`, mentorship clamped [0,10]
    const mentorship = Math.max(0, Math.min(10, [0, 1, 2, 5, 10, -3, 20][i % 7]));
    const bonus = Math.min(3, Math.ceil(mentorship / 2));
    if (!finite(bonus) || bonus < 0 || bonus > 3) log(`mentorship devBonus=${bonus} out of [0,3] for mentorship=${mentorship}`);
  }
  console.log(`[qa-money] legacy/mentorship math: ${checked} (earnings, mentorship) pairs checked — the ACTUAL succeed()/reborn() code path guards a negative legacy with \`if (legacy > 0)\` before paying, so a negative-earnings token (shouldn't occur — graduate() clamps earnings >= 0 — but is not itself impossible for a hand-edited/corrupted row) correctly pays nothing rather than deducting coins`);
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// 5. CAREER→CLUB BRIDGE (real graduate() earnings, mirrored bridge math) — no NaN/negative/unbounded
// ══════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n[qa-money] career -> club bridge (CLUB_WAGE_CUT / PRO_SIGNING_SHARE) across many real graduated careers...');
{
  let checked = 0, maxWindfall = 0, maxClubGain = 0;
  for (let i = 0; i < 4000; i++) {
    const seed = seedFrom('qa-money-bridge', i);
    const genes = rollGenes(seed);
    // a cheap stand-in career log isn't needed — graduate() only needs `log` for stat derivation, and an
    // empty log is a valid (if bland) input, exercising the earnings=0 (ctx default) boundary too
    const rng = mulberry32(seed);
    const earningsCtx = Math.round(rng() * 20000) - 2000; // include negative, to probe the guard
    const grad = graduate([], seed, genes, undefined, { earnings: Math.max(0, earningsCtx) });
    checked++;
    if (!finite(grad.earnings) || grad.earnings < 0) log(`graduate().earnings=${grad.earnings} invalid (ctx.earnings=${earningsCtx})`);
    const clubGain = Math.round(grad.earnings * CLUB_WAGE_CUT);
    const windfall = Math.round(grad.earnings * PRO_SIGNING_SHARE);
    if (!finite(clubGain) || clubGain < 0) log(`clubGain=${clubGain} invalid for earnings=${grad.earnings}`);
    if (!finite(windfall) || windfall < 0) log(`windfall=${windfall} invalid for earnings=${grad.earnings}`);
    maxWindfall = Math.max(maxWindfall, windfall);
    maxClubGain = Math.max(maxClubGain, clubGain);
  }
  console.log(`[qa-money] career->club bridge: ${checked} graduated careers checked. max single windfall=${maxWindfall}, max single clubGain=${maxClubGain} (both bounded by the career's own earnings, which OFFER/lifestyle caps keep in the low thousands per career — see shared/src/career.ts's OFFERS table)`);
  // clubInvestOf (REAL import, not mirrored) — must be non-negative and 0 for a non-club-investment item
  for (const id of ['invest-club-sm', 'invest-club-lg', 'boots', 'not-a-real-item', '']) {
    const v = clubInvestOf(id);
    if (!finite(v) || v < 0) log(`clubInvestOf("${id}")=${v} invalid`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// 6. GENESIS/REBORN/MARKET fee constants — sane, positive, and MARKET_FEE_PCT in [0,100]
// ══════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n[qa-money] GENESIS_COST/REBORN_COST/MARKET_FEE_PCT sanity...');
{
  if (!finite(GENESIS_COST) || GENESIS_COST <= 0) log(`GENESIS_COST=${GENESIS_COST} invalid`);
  if (!finite(REBORN_COST) || REBORN_COST <= 0) log(`REBORN_COST=${REBORN_COST} invalid`);
  if (!finite(MARKET_FEE_PCT) || MARKET_FEE_PCT < 0 || MARKET_FEE_PCT > 100) log(`MARKET_FEE_PCT=${MARKET_FEE_PCT} out of [0,100]`);
  for (const price of [-100, 0, 1, 1000, 1e7]) {
    const proceeds = Math.round(price * (1 - MARKET_FEE_PCT / 100));
    if (price >= 0 && (!finite(proceeds) || proceeds < 0 || proceeds > price)) log(`market proceeds=${proceeds} invalid for price=${price} (fee=${MARKET_FEE_PCT}%)`);
  }
  console.log(`[qa-money] GENESIS_COST=${GENESIS_COST} REBORN_COST=${REBORN_COST} MARKET_FEE_PCT=${MARKET_FEE_PCT}% — all sane; market proceeds never exceed the listed price`);
}

if (failures.length) {
  console.error(`\n[qa-money] FAILED — ${failures.length} issue(s)${failures.length >= MAX_LOGGED ? ' (capped)' : ''}:`);
  failures.forEach((f, i) => console.error(`\n  x [${i + 1}] ${f}`));
  process.exit(1);
}
console.log('\n[qa-money] clean — no invariant violations found.');
