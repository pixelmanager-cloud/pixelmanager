// Extract per-player output (goals / assists / appearances / player-of-the-match) from a finished
// match's event stream and persist it: season stats for EVERY player (leaderboards + awards) and
// permanent career tallies on NFT tokens. Deterministic input (the seeded event stream), so a
// re-run of the same match records identical stats.
import type { Store } from './store.js';
import type { MatchEvent, Team } from '@fm/shared';
import { bumpTokenStats } from './tokens.js';

const isNft = (id: string) => id.startsWith('nft:');

export async function recordMatchStats(
  db: Store, seasonId: string, homeId: string, awayId: string,
  homeTeam: Team, awayTeam: Team, events: MatchEvent[], result: [number, number],
): Promise<void> {
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

  const persistSide = async (side: 0 | 1, ownerId: string) => {
    const names = new Set<string>(apps[side]);
    for (const key of stats.keys()) { const [s, n] = key.split('|'); if (Number(s) === side) names.add(n); }
    for (const name of names) {
      const id = idMap[side].get(name);
      if (!id) continue;
      const s = stats.get(`${side}|${name}`) ?? { goals: 0, assists: 0 };
      const app = apps[side].has(name) ? 1 : 0;
      const potm = potmKey === `${side}|${name}` ? 1 : 0;
      if (!s.goals && !s.assists && !app && !potm) continue;
      await db.bumpPlayerStats(seasonId, ownerId, id, name, { goals: s.goals, assists: s.assists, apps: app, potm });
      if (isNft(id)) await bumpTokenStats(db, id, { goals: s.goals, assists: s.assists, potm });
    }
  };
  await persistSide(0, homeId);
  await persistSide(1, awayId);
}
