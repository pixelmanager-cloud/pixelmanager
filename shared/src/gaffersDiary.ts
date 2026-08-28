// GAFFER'S DIARY — a running season story for the manager hub. Deterministic seeded template
// composition (same pattern as narrate.ts): no LLM, no wall-clock, no persisted streak state —
// everything is derived fresh from the match/table data the hub already has, so the same season
// state always reads the same way.
//
// Rebuilt from a rigid if/else priority chain into a WEIGHTED CANDIDATE picker: every storyline
// that's currently true (there are often several at once — e.g. "3rd in the table" AND "on a
// 4-game unbeaten run") goes into a pool, and a seeded roll picks one, weighted so season-defining
// stuff (promotion race, relegation dogfight, a rival finally beaten) still tends to dominate over
// routine form notes — but doesn't ALWAYS win the way it used to, which is what made the old diary
// repeat itself so fast once a season settled down.

import { makeRng } from './rng.js';
import type { BoardMood } from './board.js';

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function pickFrom<T>(rng: () => number, arr: readonly T[]): T { return arr[Math.floor(rng() * arr.length)]; }

export interface DiaryMatch { id: string; myScore: number; oppScore: number; oppId: string; oppHandle: string; createdAt: number }
export interface DiaryTable { position: number; total: number; promote: number; relegate: number; points: number; topFlight?: boolean }
/** `boardMood` is OPTIONAL and additive — existing callers that don't pass it behave exactly as before.
 *  When present, it lets a notable board-mood swing (delighted / furious, etc.) compete as its own
 *  diary candidate alongside the table/streak storylines, for cohesion between the two systems. */
export interface DiaryInput { seasonNumber: number; matches: DiaryMatch[]; table: DiaryTable | null; boardMood?: BoardMood }

type Phrase = (a: number, b: number) => string;

const RIVAL_FIRST_WIN: ((r: string) => string)[] = [
  (r) => `Finally — the hoodoo against ${r} is over. First win over them, and it feels overdue.`,
  (r) => `A breakthrough against ${r} at last: the first win in the fixture, long in coming.`,
  (r) => `${r} have been a bogey side, but not any more — the first win over them is in the book.`,
  (r) => `Years of near-misses against ${r}, and finally the monkey's off the back.`,
  (r) => `That's the one that's been missing — a win over ${r}, at last.`,
  (r) => `Beating ${r} for the first time. Small thing on paper, big thing in the dressing room.`,
  (r) => `${r} have had our number for a while. Not any more.`,
  (r) => `Job done against ${r}, and a psychological weight lifted with it.`,
];
const REVENGE_WIN: ((r: string) => string)[] = [
  (r) => `Revenge, of sorts — beat ${r} this time after they'd got the better of us last time out.`,
  (r) => `Turned the tables on ${r}. Last time hurt; this time it's ours.`,
  (r) => `Answered ${r} back in the best way possible — with three points.`,
  (r) => `${r} won the last meeting. This one's the reply.`,
  (r) => `A little bit of payback for ${r} today. Sweet.`,
];
const RELEGATION_WATCH: Phrase[] = [
  (pos) => `Sitting ${pos}${ord(pos)} and the drop zone is starting to loom.`,
  () => `Uncomfortable reading in the table right now — this needs turning around fast.`,
  (pos) => `${pos}${ord(pos)} in the table and nervous eyes on the relegation places.`,
  () => `The kind of run that gets a manager fielding awkward questions from the board.`,
  (pos) => `A relegation battle now, whether we like it or not — ${pos}${ord(pos)} tells its own story.`,
  () => `Points are precious down here. Every fixture is a six-pointer from now on.`,
  (pos) => `Not where a season is supposed to be at ${pos}${ord(pos)}. Time to dig in.`,
  () => `Survival football, plain and simple, until this run turns.`,
];
const PROMOTION_PLACES: Phrase[] = [
  (pos) => `Sitting pretty in ${pos}${ord(pos)} — right in the automatic promotion places.`,
  () => `Occupying an automatic promotion spot — the job now is not to blink.`,
  (pos) => `${pos}${ord(pos)} and in the box seats for promotion, for now.`,
  () => `This is exactly the kind of position a season's built for. Don't get comfortable.`,
  (pos) => `Up among the promotion places at ${pos}${ord(pos)} — the hard part is staying there.`,
  () => `The table doesn't lie: this squad belongs up here.`,
  (pos) => `A promotion spot at ${pos}${ord(pos)}, and the belief in the building is growing with it.`,
];
const PROMOTION_HUNT: Phrase[] = [
  (gap) => `Closing in on the automatic places — just ${gap} spot${gap === 1 ? '' : 's'} off the pace.`,
  (gap) => `The promotion picture is coming into focus, ${gap} place${gap === 1 ? '' : 's'} shy of the automatic spots.`,
  () => `Right in the promotion hunt — every fixture from here matters.`,
  (gap) => `${gap} place${gap === 1 ? '' : 's'} adrift of where we want to be. Fixable, but no room for slip-ups.`,
  () => `Close enough to smell it. Now it's about nerve as much as quality.`,
];
const PLAYOFF_HUNT: Phrase[] = [
  (pos) => `${pos}${ord(pos)} — outside the automatics, but well in the mix for a play-off run.`,
  () => `Not quite top of the pile, but a squad that could easily go on a run from here.`,
  (pos) => `Mid-table's not the story any more — ${pos}${ord(pos)} puts us firmly in the promotion conversation.`,
  () => `The kind of position where a good six weeks changes everything.`,
];
// TOP-FLIGHT variants: there's no promotion out of the top division, so the same table zones read as the title
// race + continental qualification, not "promotion" (PT-138 — matches spTableHtml's tier-1 "continental" key).
const CONTINENTAL_PLACES: Phrase[] = [
  (pos) => `${pos}${ord(pos)} in the top flight — right in the continental places.`,
  () => `In a European spot as it stands, and in the title conversation with it — the job now is not to blink.`,
  (pos) => `${pos}${ord(pos)} and chasing continental football, up at the sharp end of the division.`,
  () => `This is the company the club wants to keep — among the elite. Don't get comfortable.`,
  (pos) => `Up in ${pos}${ord(pos)}, and the belief that this squad belongs at the top is growing.`,
];
const CONTINENTAL_HUNT: Phrase[] = [
  (gap) => `Just ${gap} place${gap === 1 ? '' : 's'} off the continental spots — every point counts now.`,
  () => `Right on the shoulder of the European places — nerve as much as quality from here.`,
  (gap) => `${gap} place${gap === 1 ? '' : 's'} shy of a continental berth. Fixable, but no room for slip-ups.`,
];
const EUROPEAN_PUSH: Phrase[] = [
  (pos) => `${pos}${ord(pos)} — outside the European spots, but well capable of a late push for them.`,
  () => `Not quite among the elite yet, but a squad that could go on a run from here.`,
  (pos) => `${pos}${ord(pos)} in the top flight — a good six weeks and continental football is back in the conversation.`,
];
const WIN_STREAK: Phrase[] = [
  (n) => `${n} wins on the bounce now — the dressing room is buzzing.`,
  (n) => `A ${n}-match winning run and counting — this squad is finding its stride.`,
  (n) => `${n} straight wins. Whatever's been said in the dressing room this week, keep saying it.`,
  (n) => `${n} in a row now. Confidence is a funny thing — right now, we've got plenty of it.`,
  (n) => `Momentum is a manager's best friend, and right now we've got a ${n}-match head of it.`,
  (n) => `${n} wins on the spin. Teams are starting to fear the fixture list.`,
];
const UNBEATEN: Phrase[] = [
  (n) => `${n} games unbeaten now — something is building here.`,
  (n) => `Unbeaten in ${n} straight — the confidence is starting to show.`,
  (n) => `${n} without defeat. Not always pretty, but the results keep coming.`,
  (n) => `${n}-game unbeaten run. The kind of foundation a season gets built on.`,
];
const WINLESS: Phrase[] = [
  (n) => `A rocky patch — ${n} without a win now. Time to steady the ship.`,
  (n) => `${n} games without a win. A word with the squad is overdue.`,
  (n) => `${n} winless. Nothing to panic over yet, but it needs sorting.`,
  (n) => `${n} without three points. The kind of run that tests a dressing room's character.`,
  (n) => `${n} games and counting without a win. The press are starting to ask questions.`,
];
const MOMENTUM_SWING: Phrase[] = [
  (n) => `A good run — ${n} wins in a row — came to an abrupt halt. Back to work.`,
  (n) => `That ${n}-match winning streak is over. Now we find out what this squad's really made of.`,
  () => `Every run ends eventually. The response to this one is what'll matter.`,
  (n) => `${n} straight wins, snapped. A blip, hopefully, and nothing more.`,
];
const BIG_WIN: Phrase[] = [
  () => `A statement result — the kind of scoreline that gets noticed up and down the table.`,
  () => `That's the sort of win you dream about signing players off the back of.`,
  () => `A proper thrashing dished out. Nights like that are worth bottling.`,
  () => `We were relentless out there. Some scorelines just settle a fixture before it's begun.`,
  () => `A big win, and a reminder of exactly what this squad can do on its day.`,
];
const BIG_LOSS: Phrase[] = [
  () => `A tough one to take, and a heavy one at that. Some honest words are needed in training.`,
  () => `That scoreline stings more than the usual defeat. Time to look in the mirror.`,
  () => `A chastening afternoon. No sugar-coating a result like that.`,
  () => `A hard watch from the touchline. The video session this week won't be comfortable.`,
  () => `A heavy defeat — the kind that either breaks a team or forges one.`,
];
const THRILLER: Phrase[] = [
  () => `A wild, end-to-end game — great for the neutrals, murder on a manager's nerves.`,
  () => `Goals flying in at both ends out there. Not for the faint-hearted.`,
  () => `A proper rollercoaster of a match. The heart rate's only just settling now.`,
  () => `Chaotic, open, and thrilling — every fan's dream and every coach's nightmare.`,
];
const CLEAN_SHEET_STREAK: Phrase[] = [
  (n) => `${n} clean sheets on the spin — the back line is a fortress right now.`,
  (n) => `Not conceded in ${n} straight. Defensively, this is as good as it's looked all season.`,
  (n) => `${n} shutouts in a row. Games are won from the back as much as the front.`,
];
const LEAKY_STREAK: Phrase[] = [
  (n) => `Conceded at least two in each of the last ${n}. That's a conversation for the training ground.`,
  (n) => `The defence has sprung leaks in ${n} straight games. Needs sorting, and soon.`,
  (n) => `${n} games running now where we've shipped goals too easily.`,
];
const GOAL_DROUGHT: Phrase[] = [
  (n) => `${n} games without scoring. The finishing touch has gone missing.`,
  (n) => `Blank in ${n} straight now — chances or not, the net's stayed still.`,
  (n) => `A dry spell in front of goal, ${n} matches deep. Someone needs to step up.`,
];
const SHARPSHOOTING: Phrase[] = [
  (n) => `Scored at least twice in each of the last ${n}. The forwards are in a rich vein of form.`,
  (n) => `${n} straight games finding the net multiple times. Defences are struggling to cope.`,
  (n) => `The goals are flowing — multiple in each of the last ${n} matches.`,
];
const DRAW_RUN: Phrase[] = [
  (n) => `${n} draws in a row now. Honest performances, but the points are trickling rather than flowing.`,
  (n) => `${n} stalemates on the bounce. Time to find the extra edge that turns draws into wins.`,
  (n) => `${n} straight 1-alls (near enough). We're competitive in every game — just not quite winning them.`,
];
const SEASON_OPENER: Phrase[] = [
  () => `Early days yet, but the first impressions matter more than people admit.`,
  () => `Just the opening exchanges of the season. Plenty of football still to be played.`,
  () => `A new campaign under way. The table means nothing yet — the habits being built do.`,
  () => `Season's barely begun. Right now it's about laying foundations, not reading tea leaves.`,
];
const FORM_UPTURN: Phrase[] = [
  () => `Whatever changed a few weeks back, it's working — the recent form is a different level.`,
  () => `A real upturn lately. The squad looks like it's clicked into gear.`,
  () => `Marked improvement in the last handful of games. Long may it continue.`,
];
const FORM_DOWNTURN: Phrase[] = [
  () => `Recent weeks have been a step down from where we were. Worth a hard look at why.`,
  () => `The form's dipped lately, no way around it. A response is needed.`,
  () => `Something's slipped in the last few games. Time to find it and fix it.`,
];
// ── Board-mood colour (batch-3: board.ts's mood threaded in as its own competing storyline) ──
// Only the notable moods get a pool — 'patient' is the board's neutral resting state and reads no
// differently from the diary's own GENERIC fallback, so it's deliberately left out rather than padded.
const BOARD_DELIGHTED: Phrase[] = [
  () => `Word from upstairs: the board couldn't be happier with how this is going.`,
  () => `The chairman popped his head round the training ground door again this week. Always a good sign.`,
  () => `Whatever's said in the boardroom these days, it's all warm words. Enjoy it while it lasts.`,
  () => `The directors are delighted, and for once that's not faint praise.`,
];
const BOARD_PLEASED: Phrase[] = [
  () => `Quiet approval from the boardroom this week — nothing to worry about upstairs.`,
  () => `The board are pleased with the trajectory. No news is good news, and this is better than that.`,
  () => `A satisfied noise from the directors' box on Saturday. Keep it up.`,
];
const BOARD_CONCERNED: Phrase[] = [
  () => `A couple of pointed questions from the board this week. Nothing dramatic, but it's there.`,
  () => `The boardroom mood has cooled a touch. Worth noting, not worth panicking over.`,
  () => `Some quiet unease upstairs now — the kind that answers itself with a good week of results.`,
];
const BOARD_RESTLESS: Phrase[] = [
  () => `The board's patience is visibly thinning. This is the moment to answer it on the pitch.`,
  () => `Restlessness in the boardroom now — the sort of mood that filters down to a press conference fast.`,
  () => `Whispers upstairs are getting harder to ignore. The next few results carry real weight.`,
];
const BOARD_FURIOUS: Phrase[] = [
  () => `The boardroom mood is about as bad as it gets. This needs turning around, fast.`,
  () => `Real anger from the directors now — the kind of mood that ends careers if it doesn't shift.`,
  () => `Furious upstairs. Every word in the next press conference will be picked apart because of it.`,
];
const BOARD_POOL_BY_MOOD: Partial<Record<BoardMood, Phrase[]>> = {
  delighted: BOARD_DELIGHTED, pleased: BOARD_PLEASED, concerned: BOARD_CONCERNED,
  restless: BOARD_RESTLESS, furious: BOARD_FURIOUS,
};
// Weighted so a furious/delighted board can genuinely steal the entry, but a merely-concerned one
// stays a minor voice among the table/streak storylines rather than crowding them out every week.
const BOARD_WEIGHT_BY_MOOD: Partial<Record<BoardMood, number>> = {
  delighted: 14, pleased: 8, concerned: 10, restless: 16, furious: 20,
};

const GENERIC: Phrase[] = [
  (pos, pts) => `${pos}${ord(pos)} in the table on ${pts} points — steady progress, building for the run-in.`,
  (pos) => `A quiet week in ${pos}${ord(pos)} — no fireworks, just the daily grind of a season.`,
  () => `Business as usual — grinding out results and building the dynasty one match at a time.`,
  (pos) => `${pos}${ord(pos)} feels about right for where this squad's at. The work continues.`,
  () => `Nothing dramatic to report — just another week of training, tweaks, and small margins.`,
  (pos, pts) => `${pts} points on the board, sat ${pos}${ord(pos)}. Unspectacular, but honest.`,
  () => `A season is made of weeks like this one — unremarkable, but part of the story all the same.`,
  () => `No headlines this week. Sometimes that's exactly what a squad needs.`,
];
const OPENERS = [
  '', '', '', 'For what it\'s worth: ', 'The gaffer\'s note tonight: ', 'From the manager\'s notebook: ',
];

function ord(n: number): string {
  const m = n % 100;
  if (m >= 11 && m <= 13) return 'th';
  switch (n % 10) { case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th'; }
}

function outcome(m: DiaryMatch): 'W' | 'D' | 'L' { return m.myScore > m.oppScore ? 'W' : m.myScore < m.oppScore ? 'L' : 'D'; }

/** Trailing run length from the END of `ordered`, generic over any per-match predicate. */
function trailingMatchRun(ordered: DiaryMatch[], keep: (m: DiaryMatch) => boolean): number {
  let n = 0;
  for (let i = ordered.length - 1; i >= 0; i--) { if (keep(ordered[i])) n++; else break; }
  return n;
}
function trailingRun(ordered: DiaryMatch[], keep: (o: 'W' | 'D' | 'L') => boolean): number {
  return trailingMatchRun(ordered, (m) => keep(outcome(m)));
}

/** The opponent (by id) beaten for the very first time by the most recent match — null if the
 *  handle is blank (real opponent identity isn't threaded through yet by every caller) so we never
 *  interpolate an empty name into the sentence. */
function rivalFirstWin(ordered: DiaryMatch[]): string | null {
  const counts = new Map<string, number>();
  for (const m of ordered) if (m.oppId) counts.set(m.oppId, (counts.get(m.oppId) ?? 0) + 1);
  let rivalId: string | null = null, best = 1;
  for (const [id, c] of counts) if (c > best) { best = c; rivalId = id; }
  if (!rivalId) return null;
  const meetings = ordered.filter((m) => m.oppId === rivalId);
  const last = meetings[meetings.length - 1];
  if (!last.oppHandle || outcome(last) !== 'W') return null;
  const priorWin = meetings.slice(0, -1).some((m) => outcome(m) === 'W');
  return priorWin ? null : last.oppHandle;
}

/** The most recent match, if it's a win that avenges an immediately-preceding loss to that SAME
 *  opponent (their previous meeting, not necessarily their first ever). Null with no blank handle. */
function revengeWin(ordered: DiaryMatch[]): string | null {
  if (!ordered.length) return null;
  const last = ordered[ordered.length - 1];
  if (!last.oppId || !last.oppHandle || outcome(last) !== 'W') return null;
  const priorMeetings = ordered.slice(0, -1).filter((m) => m.oppId === last.oppId);
  if (!priorMeetings.length) return null;
  const prevMeeting = priorMeetings[priorMeetings.length - 1];
  return outcome(prevMeeting) === 'L' ? last.oppHandle : null;
}

interface Candidate { weight: number; text: string }

/** Compose the current Gaffer's Diary entry. Pure function of season state — same input, same text. */
export function gaffersDiaryEntry(input: DiaryInput): string {
  const ordered = [...input.matches].sort((a, b) => a.createdAt - b.createdAt);
  if (!ordered.length) return "A new season, a blank page — the diary starts here.";

  const seed = hashStr(`${input.seasonNumber}:${ordered.length}:${ordered[ordered.length - 1].id}`);
  const rng = makeRng(seed ^ 0x51ed270b);

  const t = input.table;
  const last = ordered[ordered.length - 1];
  const lastOutcome = outcome(last);
  const lastMargin = Math.abs(last.myScore - last.oppScore);

  const winStreak = trailingRun(ordered, (o) => o === 'W');
  const unbeaten = trailingRun(ordered, (o) => o !== 'L');
  const winless = trailingRun(ordered, (o) => o !== 'W');
  const drawRun = trailingRun(ordered, (o) => o === 'D');
  const cleanSheets = trailingMatchRun(ordered, (m) => m.oppScore === 0);
  const leaky = trailingMatchRun(ordered, (m) => m.oppScore >= 2);
  const drought = trailingMatchRun(ordered, (m) => m.myScore === 0);
  const sharpshooting = trailingMatchRun(ordered, (m) => m.myScore >= 2);

  const candidates: Candidate[] = [];
  const add = (weight: number, pool: readonly Phrase[], a = 0, b = 0) => candidates.push({ weight, text: pickFrom(rng, pool)(a, b) });
  const addNamed = (weight: number, pool: readonly ((r: string) => string)[], name: string) => candidates.push({ weight, text: pickFrom(rng, pool)(name) });

  const rival = rivalFirstWin(ordered);
  if (rival) addNamed(40, RIVAL_FIRST_WIN, rival);
  const revenge = rival ? null : revengeWin(ordered); // don't double-fire both on the same match
  if (revenge) addNamed(30, REVENGE_WIN, revenge);

  if (t) {
    if (t.total > t.promote + t.relegate) {
      if (t.position > t.total - t.relegate) add(35, RELEGATION_WATCH, t.position);
      else if (t.position <= t.promote) add(35, t.topFlight ? CONTINENTAL_PLACES : PROMOTION_PLACES, t.position);
      else if (t.position <= t.promote + 2) add(25, t.topFlight ? CONTINENTAL_HUNT : PROMOTION_HUNT, t.position - t.promote);
      else if (t.position <= t.promote + 6) add(15, t.topFlight ? EUROPEAN_PUSH : PLAYOFF_HUNT, t.position);
    }
  }

  if (ordered.length <= 2) add(25, SEASON_OPENER);
  if (winStreak >= 3) add(20 + winStreak, WIN_STREAK, winStreak);
  if (unbeaten >= 4 && winStreak < 3) add(15, UNBEATEN, unbeaten);
  if (winless >= 4) add(20, WINLESS, winless);
  if (lastOutcome === 'L') {
    const priorStreak = trailingRun(ordered.slice(0, -1), (o) => o === 'W');
    if (priorStreak >= 3) add(18, MOMENTUM_SWING, priorStreak);
  }
  if (lastOutcome === 'W' && lastMargin >= 3) add(12, BIG_WIN);
  if (lastOutcome === 'L' && lastMargin >= 3) add(14, BIG_LOSS);
  if (last.myScore + last.oppScore >= 5) add(8, THRILLER);
  if (cleanSheets >= 3) add(12, CLEAN_SHEET_STREAK, cleanSheets);
  if (leaky >= 3) add(10, LEAKY_STREAK, leaky);
  if (drought >= 3) add(12, GOAL_DROUGHT, drought);
  if (sharpshooting >= 3) add(10, SHARPSHOOTING, sharpshooting);
  if (drawRun >= 3) add(10, DRAW_RUN, drawRun);

  if (ordered.length >= 8) {
    const last5 = ordered.slice(-5), prior5 = ordered.slice(-10, -5);
    if (prior5.length === 5) {
      const ppg = (ms: DiaryMatch[]) => ms.reduce((s, m) => s + (outcome(m) === 'W' ? 3 : outcome(m) === 'D' ? 1 : 0), 0) / ms.length;
      const diff = ppg(last5) - ppg(prior5);
      if (diff >= 1.0) add(10, FORM_UPTURN);
      else if (diff <= -1.0) add(10, FORM_DOWNTURN);
    }
  }

  if (input.boardMood) {
    const pool = BOARD_POOL_BY_MOOD[input.boardMood];
    const weight = BOARD_WEIGHT_BY_MOOD[input.boardMood];
    if (pool && weight) add(weight, pool);
  }

  // GENERIC is always a fallback candidate so the pool is never empty, but at low weight so it
  // rarely wins when anything more specific is true — and reads fine on its own when nothing is.
  add(6, GENERIC, t?.position ?? 0, t?.points ?? 0);

  const total = candidates.reduce((s, c) => s + c.weight, 0);
  let roll = rng() * total;
  let chosen = candidates[candidates.length - 1];
  for (const c of candidates) { if (roll < c.weight) { chosen = c; break; } roll -= c.weight; }

  const opener = pickFrom(rng, OPENERS);
  return opener + chosen.text;
}
