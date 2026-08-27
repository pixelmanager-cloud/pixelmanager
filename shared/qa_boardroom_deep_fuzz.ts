// QA fuzz harness — BOARDROOM DEEP: extra-depth coverage for the three newest manager-side content
// modules (board.ts / press.ts / staff.ts, added in "manager: add board mood, press conference, and
// staff roster systems"). qa_manager_content_fuzz.ts already covers basic no-throw/determinism/bounds
// for these; this harness goes deeper — exact mood-threshold boundaries, degenerate/extreme inputs,
// exhaustive combination sweeps, monotonicity, and staff-identity stability. Kept as a SEPARATE file
// (rather than extending qa_manager_content_fuzz.ts) because the manager-content agent is concurrently
// editing that file alongside board.ts/press.ts/staff.ts themselves — this harness only READS src/, so
// it can't collide. Auto-picked up by `npm run qa` (globs shared/qa_*.ts). Does not modify shared/src.
// Run: `npx tsx shared/qa_boardroom_deep_fuzz.ts` (optionally QA_N=20000 to scale).

import { boardScore, boardStanding, type BoardMoodInput, type BoardExpectation } from './src/board.js';
import { pressConferenceLine, pressAgendaTag, type PressInput, type PressCompetition, type PressForm, type PressResult } from './src/press.js';
import { staffRoster, staffQuip, type StaffRole, type StaffMoment } from './src/staff.js';

const N = Number(process.env.QA_N ?? 4000);
const MAX_LOGGED = 80;
const failures: string[] = [];
const log = (msg: string) => { if (failures.length < MAX_LOGGED) failures.push(msg); };
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const nonBlankStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const EXPECTATIONS: BoardExpectation[] = ['title', 'promotion', 'playoffs', 'midtable', 'survival'];
const MOODS_ASC = ['furious', 'restless', 'concerned', 'patient', 'pleased', 'delighted']; // score-ascending order

// ── 1. board.ts: exact mood-threshold consistency (score band must match the mood label) ──
{
  const bandOf = (score: number): string => {
    if (score >= 55) return 'delighted';
    if (score >= 20) return 'pleased';
    if (score >= -15) return 'patient';
    if (score >= -45) return 'concerned';
    if (score >= -75) return 'restless';
    return 'furious';
  };
  for (let s = 0; s < N; s++) {
    const rng = mulberry32(s + 111);
    const total = 2 + Math.floor(rng() * 40);
    const promote = 1 + Math.floor(rng() * Math.max(1, total - 1));
    const relegate = 1 + Math.floor(rng() * Math.max(1, total - 1));
    const totalMatches = 1 + Math.floor(rng() * 46);
    const input: BoardMoodInput = {
      position: 1 + Math.floor(rng() * total), total, promote, relegate,
      points: Math.floor(rng() * 120),
      matchesPlayed: Math.floor(rng() * (totalMatches + 5)), // sometimes exceeds totalMatches
      expectation: EXPECTATIONS[Math.floor(rng() * EXPECTATIONS.length)],
      totalMatches,
    };
    let standing: ReturnType<typeof boardStanding>;
    try { standing = boardStanding(s, input); } catch (e) { log(`boardStanding THROW seed=${s}: ${e}`); continue; }
    const expectedMood = bandOf(standing.score);
    if (standing.mood !== expectedMood) log(`boardStanding mood/score MISMATCH seed=${s}: score=${standing.score} mood=${standing.mood} expected=${expectedMood}`);
    if (!Number.isInteger(standing.score)) log(`boardStanding score not integer seed=${s}: ${standing.score}`);
  }
  console.log('[board] mood/score threshold consistency OK');
}

// ── 2. board.ts: degenerate inputs (zero/negative/huge) never throw or produce non-finite ──
{
  const degenerate: BoardMoodInput[] = [
    { position: 1, total: 1, promote: 1, relegate: 1, points: 0, matchesPlayed: 0, totalMatches: 0, expectation: 'title' },
    { position: 0, total: 20, promote: 2, relegate: 3, points: 0, matchesPlayed: 0, totalMatches: 38, expectation: 'survival' },
    { position: -5, total: 20, promote: 2, relegate: 3, points: -10, matchesPlayed: -1, totalMatches: 38, expectation: 'midtable' },
    { position: 999, total: 20, promote: 30, relegate: 30, points: 1e9, matchesPlayed: 1e6, totalMatches: 38, expectation: 'promotion' },
    { position: 1, total: 20, promote: 2, relegate: 3, points: 0, matchesPlayed: 1e9, totalMatches: 1, expectation: 'playoffs' },
  ];
  for (const [i, input] of degenerate.entries()) {
    let score: number, standing: ReturnType<typeof boardStanding>;
    try { score = boardScore(input); standing = boardStanding(777, input); } catch (e) { log(`board degenerate#${i} THROW: ${e}`); continue; }
    if (!finite(score) || score < -100 || score > 100) log(`board degenerate#${i} score out of range: ${score}`);
    if (!nonBlankStr(standing.message)) log(`board degenerate#${i} blank message`);
  }
  console.log('[board] degenerate-input hardening OK');
}

// ── 3. board.ts: monotonicity — worse position (all else fixed, non-drop-zone) never IMPROVES score ──
{
  for (let s = 0; s < Math.min(N, 800); s++) {
    const rng = mulberry32(s + 222);
    const total = 12 + Math.floor(rng() * 16);
    const promote = 1 + Math.floor(rng() * 3);
    const relegate = 1 + Math.floor(rng() * 3);
    const totalMatches = 20 + Math.floor(rng() * 20);
    const matchesPlayed = Math.floor(totalMatches * (0.5 + rng() * 0.5)); // deep enough into season to matter
    const expectation: BoardExpectation = EXPECTATIONS[Math.floor(rng() * EXPECTATIONS.length)];
    // pick two positions safely inside the non-drop-zone so the dropPenalty cliff doesn't confound monotonicity
    const safeMax = Math.max(2, total - relegate - 1);
    if (safeMax < 2) continue;
    const posGood = 1 + Math.floor(rng() * (safeMax - 1));
    const posBad = posGood + 1;
    const base: Omit<BoardMoodInput, 'position'> = { total, promote, relegate, points: 0, matchesPlayed, totalMatches, expectation };
    const scoreGood = boardScore({ ...base, position: posGood });
    const scoreBad = boardScore({ ...base, position: posBad });
    if (scoreBad > scoreGood) log(`boardScore NOT monotonic seed=${s}: pos${posGood}->${scoreGood} vs pos${posBad}(worse)->${scoreBad} exp=${expectation}`);
  }
  console.log('[board] position monotonicity OK');
}

// ── 4. press.ts: exhaustive combination sweep (every timing x competition x stakes x form x result) ──
{
  const COMPETITIONS: PressCompetition[] = ['league', 'continental', 'international', 'cup'];
  const FORMS: PressForm[] = ['hot', 'cold', 'level'];
  const RESULTS: (PressResult)[] = ['win', 'draw', 'loss', null];
  let combos = 0;
  const allLines = new Set<string>();
  for (const competition of COMPETITIONS) {
    for (const stakes of [1, 2, 3] as const) {
      for (const form of FORMS) {
        for (const timing of ['pre', 'post'] as const) {
          for (const result of timing === 'post' ? RESULTS.slice(0, 3) : [null]) {
            combos++;
            const input: PressInput = { timing, competition, stakes, form, result: result ?? undefined };
            for (const seed of [0, 1, 42, -1, 999999]) {
              let line: string, tag: string;
              try {
                line = pressConferenceLine(seed, seed % 40, input);
                tag = pressAgendaTag(input);
              } catch (e) { log(`press combo THROW seed=${seed} input=${JSON.stringify(input)}: ${e}`); continue; }
              if (!nonBlankStr(line)) log(`pressConferenceLine blank for combo=${JSON.stringify(input)} seed=${seed}`);
              if (!nonBlankStr(tag)) log(`pressAgendaTag blank for combo=${JSON.stringify(input)}`);
              allLines.add(line);
            }
          }
        }
      }
    }
  }
  console.log(`[press] exhaustive sweep: ${combos} combos, ${allLines.size} distinct lines across seeds — OK`);
}

// ── 5. press.ts: post-timing with result=undefined must not throw (code defaults to 'draw') ──
{
  const input: PressInput = { timing: 'post', competition: 'league', stakes: 2, form: 'level', result: undefined };
  try {
    const line = pressConferenceLine(5, 5, input);
    if (!nonBlankStr(line)) log('pressConferenceLine blank for post+undefined result');
  } catch (e) { log(`pressConferenceLine THROW for post+undefined result: ${e}`); }
  console.log('[press] post-timing undefined-result fallback OK');
}

// ── 6. staff.ts: cross-role identity collisions — how often do two of the four staff share a name? ──
{
  let collisions = 0;
  const ROLES: StaffRole[] = ['Assistant Manager', 'Head Scout', 'Fitness Coach', 'Goalkeeping Coach'];
  for (let s = 0; s < Math.min(N, 3000); s++) {
    const roster = staffRoster(s);
    const names = [roster.assistant.name, roster.scout.name, roster.fitnessCoach.name, roster.goalkeepingCoach.name];
    if (new Set(names).size !== names.length) collisions++;
    // roles must always match the slot they were requested for
    if (roster.assistant.role !== 'Assistant Manager' || roster.scout.role !== 'Head Scout' ||
        roster.fitnessCoach.role !== 'Fitness Coach' || roster.goalkeepingCoach.role !== 'Goalkeeping Coach') {
      log(`staffRoster role/slot mismatch seed=${s}: ${JSON.stringify(roster)}`);
    }
  }
  const rate = collisions / Math.min(N, 3000);
  console.log(`[staff] cross-role name collisions: ${collisions}/${Math.min(N, 3000)} (${(rate * 100).toFixed(2)}%)`);
  if (rate > 0.15) log(`staffRoster name-collision rate suspiciously high: ${(rate * 100).toFixed(1)}%`);
  void ROLES;
}

// ── 7. staff.ts: staffQuip exhaustive role x moment sweep + salt variety ──
{
  const ROLES: StaffRole[] = ['Assistant Manager', 'Head Scout', 'Fitness Coach', 'Goalkeeping Coach'];
  const MOMENTS: StaffMoment[] = ['bigWin', 'bigLoss', 'signing', 'preSeason', 'milestone'];
  for (const role of ROLES) {
    for (const moment of MOMENTS) {
      const seen = new Set<string>();
      for (let salt = 0; salt < 20; salt++) {
        let q: string;
        try { q = staffQuip(1234, role, moment, salt); } catch (e) { log(`staffQuip THROW role=${role} moment=${moment} salt=${salt}: ${e}`); continue; }
        if (!nonBlankStr(q)) log(`staffQuip blank role=${role} moment=${moment} salt=${salt}`);
        seen.add(q);
      }
      if (seen.size < 2) log(`staffQuip salt has no variety for role=${role} moment=${moment}: only ${seen.size} distinct across 20 salts`);
    }
  }
  console.log('[staff] quip exhaustive role x moment sweep OK');
}

// ── 8. staff.ts: staffRoster stable across huge/negative seeds, no throw ──
{
  for (const seed of [0, -1, -999999, 2147483647, -2147483648, Number.MAX_SAFE_INTEGER, 1.5]) {
    let a: ReturnType<typeof staffRoster>, b: ReturnType<typeof staffRoster>;
    try { a = staffRoster(seed); b = staffRoster(seed); } catch (e) { log(`staffRoster THROW seed=${seed}: ${e}`); continue; }
    if (JSON.stringify(a) !== JSON.stringify(b)) log(`staffRoster NON-DETERMINISTIC extreme seed=${seed}`);
  }
  console.log('[staff] extreme-seed hardening OK');
}

console.log('');
if (failures.length) {
  console.log(`✗ BOARDROOM DEEP FUZZ FAILED — ${failures.length} issue(s):`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
} else {
  console.log('✓ boardroom deep fuzz passed (board / press / staff — thresholds, degenerate inputs, exhaustive sweeps)');
}
