// POST-MATCH HEADLINE — one seeded reaction line shown on the match report, keyed off the
// scoreline and whatever table/rating context is known (same seeded-template approach as
// gaffersDiary.ts): a thumping win, a late leveller, an underdog result, a relegation
// six-pointer, or just the scoreline. Pure text composition — never touches match outcomes.

import { makeRng } from './rng.js';

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function pickFrom<T>(rng: () => number, arr: readonly T[]): T { return arr[Math.floor(rng() * arr.length)]; }

export interface HeadlineGoal { minute: number; teamIdx: 0 | 1 }
export interface MatchHeadlineInput {
  matchId: string;
  homeName: string; awayName: string;
  homeScore: number; awayScore: number;
  /** every goal of the match in chronological order */
  goals: HeadlineGoal[];
  /** pre-match ratings, if known — drives the giant-killing check */
  homeRating?: number | null; awayRating?: number | null;
  /** 1-based league position of each side this season, if known */
  homeRank?: number | null; awayRank?: number | null;
  totalInPod?: number | null; relegateCount?: number | null;
}

type P2 = (a: string, b: string) => string;
type P4 = (a: string, b: string, h: number, l: number) => string;

const LATE_MINUTE = 80;
const GIANT_GAP = 120; // rating-points gap that reads as a clear favourite vs underdog

const SIX_POINTER: P4[] = [
  (h, a) => `A relegation six-pointer if ever there was one — ${h} and ${a} both know exactly what was at stake.`,
  (h, a) => `Two sides scrapping at the wrong end met head to head, and neither ${h} nor ${a} could afford to blink.`,
  (h, a) => `Backs against the wall for both — a proper six-pointer between ${h} and ${a}.`,
];
const GIANT_KILLING: P2[] = [
  (winner, loser) => `Nobody gave ${winner} a prayer against ${loser} — and they went and won it anyway.`,
  (winner, loser) => `The form book said ${loser} all day, but ${winner} tore it up.`,
  (winner, loser) => `A proper giant-killing — ${winner} were not supposed to leave with anything against ${loser}.`,
];
const LATE_EQUALISER: ((h: number, a: number) => string)[] = [
  (h, a) => `Snatched right at the death — ${h}–${a}, and it very nearly wasn't.`,
  () => `A sickening late leveller — three points felt gone before it landed.`,
  (h, a) => `Right into stoppage time before it finished ${h}–${a}. Cruel, if you were ahead.`,
];
const LATE_WINNER: ((winner: string, h: number, a: number) => string)[] = [
  (w, h, a) => `${w} left it desperately late — a ${h}–${a} winner in the closing minutes.`,
  (w) => `${w} nick it right at the death. Somebody will be dining out on that one.`,
  (w, h, a) => `Nerve ends jangling until the last kick — ${w} get there, ${h}–${a}.`,
];
const THUMPING: P4[] = [
  (w, l, hi, lo) => `${w} put on a show, ${hi}–${lo} against ${l} — no arguments about that one.`,
  (w, l, hi, lo) => `A statement result: ${w} ${hi}, ${l} ${lo}. Emphatic from start to finish.`,
  (w, l, hi, lo) => `${l} were brushed aside, ${hi}–${lo} — ${w} barely had to get out of second gear.`,
];
const NARROW: P2[] = [
  (w, l) => `Fine margins — ${w} edge it against ${l}, but it could have gone either way.`,
  (w, l) => `${w} scrape past ${l}. Ugly, maybe, but three points is three points.`,
  (w, l) => `A tight, nervy watch — ${w} get over the line against ${l}.`,
];
const GOALLESS: P2[] = [
  () => `A stalemate — chances came and went, but the net stayed still all afternoon.`,
  (h, a) => `${h} and ${a} cancel each other out. Honest effort, no goals to show for it.`,
  () => `A goalless afternoon — the sort of game only the two defences will enjoy watching back.`,
];
const DRAW: ((h: string, a: string, hs: number, as: number) => string)[] = [
  (h, a, hs, as) => `Honours even, ${hs}–${as} — ${h} and ${a} share the points.`,
  (h, a) => `A fair result in the end — neither ${h} nor ${a} did quite enough to win it.`,
  (_h, _a, hs, as) => `${hs}–${as}. A point apiece and the season rolls on.`,
];

/** Compose the post-match headline. Pure function of the match's own final data — same input, same text. */
export function matchHeadline(input: MatchHeadlineInput): string {
  const rng = makeRng(hashStr(input.matchId) ^ 0x2b4c8f1d);
  const { homeName: home, awayName: away, homeScore: h, awayScore: a, goals } = input;
  const margin = Math.abs(h - a);
  const winnerIdx: 0 | 1 | null = h > a ? 0 : a > h ? 1 : null;
  const winnerName = winnerIdx === 0 ? home : winnerIdx === 1 ? away : null;
  const loserName = winnerIdx === 0 ? away : winnerIdx === 1 ? home : null;
  const lastGoal = goals.length ? goals[goals.length - 1] : null;

  const relegZoneBoth = input.totalInPod != null && input.relegateCount != null
    && input.homeRank != null && input.awayRank != null
    && input.homeRank > input.totalInPod - input.relegateCount
    && input.awayRank > input.totalInPod - input.relegateCount;

  const ratingGap = (input.homeRating != null && input.awayRating != null) ? input.homeRating - input.awayRating : null;
  const giantKilling = winnerIdx != null && ratingGap != null &&
    ((winnerIdx === 1 && ratingGap >= GIANT_GAP) || (winnerIdx === 0 && -ratingGap >= GIANT_GAP));

  if (relegZoneBoth) return pickFrom(rng, SIX_POINTER)(home, away, h, a);
  if (giantKilling && winnerName && loserName) return pickFrom(rng, GIANT_KILLING)(winnerName, loserName);
  if (winnerIdx === null && lastGoal && lastGoal.minute >= LATE_MINUTE && h > 0) return pickFrom(rng, LATE_EQUALISER)(h, a);
  if (winnerIdx !== null && margin === 1 && lastGoal && lastGoal.teamIdx === winnerIdx && lastGoal.minute >= LATE_MINUTE) {
    return pickFrom(rng, LATE_WINNER)(winnerName!, h, a);
  }
  if (winnerIdx !== null && margin >= 3) return pickFrom(rng, THUMPING)(winnerName!, loserName!, Math.max(h, a), Math.min(h, a));
  if (h === 0 && a === 0) return pickFrom(rng, GOALLESS)(home, away);
  if (winnerIdx !== null) return pickFrom(rng, NARROW)(winnerName!, loserName!);
  return pickFrom(rng, DRAW)(home, away, h, a);
}
