// QA fuzz harness — server-side `careerState()` STRESS (server/src/tokens.ts).
// Drives full careers on both tracks calling careerState(token, career, clubName, clubLevel) at EVERY
// turn, exactly like the /career/:id/start and /career/:id/act endpoints do. `careerState` is a pure
// function of (Token, Career, clubName, clubLevel) — no DB/network needed — so we build a minimal fake
// Token matching server/src/store.ts's `Token` interface and drive it directly.
// New file — does not modify server/src or shared/src. Run: `npx tsx shared/qa_career_state_fuzz.ts`.

import { Career, seedFrom, mulberry32, AGENTS, bandAt, TOTAL_TURNS, type Track } from './src/career.js';
import { careerState, careerSeedFor, type CareerAction } from '../server/src/tokens.js';
import type { Token } from '../server/src/store.js';

const MAX_LOGGED = 60;
const failures: string[] = [];
const log = (msg: string) => { if (failures.length < MAX_LOGGED) failures.push(msg); };
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** A minimal fake Token satisfying the fields careerState()/careerProfile() actually read. */
function makeToken(over: Partial<Token>): Token {
  return {
    id: 'nft:qa', owner_id: 'owner:qa', generation: 0, state: 'prospect', name: 'Kai Vance',
    genes_json: JSON.stringify({ pace: { floor: 5, ceiling: 15 }, strength: { floor: 5, ceiling: 15 }, stamina: { floor: 5, ceiling: 15 } }),
    pedigree: 0, dev_bonus_json: '{}',
    career_seed: null, agent_id: null, track: null, career_actions: null,
    attrs_json: null, role: null, traits_json: null, personality: null,
    greed: null, marketability: null, earnings: null, prime_season: null, peak_overall: 0,
    signed_season: null, length_seasons: null, staked_since: null,
    ach_seasons: 0, ach_apps: 0, ach_league: 0, ach_cup: 0, ach_promotions: 0, ach_tier: 0, morale: 65,
    ach_goals: 0, ach_assists: 0, ach_potm: 0,
    kit_json: null,
    ...over,
  };
}

/** Validate every field careerState() promises, whatever phase it's currently in. */
function checkState(st: any, ctx: string) {
  if (!st || typeof st !== 'object') { log(`careerState returned non-object  ${ctx}`); return; }
  if (!finite(st.turn) || st.turn < 0 || st.turn > TOTAL_TURNS) log(`turn=${st.turn} out of [0,${TOTAL_TURNS}]  ${ctx}`);
  if (!finite(st.energy) || st.energy < 0 || st.energy > 100) log(`energy=${st.energy} out of [0,100]  ${ctx}`);
  if (!finite(st.earnings) || st.earnings < 0) log(`earnings=${st.earnings} invalid  ${ctx}`);
  if (!Array.isArray(st.meters)) log(`meters not an array  ${ctx}`);
  else for (const m of st.meters) if (!finite(m.value) || m.value < 0 || m.value > 100) log(`meter ${m.key}=${m.value} out of [0,100]  ${ctx}`);

  const prof = st.profile;
  if (!prof) log(`profile missing  ${ctx}`);
  else {
    if (!finite(prof.currentOverall) || prof.currentOverall < 1 || prof.currentOverall > 20) log(`profile.currentOverall=${prof.currentOverall} out of [1,20]  ${ctx}`);
    if (!finite(prof.potential) || prof.potential < 1 || prof.potential > 20) log(`profile.potential=${prof.potential} out of [1,20]  ${ctx}`);
    if (!finite(prof.stars) || prof.stars < 1 || prof.stars > 5) log(`profile.stars=${prof.stars} out of [1,5]  ${ctx}`);
    if (!['GK', 'DF', 'MF', 'FW'].includes(prof.role)) log(`profile.role="${prof.role}" invalid  ${ctx}`);
  }

  if (!finite(st.careerScore)) log(`careerScore non-finite: ${st.careerScore}  ${ctx}`);
  if (!st.rival || !finite(st.rival.score) || !finite(st.rival.lead)) log(`rival malformed: ${JSON.stringify(st.rival)}  ${ctx}`);

  if (st.international) {
    const i = st.international;
    if (typeof i.capped !== 'boolean') log(`international.capped not boolean  ${ctx}`);
    if (!finite(i.caps) || i.caps < 0) log(`international.caps=${i.caps} invalid  ${ctx}`);
    if (i.capped && !i.lastCap) log(`international.capped=true but lastCap missing  ${ctx}`);
    if (i.lastCap) {
      if (!['H', 'A', 'N'].includes(i.lastCap.venue)) log(`international.lastCap.venue invalid: "${i.lastCap.venue}"  ${ctx}`);
      if (!finite(i.lastCap.forGoals) || !finite(i.lastCap.ourGoals)) log(`international.lastCap goals non-finite  ${ctx}`);
    }
  }

  if (st.offPitch) {
    const op = st.offPitch;
    if (!finite(op.image.score) || op.image.score < 0 || op.image.score > 100) log(`offPitch.image.score=${op.image.score} out of [0,100]  ${ctx}`);
    if (!['clean', 'edgy'].includes(op.reputation.edge)) log(`offPitch.reputation.edge invalid: "${op.reputation.edge}"  ${ctx}`);
    if (!Array.isArray(op.endorsements) || op.endorsements.length > 3) log(`offPitch.endorsements invalid length  ${ctx}`);
    if (op.boots.next && op.boots.next.progress > op.boots.next.target) log(`offPitch.boots.next.progress > target  ${ctx}`);
  }

  if (st.clubSeason) {
    const cs = st.clubSeason;
    if (!finite(cs.pos) || cs.pos < 1 || cs.pos > cs.size) log(`clubSeason.pos=${cs.pos} out of [1,${cs.size}]  ${ctx}`);
    if (!finite(cs.apps) || cs.apps < 0) log(`clubSeason.apps=${cs.apps} invalid  ${ctx}`);
    if (typeof cs.status !== 'string' || !cs.status) log(`clubSeason.status invalid  ${ctx}`);
  }

  if (st.objective) {
    const o = st.objective;
    if (!finite(o.progress) || !finite(o.target) || o.progress > o.target) log(`objective progress(${o.progress}) > target(${o.target})  ${ctx}`);
    if (typeof o.done !== 'boolean' || o.done !== (o.progress >= o.target)) log(`objective.done inconsistent with progress/target  ${ctx}`);
  }

  if (st.handoff) {
    const h = st.handoff;
    if (!finite(h.apps) || h.apps < 11) log(`handoff fired with apps=${h.apps} < 11 (should require Regular-starter+)  ${ctx}`);
    if (!finite(h.overall) || h.overall < 1 || h.overall > 20) log(`handoff.overall=${h.overall} out of [1,20]  ${ctx}`);
  }

  if (st.lifeEvent === 'the weight of the name') {
    if (typeof st.story !== 'string' || st.story.length < 10) log(`legacy-pressure fired but story is malformed: ${JSON.stringify(st.story)}  ${ctx}`);
    if (st.momentKind !== 'life') log(`legacy-pressure fired but momentKind="${st.momentKind}" (expected 'life')  ${ctx}`);
  }

  if (st.phase === 'play' && st.scenario) {
    if (typeof st.story !== 'string' || !st.story) log(`play phase missing a well-formed story  ${ctx}`);
    if (!Array.isArray(st.hand) || st.hand.some((c: any) => typeof c.desc !== 'string')) log(`hand cards missing desc  ${ctx}`);
  }
  if (st.phase === 'draft' && Array.isArray(st.options)) {
    if (st.options.some((c: any) => typeof c.desc !== 'string')) log(`draft options missing desc  ${ctx}`);
  }
}

/** Drive one full career, calling careerState() every turn (mirroring the server's act-loop), using a
 *  seeded "policy" that sometimes deliberately plays BADLY (to depress recentForm and exercise the
 *  legacy-pressure / low-form code paths) and sometimes plays well. */
function driveCareer(opts: { seed: number; track: Track; agentId?: string; token: Token; clubName: string | null; clubLevel: number; badPlayer: boolean }) {
  const { seed, track, agentId, token, clubName, clubLevel, badPlayer } = opts;
  const c = new Career(seed, track, agentId);
  const rng = mulberry32(seed ^ 0xfeed01);
  let turns = 0;
  const HARD_CAP = TOTAL_TURNS * 10 + 2000;
  let legacyPressureSeen = false, handoffSeen = false, offPitchSeen = false, internationalSeen = false, objectiveSeen = false, recapSeen = false;

  while (!c.finished) {
    if (++turns > HARD_CAP) { log(`driveCareer exceeded ${HARD_CAP} steps (possible softlock)  seed=${seed} track=${track}`); return; }
    let st: any;
    try {
      st = careerState(token, c, clubName, clubLevel);
    } catch (err) {
      log(`EXCEPTION in careerState(): ${(err as Error).stack ?? err}  seed=${seed} track=${track} turn=${c.turn} clubName=${clubName} clubLevel=${clubLevel}`);
      return;
    }
    const ctx = `seed=${seed} track=${track} turn=${c.turn} phase=${st.phase} clubName=${clubName} clubLevel=${clubLevel} agent=${agentId ?? 'none'} gen=${token.generation} pedigree=${token.pedigree}`;
    checkState(st, ctx);
    if (st.lifeEvent === 'the weight of the name') legacyPressureSeen = true;
    if (st.handoff) handoffSeen = true;
    if (st.offPitch) offPitchSeen = true;
    if (st.international?.capped) internationalSeen = true;
    if (st.objective) objectiveSeen = true;
    if (st.recap) recapSeen = true;

    try {
      if (st.phase === 'focus') {
        const opt = badPlayer ? st.focus[st.focus.length - 1] : st.focus[Math.floor(rng() * st.focus.length)];
        c.chooseFocus(opt.id);
      } else if (st.phase === 'offer') {
        c.resolveOffer(st.offers[Math.floor(rng() * st.offers.length)].id);
      } else if (st.phase === 'coach') {
        c.appointCoach(st.coaches[Math.floor(rng() * st.coaches.length)].id);
      } else if (st.phase === 'draft') {
        c.draft(st.options[Math.floor(rng() * st.options.length)].id);
      } else {
        // "bad player" strategy: pick the worst-fit card in hand (drives recentForm down to exercise
        // legacy-pressure / low-form code paths); otherwise pick a random card.
        let pick = st.hand[0];
        if (badPlayer) {
          let worst = st.hand[0], worstFit = Infinity;
          for (const h of st.hand) { const f = h.tags.reduce((s: number, t: string) => s + (st.scenario.demand[t] ?? 0), 0); if (f < worstFit) { worstFit = f; worst = h; } }
          pick = worst;
        } else {
          pick = st.hand[Math.floor(rng() * st.hand.length)];
        }
        c.play(pick.id);
      }
    } catch (err) {
      log(`EXCEPTION applying action: ${(err as Error).stack ?? err}  ${ctx}`);
      return;
    }
  }
  // one final careerState() call on the just-finished career (mirrors what the client might request
  // right before the /act response reports `graduated: true`)
  try {
    const st = careerState(token, c, clubName, clubLevel);
    checkState(st, `FINAL seed=${seed} track=${track} clubName=${clubName}`);
  } catch (err) {
    log(`EXCEPTION in careerState() on a FINISHED career: ${(err as Error).stack ?? err}  seed=${seed} track=${track}`);
  }
  return { legacyPressureSeen, handoffSeen, offPitchSeen, internationalSeen, objectiveSeen, recapSeen };
}

console.log('\n[qa-career-state] driving full careers through careerState() every turn...');
const N = Number(process.env.QA_N ?? 250);
let totalLegacy = 0, totalHandoff = 0, totalOffPitch = 0, totalIntl = 0, totalObjective = 0, totalRecap = 0, checked = 0;
for (let i = 0; i < N; i++) {
  const track: Track = i % 5 === 0 ? 'goalkeeper' : 'outfield';
  const agentId = i % 4 === 0 ? undefined : AGENTS[i % AGENTS.length].id;
  const clubName = i % 6 === 0 ? null : ['Marlow', 'Riverside Rovers', 'Ashcombe Town'][i % 3];
  const clubLevel = i % 5; // 0..4
  const badPlayer = i % 3 === 0;
  // exercise the "heir of a legend" legacy-pressure path: generation>0 + pedigree>=0.6 (LEGEND_PEDIGREE)
  const generation = i % 4 === 0 ? 1 + (i % 3) : 0;
  const pedigree = generation > 0 ? [0.6, 0.8, 1.0, 0.7][Math.floor(i / 4) % 4] : 0;
  const seed = seedFrom('qa-cstate', i);
  const token = makeToken({
    id: `nft:qa${i}`, generation, pedigree, name: `${['Leo', 'Sam', 'Rico'][i % 3]} ${['Marsh', 'Oakes', 'Vance', 'Kane'][i % 4]}`,
    career_seed: careerSeedFor(`nft:qa${i}`, generation), agent_id: agentId ?? null, track,
  });
  checked++;
  const res = driveCareer({ seed, track, agentId, token, clubName, clubLevel, badPlayer });
  if (res) {
    if (res.legacyPressureSeen) totalLegacy++;
    if (res.handoffSeen) totalHandoff++;
    if (res.offPitchSeen) totalOffPitch++;
    if (res.internationalSeen) totalIntl++;
    if (res.objectiveSeen) totalObjective++;
    if (res.recapSeen) totalRecap++;
  }
}
console.log(`[qa-career-state] drove ${checked} full careers (${N * TOTAL_TURNS}+ careerState() calls). Code paths exercised: legacy-pressure=${totalLegacy} handoff=${totalHandoff} offPitch=${totalOffPitch} international=${totalIntl} objective=${totalObjective} recap=${totalRecap}`);
if (totalLegacy === 0) log('COVERAGE GAP: legacy-pressure ("the weight of the name") never fired across the whole sweep — the gating conditions may be too tight to reach in practice');
if (totalHandoff === 0) log('COVERAGE GAP: handoff never fired across the whole sweep');
if (totalOffPitch === 0) log('COVERAGE GAP: offPitch never surfaced across the whole sweep');

if (failures.length) {
  console.error(`\n[qa-career-state] FAILED — ${failures.length} issue(s)${failures.length >= MAX_LOGGED ? ' (capped)' : ''}:`);
  failures.forEach((f, i) => console.error(`\n  x [${i + 1}] ${f}`));
  process.exit(1);
}
console.log('\n[qa-career-state] clean — no invariant violations found.');
