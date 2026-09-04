// THE EPITHET MUST BELONG TO THE MAN THE LINE NAMES.
//
// Live commentary decorates a standout with a stat-derived epithet ("the lightning-quick Dario Silva").
// The renderer looked those attributes up in a map keyed by player NAME, built across BOTH matchday
// squads — and a name is not an identity in this game: `generateClub` draws from 18 first names x 18
// surnames for a twenty-man roster, which is why MatchEvent carries a playerId at all (types.ts:140).
// Last writer wins, and the away squad is written second, so it was usually the player's OWN description
// that got overwritten: a plodding centre-half called "lightning-quick" while his squad card, one screen
// later, says otherwise.
//
// Keying by id only helps if the id is THERE. The three heaviest banks — pass, tackle_won, loose_ball,
// together ~83% of the named lines in a match — were pushed by the engine's `flow()`, which took names
// and no ids, so an id-keyed renderer would have silently DROPPED their epithets instead of correcting
// them. That is the regression this probe exists to catch: it asserts COVERAGE (every named line can be
// resolved) alongside correctness, so a fix that repairs the lookup by starving it still fails here.
//
// Run: `npx tsx tools/playtest/commentary_identity.ts`
import { readFileSync } from 'node:fs';
import { MatchEngine, generateClub, autoPickXI, buildXI, seededOpponentTactics } from '@fm/shared';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const pct = (n: number, d: number) => (d ? ((100 * n) / d).toFixed(1) : '0.0') + '%';

const main = readFileSync('client/src/main.ts', 'utf8');

// The adjective table and the standout threshold are READ OUT OF THE RENDERER, never restated here — a
// probe that keeps its own copy of the thing it is checking drifts away from it and then lies both ways.
const table = [...main.matchAll(/\[a\.(\w+) \?\? 0, '([a-z-]+)'\]/g)].map((m) => [m[1], m[2]] as const);
const thresh = Number(/return top >= (\d+) \?/.exec(main)?.[1] ?? NaN);
// `cand.sort(desc)[0]` on a stable sort keeps the FIRST of equal values, so scan in table order taking
// strictly-greater: the same winner, without re-sorting.
const epithet = (a: any): string => {
  let bestV = -1, bestA = '';
  for (const [stat, adj] of table) { const v = a?.[stat] ?? 0; if (v > bestV) { bestV = v; bestA = adj; } }
  return bestV >= thresh ? bestA : '';
};
const shownAs = (nm: string, adj: string) => (adj ? `the ${adj} ${nm}` : nm);

console.log('=== Commentary identity: the epithet must belong to the man it names ===');
ok(table.length >= 6 && Number.isFinite(thresh),
   `descriptor()'s attribute table and threshold were parsed out of main.ts (${table.length} adjectives, standout at ${thresh})`);

const FLOW = new Set(['pass', 'tackle_won', 'loose_ball']);
const MATCHES = 120;
let namedLines = 0, mentions = 0, flowLines = 0, idLess = 0, id2Less = 0, unresolved = 0;
let knowable = 0, misdescribed = 0, ambiguous = 0, fixturesHit = 0;
const examples = new Set<string>();

for (let i = 0; i < MATCHES; i++) {
  const a = generateClub('ci-a' + i, 'Alpha', 0x3b6bd2, 11, 4100 + i, true);
  const b = generateClub('ci-b' + i, 'Beta', 0xcc4444, 11, 8100 + i, true);
  const ta = seededOpponentTactics(4100 + i), tb = seededOpponentTactics(8100 + i);
  const home = buildXI(a, autoPickXI(a, ta.formation)), away = buildXI(b, autoPickXI(b, tb.formation));
  const e = new MatchEngine([home, away], (5150 ^ i) >>> 0, [ta, tb] as any);
  let g = 0; while (!e.state.finished && g++ < 40000) e.tick();

  // Ground truth: who is actually on each teamsheet, by id.
  const byId = [home, away].map((t) => new Map([...t.players, ...(t.bench ?? [])].map((p) => [p.id, p])));
  // ...and the NAME-keyed map the renderer used to build, in its own insertion order (home XI, home
  // bench, away XI, away bench), so "what a name lookup would show" is reproduced, not guessed at.
  const byName = new Map<string, any>();
  const sharing = new Map<string, any[]>();
  for (const t of [home, away]) for (const p of [...t.players, ...(t.bench ?? [])]) {
    byName.set(p.name, p.attrs);
    sharing.set(p.name, [...(sharing.get(p.name) ?? []), p]);
  }

  let hit = false;
  for (const ev of e.state.events as any[]) {
    for (const first of [true, false]) {
      const nm = first ? ev.playerName : ev.playerName2, id = first ? ev.playerId : ev.playerId2;
      if (!nm) continue;
      mentions++;
      if (first) { namedLines++; if (FLOW.has(ev.type)) flowLines++; }
      // A name this fixture uses for two men the descriptor would describe DIFFERENTLY is a line the
      // feed cannot get right from the name alone — and neither can this probe.
      if ((sharing.get(nm) ?? []).some((p) => epithet(p.attrs) !== epithet(byName.get(nm)))) { ambiguous++; hit = true; }
      if (!id) { if (first) idLess++; else id2Less++; continue; }
      const man = byId[ev.teamIdx].get(id);
      if (!man || man.name !== nm) { unresolved++; continue; }   // an id threaded from the wrong Player
      knowable++;
      const truth = epithet(man.attrs), byname = epithet(byName.get(nm));
      if (truth !== byname) {
        misdescribed++;
        examples.add(`${ev.type} — is "${shownAs(nm, truth)}", a name lookup prints "${shownAs(nm, byname)}"`);
      }
    }
  }
  if (hit) fixturesHit++;
}

console.log(`  ..   ${MATCHES} fixtures, ${namedLines} lines naming a player (${(namedLines / MATCHES).toFixed(0)}/match; ${pct(flowLines, namedLines)} of them pass/tackle_won/loose_ball)`);
console.log(`  ..   identity resolvable from the event: ${knowable} of ${mentions} player mentions (${pct(knowable, mentions)})`);
console.log(`  ..   among the resolvable ones, a NAME-keyed attribute map describes the wrong man ${misdescribed} times (${pct(misdescribed, knowable)})`);
for (const x of [...examples].slice(0, 3)) console.log(`  ..     e.g. ${x}`);
console.log(`  ..   ${fixturesHit} of ${MATCHES} fixtures (${pct(fixturesHit, MATCHES)}) print at least one line whose name is shared by a differently-described man`);

// NON-VACUITY. With no duplicate names, or no lines naming anybody, every assertion below is satisfied by
// an empty set — the failure mode that let four dead `transition: width` rules live here for months. To
// mutation-test: force `sharing` to a single man per fixture and these three must go red.
ok(namedLines > 0, `commentary actually names players, or this check proves nothing (${namedLines})`);
ok(ambiguous > 0, `shared names actually reach the feed, or this check proves nothing (${ambiguous} mentions)`);
ok(misdescribed > 0, `name-keying actually misdescribes somebody, or this check proves nothing (${misdescribed})`);

// The engine half: the id must EXIST on every line that names a man, or an id-keyed renderer goes quiet.
ok(idLess === 0, `every line naming a player carries a playerId (${idLess} of ${namedLines} do not)`);
ok(id2Less === 0, `every line naming a second player carries a playerId2 (${id2Less} do not)`);
ok(unresolved === 0, `every (name, id) pair is that man on the ACTING side's teamsheet (${unresolved} mismatched)`);

// The renderer half: holding the id is useless while the lookup still goes by name.
ok(!/playerAttrs\.set\(p\.name/.test(main), 'the renderer no longer keys player attributes by NAME');
ok((main.match(/playerAttrs\.set\(p\.id, p\.attrs\)/g) ?? []).length === 2, 'both the XI and the bench are keyed by player id');
ok(/private descriptor\([^)]*\bid\?: string\)/.test(main) && /this\.playerAttrs\.get\(id\)/.test(main),
   'descriptor() resolves the player by id');
const sites = [...main.matchAll(/this\.descriptor\(([^)]*)\)/g)];
ok(sites.length >= 2 && sites.every((m) => /e\.playerId/.test(m[1])),
   `every descriptor() call site hands it the event's playerId (${sites.filter((m) => /e\.playerId/.test(m[1])).length} of ${sites.length})`);

console.log(fails ? `\n✗ ${fails} commentary-identity check(s) failed — the feed describes the wrong man` : '\n✓ every epithet is earned by the player it is printed against');
if (fails) process.exitCode = 1;
