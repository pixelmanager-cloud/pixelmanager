// CLUB RECORDS — biggest win, longest unbeaten run, all-time top scorer/appearances, first
// trophy. Pure derivation over already-known match/honour/player-stat history (same shape as
// gaffersDiary.ts): no persisted record state, so a record is always recomputed fresh and can
// never drift from the underlying history.

export interface RecordMatch { id: string; myScore: number; oppScore: number; oppHandle: string; createdAt: number }
export interface RecordHonour { seasonNumber: number; tier: string; kind: string; title: number }
export interface RecordPlayerStat { name: string; goals: number; apps: number }
export interface ClubRecordsInput { matches: RecordMatch[]; honours: RecordHonour[]; playerStats: RecordPlayerStat[] }

export interface BiggestWin { margin: number; myScore: number; oppScore: number; oppHandle: string; createdAt: number }
export interface UnbeatenRun { length: number; startedAt: number; endedAt: number }
export interface TopPlayer { name: string; value: number }
export interface FirstTrophy { seasonNumber: number; tier: string; kind: 'league' | 'cup' }

export interface ClubRecords {
  biggestWin: BiggestWin | null;
  longestUnbeaten: UnbeatenRun | null;
  topScorer: TopPlayer | null;
  topAppearances: TopPlayer | null;
  firstTrophy: FirstTrophy | null;
}

function outcome(m: RecordMatch): 'W' | 'D' | 'L' { return m.myScore > m.oppScore ? 'W' : m.myScore < m.oppScore ? 'L' : 'D'; }

/** Compute a club's all-time records. Pure function of its match/honour/player-stat history. */
export function computeClubRecords(input: ClubRecordsInput): ClubRecords {
  const ordered = [...input.matches].sort((a, b) => a.createdAt - b.createdAt);

  let biggestWin: BiggestWin | null = null;
  for (const m of ordered) {
    const margin = m.myScore - m.oppScore;
    if (margin > 0 && (!biggestWin || margin > biggestWin.margin)) {
      biggestWin = { margin, myScore: m.myScore, oppScore: m.oppScore, oppHandle: m.oppHandle, createdAt: m.createdAt };
    }
  }

  let longestUnbeaten: UnbeatenRun | null = null;
  let runStart = -1;
  for (let i = 0; i < ordered.length; i++) {
    if (outcome(ordered[i]) !== 'L') {
      if (runStart === -1) runStart = i;
      const length = i - runStart + 1;
      if (!longestUnbeaten || length > longestUnbeaten.length) {
        longestUnbeaten = { length, startedAt: ordered[runStart].createdAt, endedAt: ordered[i].createdAt };
      }
    } else runStart = -1;
  }

  const bestBy = (key: 'goals' | 'apps'): TopPlayer | null => {
    const top = [...input.playerStats].filter((p) => p[key] > 0).sort((a, b) => b[key] - a[key])[0];
    return top ? { name: top.name, value: top[key] } : null;
  };

  const trophies = input.honours.filter((h) => h.title === 1).sort((a, b) => a.seasonNumber - b.seasonNumber);
  const first = trophies[0];

  return {
    biggestWin,
    longestUnbeaten,
    topScorer: bestBy('goals'),
    topAppearances: bestBy('apps'),
    firstTrophy: first ? { seasonNumber: first.seasonNumber, tier: first.tier, kind: first.kind === 'cup' ? 'cup' : 'league' } : null,
  };
}
