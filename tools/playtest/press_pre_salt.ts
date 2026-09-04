// THE PRE-MATCH PRESSER SAID THE SAME THING ON MATCHDAY 5 OF EVERY SEASON OF EVERY GENERATION.
//
// `pressConferenceLine` hashes the seed and the roundSalt and NOTHING ELSE about when the fixture is
// (shared/src/press.ts). The pre-match call site salted with `results.length` alone — and `results` is
// cleared at every rollover and at every succession, so that index only ever runs 0..17. Same matchday,
// same competition/stakes/form profile ⇒ byte-identical quote in season 1, season 12, and in the season
// after that the heir plays. Its own post-match twin a few hundred lines away already folds the season in.
//
// It is the same habit `generation_scoped_seeds.ts` holds the rule for, with the halves the other way up:
// that probe catches a season that forgot the GENERATION, and this one is a salt that forgot the SEASON
// entirely — so the rule-scan could never see it (the line carries no `season` to scan). It needs both.
//
// The salt is an expression inside a private method of a 9k-line class, so this lifts the two arguments
// the game actually passes out of the source and evaluates them, the way `press_stakes_occasion.ts` next
// door lifts the stakes ternary. The check is on the ARITHMETIC the game runs, not on a pattern a rewrite
// could satisfy while changing the answer.
//
// Run: `npx tsx tools/playtest/press_pre_salt.ts`
import { readFileSync } from 'node:fs';
import { pressConferenceLine, type PressCompetition, type PressForm } from '../../shared/src/press.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The manager does not repeat himself on the same matchday every season ===');

// ── The call site, lifted from source ────────────────────────────────────────────────────────────
const src = readFileSync('client/src/main.ts', 'utf8');
const CALL = 'const preLine = pressConferenceLine(';
const nCall = src.split(CALL).length - 1;
ok(nCall === 1, `\`${CALL}\` appears exactly once in client/src/main.ts (found ${nCall})`);
if (nCall !== 1) { console.log('\n✗ the pre-match presser call moved or was renamed — re-point this probe'); process.exit(1); }

/** The argument list of that call, split on top-level commas (the object literal stays in one piece). */
function args(from: number): string[] {
  let depth = 0, start = from, i = from;
  const out: string[] = [];
  for (; i < src.length; i++) {
    const c = src[i];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) { if (depth === 0) break; depth--; }
    else if (c === ',' && depth === 0) { out.push(src.slice(start, i)); start = i + 1; }
  }
  out.push(src.slice(start, i));
  return out.map((s) => s.trim());
}
const a = args(src.indexOf(CALL) + CALL.length);
ok(a.length >= 2, `the call still takes a seed and a salt (${a.length} argument(s) found)`);
if (a.length < 2) { console.log('\n✗ could not read the pre-match presser arguments'); process.exit(1); }
console.log(`  ..   seed: ${a[0]}`);
console.log(`  ..   salt: ${a[1]}`);

// `genSeed()` is a one-line helper on the same class; lift its body too so the model below runs the real
// generation mix rather than a guess at it. (What it must CONTAIN is generation_scoped_seeds.ts's job.)
const genBody = /private genSeed\(\)[^{]*\{\s*return ([\s\S]*?);\s*\}/.exec(src)?.[1] ?? '';
ok(genBody.length > 0, 'genSeed() is still a single-expression helper this probe can evaluate');
if (!genBody) { console.log('\n✗ could not read genSeed()'); process.exit(1); }

// ── Evaluate them ────────────────────────────────────────────────────────────────────────────────
// Both expressions read `this.leagueSeed()` / `this.genSeed()` / `this.loadMgr()`, nothing else.
type Mgr = { season: number; starGen: number; results: unknown[] };
let mgr: Mgr = { season: 1, starGen: 0, results: [] };
let league = 0;
const expr = (e: string) => new Function(`return (${e});`) as (this: unknown) => number;
const genFn = expr(genBody), seedFn = expr(a[0]), saltFn = expr(a[1]);
const self: Record<string, unknown> = {
  leagueSeed: () => league,
  loadMgr: () => mgr,
  genSeed: () => genFn.call(self),
};

const PROFILE = { competition: 'league' as PressCompetition, stakes: 1 as const, form: 'level' as PressForm };
/** The quote the team sheet renders for one fixture of the given save/generation/season/matchday. */
const quote = (ls: number, gen: number, season: number, md: number, p = PROFILE): string => {
  league = ls; mgr = { season, starGen: gen, results: new Array(md) };
  return pressConferenceLine(seedFn.call(self), saltFn.call(self), { timing: 'pre', ...p });
};

const MD = [...Array(18).keys()];          // one league season: results is cleared at every rollover
const SEASONS = [...Array(12).keys()].map((n) => n + 1);
const GENS = [...Array(5).keys()];

// ── VACUITY GUARD ────────────────────────────────────────────────────────────────────────────────
// Every assertion below is "these strings differ". All of them are free if the pool for this profile
// holds one line — then nothing could ever vary and the probe would be measuring nothing.
// Seed and salt are swept INDEPENDENTLY here: a sweep that moves them together (salt = f(seed)) reports
// 18 lines for a bank that holds 128, which is a real degeneracy of hash32 and would understate the pool.
const pool = new Set<string>();
for (let s = 0; s < 60; s++) for (let r = 0; r < 60; r++) pool.add(pressConferenceLine(s, r, { timing: 'pre', ...PROFILE }));
console.log(`  ..   ${pool.size} distinct pre-match lines exist for the modal profile (league / routine / level form)`);
ok(pool.size > 1, 'there is more than one line to draw for this profile — otherwise nothing here is measurable');

// ── THE SEASON ───────────────────────────────────────────────────────────────────────────────────
const frozenBySeason = MD.filter((md) => new Set(SEASONS.map((s) => quote(1234, 0, s, md))).size === 1);
console.log(`  ..   ${MD.length - frozenBySeason.length}/${MD.length} matchdays change their quote across ${SEASONS.length} seasons`);
ok(frozenBySeason.length === 0, frozenBySeason.length
  ? `${frozenBySeason.length} matchday(s) read the same in all ${SEASONS.length} seasons, e.g. md ${frozenBySeason[0]} — “${quote(1234, 0, 1, frozenBySeason[0]).slice(0, 60)}…”`
  : 'no matchday is frozen to one quote for the life of a career');

// ── THE GENERATION ───────────────────────────────────────────────────────────────────────────────
// `season` resets to 1 at every succession, so the season alone would still have the heir replay his
// father's press conferences word for word — the failure generation_scoped_seeds.ts exists for.
const frozenByGen = MD.filter((md) => new Set(GENS.map((g) => quote(1234, g, 3, md))).size === 1);
console.log(`  ..   ${MD.length - frozenByGen.length}/${MD.length} matchdays change their quote across ${GENS.length} generations`);
ok(frozenByGen.length === 0, frozenByGen.length
  ? `${frozenByGen.length} matchday(s) read the same for every heir, e.g. md ${frozenByGen[0]} — the son repeats his father`
  : 'no heir replays his father\'s pre-match quotes');

// ── AND THE BANK IS ACTUALLY REACHED ─────────────────────────────────────────────────────────────
// The two checks above only say the quote MOVES. A salt correlated with the seed moves and still lands
// on a handful of lines — that is not hypothetical, it is what the independent sweep above had to work
// around. Over a thousand fixtures, most of an authored bank should be reachable.
const dynasty = new Set<string>();
for (const g of GENS) for (const s of SEASONS) for (const md of MD) dynasty.add(quote(1234, g, s, md));
console.log(`  ..   ${dynasty.size}/${pool.size} of the bank is reached over ${GENS.length}×${SEASONS.length}×${MD.length} = ${GENS.length * SEASONS.length * MD.length} league fixtures`);
ok(dynasty.size * 2 >= pool.size, `a dynasty reaches at least half the authored bank (${dynasty.size} of ${pool.size})`);

// ── MUTATION GUARDS ──────────────────────────────────────────────────────────────────────────────
// A salt that dropped the matchday would pass everything above and give one quote per season instead.
const withinSeason = new Set(MD.map((md) => quote(1234, 0, 4, md))).size;
console.log(`  ..   ${withinSeason} distinct quotes across the ${MD.length} matchdays of a single season`);
ok(withinSeason > 1, 'the matchday still moves the quote inside one season (a salt that lost it would fail here)');

// A salt that stopped mixing the save seed would pass the rest and give every player the same career.
const twoSaves = MD.filter((md) => quote(1234, 0, 3, md) !== quote(98765, 0, 3, md)).length;
console.log(`  ..   ${twoSaves}/${MD.length} matchdays differ between two different saves`);
ok(twoSaves > 0, 'two different saves still hear different quotes (the save seed still reaches the presser)');

console.log(fails ? `\n✗ ${fails} check(s) failed — the pre-match presser is on a loop` : '\n✓ the pre-match presser moves with the season, the generation and the matchday');
if (fails) process.exitCode = 1;
