import type { Duty, Player, Role } from './types.js';

/**
 * Per-player duties. A duty biases *behaviour* only (where a player positions,
 * whether they shoot or look for the pass, how eagerly they press) — it never
 * changes a stat, so it can't be pay-to-win and it keeps the tuned 1-20 ladder
 * intact. Everything here is a pure function of the player, so the same squad
 * always plays the same way (determinism for commit-reveal).
 */

/** Duties a position can be assigned; first entry is the neutral default. */
export const DUTIES_BY_ROLE: Record<Role, Duty[]> = {
  GK: ['keeper', 'sweeper-keeper'],
  DF: ['cover', 'stopper', 'ball-playing-defender', 'inverted-fullback'],
  MF: ['box-to-box', 'playmaker', 'ball-winner', 'deep-lying-playmaker'],
  FW: ['poacher', 'target-man', 'pressing-forward', 'false-9'],
};

/** Short human label for UI. */
export const DUTY_LABEL: Record<Duty, string> = {
  'keeper': 'Keeper',
  'sweeper-keeper': 'Sweeper-K',
  'cover': 'Cover',
  'stopper': 'Stopper',
  'ball-playing-defender': 'Ball-Playing DF',
  'inverted-fullback': 'Inverted FB',
  'box-to-box': 'Box-to-Box',
  'playmaker': 'Playmaker',
  'ball-winner': 'Ball-Winner',
  'deep-lying-playmaker': 'Deep Playmaker',
  'poacher': 'Poacher',
  'target-man': 'Target Man',
  'pressing-forward': 'Pressing Fwd',
  'false-9': 'False 9',
};

export interface DutyMods {
  /** scales how far the player pushes upfield when their team attacks (1 = neutral). */
  push: number;
  /** extra ball-attraction when attacking: + drops the player toward the ball to link play, - holds their line. */
  come: number;
  /** multiplier on the player's shot propensity. */
  shoot: number;
  /** added attractiveness as a pass target (teammates look for them more/less). */
  magnet: number;
  /** press eagerness: + closes down and tackles more readily, - sits off. */
  press: number;
  /** for a GK only: extra metres the keeper will advance off the line (sweeper-keeper). */
  gkStep: number;
}

const NEUTRAL: DutyMods = { push: 1, come: 0, shoot: 1, magnet: 0, press: 0, gkStep: 0 };

// Magnitudes are deliberately small — duties are nudges, not overrides, so the
// engine's goals/possession calibration holds (see shared/strategy_test.ts).
const TABLE: Record<Duty, DutyMods> = {
  'keeper':         { ...NEUTRAL },
  'sweeper-keeper': { ...NEUTRAL, gkStep: 7 },
  'cover':          { ...NEUTRAL, push: 0.8, press: -0.3 },
  'stopper':        { ...NEUTRAL, push: 1.2, press: 0.6 },
  'box-to-box':     { ...NEUTRAL, push: 1.1, come: 0.03, press: 0.2 },
  'playmaker':      { ...NEUTRAL, push: 0.85, come: 0.1, shoot: 0.8, magnet: 5, press: -0.15 },
  'ball-winner':    { ...NEUTRAL, push: 0.8, shoot: 0.7, magnet: -2, press: 0.8 },
  'poacher':        { ...NEUTRAL, push: 1.25, come: -0.05, shoot: 1.3, magnet: 3 },
  'target-man':     { ...NEUTRAL, come: 0.05, shoot: 0.95, magnet: 5 },
  // ── FM-style named roles (still small nudges — calibration-safe) ──
  'ball-playing-defender': { ...NEUTRAL, push: 0.9, come: 0.05, shoot: 0.7, magnet: 3, press: -0.2 }, // brings it out, links play
  'inverted-fullback':     { ...NEUTRAL, push: 1.0, come: 0.08, magnet: 2, press: 0.1 },              // tucks into midfield
  'deep-lying-playmaker':  { ...NEUTRAL, push: 0.7, come: 0.12, shoot: 0.6, magnet: 6, press: -0.2 }, // deep regista, sprays it
  'pressing-forward':      { ...NEUTRAL, push: 1.15, shoot: 1.0, magnet: 2, press: 0.7 },             // defends from the front
  'false-9':               { ...NEUTRAL, push: 0.9, come: 0.12, shoot: 0.9, magnet: 6 },              // drops deep to link
};

export function dutyMods(d: Duty | undefined): DutyMods {
  return d ? TABLE[d] : NEUTRAL;
}

/** True if a duty is legal for a given position (used to sanitise manager input). */
export function isDutyForRole(role: Role, d: unknown): d is Duty {
  return typeof d === 'string' && (DUTIES_BY_ROLE[role] as string[]).includes(d);
}

/**
 * Pick a sensible duty from a player's strengths — deterministic, no RNG.
 * Chooses the character the stats already point to (a poacher finishes, a
 * playmaker passes, a ball-winner tackles), so auto-built squads feel varied.
 */
export function defaultDuty(p: Player): Duty {
  const a = p.attrs;
  switch (p.role) {
    case 'GK': return a.pace + a.positioning >= 28 ? 'sweeper-keeper' : 'keeper';
    case 'DF': return a.tackling >= a.positioning + 1 ? 'stopper' : 'cover';
    case 'MF':
      if (a.passing >= a.tackling + 2 && a.passing >= a.workrate) return 'playmaker';
      if (a.tackling >= a.passing + 1) return 'ball-winner';
      return 'box-to-box';
    case 'FW': return a.strength >= a.pace + 2 ? 'target-man' : 'poacher';
  }
}

/** The duty actually used: an explicit manager override if present, else auto from stats. */
export function effectiveDuty(p: Player): Duty {
  return p.duty ?? defaultDuty(p);
}
