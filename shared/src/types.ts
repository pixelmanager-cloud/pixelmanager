export type Role = 'GK' | 'DF' | 'MF' | 'FW';

/**
 * A per-player "duty" layered on top of the position — turns 11 stat-blocks into
 * 11 characters. Deterministic and applied pre-kickoff (see duties.ts): it only
 * biases how the player behaves in-sim, never adds power. Auto-derived from the
 * player's strengths by default; a manager may override it later.
 */
export type Duty =
  | 'keeper' | 'sweeper-keeper'
  | 'cover' | 'stopper'
  | 'box-to-box' | 'playmaker' | 'ball-winner'
  | 'poacher' | 'target-man';

/**
 * Lean 8-stat model, all on a 1-20 scale (football-standard).
 * Each stat maps to a concrete in-match mechanic the engine reads:
 *  pace        — movement speed; springing/chasing behind a high line, recovery runs
 *  strength    — physical & aerial duels, holding up long balls (target-man play)
 *  passing     — pass completion, effectiveness of a patient/short tempo
 *  shooting    — shot quality and finishing
 *  tackling    — winning the ball; effectiveness of pressing
 *  positioning — off-ball placement, interceptions, defensive shape
 *  workrate    — how much ground a player covers pressing/tracking (and how fast they tire)
 *  keeping     — shot-stopping (only meaningful for the GK)
 */
export interface PlayerAttrs {
  pace: number;
  strength: number;
  passing: number;
  shooting: number;
  tackling: number;
  positioning: number;
  workrate: number;
  keeping: number;
  setPiece: number; // corners / free kicks / penalties delivery + finishing
  stamina: number;  // endurance — how slowly the live in-match fitness drains
}

export interface Player {
  id: string;
  name: string;
  role: Role;
  attrs: PlayerAttrs;
  /** formation anchor in pitch coords for a team attacking left->right */
  anchor: { x: number; y: number };
  /** optional manager-assigned duty; when absent the engine auto-derives one from stats */
  duty?: Duty;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  shirtColor: number;
  players: Player[]; // exactly 11, players[0] is GK
}

export interface PlayerState {
  x: number;
  y: number;
  /** current fitness 0..1; starts at 1 and drains with effort. Scales effective stats. */
  fitness: number;
}

export type MatchEventType = 'kickoff' | 'goal' | 'shot_saved' | 'shot_missed' | 'chance' | 'corner' | 'free_kick' | 'penalty' | 'halftime' | 'fulltime';

export interface MatchEvent {
  minute: number;
  type: MatchEventType;
  teamIdx: 0 | 1;
  playerName?: string;
}

export interface MatchState {
  clockSec: number; // 0..5400 game seconds
  score: [number, number];
  ball: { x: number; y: number };
  carrier: { teamIdx: 0 | 1; playerIdx: number } | null;
  players: [PlayerState[], PlayerState[]];
  /** rolling possession tick counts per team, for a possession % readout */
  possession: [number, number];
  events: MatchEvent[];
  finished: boolean;
}

// Pitch coordinate system: 105 x 68 metres, origin top-left.
export const PITCH = { w: 105, h: 68 } as const;
