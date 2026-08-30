// QA fuzz harness — FULL DYNASTY / FUSION LOOP, end-to-end, across MANY generations.
//
// Drives the whole chain a save actually walks: a career (10->25) -> graduate() -> a simulated pro/
// manager phase (club-season table position + occasional continental-cup run, using shared/src's real
// clubseason.ts/intl.ts) -> retirement (legacyCard) -> reborn (legacyBoost -> inheritGenes -> the next
// generation's career), repeated for MANY generations from one root seed. All using ONLY shared/src's
// real, exported, deterministic functions plus server/src/lifecycle.ts's pure `developAttrs` — no DB,
// no server process.
//
// The three money-bridge constants below (CLUB_WAGE_CUT / PRO_SIGNING_SHARE / RETIREMENT_LEGACY_SHARE)
// are MIRRORED from server/src/index.ts (they are not exported there — they're plain consts inside the
// route handlers) so this harness can exercise the same arithmetic without booting Fastify+a DB. If
// those constants ever change in index.ts, update the mirror here too (a drift would silently make this
// harness test stale numbers — noted in docs/qa-bug-report.md).
//
// New file — does not modify server/src or shared/src. Run: `npx tsx shared/qa_dynasty_fuzz.ts`
// (QA_ROOTS env overrides root-seed count, QA_GENS overrides generations per dynasty).

import {
  Career, graduate, rollGenes, inheritGenes, legacyBoost, seedFrom, mulberry32, AGENTS,
  TOTAL_TURNS, type Track, type Genes, type CareerPlayer, type PlayerAchievements, type CareerPlayerAttrs,
} from './src/career.js';
import { legacyCard } from './src/legacy.js';
import { clubSeason } from './src/clubseason.js';
import { tieScore, contOpponent, nationalFixture, homeNation, worldCup, playerPath, NATIONS } from './src/intl.js';
import { developAttrs } from './src/lifecycle.js'; // moved from server/src/lifecycle.js when the server/web3 layer was removed (offline-first pivot)

const MAX_LOGGED = 60;
const failures: string[] = [];
const log = (msg: string) => { if (failures.length < MAX_LOGGED) failures.push(msg); };
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

// ── mirrored economy-bridge constants (see file header) ──
const CLUB_WAGE_CUT = 0.25;
const PRO_SIGNING_SHARE = 0.4;
const RETIREMENT_LEGACY_SHARE = 0.6;
const SANE_COIN_CAP = 5_000_000; // generous — flags a genuinely runaway/exploding economy, not a big number

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

/** Play a full career start-to-finish with a seeded random-choice policy (explores every phase). */
function playFullCareer(seed: number, track: Track, agentId: string | undefined): Career {
  const c = new Career(seed, track, agentId);
  const rng = mulberry32(seed ^ 0x9a1f00);
  let guard = 0; const HARD_CAP = TOTAL_TURNS * 20 + 2000;
  while (!c.finished) {
    if (++guard > HARD_CAP) throw new Error(`softlock: exceeded ${HARD_CAP} steps without finishing`);
    const st = c.current();
    if (st.phase === 'arc') c.resolveArc((st as any).arc.choices[Math.floor(rng() * (st as any).arc.choices.length)].id);
    else if (st.phase === 'focus') c.chooseFocus(st.focus[Math.floor(rng() * st.focus.length)].id);
    else if (st.phase === 'offer') c.resolveOffer(st.offers[Math.floor(rng() * st.offers.length)].id);
    else if (st.phase === 'coach') c.appointCoach(st.coaches[Math.floor(rng() * st.coaches.length)].id);
    else if (st.phase === 'draft') c.draft(st.options[Math.floor(rng() * st.options.length)].id);
    else c.play(st.hand[Math.floor(rng() * st.hand.length)].id);
  }
  return c;
}

/** rebornFields()'s parent-gene derivation, mirrored exactly from server/src/tokens.ts. */
function parentGenesFromAttrs(attrs: CareerPlayerAttrs): Genes {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const band = (s: number) => ({ floor: clamp(s - 6, 1, 15), ceiling: clamp(s + 2, clamp(s - 6, 1, 15) + 3, 20) });
  return { pace: band(attrs.pace), strength: band(attrs.strength), stamina: band(attrs.stamina) };
}

interface GenerationResult {
  generation: number;
  grad: CareerPlayer;
  clubGainFromCareer: number;
  windfall: number;
  achievements: PlayerAchievements;
  peakOverall: number;
  legendRating: number;
  testimonial: number;
  retirementLegacy: number;
  nextGenes: Genes;
  nextPedigree: number;
  nextDevBonus: Partial<Record<keyof CareerPlayerAttrs, number>>;
  familyClubCoinsRunning: number;
}

/** Simulate ONE generation: career -> graduate -> pro/manager seasons -> retirement -> reborn fields
 *  for the NEXT generation. Deterministic given (dynastySeed, generation, genes, devBonus, clubLevel). */
function simulateGeneration(
  dynastySeed: number, generation: number, genes: Genes,
  devBonus: Partial<Record<keyof CareerPlayerAttrs, number>>,
  clubLevel: number, familyClubCoinsIn: number,
): GenerationResult {
  const careerSeed = seedFrom('qa-dynasty', dynastySeed, generation, 'career');
  const track: Track = generation % 5 === 0 ? 'goalkeeper' : 'outfield';
  const agentId = AGENTS[(dynastySeed + generation) % AGENTS.length].id;
  const ctx = `dynastySeed=${dynastySeed} gen=${generation} track=${track} careerSeed=${careerSeed}`;

  const c = playFullCareer(careerSeed, track, agentId);
  const grad = graduate(c.log, careerSeed, genes, undefined, { ...c.finContext(), legacyBonus: devBonus });
  checkAttrs(grad.attrs, `graduate() ${ctx}`);
  if (!finite(grad.overall) || grad.overall < 1 || grad.overall > 20) log(`overall=${grad.overall} out of [1,20]  ${ctx}`);
  if (!finite(grad.earnings) || grad.earnings < 0) log(`grad.earnings=${grad.earnings} invalid  ${ctx}`);

  // ── economy bridge (mirrored) ──
  const clubGainFromCareer = Math.round(grad.earnings * CLUB_WAGE_CUT);
  const windfall = Math.round(grad.earnings * PRO_SIGNING_SHARE);
  if (!finite(clubGainFromCareer) || clubGainFromCareer < 0) log(`clubGainFromCareer=${clubGainFromCareer} invalid  ${ctx}`);
  if (!finite(windfall) || windfall < 0) log(`windfall=${windfall} invalid  ${ctx}`);

  // ── pro/manager phase: 15 seasons (age 25->39), each producing a clubSeason() table position +
  // occasional continental run, developing attrs via the real (pure) developAttrs(). ──
  const rng = mulberry32(seedFrom('qa-dynasty-pro', dynastySeed, generation));
  let attrs: any = { ...grad.attrs };
  let peakOverall = grad.overall;
  let leagueTitles = 0, cupTitles = 0, promotions = 0;
  let apps = 0;
  const myClub = 'Marlow';
  // NATIONAL CALL-UPS + WORLD CUP — chained into the per-generation pro/manager phase for the first time
  // this batch (backlog item #2). Mirrors main.ts's real production cadence: worldCup() fires once every
  // 4 seasons off a stable per-save "league seed" (here: the dynasty/generation seed), the player's
  // nation is derived once from his surname via homeNation() (stable across his whole arc, same as
  // tokens.ts's careerState()), and call-up rate scales with current overall exactly like tokens.ts's
  // `international` block (ov>=15:0.4, ov>=13:0.25, ov>=11:0.12, else 0) — reused here as a per-season
  // Bernoulli trial rather than tokens.ts's turn-based cumulative count, since this loop is season-
  // granular, not turn-granular.
  const nation = homeNation(`Dynasty${dynastySeed}Gen${generation}`); // CareerPlayer has no surname field; a stable synthetic one mirrors tokens.ts's `homeNation(surname)` call
  const wcLeagueSeed = seedFrom('qa-dynasty-wc-league', dynastySeed, generation);
  let caps = 0;
  for (let season = 0; season < 15; season++) {
    const age = 25 + season;
    attrs = developAttrs(attrs, genes, age, 3); // trainingLvl fixed at 3 (mid)
    checkAttrs(attrs as CareerPlayerAttrs, `developAttrs season=${season} age=${age} ${ctx}`);
    // a crude but bounded "current overall" proxy: mean of the role-relevant core stats already checked
    const ovrProxy = Math.round((attrs.passing + attrs.shooting + attrs.tackling + attrs.positioning + attrs.composure) / 5);
    peakOverall = Math.max(peakOverall, ovrProxy);
    const strength = ovrProxy + (rng() - 0.5) * 4;
    const seasonSeed = seedFrom('qa-dynasty-season', dynastySeed, generation, season);
    const cs = clubSeason(myClub, strength, 0.85, seasonSeed);
    if (!finite(cs.pos) || cs.pos < 1 || cs.pos > cs.size) log(`clubSeason.pos=${cs.pos} out of [1,${cs.size}] season=${season}  ${ctx}`);
    if (cs.pos === 1) leagueTitles++;
    if (cs.pos <= 4 && season > 0 && cs.pos > ((season - 1) % cs.size) + 1) promotions += 0; // no promotion ladder modeled — kept at 0, documented below
    apps += 15; // a fixed, bounded "mostly played" assumption for this harness

    // continental cup for a top-3 finish: 3 rounds vs contOpponent(), resolved by tieScore comparison
    if (cs.pos <= 3) {
      let stillIn = true;
      for (const r of [0, 1, 2] as const) {
        if (!stillIn) break;
        const tie = contOpponent(seasonSeed, season, r);
        if (!finite(tie.oppStrength) || tie.oppStrength < 1 || tie.oppStrength > 20) log(`contOpponent.oppStrength=${tie.oppStrength} out of [1,20]  ${ctx} season=${season} round=${r}`);
        const [gh, ga] = tieScore(strength, tie.oppStrength, seedFrom('qa-dynasty-tie', seasonSeed, r), tie.neutral);
        if (!finite(gh) || !finite(ga) || gh < 0 || ga < 0 || gh > 6 || ga > 6) log(`tieScore out of [0,6]: [${gh},${ga}]  ${ctx} season=${season} round=${r}`);
        if (gh > ga) { if (r === 2) cupTitles++; } else stillIn = false;
      }
    }

    // NATIONAL CALL-UP — same rate curve tokens.ts's careerState() uses for its `international` block,
    // applied as a per-season Bernoulli trial (this loop is season-granular, tokens.ts is turn-granular).
    const capRate = ovrProxy >= 15 ? 0.4 : ovrProxy >= 13 ? 0.25 : ovrProxy >= 11 ? 0.12 : 0;
    if (capRate > 0 && rng() < capRate) {
      caps++;
      const cu = nationalFixture(seedFrom('qa-dynasty-natl', dynastySeed, generation, season), caps, nation, ovrProxy);
      if (!NATIONS.includes(cu.oppNation)) log(`nationalFixture: unknown oppNation "${cu.oppNation}"  ${ctx} season=${season} caps=${caps}`);
      if (cu.oppNation === nation) log(`nationalFixture: opponent equals own nation "${nation}"  ${ctx} season=${season}`);
      if (!['H', 'A', 'N'].includes(cu.venue)) log(`nationalFixture: bad venue "${cu.venue}"  ${ctx} season=${season}`);
      if (!finite(cu.forGoals) || !finite(cu.ourGoals) || cu.forGoals < 0 || cu.ourGoals < 0) log(`nationalFixture: non-finite/negative goals ${JSON.stringify(cu)}  ${ctx} season=${season}`);
      if (!finite(cu.scored) || cu.scored < 0) log(`nationalFixture: bad scored=${cu.scored}  ${ctx} season=${season}`);
    }

    // WORLD CUP — chained once every 4 seasons, mirroring main.ts's `edition = m.season / 4` cadence,
    // keyed off a stable per-generation "league seed" (the closest analogue to main.ts's leagueSeed(),
    // which is stable for the whole save). The player's national-team strength is his current overall
    // proxy — the same value main.ts's starOverall() feeds worldCup(). This is the first time worldCup()
    // is exercised chained INTO the multi-season/multi-generation loop rather than standalone.
    if ((season + 1) % 4 === 0) {
      const edition = (season + 1) / 4;
      let wc: ReturnType<typeof worldCup>;
      try { wc = worldCup(wcLeagueSeed, edition, nation, ovrProxy); }
      catch (err) { log(`EXCEPTION in chained worldCup: ${(err as Error).stack ?? err}  ${ctx} season=${season} edition=${edition}`); wc = null as any; }
      if (wc) {
        if (wc.field.length !== 16 || new Set(wc.field).size !== 16) log(`chained worldCup: field corrupted (len=${wc.field.length}, unique=${new Set(wc.field).size})  ${ctx} season=${season} edition=${edition}`);
        if (!wc.field.includes(nation)) log(`chained worldCup: myNation "${nation}" missing from its own field  ${ctx} season=${season} edition=${edition}`);
        if (!['Champions', 'Runners-up', 'Semi-finals', 'Quarter-finals', 'Group stage', 'Did not qualify'].includes(wc.myFinish)) log(`chained worldCup: invalid myFinish "${wc.myFinish}"  ${ctx} season=${season} edition=${edition}`);
        if (!finite(wc.legacyMult) || wc.legacyMult < 1 || wc.legacyMult > 2) log(`chained worldCup: legacyMult=${wc.legacyMult} out of [1,2]  ${ctx} season=${season} edition=${edition}`);
        for (const g of wc.groups) for (const r of g.rows) if (!finite(r.GF) || !finite(r.GA) || !finite(r.Pts)) log(`chained worldCup: non-finite group row ${JSON.stringify(r)}  ${ctx} season=${season} edition=${edition}`);
        // CROSS-FIXTURE CHECK: the same season's continental-cup strength value (`strength`, possibly
        // fractional/negative-jittered by `rng()`) must not corrupt worldCup when reused as its national
        // strength input via the ovrProxy path — worldCup() itself only ever receives the integer-clamped
        // ovrProxy, but confirm strengths stay in the engine's usual band regardless (a compounding-
        // generations blow-up would show up here as an out-of-band strength never seen in standalone runs).
        if (!finite(wc.strengths[nation]) || wc.strengths[nation] < 1 || wc.strengths[nation] > 20) log(`chained worldCup: myNation strength=${wc.strengths[nation]} out of [1,20] after ${generation} generations of inheritance  ${ctx} season=${season} edition=${edition}`);
        let path: ReturnType<typeof playerPath>;
        try { path = playerPath(wc); }
        catch (err) { log(`EXCEPTION in chained playerPath: ${(err as Error).stack ?? err}  ${ctx} season=${season} edition=${edition}`); path = null as any; }
        if (path?.qualified) {
          for (const leg of [path.qf, path.sf, path.final]) {
            if (leg && (!finite(leg.oppStrength) || leg.oppStrength < 1 || leg.oppStrength > 20)) log(`chained playerPath: leg oppStrength=${leg.oppStrength} out of [1,20]  ${ctx} season=${season} edition=${edition}`);
          }
        }
        if (wc.myFinish === 'Champions') { leagueTitles += 0; cupTitles += 1; } // world titles count toward the "cup" honour bucket for the achievements check below (documented, not a promotion/league title)
      }
    }
  }
  const achievements: PlayerAchievements = { seasons: 15, apps, leagueTitles, cupTitles, promotions, highestTierIdx: clubLevel };
  for (const k of Object.keys(achievements) as (keyof PlayerAchievements)[]) {
    if (!finite(achievements[k]) || achievements[k] < 0) log(`achievements.${k}=${achievements[k]} invalid  ${ctx}`);
  }

  // ── retirement ──
  const card = legacyCard(grad.role, grad.overall, peakOverall, achievements);
  if (!finite(card.legendRating) || card.legendRating < 0 || card.legendRating > 100) log(`legacyCard.legendRating=${card.legendRating} out of [0,100]  ${ctx}`);
  if (!finite(card.testimonial) || card.testimonial < 0 || card.testimonial > 2000) log(`legacyCard.testimonial=${card.testimonial} out of [0,2000]  ${ctx}`);
  const retirementLegacy = Math.round(grad.earnings * RETIREMENT_LEGACY_SHARE);
  if (!finite(retirementLegacy) || retirementLegacy < 0) log(`retirementLegacy=${retirementLegacy} invalid  ${ctx}`);

  const familyClubCoinsRunning = familyClubCoinsIn + clubGainFromCareer + windfall + card.testimonial + retirementLegacy;
  if (!finite(familyClubCoinsRunning) || familyClubCoinsRunning < 0) log(`familyClubCoinsRunning went non-finite/negative: ${familyClubCoinsRunning}  ${ctx}`);
  if (familyClubCoinsRunning > SANE_COIN_CAP) log(`POSSIBLE RUNAWAY ECONOMY: familyClubCoinsRunning=${familyClubCoinsRunning} exceeded sane cap ${SANE_COIN_CAP} by generation ${generation}  ${ctx}`);

  // ── reborn: next generation's genes/pedigree/devBonus ──
  const boost = legacyBoost(achievements);
  if (!finite(boost.ceilingLift) || boost.ceilingLift < 0 || boost.ceilingLift > 3) log(`legacyBoost.ceilingLift=${boost.ceilingLift} out of [0,3]  ${ctx}`);
  if (!finite(boost.pedigree) || boost.pedigree < 0 || boost.pedigree > 1) log(`legacyBoost.pedigree=${boost.pedigree} out of [0,1]  ${ctx}`);
  for (const [k, v] of Object.entries(boost.devBonus)) if (!finite(v as number)) log(`legacyBoost.devBonus.${k}=${v} non-finite  ${ctx}`);

  const parentGenes = parentGenesFromAttrs(attrs as CareerPlayerAttrs);
  checkGenes(parentGenes, `parentGenesFromAttrs ${ctx}`);
  const nextGenes = inheritGenes(parentGenes, seedFrom('qa-dynasty-heir', dynastySeed, generation + 1), 0.6, boost.ceilingLift);
  checkGenes(nextGenes, `inheritGenes (next gen) ${ctx}`);

  return {
    generation, grad, clubGainFromCareer, windfall, achievements, peakOverall,
    legendRating: card.legendRating, testimonial: card.testimonial, retirementLegacy,
    nextGenes, nextPedigree: boost.pedigree, nextDevBonus: boost.devBonus, familyClubCoinsRunning,
  };
}

/** Run a full N-generation dynasty from one root seed. Returns the full chain for determinism diffing. */
function runDynasty(dynastySeed: number, gens: number): GenerationResult[] {
  let genes = rollGenes(seedFrom('qa-dynasty-genesis', dynastySeed));
  let devBonus: Partial<Record<keyof CareerPlayerAttrs, number>> = {};
  let familyClubCoins = 0;
  const chain: GenerationResult[] = [];
  for (let g = 0; g < gens; g++) {
    const clubLevel = g % 6;
    const res = simulateGeneration(dynastySeed, g, genes, devBonus, clubLevel, familyClubCoins);
    chain.push(res);
    genes = res.nextGenes;
    devBonus = res.nextDevBonus;
    familyClubCoins = res.familyClubCoinsRunning;
  }
  return chain;
}

// ── run ──
const ROOTS = Number(process.env.QA_ROOTS ?? 30);
const GENS = Number(process.env.QA_GENS ?? 12);
console.log(`\n[qa-dynasty] simulating ${ROOTS} dynasties x ${GENS} generations each (career -> pro seasons -> retirement -> reborn)...`);

let checked = 0;
const chains: Record<number, GenerationResult[]> = {};
for (let i = 0; i < ROOTS; i++) {
  const dynastySeed = seedFrom('qa-dynasty-root', i);
  try {
    const chain = runDynasty(dynastySeed, GENS);
    chains[i] = chain;
    checked++;
    // pedigree / overall must never runaway across generations (bounded checks already run per-gen above;
    // this is an additional cross-generation monotonic-blowup guard)
    for (const r of chain) {
      if (r.nextPedigree < 0 || r.nextPedigree > 1) log(`cross-gen pedigree escaped [0,1]: ${r.nextPedigree}  dynastySeed=${dynastySeed} gen=${r.generation}`);
    }
  } catch (err) {
    log(`EXCEPTION running dynasty: ${(err as Error).stack ?? err}  dynastySeed=${dynastySeed}`);
  }
}
console.log(`[qa-dynasty] ${checked}/${ROOTS} dynasties completed (${checked * GENS} generation-lifecycles)`);

// ── DETERMINISM: replay a handful of dynasties end-to-end and expect a byte-identical chain ──
console.log('\n[qa-dynasty] determinism replay (whole multi-gen chain, twice)...');
{
  let mismatches = 0;
  for (let i = 0; i < Math.min(10, ROOTS); i++) {
    const dynastySeed = seedFrom('qa-dynasty-root', i);
    const a = JSON.stringify(runDynasty(dynastySeed, GENS));
    const b = JSON.stringify(runDynasty(dynastySeed, GENS));
    if (a !== b) { mismatches++; log(`DETERMINISM BREAK: whole dynasty chain (root i=${i}, dynastySeed=${dynastySeed}) differs across two identical runs`); }
  }
  console.log(`[qa-dynasty] determinism: ${mismatches} mismatch(es) out of ${Math.min(10, ROOTS)} replayed dynasties`);
}

// ── REPLAY ROUND-TRIP at scale: snapshot each generation's action list, resume, and re-graduate ──
console.log('\n[qa-dynasty] replay round-trip (snapshot -> Career.resume -> graduate) across generations...');
{
  let checkedRT = 0, mismatchesRT = 0;
  for (let i = 0; i < Math.min(15, ROOTS); i++) {
    const dynastySeed = seedFrom('qa-dynasty-root', i);
    let genes = rollGenes(seedFrom('qa-dynasty-genesis', dynastySeed));
    let devBonus: Partial<Record<keyof CareerPlayerAttrs, number>> = {};
    for (let g = 0; g < Math.min(6, GENS); g++) {
      const careerSeed = seedFrom('qa-dynasty', dynastySeed, g, 'career');
      const track: Track = g % 5 === 0 ? 'goalkeeper' : 'outfield';
      const agentId = AGENTS[(dynastySeed + g) % AGENTS.length].id;
      const c = playFullCareer(careerSeed, track, agentId);
      const original = graduate(c.log, careerSeed, genes, undefined, { ...c.finContext(), legacyBonus: devBonus });
      const snap = c.snapshot();
      const resumed = Career.resume(snap);
      const replayed = graduate(resumed.log, careerSeed, genes, undefined, { ...resumed.finContext(), legacyBonus: devBonus });
      checkedRT++;
      if (JSON.stringify(original) !== JSON.stringify(replayed)) {
        mismatchesRT++;
        log(`REPLAY ROUND-TRIP BREAK: dynastySeed=${dynastySeed} gen=${g} — resume()->graduate() != original graduate()`);
      }
      // advance genes/devBonus the same way the dynasty loop does, so gen>0 replays use realistic inherited genes too
      const boost = legacyBoost({ seasons: 10, apps: 150, leagueTitles: 1, cupTitles: 0, promotions: 0, highestTierIdx: g % 6 });
      genes = inheritGenes(parentGenesFromAttrs(original.attrs), seedFrom('qa-dynasty-heir', dynastySeed, g + 1), 0.6, boost.ceilingLift);
      devBonus = boost.devBonus;
    }
  }
  console.log(`[qa-dynasty] replay round-trip: ${mismatchesRT} mismatch(es) out of ${checkedRT} generation-careers`);
}

if (failures.length) {
  console.error(`\n[qa-dynasty] FAILED — ${failures.length} issue(s)${failures.length >= MAX_LOGGED ? ' (capped)' : ''}:`);
  failures.forEach((f, i) => console.error(`\n  x [${i + 1}] ${f}`));
  process.exit(1);
}
console.log('\n[qa-dynasty] clean — no invariant violations found.');
