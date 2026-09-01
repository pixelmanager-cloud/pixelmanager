export type Role = 'GK' | 'DF' | 'MF' | 'FW';

/**
 * A per-player "duty" layered on top of the position — turns 11 stat-blocks into
 * 11 characters. Deterministic and applied pre-kickoff (see duties.ts): it only
 * biases how the player behaves in-sim, never adds power. Auto-derived from the
 * player's strengths by default; a manager may override it later.
 */
export type Duty =
  | 'keeper'
  | 'cover' | 'stopper' | 'ball-playing-defender' | 'inverted-fullback' | 'wing-back' | 'sweeper'
  | 'box-to-box' | 'playmaker' | 'ball-winner' | 'deep-lying-playmaker' | 'anchor' | 'wide-playmaker'
  | 'poacher' | 'target-man' | 'pressing-forward' | 'false-9' | 'inverted-winger';

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
  /** injury resistance (OPTIONAL, from the Career Sim): high = robust, low = injury-prone. Feeds the
   *  manager injury system; when absent it falls back to stamina, so existing players are unchanged. */
  durability?: number;
  // ── MENTAL layer (from the Career Sim; OPTIONAL). The engine reads these CENTRED at 10, so a
  // player without them behaves exactly as before — only career-built players with real mental
  // stats deviate. composure→finishing under pressure, aggression→tackling(+)/turnover(−),
  // creativity→chance creation, teamwork→pass completion, leadership→small team-wide steadiness.
  composure?: number;
  aggression?: number;
  creativity?: number;
  teamwork?: number;
  leadership?: number;
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
  /** earned career traits (Clinical Finisher, Ball-Winner…) — small match effects; optional */
  traits?: string[];
  /** innate temperament id (career-built players); read for cup-final composure later; optional */
  personality?: string;
  /** manager designations (pre-kickoff, deterministic): the armband + set-piece takers. Absent =
   *  the engine auto-picks (captain → best leader; takers → best setPiece+composure). */
  captain?: boolean;
  takesPen?: boolean;
  takesFk?: boolean;
  takesCorner?: boolean;
  /** financial temperament 1-20 (career-built players): what it costs to EXTEND this player's contract
   *  in the manager game — high = mercenary/expensive, low = loyal/cheap. See contractCost(). Optional. */
  greed?: number;
  /** brand/fame 1-20 (career-built players): boosts the club's Commercial income in the manager game,
   *  so a marketable star helps pay his own wages. Optional. */
  marketability?: number;
  /** coins banked across the player's career (career-built players): the breeder's payout when the NFT
   *  first sells, and an "established wage" that raises his contract-extension cost. Optional. */
  earnings?: number;
  /** current age (Living Squad: bought/starter/trialist players carry an age that advances each season so
   *  they develop when young and decline when old — see mintSquadPlayer + the nextSeason squad loop). The
   *  bloodline STAR keeps its age in MgrState, not here. Optional. */
  age?: number;
  /** the season this squad player's current contract was signed / last renewed (Living Squad) — with the
   *  club's season it yields seasons-left; a lapsed contract benches him until renewed. Optional. */
  signedSeason?: number;
  /** the length in seasons of this squad player's current contract (Living Squad). Optional. */
  contractSeasons?: number;
  /** live morale 0-100 (Living Squad): moves with selection/results/contract, bends re-sign cost. Optional. */
  morale?: number;
}

export interface Team {
  id: string;
  name: string;
  // `shortName` REMOVED. It was required on every club in the game and never once read — one declaration,
  // two parameters, three copies, and forty-two call sites each forced to invent a value that nothing
  // consumed. The only apparent "read" was `shortName: club.shortName` copying it forward into a Team.
  // Same class as the phantom `standing` stat in facilities.ts: a field the game demanded and never used.
  shirtColor: number;
  players: Player[]; // exactly 11, players[0] is GK
  /** Training-ground conditioning: a fitness-drain multiplier (1 = normal, <1 = fades less).
   *  Optional so default matches (tests, CPU) behave exactly as before. */
  conditioning?: number;
  /** Fan Zone home advantage: an attacking-chance multiplier for the HOME side only
   *  (1 = none, >1 = boosted). Set on teams[0] by runMatch; optional so tests are unchanged. */
  homeBoost?: number;
  /** Substitutes available from the bench (best squad players outside the XI). When present the
   *  engine makes deterministic fitness-driven subs late on; absent (tests/CPU) => no subs. */
  bench?: Player[];
  /** HOW BIG THE OCCASION IS: 0 for an ordinary league fixture, rising toward 1 for a cup final. Read
   *  only by the Big-Game Player trait in `resolveShot`. Optional, and absent everywhere by default, so
   *  every existing fixture and every test behaves exactly as before. */
  stakes?: number;
}

export interface PlayerState {
  x: number;
  y: number;
  /** current fitness 0..1; starts at 1 and drains with effort. Scales effective stats. */
  fitness: number;
}

export type MatchEventType = 'kickoff' | 'goal' | 'shot_saved' | 'shot_missed' | 'chance' | 'halftime' | 'fulltime'
  // richer per-player events for commentary (ADD-ONLY: they describe what already happens, never change outcomes)
  | 'pass' | 'tackle_won' | 'loose_ball'
  // cosmetic depth (read existing sim state, consume no rng, never change outcomes)
  | 'fatigue' | 'woodwork'
  // real set-piece / discipline / squad mechanics (these DO resolve with rng and affect outcomes)
  | 'foul' | 'yellow_card' | 'red_card' | 'corner' | 'free_kick' | 'penalty' | 'penalty_missed'
  | 'sub' | 'injury';

export interface MatchEvent {
  minute: number;
  type: MatchEventType;
  teamIdx: 0 | 1;
  playerName?: string;
  /** second player involved (e.g. the receiver of a pass) */
  playerName2?: string;
  /** STABLE IDENTITY, because the NAME is not one. `deriveMatchStats` keyed every stat by player name, and
   *  `generateClub` draws from 18 first names x 18 surnames = 324 combinations for a twenty-man roster —
   *  so 40% of matchday squads contain two men called the same thing. Measured over 400 matches: 378
   *  players who took the field got no row in the report at all, 150 rows credited an unused substitute
   *  with an appearance he never made, and 18 of those handed him goals or Player of the Match. One had a
   *  bench player credited with FOUR GOALS while the man who actually scored them was absent from the
   *  report. Names are for reading; ids are for counting. */
  playerId?: string;
  playerId2?: string;
  /** rough pitch zone the action happened in, from the acting team's perspective */
  zone?: 'def' | 'mid' | 'att';
  /** the acting move sprang from a fast counter-attack (commentary colour only) */
  counter?: boolean;
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
