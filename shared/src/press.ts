import { mergeList } from './prompts/merge.js';
import { PRESS_EXTRA_1 } from './extra/press_pack_1.js';
import { PRESS_EXTRA_2 } from './extra/press_pack_2.js';
import { PRESS_EXTRA_3 } from './extra/press_pack_3.js';
import { PRESS_EXTRA_4 } from './extra/press_pack_4.js';
// ── Press conferences — a deterministic pool of pre-/post-match media beats ──
// Audit finding: variety in the manager hub was folded entirely into the Gaffer's Diary; there was no
// distinct "press conference" surface. This module is a standalone system (its own file, per the
// batch brief) so it doesn't duplicate the diary's storyline detection — instead it riffs on FORM,
// COMPETITION and STAKES, which the diary never explicitly surfaces as its own axis. Pure + seeded;
// no LLM, no wall-clock, no persisted state.

import type { StaffRoster, StaffMoment } from './staff.js';
import { staffQuip } from './staff.js';

function hash32(...nums: number[]): number {
  let h = 2166136261 >>> 0;
  for (const n of nums) { h ^= (n >>> 0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const nameSeed = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) >>> 0;
function pick<T>(h: number, arr: readonly T[]): T { return arr[h % arr.length]; }

export type PressTiming = 'pre' | 'post';
export type PressCompetition = 'league' | 'continental' | 'international' | 'cup';
export type PressForm = 'hot' | 'cold' | 'level';
export type PressResult = 'win' | 'draw' | 'loss' | null; // null only valid for timing='pre'

export interface PressInput {
  timing: PressTiming;
  competition: PressCompetition;
  /** 1 = routine fixture, 2 = big occasion, 3 = season-defining (title decider, relegation six-pointer,
   *  cup final, World-Finals knockout). Drives how loaded the questions get. */
  stakes: 1 | 2 | 3;
  form: PressForm;
  result?: PressResult; // required (non-null) when timing === 'post'
}

const COMPETITION_TAG: Record<PressCompetition, string> = {
  league: 'league fixture', continental: 'continental tie', international: 'international break', cup: 'cup tie',
};

// ── PRE-match: reporters probe team news, pressure, expectation ──
const BASE_PRE_ROUTINE: string[] = [
  'A quiet room today — mostly routine questions about team news and fitness.',
  '"Just another game to us, prepare the same way every week," is the line to the press.',
  'The press pack are more interested in the team sheet than any grand narrative today.',
  'Nothing to read into the tone in the room — a routine build-up to a routine fixture.',
];
const BASE_PRE_STAKES_HIGH: string[] = [
  'The room is packed. Every question circles back to the same word: pressure.',
  '"We embrace it, we don\'t hide from it," comes the answer when the stakes are put to the room.',
  'A charged press conference — everyone in the building knows what tonight could mean.',
  'The line about "taking each game as it comes" gets a harder test than usual today.',
];
const BASE_PRE_HOT_FORM: string[] = [
  'Reporters are asking about momentum, and there\'s no reason to talk it down.',
  '"We\'re playing with real confidence right now, and it shows," is the message to the press.',
  'A relaxed, upbeat room — good form makes for easy press conferences.',
];
const BASE_PRE_COLD_FORM: string[] = [
  'Every question today comes back to the recent run, one way or another.',
  '"We\'re better than the results suggest, and we\'ll prove it," is the line under pressure.',
  'A tense room. The questions about form keep coming, and there\'s no ducking them.',
];
const BASE_PRE_CONTINENTAL: string[] = [
  'The foreign press are in the room too today — a different kind of occasion, a different set of questions.',
  '"European nights are what you dream about as a kid," the manager tells the assembled media.',
];
const BASE_PRE_INTERNATIONAL: string[] = [
  'Talk turns to the players away on international duty, and the risk of picking up knocks.',
  '"We just hope everyone comes back in one piece," is the honest answer on the international break.',
];
const BASE_PRE_CUP: string[] = [
  'Cup magic gets a mention more than once — reporters love a giant-killing storyline.',
  '"Respect for the opposition, but we\'re here to win it," is the message ahead of the tie.',
];

// ── POST-match: reaction to the result just gone ──
const BASE_POST_WIN_ROUTINE: string[] = [
  '"Job done, professional performance," is the summary for the cameras.',
  'A satisfied but low-key press conference — three points, nothing more said about it.',
  '"We take the three points and move on to the next one," comes the familiar line.',
];
const BASE_POST_WIN_BIG: string[] = [
  '"That\'s as complete a performance as we\'ve put in all season," beams the manager.',
  'A genuinely buoyant press conference — this result will be talked about for a while.',
  '"I couldn\'t be prouder of this group after that," is the verdict, and it\'s not for show.',
];
const BASE_POST_DRAW: string[] = [
  '"A point\'s a point, and on another day it\'s three," is the diplomatic line afterward.',
  'A measured press conference — mild frustration, but no panic in the answers.',
  '"We\'ll take the positives and fix what didn\'t work," comes the response.',
];
const BASE_POST_LOSS_ROUTINE: string[] = [
  '"We\'ll analyse it, learn from it, and move on," is the composed reaction.',
  'A short, businesslike press conference — no excuses offered, none really needed.',
  '"Not our day. It happens over a long season," comes the shrugged-off answer.',
];
const BASE_POST_LOSS_STAKES: string[] = [
  'A tense room afterward — every question carries an edge that wasn\'t there before kick-off.',
  '"We\'ll take the criticism, that\'s part of the job," comes the answer, jaw tight.',
  'A defensive, careful press conference — the manager picks every word with real caution.',
  '"I take responsibility. The buck stops with me," is the blunt line to a packed room.',
];
const BASE_POST_HOT_FORM_CONTINUES: string[] = [
  '"We just keep winning and let people talk about it," is the relaxed response to another good result.',
  'The questions about momentum get easier to answer with every passing week like this one.',
];
const BASE_POST_COLD_FORM_CONTINUES: string[] = [
  '"We know it needs to change, and it will," is the tired but defiant line after another below-par result.',
  'A press conference that\'s starting to feel repetitive — same questions, same patient answers, different week.',
];

// BASE banks plus every authoring pack — see shared/src/prompts/merge.ts for why packs are separate files.
const PRE_ROUTINE: string[] = mergeList(BASE_PRE_ROUTINE as string[], PRESS_EXTRA_1['PRE_ROUTINE'], PRESS_EXTRA_2['PRE_ROUTINE'], PRESS_EXTRA_3['PRE_ROUTINE'], PRESS_EXTRA_4['PRE_ROUTINE']);
const PRE_STAKES_HIGH: string[] = mergeList(BASE_PRE_STAKES_HIGH as string[], PRESS_EXTRA_1['PRE_STAKES_HIGH'], PRESS_EXTRA_2['PRE_STAKES_HIGH'], PRESS_EXTRA_3['PRE_STAKES_HIGH'], PRESS_EXTRA_4['PRE_STAKES_HIGH']);
const PRE_HOT_FORM: string[] = mergeList(BASE_PRE_HOT_FORM as string[], PRESS_EXTRA_1['PRE_HOT_FORM'], PRESS_EXTRA_2['PRE_HOT_FORM'], PRESS_EXTRA_3['PRE_HOT_FORM'], PRESS_EXTRA_4['PRE_HOT_FORM']);
const PRE_COLD_FORM: string[] = mergeList(BASE_PRE_COLD_FORM as string[], PRESS_EXTRA_1['PRE_COLD_FORM'], PRESS_EXTRA_2['PRE_COLD_FORM'], PRESS_EXTRA_3['PRE_COLD_FORM'], PRESS_EXTRA_4['PRE_COLD_FORM']);
const PRE_CONTINENTAL: string[] = mergeList(BASE_PRE_CONTINENTAL as string[], PRESS_EXTRA_1['PRE_CONTINENTAL'], PRESS_EXTRA_2['PRE_CONTINENTAL'], PRESS_EXTRA_3['PRE_CONTINENTAL'], PRESS_EXTRA_4['PRE_CONTINENTAL']);
const PRE_INTERNATIONAL: string[] = mergeList(BASE_PRE_INTERNATIONAL as string[], PRESS_EXTRA_1['PRE_INTERNATIONAL'], PRESS_EXTRA_2['PRE_INTERNATIONAL'], PRESS_EXTRA_3['PRE_INTERNATIONAL'], PRESS_EXTRA_4['PRE_INTERNATIONAL']);
const PRE_CUP: string[] = mergeList(BASE_PRE_CUP as string[], PRESS_EXTRA_1['PRE_CUP'], PRESS_EXTRA_2['PRE_CUP'], PRESS_EXTRA_3['PRE_CUP'], PRESS_EXTRA_4['PRE_CUP']);
const POST_WIN_ROUTINE: string[] = mergeList(BASE_POST_WIN_ROUTINE as string[], PRESS_EXTRA_1['POST_WIN_ROUTINE'], PRESS_EXTRA_2['POST_WIN_ROUTINE'], PRESS_EXTRA_3['POST_WIN_ROUTINE'], PRESS_EXTRA_4['POST_WIN_ROUTINE']);
const POST_WIN_BIG: string[] = mergeList(BASE_POST_WIN_BIG as string[], PRESS_EXTRA_1['POST_WIN_BIG'], PRESS_EXTRA_2['POST_WIN_BIG'], PRESS_EXTRA_3['POST_WIN_BIG'], PRESS_EXTRA_4['POST_WIN_BIG']);
const POST_DRAW: string[] = mergeList(BASE_POST_DRAW as string[], PRESS_EXTRA_1['POST_DRAW'], PRESS_EXTRA_2['POST_DRAW'], PRESS_EXTRA_3['POST_DRAW'], PRESS_EXTRA_4['POST_DRAW']);
const POST_LOSS_ROUTINE: string[] = mergeList(BASE_POST_LOSS_ROUTINE as string[], PRESS_EXTRA_1['POST_LOSS_ROUTINE'], PRESS_EXTRA_2['POST_LOSS_ROUTINE'], PRESS_EXTRA_3['POST_LOSS_ROUTINE'], PRESS_EXTRA_4['POST_LOSS_ROUTINE']);
const POST_LOSS_STAKES: string[] = mergeList(BASE_POST_LOSS_STAKES as string[], PRESS_EXTRA_1['POST_LOSS_STAKES'], PRESS_EXTRA_2['POST_LOSS_STAKES'], PRESS_EXTRA_3['POST_LOSS_STAKES'], PRESS_EXTRA_4['POST_LOSS_STAKES']);
const POST_HOT_FORM_CONTINUES: string[] = mergeList(BASE_POST_HOT_FORM_CONTINUES as string[], PRESS_EXTRA_1['POST_HOT_FORM_CONTINUES'], PRESS_EXTRA_2['POST_HOT_FORM_CONTINUES'], PRESS_EXTRA_3['POST_HOT_FORM_CONTINUES'], PRESS_EXTRA_4['POST_HOT_FORM_CONTINUES']);
const POST_COLD_FORM_CONTINUES: string[] = mergeList(BASE_POST_COLD_FORM_CONTINUES as string[], PRESS_EXTRA_1['POST_COLD_FORM_CONTINUES'], PRESS_EXTRA_2['POST_COLD_FORM_CONTINUES'], PRESS_EXTRA_3['POST_COLD_FORM_CONTINUES'], PRESS_EXTRA_4['POST_COLD_FORM_CONTINUES']);


/** A deterministic press-conference line for the given moment. `seed` should be the save seed (or a
 *  combination of save seed + round/season number) so the same moment always reads the same way, but
 *  different moments across a save vary widely. Pure; no state. */
export function pressConferenceLine(seed: number, roundSalt: number, input: PressInput): string {
  const h = hash32(seed, roundSalt * 733 + 19, nameSeed(input.timing), nameSeed(input.competition), input.stakes * 97, nameSeed(input.form));

  const pools: string[][] = [];
  if (input.timing === 'pre') {
    if (input.stakes >= 3) pools.push(PRE_STAKES_HIGH);
    else if (input.form === 'hot') pools.push(PRE_HOT_FORM);
    else if (input.form === 'cold') pools.push(PRE_COLD_FORM);
    else pools.push(PRE_ROUTINE);
    if (input.competition === 'continental') pools.push(PRE_CONTINENTAL);
    if (input.competition === 'international') pools.push(PRE_INTERNATIONAL);
    if (input.competition === 'cup') pools.push(PRE_CUP);
  } else {
    const result = input.result ?? 'draw';
    if (result === 'win') {
      if (input.stakes >= 2) pools.push(POST_WIN_BIG); else pools.push(POST_WIN_ROUTINE);
      if (input.form === 'hot') pools.push(POST_HOT_FORM_CONTINUES);
    } else if (result === 'draw') {
      pools.push(POST_DRAW);
    } else {
      if (input.stakes >= 2) pools.push(POST_LOSS_STAKES); else pools.push(POST_LOSS_ROUTINE);
      if (input.form === 'cold') pools.push(POST_COLD_FORM_CONTINUES);
    }
  }

  const chosenPool = pick(h, pools);
  return pick(hash32(h, 7), chosenPool);
}

/** A short "on the agenda" tag line for a fixture preview card, independent of the full quote above —
 *  useful when a caller just wants a one-line label rather than a full press-conference beat. */
export function pressAgendaTag(input: Pick<PressInput, 'competition' | 'stakes'>): string {
  const base = COMPETITION_TAG[input.competition];
  if (input.stakes >= 3) return `Season-defining ${base}`;
  if (input.stakes === 2) return `Big ${base}`;
  return `Routine ${base}`;
}

// ── Staff cross-pollination (batch-3): occasionally let a named staff member field a follow-up ──
// `pressConferenceLine` itself is left untouched (its signature/behaviour is unchanged, so any
// existing caller is unaffected) — this is a separate combinator a caller can opt into when it also
// has a `staffRoster()` to hand. Only fires on the higher-stakes post-match beats (a routine result or
// a pre-match presser doesn't need a second voice), and even then only about a third of the time, so
// it reads as a genuine occasional aside rather than a permanent fixture.
const PRESS_ASIDE_MOMENT: Record<'win' | 'loss', StaffMoment> = { win: 'bigWin', loss: 'bigLoss' };

/** `pressConferenceLine` plus, roughly one time in three on a stakes>=2 post-match beat, a named staff
 *  member (drawn from `roster`) fielding a follow-up in character — a small joined-up-backroom touch
 *  without duplicating either module's own pools. Deterministic; same inputs always read the same way,
 *  same as the two underlying functions it composes. */
export function pressConferenceLineWithStaff(seed: number, roundSalt: number, input: PressInput, roster: StaffRoster): string {
  const base = pressConferenceLine(seed, roundSalt, input);
  if (input.timing !== 'post' || input.stakes < 2 || input.result !== 'win' && input.result !== 'loss') return base;
  const moment = PRESS_ASIDE_MOMENT[input.result];
  const h = hash32(seed, roundSalt * 331 + 41, nameSeed(moment), 0xa51de);
  if (h % 3 !== 0) return base; // ~1-in-3: an occasional aside, not every time
  const members = [roster.assistant, roster.scout, roster.fitnessCoach, roster.goalkeepingCoach];
  const member = pick(h, members);
  const quip = staffQuip(seed, member.role, moment, roundSalt);
  return `${base} ${member.name} adds: ${quip}`;
}
