// ── Club season — a small, fully-simulated league the bloodline player's club competes in ──
// The player career surfaces only ~5 highlight matches a season, but his CLUB plays a full (smaller)
// league campaign around them. This module simulates that league deterministically (seeded from the save
// + season), so there's a real table to climb — driven by the player's strength + form. Presentational
// and replay-safe: no rng, no wall-clock, no storage. Marlow's league strength comes from his career
// (overall + recent form), so playing well literally lifts the club up the table.

const LEAGUE_SIZE = 10; // Marlow + 9 opponents → an 18-fixture double round-robin (about half a 38-game season)
export const FIXTURES_PER_SEASON = 2 * (LEAGUE_SIZE - 1); // 18
const SQUAD_BASE = 11; // a mid-table squad's baseline strength (before the bloodline player's influence)

// How much of the season the player actually FEATURES in, by career stage — realism: a kid breaking into
// the first team gets a handful of games; a regular starts most; an established star plays nearly all.
const STAGE_SHARE: Record<number, number> = { 3: 0.22, 4: 0.42, 5: 0.72, 6: 0.9 }; // Youth Team / Breakthrough / First Team / Establishing

const FIRST_TEAM_MIN_BAND = 3; // Youth Team (~age 17) — the earliest a prodigy can debut for the senior side

/** Whether the player has broken into the senior first team yet — NOT a fixed age. A prodigy whose overall
 *  clears the bar debuts early; an average player takes longer; and a HIGHER-LEVEL club is harder to break
 *  into (a bigger threshold). By First Team age (band 5) everyone still going is at least a fringe senior. */
export function firstTeamReady(bandIdx: number, overall: number, clubLevel = 0): boolean {
  if (bandIdx >= 5) return true;
  const threshold = 9 + clubLevel * 1.2; // higher division/level ⇒ harder to break in
  return bandIdx >= FIRST_TEAM_MIN_BAND && overall >= threshold;
}

/** His squad standing this season: how many of the club's fixtures he features in, + a status label.
 *  A standout (higher overall) breaks in faster and plays more; a fringe player rotates. */
export function squadRole(bandIdx: number, overall: number) {
  let share = (STAGE_SHARE[bandIdx] ?? 0.5) + (overall - 12) * 0.03;
  share = Math.max(0.12, Math.min(1, share));
  const apps = Math.round(share * FIXTURES_PER_SEASON);
  const status = apps >= 16 ? 'Key player' : apps >= 11 ? 'Regular starter' : apps >= 6 ? 'Squad rotation' : 'Breaking in';
  return { share, apps, status };
}

// The pool of fictional clubs the league is drawn from (same flavour as the matchday opponents).
const LEAGUE_POOL = [
  'Riverside Rovers', 'Ashcombe Town', 'Kingsford United', 'Dockside FC', 'Hallby City',
  'Fenwick Rangers', 'Stonebridge', 'Portland Vale', 'Oakfield United', 'Brightmoor',
  'Cranleigh Town', 'Whitlow Wanderers', 'Eastgate FC', 'Redhaven', 'Millbrook County', 'Marlow Athletic',
];

function hash32(...nums: number[]): number {
  let h = 2166136261 >>> 0;
  for (const n of nums) { h ^= (n >>> 0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const nameSeed = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export interface LeagueClub { name: string; strength: number; mine: boolean }
export interface TableRow { name: string; mine: boolean; P: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number }

/** Build the seeded 10-club league: Marlow (at `myStrength`) + 9 fixed-per-save fictional clubs. */
export function seededLeague(myClub: string, myStrength: number, seed: number): LeagueClub[] {
  // exclude the club itself and any near-duplicate name (e.g. 'Marlow' vs 'Marlow Athletic')
  const pool = LEAGUE_POOL.filter((n) => n !== myClub && !n.includes(myClub) && !myClub.includes(n));
  const chosen = pool
    .map((n) => ({ n, k: hash32(seed, nameSeed(n)) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, LEAGUE_SIZE - 1)
    .map((x) => x.n);
  const others = chosen.map((n) => ({ name: n, strength: 6 + (hash32(seed, nameSeed(n) * 2654435761 >>> 0) % 13), mine: false })); // 6..18
  return [{ name: myClub, strength: Math.round(myStrength), mine: true }, ...others];
}

/** Deterministic scoreline for one fixture (a hosts b), weighted by the strength gap + seeded noise. */
function simMatch(a: LeagueClub, b: LeagueClub, h: number): [number, number] {
  const rnd = (n: number) => (((h >>> (n & 15)) ^ (h >>> ((n + 7) & 15))) % 100) / 100;
  const diff = (a.strength - b.strength) * 0.12 + 0.25; // small home edge
  const gh = Math.min(6, Math.max(0, Math.round(1.2 + diff + (rnd(1) - 0.5) * 2.2)));
  const ga = Math.min(6, Math.max(0, Math.round(1.2 - diff + (rnd(2) - 0.5) * 2.2)));
  return [gh, ga];
}

/** Simulate the full double round-robin and return the sorted league table. */
export function seasonTable(clubs: LeagueClub[], seed: number): TableRow[] {
  const rows: TableRow[] = clubs.map((c) => ({ name: c.name, mine: c.mine, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 }));
  const idx = new Map(rows.map((r, i) => [r.name, i]));
  for (let i = 0; i < clubs.length; i++) {
    for (let j = 0; j < clubs.length; j++) {
      if (i === j) continue; // i hosts j; the reverse fixture is covered when j hosts i
      const [gh, ga] = simMatch(clubs[i], clubs[j], hash32(seed, i * 131 + j));
      const rh = rows[idx.get(clubs[i].name)!], rj = rows[idx.get(clubs[j].name)!];
      rh.P++; rj.P++; rh.GF += gh; rh.GA += ga; rj.GF += ga; rj.GA += gh;
      if (gh > ga) { rh.W++; rj.L++; rh.Pts += 3; }
      else if (gh < ga) { rj.W++; rh.L++; rj.Pts += 3; }
      else { rh.D++; rj.D++; rh.Pts++; rj.Pts++; }
    }
  }
  for (const r of rows) r.GD = r.GF - r.GA;
  rows.sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF || a.name.localeCompare(b.name));
  return rows;
}

/** The club's league standing for a season: table + Marlow's row/position + his apps/status.
 *  The club's strength BLENDS a mid-table squad baseline with the player's quality, weighted by how much
 *  he plays (`share`): a fringe kid barely moves the club; a star regular drags it up the table. So both
 *  his ability AND his game-time drive the finish — exactly how a real season would feel. */
export function clubSeason(myClub: string, marlowStrength: number, share: number, seed: number) {
  const clubStrength = SQUAD_BASE + (marlowStrength - SQUAD_BASE) * share;
  const clubs = seededLeague(myClub, clubStrength, seed);
  const table = seasonTable(clubs, seed);
  const pos = table.findIndex((r) => r.mine) + 1;
  const me = table.find((r) => r.mine)!;
  return { table, pos, me, size: table.length, fixtures: FIXTURES_PER_SEASON };
}
