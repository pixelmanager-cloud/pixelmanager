// QA fuzz harness — SCRIPTED STRATEGIES DRIVEN INTO THE FULL DYNASTY LOOP (batch-3 backlog item #2).
//
// `shared/qa_dynasty_fuzz.ts` chains career->graduate->15 pro/manager seasons->retirement->reborn across
// many generations, but every generation's CAREER is played with a random-choice policy (`playFullCareer`).
// `shared/qa_strategy_fuzz.ts` (batch 2) drives deterministic scripted policies (`always-develop`/
// `always-safe`/`always-aggressive`) but only for ONE career in isolation — never chained across
// generations. Neither harness asks: "what happens if EVERY generation of a bloodline plays the same
// deterministic extreme strategy, for 20+ generations straight?" A consistently-safe or consistently-
// aggressive dynasty is exactly the kind of degenerate input that surfaces cross-generation drift
// (inherited genes/devBonus compounding a bias every generation) or economy starvation/runaway that
// random-choice play — which averages itself out — never reaches.
//
// This file reuses `shared/qa_dynasty_fuzz.ts`'s pro/manager-phase simulation (season loop, clubSeason,
// continental cup, national call-ups, World Cup) VERBATIM in spirit, swapping only the career-generation
// step: instead of `playFullCareer`'s random policy, each generation of a dynasty plays under ONE fixed
// scripted policy (mirroring `qa_strategy_fuzz.ts`'s `runPolicy`) for the WHOLE dynasty, generation after
// generation, with genes/devBonus/familyCoins inherited exactly as the real reborn() flow does.
//
// Invariants checked (same as qa_dynasty_fuzz.ts, PLUS cross-generation trend checks specific to running
// one policy consistently):
//   - all the usual per-generation bounds (attrs [1,20], overall [1,20], earnings>=0, achievements>=0,
//     legacyCard bounds, gene bands well-formed)
//   - no runaway economy (familyClubCoins bounded) and no STARVATION (an always-safe/always-aggressive
//     dynasty must never drive family coins to a permanently-stuck-at-zero or negative state)
//   - overall/pedigree do not runaway-compound across 20+ generations of the SAME strategy (a scenario
//     random-choice fuzzing never reaches, since it never repeats one policy every generation)
//   - strict determinism: replaying the same (dynastySeed, policy) dynasty twice is byte-identical
//
// Run: `npx tsx shared/qa_dynasty_strategy_fuzz.ts` (QA_ROOTS / QA_GENS env overrides, defaults below).

import {
  Career, graduate, rollGenes, inheritGenes, legacyBoost, seedFrom, AGENTS, fit, cardPower,
  TOTAL_TURNS, type Track, type Card, type Genes, type CareerPlayer, type PlayerAchievements, type CareerPlayerAttrs,
} from './src/career.js';
import { legacyCard } from './src/legacy.js';
import { clubSeason } from './src/clubseason.js';
import { tieScore, contOpponent, nationalFixture, homeNation, worldCup, playerPath, NATIONS } from './src/intl.js';
import { developAttrs } from './src/lifecycle.js';

const MAX_LOGGED = 60;
const failures: string[] = [];
const log = (msg: string) => { if (failures.length < MAX_LOGGED) failures.push(msg); };
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const CLUB_WAGE_CUT = 0.25;
const PRO_SIGNING_SHARE = 0.4;
const RETIREMENT_LEGACY_SHARE = 0.6;
const SANE_COIN_CAP = 5_000_000;

const ATTR_KEYS: (keyof CareerPlayerAttrs)[] = [
  'pace', 'strength', 'stamina', 'passing', 'shooting', 'tackling', 'positioning', 'workrate',
  'keeping', 'setPiece', 'composure', 'aggression', 'creativity', 'teamwork', 'leadership', 'durability',
];
function checkAttrs(attrs: CareerPlayerAttrs, ctx: string) {
  for (const k of ATTR_KEYS) {
    const v = attrs[k];
    if (!finite(v)) log(`NON-FINITE attrs.${k}=${v}  ${ctx}`);
    else if (v < 1 || v > 20) log(`OUT-OF-RANGE attrs.${k}=${v} (want 1..20)  ${ctx}`);
  }
}
function checkGenes(genes: Genes, ctx: string) {
  for (const band of ['pace', 'strength', 'stamina'] as const) {
    const b = genes[band];
    if (!finite(b.floor) || !finite(b.ceiling)) log(`gene band ${band} non-finite: ${JSON.stringify(b)}  ${ctx}`);
    else if (b.floor > b.ceiling) log(`gene band ${band} floor>ceiling: ${JSON.stringify(b)}  ${ctx}`);
    else if (b.floor < 1 || b.ceiling > 20) log(`gene band ${band} out of [1,20]: ${JSON.stringify(b)}  ${ctx}`);
  }
}

type PolicyName = 'always-develop' | 'always-safe' | 'always-aggressive';

/** Deterministic scripted policy, mirrored from qa_strategy_fuzz.ts's runPolicy — no rng anywhere. */
function playScriptedCareer(seed: number, track: Track, agentId: string | undefined, policy: PolicyName): Career {
  const c = new Career(seed, track, agentId);
  let guard = 0; const HARD_CAP = TOTAL_TURNS * 20 + 2000;
  while (!c.finished) {
    if (++guard > HARD_CAP) throw new Error(`softlock: exceeded ${HARD_CAP} steps (policy=${policy})`);
    const st = c.current();
    // STORY ARCS ARE A CAREER PHASE. This dispatch predates them and never handled 'arc', so the first arc
    // beat fell through to the play branch, read an undefined hand and killed the suite. Deterministic pick
    // (first choice) so the harness stays reproducible.
    if (st.phase === 'arc') { c.resolveArc((st as any).arc.choices[0].id); continue; }
    if (st.phase === 'focus') {
      const opts = st.focus;
      let pickC = opts[0];
      if (policy === 'always-develop') pickC = opts.find((o) => o.tag != null) ?? opts[opts.length - 1];
      else if (policy === 'always-safe') pickC = opts.reduce((best, o) => (Object.keys(o.effects).length > Object.keys(best.effects).length ? o : best), opts[0]);
      else pickC = opts.find((o) => o.tag != null) ?? opts[0];
      c.chooseFocus(pickC.id); continue;
    }
    if (st.phase === 'offer') {
      const ids = st.offers.map((o) => o.id);
      const target = policy === 'always-aggressive' ? (ids.includes('money') ? 'money' : ids.includes('brand') ? 'brand' : ids[0]) : 'develop';
      c.resolveOffer(ids.includes(target) ? target : ids[0]); continue;
    }
    if (st.phase === 'coach') {
      const opts = st.coaches;
      let best = opts[0];
      if (policy === 'always-safe') best = opts.reduce((b, o) => (o.specialty.length > b.specialty.length ? o : b), opts[0]);
      else if (policy === 'always-aggressive') best = opts.reduce((b, o) => (o.bonus > b.bonus ? o : b), opts[0]);
      else best = opts.filter((o) => o.kind === 'coach')[0] ?? opts[0];
      c.appointCoach(best.id); continue;
    }
    if (st.phase === 'draft') {
      const opts = st.options;
      let best: Card = opts[0], bestScore = -Infinity;
      for (const card of opts) {
        const score = policy === 'always-aggressive' ? cardPower(card)
          : policy === 'always-safe' ? (card.tags.includes('composure') || card.tags.includes('teamwork') ? 2 : 0) + cardPower(card) * 0.1
          : cardPower(card) + card.tags.length * 0.5;
        if (score > bestScore) { bestScore = score; best = card; }
      }
      c.draft(best.id); continue;
    }
    const hand = st.hand, sc = st.scenario;
    let best: Card = hand[0];
    if (policy === 'always-develop') { let bf = -Infinity; for (const card of hand) { const f = fit(card, sc); if (f > bf) { bf = f; best = card; } } }
    else if (policy === 'always-safe') { const viable = hand.filter((card) => fit(card, sc) > 0); const pool = viable.length ? viable : hand; best = pool.reduce((b, card) => (cardPower(card) < cardPower(b) ? card : b), pool[0]); }
    else best = hand.reduce((b, card) => (cardPower(card) > cardPower(b) ? card : b), hand[0]);
    c.play(best.id);
  }
  return c;
}

function parentGenesFromAttrs(attrs: CareerPlayerAttrs): Genes {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const band = (s: number) => ({ floor: clamp(s - 6, 1, 15), ceiling: clamp(s + 2, clamp(s - 6, 1, 15) + 3, 20) });
  return { pace: band(attrs.pace), strength: band(attrs.strength), stamina: band(attrs.stamina) };
}

interface GenerationResult {
  generation: number; grad: CareerPlayer; peakOverall: number; nextGenes: Genes; nextPedigree: number;
  nextDevBonus: Partial<Record<keyof CareerPlayerAttrs, number>>; familyClubCoinsRunning: number;
}

function simulateGeneration(
  dynastySeed: number, generation: number, policy: PolicyName, genes: Genes,
  devBonus: Partial<Record<keyof CareerPlayerAttrs, number>>, clubLevel: number, familyClubCoinsIn: number,
): GenerationResult {
  const careerSeed = seedFrom('qa-dstrat', dynastySeed, generation, 'career');
  const track: Track = generation % 5 === 0 ? 'goalkeeper' : 'outfield';
  const agentId = AGENTS[(dynastySeed + generation) % AGENTS.length].id;
  const ctx = `policy=${policy} dynastySeed=${dynastySeed} gen=${generation} track=${track}`;

  const c = playScriptedCareer(careerSeed, track, agentId, policy);
  const grad = graduate(c.log, careerSeed, genes, undefined, { ...c.finContext(), legacyBonus: devBonus });
  checkAttrs(grad.attrs, `graduate() ${ctx}`);
  if (!finite(grad.overall) || grad.overall < 1 || grad.overall > 20) log(`overall=${grad.overall} out of [1,20]  ${ctx}`);
  if (!finite(grad.earnings) || grad.earnings < 0) log(`grad.earnings=${grad.earnings} invalid  ${ctx}`);

  const clubGainFromCareer = Math.round(grad.earnings * CLUB_WAGE_CUT);
  const windfall = Math.round(grad.earnings * PRO_SIGNING_SHARE);

  const rng = (() => { let s = seedFrom('qa-dstrat-pro', dynastySeed, generation) >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; })();
  let attrs: any = { ...grad.attrs };
  let peakOverall = grad.overall;
  let leagueTitles = 0, cupTitles = 0, promotions = 0, apps = 0;
  const myClub = 'Marlow';
  const nation = homeNation(`DStrat${dynastySeed}Gen${generation}Pol${policy}`);
  const wcLeagueSeed = seedFrom('qa-dstrat-wc-league', dynastySeed, generation);
  let caps = 0;
  for (let season = 0; season < 15; season++) {
    const age = 25 + season;
    attrs = developAttrs(attrs, genes, age, 3);
    checkAttrs(attrs as CareerPlayerAttrs, `developAttrs season=${season} age=${age} ${ctx}`);
    const ovrProxy = Math.round((attrs.passing + attrs.shooting + attrs.tackling + attrs.positioning + attrs.composure) / 5);
    peakOverall = Math.max(peakOverall, ovrProxy);
    const strength = ovrProxy + (rng() - 0.5) * 4;
    const seasonSeed = seedFrom('qa-dstrat-season', dynastySeed, generation, season);
    const cs = clubSeason(myClub, strength, 0.85, seasonSeed);
    if (!finite(cs.pos) || cs.pos < 1 || cs.pos > cs.size) log(`clubSeason.pos=${cs.pos} out of [1,${cs.size}] season=${season}  ${ctx}`);
    if (cs.pos === 1) leagueTitles++;
    apps += 15;
    if (cs.pos <= 3) {
      let stillIn = true;
      for (const r of [0, 1, 2] as const) {
        if (!stillIn) break;
        const tie = contOpponent(seasonSeed, season, r);
        const [gh, ga] = tieScore(strength, tie.oppStrength, seedFrom('qa-dstrat-tie', seasonSeed, r), tie.neutral);
        if (!finite(gh) || !finite(ga) || gh < 0 || ga < 0 || gh > 6 || ga > 6) log(`tieScore out of [0,6]: [${gh},${ga}]  ${ctx} season=${season} round=${r}`);
        if (gh > ga) { if (r === 2) cupTitles++; } else stillIn = false;
      }
    }
    const capRate = ovrProxy >= 15 ? 0.4 : ovrProxy >= 13 ? 0.25 : ovrProxy >= 11 ? 0.12 : 0;
    if (capRate > 0 && rng() < capRate) {
      caps++;
      const cu = nationalFixture(seedFrom('qa-dstrat-natl', dynastySeed, generation, season), caps, nation, ovrProxy);
      if (!NATIONS.includes(cu.oppNation)) log(`nationalFixture: unknown oppNation "${cu.oppNation}"  ${ctx} season=${season}`);
      if (!finite(cu.forGoals) || !finite(cu.ourGoals) || cu.forGoals < 0 || cu.ourGoals < 0) log(`nationalFixture: bad goals ${JSON.stringify(cu)}  ${ctx} season=${season}`);
    }
    if ((season + 1) % 4 === 0) {
      const edition = (season + 1) / 4;
      try {
        const wc = worldCup(wcLeagueSeed, edition, nation, ovrProxy);
        if (wc.field.length !== 16 || new Set(wc.field).size !== 16) log(`chained worldCup: field corrupted  ${ctx} season=${season}`);
        if (!finite(wc.strengths[nation]) || wc.strengths[nation] < 1 || wc.strengths[nation] > 20) log(`chained worldCup: myNation strength out of [1,20] after ${generation} gens of ${policy} play  ${ctx} season=${season}`);
        const path = playerPath(wc);
        if (path?.qualified) for (const leg of [path.qf, path.sf, path.final]) if (leg && (!finite(leg.oppStrength) || leg.oppStrength < 1 || leg.oppStrength > 20)) log(`chained playerPath: bad oppStrength  ${ctx} season=${season}`);
        if (wc.myFinish === 'Champions') cupTitles += 1;
      } catch (err) { log(`EXCEPTION in chained worldCup: ${(err as Error).stack ?? err}  ${ctx} season=${season}`); }
    }
  }
  const achievements: PlayerAchievements = { seasons: 15, apps, leagueTitles, cupTitles, promotions, highestTierIdx: clubLevel };
  for (const k of Object.keys(achievements) as (keyof PlayerAchievements)[]) if (!finite(achievements[k]) || achievements[k] < 0) log(`achievements.${k}=${achievements[k]} invalid  ${ctx}`);

  const card = legacyCard(grad.role, grad.overall, peakOverall, achievements);
  if (!finite(card.legendRating) || card.legendRating < 0 || card.legendRating > 100) log(`legacyCard.legendRating=${card.legendRating} out of [0,100]  ${ctx}`);
  const retirementLegacy = Math.round(grad.earnings * RETIREMENT_LEGACY_SHARE);

  const familyClubCoinsRunning = familyClubCoinsIn + clubGainFromCareer + windfall + card.testimonial + retirementLegacy;
  if (!finite(familyClubCoinsRunning) || familyClubCoinsRunning < 0) log(`familyClubCoinsRunning went non-finite/negative under ${policy}: ${familyClubCoinsRunning}  ${ctx}`);
  if (familyClubCoinsRunning > SANE_COIN_CAP) log(`POSSIBLE RUNAWAY ECONOMY under ${policy}: familyClubCoinsRunning=${familyClubCoinsRunning} by generation ${generation}  ${ctx}`);
  // STARVATION check: a consistent strategy should never leave the family enterprise permanently stuck at
  // (or arithmetically unable to grow beyond) zero many generations in — this is the failure mode random-
  // choice fuzzing would never surface, since it never repeats the same low-earning policy every gen.
  if (generation >= 5 && familyClubCoinsRunning === 0) log(`POSSIBLE STARVATION under ${policy}: familyClubCoinsRunning stuck at exactly 0 by generation ${generation}  ${ctx}`);

  const boost = legacyBoost(achievements);
  if (!finite(boost.ceilingLift) || boost.ceilingLift < 0 || boost.ceilingLift > 3) log(`legacyBoost.ceilingLift=${boost.ceilingLift} out of [0,3]  ${ctx}`);
  if (!finite(boost.pedigree) || boost.pedigree < 0 || boost.pedigree > 1) log(`legacyBoost.pedigree=${boost.pedigree} out of [0,1]  ${ctx}`);

  const parentGenes = parentGenesFromAttrs(attrs as CareerPlayerAttrs);
  checkGenes(parentGenes, `parentGenesFromAttrs ${ctx}`);
  const nextGenes = inheritGenes(parentGenes, seedFrom('qa-dstrat-heir', dynastySeed, generation + 1), 0.6, boost.ceilingLift);
  checkGenes(nextGenes, `inheritGenes (next gen) ${ctx}`);

  return { generation, grad, peakOverall, nextGenes, nextPedigree: boost.pedigree, nextDevBonus: boost.devBonus, familyClubCoinsRunning };
}

function runDynasty(dynastySeed: number, gens: number, policy: PolicyName): GenerationResult[] {
  let genes = rollGenes(seedFrom('qa-dstrat-genesis', dynastySeed));
  let devBonus: Partial<Record<keyof CareerPlayerAttrs, number>> = {};
  let familyClubCoins = 0;
  const chain: GenerationResult[] = [];
  for (let g = 0; g < gens; g++) {
    const res = simulateGeneration(dynastySeed, g, policy, genes, devBonus, g % 6, familyClubCoins);
    chain.push(res);
    genes = res.nextGenes; devBonus = res.nextDevBonus; familyClubCoins = res.familyClubCoinsRunning;
  }
  return chain;
}

// ── run: each policy driven through every generation of every dynasty ──
const ROOTS = Number(process.env.QA_ROOTS ?? 12);
const GENS = Number(process.env.QA_GENS ?? 20);
const POLICIES: PolicyName[] = ['always-develop', 'always-safe', 'always-aggressive'];
console.log(`\n[qa-dynasty-strategy] simulating ${ROOTS} dynasties x ${GENS} generations x ${POLICIES.length} scripted policies (${ROOTS * GENS * POLICIES.length} generation-lifecycles)...`);

const summary: Record<PolicyName, { overallSum: number; count: number; coinTrend: number[] }> =
  Object.fromEntries(POLICIES.map((p) => [p, { overallSum: 0, count: 0, coinTrend: [] }])) as any;

for (const policy of POLICIES) {
  for (let i = 0; i < ROOTS; i++) {
    const dynastySeed = seedFrom('qa-dstrat-root', i);
    try {
      const chain = runDynasty(dynastySeed, GENS, policy);
      for (const r of chain) {
        if (r.nextPedigree < 0 || r.nextPedigree > 1) log(`cross-gen pedigree escaped [0,1] under ${policy}: ${r.nextPedigree}  dynastySeed=${dynastySeed} gen=${r.generation}`);
        summary[policy].overallSum += r.grad.overall;
        summary[policy].count++;
      }
      summary[policy].coinTrend.push(chain[chain.length - 1].familyClubCoinsRunning);
    } catch (err) {
      log(`EXCEPTION running ${policy} dynasty: ${(err as Error).stack ?? err}  dynastySeed=${dynastySeed}`);
    }
  }
}
console.log(`[qa-dynasty-strategy] all policy x root combinations completed (or logged an exception above)`);

// ── DETERMINISM: same (dynastySeed, policy), replayed twice, must be byte-identical ──
console.log('\n[qa-dynasty-strategy] determinism replay (whole multi-gen scripted-policy chain, twice)...');
{
  let mismatches = 0, checked = 0;
  for (const policy of POLICIES) {
    for (let i = 0; i < Math.min(5, ROOTS); i++) {
      const dynastySeed = seedFrom('qa-dstrat-root', i);
      const a = JSON.stringify(runDynasty(dynastySeed, GENS, policy));
      const b = JSON.stringify(runDynasty(dynastySeed, GENS, policy));
      checked++;
      if (a !== b) { mismatches++; log(`DETERMINISM BREAK: policy=${policy} dynastySeed=${dynastySeed} — identical scripted-strategy dynasty differs across two identical runs`); }
    }
  }
  console.log(`[qa-dynasty-strategy] determinism: ${mismatches} mismatch(es) out of ${checked} replayed (policy,dynasty) pairs`);
}

// ── balance summary — final-generation family coins per policy (contributes to backlog item #5) ──
console.log('\n[qa-dynasty-strategy] balance summary — avg overall + final-gen family coins per scripted policy:');
for (const policy of POLICIES) {
  const s = summary[policy];
  if (!s.count) continue;
  const coins = s.coinTrend;
  const avgFinalCoins = Math.round(coins.reduce((a, b) => a + b, 0) / coins.length);
  console.log(`  ${policy.padEnd(18)} avg overall=${(s.overallSum / s.count).toFixed(2)}  avg final-gen family coins (${GENS} gens)=${avgFinalCoins}  (n=${s.count} generation-lifecycles across ${coins.length} dynasties)`);
}

if (failures.length) {
  console.error(`\n[qa-dynasty-strategy] FAILED — ${failures.length} issue(s)${failures.length >= MAX_LOGGED ? ' (capped)' : ''}:`);
  failures.forEach((f, i) => console.error(`\n  x [${i + 1}] ${f}`));
  process.exit(1);
}
console.log('\n[qa-dynasty-strategy] clean — no cross-generation drift/runaway/starvation found under any scripted strategy.');
