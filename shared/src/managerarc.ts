// ── MANAGER STORY ARCS ─────────────────────────────────────────────────────────────────────────────
//
// The player career's 414 branching arcs are the best content in the game — a real decision, wrapped in
// prose, with consequences that stick. The manager career had nothing equivalent: its whole dramatic life
// was one-line toasts. This is the equivalent, and it is what makes managing the club something you PLAY
// rather than something you watch. (user decision, 2026-08-30)
//
// Deliberate differences from the player-side arcs, because a manager's life is not a boy's life:
//   - they fire on SEASONS, not turns, and a manager career is ~10 seasons, so the library must be big
//     enough that a five-generation dynasty is not repeating itself by the third heir;
//   - their consequences are the CLUB's, not one body's: coins, the dressing room, the board's patience,
//     a named player's morale, the manager's reputation;
//   - they are gated by SITUATION as much as by time. A relegation-fight arc has no business firing while
//     you are top of the league, and a "your wonderkid's agent is circling" arc needs a wonderkid.
import type { Bank } from './prompts/merge.js';

/** The manager's own temperament, CHOSEN at the handoff. It gates arcs (`when.temper`) and is the single
 *  biggest depth multiplier in the system: the same situation reads and resolves differently depending on
 *  who you decided to be. (user decision, 2026-08-30) */
export type MgrTemper = 'disciplinarian' | 'players-manager' | 'tactician' | 'chancer' | 'builder' | 'firefighter';
export const MGR_TEMPERS: Array<{ id: MgrTemper; name: string; blurb: string }> = [
  { id: 'disciplinarian', name: 'The Disciplinarian', blurb: 'Standards, punctuality, and no exceptions for anybody. Respected long before he is liked.' },
  { id: 'players-manager', name: "A Players' Manager", blurb: 'He protects them publicly and tells them the truth privately. The room would run through a wall.' },
  { id: 'tactician', name: 'The Tactician', blurb: 'Whiteboards, clips, shape. He will out-think a better squad and bore a better one to death.' },
  { id: 'chancer', name: 'The Chancer', blurb: 'Bold calls, big gambles, no safety net. Brilliant and unemployable in roughly equal measure.' },
  { id: 'builder', name: 'The Builder', blurb: 'Academy first, patience always. He is planting trees he may not sit under.' },
  { id: 'firefighter', name: 'The Firefighter', blurb: 'Give him a mess. He is calmest when everything is on fire and least useful when it is not.' },
];

export type MgrArcCategory = 'dressing-room' | 'boardroom' | 'transfer' | 'media' | 'crisis' | 'triumph' | 'club';

/** What an arc choice does. Everything here is applied by the caller — this module stays pure. */
export interface MgrArcEffect {
  coins?: number;                 // club funds
  boardMood?: number;             // -3..+3 shift in the board's patience
  squadMorale?: number;           // applied to every squad player
  prestige?: number;              // the manager's own standing
  /** morale for ONE player, chosen by role in the story rather than by id — so an arc can say "the
   *  unhappiest man in the dressing room" without needing to know who that is when it was written. */
  playerMorale?: { who: 'star' | 'unhappiest' | 'youngest' | 'oldest' | 'best'; delta: number };
  /** a state flag other arcs can require or forbid, so consequences persist across a career */
  tag?: string;
  /** A PERMANENT mark on the club, surviving the manager and every succession — the dynasty accumulates a
   *  history you can read back. A stand renamed, a rivalry started, a number retired, the club known as a
   *  selling club. Written to the save, not to the career. (user decision, 2026-08-30) */
  clubLegacy?: { kind: 'stand' | 'rivalry' | 'number' | 'reputation' | 'tradition'; label: string };
}

export interface MgrArcChoice { id: string; label: string; desc: string; outcome: string; effect?: MgrArcEffect; next?: string }
export interface MgrArcBeat { id: string; prompt: string; choices: MgrArcChoice[] }

/** When an arc is ALLOWED to fire. Every field is optional; all present fields must hold. */
export interface MgrArcWhen {
  minSeason?: number; maxSeason?: number;
  minTier?: number; maxTier?: number;        // 1 = top flight, so minTier:1 maxTier:3 means "near the top"
  /** league position as a fraction: 0 = top of the table, 1 = bottom. A relegation arc wants pos >= 0.75. */
  minPos?: number; maxPos?: number;
  minCoins?: number; maxCoins?: number;
  /** needs a squad player matching this, so "your wonderkid" arcs only fire when you have one */
  needs?: 'wonderkid' | 'veteran' | 'unhappy-player' | 'big-squad' | 'thin-squad';
  requiresTag?: string; forbidsTag?: string;
  /** only for these manager temperaments — a disciplinarian's dressing-room crisis is not a chancer's */
  temper?: MgrTemper[];
  /** FACILITIES AS CONTENT SOURCES (user decision): an arc can require a facility at a level, so a good
   *  academy generates youth stories, a community trust opens local ones, and a data department changes
   *  what your analysts notice. Upgrading stops being a multiplier and starts unlocking material. */
  facility?: { key: string; min: number };
}

export interface ManagerArc {
  id: string; title: string; icon: string; category: MgrArcCategory;
  when?: MgrArcWhen;
  /** Accepted at the ROOT as well as inside `when`. The brief listed temperament among the gates and
   *  several authors reasonably read it as an arc-level property; rejecting that would have failed six
   *  authors' files for a distinction that does not matter. Both are honoured — see arcFits. */
  temper?: MgrTemper[];
  weight: number; rare?: boolean;
  first: string;
  beats: Record<string, MgrArcBeat>;
}

import { DRESSING_ROOM_ARCS } from './managerarcs/dressing_room.js';
import { BOARDROOM_ARCS } from './managerarcs/boardroom.js';
import { TRANSFER_ARCS } from './managerarcs/transfer.js';
import { CRISIS_ARCS } from './managerarcs/crisis.js';
import { MGR_ARCS_01 } from './managerarcs/pack_01.js';
import { MGR_ARCS_02 } from './managerarcs/pack_02.js';
import { MGR_ARCS_03 } from './managerarcs/pack_03.js';
import { MGR_ARCS_04 } from './managerarcs/pack_04.js';
import { MGR_ARCS_05 } from './managerarcs/pack_05.js';
import { MGR_ARCS_06 } from './managerarcs/pack_06.js';
import { MGR_ARCS_07 } from './managerarcs/pack_07.js';
import { MGR_ARCS_08 } from './managerarcs/pack_08.js';
import { MGR_ARCS_09 } from './managerarcs/pack_09.js';
import { MGR_ARCS_10 } from './managerarcs/pack_10.js';
import { MGR_ARCS_11 } from './managerarcs/pack_11.js';
import { MGR_ARCS_12 } from './managerarcs/pack_12.js';
import { MGR_ARCS_13 } from './managerarcs/pack_13.js';
import { MGR_ARCS_14 } from './managerarcs/pack_14.js';

// The seed set, plus every authoring pack. Target is 800+ arcs: at 4-6 a season a manager career sees ~50,
// and a five-generation dynasty ~250, so the library must be several times that to stay fresh.
export const MANAGER_ARCS: ManagerArc[] = [
  ...DRESSING_ROOM_ARCS, ...BOARDROOM_ARCS, ...TRANSFER_ARCS, ...CRISIS_ARCS,
  ...MGR_ARCS_01, ...MGR_ARCS_02, ...MGR_ARCS_03, ...MGR_ARCS_04, ...MGR_ARCS_05, ...MGR_ARCS_06, ...MGR_ARCS_07, ...MGR_ARCS_08, ...MGR_ARCS_09, ...MGR_ARCS_10, ...MGR_ARCS_11, ...MGR_ARCS_12, ...MGR_ARCS_13, ...MGR_ARCS_14,
];
const byId = new Map(MANAGER_ARCS.map((a) => [a.id, a]));
export const managerArcById = (id: string): ManagerArc | undefined => byId.get(id);

/** The club's situation when we ask for an arc. Everything is already known at the season screen. */
export interface MgrSituation {
  season: number; tier: number;
  posFrac: number;                 // 0 = top of the table, 1 = bottom
  coins: number;
  hasWonderkid: boolean; hasVeteran: boolean; hasUnhappy: boolean; squadSize: number;
  tags: ReadonlySet<string>;
  temper?: MgrTemper;
  /** current facility levels, so `when.facility` can gate on them */
  facilities?: Record<string, number>;
}

export function arcFits(a: ManagerArc, s: MgrSituation): boolean {
  // root-level `temper` behaves exactly like `when.temper`
  const rootTemper = a.temper;
  if (rootTemper && s.temper && !rootTemper.includes(s.temper)) return false;
  const w = a.when; if (!w) return true;
  if (w.minSeason != null && s.season < w.minSeason) return false;
  if (w.maxSeason != null && s.season > w.maxSeason) return false;
  if (w.minTier != null && s.tier < w.minTier) return false;
  if (w.maxTier != null && s.tier > w.maxTier) return false;
  if (w.minPos != null && s.posFrac < w.minPos) return false;
  if (w.maxPos != null && s.posFrac > w.maxPos) return false;
  if (w.minCoins != null && s.coins < w.minCoins) return false;
  if (w.maxCoins != null && s.coins > w.maxCoins) return false;
  if (w.requiresTag && !s.tags.has(w.requiresTag)) return false;
  if (w.forbidsTag && s.tags.has(w.forbidsTag)) return false;
  if (w.temper && s.temper && !w.temper.includes(s.temper)) return false;
  if (w.facility && (s.facilities?.[w.facility.key] ?? 1) < w.facility.min) return false;
  switch (w.needs) {
    case 'wonderkid': return s.hasWonderkid;
    case 'veteran': return s.hasVeteran;
    case 'unhappy-player': return s.hasUnhappy;
    case 'big-squad': return s.squadSize >= 20;
    case 'thin-squad': return s.squadSize <= 14;
    default: return true;
  }
}

function h01(seed: number, a: number, b: number): number {
  let h = (seed ^ Math.imul(a + 1, 2654435761) ^ Math.imul(b + 1, 40503)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Pick an arc for this season, or null. Category-balanced like the player-side picker, so one category
 *  cannot crowd the rest out, and never repeats an arc a career has already seen. Pure + seeded. */
export function pickManagerArc(seed: number, s: MgrSituation, fired: ReadonlySet<string>): string | null {
  const eligible = MANAGER_ARCS.filter((a) => !fired.has(a.id) && arcFits(a, s));
  if (!eligible.length) return null;
  const byCat = new Map<string, ManagerArc[]>();
  for (const a of eligible) { const l = byCat.get(a.category) ?? []; l.push(a); byCat.set(a.category, l); }
  const cats = [...byCat.keys()].sort();
  const w = cats.map((c) => Math.sqrt(byCat.get(c)!.length));
  const tot = w.reduce((x, y) => x + y, 0);
  let r = h01(seed, s.season * 613, 17) * tot;
  let cat = cats[cats.length - 1];
  for (let i = 0; i < cats.length; i++) { r -= w[i]; if (r <= 0) { cat = cats[i]; break; } }
  const pool = byCat.get(cat)!;
  const weights = pool.map((a) => a.weight * (a.rare ? 0.4 : 1));
  const total = weights.reduce((x, y) => x + y, 0);
  let q = h01(seed, s.season * 977, 29) * total;
  for (let i = 0; i < pool.length; i++) { q -= weights[i]; if (q <= 0) return pool[i].id; }
  return pool[0].id;
}
