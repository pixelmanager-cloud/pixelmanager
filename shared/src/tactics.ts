import type { Formation } from './formations.js';

/**
 * Core team tactics. Each slider is an integer -2..+2; the engine turns these
 * into concrete behaviour, always read against the squad's stats and fitness.
 *   mentality: defensive(-2) .. attacking(+2)   — how far the team pushes up
 *   line:      deep(-2) .. high(+2)              — defensive-line height (space in behind)
 *   press:     low(-2) .. high(+2)              — how many players close down, and how hard
 *   tempo:     patient/short(-2) .. direct/long(+2)
 *   width:     narrow(-2) .. wide(+2)
 */
export interface Tactics {
  formation: Formation;
  mentality: number;
  line: number;
  press: number;
  tempo: number;
  width: number;
  /** INSTRUCTION (off by default): a defensive-line trick — the back line steps up together the instant
   *  a through-ball is played, catching a receiver who doesn't have a real pace edge. Only meaningful
   *  with a high/very-high line (line >= 1). See engine.ts beatsLastDefender(). */
  offsideTrap?: boolean;
  /** INSTRUCTION (off by default): when the keeper has the ball, always pick the safest short option
   *  instead of following the tempo slider — fewer risky giveaways right after a save/gather, at the
   *  cost of the faster restart a direct clearance would give. See engine.ts pickPassTarget(). */
  playOutOfDefence?: boolean;
  /** INSTRUCTION (unset = neutral): bias who the ball gets played to — 'wide' favours the widest
   *  available option, 'central' favours the most central one. Lets a manager lean into (or fight)
   *  the shape they picked. See engine.ts pickPassTarget(). */
  attackFocus?: 'wide' | 'central';
}

export const DEFAULT_TACTICS: Tactics = {
  formation: '4-4-2',
  mentality: 0,
  line: 0,
  press: 0,
  tempo: 0,
  width: 0,
};

export const TACTIC_PRESETS: Record<string, Tactics> = {
  Balanced: { formation: '4-4-2', mentality: 0, line: 0, press: 0, tempo: 0, width: 0 },
  'Gegenpress': { formation: '4-3-3', mentality: 1, line: 2, press: 2, tempo: 1, width: 1 },
  // A DEFENSIVE PRESET THAT LOSES IS A TRAP, AND THIS ONE WAS NAMED TO ATTRACT EXACTLY THE PLAYER WHO
  // SHOULD NEVER PICK IT. Measured across the full preset matrix it was last at every quality gap — as an
  // 11-v-15 underdog it took 0.03 points a game where Balanced took 0.17 — and the reason was not its
  // defending but its attack: `mentality: -2` makes `attackPush` exactly zero, so the side never came out,
  // never relieved pressure, and conceded MORE (2.08 a game, the worst in the table) as well as scoring
  // almost nothing. Sitting deep and narrow is the identity; refusing to leave the box is not a tactic.
  'Park the Bus': { formation: '4-4-2', mentality: -1, line: -2, press: 0, tempo: 1, width: -1 },
  'Tiki-Taka': { formation: '4-3-3', mentality: 1, line: 1, press: 1, tempo: -2, width: -1 },
  'Route One': { formation: '4-4-2', mentality: 1, line: 0, press: 0, tempo: 2, width: 1 },
  // Same fault, milder: a counter-attacking side sits off the ball, it does not decline to contest it.
  'Counter': { formation: '4-2-3-1', mentality: 0, line: -1, press: 0, tempo: 2, width: 0 },
};

/** Numeric modifiers derived from tactics, consumed by the engine. */
export interface TacticMods {
  /** metres to shift the whole team toward the opponent goal when they have the ball */
  attackPush: number;
  /** metres to shift the defensive line's base depth (+ = higher up the pitch) */
  lineShift: number;
  /** how many outfielders actively close down the ball carrier */
  pressCount: number;
  /** multiplier on tackle/close-down range and tackle probability */
  pressIntensity: number;
  /** -1..1: negative favours short/patient passing, positive favours long/direct */
  directness: number;
  /** multiplier (>1 wider, <1 narrower) applied to a player's lateral distance from centre */
  widthScale: number;
  /** per-tick fitness-drain multiplier from the chosen tactics */
  staminaDrain: number;
}

const PRESET_NAMES = Object.keys(TACTIC_PRESETS);

/**
 * Deterministic seeded tactical IDENTITY for a CPU opponent. Previously every single-player
 * opponent (league/continental/World-Finals) played flat DEFAULT_TACTICS 4-4-2 regardless of who
 * they were — same shape, same sliders, every match. This picks one of the already-proven presets
 * (balanced against each other by the anti-spam gate in strategy_test.ts, so none dominates) so a
 * given opponent has a stable, recognisable style across the whole save — "Ashcombe Town press you
 * high", "Kingsford United sit deep and hit you on the counter" — without inventing any new,
 * untested tactical math. Pure hash of the seed: same club always plays the same way.
 */
export function seededOpponentTactics(seed: number): Tactics {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  return { ...TACTIC_PRESETS[PRESET_NAMES[h % PRESET_NAMES.length]] };
}

export function deriveMods(t: Tactics): TacticMods {
  // Tactical effects are deliberately BOUNDED: stats are the primary driver, and a
  // tactical edge is worth ~1.5 overall rating points at most — enough to swing a close
  // match, never a mismatch. (Magnitudes tuned against shared/strategy_test.ts.)
  // Guard against a non-finite slider (save corruption / bad upstream computation) leaking a NaN
  // into player positions — a finite value passes through unchanged, so calibration is untouched. (QA M1)
  const fin = (v: number) => (Number.isFinite(v) ? v : 0);
  const mentality = fin(t.mentality), line = fin(t.line), press = fin(t.press), tempo = fin(t.tempo), width = fin(t.width);
  return {
    attackPush: 6 + mentality * 3.0,
    lineShift: line * 4.5,
    pressCount: press >= 2 ? 3 : press >= 0 ? 2 : 1,
    pressIntensity: 1 + press * 0.24,
    directness: tempo * 0.32,
    widthScale: 1 + width * 0.10,
    staminaDrain: 1 + Math.max(0, press) * 0.18 + Math.max(0, tempo) * 0.1 + Math.max(0, mentality) * 0.06,
  };
}
