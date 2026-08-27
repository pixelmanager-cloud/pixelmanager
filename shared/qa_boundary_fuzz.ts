// QA fuzz harness — BOUNDARY / EDGE conditions across the retirement, handoff, squad-role,
// tournament-strength, sponsorship/reputation and off-pitch-temptation thresholds. Where a threshold is
// DOCUMENTED (a comment or an obvious literal in the source), this harness checks the function's output
// actually flips exactly at that boundary — the kind of off-by-one that unit tests at "typical" values
// never catch. New file — does not modify server/src or shared/src.
// Run: `npx tsx shared/qa_boundary_fuzz.ts`.

import { ageOf } from './src/tokens.js'; // moved from server/src/tokens.js when the server/web3 layer was removed (offline-first pivot)
import { squadRole, firstTeamReady, FIXTURES_PER_SEASON } from './src/clubseason.js';
import { worldCup, NATIONS } from './src/intl.js';
import { computeOffPitch } from './src/offpitch.js';
import { seedFrom } from './src/career.js';

const MAX_LOGGED = 60;
const failures: string[] = [];
const log = (msg: string) => { if (failures.length < MAX_LOGGED) failures.push(msg); };
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

// ── 1. ageOf() bounds + monotonicity ──
console.log('\n[qa-boundary] ageOf() bounds + monotonicity...');
{
  // documented: clamp(25, 40, 25 + (season - primeSeason))
  const cases: [number, number, number][] = [
    [10, 10, 25],   // just signed → 25
    [10, 9, 25],    // season before prime (shouldn't happen, but must not go below 25)
    [10, 24, 39],   // 14 seasons in → 39
    [10, 25, 40],   // 15 seasons in → clamps at 40
    [10, 100, 40],  // way past → still clamps at 40
    [0, 0, 25],
    [-5, -5, 25],   // negative season numbers
    [1e6, 1e6, 25],
  ];
  for (const [prime, season, expected] of cases) {
    const a = ageOf(prime, season);
    if (a !== expected) log(`ageOf(${prime}, ${season}) = ${a}, expected ${expected}`);
  }
  // monotonic non-decreasing as season advances, for a fixed primeSeason, until it clamps at 40
  for (let prime = 0; prime < 5; prime++) {
    let prevAge = -1;
    for (let season = prime; season < prime + 20; season++) {
      const a = ageOf(prime, season);
      if (!finite(a) || a < 25 || a > 40) log(`ageOf(${prime}, ${season}) = ${a} out of [25,40]`);
      if (a < prevAge) log(`ageOf non-monotonic: prime=${prime} season=${season} age=${a} < previous ${prevAge}`);
      prevAge = a;
    }
  }
  // exact retirement boundary: age must hit exactly 40 at season = prime+15, and stay 40 forever after
  for (let prime = 0; prime < 10; prime++) {
    if (ageOf(prime, prime + 14) !== 39) log(`ageOf(${prime}, ${prime + 14}) should be 39 (one season before retirement), got ${ageOf(prime, prime + 14)}`);
    if (ageOf(prime, prime + 15) !== 40) log(`ageOf(${prime}, ${prime + 15}) should be 40 (retirement season), got ${ageOf(prime, prime + 15)}`);
    if (ageOf(prime, prime + 16) !== 40) log(`ageOf(${prime}, ${prime + 16}) should stay 40 post-retirement, got ${ageOf(prime, prime + 16)}`);
  }
  console.log('[qa-boundary] ageOf: documented boundary cases + monotonicity across 100 (prime,season) pairs checked');
}

// ── 2. squadRole() status-label boundaries (Key player >=16, Regular starter >=11, Squad rotation >=6) ──
console.log('\n[qa-boundary] squadRole() status-threshold boundaries...');
{
  let checked = 0;
  for (let band = 0; band <= 6; band++) {
    for (let ovr = 0; ovr <= 25; ovr++) {
      checked++;
      const { apps, status, share } = squadRole(band, ovr);
      const expected = apps >= 16 ? 'Key player' : apps >= 11 ? 'Regular starter' : apps >= 6 ? 'Squad rotation' : 'Breaking in';
      if (status !== expected) log(`squadRole(band=${band},ovr=${ovr}): status="${status}" but apps=${apps} implies "${expected}"`);
      if (!finite(share) || share < 0 || share > 1) log(`squadRole(band=${band},ovr=${ovr}).share=${share} out of [0,1]`);
      if (!finite(apps) || apps < 0 || apps > FIXTURES_PER_SEASON) log(`squadRole(band=${band},ovr=${ovr}).apps=${apps} out of [0,${FIXTURES_PER_SEASON}]`);
    }
  }
  console.log(`[qa-boundary] squadRole: ${checked} (band,overall) cells checked — every status label matches its own apps threshold`);
}

// ── 3. firstTeamReady() threshold: bandIdx>=5 always true; bandIdx<3 always false; band 3-4 gated by
//    `overall >= 9 + clubLevel*1.2` ──
console.log('\n[qa-boundary] firstTeamReady() threshold boundary...');
{
  let checked = 0;
  for (let band = 0; band <= 6; band++) {
    for (let clubLevel = 0; clubLevel <= 10; clubLevel++) {
      for (let ovr = 0; ovr <= 25; ovr++) {
        checked++;
        const ready = firstTeamReady(band, ovr, clubLevel);
        let expected: boolean;
        if (band >= 5) expected = true;
        else if (band < 3) expected = false;
        else expected = ovr >= 9 + clubLevel * 1.2;
        if (ready !== expected) log(`firstTeamReady(band=${band},ovr=${ovr},clubLevel=${clubLevel}) = ${ready}, expected ${expected} (threshold=${(9 + clubLevel * 1.2).toFixed(1)})`);
      }
    }
  }
  console.log(`[qa-boundary] firstTeamReady: ${checked} (band,clubLevel,overall) cells checked against the documented threshold formula`);
}

// ── 4. worldCup() nation-strength extremes: myStrength far outside [1,20], and an UNKNOWN myNation ──
console.log('\n[qa-boundary] worldCup() nation-strength extremes + unknown-nation input...');
{
  for (const myStrength of [-100, -1, 0, 1, 20, 21, 100, 1000, NaN]) {
    const ctx = `myStrength=${myStrength}`;
    try {
      const wc = worldCup(seedFrom('qa-boundary-wc', myStrength), 1, 'Astoria', myStrength);
      if (wc.field.length !== 16 || new Set(wc.field).size !== 16) log(`worldCup field corrupted at extreme/NaN strength: ${JSON.stringify(wc.field)}  ${ctx}`);
      if (!['Champions', 'Runners-up', 'Semi-finals', 'Quarter-finals', 'Group stage', 'Did not qualify'].includes(wc.myFinish)) {
        log(`worldCup at extreme/NaN strength produced an invalid myFinish: "${wc.myFinish}"  ${ctx}`);
      }
      // does a bad myStrength poison the SCORES (not just the bracket shape)? Every group/QF/SF/final
      // score should still be finite non-negative — this is the exact same class of bug as M1 (NaN
      // tactics -> NaN positions) if it reproduces here.
      for (const g of wc.groups) for (const r of g.rows) {
        if (!finite(r.GF) || !finite(r.GA) || !finite(r.Pts)) log(`worldCup group row non-finite at ${ctx}: ${JSON.stringify(r)}`);
      }
      for (const t of [...wc.quarters, ...wc.semis, wc.final]) {
        if (!finite(t.gh) || !finite(t.ga) || t.gh < 0 || t.ga < 0) log(`worldCup tie score non-finite/negative at ${ctx}: round=${t.round} [${t.gh},${t.ga}]`);
      }
    } catch (err) {
      log(`EXCEPTION in worldCup at extreme strength: ${(err as Error).stack ?? err}  ${ctx}`);
    }
  }
  // unknown nation not in the NATIONS pool
  try {
    const wc = worldCup(seedFrom('qa-boundary-wc-unknown'), 1, 'Atlantis (not a real nation)', 14);
    if (wc.field.includes('Atlantis (not a real nation)')) {
      // fine — an unrecognised nation can still be its own field member; just verify no corruption
      if (new Set(wc.field).size !== 16) log(`worldCup with an unknown myNation corrupted field uniqueness`);
    } else {
      log(`worldCup: myNation "Atlantis (not a real nation)" got dropped from its own field entirely`);
    }
  } catch (err) {
    log(`EXCEPTION in worldCup with an unrecognised myNation: ${(err as Error).stack ?? err}`);
  }
  console.log('[qa-boundary] worldCup extremes: NaN/negative/huge strength + unknown-nation input checked');
}

// ── 5. computeOffPitch() reputation/endorsement TIER boundaries (documented cut points) ──
console.log('\n[qa-boundary] computeOffPitch() tier-boundary exactness...');
{
  // image tier cut points: 20/40/60/80 ; endorsement count cut points: 22/45/70 ; endorsement tier: 45/75
  // Drive careerScore/caps/bigWins/flair combos to land EXACTLY at each imageScore boundary and verify
  // the tier label flips at the documented cut, not one off either side.
  const imageScoreFor = (careerScore: number) => Math.max(0, Math.min(100, Math.round(careerScore / 12)));
  for (const target of [19, 20, 21, 39, 40, 41, 59, 60, 61, 79, 80, 81]) {
    // solve careerScore so imageScore lands near `target` (careerScore/12, rounded)
    const careerScore = target * 12;
    const op = computeOffPitch({ careerScore, caps: 0, seed: 1, turn: 1, tags: {}, bigWins: 0, flair: 0 });
    const expectedTier = op.image.score >= 80 ? 'Global icon' : op.image.score >= 60 ? 'Household name' : op.image.score >= 40 ? 'Rising name' : op.image.score >= 20 ? 'Known locally' : 'Unknown quantity';
    if (op.image.tier !== expectedTier) log(`computeOffPitch: image.score=${op.image.score} (target~${target}) has tier "${op.image.tier}", expected "${expectedTier}"`);
    const expectedCount = op.image.score >= 70 ? 3 : op.image.score >= 45 ? 2 : op.image.score >= 22 ? 1 : 0;
    if (op.endorsements.length !== expectedCount) log(`computeOffPitch: image.score=${op.image.score} has ${op.endorsements.length} endorsements, expected ${expectedCount}`);
    const expectedEndTier = op.image.score >= 75 ? 'Global' : op.image.score >= 45 ? 'National' : 'Local';
    for (const e of op.endorsements) if (e.tier !== expectedEndTier) log(`computeOffPitch: endorsement tier "${e.tier}" != expected "${expectedEndTier}" at image.score=${op.image.score}`);
  }
  // reputation edge boundary: repScore < -8 => edgy, else clean (per the source's own comment)
  for (const [teamwork, leadership, composure, aggression, flair] of [[10, 0, 0, 0, 0], [0, 0, 0, 10, 0], [3, 0, 0, 3, 0], [0, 0, 0, 0, 20]]) {
    const op = computeOffPitch({ careerScore: 100, caps: 0, seed: 2, turn: 1, tags: { teamwork, leadership, composure, aggression, flair }, bigWins: 0, flair });
    const expectedEdge = op.reputation.score < -8 ? 'edgy' : 'clean';
    if (op.reputation.edge !== expectedEdge) log(`computeOffPitch: reputation.score=${op.reputation.score} has edge="${op.reputation.edge}", expected "${expectedEdge}" per the <-8 rule`);
  }
  console.log('[qa-boundary] computeOffPitch tier boundaries: image tiers, endorsement count/tier, reputation edge — all checked against their documented cut points');
}

// ── 6. off-pitch TEMPTATION gating rate: documented 26% (edgy) / 12% (clean) chance per turn ──
console.log('\n[qa-boundary] computeOffPitch() temptation-gate empirical rate...');
{
  const N = 20000;
  let edgyTempted = 0, edgyTotal = 0, cleanTempted = 0, cleanTotal = 0;
  for (let i = 0; i < N; i++) {
    const seed = seedFrom('qa-boundary-tempt', i);
    const turn = i % 50;
    // force a clearly edgy or clearly clean reputation via tags, half and half
    const edgy = i % 2 === 0;
    const tags = edgy ? { aggression: 20, flair: 20 } : { teamwork: 20, leadership: 20, composure: 20 };
    const op = computeOffPitch({ careerScore: 300, caps: 2, seed, turn, tags, bigWins: 1, flair: edgy ? 10 : 0 });
    if (op.reputation.edge === 'edgy') { edgyTotal++; if (op.temptation) edgyTempted++; }
    else { cleanTotal++; if (op.temptation) cleanTempted++; }
  }
  const edgyRate = edgyTotal ? edgyTempted / edgyTotal : 0;
  const cleanRate = cleanTotal ? cleanTempted / cleanTotal : 0;
  console.log(`[qa-boundary] temptation empirical rate — edgy: ${(edgyRate * 100).toFixed(1)}% (want ~26%, n=${edgyTotal})  clean: ${(cleanRate * 100).toFixed(1)}% (want ~12%, n=${cleanTotal})`);
  if (Math.abs(edgyRate - 0.26) > 0.03) log(`temptation rate for edgy reputations is ${(edgyRate * 100).toFixed(1)}%, documented as ~26% (tolerance ±3pp) — n=${edgyTotal}`);
  if (Math.abs(cleanRate - 0.12) > 0.03) log(`temptation rate for clean reputations is ${(cleanRate * 100).toFixed(1)}%, documented as ~12% (tolerance ±3pp) — n=${cleanTotal}`);
  // every temptation object, when present, must be well-formed and one of the 4 documented kinds
  const KINDS = new Set(['gamble', 'bribe', 'nightlife', 'invest']);
  for (let i = 0; i < 3000; i++) {
    const op = computeOffPitch({ careerScore: 300, caps: 1, seed: seedFrom('qa-boundary-tempt2', i), turn: i % 80, tags: { aggression: 15 }, bigWins: 1, flair: 8 });
    if (op.temptation && !KINDS.has(op.temptation.kind)) log(`computeOffPitch.temptation.kind="${op.temptation.kind}" not one of the documented 4 kinds`);
  }
}

if (failures.length) {
  console.error(`\n[qa-boundary] FAILED — ${failures.length} issue(s)${failures.length >= MAX_LOGGED ? ' (capped)' : ''}:`);
  failures.forEach((f, i) => console.error(`\n  x [${i + 1}] ${f}`));
  process.exit(1);
}
console.log('\n[qa-boundary] clean — no boundary/threshold violations found.');
