import { mergeBanks } from './prompts/merge.js';
import { PRESTIGE_EXTRA_1 } from './extra/prestige_pack_1.js';
import { PRESTIGE_EXTRA_2 } from './extra/prestige_pack_2.js';
import { PRESTIGE_EXTRA_3 } from './extra/prestige_pack_3.js';
import { PRESTIGE_EXTRA_4 } from './extra/prestige_pack_4.js';
// Manager PRESTIGE — the human manager's legacy, earned across their whole career (every club, every
// season). Distinct from a player's ability: this is the GAFFER's reputation, built from titles won,
// how high up the pyramid they were won, wins ground out, and longevity. Pure + deterministic so the
// server, the client badge, and a future soulbound "Legacy" NFT all read one identical number.
//
// A champion at the top of the pyramid is worth far more than a Sunday League title, so titles are
// weighted by the division tier they were won in (tierIdx 0 = Sunday League … 9 = World Class).

/** One archived honour, reduced to what prestige cares about (title:1 = champion of that pod/season). */
export interface HonourLite { tierIdx: number; title: number; kind: 'league' | 'cup' }
/** A manager's full career record — aggregate across all seasons (the caller pulls this from storage). */
export interface ManagerRecord {
  wins: number;
  draws: number;
  losses: number;
  honours: HonourLite[];      // every championship (and placement) they've archived
  highestTierIdx: number;     // the highest division they ever reached (climbing the pyramid = prestige)
  seasons: number;            // seasons managed (longevity)
}

/** A named prestige rank + the score you cross to reach it. Roughly geometric so titles always move you. */
export interface PrestigeLevel { title: string; at: number; icon: string }
export const PRESTIGE_LEVELS: PrestigeLevel[] = [
  { title: 'Rookie Gaffer',      at: 0,     icon: '🎽' },
  { title: 'Local Hero',         at: 120,   icon: '📋' },
  { title: 'Promising Boss',     at: 350,   icon: '🧢' },
  { title: 'Established Manager', at: 800,   icon: '🎩' },
  { title: 'Seasoned Tactician', at: 1600,  icon: '🧠' },
  { title: 'Trophy Winner',      at: 3000,  icon: '🏆' },
  { title: 'Elite Manager',      at: 5500,  icon: '⭐' },
  { title: 'Footballing Legend', at: 9500,  icon: '👑' },
  { title: 'Immortal Gaffer',    at: 16000, icon: '🐐' },
];

/** Prestige POINTS from a career record. Titles dominate (tier-weighted), wins + longevity accrue steadily. */
export function prestigeScore(r: ManagerRecord): number {
  let s = 0;
  for (const h of r.honours) {
    const tierMult = 1 + h.tierIdx * 0.5;                 // a top-flight title is worth ~5.5x a Sunday one
    if (h.title === 1) s += (h.kind === 'cup' ? 60 : 100) * tierMult; // championships are the big prestige
  }
  s += r.wins * 1 + r.draws * 0.3;                        // the grind counts, a little
  s += r.highestTierIdx * 40;                             // climbing the pyramid is itself an achievement
  s += r.seasons * 5;                                     // longevity — a long career at the top compounds
  return Math.round(s);
}

/** Full prestige standing for a manager: level, title, and progress toward the next rank. */
export interface Prestige {
  score: number;
  levelIdx: number;
  title: string;
  icon: string;
  nextTitle: string | null;
  nextAt: number | null;      // score needed for the next rank (null at max)
  progress: number;           // 0..1 toward the next rank (1 at max)
  leagueTitles: number;
  cupTitles: number;
}
// ── Rank-up flavour (additive, presentational-only) ────────────────────────────────────────────────
// Crossing a prestige rank is silent today — managerPrestige() just returns the new title. Add a
// deterministic one-line "how it feels" blurb per rank, seeded off the record itself so two managers
// hitting the same rank on different careers don't always read the identical sentence. Pure; no
// change to prestigeScore/managerPrestige's existing behaviour. Not yet wired into
// client/src/main.ts's showPrestigeCard (a client-shell change, left for the backlog).
function hash32(...nums: number[]): number {
  let h = 2166136261 >>> 0;
  for (const n of nums) { h ^= (n >>> 0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const BASE_RANK_UP_BLURB: Record<string, string[]> = {
  'Rookie Gaffer': [
    'Every legend starts somewhere. This is where it begins.',
    'First steps in the dugout. The rest is still to be written.',
  ],
  'Local Hero': [
    'Word is getting around locally — this is a manager worth watching.',
    'A reputation is starting to form in these parts.',
  ],
  'Promising Boss': [
    'The wider footballing world is starting to take notice.',
    'No longer just a local name — the profile is growing.',
  ],
  'Established Manager': [
    'A genuinely established name in the dugout now — respect, not just recognition.',
    'This is no longer a rising manager. This is an established one.',
  ],
  'Seasoned Tactician': [
    'The tactics board tells the story: a seasoned operator now, in any dugout.',
    'Years of decisions have sharpened into real, seasoned know-how.',
  ],
  'Trophy Winner': [
    'Silverware on the shelf, and a title to match: Trophy Winner. Nobody can take that away.',
    'The medals are starting to add up, and so is the reputation.',
  ],
  'Elite Manager': [
    'Elite company now — the kind of name mentioned alongside the very best.',
    'This is what an elite managerial career looks like from the inside.',
  ],
  'Footballing Legend': [
    'Legend status. Whatever comes next, this is already a career for the history books.',
    'A footballing legend, by any honest measure. The story writes itself from here.',
  ],
  'Immortal Gaffer': [
    'Immortal. The very top of the managerial pyramid, reached and claimed.',
    'There is no higher rank than this. A career for the ages.',
  ],
};

// BASE plus every authoring pack.
const RANK_UP_BLURB = mergeBanks(BASE_RANK_UP_BLURB, PRESTIGE_EXTRA_1, PRESTIGE_EXTRA_2, PRESTIGE_EXTRA_3, PRESTIGE_EXTRA_4);

/** A deterministic one-line blurb for crossing INTO `title` with this record — same record, same
 *  rank always reads the same way; different records at the same rank vary. */
export function prestigeRankUpBlurb(title: string, r: ManagerRecord): string {
  const pool = RANK_UP_BLURB[title] ?? RANK_UP_BLURB['Rookie Gaffer'];
  const h = hash32(r.wins, r.draws, r.losses, r.seasons, r.honours.length, 7331);
  return pool[h % pool.length];
}

export function managerPrestige(r: ManagerRecord): Prestige {
  const score = prestigeScore(r);
  let levelIdx = 0;
  for (let i = 0; i < PRESTIGE_LEVELS.length; i++) if (score >= PRESTIGE_LEVELS[i].at) levelIdx = i;
  const cur = PRESTIGE_LEVELS[levelIdx];
  const next = PRESTIGE_LEVELS[levelIdx + 1] ?? null;
  const progress = next ? (score - cur.at) / (next.at - cur.at) : 1;
  const champs = r.honours.filter((h) => h.title === 1);
  return {
    score, levelIdx, title: cur.title, icon: cur.icon,
    nextTitle: next?.title ?? null,
    nextAt: next?.at ?? null,
    progress: Math.max(0, Math.min(1, progress)),
    leagueTitles: champs.filter((h) => h.kind === 'league').length,
    cupTitles: champs.filter((h) => h.kind === 'cup').length,
  };
}
