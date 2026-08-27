// Server-only PvP game logic — league tables and Elo from live match results, plus
// the fresh-entropy bits (kit colour + match/club seeds) that @fm/shared's pure
// makeClub/runMatch (phase 1 offline migration) intentionally take as parameters
// instead of drawing themselves.

// distinct kit colours so opponents are easy to tell apart on the pitch
export const KIT_COLORS = [0xd23b3b, 0x3b6bd2, 0x2fae6a, 0xe08a2a, 0x9b3bd2, 0x2ab0c0, 0xc0392b, 0xd23b7a, 0x7f8c2a];
export const randomSeed = (): number => Math.floor(Math.random() * 2 ** 31);
export const randomKitColor = (): number => KIT_COLORS[Math.floor(Math.random() * KIT_COLORS.length)];

/** Standard Elo update. scoreHome: 1 win / 0.5 draw / 0 loss. */
export function elo(rHome: number, rAway: number, scoreHome: number, k = 32): [number, number] {
  const expHome = 1 / (1 + 10 ** ((rAway - rHome) / 400));
  const nHome = Math.round(rHome + k * (scoreHome - expHome));
  const nAway = Math.round(rAway + k * ((1 - scoreHome) - (1 - expHome)));
  return [nHome, nAway];
}

export interface TableRow { id: string; handle: string; rating: number; P: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number }

/**
 * Football-style league standings from all matches played: 3 points a win, 1 a draw.
 * Every registered club appears (even with 0 games). Computed on the fly — fine at
 * this scale; materialise it later if the match count grows large.
 */
export function buildTable(
  accounts: Array<{ id: string; handle: string; rating: number }>,
  results: Array<{ home_id: string; away_id: string; home_score: number; away_score: number }>,
): TableRow[] {
  const t = new Map<string, TableRow>();
  for (const a of accounts) t.set(a.id, { id: a.id, handle: a.handle, rating: a.rating, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 });
  for (const m of results) {
    const h = t.get(m.home_id), aw = t.get(m.away_id);
    if (!h || !aw) continue;
    h.P++; aw.P++;
    h.GF += m.home_score; h.GA += m.away_score; aw.GF += m.away_score; aw.GA += m.home_score;
    if (m.home_score > m.away_score) { h.W++; h.Pts += 3; aw.L++; }
    else if (m.home_score < m.away_score) { aw.W++; aw.Pts += 3; h.L++; }
    else { h.D++; aw.D++; h.Pts++; aw.Pts++; }
  }
  const rows = [...t.values()].map((r) => ({ ...r, GD: r.GF - r.GA }));
  // sort by points, then goal difference, then goals for, then name (standard tiebreakers)
  rows.sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF || a.handle.localeCompare(b.handle));
  return rows;
}
