import { mergeBanks } from './prompts/merge.js';
import { BOARD_EXTRA_1 } from './extra/board_pack_1.js';
import { BOARD_EXTRA_2 } from './extra/board_pack_2.js';
import { BOARD_EXTRA_3 } from './extra/board_pack_3.js';
import { BOARD_EXTRA_4 } from './extra/board_pack_4.js';
// ── Board mood — a pure, deterministic reading of how the board feels about the manager right now ──
// Highest-leverage gap flagged in docs/overnight/manager-content-audit.md: nothing tracked manager
// standing with the board across a season. This module is FLAVOUR + a bounded mood SCORE only — no
// sacking, no forced game-overs, no persisted state. It's a pure function of the same table/results
// data the Gaffer's Diary already consumes, re-evaluated fresh every time it's called (same inputs,
// same reading, always — the caller decides how often to show it, e.g. after each round).
//
// DESIGN QUESTION for the human (documented, not implemented): boardScore() below returns a bounded
// -100..100 standing that could later seed a sacking-risk system (e.g. "score below -60 for N
// consecutive rounds ⇒ risk of dismissal"), the way real games gate a manager's job on board patience.
// That consequence is deliberately NOT built here — this pass only builds the pure mood reading + the
// flavour text for it, per the batch brief's scope guard.

function hash32(...nums: number[]): number {
  let h = 2166136261 >>> 0;
  for (const n of nums) { h ^= (n >>> 0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function pick<T>(h: number, arr: readonly T[]): T { return arr[h % arr.length]; }

/** What the board realistically expects this season, expressed as a table BAND (not a hard number) —
 *  derived by the caller from club stature (e.g. prestige tier, prior finish). Kept a simple enum so
 *  this module never has to know anything about prestige.ts/clubseason.ts internals. */
export type BoardExpectation = 'title' | 'promotion' | 'playoffs' | 'midtable' | 'survival';

export interface BoardMoodInput {
  position: number;      // current league position (1 = top)
  total: number;         // clubs in the division
  promote: number;       // automatic promotion spots
  relegate: number;      // relegation spots
  points: number;
  matchesPlayed: number;
  totalMatches: number;  // full-season fixture count (e.g. FIXTURES_PER_SEASON)
  expectation: BoardExpectation;
}

export type BoardMood = 'delighted' | 'pleased' | 'patient' | 'concerned' | 'restless' | 'furious';

export interface BoardStanding {
  mood: BoardMood;
  /** -100 (furious) .. +100 (delighted). Bounded, deterministic, no memory of prior rounds. */
  score: number;
  message: string;
}

/** How many table places the expectation implies (lower number = higher standard), so we can measure
 *  "how far off target" the current position is regardless of division size. */
function expectationBand(exp: BoardExpectation, total: number, promote: number, relegate: number): number {
  switch (exp) {
    case 'title': return 1;
    // TOP-`promote` IS PROMOTION. This was `round(promote / 2)`, which with the game's promote:2 resolved
    // to 1 — so the "promotion" expectation demanded the player WIN the league, identically to the "title"
    // expectation above it. Two of the five bands were the same band.
    case 'promotion': return promote;
    case 'playoffs': return promote + 3;
    case 'survival': return total - relegate - 1;
    case 'midtable':
    default: return Math.round(total / 2);
  }
}

/** A bounded standing score from how far the current position sits from what's expected, weighted by
 *  how much of the season has been played (early slips matter far less than late-season ones — the
 *  board gives every manager a settling-in period). Pure; no persisted history. */
export function boardScore(input: BoardMoodInput): number {
  const { position, total, promote, relegate, matchesPlayed, totalMatches, expectation } = input;
  const target = expectationBand(expectation, total, promote, relegate);
  const gap = target - position; // positive = doing BETTER than asked, negative = worse
  const normalisedGap = gap / Math.max(1, total - 1); // roughly -1..1
  const seasonProgress = Math.max(0.15, Math.min(1, matchesPlayed / Math.max(1, totalMatches)));
  // relegation zone with real expectation of survival hits harder than a mid-table side sliding a few places
  const inDropZone = position > total - relegate;
  const dropPenalty = inDropZone && expectation !== 'survival' ? -25 : 0;
  // MEETING A HARD BAR IS AN ACHIEVEMENT; MEETING AN EASY ONE IS NOT. The score was pure distance from
  // target, so hitting the mark exactly always scored 0 — "patient" — whether the board asked you to
  // survive or to win the league. With a `title` expectation the best possible finish IS the target, so
  // the ceiling was 0 and `pleased` and `delighted` were unreachable for the whole back half of a career:
  // the reward for the hardest thing in the game was a shrug indistinguishable from mid-table.
  //
  // Clearing the bar now pays according to how high the bar was. It applies only when the bar is actually
  // MET, so it lifts the ceiling without cushioning failure — a title-chasing side that finishes tenth is
  // scored exactly as harshly as before.
  const DIFFICULTY: Record<BoardExpectation, number> = {
    survival: 0, midtable: 12, playoffs: 28, promotion: 45, title: 62,
  };
  // TAPERED, NOT A STEP. All-or-nothing at the target left a 78-point cliff either side of it: on a title
  // expectation 1st was `delighted` and 2nd `concerned`, with `pleased` and `patient` unreachable — the
  // middle of the band structure this bonus exists to unlock was still missing. Full credit at the target,
  // half a place off, nothing from two places out.
  const missedBy = Math.max(0, position - target);
  const met = (DIFFICULTY[expectation] ?? 0) * seasonProgress * Math.max(0, 1 - missedBy / 2);
  const raw = normalisedGap * 140 * seasonProgress + dropPenalty + met;
  return Math.max(-100, Math.min(100, Math.round(raw)));
}

/** Exported so the manager loop can re-derive the mood after shifting the season's score by the board
 *  goodwill an arc decision earned or spent — see MgrState.arcBoard. */
export function moodFromScore(score: number): BoardMood {
  if (score >= 55) return 'delighted';
  if (score >= 20) return 'pleased';
  if (score >= -15) return 'patient';
  if (score >= -45) return 'concerned';
  if (score >= -75) return 'restless';
  return 'furious';
}

const BASE_MOOD_LINES: Record<BoardMood, string[]> = {
  delighted: [
    'The board are delighted — this is exactly, if not better than, what they signed up for.',
    'Boardroom mood: delighted. Results like these buy real patience for whatever comes next.',
    'The directors are purring. A manager rarely gets it easier upstairs than this.',
    "Whatever's happening on the pitch, the board are thrilled with where this season is heading.",
    "The chairman has been telling anyone who'll listen how pleased he is. Enjoy it.",
  ],
  pleased: [
    'The board are pleased with progress — nothing to worry about from upstairs right now.',
    'Boardroom mood: pleased. The trajectory is right, and they can see it.',
    'A quietly satisfied board. No fireworks, just steady approval.',
    "The directors like what they're seeing. Keep doing what's working.",
    'Positive noises from the boardroom this week — the club is heading the right way.',
  ],
  patient: [
    'The board remain patient — results are roughly where they expected them to be.',
    "Boardroom mood: patient. Nobody upstairs is panicking, but nobody's popping corks either.",
    "A wait-and-see boardroom. The season's still taking shape, and they know it.",
    'No strong signals from the board either way — steady as she goes.',
    'The directors are giving the project the time it needs. For now.',
  ],
  concerned: [
    'The board are starting to have concerns — not a crisis, but the results need to turn.',
    'Boardroom mood: concerned. Quiet questions are being asked behind closed doors.',
    'Some unease creeping into the boardroom. This is the moment to answer it on the pitch.',
    "The directors haven't said anything publicly, but the concern upstairs is real.",
    'A few pointed emails from the board this week. Nothing dramatic — yet.',
  ],
  restless: [
    'The board are growing restless — patience is visibly running short upstairs.',
    'Boardroom mood: restless. The kind of run that gets a manager fielding awkward questions.',
    'Whispers in the boardroom are getting louder. The next few results matter a great deal.',
    "The directors are unsettled, and it's starting to show in how they talk about the club.",
    'Restlessness upstairs now — the sort of mood that makes press conferences uncomfortable.',
  ],
  furious: [
    'The board are furious. This is about as loud as it gets before words become actions.',
    "Boardroom mood: furious. The kind of run that ends careers if it doesn't turn around fast.",
    'Real anger upstairs now — the sort of mood a manager can feel walking the corridors.',
    "The directors are livid. Whatever's said in the next press conference will be picked apart.",
    'Furious is the only word for the boardroom right now. The pressure is total.',
  ],
};

// BASE plus every authoring pack.
const MOOD_LINES = mergeBanks(BASE_MOOD_LINES, BOARD_EXTRA_1, BOARD_EXTRA_2, BOARD_EXTRA_3, BOARD_EXTRA_4);


/** The board's current mood + flavour message, given today's league standing vs. expectation. Pure —
 *  same input, same reading. Callers should pass FRESH per-round input (no state to persist here). */
/** A board line for a mood, picked deterministically. Exported because the manager loop shifts the season
 *  score by the goodwill a season of arc decisions earned, and was then showing the mood of the SHIFTED
 *  score beside the message of the unshifted one — a 'restless' verdict wrapped around "steady as she goes". */
export function boardMessageFor(mood: BoardMood, seed: number): string {
  return pick(hash32(seed, 4177), MOOD_LINES[mood]);
}

export function boardStanding(seed: number, input: BoardMoodInput): BoardStanding {
  const score = boardScore(input);
  const mood = moodFromScore(score);
  const h = hash32(seed, input.matchesPlayed * 613 + 11, input.position * 17, score + 1000);
  return { mood, score, message: pick(h, MOOD_LINES[mood]) };
}

// ── Deriving an expectation from club stature (batch-3 backlog item) ────────────────────────────────
// boardStanding()/boardScore() need a BoardExpectation band, but nothing produced one — every call site
// had to invent its own heuristic. This maps "how good is this manager/club right now" into that band
// without board.ts having to know anything about prestige.ts's or clubseason.ts's actual types (same
// decoupling principle as the rest of this file): the caller reduces its own state down to a small,
// generic ExpectationInput first.

/** A coarse "how did the club finish, relative to ITS OWN division, last time out" band — deliberately
 *  the same vocabulary `gaffersDiaryEntry`'s table-position candidates already use, so a caller with a
 *  `DiaryTable`-shaped prior season can derive this trivially (finished in the promote spots ⇒
 *  'promotion', etc.) without board.ts importing anything from clubseason.ts/gaffersDiary.ts. */
export type PriorFinish = 'title' | 'promotion' | 'playoffs' | 'midtable' | 'survival' | 'relegated' | null;

export interface ExpectationInput {
  /** The manager's career prestige level index (0 = Rookie Gaffer .. 8 = Immortal Gaffer, matching
   *  `PRESTIGE_LEVELS` in prestige.ts) — a bigger reputation raises what's expected of them, independent
   *  of which club they're actually at right now. */
  prestigeLevelIdx: number;
  /** How the CLUB finished last season, if there was one (null for a brand-new save / a manager's first
   *  season at this club) — tempers or raises the reputation-driven baseline. */
  priorFinish: PriorFinish;
}

const EXPECTATION_ORDER: readonly BoardExpectation[] = ['survival', 'midtable', 'playoffs', 'promotion', 'title'];

/** A reputation-only baseline expectation band, before last season's finish is factored in. */
function baselineFromPrestige(prestigeLevelIdx: number): BoardExpectation {
  if (prestigeLevelIdx >= 7) return 'title';      // Footballing Legend, Immortal Gaffer
  if (prestigeLevelIdx >= 5) return 'promotion';  // Trophy Winner, Elite Manager
  if (prestigeLevelIdx >= 3) return 'playoffs';   // Established Manager, Seasoned Tactician
  if (prestigeLevelIdx >= 1) return 'midtable';   // Local Hero, Promising Boss
  return 'survival';                              // Rookie Gaffer
}

/** Pure `expectation` derivation for `BoardMoodInput` — reputation sets the baseline, last season's
 *  finish nudges it up (a big season raises the bar) or down (the board tempers expectations after a
 *  relegation or a bare-survival scrap, even for a big-name manager). Clamped to the same 5-band scale
 *  `boardScore()` already understands. */
export function deriveExpectation(input: ExpectationInput): BoardExpectation {
  let idx = EXPECTATION_ORDER.indexOf(baselineFromPrestige(input.prestigeLevelIdx));
  switch (input.priorFinish) {
    case 'title': idx += 1; break;      // won the league and stayed up (top flight) → the bar rises
    // TIER MOVES temper rather than amplify the difficulty change (PT-122): a just-PROMOTED club is a newcomer
    // in a tougher division, so the board wants consolidation, not more — nudge DOWN; a just-RELEGATED club is
    // now among the division's strongest and is expected to bounce straight back — keep the bar UP. The old
    // code did the opposite (promotion +1 / relegation -2), compounding the difficulty swing.
    case 'promotion': idx -= 1; break;
    case 'relegated': idx += 1; break;
    case 'survival': idx -= 1; break;
    case 'playoffs':
    case 'midtable':
    case null: break; // roughly on-target — no nudge
  }
  idx = Math.max(0, Math.min(EXPECTATION_ORDER.length - 1, idx));
  return EXPECTATION_ORDER[idx];
}
