// THE FULL-TIME REPORT COUNTS MEN, NOT NAMES.
//
// `renderMatchReport` keyed its scorers, assists and Player-of-the-Match contributions by `teamIdx|name`,
// and a name is not an identity here: `generateClub` draws a twenty-man roster from 18 first names × 18
// surnames, so a squad routinely carries two different men under one name (types.ts:144). Two namesakes'
// goals merged into one "Scorers: Name (23', 67')" entry, their assists into one "Name ×2", and their
// contribution points into one POTM award — on the card that is the only place the match is written down,
// while the commentary feed one screen earlier (id-keyed since goalLine's `tkey`) named the right man about
// the same match. The two disagreed about the same ninety minutes.
//
// The fix is `playerId` for the scorer and `playerId2` for the ASSISTER — two different fields, and using
// the scorer's id for both would file every assist under its own goal, so that is checked here too. So is
// the star's key: `starKey` is looked up against the same contrib map, and an id-keyed map with a
// name-keyed `starKey` can never match again — the bloodline star's full-time spotlight would silently
// stop rendering on every report and the POTM tie-break would become a comparison that is always false.
// That is the "check that cannot fail" shape, and it would have been freshly introduced BY the fix.
//
// main.ts is a browser module nothing can import, so this probe LIFTS the report's keying statements out of
// the file and runs them — over a real same-name pair, then over the goal events of 400 seeded matches —
// rather than eyeballing the key. If the statements can no longer be found it FAILS rather than quietly
// passing over nothing. The corpus rate is thin by nature (both namesakes have to score in one match), so
// the same-name pair checks carry the regression on their own and cannot go vacuous.
//
// Run: `npx tsx tools/playtest/report_identity.ts`
import { readFileSync } from 'node:fs';
import { MatchEngine, generateClub, autoPickXI, buildXI, seededOpponentTactics } from '@fm/shared';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The full-time report names the man who did it ===');

const src = readFileSync('client/src/main.ts', 'utf8');

type Report = {
  goalsBy: Map<string, { team: 0 | 1; name: string; mins: number[] }>;
  assists: Map<string, { name: string; count: number }>;
  contrib: Map<string, { pts: number; team: 0 | 1; name: string; goals: number; assists: number }>;
  starKey: string | undefined;
};

/** Lift renderMatchReport's four keying blocks into a runnable `(events, starId, starName, myTeamIdx) =>
 *  { goalsBy, assists, contrib, starKey }`. Only the statements that decide the KEYS are taken — nothing
 *  that renders, and nothing that reads client state a probe cannot supply. If any block has moved, or any
 *  of them has come to depend on `this.`, refuse rather than guess: a lift that silently returns fewer
 *  blocks would measure nothing and report green. */
function lift(): ((events: any[], starId?: string, starName?: string, myTeamIdx?: 0 | 1) => Report) | null {
  const at = src.indexOf('  private renderMatchReport(');
  if (at < 0) return null;
  const end = src.indexOf('\n  }', at);
  if (end <= at) return null;
  const lines = src.slice(at, end).split('\n');
  const pick = (from: RegExp, to: RegExp): string | null => {
    const s = lines.findIndex((l) => from.test(l));
    if (s < 0) return null;
    const e = lines.findIndex((l, i) => i >= s && to.test(l));
    return e < s ? null : lines.slice(s, e + 1).join('\n');
  };
  const blocks = [
    pick(/const nkey = /, /^ {4}\}$/),                              // nkey + the scorers map
    pick(/const assists = new Map/, /assists\.set\(k, a2\);/),      // the assists map
    pick(/const contrib = new Map/, /if \(e\.playerName2\) bump\(/), // contributions + the bump loop
    pick(/const starKey = /, /const starKey = /),                   // the star's lookup key
  ];
  if (blocks.some((b) => b == null)) return null;
  const js = blocks.join('\n')
    .replace(/new Map<[^<>]*>\(/g, 'new Map(')                                        // Map<...> generics
    .replace(/([A-Za-z_$][\w$]*)\s*:\s*(?:0 \| 1|string|number)(?=\s*[,)])/g, '$1');   // parameter types
  if (/\bthis\./.test(js)) return null;
  try {
    return new Function('events', 'starId', 'starName', 'myTeamIdx',
      `${js}\nreturn { goalsBy, assists, contrib, starKey };`) as any;
  } catch { return null; }
}

const report = lift();
ok(!!report, 'the report\'s scorer/assist/POTM/star keys could be lifted out of main.ts and replayed');
if (!report) { console.log('\n✗ the report\'s keying has moved — update this probe, do not delete it'); process.exit(1); }

const goal = (minute: number, team: 0 | 1, name: string, id: string, name2?: string, id2?: string) =>
  ({ minute, type: 'goal', teamIdx: team, playerName: name, playerId: id, playerName2: name2, playerId2: id2 });

// ---------------------------------------------------------------------------------------------------
// THE DIRECT CASE, and the one that can never measure nothing: two different men of one name, both on the
// scoresheet. Keyed on the name they come back as ONE scorer with a brace.
const MATCHES = 400;
let pair: { team: 0 | 1; name: string; a: string; b: string } | null = null;
const fixtures: Array<{ events: any[]; idsByName: Map<string, Set<string>> }> = [];
for (let i = 0; i < MATCHES; i++) {
  const ca = generateClub('ri-a' + i, 'A', 0x3b6bd2, 11, 4100 + i, true);
  const cb = generateClub('ri-b' + i, 'B', 0xcc4444, 11, 8100 + i, true);
  const ta = seededOpponentTactics(4100 + i), tb = seededOpponentTactics(8100 + i);
  const xa = buildXI(ca, autoPickXI(ca, ta.formation)), xb = buildXI(cb, autoPickXI(cb, tb.formation));
  const e = new MatchEngine([xa, xb], (5150 ^ i) >>> 0, [ta, tb] as any);
  let g = 0; while (!e.state.finished && g++ < 40000) e.tick();
  const idsByName = new Map<string, Set<string>>();
  for (const [t, xi] of ([xa, xb] as any[]).entries()) {
    const squad = [...xi.players, ...(xi.bench ?? [])];
    for (const p of squad) {
      const s = idsByName.get(`${t}|${p.name}`) ?? new Set<string>(); s.add(p.id); idsByName.set(`${t}|${p.name}`, s);
      if (!pair) {
        const same = squad.filter((q: any) => q.name === p.name && q.id !== p.id)[0];
        if (same) pair = { team: t as 0 | 1, name: p.name, a: p.id, b: same.id };
      }
    }
  }
  fixtures.push({ events: e.state.events as any[], idsByName });
}

console.log(`  ..   sample namesakes: ${pair ? `${pair.name} (${pair.a} and ${pair.b}, both side ${pair.team})` : 'none found'}`);
ok(!!pair, 'a real squad carries two men under one name, or these checks prove nothing');
if (pair) {
  const { team, name, a, b } = pair;
  const r = report([goal(22, team, name, a), goal(71, team, name, b)]);
  ok(r.goalsBy.size === 2, `two namesakes who score once each are listed as two scorers, not one brace (${r.goalsBy.size} entr${r.goalsBy.size === 1 ? 'y' : 'ies'})`);
  ok([...r.goalsBy.values()].every((g) => g.mins.length === 1), `neither man's line claims the other's goal (${[...r.goalsBy.values()].map((g) => g.mins.length).join('+')})`);

  const asr = report([goal(30, team, 'Striker', 'sk1', name, a), goal(55, team, 'Striker', 'sk1', name, b)]);
  ok(asr.assists.size === 2, `their assists stay two men's assists, not one man's “×2” (${asr.assists.size})`);

  // The ⭐ spotlight and the POTM read the SAME contrib map, so a namesake inflates both.
  const st = report([goal(22, team, name, a), goal(71, team, name, b)], a, name, team);
  const sc = st.starKey ? st.contrib.get(st.starKey) : undefined;
  ok(!!sc, 'the bloodline star is still found in the contributions map at all — if this goes red the ⭐ full-time line has silently stopped rendering and the POTM tie-break can never fire');
  ok(sc?.goals === 1, `the ⭐ line credits the star with the one goal he scored, not his namesake's too (${sc?.goals})`);
  const top = [...st.contrib.values()].reduce((m, c) => Math.max(m, c.pts), 0);
  ok(top === 2, `no man is handed Player-of-the-Match points he did not earn (top ${top} pts, max earned 2)`);
}

// THE ASSISTER'S ID IS `playerId2`, NOT `playerId`. Keying the assist by the scorer's id would file every
// assist under its own goal and read perfectly green on every namesake check above.
{
  const r = report([goal(12, 0, 'Scorer', 's1', 'Assister', 'a1')]);
  const byName = new Map([...r.contrib.values()].map((c) => [c.name, c]));
  ok(r.contrib.size === 2, `a goal and its assist are two men's contributions (${r.contrib.size})`);
  ok(byName.get('Scorer')?.goals === 1 && byName.get('Scorer')?.assists === 0, 'the scorer is credited with the goal and no assist');
  ok(byName.get('Assister')?.assists === 1 && byName.get('Assister')?.goals === 0, 'the assister is credited with the assist and no goal');
}

// ---------------------------------------------------------------------------------------------------
// THE REGRESSION IN REAL PLAY. Thin by nature — two namesakes have to feature in the same ninety minutes —
// so the three categories are counted together into ONE assertion rather than three, two of which would
// read a permanent zero and prove nothing. The pair checks above are what actually holds this line.
let goals = 0, ambiguous = 0, mergedRows = 0, inflatedPotm = 0;
const merged = { scorers: 0, assists: 0, contributions: 0 };
const samples: string[] = [];
for (const [i, f] of fixtures.entries()) {
  // HOW MANY MEN the ninety minutes actually put on each list, counted by id — the report has to show that
  // many rows. Comparing counts rather than keys keeps this honest whatever shape the key ends up being.
  const men = { scorers: new Set<string>(), assists: new Set<string>(), contributions: new Set<string>() };
  const pts = new Map<string, number>();
  for (const ev of f.events) {
    if (ev.type !== 'goal') continue;
    goals++;
    if ((f.idsByName.get(`${ev.teamIdx}|${ev.playerName}`)?.size ?? 1) > 1) ambiguous++;
    if (ev.playerName) {
      const k = `${ev.teamIdx}|${ev.playerId}`;
      men.scorers.add(k); men.contributions.add(k); pts.set(k, (pts.get(k) ?? 0) + 2);
    }
    if (ev.playerName2) {
      const k = `${ev.teamIdx}|${ev.playerId2}`;
      men.assists.add(k); men.contributions.add(k); pts.set(k, (pts.get(k) ?? 0) + 1);
    }
  }
  const r = report(f.events);
  const ms = men.scorers.size - r.goalsBy.size, ma = men.assists.size - r.assists.size, mc = men.contributions.size - r.contrib.size;
  merged.scorers += ms; merged.assists += ma; merged.contributions += mc;
  mergedRows += ms + ma + mc;
  const truePeak = [...pts.values()].reduce((m, v) => Math.max(m, v), 0);
  const seenPeak = [...r.contrib.values()].reduce((m, c) => Math.max(m, c.pts), 0);
  if (seenPeak > truePeak) { inflatedPotm++; if (samples.length < 6) samples.push(`fixture ${i}: POTM row shows ${seenPeak} pts, the best single man earned ${truePeak}`); }
  if (ms + ma + mc && samples.length < 6) samples.push(`fixture ${i}: ${ms} scorer / ${ma} assist / ${mc} contribution row(s) short of the men who earned them`);
}

console.log(`  ..   ${fixtures.length} fixtures, ${goals} goal event(s)`);
console.log(`  ..   ${ambiguous} of them (${((ambiguous / goals) * 100).toFixed(1)}%) by a man whose name is worn by someone else on his own side`);
for (const s of samples) console.log(`  ..   ${s}`);
console.log(`  ..   merged rows — scorers ${merged.scorers}, assists ${merged.assists}, contributions ${merged.contributions}`);
ok(goals > 0, `goals are scored at all (${goals})`);
ok(ambiguous > 0, `namesakes get on the scoresheet, or the corpus checks below measure nothing (${ambiguous})`);
// Keyed on the bare name these read 2 merged rows and 1 inflated award across the 400 fixtures.
ok(mergedRows === 0, `no report row is built from two different men (${mergedRows} across ${fixtures.length} fixtures)`);
ok(inflatedPotm === 0, `no report awards Player of the Match on points no single man earned (${inflatedPotm} of ${fixtures.length})`);

console.log(fails ? `\n✗ ${fails} — the full-time card is crediting men with each other's work` : '\n✓ every scorer, assist and POTM on the card belongs to the man it names');
if (fails) process.exitCode = 1;
