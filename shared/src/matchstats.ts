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
  // KEYED BY ID, NOT BY NAME. Every stat here used to be keyed by player NAME, and a name is not an
  // identity in this game: `generateClub` draws from 18 first names x 18 surnames for a twenty-man roster,
  // so 40% of matchday squads contain two men called the same thing. The name->id map was built over
  // `[...players, ...bench]`, so a BENCH player silently overwrote the XI player he shared a name with.
  // Measured over 400 matches: 378 players who actually took the field got no row at all, 150 rows
  // credited an unused substitute with an appearance he never made, and 18 of those handed him goals or
  // Player of the Match — one gave a bench player FOUR GOALS while the man who scored them was absent
  // from the report entirely.
  //
  // MatchEvent now carries playerId/playerId2. `name` is still emitted for display, and is read from the
  // roster rather than from the event, so two men called the same thing keep their own rows.
  const rosterName = (team: Team) => {
    const m = new Map<string, string>();
    for (const p of [...team.players, ...(team.bench ?? [])]) m.set(p.id, p.name);
    return m;
  };
  const nameOf: [Map<string, string>, Map<string, string>] = [rosterName(homeTeam), rosterName(awayTeam)];

  const stats = new Map<string, { goals: number; assists: number }>();
  const bump = (side: 0 | 1, id: string, k: 'goals' | 'assists') => {
    const key = `${side}|${id}`;
    const st = stats.get(key) ?? { goals: 0, assists: 0 };
    st[k]++; stats.set(key, st);
  };
  const goalsByPlayer = new Map<string, { side: 0 | 1; n: number }>();
  for (const e of events) {
    if (e.type !== 'goal' || !e.playerId) continue;
    bump(e.teamIdx, e.playerId, 'goals');
    if (e.playerId2) bump(e.teamIdx, e.playerId2, 'assists');
    const gk = `${e.teamIdx}|${e.playerId}`;
    const g = goalsByPlayer.get(gk) ?? { side: e.teamIdx, n: 0 }; g.n++; goalsByPlayer.set(gk, g);
  }

  // appearances: the XI plus anyone subbed ON (playerId is the man coming on; playerId2 is the man off,
  // who already has his appearance from the starting XI)
  const apps: [Set<string>, Set<string>] = [new Set(), new Set()];
  homeTeam.players.forEach((p) => apps[0].add(p.id));
  awayTeam.players.forEach((p) => apps[1].add(p.id));
  // BOTH MEN IN A SUBSTITUTION APPEARED. playerId is the man coming on; playerId2 is the man going off,
  // and he needs adding explicitly because `makeSub` REPLACES teams[t].players[outI] — so by full time the
  // XI array holds whoever FINISHED, and a player who was substituted has already vanished from it. He
  // played; he gets an appearance.
  for (const e of events) if (e.type === 'sub') {
    if (e.playerId) apps[e.teamIdx].add(e.playerId);
    if (e.playerId2) apps[e.teamIdx].add(e.playerId2);
  }

  let potmKey: string | null = null;
  if (goalsByPlayer.size) {
    const winSide: 0 | 1 | null = result[0] > result[1] ? 0 : result[1] > result[0] ? 1 : null;
    potmKey = [...goalsByPlayer.entries()].sort(
      (a, b) => b[1].n - a[1].n || (Number(b[1].side === winSide) - Number(a[1].side === winSide)),
    )[0][0];
  }

  const deriveSide = (side: 0 | 1): MatchPlayerStat[] => {
    const ids = new Set<string>(apps[side]);
    for (const key of stats.keys()) { const [sd, id] = [key.slice(0, key.indexOf('|')), key.slice(key.indexOf('|') + 1)]; if (Number(sd) === side) ids.add(id); }
    const out: MatchPlayerStat[] = [];
    for (const id of ids) {
      const name = nameOf[side].get(id);
      if (!name) continue;                       // not on this roster — never invent a row
      const st = stats.get(`${side}|${id}`) ?? { goals: 0, assists: 0 };
      const app = apps[side].has(id) ? 1 : 0;
      const potm = potmKey === `${side}|${id}` ? 1 : 0;
      if (!st.goals && !st.assists && !app && !potm) continue;
      out.push({ id, name, goals: st.goals, assists: st.assists, apps: app, potm });
    }
    return out;
  };
  return [deriveSide(0), deriveSide(1)];
}
