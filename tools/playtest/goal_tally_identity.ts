// A BRACE IS A CLAIM ABOUT ONE MAN, SO THE TALLY MUST BE KEYED TO ONE MAN.
//
// `goalLine` counted a scorer's goals in `scorerTally` keyed by his BARE NAME, and a name is not an
// identity here: `generateClub` draws a twenty-man roster from 18 first names x 18 surnames, so ~36% of
// matchday squads contain two men called the same thing (types.ts:140). Two namesakes' goals merged into
// one count, and that count fires the loudest note in the game — "His second!", "HAT-TRICK!!", "That's 5
// for him today!" — on a line the full-time report then contradicts.
//
// Measured over the 400 fixtures below: 4 goal lines of 1,188 announced a tally the scorer had not reached,
// ALL FOUR from namesakes on the same side — which is why copying the report's `teamIdx|name` key
// (main.ts:6080) would not have fixed it. Only `playerId` separates those two men.
//
// main.ts is a browser module nothing can import, so this probe LIFTS goalLine's tally statements out of
// the file and runs them — over a real same-name pair, then over the goal events of 400 seeded matches —
// rather than eyeballing the key. If the statements can no longer be found it FAILS rather than quietly
// passing over nothing. The corpus rate is thin by nature (both namesakes have to score in one match), so
// the same-name pair check carries the regression on its own and cannot go vacuous.
//
// Run: `npx tsx tools/playtest/goal_tally_identity.ts`
import { readFileSync } from 'node:fs';
import { MatchEngine, generateClub, autoPickXI, buildXI, seededOpponentTactics } from '@fm/shared';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The goal tally counts a player, not a name ===');

const src = readFileSync('client/src/main.ts', 'utf8');

/** Lift goalLine's running-tally statements into a runnable `(tally, goalEvent) => n`. The slice runs from
 *  `const raw` to the end of the `scorerTally.set` line — everything that decides the number, nothing that
 *  touches the DOM. `this.scorerTally` becomes the map handed in; any other `this.` would mean the count
 *  had come to depend on client state a probe cannot supply, so refuse rather than guess. */
function tallyFn(): ((tally: Map<string, number>, e: any) => number) | null {
  const at = src.indexOf('  private goalLine(');
  if (at < 0) return null;
  const body = src.slice(at, src.indexOf('\n  }', at));
  const i = body.indexOf('const raw =');
  const j = body.indexOf('this.scorerTally.set(');
  if (i < 0 || j < i) return null;
  const end = body.indexOf('\n', j);
  const seg = (end < 0 ? body.slice(i) : body.slice(i, end)).replace(/this\.scorerTally/g, 'tally');
  if (/this\./.test(seg)) return null;
  try { return new Function('tally', 'e', seg + '\n return n;') as any; } catch { return null; }
}

const step = tallyFn();
ok(!!step, 'goalLine\'s running tally could be lifted out of main.ts and replayed');
if (!step) { console.log('\n✗ the tally statements have moved — update this probe, do not delete it'); process.exit(1); }

const MATCHES = 400;
let goals = 0, ambiguous = 0, wrong = 0, matches = 0;
/** first real squad found carrying two different men under one name — the case the key exists for */
let pair: { team: 0 | 1; name: string; a: string; b: string } | null = null;
const samples: string[] = [];
for (let i = 0; i < MATCHES; i++) {
  const a = generateClub('gt-a' + i, 'A', 0x3b6bd2, 11, 4100 + i, true);
  const b = generateClub('gt-b' + i, 'B', 0xcc4444, 11, 8100 + i, true);
  const ta = seededOpponentTactics(4100 + i), tb = seededOpponentTactics(8100 + i);
  const xa = buildXI(a, autoPickXI(a, ta.formation)), xb = buildXI(b, autoPickXI(b, tb.formation));
  const e = new MatchEngine([xa, xb], (5150 ^ i) >>> 0, [ta, tb] as any);
  let g = 0; while (!e.state.finished && g++ < 40000) e.tick();
  matches++;
  // who is on the pitch under each name today — the collision surface the key has to survive
  const idsByName = new Map<string, Set<string>>();
  for (const [t, xi] of ([xa, xb] as any[]).entries()) {
    for (const p of [...xi.players, ...(xi.bench ?? [])]) {
      const s = idsByName.get(p.name) ?? new Set<string>(); s.add(p.id); idsByName.set(p.name, s);
      if (!pair) {
        const same = [...xi.players, ...(xi.bench ?? [])].filter((q: any) => q.name === p.name && q.id !== p.id)[0];
        if (same) pair = { team: t as 0 | 1, name: p.name, a: p.id, b: same.id };
      }
    }
  }
  const tally = new Map<string, number>();   // startMatch hands goalLine a fresh one per match
  const truth = new Map<string, number>();
  for (const ev of e.state.events as any[]) {
    if (ev.type !== 'goal') continue;
    goals++;
    const name = ev.playerName ?? 'someone';
    if ((idsByName.get(name)?.size ?? 1) > 1) ambiguous++;
    const n = step(tally, ev);
    const k = `${ev.teamIdx}|${ev.playerId}`;
    const t = (truth.get(k) ?? 0) + 1; truth.set(k, t);
    if (n !== t) {
      wrong++;
      const shout = n === 2 ? 'His second!' : n === 3 ? 'HAT-TRICK!!' : `That’s ${n} for him today!`;
      if (samples.length < 6) samples.push(`fixture ${i}, ${ev.minute}' ${name}: shouted “${shout}” on goal ${t}`);
    }
  }
}

// THE DIRECT CASE, and the one that can never measure nothing: two different men of one name, both
// scoring. Keyed on the name the second man's FIRST goal comes back as 2 and prints "His second!".
console.log(`  ..   sample namesakes: ${pair ? `${pair.name} (${pair.a} and ${pair.b}, both side ${pair.team})` : 'none found'}`);
ok(!!pair, 'a real squad carries two men under one name, or this check proves nothing');
if (pair) {
  const t2 = new Map<string, number>();
  const goal = (id: string, minute: number) => step(t2, { minute, type: 'goal', teamIdx: pair!.team, playerName: pair!.name, playerId: id });
  const first = goal(pair.a, 22), second = goal(pair.b, 71), third = goal(pair.a, 84);
  ok(first === 1 && second === 1, `his namesake's first goal is announced as a first, not a brace (${first} then ${second})`);
  ok(third === 2, `and the first man's own second goal still counts as two (${third})`);
}

console.log(`  ..   ${matches} fixtures, ${goals} goal line(s)`);
console.log(`  ..   ${ambiguous} of them (${((ambiguous / goals) * 100).toFixed(1)}%) scored by a man whose name is worn by someone else on the pitch`);
for (const s of samples) console.log(`  ..   ${s}`);
ok(goals > 0, `goals are scored at all (${goals})`);
ok(ambiguous > 0, `namesakes get on the scoresheet, or the corpus check below measures nothing (${ambiguous})`);
// THE REGRESSION IN REAL PLAY. Keyed on the bare name this reads 4 of 1,188.
ok(wrong === 0, `no goal line announces a tally its scorer has not reached (${wrong} of ${goals})`);

console.log(fails ? `\n✗ ${fails} — the feed is shouting braces that did not happen` : '\n✓ every brace and hat-trick belongs to the man it names');
if (fails) process.exitCode = 1;
