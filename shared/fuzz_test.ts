// Seeded simulation fuzz harness — hunts for engine/game correctness bugs.
//
// It generates a large, diverse batch of matches (many squads across the full
// 3-20 quality range, every formation, all five tactic sliders across their full
// range, and per-player duties) and plays each to full time on MatchEngine. For
// every match it asserts a set of engine INVARIANTS every tick and at full time;
// any violation is logged with the exact reproducing seed + inputs. It also
// sanity-checks batch aggregates. Everything is seeded and deterministic, so a
// reported failure reproduces exactly. Runs as part of `npm run verify`.
//
// Run directly:  npx tsx fuzz_test.ts        (from shared/)
//                FUZZ_N=5000 npx tsx fuzz_test.ts   (bigger sweep)

import { MatchEngine, TICK_SEC } from './src/engine.js';
import { generateTeam, generateClub, autoPickXI, buildXI, type Lineup } from './src/teams.js';
import { DUTIES_BY_ROLE } from './src/duties.js';
import { FORMATIONS, type Formation } from './src/formations.js';
import { makeRng } from './src/rng.js';
import { PITCH, type Duty, type MatchEventType, type Team } from './src/types.js';
import type { Tactics } from './src/tactics.js';

const FORMATION_NAMES = Object.keys(FORMATIONS) as Formation[];
const VALID_EVENT_TYPES = new Set<MatchEventType>([
  'kickoff', 'goal', 'shot_saved', 'shot_missed', 'chance', 'halftime', 'fulltime',
  'pass', 'tackle_won', 'loose_ball', // commentary-only add-on events
]);

const EXPECTED_TICKS = (90 * 60) / TICK_SEC; // 10800 ticks for a full 90'
const HARD_TICK_CAP = EXPECTED_TICKS * 2; // guard against a hang/infinite loop

const N = Number(process.env.FUZZ_N ?? 2000); // matches to simulate (each a full 90')
const MAX_LOGGED = 25; // stop after this many distinct violations to keep output readable

// ---- config generation (all seeded off the iteration index) ----

interface Setup {
  iter: number;
  matchSeed: number;
  teamSeedA: number;
  teamSeedB: number;
  qA: number;
  qB: number;
  fA: Formation;
  fB: Formation;
  tA: Tactics;
  tB: Tactics;
  viaClub: boolean; // team A built via generateClub+buildXI vs generateTeam
}

const pick = <T,>(rng: () => number, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)];
const slider = (rng: () => number) => Math.floor(rng() * 5) - 2; // integer in [-2, 2]
const quality = (rng: () => number) => 3 + Math.floor(rng() * 18); // integer in [3, 20]

function makeTactics(rng: () => number, formation: Formation): Tactics {
  return {
    formation,
    mentality: slider(rng),
    line: slider(rng),
    press: slider(rng),
    tempo: slider(rng),
    width: slider(rng),
  };
}

/** Randomly assign a legal duty to some players (covers the duty codepaths). */
function withRandomDuties(team: Team, rng: () => number): Team {
  return {
    ...team,
    players: team.players.map((p) =>
      rng() < 0.7 ? { ...p, duty: pick(rng, DUTIES_BY_ROLE[p.role]) } : p,
    ),
  };
}

/** Build a match-ready Team via generateClub -> autoPickXI -> buildXI, with random per-slot duties. */
function clubTeam(id: string, q: number, seed: number, formation: Formation, rng: () => number): Team {
  const club = generateClub(id, id, id.toUpperCase(), 0x33aa55, q, seed);
  const base = autoPickXI(club, formation);
  const duties: Duty[] = FORMATIONS[formation].map((slot) => pick(rng, DUTIES_BY_ROLE[slot.role]));
  const lineup: Lineup = { ...base, duties };
  return buildXI(club, lineup);
}

function buildSetup(iter: number): Setup {
  // Mix the index well so consecutive iterations differ across every dimension.
  const rng = makeRng((iter * 2654435761) >>> 0);
  const fA = pick(rng, FORMATION_NAMES);
  const fB = pick(rng, FORMATION_NAMES);
  return {
    iter,
    matchSeed: Math.floor(rng() * 0xffffffff),
    teamSeedA: Math.floor(rng() * 0xffffffff),
    teamSeedB: Math.floor(rng() * 0xffffffff),
    qA: quality(rng),
    qB: quality(rng),
    fA,
    fB,
    tA: makeTactics(rng, fA),
    tB: makeTactics(rng, fB),
    viaClub: rng() < 0.5,
  };
}

function buildTeams(s: Setup): [Team, Team] {
  const rngA = makeRng((s.teamSeedA ^ 0x9e3779b9) >>> 0);
  const rngB = makeRng((s.teamSeedB ^ 0x85ebca6b) >>> 0);
  const teamA = s.viaClub
    ? clubTeam('hom', s.qA, s.teamSeedA, s.fA, rngA)
    : withRandomDuties(generateTeam('hom', 'Home', 'HOM', 0xff0000, s.qA, s.teamSeedA, s.fA), rngA);
  const teamB = s.viaClub
    ? withRandomDuties(generateTeam('awy', 'Away', 'AWY', 0x0000ff, s.qB, s.teamSeedB, s.fB), rngB)
    : clubTeam('awy', s.qB, s.teamSeedB, s.fB, rngB);
  return [teamA, teamB];
}

// ---- invariant checks ----

const finite = (v: number) => Number.isFinite(v);
const onPitchX = (x: number) => finite(x) && x >= 0 && x <= PITCH.w;
const onPitchY = (y: number) => finite(y) && y >= 0 && y <= PITCH.h;

/** Returns a violation string, or null if the current state is sound. `tick` is the tick just executed. */
function checkState(m: MatchEngine, tick: number, prevClock: number): string | null {
  const s = m.state;

  // clock advances monotonically by exactly one tick
  if (!(s.clockSec > prevClock)) return `clock did not advance (prev=${prevClock} now=${s.clockSec})`;
  if (Math.abs(s.clockSec - (prevClock + TICK_SEC)) > 1e-9)
    return `clock jumped non-monotonically (prev=${prevClock} now=${s.clockSec})`;
  if (tick > EXPECTED_TICKS) return `match exceeded expected tick budget (${tick} > ${EXPECTED_TICKS})`;

  // score
  for (const idx of [0, 1] as const) {
    const v = s.score[idx];
    if (!Number.isInteger(v) || v < 0) return `score[${idx}]=${v} not a non-negative integer`;
  }

  // players on pitch + finite + fitness in range
  for (const t of [0, 1] as const) {
    if (s.players[t].length !== m.teams[t].players.length)
      return `players[${t}] length ${s.players[t].length} != roster ${m.teams[t].players.length}`;
    for (let i = 0; i < s.players[t].length; i++) {
      const ps = s.players[t][i];
      if (!onPitchX(ps.x) || !onPitchY(ps.y))
        return `player[${t}][${i}] off pitch/non-finite at (${ps.x}, ${ps.y})`;
      if (!finite(ps.fitness) || ps.fitness < 0 || ps.fitness > 1)
        return `player[${t}][${i}] fitness ${ps.fitness} outside [0,1]`;
    }
  }

  // ball in bounds + finite
  if (!onPitchX(s.ball.x) || !onPitchY(s.ball.y))
    return `ball off pitch/non-finite at (${s.ball.x}, ${s.ball.y})`;

  // possession
  for (const idx of [0, 1] as const) {
    if (!Number.isInteger(s.possession[idx]) || s.possession[idx] < 0)
      return `possession[${idx}]=${s.possession[idx]} not a non-negative integer`;
  }

  // carrier indexes a real player
  if (s.carrier) {
    const { teamIdx, playerIdx } = s.carrier;
    if (teamIdx !== 0 && teamIdx !== 1) return `carrier.teamIdx=${teamIdx} not 0/1`;
    if (!Number.isInteger(playerIdx) || playerIdx < 0 || playerIdx >= s.players[teamIdx].length)
      return `carrier.playerIdx=${playerIdx} out of range for team ${teamIdx}`;
  }

  return null;
}

/** Checks that only need to run once, at full time. */
function checkFinal(m: MatchEngine): string | null {
  const s = m.state;
  if (!s.finished) return `match did not finish within ${HARD_TICK_CAP} ticks (hang/infinite loop)`;

  const goalEvents: [number, number] = [0, 0];
  for (const e of s.events) {
    if (e.teamIdx !== 0 && e.teamIdx !== 1) return `event teamIdx=${e.teamIdx} not 0/1`;
    if (!VALID_EVENT_TYPES.has(e.type)) return `event type "${e.type}" invalid`;
    if (e.type === 'goal') goalEvents[e.teamIdx]++;
  }
  for (const idx of [0, 1] as const) {
    if (goalEvents[idx] !== s.score[idx])
      return `goal events (${goalEvents[idx]}) != score[${idx}] (${s.score[idx]})`;
  }
  return null;
}

function describe(s: Setup): string {
  const t = (x: Tactics) => `{m${x.mentality} l${x.line} pr${x.press} te${x.tempo} w${x.width}}`;
  return `iter=${s.iter} matchSeed=${s.matchSeed} viaClub=${s.viaClub}\n` +
    `    A: q=${s.qA} ${s.fA} seed=${s.teamSeedA} ${t(s.tA)}\n` +
    `    B: q=${s.qB} ${s.fB} seed=${s.teamSeedB} ${t(s.tB)}`;
}

// ---- run the batch ----

const failures: string[] = [];
let totalGoals = 0;
let zeroZero = 0;
let equalQ = 0, equalHomeWins = 0, equalAwayWins = 0;
let maxTicks = 0;

for (let iter = 0; iter < N && failures.length < MAX_LOGGED; iter++) {
  const setup = buildSetup(iter);
  let teams: [Team, Team];
  try {
    teams = buildTeams(setup);
  } catch (err) {
    failures.push(`SETUP THREW: ${(err as Error).message}\n    ${describe(setup)}`);
    continue;
  }

  const m = new MatchEngine(teams, setup.matchSeed, [setup.tA, setup.tB]);
  let prevClock = 0; // clock before the first tick; each tick must add exactly TICK_SEC
  let ticks = 0;
  let violated: string | null = null;

  try {
    for (; ticks < HARD_TICK_CAP && !m.state.finished; ticks++) {
      m.tick();
      const v = checkState(m, ticks + 1, prevClock);
      if (v) { violated = v; break; }
      prevClock = m.state.clockSec;
    }
  } catch (err) {
    violated = `EXCEPTION thrown during tick ${ticks + 1}: ${(err as Error).stack ?? (err as Error).message}`;
  }

  if (!violated) violated = checkFinal(m);

  if (violated) {
    failures.push(`${violated}\n    ${describe(setup)}`);
    continue;
  }

  // aggregates (only for clean matches)
  maxTicks = Math.max(maxTicks, ticks);
  const [a, b] = m.state.score;
  totalGoals += a + b;
  if (a === 0 && b === 0) zeroZero++;
  if (setup.qA === setup.qB) {
    equalQ++;
    if (a > b) equalHomeWins++;
    else if (b > a) equalAwayWins++;
  }
}

const played = N - failures.length; // matches that completed (approx; good enough for aggregates)

// ---- batch-aggregate sanity checks (only meaningful when no per-match failures) ----
if (failures.length === 0) {
  const goalsPerMatch = totalGoals / N;
  console.log(`[fuzz] matches=${N}  goals/match=${goalsPerMatch.toFixed(2)}  0-0 rate=${(zeroZero / N * 100).toFixed(1)}%  maxTicks=${maxTicks}`);
  if (equalQ > 0) {
    const hw = equalHomeWins / equalQ, aw = equalAwayWins / equalQ;
    console.log(`[fuzz] equal-quality matches=${equalQ}  home win=${(hw * 100).toFixed(0)}%  away win=${(aw * 100).toFixed(0)}%`);
    // Neither side should win ~everything at equal quality (engine is near-symmetric).
    if (hw > 0.75 || aw > 0.75)
      failures.push(`equal-quality outcomes lopsided: home ${(hw * 100).toFixed(0)}% / away ${(aw * 100).toFixed(0)}% (one side wins almost always)`);
  }
  if (!(goalsPerMatch >= 0.8 && goalsPerMatch <= 6.0))
    failures.push(`goals/match ${goalsPerMatch.toFixed(2)} outside sane range [0.8, 6.0]`);
  if (zeroZero >= N)
    failures.push(`every match ended 0-0 — engine is not scoring`);
  if (maxTicks > EXPECTED_TICKS)
    failures.push(`a match ran ${maxTicks} ticks (> expected ${EXPECTED_TICKS})`);
}

// ---- verdict ----
if (failures.length) {
  console.error(`\nFUZZ FAILED — ${failures.length} violation(s)${failures.length >= MAX_LOGGED ? ' (capped)' : ''}:`);
  failures.forEach((f, i) => console.error(`\n  ✗ [${i + 1}] ${f}`));
  process.exit(1);
}
console.log(`\n✓ fuzz clean — ${N} matches, all invariants held`);
