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
    case 'promotion': return Math.max(1, Math.round(promote / 2));
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
  const raw = normalisedGap * 140 * seasonProgress + dropPenalty;
  return Math.max(-100, Math.min(100, Math.round(raw)));
}

function moodFromScore(score: number): BoardMood {
  if (score >= 55) return 'delighted';
  if (score >= 20) return 'pleased';
  if (score >= -15) return 'patient';
  if (score >= -45) return 'concerned';
  if (score >= -75) return 'restless';
  return 'furious';
}

const MOOD_LINES: Record<BoardMood, string[]> = {
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

/** The board's current mood + flavour message, given today's league standing vs. expectation. Pure —
 *  same input, same reading. Callers should pass FRESH per-round input (no state to persist here). */
export function boardStanding(seed: number, input: BoardMoodInput): BoardStanding {
  const score = boardScore(input);
  const mood = moodFromScore(score);
  const h = hash32(seed, input.matchesPlayed * 613 + 11, input.position * 17, score + 1000);
  return { mood, score, message: pick(h, MOOD_LINES[mood]) };
}
