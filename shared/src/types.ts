export type Role = 'GK' | 'DF' | 'MF' | 'FW';

export interface PlayerAttrs {
  pace: number;    // 1-99
  pass: number;
  shoot: number;
  defend: number;
  keeping: number;
}

export interface Player {
  id: string;
  name: string;
  role: Role;
  attrs: PlayerAttrs;
  /** formation anchor in pitch coords, for the team attacking left->right */
  anchor: { x: number; y: number };
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  shirtColor: number;  // rgb hex
  players: Player[];   // exactly 11, players[0] is GK
}

export interface PlayerState {
  x: number;
  y: number;
}

export type MatchEventType = 'kickoff' | 'goal' | 'shot_saved' | 'shot_missed' | 'halftime' | 'fulltime';

export interface MatchEvent {
  minute: number;
  type: MatchEventType;
  teamIdx: 0 | 1;
  playerName?: string;
}

export interface MatchState {
  clockSec: number;          // 0..5400 game seconds
  score: [number, number];
  ball: { x: number; y: number };
  /** index of team in possession and player carrying the ball, or null when ball is loose/resetting */
  carrier: { teamIdx: 0 | 1; playerIdx: number } | null;
  players: [PlayerState[], PlayerState[]];
  events: MatchEvent[];
  finished: boolean;
}

// Pitch coordinate system used by the engine: 105 x 68 (metres), origin top-left.
export const PITCH = { w: 105, h: 68 } as const;
