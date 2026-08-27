// QA fuzz harness — MANAGER-SIDE ECONOMY modules: contracts.ts, prestige.ts, morale.ts, legacy.ts,
// staking.ts. These are small pure/deterministic functions but feed money/eligibility decisions
// directly, so a NaN or out-of-bounds value here is a real gameplay bug (e.g. a negative wage, a
// contract that's "active" forever, morale multipliers escaping their documented caps).
// New file — does not modify shared/src. Run: `npx tsx shared/qa_economy_fuzz.ts`.

import { contractCost, contractLength, releaseClause, contractView, signContract, contractActive, contractExpirySeason, type Contract } from './src/contracts.js';
import { prestigeScore, managerPrestige, type ManagerRecord, type HonourLite } from './src/prestige.js';
import { updateMorale, driftMorale, moraleEffects, START_MORALE, type MoraleEvent } from './src/morale.js';
import { legacyCard, type PlayerAchievements } from './src/legacy.js';
import { loyaltyDiscount, stakingEligible, loyaltyProgress, prospectStakeBonus, loyaltyLabel } from './src/staking.js';

const MAX_LOGGED = 60;
const failures: string[] = [];
const log = (msg: string) => { if (failures.length < MAX_LOGGED) failures.push(msg); };
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

// ── CONTRACTS ────────────────────────────────────────────────────────────────
console.log('\n[qa-economy] contracts.ts fuzz...');
{
  // greed is ALWAYS clamped to [1,20] wherever it's produced (graduate() in career.ts), so that's the
  // real domain; we still probe a bit outside it (0, 21) to check for a cliff-edge right at the boundary.
  const OVR = [-5, 0, 1, 8, 16, 20, 30];
  const AGE = [-10, 0, 16, 25, 30, 35, 40, 60];
  const GREED = [0, 1, 5, 10, 15, 20, 21];
  const EARN = [-100, 0, 1000, 12000, 50000];
  let checked = 0;
  for (const ovr of OVR) for (const age of AGE) for (const greed of GREED) for (const earn of EARN) {
    checked++;
    const ctx = `ovr=${ovr} age=${age} greed=${greed} earn=${earn}`;
    const cost = contractCost(ovr, age, greed, earn);
    if (!finite(cost) || cost < 0) log(`contractCost negative/non-finite: ${cost}  ${ctx}`);
    const len = contractLength(greed);
    if (!finite(len) || len < 2 || len > 5) log(`contractLength out of [2,5]: ${len}  ${ctx}`);
    const rc = releaseClause(ovr, 10, greed);
    if (!finite(rc) || rc < 0) log(`releaseClause negative/non-finite: ${rc}  ${ctx}`);
  }
  console.log(`[qa-economy] contracts numeric sweep (realistic domain): ${checked} combinations checked`);

  // out-of-domain probe (greed deeply negative — never produced by graduate(), but contractView/
  // contractCost take a raw number and do no validation): document, don't fail the run over it.
  {
    let brokeNegative = false;
    for (const greed of [-30, -15, -8, -7]) {
      const cost = contractCost(12, 27, greed, 0);
      if (cost < 0) brokeNegative = true;
    }
    console.log(`[qa-economy] out-of-domain note: contractCost(greed<=-8) goes NEGATIVE (unreachable via graduate()'s clamp[1,20], but contractCost itself has no input validation) — brokeNegative=${brokeNegative}`);
  }

  // contractView / signContract / contractActive round-trip
  for (let s = 0; s < 500; s++) {
    const greed = (s % 20) + 1;
    const personality = ['pro', 'maverick', 'leader', undefined][s % 4];
    const currentSeason = s % 30;
    const c = signContract(currentSeason, greed, personality);
    const ctx = `season=${currentSeason} greed=${greed} personality=${personality}`;
    if (c.signedSeason !== currentSeason) log(`signContract: signedSeason mismatch  ${ctx}`);
    if (!contractActive(c, currentSeason)) log(`signContract: freshly signed contract not active in its signing season  ${ctx}`);
    if (contractActive(c, contractExpirySeason(c))) log(`contractActive: contract still active AT its expiry season (off-by-one?)  ${ctx}`);
    if (!contractActive(c, contractExpirySeason(c) - 1)) log(`contractActive: contract inactive one season before expiry  ${ctx}`);

    const view = contractView(12, 27, greed, 10, personality, c, currentSeason, 2000, s % 10);
    if (typeof view.available !== 'boolean') log(`contractView.available not boolean  ${ctx}`);
    if (!finite(view.seasonsLeft) || view.seasonsLeft < 0) log(`contractView.seasonsLeft invalid: ${view.seasonsLeft}  ${ctx}`);
    if (!finite(view.extendCost) || view.extendCost < 0) log(`contractView.extendCost invalid: ${view.extendCost}  ${ctx}`);
    if (!finite(view.sellValue) || view.sellValue < 0) log(`contractView.sellValue invalid: ${view.sellValue}  ${ctx}`);

    const viewNull = contractView(12, 27, greed, 10, personality, null, currentSeason);
    if (viewNull.available !== false) log(`contractView: null contract should never be available  ${ctx}`);
    if (viewNull.seasonsLeft !== 0) log(`contractView: null contract should have 0 seasonsLeft  ${ctx}`);
  }
}

// ── PRESTIGE ─────────────────────────────────────────────────────────────────
console.log('\n[qa-economy] prestige.ts fuzz...');
{
  let checked = 0;
  for (let i = 0; i < 3000; i++) {
    const rng = (n: number) => ((i * 2654435761 + n * 40503) >>> 0) / 4294967296;
    const nHonours = Math.floor(rng(1) * 8);
    const honours: HonourLite[] = Array.from({ length: nHonours }, (_, k) => ({
      tierIdx: Math.floor(rng(k + 2) * 12) - 1, // include -1 (out of documented [0,9])
      title: rng(k + 20) < 0.5 ? 1 : 0,
      kind: rng(k + 40) < 0.5 ? 'league' : 'cup',
    }));
    const r: ManagerRecord = {
      wins: Math.floor(rng(60) * 500) - 10,
      draws: Math.floor(rng(61) * 200) - 5,
      losses: Math.floor(rng(62) * 200),
      honours,
      highestTierIdx: Math.floor(rng(63) * 15) - 2,
      seasons: Math.floor(rng(64) * 40) - 3,
    };
    checked++;
    const ctx = `i=${i} record=${JSON.stringify(r)}`;
    try {
      const score = prestigeScore(r);
      if (!finite(score)) log(`prestigeScore non-finite: ${score}  ${ctx}`);
      const p = managerPrestige(r);
      if (!finite(p.score) || p.score !== score) log(`managerPrestige.score mismatch with prestigeScore  ${ctx}`);
      if (p.levelIdx < 0 || p.levelIdx > 8) log(`managerPrestige.levelIdx out of [0,8]: ${p.levelIdx}  ${ctx}`);
      if (p.progress < 0 || p.progress > 1 || !finite(p.progress)) log(`managerPrestige.progress out of [0,1]: ${p.progress}  ${ctx}`);
      if (p.leagueTitles < 0 || p.cupTitles < 0) log(`managerPrestige negative title counts  ${ctx}`);
    } catch (err) {
      log(`EXCEPTION: ${(err as Error).stack ?? err}  ${ctx}`);
    }
  }
  console.log(`[qa-economy] prestige: ${checked} records checked`);
}

// ── MORALE ───────────────────────────────────────────────────────────────────
console.log('\n[qa-economy] morale.ts fuzz...');
{
  const EVENTS: MoraleEvent[] = ['played_win', 'played_draw', 'played_loss', 'benched', 'unused', 'contract_lapsed', 'extended', 'transfer_listed', 'won_trophy'];
  let m = START_MORALE;
  for (let i = 0; i < 5000; i++) {
    const ev = EVENTS[i % EVENTS.length];
    m = updateMorale(m, ev);
    if (!finite(m) || m < 0 || m > 100) log(`updateMorale drifted out of [0,100]: ${m} after event ${ev} (step ${i})`);
    if (i % 17 === 0) { m = driftMorale(m); if (!finite(m) || m < 0 || m > 100) log(`driftMorale out of [0,100]: ${m} (step ${i})`); }
  }
  // also probe with out-of-range starting morale
  for (const start of [-50, -1, 0, 100, 101, 500]) {
    const eff = moraleEffects(start);
    if (!finite(eff.extendMult) || eff.extendMult < 0.85 || eff.extendMult > 1.3) log(`moraleEffects.extendMult out of [0.85,1.3] for morale=${start}: ${eff.extendMult}`);
    if (!finite(eff.sellMult) || eff.sellMult < 0.8 || eff.sellMult > 1.1) log(`moraleEffects.sellMult out of [0.8,1.1] for morale=${start}: ${eff.sellMult}`);
  }
  console.log(`[qa-economy] morale: 5000-step drift walk + extreme-start moraleEffects checked`);
}

// ── LEGACY CARD ──────────────────────────────────────────────────────────────
console.log('\n[qa-economy] legacy.ts (legacyCard) fuzz...');
{
  const ROLES = ['GK', 'DF', 'MF', 'FW'] as const;
  let checked = 0;
  for (let i = 0; i < 3000; i++) {
    const rng = (n: number) => ((i * 6700417 + n * 97) >>> 0) / 4294967296;
    const role = ROLES[i % 4];
    const prime = Math.round(1 + rng(1) * 24); // include >20 (out of the usual 1-20 stat scale)
    const peak = Math.round(prime + (rng(2) - 0.5) * 10);
    const ach: PlayerAchievements = {
      seasons: Math.round(rng(3) * 30) - 2,
      apps: Math.round(rng(4) * 600) - 10,
      leagueTitles: Math.round(rng(5) * 10),
      cupTitles: Math.round(rng(6) * 10),
      promotions: Math.round(rng(7) * 6),
      highestTierIdx: Math.round(rng(8) * 12) - 2,
    };
    checked++;
    const ctx = `i=${i} role=${role} prime=${prime} peak=${peak} ach=${JSON.stringify(ach)}`;
    try {
      const card = legacyCard(role, prime, peak, ach);
      if (!finite(card.legendRating) || card.legendRating < 0 || card.legendRating > 100) log(`legacyCard.legendRating out of [0,100]: ${card.legendRating}  ${ctx}`);
      if (!finite(card.testimonial) || card.testimonial < 0 || card.testimonial > 2000) log(`legacyCard.testimonial out of [0,2000]: ${card.testimonial}  ${ctx}`);
      if (typeof card.mintable !== 'boolean') log(`legacyCard.mintable not boolean  ${ctx}`);
      if (card.legendRating >= 65 && !card.mintable) log(`legacyCard: legendRating ${card.legendRating} >= 65 but mintable=false  ${ctx}`);
      if (card.legendRating < 65 && card.mintable) log(`legacyCard: legendRating ${card.legendRating} < 65 but mintable=true  ${ctx}`);
    } catch (err) {
      log(`EXCEPTION: ${(err as Error).stack ?? err}  ${ctx}`);
    }
  }
  console.log(`[qa-economy] legacyCard: ${checked} checked`);
}

// ── STAKING ──────────────────────────────────────────────────────────────────
console.log('\n[qa-economy] staking.ts fuzz...');
{
  for (const s of [-100, -5, -0.5, 0, 0.5, 1, 3, 6, 6.5, 20, 1000]) {
    const ld = loyaltyDiscount(s);
    if (!finite(ld) || ld < 0.75 || ld > 1) log(`loyaltyDiscount out of [0.75,1] for seasonsStaked=${s}: ${ld}`);
    const lp = loyaltyProgress(s);
    if (!finite(lp) || lp < 0 || lp > 1) log(`loyaltyProgress out of [0,1] for seasonsStaked=${s}: ${lp}`);
    const psb = prospectStakeBonus(s);
    if (!finite(psb) || psb < 0 || psb > 0.1) log(`prospectStakeBonus out of [0,0.1] for seasonsStaked=${s}: ${psb}`);
    const label = loyaltyLabel(s);
    if (typeof label !== 'string' || !label) log(`loyaltyLabel invalid for seasonsStaked=${s}: "${label}"`);
  }
  for (const staked of [true, false]) for (const active of [true, false]) {
    const el = stakingEligible(staked, active);
    if (el !== (staked && active)) log(`stakingEligible(${staked},${active}) returned ${el}, expected ${staked && active}`);
  }
  console.log('[qa-economy] staking: extreme-tenure + eligibility matrix checked');
}

if (failures.length) {
  console.error(`\n[qa-economy] FAILED — ${failures.length} issue(s)${failures.length >= MAX_LOGGED ? ' (capped)' : ''}:`);
  failures.forEach((f, i) => console.error(`\n  x [${i + 1}] ${f}`));
  process.exit(1);
}
console.log('\n[qa-economy] clean — no invariant violations found.');
