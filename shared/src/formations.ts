import type { Role } from './types.js';

export type Formation = '4-4-2' | '4-3-3' | '3-5-2' | '4-2-3-1' | '3-4-3' | '4-1-2-1-2' | '5-3-2' | '4-5-1' | '4-1-4-1' | '5-4-1' | '4-2-2-2';

export interface Slot {
  role: Role;
  x: number; // base anchor for a team attacking left -> right (pitch 105x68)
  y: number;
}

/**
 * Base formation anchors. Depth (x) encodes the line a player sits in;
 * the tactics layer shifts these by line height, mentality and width at runtime.
 * Index 0 is always the GK.
 */
export const FORMATIONS: Record<Formation, Slot[]> = {
  '4-4-2': [
    { role: 'GK', x: 5, y: 34 },
    { role: 'DF', x: 20, y: 10 }, { role: 'DF', x: 18, y: 26 }, { role: 'DF', x: 18, y: 42 }, { role: 'DF', x: 20, y: 58 },
    { role: 'MF', x: 46, y: 10 }, { role: 'MF', x: 42, y: 27 }, { role: 'MF', x: 42, y: 41 }, { role: 'MF', x: 46, y: 58 },
    { role: 'FW', x: 70, y: 27 }, { role: 'FW', x: 70, y: 41 },
  ],
  '4-3-3': [
    { role: 'GK', x: 5, y: 34 },
    { role: 'DF', x: 20, y: 10 }, { role: 'DF', x: 18, y: 26 }, { role: 'DF', x: 18, y: 42 }, { role: 'DF', x: 20, y: 58 },
    { role: 'MF', x: 44, y: 22 }, { role: 'MF', x: 40, y: 34 }, { role: 'MF', x: 44, y: 46 },
    { role: 'FW', x: 72, y: 13 }, { role: 'FW', x: 74, y: 34 }, { role: 'FW', x: 72, y: 55 },
  ],
  '3-5-2': [
    { role: 'GK', x: 5, y: 34 },
    { role: 'DF', x: 18, y: 20 }, { role: 'DF', x: 16, y: 34 }, { role: 'DF', x: 18, y: 48 },
    { role: 'MF', x: 42, y: 8 }, { role: 'MF', x: 44, y: 24 }, { role: 'MF', x: 41, y: 34 }, { role: 'MF', x: 44, y: 44 }, { role: 'MF', x: 42, y: 60 },
    { role: 'FW', x: 70, y: 27 }, { role: 'FW', x: 70, y: 41 },
  ],
  '4-2-3-1': [
    { role: 'GK', x: 5, y: 34 },
    { role: 'DF', x: 20, y: 10 }, { role: 'DF', x: 18, y: 26 }, { role: 'DF', x: 18, y: 42 }, { role: 'DF', x: 20, y: 58 },
    { role: 'MF', x: 38, y: 27 }, { role: 'MF', x: 38, y: 41 },
    { role: 'MF', x: 58, y: 14 }, { role: 'MF', x: 60, y: 34 }, { role: 'MF', x: 58, y: 54 },
    { role: 'FW', x: 74, y: 34 },
  ],
  // wide & attacking — wingers hug the touchline (exploits a narrow opponent)
  '3-4-3': [
    { role: 'GK', x: 5, y: 34 },
    { role: 'DF', x: 18, y: 17 }, { role: 'DF', x: 16, y: 34 }, { role: 'DF', x: 18, y: 51 },
    { role: 'MF', x: 44, y: 6 }, { role: 'MF', x: 40, y: 26 }, { role: 'MF', x: 40, y: 42 }, { role: 'MF', x: 44, y: 62 },
    { role: 'FW', x: 72, y: 11 }, { role: 'FW', x: 74, y: 34 }, { role: 'FW', x: 72, y: 57 },
  ],
  // narrow diamond — everything through the middle (packs central zones, concedes the flanks)
  '4-1-2-1-2': [
    { role: 'GK', x: 5, y: 34 },
    { role: 'DF', x: 20, y: 12 }, { role: 'DF', x: 18, y: 28 }, { role: 'DF', x: 18, y: 40 }, { role: 'DF', x: 20, y: 56 },
    { role: 'MF', x: 34, y: 34 }, { role: 'MF', x: 45, y: 25 }, { role: 'MF', x: 45, y: 43 }, { role: 'MF', x: 57, y: 34 },
    { role: 'FW', x: 72, y: 29 }, { role: 'FW', x: 72, y: 39 },
  ],
  // defensive with wing-backs — 3 CBs + 2 wide, packed but stretched at the back
  '5-3-2': [
    { role: 'GK', x: 5, y: 34 },
    { role: 'DF', x: 24, y: 8 }, { role: 'DF', x: 16, y: 22 }, { role: 'DF', x: 14, y: 34 }, { role: 'DF', x: 16, y: 46 }, { role: 'DF', x: 24, y: 60 },
    { role: 'MF', x: 42, y: 22 }, { role: 'MF', x: 40, y: 34 }, { role: 'MF', x: 42, y: 46 },
    { role: 'FW', x: 68, y: 28 }, { role: 'FW', x: 68, y: 40 },
  ],
  // packed midfield, one up top — hard to play through centrally
  '4-5-1': [
    { role: 'GK', x: 5, y: 34 },
    { role: 'DF', x: 20, y: 10 }, { role: 'DF', x: 18, y: 26 }, { role: 'DF', x: 18, y: 42 }, { role: 'DF', x: 20, y: 58 },
    { role: 'MF', x: 44, y: 8 }, { role: 'MF', x: 40, y: 24 }, { role: 'MF', x: 38, y: 34 }, { role: 'MF', x: 40, y: 44 }, { role: 'MF', x: 44, y: 60 },
    { role: 'FW', x: 72, y: 34 },
  ],
  // holding-mid shield + a lone striker: a real trade-off, not a strict downgrade — one fewer forward
  // than a 2-up-top shape costs it head-to-head against orthodox two-striker formations, but the extra
  // central body (3 of 5 MF anchors sit centrally, vs 2 of 4 in 4-4-2/4-5-1) wins the central battle
  // against an equally narrow rival: it beats the 4-1-2-1-2 diamond head-to-head (proven in
  // strategy_test.ts). A genuine "control the middle, sacrifice a striker" pick.
  '4-1-4-1': [
    { role: 'GK', x: 5, y: 34 },
    { role: 'DF', x: 20, y: 10 }, { role: 'DF', x: 18, y: 26 }, { role: 'DF', x: 18, y: 42 }, { role: 'DF', x: 20, y: 58 },
    { role: 'MF', x: 32, y: 34 },
    { role: 'MF', x: 46, y: 10 }, { role: 'MF', x: 50, y: 27 }, { role: 'MF', x: 50, y: 41 }, { role: 'MF', x: 46, y: 58 },
    { role: 'FW', x: 72, y: 34 },
  ],
  // back five + one striker — the most defensively bodied shape in the pool: a real extra defender (not
  // just a repositioned midfielder, unlike 4-1-4-1/4-5-1), so it genuinely concedes fewer goals to a
  // direct attack than 4-4-2 or 4-5-1 (proven in strategy_test.ts) — at the cost of a lone striker up top.
  '5-4-1': [
    { role: 'GK', x: 5, y: 34 },
    { role: 'DF', x: 22, y: 7 }, { role: 'DF', x: 16, y: 21 }, { role: 'DF', x: 14, y: 34 }, { role: 'DF', x: 16, y: 47 }, { role: 'DF', x: 22, y: 61 },
    { role: 'MF', x: 44, y: 12 }, { role: 'MF', x: 40, y: 27 }, { role: 'MF', x: 40, y: 41 }, { role: 'MF', x: 44, y: 56 },
    { role: 'FW', x: 72, y: 34 },
  ],
  // a back four behind a narrow double-pivot + double-ten box midfield and two strikers. Very narrow
  // (the tightest MF spread of any formation in the pool), so it loses width battles against most
  // shapes — but it has a genuine edge over 4-1-4-1's own narrow, lone-striker shape by fielding two
  // strikers instead of one (proven in strategy_test.ts). A situational, not an all-purpose, pick.
  '4-2-2-2': [
    { role: 'GK', x: 5, y: 34 },
    { role: 'DF', x: 20, y: 10 }, { role: 'DF', x: 18, y: 26 }, { role: 'DF', x: 18, y: 42 }, { role: 'DF', x: 20, y: 58 },
    { role: 'MF', x: 36, y: 26 }, { role: 'MF', x: 36, y: 42 },
    { role: 'MF', x: 54, y: 20 }, { role: 'MF', x: 54, y: 48 },
    { role: 'FW', x: 74, y: 27 }, { role: 'FW', x: 74, y: 41 },
  ],
};
