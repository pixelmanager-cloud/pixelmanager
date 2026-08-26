// FORM GUIDE & RUN-IN — a WDWLW strip + trailing streak per club (derived from results), and a
// seeded run-in callout line in a season's closing fixtures (same template-composition pattern as
// gaffersDiary.ts / matchHeadline.ts). Pure derivation over already-known match/table state: no
// persisted streak or clinch state, so it can never drift from the underlying history.

import { makeRng } from './rng.js';

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function pickFrom<T>(rng: () => number, arr: readonly T[]): T { return arr[Math.floor(rng() * arr.length)]; }

// ---------- form strip ----------

export interface FormResult { home_id: string; away_id: string; home_score: number; away_score: number; created_at: number }
export interface FormEntry {
  /** last N results, oldest first, most recent last */
  strip: Array<'W' | 'D' | 'L'>;
  streak: { kind: 'unbeaten' | 'winless'; length: number } | null;
}

function outcomeFor(id: string, m: FormResult): 'W' | 'D' | 'L' {
  const my = id === m.home_id ? m.home_score : m.away_score;
  const opp = id === m.home_id ? m.away_score : m.home_score;
  return my > opp ? 'W' : my < opp ? 'L' : 'D';
}

/** A WDWLW strip and trailing unbeaten/winless streak (>=3) per club. Pure function of results. */
export function computeFormGuide(ids: string[], results: FormResult[], n = 5): Map<string, FormEntry> {
  const byClub = new Map<string, FormResult[]>();
  for (const id of ids) byClub.set(id, []);
  for (const m of results) {
    byClub.get(m.home_id)?.push(m);
    byClub.get(m.away_id)?.push(m);
  }
  const out = new Map<string, FormEntry>();
  for (const id of ids) {
    const ordered = (byClub.get(id) ?? []).sort((a, b) => a.created_at - b.created_at);
    const strip = ordered.slice(-n).map((m) => outcomeFor(id, m));
    let unbeaten = 0;
    for (let i = ordered.length - 1; i >= 0; i--) { if (outcomeFor(id, ordered[i]) !== 'L') unbeaten++; else break; }
    let winless = 0;
    for (let i = ordered.length - 1; i >= 0; i--) { if (outcomeFor(id, ordered[i]) !== 'W') winless++; else break; }
    const streak: FormEntry['streak'] = unbeaten >= 3 ? { kind: 'unbeaten', length: unbeaten }
      : winless >= 3 ? { kind: 'winless', length: winless } : null;
    out.set(id, { strip, streak });
  }
  return out;
}

// ---------- run-in callout ----------

export interface RunInTableRow { id: string; Pts: number; P: number }
export interface RunInInput {
  seed: string;
  table: RunInTableRow[]; // ranked order, as buildTable() returns
  meId: string;
  promote: number; relegate: number;
  /** total fixtures in a completed season for one club (double round-robin: 2 * (podSize - 1)) */
  totalFixtures: number;
}

const CLOSING_WINDOW = 5; // fire the callout once this few games remain

const TITLE_CLINCHED: string[] = [
  `Do the maths — the title is as good as won.`,
  `Nobody can catch this now. The title is all but wrapped up.`,
];
const TITLE_CLOSE: ((n: number) => string)[] = [
  (n) => `${n} win${n === 1 ? '' : 's'} from the title — it's there for the taking.`,
  (n) => `Win ${n} of the last ${n} and the title is confirmed. So close.`,
];
const TITLE_LEADING: ((n: number) => string)[] = [
  (n) => `Top of the pile with ${n} to go — the run-in starts here.`,
  (n) => `Leading the way into the final ${n} games. Nerve now, more than ever.`,
];
const PROMOTION_CLINCHED: string[] = [
  `Promotion is mathematically sealed — job done.`,
  `Can't be caught for the automatic spots now. Promotion secured.`,
];
const PROMOTION_CLOSE: ((n: number) => string)[] = [
  (n) => `${n} win${n === 1 ? '' : 's'} from promotion — right there in the closing stretch.`,
  (n) => `Get to ${n} more win${n === 1 ? '' : 's'} and promotion is confirmed.`,
];
const PROMOTION_HOLDING: ((n: number) => string)[] = [
  (n) => `Holding an automatic promotion spot with ${n} to go.`,
  (n) => `In the box seats for promotion, ${n} games left to see it through.`,
];
const PROMOTION_CHASE: ((gap: number, n: number) => string)[] = [
  (gap, n) => `${gap} point${gap === 1 ? '' : 's'} off the automatic places with ${n} to go — still very much alive.`,
  (gap, n) => `Chasing promotion: ${gap} point${gap === 1 ? '' : 's'} off the pace, ${n} games left to close it.`,
];
const RELEGATION_ZONE: ((gap: number, n: number) => string)[] = [
  (gap, n) => `In the drop zone with ${n} to go — ${gap} point${gap === 1 ? '' : 's'} from safety.`,
  (gap, n) => `Real trouble: in the relegation places, ${gap} point${gap === 1 ? '' : 's'} shy of safety with ${n} left.`,
];
const RELEGATION_DANGER: ((gap: number, n: number) => string)[] = [
  (gap, n) => `Not out of trouble yet — just ${gap} point${gap === 1 ? '' : 's'} clear of the drop with ${n} to go.`,
  (gap, n) => `A nervy run-in: ${gap} point${gap === 1 ? '' : 's'} above the relegation places, ${n} games left.`,
];

/**
 * A seeded run-in callout for the closing fixtures of a season — title/promotion clinch maths,
 * a promotion chase, or a relegation-zone/danger read. Returns null outside the closing window or
 * mid-table with nothing notable to say. Pure function of table state — same input, same text.
 */
export function runInCallout(input: RunInInput): string | null {
  const { table, meId, promote, relegate, totalFixtures } = input;
  const total = table.length;
  if (total <= promote + relegate) return null; // pod too small for zones to mean anything
  const position = table.findIndex((r) => r.id === meId);
  if (position < 0) return null;
  const me = table[position];
  const myGamesRemaining = totalFixtures - me.P;
  if (myGamesRemaining <= 0 || myGamesRemaining > CLOSING_WINDOW) return null;

  const rng = makeRng(hashStr(input.seed) ^ 0x7c1a9e3f);
  const clinchWins = (rivalRow: RunInTableRow | undefined): number => {
    if (!rivalRow) return 0;
    const rivalGamesRemaining = totalFixtures - rivalRow.P;
    const pointsToClinch = (rivalRow.Pts + 3 * rivalGamesRemaining) - me.Pts + 1;
    return Math.ceil(Math.max(0, pointsToClinch) / 3);
  };

  const rank = position + 1;
  if (rank === 1) {
    const wins = clinchWins(table[1]);
    if (wins <= 0 && table.length > 1) return pickFrom(rng, TITLE_CLINCHED);
    if (wins > 0 && wins <= myGamesRemaining) return pickFrom(rng, TITLE_CLOSE)(wins);
    return pickFrom(rng, TITLE_LEADING)(myGamesRemaining);
  }
  if (rank <= promote) {
    const wins = clinchWins(table[promote]);
    if (wins <= 0) return pickFrom(rng, PROMOTION_CLINCHED);
    if (wins <= myGamesRemaining) return pickFrom(rng, PROMOTION_CLOSE)(wins);
    return pickFrom(rng, PROMOTION_HOLDING)(myGamesRemaining);
  }
  if (rank <= promote + 3) {
    const gap = table[promote - 1].Pts - me.Pts;
    if (gap <= 6) return pickFrom(rng, PROMOTION_CHASE)(gap, myGamesRemaining);
    return null;
  }
  if (rank > total - relegate) {
    const gap = table[total - relegate - 1].Pts - me.Pts;
    return pickFrom(rng, RELEGATION_ZONE)(Math.max(0, gap), myGamesRemaining);
  }
  if (rank > total - relegate - 3) {
    const gap = me.Pts - table[total - relegate].Pts;
    if (gap <= 6) return pickFrom(rng, RELEGATION_DANGER)(Math.max(0, gap), myGamesRemaining);
    return null;
  }
  return null;
}
