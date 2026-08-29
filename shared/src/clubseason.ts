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
// Widened from the original 16 (audit finding: with only 9 opponents drawn per save, 16 names meant
// two saves sharing a seed range could see heavy overlap in their league). 32 names roughly doubles
// the per-save variety without touching seededOpponents/seededLeague's selection logic at all.
// A big pool of fictional clubs so the 10-tier pyramid can field mostly-distinct opponents at every level.
const LEAGUE_POOL = [
  'Riverside Rovers', 'Ashcombe Town', 'Kingsford United', 'Dockside FC', 'Hallby City',
  'Fenwick Rangers', 'Stonebridge', 'Portland Vale', 'Oakfield United', 'Brightmoor',
  'Cranleigh Town', 'Whitlow Wanderers', 'Eastgate FC', 'Redhaven', 'Millbrook County', 'Marlow Athletic',
  'Aldergate United', 'Bramwell Town', 'Corvedale FC', 'Dunmore Rangers', 'Elmsworth Athletic',
  'Foxleigh United', 'Gladewick Town', 'Harrowgate FC', 'Ironmoor Rovers', 'Juniper Vale',
  'Kettlebrook', 'Larkspur United', 'Moorside Wanderers', 'Northgate Athletic', 'Ottersby Town',
  'Pemberton FC', 'Quarrymoor United',
  'Ravenscar City', 'Selby Rovers', 'Thornbury Town', 'Underhill United', 'Vexford FC',
  'Westmere Athletic', 'Yarrow Wanderers', 'Alderton Borough', 'Bexley Vale', 'Caldwell United',
  'Denholm Town', 'Edenbrook City', 'Farnworth Rovers', 'Grimsden FC', 'Hartcliffe United',
  'Inglewood Town', 'Jarrow Athletic', 'Kelmscott Rangers', 'Lanmoor City', 'Maplewood United',
  'Netherby Town', 'Oldcastle FC', 'Pinehurst Rovers', 'Queensmere United', 'Rosewick Athletic',
  'Stanmore City', 'Tarnwell Town', 'Uppingham FC', 'Vale Ferrers', 'Wexham United',
  'Ashby Cross', 'Boldmere Rangers', 'Cheswick Town', 'Draymoor United', 'Emberton City',
  'Foxhollow FC', 'Glenwick Athletic', 'Havenport Town', 'Ilfordby United', 'Jestwick Rovers',
  'Kirkfell City', 'Lyndhurst Town', 'Merebrook FC', 'Norwood Rangers', 'Overton United',
  'Prestbury Athletic', 'Quinton Town', 'Ryedale City', 'Sandmere United', 'Templeford FC',
  'Uxendon Rovers', 'Varley Town', 'Wollaton United', 'Ayleford City', 'Brackenhall Town',
  'Cliffside United', 'Dartmoor FC', 'Ellingham Rovers', 'Fallowfield Town', 'Greystoke City',
  'Holbeck United', 'Ingerthorpe FC', 'Kestrel Vale', 'Longmoor Rangers', 'Middlewych Town',
  'Newlyn United', 'Orsett Athletic', 'Padgate City', 'Rushmere Town', 'Saltby United',
  'Thurloe FC', 'Westover Rovers', 'Wyndham City', 'Ansley Town', 'Broughmoor United',
];

// ── 10-tier league pyramid ──────────────────────────────────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const TIERS = 10; // 1 = top flight, 10 = the bottom of the football pyramid
/** Flavour names for each tier (1..10), so the season reads as a real climb. */
export const TIER_NAMES: readonly string[] = [
  '', // (1-indexed; slot 0 unused)
  'the Premier Division', 'the Championship', 'League One', 'League Two', 'the National League',
  'the Regional Premier', 'the Regional North/South', 'the County Premier', 'the District League', 'the Sunday League',
];
export const tierName = (tier: number) => TIER_NAMES[clamp(Math.round(tier), 1, TIERS)];
// a deterministic, non-alphabetical final tiebreak (only reached when points, GD AND GF are all level — very
// rare): a stable hash of the club name, so a level split doesn't read as "A beats Z" alphabetical order (PT-83).
const nameTiebreak = (name: string): number => { let h = 0; for (let i = 0; i < name.length; i++) h = (Math.imul(h, 31) + name.charCodeAt(i)) | 0; return h; };
/** Baseline opponent quality at a tier — elite at the top (18), pub-team weak at the bottom (6). The
 *  bloodline player's club has a FIXED strength (his ability + facilities), so he climbs when he outgrows a
 *  tier and slips when he's outmatched — the pyramid is the growth arc. */
export function tierStrength(tier: number): number {
  // calibrated to the club's real strength range (~9 fresh graduate … ~15 peak squad): tier 10 baseline 5
  // (a graduate dominates → promotes), tier 1 baseline 14 (only a peak squad wins the top flight).
  // A STEEPER ladder: the old flat 15-tier meant each promotion cost a fixed +1 while a club's strength grew
  // faster than that every season, so the climb got easier the higher you went. 16.8 - 1.3*tier widens the gap
  // between divisions so each rung genuinely asks more. (PT-902)
  return 16.8 - 1.3 * clamp(Math.round(tier), 1, TIERS);
}

function hash32(...nums: number[]): number {
  let h = 2166136261 >>> 0;
  for (const n of nums) { h ^= (n >>> 0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const nameSeed = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export interface LeagueClub { name: string; strength: number; seed: number; mine: boolean }
export interface TableRow { name: string; mine: boolean; P: number; W: number; D: number; L: number; GF: number; GA: number; GD: number; Pts: number }

/** The 9 fictional opponents for a season — name + squad strength (1-20 quality) + a squad seed for
 *  generateClub. Deterministic from the save seed AND the `tier`: each tier draws a mostly-distinct set of
 *  clubs, and their strength is scaled to that tier's baseline (weak at the bottom, elite at the top). */
export function seededOpponents(myClub: string, seed: number, tier?: number): LeagueClub[] {
  // exclude the club itself and any near-duplicate name (e.g. 'Marlow' vs 'Marlow Athletic')
  const pool = LEAGUE_POOL.filter((n) => n !== myClub && !n.includes(myClub) && !myClub.includes(n));
  // no tier → the exact legacy hashes (preserves career-mode / existing sim determinism); tier → a
  // per-division draw + tier-scaled strength.
  const chosen = pool
    .map((n) => ({ n, k: tier != null ? hash32(seed, tier * 100003, nameSeed(n)) : hash32(seed, nameSeed(n)) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, LEAGUE_SIZE - 1)
    .map((x) => x.n);
  return chosen.map((n) => {
    const strength = tier != null
      ? clamp(Math.round(tierStrength(tier) + (hash32(seed, tier, (nameSeed(n) * 2654435761) >>> 0) % 7) - 3), 3, 20)
      : 6 + (hash32(seed, (nameSeed(n) * 2654435761) >>> 0) % 13);
    const sdSeed = tier != null ? hash32(seed, tier, nameSeed(n)) >>> 0 : hash32(seed, nameSeed(n)) >>> 0;
    return { name: n, strength, seed: sdSeed, mine: false };
  });
}

/** Build the seeded 10-club league at `tier`: Marlow (at `myStrength`) + the 9 tier opponents. */
export function seededLeague(myClub: string, myStrength: number, seed: number, tier?: number): LeagueClub[] {
  return [{ name: myClub, strength: Math.round(myStrength), seed: hash32(seed, 777) >>> 0, mine: true }, ...seededOpponents(myClub, seed, tier)];
}

// Full double round-robin schedule (circle method): 2(n-1) rounds of n/2 matches [homeIdx, awayIdx].
// Club 0 (Marlow) is fixed at position 0, so its round-r match is always rounds[r][0].
function scheduleRounds(n: number): [number, number][][] {
  const arr = Array.from({ length: n }, (_, i) => i);
  const first: [number, number][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const round: [number, number][] = [];
    for (let i = 0; i < n / 2; i++) { const a = arr[i], b = arr[n - 1 - i]; round.push(r % 2 === 0 ? [a, b] : [b, a]); }
    first.push(round);
    arr.splice(1, 0, arr.pop()!); // rotate, keeping index 0 fixed
  }
  const second = first.map((rd) => rd.map(([h, a]) => [a, h] as [number, number]));
  return [...first, ...second];
}

export interface Fixture { oppName: string; venue: 'H' | 'A' }
/** Marlow's fixture per round across the 18-round double round-robin (derived from the shared schedule). */
export function seasonFixtures(myClub: string, seed: number, tier = 1): Fixture[] {
  const clubs = seededLeague(myClub, SQUAD_BASE, seed, tier);
  const rounds = scheduleRounds(clubs.length);
  return rounds.map((rd) => { const [h, a] = rd.find(([x, y]) => x === 0 || y === 0)!; return h === 0 ? { oppName: clubs[a].name, venue: 'H' as const } : { oppName: clubs[h].name, venue: 'A' as const }; });
}

export interface PlayedResult { myGoals: number; oppGoals: number }
/** LIVE league table after `played.length` rounds: every club has played that many games. Marlow's rounds
 *  use his real results; every other match up to the current round is simulated. Fills in as you play. */
// `resultSeed` (defaults to `seed`, so existing callers are byte-identical) varies the OTHER clubs' match
// results per season while the roster stays fixed to `seed` — so your division's clubs are stable year to
// year, but the league plays out differently each season instead of repeating byte-for-byte (PT-24).
export function liveTable(myClub: string, marlowStrength: number, share: number, seed: number, played: PlayedResult[], tier = 1, resultSeed = seed) {
  const clubs = seededLeague(myClub, SQUAD_BASE + (marlowStrength - SQUAD_BASE) * share, seed, tier);
  const rounds = scheduleRounds(clubs.length);
  const rows: TableRow[] = clubs.map((c) => ({ name: c.name, mine: c.mine, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 }));
  const add = (rh: TableRow, rj: TableRow, gh: number, ga: number) => {
    rh.P++; rj.P++; rh.GF += gh; rh.GA += ga; rj.GF += ga; rj.GA += gh;
    if (gh > ga) { rh.W++; rj.L++; rh.Pts += 3; } else if (gh < ga) { rj.W++; rh.L++; rj.Pts += 3; } else { rh.D++; rj.D++; rh.Pts++; rj.Pts++; }
  };
  const matchday = Math.min(played.length, rounds.length);
  for (let r = 0; r < matchday; r++) for (const [hi, ai] of rounds[r]) {
    let gh: number, ga: number;
    if (hi === 0 || ai === 0) { const p = played[r]; if (hi === 0) { gh = p.myGoals; ga = p.oppGoals; } else { gh = p.oppGoals; ga = p.myGoals; } }
    else [gh, ga] = simMatch(clubs[hi], clubs[ai], hash32(resultSeed, r * 53 + hi * 7 + ai));
    add(rows[hi], rows[ai], gh, ga);
  }
  for (const r of rows) r.GD = r.GF - r.GA;
  rows.sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF || (nameTiebreak(a.name) - nameTiebreak(b.name)));
  const pos = rows.findIndex((r) => r.mine) + 1;
  return { table: rows, pos, me: rows.find((r) => r.mine)!, size: rows.length, matchday, totalRounds: rounds.length };
}

/** Deterministic scoreline for one fixture (a hosts b), weighted by the strength gap + seeded noise. */
function simMatch(a: LeagueClub, b: LeagueClub, h: number): [number, number] {
  // MIX THE SEED FIRST. Right-shifting the raw seed discards the low bits — the very bits that differ between
  // consecutive fixtures — so neighbouring seeds produced the IDENTICAL scoreline 94.5% of the time and a
  // season averaged 2.0 distinct results, with one repeating 14 times in 18 games ("13 of 18 were 2-0"). (PT-900)
  const mixed = (() => { let x = h >>> 0; x = Math.imul(x ^ (x >>> 16), 2246822507) >>> 0; x = Math.imul(x ^ (x >>> 13), 3266489909) >>> 0; return (x ^ (x >>> 16)) >>> 0; })();
  // guard a non-finite strength from corrupting goal columns into NaN (QA M2); finite passes through unchanged
  const aStr = Number.isFinite(a.strength) ? a.strength : SQUAD_BASE, bStr = Number.isFinite(b.strength) ? b.strength : SQUAD_BASE;
  const diff = (aStr - bStr) * 0.10 + 0.25; // small home edge; coefficient eased so a strong side isn't unbeatable (PT-901)
  // GOALS ARE POISSON, not a rounded uniform. Both goal columns used to be read off the same `mixed` word
  // by bit-shifting it, which made them correlated, and `round(1.2 ± 1.6)` can only ever produce 0-3 — so
  // no side could score 4 however one-sided the game, and 42% of a season came out 2-0 or 2-2. Football
  // scorelines are close to Poisson, which gives the long tail (the 4-1, the occasional 5) that makes a
  // season memorable, for free and still fully deterministic. (PT-1003)
  const stream = (salt: number) => {
    let x = (mixed ^ Math.imul(salt, 2654435761)) >>> 0;
    return () => { x = (x + 0x6d2b79f5) >>> 0; let t = x; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return (((t ^ (t >>> 14)) >>> 0) / 4294967296); };
  };
  const poisson = (lambda: number, rng: () => number) => {
    const L = Math.exp(-Math.max(0.05, lambda));
    let k = 0, p = 1;
    do { k++; p *= rng(); } while (p > L && k < 40);
    return k - 1;
  };
  const gh = Math.min(6, poisson(1.35 + diff, stream(1)));
  const ga = Math.min(6, poisson(1.35 - diff, stream(2)));
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
  rows.sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF || (nameTiebreak(a.name) - nameTiebreak(b.name)));
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
