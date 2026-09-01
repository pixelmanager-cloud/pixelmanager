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
  // ONE DUTY. 'sweeper-keeper' was retired: it was read into a mechanism with no way to matter. `gkStep`
  // only WIDENED a clamp rail the keeper's own target equation can never reach — measured over 857,896 GK
  // movement ticks, the clamp fired ZERO times, so keeper and sweeper-keeper produced byte-identical
  // matches (same score, same events, same final position for all 22 players) at a neutral line AND at
  // the high line the duty's own description named. Wiring it would have meant inventing a keeper
  // positioning model the engine does not have, and the three obvious one-line wirings DISAGREED IN SIGN
  // at that high line; the best of them was a free +3.5 pts/season with no possible downside, because a
  // keeper's position is not an input to any save. A dead dial is a disappointment; a strictly dominant
  // one is a balance defect that also makes 'keeper' a trap. The sweeper-keeper idea survives where it is
  // real — career.ts's 'sweeper-elite' card and 'sweeper' story moment, neither of which touches tactics.
  GK: ['keeper'],
  DF: ['cover', 'stopper', 'ball-playing-defender', 'inverted-fullback', 'wing-back', 'sweeper'],
  MF: ['box-to-box', 'playmaker', 'ball-winner', 'deep-lying-playmaker', 'anchor', 'wide-playmaker'],
  FW: ['poacher', 'target-man', 'pressing-forward', 'false-9', 'inverted-winger'],
};

/** Short human label for UI. */
export const DUTY_LABEL: Record<Duty, string> = {
  'keeper': 'Keeper',
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
  /** while attacking, stretches (+) or narrows (-) the player's lateral anchor offset from the
   *  centre — a wing-back hugs the touchline as an auxiliary winger instead of tucking infield. */
  hug: number;
}

const NEUTRAL: DutyMods = { push: 1, come: 0, shoot: 1, magnet: 0, press: 0, hug: 0 };

// ── SWEEPER_COME: THE ONE DUTY NUMBER THE REBUILT DISTRIBUTION ACTUALLY INVALIDATED ─────────────────
// 0.1 restores the shipped table exactly — this is the A/B switch, and both states are measured below.
//
// `come` is documented four lines above as "+ drops the player toward the ball to link play, - holds
// their line", and it is the ONLY field in this table that survives contact with the rebuilt engine as a
// defensive dial. Measured on the 6c fixture (whole back line on one duty, conceded vs a direct 4-3-3),
// n=500 paired, against a noise floor of +-0.14 established by a null in which perturbing a `push` value
// by one part in a thousand — five millimetres of player position — moved conceded goals by 0.128:
//     come  -0.20 vs +0.10 (shipped sweeper)   -0.302 goals/match  95% CI [-0.439, -0.165]
//     press +0.60 vs -0.45 (stopper v sweeper) -0.148              95% CI [-0.286, -0.010]
//     push   0.60 vs  1.20                     +0.040              95% CI [-0.104,  0.184]   inert
//     hug   -0.40 vs  0.00                     -0.008              95% CI [-0.149,  0.133]   inert
//     shoot  0.40 vs  1.00                     +0.003              95% CI [-0.014,  0.019]   inert
// `push` is arithmetically dead for a defender and always was: attackPush is 6 and PUSH_BY_ROLE.DF is
// 0.35, so this table's whole 0.75-1.4 push range moves a centre-back under two metres.
//
// THE MECHANISM. `come` is added to `pullX` only while the player's own team is ATTACKING, so it decides
// how far the back line follows the ball upfield when you have it. At +0.1 a defender's attacking
// ball-pull is 0.32; at -0.20 it is 0.02, i.e. he stays pinned to his anchor. The engine that was
// replaced could not care: every shot resolved instantly from wherever a through-ball receiver stood, a
// median of 45.8 metres out, so where your defenders were standing when you lost it was irrelevant.
// Now that a possession is a real carry, a back line caught upfield on the turnover gets run at, and
// this is the single largest defensive effect any duty field can produce.
//
// WHY THIS IS A RE-DERIVATION AND NOT A NUDGE-UNTIL-GREEN. The sweeper's tooltip is "covers rather than
// engages, stepping forward to sweep up loose balls" — the shipped +0.1 encodes the second clause onto
// the ball-pull axis, which is the axis whose own documentation calls the negative direction "holds
// their line". A libero is the one defender in this table whose entire identity is depth held behind the
// line; every other DF duty belongs to a flat four that shuffles across to the ball, so they stay at
// 0.00-0.10 and the sweeper alone uses the negative half of the axis. He keeps `press: -0.45`, so he
// still pays for not engaging (worth +0.148 goals/match against a stopper) — the duty is a real
// trade-off, not a free win.
const SWEEPER_COME = -0.20;

// Magnitudes are deliberately small — duties are nudges, not overrides, so the
// engine's goals/possession calibration holds (see shared/strategy_test.ts).
const TABLE: Record<Duty, DutyMods> = {
  'keeper':         { ...NEUTRAL },
  'cover':          { ...NEUTRAL, push: 0.8, press: -0.3 },
  'stopper':        { ...NEUTRAL, push: 1.2, press: 0.6 },
  'box-to-box':     { ...NEUTRAL, push: 1.1, come: 0.03, press: 0.2 },
  'playmaker':      { ...NEUTRAL, push: 0.85, come: 0.1, shoot: 0.8, magnet: 5, press: -0.15 },
  'ball-winner':    { ...NEUTRAL, push: 0.8, shoot: 0.7, magnet: -2, press: 0.8 },
  'poacher':        { ...NEUTRAL, push: 1.25, come: -0.05, shoot: 1.3, magnet: 3 },
  'target-man':     { ...NEUTRAL, come: 0.05, shoot: 0.95, magnet: 5 },
  // ── FM-style named roles (still small nudges — calibration-safe) ──
  'ball-playing-defender': { ...NEUTRAL, push: 0.9, come: 0.05, shoot: 0.7, magnet: 3, press: -0.2 }, // brings it out, links play
  // hug: -0.55 — THE MIRROR OF THE WING-BACK'S +0.55, and it was missing entirely. `hug` is the only field
  // that moves a player laterally (DutyMods: "stretches (+) or narrows (-) the lateral anchor offset");
  // `come` is added to pullX, the along-the-pitch axis. All three of this duty's lateral siblings set it —
  // wing-back +0.55, wide-playmaker +0.65, inverted-winger -0.60 — and this one shipped at NEUTRAL's 0, so
  // the duty called "Inverted FB", whose own comment says "tucks into midfield" and whose tooltip promises
  // "tucks infield into midfield in possession instead of hugging the touchline", did not tuck at all.
  // Measured lateral offset of the two wide defenders while attacking, anchored 24.0m off centre:
  // cover 15.328m, inverted-fullback 15.143m (a 0.185m difference, from push/come/press, not from any
  // lateral term), wing-back 19.420m. The duty was not INERT — push/come/magnet/press all moved it — it
  // simply did not do the one thing its name is.
  'inverted-fullback':     { ...NEUTRAL, push: 1.0, come: 0.08, magnet: 2, press: 0.1, hug: -0.55 },  // tucks into midfield
  'wing-back':             { ...NEUTRAL, push: 1.4, come: 0.05, magnet: 1.5, press: -0.15, hug: 0.55 }, // bombs on as an auxiliary winger
  'sweeper':               { ...NEUTRAL, push: 0.75, come: SWEEPER_COME, shoot: 0.4, magnet: 2, press: -0.45 }, // covers rather than engages — holds his depth (see SWEEPER_COME)
  'deep-lying-playmaker':  { ...NEUTRAL, push: 0.7, come: 0.12, shoot: 0.6, magnet: 6, press: -0.2 }, // deep regista, sprays it
  'anchor':                { ...NEUTRAL, push: 0.4, come: -0.08, shoot: 0.5, magnet: -4, press: 0.75 }, // pure destroyer — sits, screens, never strays
  'wide-playmaker':        { ...NEUTRAL, push: 0.75, come: 0.1, shoot: 0.55, magnet: 7, press: -0.2, hug: 0.65 }, // hugs the touchline but dictates from out there — more shots for the team than box-to-box/ball-winner in the same slot (see strategy_test.ts)
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
    case 'GK': return 'keeper';        // the only GK duty; see DUTIES_BY_ROLE above
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
