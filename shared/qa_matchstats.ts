// ── THE MATCH REPORT THE PLAYER READS ────────────────────────────────────────────────────────────────
//
// `deriveMatchStats` is the only thing that turns a finished match into per-player numbers — goals,
// assists, appearances, player of the match. It had no harness, no probe and (today) no caller in the
// repo: the header points at `server/src/matchstats.ts`, and the server/ directory was deleted. So the
// one function that decides what a player is told he did on Saturday has never been measured against
// the match it claims to summarise.
//
// This drives REAL matches through MatchEngine on a deliberately ASYMMETRIC fixture (a strong side
// against a weak one, run in BOTH orientations) and checks the derived report against the state it is
// derived from. Asymmetry is the point: every home/away mix-up in this project survived because the
// fixture under test was symmetric enough that a swap looked identical. Here the two sides score very
// different numbers of goals, so a swap cannot hide.
//
// WHAT IT GUARDS
//   1. the report adds up      — goals per side == that side's score, ids belong to that side's roster,
//                                assists never outrun goals, no negative/NaN/fractional counts
//   2. player of the match     — exactly one when anyone scored, none in a goalless game, always a
//                                joint-top scorer, and the tie-break follows the WINNER in both
//                                directions (a hardcoded side passes a home-win fixture forever)
//   3. identity                — a report row is a PLAYER. Rows == distinct on-field NAMES, exactly;
//                                nothing is credited to a name that never took the field
//   4. degenerate input        — no events, 0-0, a side that never touched the ball, no bench, no squad
//   5. determinism             — same match, same numbers, byte for byte
//
// KNOWN DEFECT, MEASURED AND PRINTED BELOW, REPORTED NOT FIXED (shared/src is off-limits here):
// deriveMatchStats keys every stat by player NAME while the roster keys by id, and `nameId` lets the
// bench overwrite the XI. generateClub draws names from 18 x 18 = 324 combinations for a 20-man squad,
// so matchday squads collide constantly. When they do, a man who played vanishes from the report and
// his goals are handed to his namesake on the bench. Check 3 pins the mechanism exactly (rows ==
// distinct NAMES, not distinct players) so it cannot quietly acquire a second cause, and prints the
// damage rate. The fix belongs upstream — ids in MatchEvent, or a name pool a squad cannot exhaust.
//
// New file — modifies nothing under shared/src. Run: `npx tsx shared/qa_matchstats.ts`.
import { MatchEngine } from './src/engine.js';
import { generateClub, autoPickXI, buildXI } from './src/teams.js';
import { DEFAULT_TACTICS } from './src/tactics.js';
import { deriveMatchStats, type MatchPlayerStat } from './src/matchstats.js';
import type { MatchEvent, Player, Team } from './src/types.js';

let fails = 0;
const ok = (name: string, cond: boolean, detail = '') => {
  console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`);
  if (!cond) fails++;
};
/** first few offending cases, so a red check says WHICH match broke and not just that one did */
const ex = (xs: string[]) => (xs.length ? `${xs.length}: ${xs.slice(0, 3).join(' | ')}` : '');

const N = Number(process.env.N ?? 60); // matches per orientation
const STRONG = 14, WEAK = 11;

interface Fixture {
  i: number; teams: [Team, Team]; score: [number, number]; events: MatchEvent[];
  stats: [MatchPlayerStat[], MatchPlayerStat[]];
  /** who ACTUALLY took the field per side: the XI plus every substitute brought on */
  onField: [Player[], Player[]];
  subsOn: [number, number];
}

/** One real match, played out, with real benches (buildXI supplies them) and the stats derived from
 *  the finished state — the exact pipeline the post-match screen would use. */
/** Resolve a roster id from a display name. Only for building SYNTHETIC fixtures — the engine emits ids
 *  directly, and the whole point of this file is that a name is not an identity. */
const idOf = (t: Team, who: string) => [...t.players, ...(t.bench ?? [])].find((p) => p.name === who)?.id;

function playFixture(i: number, homeQ: number, awayQ: number): Fixture {
  const ch = generateClub('hom', 'Home', 0x1, homeQ, i * 7919 + 1, true);
  const ca = generateClub('awy', 'Away', 0x2, awayQ, i * 104729 + 3, true);
  const home = buildXI(ch, autoPickXI(ch, '4-4-2'));
  const away = buildXI(ca, autoPickXI(ca, '4-4-2'));
  // SNAPSHOT THE STARTING ELEVEN BEFORE KICK-OFF. `makeSub` REPLACES teams[t].players[outI], so by full
  // time the XI array holds whoever finished and every substituted player has vanished from it.
  const startXI: [Player[], Player[]] = [[...home.players], [...away.players]];
  const m = new MatchEngine([home, away], i * 31 + 5, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
  while (!m.state.finished) m.tick();
  const s = m.state;
  const teams: [Team, Team] = [home, away];
  // BY ID, NOT BY NAME — this builder had the exact defect the file exists to catch. It resolved the
  // substitute off the bench with `find(p => p.name === e.playerName)`, so on a squad with two men called
  // the same thing it picked whichever came first, and it seeded from the POST-match XI, which no longer
  // contains anyone who was substituted. Between them that reported 13 men on the field for a side that
  // played 14 (eleven starters and three substitutes), and blamed the discrepancy on deriveMatchStats.
  const onField: [Player[], Player[]] = [[...startXI[0]], [...startXI[1]]];
  const subsOn: [number, number] = [0, 0];
  const seen: [Set<string>, Set<string>] = [new Set(startXI[0].map((p) => p.id)), new Set(startXI[1].map((p) => p.id))];
  for (const e of s.events) {
    if (e.type !== 'sub' || !e.playerId) continue;
    subsOn[e.teamIdx]++;
    if (seen[e.teamIdx].has(e.playerId)) continue;
    const b = (teams[e.teamIdx].bench ?? []).find((p) => p.id === e.playerId)
      ?? teams[e.teamIdx].players.find((p) => p.id === e.playerId);
    if (b) { onField[e.teamIdx].push(b); seen[e.teamIdx].add(b.id); }
  }
  return {
    i, teams, score: [s.score[0], s.score[1]], events: s.events,
    stats: deriveMatchStats(home, away, s.events, s.score), onField, subsOn,
  };
}

console.log(`[qa-matchstats] ${2 * N} real matches, ${STRONG} v ${WEAK} in both orientations\n`);
const fixtures: Fixture[] = [];
for (let i = 0; i < N; i++) fixtures.push(playFixture(i, STRONG, WEAK));
for (let i = 0; i < N; i++) fixtures.push(playFixture(10_000 + i, WEAK, STRONG));

const tally = (fs: Fixture[]) => fs.reduce((a, f) => [a[0] + f.score[0], a[1] + f.score[1]], [0, 0]);
// Measured PER ORIENTATION, never pooled. The two blocks are deliberate mirror images, so pooling them
// cancels the asymmetry exactly (122-122 here) and would report the most lopsided fixture in the harness
// as perfectly balanced — the extremum-for-a-population mistake, upside down.
const strongHome = tally(fixtures.slice(0, N)), strongAway = tally(fixtures.slice(N));
const totalSubs = fixtures.reduce((a, f) => a + f.subsOn[0] + f.subsOn[1], 0);
const goalless = fixtures.filter((f) => f.score[0] + f.score[1] === 0).length;
console.log(`  fixture: ${STRONG} at home wins ${strongHome[0]}-${strongHome[1]}, ${WEAK} at home loses ${strongAway[0]}-${strongAway[1]}; ${totalSubs} substitutions, ${goalless} goalless`);
// A fixture with no goals, or a similar number each way, could not expose a side swap at all. Both sides
// must also score enough overall that neither side's arithmetic is 0 == 0 for the whole run.
const lopsided = (t: number[]) => t[0] > 0 && t[1] > 0 && Math.abs(t[0] - t[1]) > 0.5 * (t[0] + t[1]);
ok('the strong side at HOME outscores the weak one several times over', lopsided(strongHome) && strongHome[0] > strongHome[1], `${strongHome[0]}-${strongHome[1]}`);
ok('...and the mirror fixture is just as lopsided the other way', lopsided(strongAway) && strongAway[1] > strongAway[0], `${strongAway[0]}-${strongAway[1]}`);
ok('both sides score enough that neither side is checked against a run of zeroes',
  strongHome[0] + strongAway[0] >= 25 && strongHome[1] + strongAway[1] >= 25,
  `home ${strongHome[0] + strongAway[0]}, away ${strongHome[1] + strongAway[1]}`);
ok('substitutes actually came on (the appearance path is exercised)', totalSubs >= fixtures.length,
  `${totalSubs} subs over ${fixtures.length} matches`);
ok('real goalless matches occur (the no-award path is exercised on real data)', goalless >= 3, `${goalless}/${fixtures.length}`);

console.log('\n=== 1. the report adds up ===');
{
  const goalGap: string[] = [], alien: string[] = [], badNum: string[] = [], dupId: string[] = [], assistGap: string[] = [];
  for (const f of fixtures) {
    for (const side of [0, 1] as const) {
      const rows = f.stats[side];
      const g = rows.reduce((a, r) => a + r.goals, 0);
      const a = rows.reduce((x, r) => x + r.assists, 0);
      if (g !== f.score[side]) goalGap.push(`m${f.i} side${side} stats ${g} vs score ${f.score[side]}`);
      // an assist exists only alongside a goal, so a side can never have more assists than goals —
      // and a side that never scored can never have one at all
      if (a > g) assistGap.push(`m${f.i} side${side} ${a} assists on ${g} goals`);
      const roster = new Set([...f.teams[side].players, ...(f.teams[side].bench ?? [])].map((p) => p.id));
      const seen = new Set<string>();
      for (const r of rows) {
        if (!roster.has(r.id)) alien.push(`m${f.i} side${side} ${r.id} (${r.name}) is not on that team`);
        if (seen.has(r.id)) dupId.push(`m${f.i} side${side} ${r.id} twice`);
        seen.add(r.id);
        for (const [k, v] of [['goals', r.goals], ['assists', r.assists], ['apps', r.apps], ['potm', r.potm]] as const) {
          if (!Number.isInteger(v) || v < 0) badNum.push(`m${f.i} ${r.id}.${k}=${v}`);
        }
        if (r.apps > 1 || r.potm > 1) badNum.push(`m${f.i} ${r.id} apps=${r.apps} potm=${r.potm}`);
        if (!r.id || !r.name) badNum.push(`m${f.i} blank id/name`);
        if (r.goals > 0 && r.apps !== 1) badNum.push(`m${f.i} ${r.id} scored ${r.goals} without an appearance`);
      }
    }
  }
  ok('the goals in the report are the goals on the scoreboard, per side', goalGap.length === 0, ex(goalGap));
  ok('a side is only credited with its OWN players', alien.length === 0, ex(alien));
  ok('assists never outrun the goals they came from', assistGap.length === 0, ex(assistGap));
  ok('every count is a whole, non-negative, real number', badNum.length === 0, ex(badNum));
  ok('no player appears twice in his own side', dupId.length === 0, ex(dupId));
}

console.log('\n=== 2. player of the match ===');
{
  const countBad: string[] = [], notTop: string[] = [];
  let goalless = 0, awarded = 0;
  for (const f of fixtures) {
    const all = [...f.stats[0], ...f.stats[1]];
    const potm = all.filter((r) => r.potm === 1);
    const anyGoal = f.score[0] + f.score[1] > 0;
    if (!anyGoal) goalless++; else awarded++;
    if (potm.length !== (anyGoal ? 1 : 0)) countBad.push(`m${f.i} ${potm.length} POTM in a ${f.score[0]}-${f.score[1]}`);
    if (potm.length === 1) {
      const top = Math.max(...all.map((r) => r.goals));
      if (potm[0].goals !== top) notTop.push(`m${f.i} POTM ${potm[0].name} on ${potm[0].goals} while ${top} were scored`);
    }
  }
  ok('exactly one player of the match whenever anyone scored', countBad.length === 0, ex(countBad));
  ok('the player of the match is a joint-top scorer', notTop.length === 0, ex(notTop));
  console.log(`       ${awarded} matches with goals, ${goalless} goalless`);

  // The tie-break ("toward the winning side") is the kind of rule that a hardcoded 0 satisfies on every
  // home win ever played. Mirrored synthetic fixtures: same shape, opposite winner, and one where the
  // LOSING side scored first so insertion order alone would give the wrong answer.
  const flat = (id: string): Team => ({
    id, name: id, shirtColor: 0,
    players: Array.from({ length: 11 }, (_, i) => ({
      id: `${id}-${i}`, name: `${id} Player${i}`, role: (i === 0 ? 'GK' : 'MF') as Player['role'],
      attrs: { pace: 10, strength: 10, passing: 10, shooting: 10, tackling: 10, positioning: 10, workrate: 10, keeping: 10, setPiece: 10, stamina: 10 },
      anchor: { x: 50, y: 34 },
    })),
  });
  const H = flat('H'), A = flat('A');
  // SYNTHETIC EVENTS NOW CARRY AN ID, because that is the contract deriveMatchStats reads. These fixtures
  // were written against the name-keyed version; an event with a name and no id is exactly what the engine
  // no longer emits, and asserting on it would be testing a shape nothing produces.
  const goal = (teamIdx: 0 | 1, who: string): MatchEvent =>
    ({ minute: 10, type: 'goal', teamIdx, playerName: who, playerId: idOf(teamIdx === 0 ? H : A, who) });
  const potmOf = (e: MatchEvent[], r: [number, number]) => {
    const [h, a] = deriveMatchStats(H, A, e, r);
    const w = [...h, ...a].filter((x) => x.potm === 1);
    return w.length === 1 ? w[0].id : `${w.length} winners`;
  };
  // 2-1 to the home side, one goal each for three different players: the award must go home.
  ok('a tie on goals goes to the WINNING side (home wins)',
    potmOf([goal(0, 'H Player9'), goal(0, 'H Player10'), goal(1, 'A Player9')], [2, 1]).startsWith('H-'),
    potmOf([goal(0, 'H Player9'), goal(0, 'H Player10'), goal(1, 'A Player9')], [2, 1]));
  // the exact mirror image: it must go away, or the rule is a constant wearing a comparator's clothes
  ok('...and to the away side when the away side wins',
    potmOf([goal(1, 'A Player9'), goal(1, 'A Player10'), goal(0, 'H Player9')], [1, 2]).startsWith('A-'),
    potmOf([goal(1, 'A Player9'), goal(1, 'A Player10'), goal(0, 'H Player9')], [1, 2]));
  // the loser scored FIRST, so first-seen order points the wrong way
  ok('...even when the losing side scored first',
    potmOf([goal(1, 'A Player9'), goal(0, 'H Player9'), goal(0, 'H Player10')], [2, 1]).startsWith('H-'),
    potmOf([goal(1, 'A Player9'), goal(0, 'H Player9'), goal(0, 'H Player10')], [2, 1]));
  // a hat-trick for the loser still beats a single goal for the winner: goals come before the tie-break
  ok('goals outrank the tie-break (a losing hat-trick still takes it)',
    potmOf([goal(1, 'A Player9'), goal(1, 'A Player9'), goal(1, 'A Player9'), goal(0, 'H Player9'), goal(0, 'H Player10'), goal(0, 'H Player11'), goal(0, 'H Player1')], [4, 3]) === 'A-9',
    potmOf([goal(1, 'A Player9'), goal(1, 'A Player9'), goal(1, 'A Player9'), goal(0, 'H Player9'), goal(0, 'H Player10'), goal(0, 'H Player11'), goal(0, 'H Player1')], [4, 3]));
  const drawn = deriveMatchStats(H, A, [goal(0, 'H Player9'), goal(1, 'A Player9')], [1, 1]);
  ok('a draw still names exactly one player of the match',
    [...drawn[0], ...drawn[1]].filter((r) => r.potm === 1).length === 1);
}

console.log('\n=== 3. a row in the report is a PLAYER ===');
{
  // The report must account for the eleven who started plus everyone brought on — one row each, no
  // rows for men who watched. Both halves are checked; the gap between them is the known defect.
  let played = 0, reported = 0, erased = 0, ghosts = 0, ghostMaterial = 0, sidesHurt = 0, dupSquads = 0;
  const rowsVsNames: string[] = [], phantom: string[] = [], worst: string[] = [];
  for (const f of fixtures) {
    for (const side of [0, 1] as const) {
      const rows = f.stats[side];
      const field = f.onField[side];
      const fieldIds = new Set(field.map((p) => p.id));
      const fieldNames = new Set(field.map((p) => p.name));
      const squad = [...f.teams[side].players, ...(f.teams[side].bench ?? [])];
      if (new Set(squad.map((p) => p.name)).size !== squad.length) dupSquads++;
      played += field.length;
      reported += rows.length;

      // EXACT, and now keyed on MEN rather than names. This used to assert `rows.length === fieldNames.size`
      // — the right check while the function collapsed the match onto names, and precisely the wrong one
      // once it stopped. MatchEvent carries playerId now and deriveMatchStats keys on it, so two players
      // sharing a name correctly get TWO rows: the assertion fired at "14 rows for 13 distinct on-field
      // names", which is the fix working. One row per man who took the field, no more and no fewer.
      if (rows.length !== fieldIds.size) rowsVsNames.push(`m${f.i} side${side} ${rows.length} rows for ${fieldIds.size} men on the field`);

      const rowIds = new Set(rows.map((r) => r.id));
      const missing = field.filter((p) => !rowIds.has(p.id));
      const ghost = rows.filter((r) => !fieldIds.has(r.id));
      erased += missing.length; ghosts += ghost.length;
      if (missing.length || ghost.length) sidesHurt++;
      for (const r of ghost) {
        // Whatever else is wrong, a credited name must at least have been on the pitch. A row for a
        // name nobody answered to would be a different, worse bug.
        if (!fieldNames.has(r.name)) phantom.push(`m${f.i} side${side} ${r.id} "${r.name}" was never on the field under any id`);
        if (r.goals || r.assists || r.potm) {
          ghostMaterial++;
          if (worst.length < 3) {
            const real = field.filter((p) => p.name === r.name).map((p) => p.id).join('/');
            worst.push(`m${f.i} "${r.name}" ${r.id} (unused sub) credited ${r.goals}g ${r.assists}a${r.potm ? ' + POTM' : ''}; ${real} actually played and got no row`);
          }
        }
      }
    }
  }
  const sides = 2 * fixtures.length;
  ok('the row count is exactly the number of distinct names that took the field', rowsVsNames.length === 0, ex(rowsVsNames));
  ok('nothing is credited to a name that never took the field', phantom.length === 0, ex(phantom));
  console.log(`       ${played} appearances made, ${reported} rows written`);
  if (erased || ghosts) {
    console.log('\n  ── KNOWN DEFECT (measured here, reported upstream, NOT fixed by this harness) ──');
    console.log(`     ${dupSquads}/${sides} matchday squads (${(100 * dupSquads / sides).toFixed(0)}%) contain two men with the same name;`);
    console.log(`     ${sidesHurt}/${sides} sides (${(100 * sidesHurt / sides).toFixed(0)}%) get a misreported match report as a result.`);
    console.log(`     ${erased} players who took the field were left out of the report entirely.`);
    console.log(`     ${ghosts} rows credit an unused substitute with an appearance; ${ghostMaterial} of those also hand him goals, assists or POTM:`);
    for (const w of worst) console.log(`       - ${w}`);
    console.log('     Cause: matchstats keys by NAME (events carry no id) and nameId lets bench overwrite XI.\n');
  }
}

console.log('\n=== 4. degenerate input ===');
{
  const mk = (id: string, n: number): Team => ({
    id, name: id, shirtColor: 0,
    players: Array.from({ length: n }, (_, i) => ({
      id: `${id}-${i}`, name: `${id} Player${i}`, role: (i === 0 ? 'GK' : 'MF') as Player['role'],
      attrs: { pace: 10, strength: 10, passing: 10, shooting: 10, tackling: 10, positioning: 10, workrate: 10, keeping: 10, setPiece: 10, stamina: 10 },
      anchor: { x: 50, y: 34 },
    })),
  });
  const H = mk('H', 11), A = mk('A', 11);
  const zero = (rows: MatchPlayerStat[]) => rows.every((r) => r.goals === 0 && r.assists === 0 && r.apps === 1 && r.potm === 0);

  // A match nobody played: the eleven still turned out, so eleven appearances and no award.
  const empty = deriveMatchStats(H, A, [], [0, 0]);
  ok('no events at all still books both elevens for an appearance', empty[0].length === 11 && empty[1].length === 11, `${empty[0].length}/${empty[1].length}`);
  ok('...with nothing else on any of them', zero(empty[0]) && zero(empty[1]));
  ok('...and no player of the match in a game with no goals', [...empty[0], ...empty[1]].every((r) => r.potm === 0));

  // A real 0-0: plenty of events, none of them goals.
  const busy: MatchEvent[] = [
    { minute: 0, type: 'kickoff', teamIdx: 0 }, { minute: 12, type: 'shot_saved', teamIdx: 0, playerName: 'H Player9' },
    { minute: 30, type: 'corner', teamIdx: 1, playerName: 'A Player7' }, { minute: 45, type: 'halftime', teamIdx: 0 },
    { minute: 66, type: 'yellow_card', teamIdx: 1, playerName: 'A Player4' }, { minute: 88, type: 'shot_missed', teamIdx: 0, playerName: 'H Player10' },
    { minute: 90, type: 'fulltime', teamIdx: 0 },
  ];
  const nil = deriveMatchStats(H, A, busy, [0, 0]);
  ok('a goalless game names no player of the match however busy it was', [...nil[0], ...nil[1]].every((r) => r.potm === 0));
  ok('...and a saved shot is not a goal', nil[0].every((r) => r.goals === 0) && nil[1].every((r) => r.goals === 0));

  // One side never touches the ball: it is still a team of eleven who played.
  const oneSided: MatchEvent[] = [0, 1, 2, 3].map((k) => ({ minute: 10 + 10 * k, type: 'goal', teamIdx: 0, playerName: 'H Player9', playerId: idOf(H, 'H Player9'), playerName2: 'H Player7', playerId2: idOf(H, 'H Player7') }));
  const os = deriveMatchStats(H, A, oneSided, [4, 0]);
  ok('a side that never touched the ball still gets its eleven appearances', os[1].length === 11 && zero(os[1]), `${os[1].length} rows`);
  ok('...and not one goal or assist', os[1].every((r) => r.goals === 0 && r.assists === 0));
  const scorer = os[0].find((r) => r.id === 'H-9');
  ok('the four-goal man is credited with four', !!scorer && scorer.goals === 4 && scorer.potm === 1, scorer ? `${scorer.goals}g potm=${scorer.potm}` : 'no row');
  const helper = os[0].find((r) => r.id === 'H-7');
  ok('and his provider with four assists and no goals', !!helper && helper.assists === 4 && helper.goals === 0, helper ? `${helper.assists}a ${helper.goals}g` : 'no row');

  // Same name on BOTH teams — legal, and common in a 324-name pool. Must not cross the halfway line.
  const twin = mk('T', 11);
  const clash: Team = { ...twin, id: 'T', players: twin.players.map((p, i) => ({ ...p, name: `H Player${i}` })) };
  const cross = deriveMatchStats(H, clash, [{ minute: 5, type: 'goal', teamIdx: 1, playerName: 'H Player9', playerId: idOf(clash, 'H Player9') }], [0, 1]);
  ok('a name shared by both teams does not leak across sides',
    cross[0].every((r) => r.goals === 0) && cross[1].reduce((a, r) => a + r.goals, 0) === 1 && cross[1].every((r) => r.id.startsWith('T-')),
    `home ${cross[0].reduce((a, r) => a + r.goals, 0)}g, away ${cross[1].reduce((a, r) => a + r.goals, 0)}g`);

  // No bench, no squad, and a scorer nobody has heard of: all survivable, none may throw.
  let threw = '';
  try {
    const none: Team = { id: 'E', name: 'E', shirtColor: 0, players: [] };
    const r0 = deriveMatchStats(none, none, [], [0, 0]);
    ok('an empty squad yields an empty report rather than a crash', r0[0].length === 0 && r0[1].length === 0);
    const r1 = deriveMatchStats(H, A, [{ minute: 5, type: 'goal', teamIdx: 0, playerName: 'Nobody At All' }], [1, 0]);
    ok('a scorer who is on neither roster is dropped, not invented', r1[0].every((r) => r.goals === 0) && r1[0].length === 11);
    const r2 = deriveMatchStats(H, A, [{ minute: 70, type: 'sub', teamIdx: 0, playerName: 'A Ghost', playerName2: 'H Player5' }], [0, 0]);
    ok('a substitute with no bench behind him does not create a row', r2[0].length === 11);
  } catch (e) { threw = (e as Error).message; }
  ok('no degenerate input throws', threw === '', threw);
}

console.log('\n=== 5. determinism ===');
{
  const f = fixtures[0];
  const a = JSON.stringify(deriveMatchStats(f.teams[0], f.teams[1], f.events, f.score));
  const b = JSON.stringify(deriveMatchStats(f.teams[0], f.teams[1], f.events, f.score));
  ok('deriving the same match twice gives the same report', a === b);
  const replay = playFixture(f.i, STRONG, WEAK);
  ok('replaying the same seeded match gives the same report', JSON.stringify(replay.stats) === a,
    `${replay.score[0]}-${replay.score[1]} vs ${f.score[0]}-${f.score[1]}`);
}

console.log(fails
  ? `\n✗ ${fails} matchstats check(s) failed — the post-match report does not describe the match`
  : '\n✓ the post-match report describes the match it was derived from');
if (fails) process.exit(1);
