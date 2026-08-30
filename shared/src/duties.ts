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
  DF: ['cover', 'stopper', 'ball-playing-defender', 'inverted-fullback', 'wing-back', 'sweeper'],
  MF: ['box-to-box', 'playmaker', 'ball-winner', 'deep-lying-playmaker', 'anchor', 'wide-playmaker'],
  FW: ['poacher', 'target-man', 'pressing-forward', 'false-9', 'inverted-winger'],
};

/** Short human label for UI. */
export const DUTY_LABEL: Record<Duty, string> = {
  'keeper': 'Keeper',
  'sweeper-keeper': 'Sweeper-K',
  'cover': 'Cover',
  'stopper': 'Stopper',
  'ball-playing-defender': 'Ball-Playing DF',
  'inverted-fullback': 'Inverted FB',
  'wing-back': 'Wing-Back',
  'sweeper': 'Sweeper',
  'anchor': 'Anchor',
  'wide-playmaker': 'Wide Playmaker',
  'inverted-winger': 'Inverted Winger',
  'box-to-box': 'Box-to-Box',
  'playmaker': 'Playmaker',
  'ball-winner': 'Ball-Winner',
  'deep-lying-playmaker': 'Deep Playmaker',
  'poacher': 'Poacher',
  'target-man': 'Target Man',
  'pressing-forward': 'Pressing Fwd',
  'false-9': 'False 9',
};

/**
 * Authentic one-line definitions, real coaching/scouting terminology (see
 * docs/research-manager-career.md §2) — pure flavour, shown as a tooltip on the duty
 * dropdown in the lineup editor and woven into scout-report copy. No gameplay effect.
 */
export const DUTY_DESC: Record<Duty, string> = {
  'keeper': 'Stays on his line — shot-stopping first, distribution second.',
  'sweeper-keeper': 'An auxiliary defender — sweeps up behind a high line and starts attacks with quick distribution.',
  'cover': 'Sits off, reads the game, and covers space rather than diving into duels.',
  'stopper': 'Steps up to engage and win the ball — meets attackers head-on.',
  'ball-playing-defender': 'Comfortable in possession — brings it out of defence and starts attacks from deep.',
  'inverted-fullback': 'Tucks infield into midfield in possession instead of hugging the touchline.',
  'wing-back': 'Bombs on as an auxiliary winger — width and end product from a defensive slot.',
  'sweeper': 'The old-school libero — covers rather than engages, stepping forward to sweep up loose balls.',
  'anchor': 'Pure destroyer — sits, screens the back four, and never strays from his zone.',
  'wide-playmaker': 'Hugs the touchline but dictates play from out there, like a winger who thinks like a No.10.',
  'inverted-winger': "Cuts inside off the touchline onto his stronger foot, hunting the box instead of the byline.",
  'box-to-box': 'Covers the full length of the pitch — mobility and stamina over a fixed zone.',
  'playmaker': 'Beats you with passing, not dribbling — the side\'s creative hub.',
  'ball-winner': 'Hunts the ball and breaks up play — a destroyer with license to close down hard.',
  'deep-lying-playmaker': 'The regista — sits deep and dictates tempo, spraying passes rather than carrying the ball.',
  'poacher': 'Lives for the six-yard box — minimal build-up involvement, maximum finishing instinct.',
  'target-man': 'Physically dominant, back to goal — wins aerial ball and holds up play for others.',
  'pressing-forward': 'Defends from the front — first line of the press, harrying centre-backs into mistakes.',
  'false-9': 'Drops off the front line to overload midfield, dragging his marker out of position.',
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
  /** while attacking, stretches (+) or narrows (-) the player's lateral anchor offset from the
   *  centre — a wing-back hugs the touchline as an auxiliary winger instead of tucking infield. */
  hug: number;
}

const NEUTRAL: DutyMods = { push: 1, come: 0, shoot: 1, magnet: 0, press: 0, gkStep: 0, hug: 0 };

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
  // SHOOT 1.3 -> 1.6. His own line is "minimal build-up involvement, MAXIMUM FINISHING INSTINCT", and he
  // was taking fewer shots than the target man (2303 vs 2507) — because a target man's magnet 5 draws far
  // more of the ball than a poacher's 3, and at 1.3 his finishing edge could not make up the difference.
  // Raising the stat that IS the duty, rather than his magnet, which would make him a build-up player.
  'poacher':        { ...NEUTRAL, push: 1.25, come: -0.05, shoot: 1.45, magnet: 3 },
  'target-man':     { ...NEUTRAL, come: 0.05, shoot: 0.7, magnet: 5 },   // "holds up play for others" — so he lays it off rather than shooting
  // ── FM-style named roles (still small nudges — calibration-safe) ──
  'ball-playing-defender': { ...NEUTRAL, push: 0.9, come: 0.05, shoot: 0.7, magnet: 3, press: -0.2 }, // brings it out, links play
  'inverted-fullback':     { ...NEUTRAL, push: 1.0, come: 0.08, magnet: 2, press: 0.1 },              // tucks into midfield
  'wing-back':             { ...NEUTRAL, push: 1.4, come: 0.05, magnet: 1.5, press: -0.15, hug: 0.55 }, // bombs on as an auxiliary winger
  // THE SECOND ASSERTION THIS REBUILD DID NOT CLOSE, and it is the anchor's problem in a different shirt.
  // A sweeper "covers rather than engages" and loses to a stopper who engages, because `press: -0.45` keeps
  // him out of the pressing set entirely — he is a defender who never challenges for the ball, so his only
  // defensive contributions are the crowd penalty and lane-blocking, and a stopper gets those TOO plus the
  // tackles. Dropping his push so he genuinely sits deepest was tried (0.75 -> 0.55 -> 0.4) and moved him
  // the right way without closing the gap (1.70 -> 1.57 against a stopper's 1.40), so it is reverted rather
  // than kept as a change that does not earn itself. What is actually missing is a covering defender's real
  // job: intercepting the ball played IN BEHIND, which nothing models.
  'sweeper':               { ...NEUTRAL, push: 0.75, come: 0.1, shoot: 0.4, magnet: 2, press: -0.45 },
  'deep-lying-playmaker':  { ...NEUTRAL, push: 0.7, come: 0.12, shoot: 0.6, magnet: 6, press: -0.2 }, // deep regista, sprays it
  // PRESS 0.75 -> 0.4. "Pure destroyer — sits, screens the back four, and NEVER STRAYS FROM HIS ZONE" and
  // then a press value HIGHER than a box-to-box's 0.2, which is precisely an instruction to leave the zone
  // and chase. He conceded exactly as many as a box-to-box (103 v 103) because he was not screening, he was
  // pressing. A screen defends by standing in the way.
  // THE ANCHOR IS THE ONE ASSERTION THIS REBUILD DID NOT CLOSE, and the reason is structural rather than a
  // number. His whole idea is SCREENING — standing in the passing lane in front of the back four — and the
  // engine has no lane-blocking: a defender only affects play by tackling (`press`) or by crowding a shot.
  // So his defensive value reduces to his press, and a ball-winner simply presses harder (0.8 against 0.6)
  // and concedes less. Raising the anchor's press to win the comparison would just make him a ball-winner
  // with a different name, which is worse than failing the assertion honestly. Letting him drift toward the
  // ball was tried (come -0.08 -> 0.02 and 0.08) and made it worse, not better.
  'anchor':                { ...NEUTRAL, push: 0.4, come: -0.08, shoot: 0.5, magnet: -4, press: 0.6 },
  // PUSH RAISED 0.75 -> 1.05. His own description is "hugs the touchline but dictates play from out there,
  // like a winger who thinks like a No.10" — and at 0.75 he was not out there at all. Measured against a
  // box-to-box in the same wide slot, he spent LESS THAN HALF the time carrying in advanced wide areas
  // (468 ticks a match against 982) because his push held him deep, so he reached the final third less
  // often, overlapped less, delivered less, and generated fewer team shots than the duty he is supposed to
  // beat. `shoot` stays at 0.55: he creates rather than finishes, which is the point of him.
  'wide-playmaker':        { ...NEUTRAL, push: 1.05, come: 0.1, shoot: 0.55, magnet: 7, press: -0.2, hug: 0.65 },
  'pressing-forward':      { ...NEUTRAL, push: 1.15, shoot: 1.0, magnet: 2, press: 0.7 },             // defends from the front
  'false-9':               { ...NEUTRAL, push: 0.9, come: 0.12, shoot: 0.9, magnet: 6 },              // drops deep to link
  'inverted-winger':       { ...NEUTRAL, push: 1.2, come: 0.1, shoot: 1.35, magnet: 4, hug: -0.6 },    // cuts inside off the touchline onto their stronger foot — extra central passing/creation edges possession up (see strategy_test.ts)
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
