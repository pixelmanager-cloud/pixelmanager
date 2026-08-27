// QA fuzz harness — MANAGER CONTENT. Hammers the manager-career content surfaces
// (gaffersDiary, clubSeason/liveTable, intl continental/national-team narrative,
// prestige) across many seeded inputs looking for: exceptions, non-finite/undefined
// leaking into text, determinism breaks (same input must replay identically), and
// egregiously low variety (the whole point of this pass — see
// docs/overnight/manager-content-audit.md). New file — does not modify shared/src.
// Run: `npx tsx shared/qa_manager_content_fuzz.ts` (optionally QA_N=20000 to scale).

import { gaffersDiaryEntry, type DiaryMatch, type DiaryTable } from './src/gaffersDiary.js';
import { clubSeason, liveTable, seededLeague, seasonFixtures, seededOpponents, squadRole } from './src/clubseason.js';
import {
  tieScore, contOpponent, worldCup, playerPath, nationalFixture, homeNation,
  contTieBlurb, callUpBlurb, worldCupFinishBlurb, NATIONS,
  contRivalClub, contRivalryBlurb, wcGroupDramaBlurb, wcKnockoutDramaBlurb,
} from './src/intl.js';
import { prestigeScore, managerPrestige, prestigeRankUpBlurb, type ManagerRecord } from './src/prestige.js';
import { boardScore, boardStanding, type BoardMoodInput, type BoardExpectation } from './src/board.js';
import { pressConferenceLine, pressAgendaTag, type PressInput, type PressCompetition, type PressForm } from './src/press.js';
import { staffRoster, staffQuip, type StaffRole, type StaffMoment } from './src/staff.js';

const N = Number(process.env.QA_N ?? 3000);
const MAX_LOGGED = 60;
const failures: string[] = [];
const log = (msg: string) => { if (failures.length < MAX_LOGGED) failures.push(msg); };
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const nonBlankStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ── 1. gaffersDiaryEntry: determinism, no-throw, no leaked blank rival, variety ──
{
  const seen = new Set<string>();
  let calls = 0;
  for (let s = 0; s < N; s++) {
    const rng = mulberry32(s + 1);
    const len = Math.floor(rng() * 25);
    const matches: DiaryMatch[] = Array.from({ length: len }, (_, i) => ({
      id: `s${s}-m${i}`,
      myScore: Math.floor(rng() * 6),
      oppScore: Math.floor(rng() * 6),
      oppId: rng() < 0.3 ? `opp${Math.floor(rng() * 3)}` : '', // sometimes real opponent ids, sometimes blank (like main.ts today)
      oppHandle: rng() < 0.3 ? `Rival ${Math.floor(rng() * 3)}` : '',
      createdAt: i,
    }));
    const hasTable = rng() < 0.9;
    const total = 10 + Math.floor(rng() * 20);
    const table: DiaryTable | null = hasTable ? {
      position: 1 + Math.floor(rng() * total), total, promote: 1 + Math.floor(rng() * 4), relegate: 1 + Math.floor(rng() * 4),
      points: Math.floor(rng() * 100),
    } : null;
    const input = { seasonNumber: s, matches, table };
    let a: string, b: string;
    try { a = gaffersDiaryEntry(input); b = gaffersDiaryEntry(input); } catch (e) { log(`gaffersDiaryEntry THROW seed=${s}: ${e}`); continue; }
    calls++;
    if (a !== b) log(`gaffersDiaryEntry NON-DETERMINISTIC seed=${s}: "${a}" vs "${b}"`);
    if (!nonBlankStr(a)) log(`gaffersDiaryEntry EMPTY/BLANK output seed=${s}`);
    if (/\s{2,}/.test(a)) log(`gaffersDiaryEntry DOUBLE-SPACE (likely blank interpolation) seed=${s}: "${a}"`);
    if (/undefined|NaN|null/.test(a)) log(`gaffersDiaryEntry LEAKED TOKEN seed=${s}: "${a}"`);
    seen.add(a);
  }
  const ratio = seen.size / Math.max(1, calls);
  console.log(`[diary] ${calls} calls, ${seen.size} distinct outputs (${(ratio * 100).toFixed(1)}%)`);
  if (calls > 500 && ratio < 0.03) log(`gaffersDiaryEntry variety too low: ${seen.size} distinct / ${calls} calls`);
}

// ── 2. clubSeason / liveTable: no-throw, table math sanity, determinism ──
{
  for (let s = 0; s < Math.min(N, 1500); s++) {
    const rng = mulberry32(s + 99);
    const strength = rng() < 0.02 ? NaN : 1 + rng() * 25; // occasionally feed a corrupt value (QA M2-style)
    const club = `Club${s % 7}`;
    let cs;
    try { cs = clubSeason(club, strength, rng() * 1, s); } catch (e) { log(`clubSeason THROW seed=${s}: ${e}`); continue; }
    const sumP = cs.table.reduce((acc, r) => acc + r.P, 0);
    if (sumP % (cs.table.length) !== 0) log(`clubSeason uneven fixture count seed=${s}`);
    for (const r of cs.table) {
      if (!finite(r.Pts) || !finite(r.GD) || !finite(r.GF) || !finite(r.GA)) log(`clubSeason NON-FINITE row seed=${s}: ${JSON.stringify(r)}`);
      if (r.W + r.D + r.L !== r.P) log(`clubSeason W+D+L != P seed=${s}: ${JSON.stringify(r)}`);
    }
    if (cs.pos < 1 || cs.pos > cs.size) log(`clubSeason pos out of range seed=${s}: pos=${cs.pos} size=${cs.size}`);
    // determinism
    const cs2 = clubSeason(club, strength, rng() * 0 + 1, s); // note: share differs on purpose is fine; just re-check same-args path below
    void cs2;
  }
  // explicit determinism check with fixed args
  const a = clubSeason('DetClub', 14, 0.7, 555);
  const b = clubSeason('DetClub', 14, 0.7, 555);
  if (JSON.stringify(a) !== JSON.stringify(b)) log('clubSeason NON-DETERMINISTIC for identical args');
  console.log('[clubSeason] fuzzed OK');
}

{
  // liveTable across a growing `played` array: structural sanity at full season (matchday count,
  // and "my" row's W/D/L/points reconcile with the fed-in results — clubSeason() is a DIFFERENT
  // simulation (it re-simulates "my" games too, for projections), so it's not expected to agree
  // with liveTable's real-results row and isn't compared here.
  const club = 'LiveClub', seed = 4242, strength = 16, share = 0.8;
  const full = seasonFixtures(club, seed);
  const results = full.map((_, i) => ({ myGoals: (i * 3) % 5, oppGoals: (i * 2) % 4 }));
  const live = liveTable(club, strength, share, seed, results);
  if (live.matchday !== full.length) log(`liveTable matchday mismatch: ${live.matchday} vs ${full.length}`);
  const liveMe = live.table.find((r) => r.mine)!;
  const expectedPts = results.reduce((s, r) => s + (r.myGoals > r.oppGoals ? 3 : r.myGoals === r.oppGoals ? 1 : 0), 0);
  const expectedGF = results.reduce((s, r) => s + r.myGoals, 0);
  if (liveMe.Pts !== expectedPts) log(`liveTable "mine" points don't match fed-in results: got ${liveMe.Pts}, expected ${expectedPts}`);
  if (liveMe.GF !== expectedGF) log(`liveTable "mine" GF doesn't match fed-in results: got ${liveMe.GF}, expected ${expectedGF}`);
  console.log('[liveTable] full-season reconciliation OK');
}

// ── 2b. squadRole / seededOpponents / seededLeague: no-throw + bounds ──
{
  for (let s = 0; s < Math.min(N, 1500); s++) {
    const rng = mulberry32(s + 5252);
    const bandIdx = Math.floor(rng() * 8);
    const overall = 1 + rng() * 20;
    const role = squadRole(bandIdx, overall);
    if (role.share < 0.12 - 1e-9 || role.share > 1) log(`squadRole share out of bounds seed=${s}: ${role.share}`);
    if (role.apps < 0) log(`squadRole apps negative seed=${s}: ${role.apps}`);
    const opps = seededOpponents(`Club${s % 5}`, s);
    if (opps.length !== 9) log(`seededOpponents wrong count seed=${s}: ${opps.length}`);
    if (new Set(opps.map((o) => o.name)).size !== opps.length) log(`seededOpponents duplicate names seed=${s}`);
    const league = seededLeague(`Club${s % 5}`, 10, s);
    if (league.length !== 10 || league.filter((c) => c.mine).length !== 1) log(`seededLeague malformed seed=${s}`);
  }
  console.log('[squadRole/seededOpponents/seededLeague] fuzzed OK');
}

// ── 3. intl.ts: tieScore/contOpponent/worldCup + new blurb generators ──
{
  for (let s = 0; s < Math.min(N, 1500); s++) {
    const rng = mulberry32(s + 777);
    const aStr = rng() < 0.02 ? Infinity : 1 + rng() * 20;
    const bStr = 1 + rng() * 20;
    let gh: number, ga: number;
    try { [gh, ga] = tieScore(aStr, bStr, s, rng() < 0.5); } catch (e) { log(`tieScore THROW seed=${s}: ${e}`); continue; }
    if (!finite(gh) || !finite(ga) || gh < 0 || ga < 0 || gh > 6 || ga > 6) log(`tieScore OUT-OF-RANGE seed=${s}: [${gh},${ga}]`);

    const round = (s % 3) as 0 | 1 | 2;
    const tie = contOpponent(s, s % 20, round);
    if (!nonBlankStr(tie.oppName) || !finite(tie.oppStrength)) log(`contOpponent malformed seed=${s}: ${JSON.stringify(tie)}`);
    const blurbW = contTieBlurb(s, s % 20, round, true, rng() < 0.5);
    const blurbL = contTieBlurb(s, s % 20, round, false, rng() < 0.5);
    if (!nonBlankStr(blurbW) || !nonBlankStr(blurbL)) log(`contTieBlurb blank seed=${s}`);

    const nation = homeNation(`Surname${s}`);
    const capNo = 1 + (s % 40);
    const cu = nationalFixture(s, capNo, nation, 8 + (s % 12));
    if (!nonBlankStr(cu.oppNation)) log(`nationalFixture blank opponent seed=${s}`);
    const cuBlurb = callUpBlurb(s, capNo, nation, cu.scored);
    if (!nonBlankStr(cuBlurb)) log(`callUpBlurb blank seed=${s}`);
  }
  console.log('[intl tie/callup] fuzzed OK');
}

{
  const seenFinishes = new Set<string>();
  for (let s = 0; s < Math.min(N, 800); s++) {
    const nation = NATIONS[s % NATIONS.length];
    let wc;
    try { wc = worldCup(s, s % 8, nation, 8 + (s % 12)); } catch (e) { log(`worldCup THROW seed=${s}: ${e}`); continue; }
    seenFinishes.add(wc.myFinish);
    if (!finite(wc.legacyMult) || wc.legacyMult < 1 || wc.legacyMult > 2.01) log(`worldCup legacyMult out of range seed=${s}: ${wc.legacyMult}`);
    if (!wc.field.includes(nation) && wc.myFinish !== 'Did not qualify') log(`worldCup finish inconsistent with field seed=${s}`);
    const blurb = worldCupFinishBlurb(s, s % 8, nation, wc.myFinish);
    if (!nonBlankStr(blurb)) log(`worldCupFinishBlurb blank seed=${s} finish=${wc.myFinish}`);
    // playerPath should never throw regardless of qualification
    try { playerPath(wc); } catch (e) { log(`playerPath THROW seed=${s}: ${e}`); }
  }
  console.log(`[worldCup] fuzzed OK, finishes observed: ${[...seenFinishes].sort().join(', ')}`);
  if (seenFinishes.size < 3) log(`worldCup myFinish variety suspiciously low: only ${seenFinishes.size} distinct finishes in ${Math.min(N, 800)} sims`);
}

// ── 4. prestige: score/level monotonicity + rank-up blurb ──
{
  for (let s = 0; s < Math.min(N, 1500); s++) {
    const rng = mulberry32(s + 3131);
    const r: ManagerRecord = {
      wins: Math.floor(rng() * 300), draws: Math.floor(rng() * 150), losses: Math.floor(rng() * 200),
      honours: Array.from({ length: Math.floor(rng() * 8) }, () => ({ tierIdx: Math.floor(rng() * 10), title: rng() < 0.5 ? 1 : 0, kind: rng() < 0.5 ? 'league' as const : 'cup' as const })),
      highestTierIdx: Math.floor(rng() * 10), seasons: Math.floor(rng() * 30),
    };
    let score: number, pr: ReturnType<typeof managerPrestige>;
    try { score = prestigeScore(r); pr = managerPrestige(r); } catch (e) { log(`prestige THROW seed=${s}: ${e}`); continue; }
    if (!finite(score) || score < 0) log(`prestigeScore invalid seed=${s}: ${score}`);
    if (pr.progress < 0 || pr.progress > 1) log(`managerPrestige progress out of 0..1 seed=${s}: ${pr.progress}`);
    const blurb = prestigeRankUpBlurb(pr.title, r);
    if (!nonBlankStr(blurb)) log(`prestigeRankUpBlurb blank seed=${s} title=${pr.title}`);
  }
  // monotonicity: more wins should never DECREASE score, all else equal
  const base: ManagerRecord = { wins: 10, draws: 0, losses: 0, honours: [], highestTierIdx: 0, seasons: 1 };
  const more: ManagerRecord = { ...base, wins: 50 };
  if (prestigeScore(more) < prestigeScore(base)) log('prestigeScore NOT monotonic in wins');
  console.log('[prestige] fuzzed OK');
}

// ── 4b. intl.ts rivalry arcs & tournament drama (batch 2 additions) ──
{
  for (let s = 0; s < Math.min(N, 1500); s++) {
    const rng = mulberry32(s + 6161);
    let rival: string;
    try { rival = contRivalClub(s); } catch (e) { log(`contRivalClub THROW seed=${s}: ${e}`); continue; }
    if (!nonBlankStr(rival)) log(`contRivalClub blank seed=${s}`);
    if (contRivalClub(s) !== rival) log(`contRivalClub NON-DETERMINISTIC seed=${s}`);
    const round = (s % 3) as 0 | 1 | 2;
    const rivBlurb = contRivalryBlurb(s, s % 20, round, rng() < 0.5);
    if (!nonBlankStr(rivBlurb)) log(`contRivalryBlurb blank seed=${s}`);

    const nation = NATIONS[s % NATIONS.length];
    let wc;
    try { wc = worldCup(s, s % 8, nation, 8 + (s % 12)); } catch (e) { log(`worldCup THROW (rivalry/drama pass) seed=${s}: ${e}`); continue; }
    for (let gi = 0; gi < wc.groups.length; gi++) {
      const drama = wcGroupDramaBlurb(s, s % 8, gi, wc.groups[gi].rows);
      if (!nonBlankStr(drama)) log(`wcGroupDramaBlurb blank seed=${s} group=${gi}`);
    }
    for (const tie of [...wc.quarters, ...wc.semis, wc.final]) {
      const drama = wcKnockoutDramaBlurb(s, s % 8, tie);
      if (!nonBlankStr(drama)) log(`wcKnockoutDramaBlurb blank seed=${s} tie=${tie.a}v${tie.b}`);
    }
  }
  console.log('[intl rivalry/drama] fuzzed OK');
}

// ── 5. board.ts: boardScore bounds, determinism, mood text non-blank ──
{
  const EXPECTATIONS: BoardExpectation[] = ['title', 'promotion', 'playoffs', 'midtable', 'survival'];
  const seenMoods = new Set<string>();
  for (let s = 0; s < Math.min(N, 1500); s++) {
    const rng = mulberry32(s + 8181);
    const total = 10 + Math.floor(rng() * 20);
    const promote = 1 + Math.floor(rng() * 4);
    const relegate = 1 + Math.floor(rng() * 4);
    const totalMatches = 18 + Math.floor(rng() * 20);
    const input: BoardMoodInput = {
      position: 1 + Math.floor(rng() * total), total, promote, relegate,
      points: Math.floor(rng() * 100),
      matchesPlayed: Math.floor(rng() * totalMatches), totalMatches,
      expectation: EXPECTATIONS[Math.floor(rng() * EXPECTATIONS.length)],
    };
    let score: number, standing: ReturnType<typeof boardStanding>;
    try { score = boardScore(input); standing = boardStanding(s, input); } catch (e) { log(`board THROW seed=${s}: ${e}`); continue; }
    if (!finite(score) || score < -100 || score > 100) log(`boardScore out of -100..100 seed=${s}: ${score}`);
    if (!nonBlankStr(standing.message)) log(`boardStanding blank message seed=${s}`);
    if (standing.score !== score) log(`boardStanding score mismatch vs boardScore seed=${s}`);
    seenMoods.add(standing.mood);
    // determinism
    const standing2 = boardStanding(s, input);
    if (standing.message !== standing2.message || standing.mood !== standing2.mood) log(`boardStanding NON-DETERMINISTIC seed=${s}`);
  }
  console.log(`[board] fuzzed OK, moods observed: ${[...seenMoods].sort().join(', ')}`);
  if (seenMoods.size < 4) log(`boardStanding mood variety suspiciously low: only ${seenMoods.size} distinct moods`);
}

// ── 6. press.ts: no-throw, non-blank, determinism ──
{
  const COMPETITIONS: PressCompetition[] = ['league', 'continental', 'international', 'cup'];
  const FORMS: PressForm[] = ['hot', 'cold', 'level'];
  const seen = new Set<string>();
  for (let s = 0; s < Math.min(N, 1500); s++) {
    const rng = mulberry32(s + 9191);
    const timing = rng() < 0.5 ? 'pre' as const : 'post' as const;
    const input: PressInput = {
      timing, competition: COMPETITIONS[Math.floor(rng() * COMPETITIONS.length)],
      stakes: (1 + Math.floor(rng() * 3)) as 1 | 2 | 3,
      form: FORMS[Math.floor(rng() * FORMS.length)],
      result: timing === 'post' ? (['win', 'draw', 'loss'] as const)[Math.floor(rng() * 3)] : undefined,
    };
    let line: string;
    try { line = pressConferenceLine(s, s % 40, input); } catch (e) { log(`pressConferenceLine THROW seed=${s}: ${e}`); continue; }
    if (!nonBlankStr(line)) log(`pressConferenceLine blank seed=${s}`);
    seen.add(line);
    const line2 = pressConferenceLine(s, s % 40, input);
    if (line !== line2) log(`pressConferenceLine NON-DETERMINISTIC seed=${s}`);
    const tag = pressAgendaTag(input);
    if (!nonBlankStr(tag)) log(`pressAgendaTag blank seed=${s}`);
  }
  console.log(`[press] fuzzed OK, ${seen.size} distinct lines observed`);
  if (seen.size < 10) log(`pressConferenceLine variety suspiciously low: only ${seen.size} distinct lines`);
}

// ── 7. staff.ts: roster shape, determinism, quip non-blank ──
{
  const ROLES: StaffRole[] = ['Assistant Manager', 'Head Scout', 'Fitness Coach', 'Goalkeeping Coach'];
  const MOMENTS: StaffMoment[] = ['bigWin', 'bigLoss', 'signing', 'preSeason', 'milestone'];
  for (let s = 0; s < Math.min(N, 1500); s++) {
    let roster: ReturnType<typeof staffRoster>;
    try { roster = staffRoster(s); } catch (e) { log(`staffRoster THROW seed=${s}: ${e}`); continue; }
    for (const m of [roster.assistant, roster.scout, roster.fitnessCoach, roster.goalkeepingCoach]) {
      if (!nonBlankStr(m.name) || !nonBlankStr(m.personality)) log(`staffRoster malformed member seed=${s}: ${JSON.stringify(m)}`);
    }
    const roster2 = staffRoster(s);
    if (JSON.stringify(roster) !== JSON.stringify(roster2)) log(`staffRoster NON-DETERMINISTIC seed=${s}`);
    const rng = mulberry32(s + 2020);
    const role = ROLES[Math.floor(rng() * ROLES.length)];
    const moment = MOMENTS[Math.floor(rng() * MOMENTS.length)];
    let quip: string;
    try { quip = staffQuip(s, role, moment, s % 10); } catch (e) { log(`staffQuip THROW seed=${s}: ${e}`); continue; }
    if (!nonBlankStr(quip)) log(`staffQuip blank seed=${s} role=${role} moment=${moment}`);
  }
  console.log('[staff] fuzzed OK');
}

console.log('');
if (failures.length) {
  console.log(`✗ MANAGER CONTENT FUZZ FAILED — ${failures.length} issue(s):`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
} else {
  console.log('✓ manager content fuzz passed (diary / clubSeason / intl / prestige)');
}
