// A REBUILT SAVE MUST NOT PUT THE WHOLE HOUSE'S SILVERWARE IN ONE MAN'S SEND-OFF.
//
// `retireStar` prints "retires a club great after ${era}${honourLine}", and `era` is one generation while
// `titles` is a dynasty-LIFETIME counter that `resetMgrForHeir` deliberately carries. The subtraction that
// makes the sentence true is `titles - (m.titlesBanked ?? 0)`, and `resetMgrForHeir` is the ONLY place the
// normal path ever stamps that offset — send_off_honours.ts holds that path.
//
// `rebuiltMgrState` is the other door in. When localStorage is evicted (Safari clears it after seven idle
// days) the manager half is gone and the career is rebuilt out of the durable save, which restores the
// lifetime `titles` count and nothing to subtract from it. So the first retirement after an eviction read
// `titles - 0` and credited one man with every league title his fathers won — the same impossible sentence
// send_off_honours.ts exists to prevent, arriving through the recovery path instead of the normal one. And
// the recovery is durable, not transient: refreshHubPlayer persists the half-rebuilt state with saveMgr.
//
// Two details decide the number, and both are one token wide:
//   * THE BOUNDARY IS `<`, NOT `<=`. An honour is stamped with `profile.season` BEFORE the league roll
//     advances it (api.spSeasonReward), while `legacies[].retiredSeason` is read AFTER (api.succeed), so
//     the HEIR's first roll files `season_number === retiredSeason`. `<=` banks the heir's own first title
//     onto his father — the same class of wrong number in the other direction.
//   * `title === 1` IS NOT A LEAGUE PREDICATE. `addHonour` derives `title` from the finishing position
//     regardless of kind, and all three cup call sites pass `pos: 1` on a win, so continental and World
//     Finals wins are filed with `title: 1` and an empty tier. Counted raw they are printed as league
//     titles — while the cup lines themselves say nothing, because contTitles/wcWins are not rebuilt.
//     api.ts's sponsorship weighting already reads the right shape: `h.title && h.kind === 'league'`.
//
// main.ts is a DOM-coupled browser module nothing can import, so — like send_off_honours.ts next door —
// this probe LIFTS the real rebuild out of the file, EVALUATES it against a simulated durable save, and
// walks a five-generation dynasty past every moment an eviction could land on. If the rebuild can no
// longer be lifted the probe FAILS rather than quietly passing over nothing.
//
// Run: `npx tsx tools/playtest/mgr_rebuild_own_titles.ts`
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const srcPath = fileURLToPath(new URL('../../client/src/main.ts', import.meta.url));
const src = readFileSync(srcPath, 'utf8');
const apiSrc = readFileSync(fileURLToPath(new URL('../../client/src/api.ts', import.meta.url)), 'utf8');
const saveSrc = readFileSync(fileURLToPath(new URL('../../client/src/save.ts', import.meta.url)), 'utf8');
const ast = ts.createSourceFile(srcPath, src, ts.ScriptTarget.ESNext, true);
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The clocks and counters this check reads are still the ones the game writes ===');

// The premises. If any of these move, the walk below is measuring a game that no longer exists and the
// derivation it checks would need rewriting, not the probe.
ok(/pos, pos === 1 \? 1 : 0, Date\.now\(\), prize \+ sponsorBonus, kind\)/.test(apiSrc),
   "addHonour still stamps `title` from the finishing position regardless of kind — a cup win is filed title:1");
ok(/if \(kind === 'league'\) model\.profile\.season = season \+ 1;/.test(apiSrc),
   'an honour is still stamped with the season BEFORE the league roll advances profile.season');
ok(/const retiredSeason = getActiveModel\(\)\.profile\.season/.test(apiSrc),
   'retiredSeason is still read AFTER that increment — which is why the banking boundary is `<`, not `<=`');
ok(/coin_reward: coinReward, kind \}\)/.test(saveSrc),
   'every honour row still carries its `kind`, so a league title can be told from a cup');
ok(/const ownTitles = Math\.max\(0, titles - \(m\.titlesBanked \?\? 0\)\);/.test(src),
   'the send-off still subtracts `titlesBanked` — that is the number this probe measures');
ok(/titlesBanked: prior\.titles \?\? 0/.test(src),
   'resetMgrForHeir is still the only place the NORMAL path stamps the offset');

/** The body of a named class method — its own body, not the bytes that happen to follow it. */
function methodBody(name: string): ts.Node | null {
  let found: ts.Node | null = null;
  const visit = (n: ts.Node): void => {
    if (found) return;
    if (ts.isMethodDeclaration(n) && n.name && ts.isIdentifier(n.name) && n.name.text === name && n.body) { found = n.body; return; }
    ts.forEachChild(n, visit);
  };
  visit(ast);
  return found;
}

/** `rebuiltMgrState` itself, as a callable of the durable save. Its only two reaches outside the model are
 *  `getActiveModel()` (the save it rebuilds from) and `this.setClubTier` (a write this probe does not care
 *  about); both are substituted. ANY OTHER `this.` means the method grew a reach this lift does not model,
 *  and the lift returns null so the assertions below fail loudly instead of measuring a stale shape. */
function liftRebuild(): ((model: any) => any) | null {
  const body = methodBody('rebuiltMgrState');
  if (!body) return null;
  let text = body.getText(ast);
  if (!/getActiveModel\(\)/.test(text)) return null;
  text = text.replace(/getActiveModel\(\)/g, 'MODEL').replace(/this\.setClubTier/g, 'setClubTier');
  if (/\bthis\./.test(text)) return null;
  const js = ts.transpileModule(`function rebuilt(MODEL, setClubTier) ${text}`,
    { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  try {
    const fn = new Function(`${js}\nreturn rebuilt;`)() as (m: any, s: (t: number) => void) => any;
    return (model: any) => fn(model, () => { /* the tier write is a different assertion (mgr_state_recovery.ts) */ });
  } catch { return null; }
}

// ── A DYNASTY, WALKED THROUGH THE REAL WRITE ORDER ───────────────────────────────────────────────────
type Honour = { season_number: number; tier: string; title: number; kind: string };
type Moment = { model: any; gen: number; when: string; ownLeague: number; ownCont: number; ownWc: number };

/** Per generation: how many seasons he served, and the generation-LOCAL season indices in which he won
 *  the league / the continental cup / the World Finals. Gen 2 wins the league in his FIRST season on
 *  purpose — that is the one moment a `<=` boundary gets wrong, and without it the boundary is untested. */
const GENS = [
  { seasons: 6, league: [1, 3, 5], cont: [2], wc: [] as number[] },
  { seasons: 5, league: [0, 4], cont: [], wc: [1] },
  { seasons: 4, league: [] as number[], cont: [], wc: [] },   // a trophyless heir — the sharpest form of the defect
  { seasons: 3, league: [0, 2], cont: [1], wc: [] },
  { seasons: 5, league: [0, 3], cont: [], wc: [2] },
];

/** Both entry paths land on the same shape and so are covered by one walk: on the RETIREMENT path the
 *  final roll files season S, profile.season becomes S+1 and retiredSeason is S+1; on the mid-season SALE
 *  path (acceptStarBid) the last completed roll filed S-1 and retiredSeason is S. Either way the heir's
 *  first roll files `season_number === retiredSeason`. */
function walk(): Moment[] {
  const moments: Moment[] = [];
  let profileSeason = 0;                       // freshSave
  const honours: Honour[] = [];
  const legacies: { retiredSeason: number }[] = [];
  const snapshot = () => ({
    profile: { season: profileSeason },
    legacies: legacies.map((l) => ({ ...l })),
    honours: honours.map((h) => ({ ...h })),
    tokens: [],
  });
  GENS.forEach((g, gi) => {
    let ownLeague = 0, ownCont = 0, ownWc = 0;
    const mark = (when: string) => moments.push({ model: snapshot(), gen: gi + 1, when, ownLeague, ownCont, ownWc });
    for (let s = 0; s < g.seasons; s++) {
      mark(`gen ${gi + 1} season ${s + 1}, before the season`);
      // Cups are filed DURING the season and move no clock (PT-94): empty tier, and title 1 on a win.
      if (g.cont.includes(s)) { honours.push({ season_number: profileSeason, tier: '', title: 1, kind: 'continental' }); ownCont++; }
      if (g.wc.includes(s)) { honours.push({ season_number: profileSeason, tier: '', title: 1, kind: 'world' }); ownWc++; }
      if (g.cont.includes(s) || g.wc.includes(s)) mark(`gen ${gi + 1} season ${s + 1}, cup won, league not yet rolled`);
      const won = g.league.includes(s);
      honours.push({ season_number: profileSeason, tier: '2', title: won ? 1 : 0, kind: 'league' });
      if (won) ownLeague++;
      profileSeason++;                         // spSeasonReward: the stamp above, THEN the increment
      // The send-off is rendered here, before api.succeed stamps the legacy — so this moment is the one
      // retireStar itself would read a rebuilt save at, and it must come out right too.
      mark(`gen ${gi + 1} season ${s + 1}, season rolled`);
    }
    legacies.push({ retiredSeason: profileSeason });   // api.succeed
  });
  return moments;
}

const MOMENTS = walk();
const leagueOf = (m: any) => (m.honours as Honour[]).filter((h) => h.title === 1 && h.kind === 'league');
const lastRetOf = (m: any) => Math.max(0, ...(m.legacies as any[]).map((l) => Number(l.retiredSeason) || 0));

/** The send-off figure a candidate rebuild produces, through retireStar's own subtraction. */
const ownTitlesOf = (r: any) => Math.max(0, (r?.titles ?? 0) - (r?.titlesBanked ?? 0));
function score(f: (m: any) => any) {
  let wrong = 0, worst = 0;
  for (const p of MOMENTS) {
    const got = ownTitlesOf(f(p.model));
    if (got !== p.ownLeague) { wrong++; worst = Math.max(worst, Math.abs(got - p.ownLeague)); }
  }
  return { wrong, worst };
}

console.log('\n=== ...and a rebuilt save hands the send-off the honours THAT man won ===');

const totalLeague = GENS.reduce((a, g) => a + g.league.length, 0);
const totalCups = GENS.reduce((a, g) => a + g.cont.length + g.wc.length, 0);
console.log(`  ..   ${MOMENTS.length} evictable moments across ${GENS.length} generations — ${totalLeague} league title(s) and ${totalCups} cup(s) won`);
// NOT VACUOUS. A walk that won nothing, or one whose generations never accumulate an inheritance, would
// make "said === won" trivially true at 0 === 0 everywhere. Both ends are pinned.
ok(totalLeague > 0 && totalCups > 0, `the walk actually wins both league titles and cups (${totalLeague} and ${totalCups})`);
ok(MOMENTS.some((p) => p.gen > 1 && lastRetOf(p.model) > 0 && leagueOf(p.model).length > p.ownLeague),
   'and reaches moments where an ancestor has silverware to be wrongly credited with');

// MUTATION CONTROLS. Each is a real derivation this file has shipped or been offered, and each is wrong.
// If the walk above could not catch them, the assertion under them would be passing over nothing.
const CONTROLS: Array<[string, (m: any) => any]> = [
  ['what ships today — the lifetime count with no offset at all',
   (m) => ({ titles: (m.honours as Honour[]).filter((h) => h.title === 1).length })],
  ['the offset stamped, but at `<=` instead of `<`',
   (m) => { const lr = lastRetOf(m), w = leagueOf(m); return { titles: w.length, titlesBanked: w.filter((h) => h.season_number <= lr).length }; }],
  ["the offset stamped, but `title === 1` read as a league predicate (cups counted as titles)",
   (m) => { const lr = lastRetOf(m), w = (m.honours as Honour[]).filter((h) => h.title === 1); return { titles: w.length, titlesBanked: w.filter((h) => h.season_number < lr).length }; }],
];
for (const [name, f] of CONTROLS) {
  const s = score(f);
  console.log(`  ..   ${name}: wrong at ${s.wrong} of ${MOMENTS.length} moments, worst by ${s.worst} title(s)`);
  ok(s.wrong > 0, `the walk can see "${name}" go wrong at all`);
}

const rebuilt = liftRebuild();
ok(rebuilt != null, 'rebuiltMgrState could still be lifted and evaluated — otherwise this probe is blind and must be re-pointed');

if (rebuilt) {
  const s = score(rebuilt);
  console.log(`  ..   the shipped rebuild: wrong at ${s.wrong} of ${MOMENTS.length} moments, worst by ${s.worst} title(s)`);
  const bad = MOMENTS.map((p) => ({ p, got: ownTitlesOf(rebuilt(p.model)) })).filter((x) => x.got !== x.p.ownLeague)[0];
  if (bad) console.log(`  ..   first divergence — ${bad.p.when}: the send-off would say ${bad.got} league title(s) for a man who won ${bad.p.ownLeague}`);
  ok(s.wrong === 0, `a rebuilt save's send-off names only that man's league titles (${s.wrong} of ${MOMENTS.length} moments wrong, worst by ${s.worst})`);

  // AND IT MUST NEVER CLAIM A CUP IT CANNOT SUBSTANTIATE. `contTitles`/`wcWins` are not restored at all,
  // so a rebuilt send-off names no cups — an accepted under-count (silence beats a false claim; re-summing
  // the cup honours is a bigger change than this one). What is NOT acceptable is the pair drifting the
  // other way: restore a cup counter without its banked mark and the send-off starts crediting one man
  // with his fathers' cups, which is exactly the defect above wearing a different trophy.
  const over = MOMENTS.filter((p) => {
    const r = rebuilt(p.model);
    return Math.max(0, (r?.contTitles ?? 0) - (r?.contBanked ?? 0)) > p.ownCont
        || Math.max(0, (r?.wcWins ?? 0) - (r?.wcBanked ?? 0)) > p.ownWc;
  });
  ok(over.length === 0, `and never claims more cups than that man won (${over.length} of ${MOMENTS.length} moments over-claimed)`);
}

console.log(fails ? `\n✗ ${fails} check(s) failed — a recovered dynasty's send-off reads out the whole house's silverware` : '\n✓ a recovered save credits each man with only the titles he won');
if (fails) process.exitCode = 1;
