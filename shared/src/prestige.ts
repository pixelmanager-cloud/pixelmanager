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
