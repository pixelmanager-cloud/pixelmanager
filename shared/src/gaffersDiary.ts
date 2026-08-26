// GAFFER'S DIARY — a running season story for the manager hub. Deterministic seeded template
// composition (same pattern as narrate.ts): no LLM, no wall-clock, no persisted streak state —
// everything is derived fresh from the match/table data the hub already has, so the same season
// state always reads the same way.

import { makeRng } from './rng.js';

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function pickFrom<T>(rng: () => number, arr: readonly T[]): T { return arr[Math.floor(rng() * arr.length)]; }

export interface DiaryMatch { id: string; myScore: number; oppScore: number; oppId: string; oppHandle: string; createdAt: number }
export interface DiaryTable { position: number; total: number; promote: number; relegate: number; points: number }
export interface DiaryInput { seasonNumber: number; matches: DiaryMatch[]; table: DiaryTable | null }

type Phrase = (a: number, b: number) => string;

const RIVAL_FIRST_WIN: ((r: string) => string)[] = [
  (r) => `Finally — the hoodoo against ${r} is over. First win over them, and it feels overdue.`,
  (r) => `A breakthrough against ${r} at last: the first win in the fixture, long in coming.`,
  (r) => `${r} have been a bogey side, but not any more — the first win over them is in the book.`,
];
const RELEGATION_WATCH: Phrase[] = [
  (pos) => `Sitting ${pos}${ord(pos)} and the drop zone is starting to loom.`,
  () => `Uncomfortable reading in the table right now — this needs turning around fast.`,
  (pos) => `${pos}${ord(pos)} in the table and nervous eyes on the relegation places.`,
];
const PROMOTION_PLACES: Phrase[] = [
  (pos) => `Sitting pretty in ${pos}${ord(pos)} — right in the automatic promotion places.`,
  () => `Occupying an automatic promotion spot — the job now is not to blink.`,
  (pos) => `${pos}${ord(pos)} and in the box seats for promotion, for now.`,
];
const PROMOTION_HUNT: Phrase[] = [
  (gap) => `Closing in on the automatic places — just ${gap} spot${gap === 1 ? '' : 's'} off the pace.`,
  (gap) => `The promotion picture is coming into focus, ${gap} place${gap === 1 ? '' : 's'} shy of the automatic spots.`,
  () => `Right in the promotion hunt — every fixture from here matters.`,
];
const WIN_STREAK: Phrase[] = [
  (n) => `${n} wins on the bounce now — the dressing room is buzzing.`,
  (n) => `A ${n}-match winning run and counting — this squad is finding its stride.`,
];
const UNBEATEN: Phrase[] = [
  (n) => `${n} games unbeaten now — something is building here.`,
  (n) => `Unbeaten in ${n} straight — the confidence is starting to show.`,
];
const WINLESS: Phrase[] = [
  (n) => `A rocky patch — ${n} without a win now. Time to steady the ship.`,
  (n) => `${n} games without a win. A word with the squad is overdue.`,
];
const GENERIC: Phrase[] = [
  (pos, pts) => `${pos}${ord(pos)} in the table on ${pts} points — steady progress, building for the run-in.`,
  (pos) => `A quiet week in ${pos}${ord(pos)} — no fireworks, just the daily grind of a season.`,
  () => `Business as usual — grinding out results and building the dynasty one match at a time.`,
];
const OPENERS = [
  '', '', 'For what it\'s worth: ', 'The gaffer\'s note tonight: ',
];

function ord(n: number): string {
  const m = n % 100;
  if (m >= 11 && m <= 13) return 'th';
  switch (n % 10) { case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th'; }
}

function outcome(m: DiaryMatch): 'W' | 'D' | 'L' { return m.myScore > m.oppScore ? 'W' : m.myScore < m.oppScore ? 'L' : 'D'; }

function trailingRun(ordered: DiaryMatch[], keep: (o: 'W' | 'D' | 'L') => boolean): number {
  let n = 0;
  for (let i = ordered.length - 1; i >= 0; i--) { if (keep(outcome(ordered[i]))) n++; else break; }
  return n;
}

function rivalFirstWin(ordered: DiaryMatch[]): string | null {
  const counts = new Map<string, number>();
  for (const m of ordered) counts.set(m.oppId, (counts.get(m.oppId) ?? 0) + 1);
  let rivalId: string | null = null, best = 1;
  for (const [id, c] of counts) if (c > best) { best = c; rivalId = id; }
  if (!rivalId) return null;
  const meetings = ordered.filter((m) => m.oppId === rivalId);
  const last = meetings[meetings.length - 1];
  if (outcome(last) !== 'W') return null;
  const priorWin = meetings.slice(0, -1).some((m) => outcome(m) === 'W');
  return priorWin ? null : last.oppHandle;
}

/** Compose the current Gaffer's Diary entry. Pure function of season state — same input, same text. */
export function gaffersDiaryEntry(input: DiaryInput): string {
  const ordered = [...input.matches].sort((a, b) => a.createdAt - b.createdAt);
  if (!ordered.length) return "A new season, a blank page — the diary starts here.";

  const seed = hashStr(`${input.seasonNumber}:${ordered.length}:${ordered[ordered.length - 1].id}`);
  const rng = makeRng(seed ^ 0x51ed270b);

  const rival = rivalFirstWin(ordered);
  const winStreak = trailingRun(ordered, (o) => o === 'W');
  const unbeaten = trailingRun(ordered, (o) => o !== 'L');
  const winless = trailingRun(ordered, (o) => o !== 'W');
  const t = input.table;

  let headline: string;
  if (rival) {
    headline = pickFrom(rng, RIVAL_FIRST_WIN)(rival);
  } else if (t && t.position > t.total - t.relegate && t.total > t.promote + t.relegate) {
    headline = pickFrom(rng, RELEGATION_WATCH)(t.position, 0);
  } else if (t && t.position <= t.promote) {
    headline = pickFrom(rng, PROMOTION_PLACES)(t.position, 0);
  } else if (t && t.position <= t.promote + 2) {
    headline = pickFrom(rng, PROMOTION_HUNT)(t.position - t.promote, 0);
  } else if (winStreak >= 3) {
    headline = pickFrom(rng, WIN_STREAK)(winStreak, 0);
  } else if (unbeaten >= 4) {
    headline = pickFrom(rng, UNBEATEN)(unbeaten, 0);
  } else if (winless >= 4) {
    headline = pickFrom(rng, WINLESS)(winless, 0);
  } else if (t) {
    headline = pickFrom(rng, GENERIC)(t.position, t.points);
  } else {
    headline = pickFrom(rng, GENERIC)(0, 0);
  }

  const opener = pickFrom(rng, OPENERS);
  return opener + headline;
}
