// Extract per-player output (goals / assists / appearances / player-of-the-match) from a finished
// match's event stream. Deterministic input (the seeded event stream), so a re-run of the same
// match derives identical stats. Persistence (season stats + on-chain NFT career tallies) is the
// caller's job — see server/src/matchstats.ts's `recordMatchStats`, which writes these to the Store.
import type { MatchEvent, Team } from './types.js';

export interface MatchPlayerStat { id: string; name: string; goals: number; assists: number; apps: number; potm: number }

/** Derive per-player stat rows for both sides from a match's raw event stream. Returns
 *  only players with something worth recording (an appearance, goal, assist, or POTM)
 *  AND a resolvable roster id. */
export function deriveMatchStats(
  homeTeam: Team, awayTeam: Team, events: MatchEvent[], result: [number, number],
): [MatchPlayerStat[], MatchPlayerStat[]] {
  const nameId = (team: Team) => {
    const m = new Map<string, string>();
    for (const p of [...team.players, ...(team.bench ?? [])]) m.set(p.name, p.id);
    return m;
  };
  const idMap: [Map<string, string>, Map<string, string>] = [nameId(homeTeam), nameId(awayTeam)];

  // goals + assists per side|name
  const stats = new Map<string, { goals: number; assists: number }>();
  const bump = (side: 0 | 1, name: string, k: 'goals' | 'assists') => {
    const key = `${side}|${name}`;
    const s = stats.get(key) ?? { goals: 0, assists: 0 };
    s[k]++; stats.set(key, s);
  };
  const goalsByPlayer = new Map<string, { side: 0 | 1; n: number }>();
  for (const e of events) {
    if (e.type !== 'goal' || !e.playerName) continue;
    bump(e.teamIdx, e.playerName, 'goals');
    if (e.playerName2) bump(e.teamIdx, e.playerName2, 'assists');
    const gk = `${e.teamIdx}|${e.playerName}`;
    const g = goalsByPlayer.get(gk) ?? { side: e.teamIdx, n: 0 }; g.n++; goalsByPlayer.set(gk, g);
  }

  // appearances: the XI plus anyone subbed on
  const apps: [Set<string>, Set<string>] = [new Set(), new Set()];
  homeTeam.players.forEach((p) => apps[0].add(p.name));
  awayTeam.players.forEach((p) => apps[1].add(p.name));
  for (const e of events) if (e.type === 'sub' && e.playerName) apps[e.teamIdx].add(e.playerName);

  // player of the match: top scorer, tie broken toward the winning side (none in a goalless game)
  let potmKey: string | null = null;
  if (goalsByPlayer.size) {
    const winSide: 0 | 1 | null = result[0] > result[1] ? 0 : result[1] > result[0] ? 1 : null;
    potmKey = [...goalsByPlayer.entries()].sort(
      (a, b) => b[1].n - a[1].n || (Number(b[1].side === winSide) - Number(a[1].side === winSide)),
    )[0][0];
  }

  const deriveSide = (side: 0 | 1): MatchPlayerStat[] => {
    const names = new Set<string>(apps[side]);
    for (const key of stats.keys()) { const [s, n] = key.split('|'); if (Number(s) === side) names.add(n); }
    const out: MatchPlayerStat[] = [];
    for (const name of names) {
      const id = idMap[side].get(name);
      if (!id) continue;
      const s = stats.get(`${side}|${name}`) ?? { goals: 0, assists: 0 };
      const app = apps[side].has(name) ? 1 : 0;
      const potm = potmKey === `${side}|${name}` ? 1 : 0;
      if (!s.goals && !s.assists && !app && !potm) continue;
      out.push({ id, name, goals: s.goals, assists: s.assists, apps: app, potm });
    }
    return out;
  };
  return [deriveSide(0), deriveSide(1)];
}
