import type { Role } from './types.js';

export type Formation = '4-4-2' | '4-3-3' | '3-5-2' | '4-2-3-1';

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
};
