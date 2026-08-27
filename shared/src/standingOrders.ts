// The manager's squad orders (formation/tactics/duties/captain/set-piece takers). Was duplicated in
// server/src/store.ts and client/src/api.ts — consolidated here (phase 2 offline migration) so both the
// server Store and the future local GameStore/LocalStore share one definition.
import type { Duty } from './types.js';
import type { Lineup } from './teams.js';
import type { Tactics } from './tactics.js';

export interface StandingOrders {
  formation: Lineup['formation'];
  playerIds: string[];
  tactics: Tactics;
  duties?: Duty[];
  captainIdx?: number;
  takers?: { pen?: number; fk?: number; corner?: number };
}

/** Serialize / parse the manager squad roles (captain + set-piece takers) for the so_roles column. */
export const rolesJson = (so: StandingOrders): string | null =>
  so.captainIdx != null || so.takers ? JSON.stringify({ captainIdx: so.captainIdx, takers: so.takers }) : null;
export const parseRoles = (s: string | null | undefined): { captainIdx?: number; takers?: { pen?: number; fk?: number; corner?: number } } =>
  s ? JSON.parse(s) : {};
