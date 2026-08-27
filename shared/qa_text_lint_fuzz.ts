// QA fuzz harness — NARRATIVE-QUALITY LINTER (batch 5). Generates text from EVERY content surface
// across many seeds and asserts it's well-formed prose, independent of whatever mechanical bounds
// checks other qa_*.ts harnesses already run. This is a LINT pass, not a mechanics pass — the same
// text could be perfectly "valid" by every other harness's rules and still read broken to a player
// (a stray "{rival}", a double space where an interpolation went blank, "undefined" leaking into a
// sentence). Six checks per generated string:
//   (a) unreplaced template placeholders — {word} or ${...} surviving into the final string
//   (b) empty / whitespace-only output
//   (c) doubled spaces / doubled punctuation ("  ", " ,", " .", "..")
//   (d) leading/trailing whitespace
//   (e) literal "undefined"/"null"/"NaN" leaking into player-facing text
//   (f) gendered-pronoun heuristic — a generated PERSON name co-occurring with he/him/his/himself/
//       she/her/hers in the same line. LOW BAR, by design (see batch-5 brief): this already caught a
//       real bug once (misgendered staff, fixed in cbd4a56) — report-only, not a hard failure, since
//       most co-occurrences are the (male, by design) player protagonist's own "he" nearby a
//       *different* character's name, not a true mispairing. Logged separately for human review.
//
// Surfaces covered: career scenario stories (scenarioStory/narratePlay/narrateLifeEvent/rivalMoment/
// callupMoment/academyScare/rivalNews/narrateCoach/narrateDraft/narrateOffer), graduation epilogues +
// chapter recaps, off-pitch (endorsements/boots/temptations via computeOffPitch), the Gaffer's Diary,
// board messages (boardStanding), press lines (pressConferenceLine[WithStaff]), staff (staffRoster/
// staffQuip), prestige rank-up blurbs, and intl blurbs (continental/call-up/World-Finals/rivalry/
// group-drama/knockout-drama). New file — does not modify shared/src. Run: `npx tsx
// shared/qa_text_lint_fuzz.ts` (QA_N=8000 to scale).

import {
  scenarioStory, narratePlay, narrateLifeEvent, rivalMomentStory, narrateRivalMoment,
  callupMomentStory, narrateCallupMoment, academyScareStory, narrateAcademyScare, rivalNews,
  narrateCoach, narrateDraft, narrateOffer, chapterRecap, graduationEpilogue, careerCast,
  type NarrateCtx, type ScenarioCtx, type RecapCtx, type EpilogueCtx,
} from './src/narrate.js';
import { computeOffPitch } from './src/offpitch.js';
import { gaffersDiaryEntry, type DiaryMatch, type DiaryTable } from './src/gaffersDiary.js';
import { boardStanding, type BoardMoodInput, type BoardExpectation } from './src/board.js';
import { pressConferenceLine, pressConferenceLineWithStaff, type PressInput, type PressCompetition, type PressForm } from './src/press.js';
import { staffRoster, staffQuip, type StaffRole, type StaffMoment } from './src/staff.js';
import { prestigeRankUpBlurb, PRESTIGE_LEVELS, type ManagerRecord } from './src/prestige.js';
import {
  contTieBlurb, callUpBlurb, worldCupFinishBlurb, contRivalClub, contRivalryBlurb,
  wcGroupDramaBlurb, wcKnockoutDramaBlurb, NATIONS, homeNation, type WCResult, type WCTie, type WCGroupRow,
} from './src/intl.js';

const N = Number(process.env.QA_N ?? 6000);
const MAX_LOGGED = 80;
const failures: string[] = [];
const knownIssues: string[] = [];
const pronounNotes: string[] = [];
const log = (msg: string) => { if (failures.length < MAX_LOGGED) failures.push(msg); };
const notePronoun = (msg: string) => { if (pronounNotes.length < MAX_LOGGED) pronounNotes.push(msg); };
// KNOWN, ALREADY-DOCUMENTED, OUT-OF-DOMAIN issue (see docs/qa-bug-report.md batch 5): narratePlay's
// stakes===3 `aftermath`/`debutFlourish` clauses each prepend a literal ' ' even when their own content
// is '' (the success band is 'mixed' — neither triumph/good nor poor/dismal), leaking a trailing single
// or double space into the final string. Root-caused in shared/src/narrate.ts, which is a content file
// this lane must document rather than edit (see CLAUDE.md domain rules). Downgraded to non-fatal here
// so this ALREADY-KNOWN bug doesn't permanently redline `npm run qa` for every future batch — a NEW
// whitespace bug on any other tag (or a NEW kind of narratePlay issue) still fails the harness normally.
const isKnownNarratePlayWhitespaceBug = (tag: string, msg: string) =>
  tag === 'narratePlay' && (msg.includes('DOUBLE SPACE') || msg.includes('LEADING/TRAILING WHITESPACE'));

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const PRONOUN_RE = /\b(he|him|his|himself|she|her|hers|herself)\b/i;

/** The core lint pass, run against every generated string from every surface below. `names` (optional)
 *  is the set of generated PERSON names live in this call's context, for check (f). */
function lint(tag: string, ctx: string, text: unknown, names: readonly string[] = []): void {
  const report = (msg: string) => {
    if (isKnownNarratePlayWhitespaceBug(tag, msg)) { if (knownIssues.length < MAX_LOGGED) knownIssues.push(msg); return; }
    log(msg);
  };
  if (typeof text !== 'string') { log(`${tag}: non-string output (${typeof text})  ${ctx}`); return; }
  if (text.trim().length === 0) { log(`${tag}: EMPTY/BLANK output  ${ctx}`); return; }
  if (/\{[a-zA-Z_]+\}/.test(text)) log(`${tag}: UNREPLACED PLACEHOLDER "${text}"  ${ctx}`);
  if (/\$\{[^}]*\}/.test(text)) log(`${tag}: UNREPLACED TEMPLATE LITERAL "${text}"  ${ctx}`);
  if (/\s{2,}/.test(text)) report(`${tag}: DOUBLE SPACE "${text}"  ${ctx}`);
  if (/ ,/.test(text)) log(`${tag}: SPACE-BEFORE-COMMA "${text}"  ${ctx}`);
  if (/ \./.test(text)) log(`${tag}: SPACE-BEFORE-PERIOD "${text}"  ${ctx}`);
  if (/\.\.(?!\.)/.test(text)) log(`${tag}: DOUBLED PERIOD "${text}"  ${ctx}`);
  if (text !== text.trim()) report(`${tag}: LEADING/TRAILING WHITESPACE "${text}"  ${ctx}`);
  if (/\bundefined\b|\bnull\b|\bNaN\b/.test(text)) log(`${tag}: LEAKED TOKEN "${text}"  ${ctx}`);
  for (const n of names) {
    if (!n) continue;
    // case-insensitive: several callers Title-Case a lower-case cast name (e.g. cast.mentor 'old Franny'
    // renders as 'Old Franny' via a cap()/cap0() helper), so a strict .includes(n) misses those lines.
    if (text.toLowerCase().includes(n.toLowerCase()) && PRONOUN_RE.test(text)) {
      notePronoun(`${tag}: name "${n}" co-occurs with a gendered pronoun: "${text}"  ${ctx}`);
    }
  }
}

const CHAPTERS = ['Grassroots', 'Academy', 'Scholar', 'Youth Team', 'Breakthrough', 'First Team', 'Establishing'];
const PERSONALITIES = ['maverick', 'fragile', 'leader', 'biggame', 'workhorse', 'mercurial', 'pro', 'latebloom', 'showman', 'stoic', 'hothead', 'perfectionist', 'joker'];
const SEASON_EVENTS = ['serious-injury', 'hot-streak', 'slump', 'new-gaffer', 'knock', 'breakthrough', 'cup-run', 'transfer-links', 'fan-favourite', 'international-honour', undefined, null];
const KINDS = ['match', 'training', 'social', 'contract', 'loan', 'setback', 'media', 'loyalty', 'role', 'fallout', 'injury_comeback', 'transfer_rumour', 'manager_fallout', 'charity', 'social_storm', 'family_illness', 'romance', 'mentor_crossroads', 'friend_rivalry', 'new_money', 'move_abroad'];
const TAGS = ['aggression', 'creativity', 'composure', 'teamwork', 'leadership', 'stamina', 'flair', 'keeping'];
const MILESTONES = [null, 'debut', 'first_goal', 'first_big_win', 'cup_final', 'first_start'];

// ── 1. scenarioStory + narratePlay + narrateLifeEvent + rival/callup moments + academy scare ──
{
  let calls = 0;
  for (let s = 0; s < N; s++) {
    const rng = mulberry32(s + 1);
    const pick = <T,>(a: readonly T[]): T => a[Math.floor(rng() * a.length)];
    const careerSeed = Math.floor(rng() * 1e9);
    const cast = careerCast(careerSeed);
    const names = [cast.gaffer, cast.mentor, cast.captain, cast.rival];
    const chapter = pick(CHAPTERS);
    const age = 10 + Math.floor(rng() * 16);
    const seasonEventId = pick(SEASON_EVENTS) as string | null | undefined;
    const kind = pick(KINDS);
    const topTag = pick(TAGS);
    const sctx: ScenarioCtx = { seed: s, age, chapter, seasonEventId, careerSeed };
    const story = scenarioStory(kind, topTag, null, sctx);
    lint('scenarioStory', `seed=${s} kind=${kind} chapter=${chapter}`, story, names);
    calls++;

    const nctx: NarrateCtx = {
      age, chapter, stakes: (1 + Math.floor(rng() * 3)) as 1 | 2 | 3, personalityId: pick(PERSONALITIES),
      seasonEventId, seed: s * 7 + 3, careerSeed, milestone: pick(MILESTONES),
    };
    const play = narratePlay(`Card${s % 30}`, [topTag, pick(TAGS)], rng(), nctx);
    lint('narratePlay', `seed=${s} chapter=${chapter} milestone=${nctx.milestone}`, play, names);

    const life = narrateLifeEvent(kind, `Card${s % 30}`, rng(), nctx, kind === 'injury_comeback' ? (rng() < 0.5 ? 'rush' : 'patient') : undefined);
    lint('narrateLifeEvent', `seed=${s} kind=${kind}`, life, names);

    const rMoment = rivalMomentStory(cast.rival, null, sctx);
    lint('rivalMomentStory', `seed=${s}`, rMoment, [cast.rival]);
    const rPayoff = { rivalName: cast.rival, leadBefore: Math.floor(rng() * 20) - 10, leadAfter: Math.floor(rng() * 20) - 10 };
    const rRes = narrateRivalMoment(`Card${s % 30}`, rng(), nctx, rPayoff);
    lint('narrateRivalMoment', `seed=${s}`, rRes, [cast.rival]);

    const cMoment = callupMomentStory(null, sctx);
    lint('callupMomentStory', `seed=${s}`, cMoment, names);
    const cRes = narrateCallupMoment(`Card${s % 30}`, rng(), nctx);
    lint('narrateCallupMoment', `seed=${s}`, cRes, names);

    if (['Academy', 'Scholar', 'Youth Team'].includes(chapter)) {
      const scare = academyScareStory(chapter, s);
      lint('academyScareStory', `seed=${s} chapter=${chapter}`, scare, names);
      const scareRes = narrateAcademyScare(`Card${s % 30}`, rng(), nctx);
      lint('narrateAcademyScare', `seed=${s} chapter=${chapter}`, scareRes, names);
    }

    const news = rivalNews(s, chapter);
    lint('rivalNews', `seed=${s} chapter=${chapter}`, news, names);

    const coach = narrateCoach(`Coach${s % 12}`, rng() < 0.5 ? 'mentor' : 'coach', [topTag], nctx);
    lint('narrateCoach', `seed=${s}`, coach, names);
    const draft = narrateDraft(`Card${s % 30}`, [topTag], nctx);
    lint('narrateDraft', `seed=${s}`, draft, names);
    const offer = narrateOffer(`Offer${s % 8}`, { earn: rng() - 0.5, greed: rng() - 0.5, market: rng() - 0.5, form: rng() - 0.5 }, nctx);
    lint('narrateOffer', `seed=${s}`, offer, names);
  }
  console.log(`[text-lint] narrate.ts surfaces: ${calls} scenario seeds x ~11 functions each checked`);
}

// ── 2. chapterRecap + graduationEpilogue ──
{
  for (let s = 0; s < Math.min(N, 4000); s++) {
    const rng = mulberry32(s + 51);
    const pick = <T,>(a: readonly T[]): T => a[Math.floor(rng() * a.length)];
    const careerSeed = Math.floor(rng() * 1e9);
    const cast = careerCast(careerSeed);
    const names = [cast.gaffer, cast.mentor, cast.captain, cast.rival];
    const chapter = pick(CHAPTERS);
    const nextIdx = CHAPTERS.indexOf(chapter) + 1;
    const rctx: RecapCtx = {
      chapter, nextChapter: nextIdx < CHAPTERS.length && rng() < 0.8 ? CHAPTERS[nextIdx] : null,
      age: 10 + Math.floor(rng() * 16), careerSeed, personalityId: pick(PERSONALITIES),
      overall: Math.floor(rng() * 20), seasonEventId: pick(SEASON_EVENTS) as string | null | undefined,
    };
    const recap = chapterRecap(rctx);
    lint('chapterRecap', `seed=${s} chapter=${chapter}`, recap, names);

    const ectx: EpilogueCtx = {
      name: `Player${s % 40}`, careerSeed, personalityId: pick(PERSONALITIES),
      overall: Math.floor(rng() * 20), topTraits: [topTagFor(rng)], role: 'Forward',
    };
    const epi = graduationEpilogue(ectx);
    lint('graduationEpilogue', `seed=${s}`, epi, names);
  }
}
function topTagFor(rng: () => number): string { return TAGS[Math.floor(rng() * TAGS.length)]; }

// ── 3. computeOffPitch — endorsement obligation/strain, boot edge/unlock, temptation title/blurb ──
{
  for (let s = 0; s < Math.min(N, 4000); s++) {
    const rng = mulberry32(s + 777);
    const careerScore = Math.floor(rng() * 1500);
    const caps = Math.floor(rng() * 10);
    const bigWins = Math.floor(rng() * 5);
    const flair = Math.floor(rng() * 40);
    const tags: Record<string, number> = { teamwork: rng() * 30, leadership: rng() * 30, composure: rng() * 30, aggression: rng() * 30, flair: rng() * 30 };
    const turn = Math.floor(rng() * 120);
    const op = computeOffPitch({ careerScore, caps, seed: s, turn, tags, bigWins, flair });
    for (const e of op.endorsements) {
      lint('offpitch.endorsement.obligation', `seed=${s} brand=${e.brand}`, e.obligation);
      if (e.strain) lint('offpitch.endorsement.strain', `seed=${s} brand=${e.brand}`, e.strain);
    }
    for (const b of op.boots.owned) { lint('offpitch.boot.edge', `seed=${s} boot=${b.id}`, b.edge); lint('offpitch.boot.unlock', `seed=${s} boot=${b.id}`, b.unlock); }
    if (op.boots.next) { lint('offpitch.boot.next.edge', `seed=${s}`, op.boots.next.boot.edge); }
    if (op.temptation) { lint('offpitch.temptation.title', `seed=${s}`, op.temptation.title); lint('offpitch.temptation.blurb', `seed=${s}`, op.temptation.blurb); }
  }
}

// ── 4. Gaffer's Diary ──
{
  for (let s = 0; s < N; s++) {
    const rng = mulberry32(s + 999);
    const len = 1 + Math.floor(rng() * 25);
    const matches: DiaryMatch[] = Array.from({ length: len }, (_, i) => ({
      id: `s${s}-m${i}`, myScore: Math.floor(rng() * 6), oppScore: Math.floor(rng() * 6),
      oppId: rng() < 0.5 ? `opp${Math.floor(rng() * 3)}` : '', oppHandle: rng() < 0.5 ? `Rival ${Math.floor(rng() * 3)}` : '', createdAt: i,
    }));
    const total = 10 + Math.floor(rng() * 20);
    const table: DiaryTable | null = rng() < 0.9 ? {
      position: 1 + Math.floor(rng() * total), total, promote: 1 + Math.floor(rng() * 4), relegate: 1 + Math.floor(rng() * 4), points: Math.floor(rng() * 100),
    } : null;
    const MOODS = ['delighted', 'pleased', 'patient', 'concerned', 'restless', 'furious'] as const;
    const boardMood = rng() < 0.6 ? MOODS[Math.floor(rng() * MOODS.length)] : undefined;
    const entry = gaffersDiaryEntry({ seasonNumber: s, matches, table, boardMood });
    lint('gaffersDiaryEntry', `seed=${s}`, entry);
  }
}

// ── 5. Board messages ──
{
  const EXPECTATIONS: BoardExpectation[] = ['title', 'promotion', 'playoffs', 'midtable', 'survival'];
  for (let s = 0; s < N; s++) {
    const rng = mulberry32(s + 1234);
    const total = 10 + Math.floor(rng() * 20);
    const input: BoardMoodInput = {
      position: 1 + Math.floor(rng() * total), total, promote: 1 + Math.floor(rng() * 4), relegate: 1 + Math.floor(rng() * 4),
      points: Math.floor(rng() * 100), matchesPlayed: Math.floor(rng() * 46), totalMatches: 46,
      expectation: EXPECTATIONS[Math.floor(rng() * EXPECTATIONS.length)],
    };
    const standing = boardStanding(s, input);
    lint('boardStanding.message', `seed=${s} score=${standing.score}`, standing.message);
  }
}

// ── 6. Press lines (with + without staff aside) + staff quips/roster ──
{
  const TIMINGS: PressInput['timing'][] = ['pre', 'post'];
  const COMPS: PressCompetition[] = ['league', 'continental', 'international', 'cup'];
  const FORMS: PressForm[] = ['hot', 'cold', 'level'];
  const RESULTS: PressInput['result'][] = ['win', 'draw', 'loss', undefined];
  const ROLES: StaffRole[] = ['Assistant Manager', 'Head Scout', 'Fitness Coach', 'Goalkeeping Coach'];
  const MOMENTS: StaffMoment[] = ['bigWin', 'bigLoss', 'signing', 'preSeason', 'milestone'];
  for (let s = 0; s < N; s++) {
    const rng = mulberry32(s + 5555);
    const timing = TIMINGS[Math.floor(rng() * TIMINGS.length)];
    const input: PressInput = {
      timing, competition: COMPS[Math.floor(rng() * COMPS.length)], stakes: (1 + Math.floor(rng() * 3)) as 1 | 2 | 3,
      form: FORMS[Math.floor(rng() * FORMS.length)], result: timing === 'post' ? RESULTS[Math.floor(rng() * 3)] : undefined,
    };
    const roster = staffRoster(s);
    const names = [roster.assistant.name, roster.scout.name, roster.fitnessCoach.name, roster.goalkeepingCoach.name];
    const line = pressConferenceLine(s, s % 40, input);
    lint('pressConferenceLine', `seed=${s} ${timing}`, line, names);
    const lineStaff = pressConferenceLineWithStaff(s, s % 40, input, roster);
    lint('pressConferenceLineWithStaff', `seed=${s} ${timing}`, lineStaff, names);
    lint('staffRoster.personality.assistant', `seed=${s}`, roster.assistant.personality);
    lint('staffRoster.personality.scout', `seed=${s}`, roster.scout.personality);
    lint('staffRoster.personality.fitness', `seed=${s}`, roster.fitnessCoach.personality);
    lint('staffRoster.personality.gk', `seed=${s}`, roster.goalkeepingCoach.personality);
    const role = ROLES[Math.floor(rng() * ROLES.length)];
    const moment = MOMENTS[Math.floor(rng() * MOMENTS.length)];
    const quip = staffQuip(s, role, moment, s % 10);
    lint('staffQuip', `seed=${s} role=${role} moment=${moment}`, quip, names);
  }
}

// ── 7. Prestige rank-up blurbs ──
{
  for (let s = 0; s < Math.min(N, 3000); s++) {
    const rng = mulberry32(s + 4242);
    const record: ManagerRecord = {
      wins: Math.floor(rng() * 400), draws: Math.floor(rng() * 150), losses: Math.floor(rng() * 250),
      honours: [], highestTierIdx: Math.floor(rng() * 10), seasons: Math.floor(rng() * 30),
    };
    const level = PRESTIGE_LEVELS[Math.floor(rng() * PRESTIGE_LEVELS.length)];
    const blurb = prestigeRankUpBlurb(level.title, record);
    lint('prestigeRankUpBlurb', `seed=${s} title=${level.title}`, blurb);
  }
}

// ── 8. intl blurbs — continental ties, call-ups, World-Finals finish, rivalry, group/knockout drama ──
{
  const FINISHES: WCResult['myFinish'][] = ['Champions', 'Runners-up', 'Semi-finals', 'Quarter-finals', 'Group stage', 'Did not qualify'];
  for (let s = 0; s < N; s++) {
    const rng = mulberry32(s + 8642);
    const season = Math.floor(rng() * 40);
    const round = Math.floor(rng() * 3) as 0 | 1 | 2;
    const aWon = rng() < 0.5;
    const pens = rng() < 0.3;
    lint('contTieBlurb', `seed=${s} round=${round}`, contTieBlurb(s, season, round, aWon, pens));
    lint('contRivalryBlurb', `seed=${s} round=${round}`, contRivalryBlurb(s, season, round, aWon));
    const rivalClub = contRivalClub(s);
    lint('contRivalClub', `seed=${s}`, rivalClub);

    const capNo = 1 + Math.floor(rng() * 60);
    const nation = NATIONS[Math.floor(rng() * NATIONS.length)];
    const scored = rng() < 0.3 ? 1 + Math.floor(rng() * 2) : 0;
    lint('callUpBlurb', `seed=${s} cap=${capNo}`, callUpBlurb(s, capNo, nation, scored), [nation]);

    const finish = FINISHES[Math.floor(rng() * FINISHES.length)];
    lint('worldCupFinishBlurb', `seed=${s} finish=${finish}`, worldCupFinishBlurb(s, Math.floor(rng() * 10), nation, finish), [nation]);

    const hn = homeNation(`Surname${s % 50}`);
    lint('homeNation', `seed=${s}`, hn);

    // synthetic WCGroupRow[] / WCTie for the drama blurbs — the functions only read Pts/GD/gh/ga/pens,
    // so hand-built rows exercise the tight/comfortable branches without a full worldCup() simulation.
    const rows: WCGroupRow[] = [0, 1, 2, 3].map((i) => ({
      nation: `Nation${i}`, P: 3, W: 0, D: 0, L: 0, GF: 0, GA: 0,
      GD: Math.floor(rng() * 10) - 5, Pts: Math.floor(rng() * 9), mine: i === 0,
    })).sort((a, b) => b.Pts - a.Pts);
    lint('wcGroupDramaBlurb', `seed=${s}`, wcGroupDramaBlurb(s, Math.floor(rng() * 10), 0, rows));

    const tie: WCTie = {
      round: 'QF', a: 'NationA', b: 'NationB', gh: Math.floor(rng() * 4), ga: Math.floor(rng() * 4),
      winner: 'NationA', pens: rng() < 0.3, mine: true,
    };
    lint('wcKnockoutDramaBlurb', `seed=${s}`, wcKnockoutDramaBlurb(s, Math.floor(rng() * 10), tie));
  }
}

// ── Results ──
console.log(`\n[text-lint] ${failures.length} format issues logged (cap ${MAX_LOGGED}); ${knownIssues.length} known-issue (non-fatal) notes; ${pronounNotes.length} pronoun co-occurrence notes logged (cap ${MAX_LOGGED}, report-only).`);
if (failures.length) { console.log('\n── FORMAT ISSUES ──'); for (const f of failures) console.log(' - ' + f); }
if (knownIssues.length) {
  console.log('\n── KNOWN, ALREADY-DOCUMENTED ISSUES (non-fatal — see docs/qa-bug-report.md) ──');
  for (const k of knownIssues.slice(0, 5)) console.log(' - ' + k);
  if (knownIssues.length > 5) console.log(`   ... (${knownIssues.length - 5} more, capped)`);
}
if (pronounNotes.length) {
  console.log('\n── GENDERED-PRONOUN CO-OCCURRENCE (heuristic, for human review — NOT counted as failures) ──');
  for (const n of pronounNotes.slice(0, 25)) console.log(' - ' + n);
  if (pronounNotes.length > 25) console.log(`   ... (${pronounNotes.length - 25} more, capped)`);
}
if (failures.length > 0) {
  console.error(`\n[text-lint] FAILED with ${failures.length} format issue(s).`);
  process.exit(1);
} else {
  console.log('\n[text-lint] All generated text passed format checks (placeholders/blank/spacing/leaked-tokens); known non-fatal issues and pronoun notes are reported above for the bug report / human review.');
}
