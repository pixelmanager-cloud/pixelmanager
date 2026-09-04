// A REBUILT SAVE MUST COME BACK IN THE SEASON IT WAS IN, NOT THE ONE THE DYNASTY HAS REACHED.
//
// `rebuiltMgrState` is the recovery for an evicted localStorage: the manager half is gone, so it rebuilds
// MgrState out of the durable save. It took the season straight off `profile.season` — and those are two
// different clocks. `profile.season` is a LIFETIME counter: 0 at freshSave, +1 at every league roll in
// spSeasonReward, never reset. `MgrState.season` is PER-GENERATION: 1 at the start, +1 per roll, and back
// to 1 at every succession (resetMgrForHeir). So the rebuild was one season adrift inside generation one
// and roughly a generation's worth further adrift with every handover after it.
//
// That is not a caption being wrong. `m.season` seeds seasonResultSeed, the continental opponent, the
// transfer list and house listings, the incoming bid, the board's standing and the arc pacing salt, and
// `wcEditionDue` reads `m.season % 4` and `m.season / 4` — so a recovered third-generation save came back
// reading "Season 27" for a manager in his fourth year, into a differently-seeded league and market, and
// either skipped the World Finals or staged the wrong edition of it. `retireStar` then narrates that
// number as the man's career length and `familyRecord` banks it, so the wrong figure outlives the save.
//
// The durable save can answer the question: `legacies[].retiredSeason` is stamped from `profile.season`
// at the succession itself (api.succeed), i.e. on the same clock, one row per generation.
//
// Checked at the source level because main.ts is a browser module nothing can import: the probe LIFTS the
// derivation out of the file and evaluates it against a simulated career, rather than eyeballing it, so
// any future rewrite is measured the same way. If the derivation can no longer be found the probe FAILS
// rather than quietly passing over nothing.
//
// Run: `npx tsx tools/playtest/mgr_season_rebuild.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');
const api = readFileSync('client/src/api.ts', 'utf8');
const save = readFileSync('client/src/save.ts', 'utf8');

console.log('=== The two season clocks are still the two clocks this check assumes ===');

// The premises. If any of these move, the arithmetic below is measuring a game that no longer exists and
// the derivation it is checking would need rewriting, not the probe.
ok(/profile: \{ name, coins: 500, createdAt: Date\.now\(\), season: 0 \}/.test(save),
   'profile.season still starts at 0 in freshSave');
ok(/if \(kind === 'league'\) model\.profile\.season = season \+ 1;/.test(api),
   'profile.season still advances only on the league roll, and is reset nowhere');
ok(/season: 1, results: \[\], starId: undefined/.test(src),
   'MgrState.season is still put back to 1 at every succession (resetMgrForHeir)');
ok(/const retiredSeason = getActiveModel\(\)\.profile\.season/.test(api),
   'legacies[].retiredSeason is still stamped from profile.season at the succession');

console.log('\n=== ...and the rebuild reads the per-generation one ===');

/** Lift rebuiltMgrState's season derivation out of main.ts as a runnable (durable model) => season. Only
 *  plain `const x = …;` declarations are taken, and only those that touch neither the instance nor the
 *  store: a season derived from anything but the durable save is not something this recovery path can
 *  reach, so there would be nothing here to measure. */
function lift(): ((model: any) => number) | null {
  const i = src.indexOf('private rebuiltMgrState()');
  if (i < 0) return null;
  const end = src.indexOf('\n  }', i);
  if (end <= i) return null;
  const body = src.slice(i, end);
  const decl = /^[ \t]*const season = .*$/m.exec(body);
  if (!decl) return null;
  const js = body.slice(0, decl.index + decl[0].length).split('\n').map((l) => l.trim())
    .filter((l) => /^const [A-Za-z_$][\w$]* = /.test(l) && !/this\.|getActiveModel\(/.test(l))
    .join('\n')
    .replace(/:\s*any\b/g, '');           // the callback annotation; nothing else in these lines is TS
  if (!/\bseason\b/.test(js)) return null;
  try { return new Function('model', `${js}\nreturn season;`) as (m: any) => number; } catch { return null; }
}

/** A career walked one season at a time, moving both clocks exactly the way the game moves them, and the
 *  durable-half snapshot an eviction would leave behind at each point. */
type Point = { model: any; trueSeason: number; gen: number };
function career(genLengths: number[]): Point[] {
  const pts: Point[] = [];
  let profileSeason = 0;            // freshSave
  let mgrSeason = 1;                // the blank MgrState
  const legacies: { retiredSeason: number }[] = [];
  for (let g = 0; g < genLengths.length; g++) {
    for (let s = 0; s < genLengths[g]; s++) {
      pts.push({
        model: { profile: { season: profileSeason }, legacies: legacies.map((l) => ({ ...l })), honours: [], tokens: [] },
        trueSeason: mgrSeason, gen: g + 1,
      });
      profileSeason++; mgrSeason++;                       // the league roll: spSeasonReward + nextSeason
    }
    legacies.push({ retiredSeason: profileSeason });      // the star retires: api.succeed stamps the legacy
    mgrSeason = 1;                                        // the heir takes over: resetMgrForHeir
  }
  return pts;
}

const POINTS = career([11, 9, 12, 8, 10]);   // five generations of a normal length — 50 evictable moments
/** How badly a candidate derivation misreads that career: points wrong, the worst gap, and the World
 *  Finals it would stage on the wrong season (`wcEditionDue` is `m.season % 4` / `m.season / 4`). */
function score(f: (m: any) => number) {
  const edition = (n: number) => (n % 4 === 0 ? n / 4 : 0);
  let wrong = 0, worst = 0, wcWrong = 0;
  for (const p of POINTS) {
    const got = f(p.model);
    if (got !== p.trueSeason) { wrong++; worst = Math.max(worst, Math.abs(got - p.trueSeason)); }
    if (edition(got) !== edition(p.trueSeason)) wcWrong++;
  }
  return { wrong, worst, wcWrong };
}

const rebuilt = lift();
ok(!!rebuilt, 'the season derivation could be read out of rebuiltMgrState — it moved, so this probe would be blind');

// MUTATION CONTROLS. Both are real derivations this file has shipped or been offered, and both are wrong;
// if the career above could not catch them, the assertion under them would pass over anything at all.
const lifetime = score((m) => Math.max(1, Number(m.profile?.season ?? 0) || 1));   // what the rebuild did
const clampOne = score(() => 1);                                                   // "just reset to season 1"
console.log(`  ..   over ${POINTS.length} evicted moments across ${POINTS[POINTS.length - 1].gen} generations: reading profile.season raw is wrong at ${lifetime.wrong}, worst by ${lifetime.worst} seasons; clamping to 1 is wrong at ${clampOne.wrong}, worst by ${clampOne.worst}`);
ok(POINTS.length >= 40 && lifetime.wrong > 20 && clampOne.wrong > 20,
   `the career can see a wrong season at all (${lifetime.wrong} and ${clampOne.wrong} of ${POINTS.length} caught)`);
ok(lifetime.wcWrong > 0 && clampOne.wcWrong > 0,
   `and can see the World-Finals edition move with it (${lifetime.wcWrong} and ${clampOne.wcWrong} stagings misplaced)`);

if (rebuilt) {
  const got = score(rebuilt);
  console.log(`  ..   the shipped derivation: wrong at ${got.wrong} of ${POINTS.length}, worst by ${got.worst} season(s), ${got.wcWrong} World-Finals staging(s) misplaced`);
  ok(got.wrong === 0, `a rebuilt save comes back in its own generation's season (${got.wrong} of ${POINTS.length} wrong, worst by ${got.worst})`);
  ok(got.wcWrong === 0, `and stages the World Finals on the same season it would have (${got.wcWrong} misplaced)`);
}

console.log(fails ? `\n✗ ${fails} problem(s) — a recovered save is put back in the wrong season` : '\n✓ a recovered save keeps the season of the generation it is in');
if (fails) process.exitCode = 1;
