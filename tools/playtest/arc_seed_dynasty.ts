// AN HEIR MUST NOT BE OFFERED HIS FATHER'S STORIES, IN HIS FATHER'S ORDER.
//
// `maybeOfferArc()` built the arc picker's seed out of `leagueSeed()` and a salt of `m.season` and
// `m.results.length`. Every one of those resets at a succession except the first, which is a hash of the
// account handle and never moves for the life of the save: `resetMgrForHeir` puts back `season: 1,
// results: []` and empties `arcFired`, so generation 2's season 1 matchday 0 handed `pickManagerArc` the
// byte-identical seed generation 1 got, against a library reset to the same 819 arcs. Driven over a
// 10-season generation at the shipped pacing (one offer every three matchdays, 60 offers) with the club
// settled in one tier, the heir drew THE SAME 60 ARCS IN THE SAME ORDER — 60/60, and still 58/60 with his
// father's `arcTags` carried across. The manager half's only real drama is these arcs; a bloodline game
// whose third generation reads as a transcript of the first has nothing to hand the player.
//
// The sibling field ten lines up in the same reset, `wcHeld`, exists precisely so "the heir replays his
// father's Edition 1" cannot happen to the World Finals. The arc salt never got the same guard.
//
// WHY THIS NEEDS ITS OWN PROBE. `generation_scoped_seeds.ts` holds exactly this rule and did not catch it:
// it scans ONE LINE at a time, and here the season sits on the `const salt = …` line while `leagueSeed()`
// sits on the next one. So this is measured rather than pattern-matched — the probe LIFTS the real salt,
// the real seed expression and the real body of `genSeed()` out of main.ts, EVALUATES them, and walks three
// generations of a settled club through the real `pickManagerArc`. A paraphrase of the arithmetic would
// prove nothing about what ships; if any of the three can no longer be lifted this FAILS rather than
// quietly passing over nothing.
//
// Run: `npx tsx tools/playtest/arc_seed_dynasty.ts`
import { readFileSync } from 'node:fs';
import { pickManagerArc, type MgrSituation } from '../../shared/src/managerarc.js';

const src = readFileSync('client/src/main.ts', 'utf8');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The arc seed carries the generation, so an heir gets his own stories ===');

/** The body of a method on Game, from its signature to the first close-brace at method indentation. */
function methodBody(sig: string): string {
  const i = src.indexOf(sig);
  if (i < 0) return '';
  const end = src.indexOf('\n  }', i);
  return end < 0 ? '' : src.slice(i, end);
}

// ── lift the three shipped expressions ───────────────────────────────────────────────────────────────
const offer = methodBody('private maybeOfferArc()');
const saltExpr = (/\bconst salt = ([^;]+);/.exec(offer) ?? [])[1] ?? '';
const seedExpr = (/pickManagerArc\(([\s\S]*?), this\.mgrSituation\(\)/.exec(offer) ?? [])[1] ?? '';
// `genSeed()` is a one-liner, so it is lifted by its `return`, not by methodBody's brace scan.
const genExpr = (/private genSeed\(\)[^\n{]*\{\s*return ([^;]+);/.exec(src) ?? [])[1] ?? '';
console.log(`  ..   salt = ${saltExpr.trim()}`);
console.log(`  ..   seed = ${seedExpr.trim()}`);
console.log(`  ..   genSeed = ${genExpr.trim()}`);
ok(!!saltExpr && !!seedExpr && !!genExpr,
   'the arc salt, the seed handed to pickManagerArc and genSeed() can all still be lifted — otherwise this probe is blind and must be re-pointed');

type Mgr = Record<string, any>;
const LEAGUE_SEED = 0x5f3a91c7;   // stands in for a handle hash; only its constancy matters
let cur: Mgr = {};

/** Evaluate the shipped seed for manager save `m`. `blind` hides the generation from it — see the
 *  mutation control below — by handing back a bare leagueSeed() and a starGen of 0, which is precisely the
 *  derivation that shipped, whichever end of the expression the generation is mixed in at. */
function seedFor(m: Mgr, blind: boolean): number {
  cur = blind ? { ...m, starGen: 0 } : m;
  const ctx = {
    leagueSeed: () => LEAGUE_SEED,
    loadMgr: () => cur,
    genSeed: () => (blind ? LEAGUE_SEED : (genFn(ctx) >>> 0)),
  };
  return arcSeedFn(ctx, cur) >>> 0;
}
const de = (e: string) => e.replace(/\bthis\./g, 'ctx.');
const genFn = new Function('ctx', `return ${de(genExpr)};`) as (c: any) => number;
const arcSeedFn = new Function('ctx', 'm', `const salt = ${de(saltExpr)}; return ${de(seedExpr)};`) as (c: any, m: Mgr) => number;

// ── the settled dynasty: one club, one tier, one temperament, generation after generation ────────────
// This is the steady state of a dynasty that has stopped moving division, and the default path through the
// handoff — MGR_TEMPERS[0] is the pre-selected radio, so an heir clicked straight through inherits it.
const SEASONS = 10, OFFERS_PER_SEASON = 6, PACE = 3;   // maybeOfferArc: `md - arcLastMd < 3` => md 0,3,6…
const situation = (season: number): MgrSituation => ({
  season, tier: 4, posFrac: 0.42, coins: 3200,
  hasWonderkid: true, hasVeteran: true, hasUnhappy: false, squadSize: 18,
  tags: new Set<string>(), temper: 'disciplinarian', facilities: { pitch: 2, gym: 2, medical: 1 },
});

/** Live one generation: `arcFired` starts empty (resetMgrForHeir clears it) and fills as arcs are offered. */
function generation(gen: number, blind: boolean): string[] {
  const fired = new Set<string>();
  const out: string[] = [];
  for (let season = 1; season <= SEASONS; season++) {
    for (let k = 0; k < OFFERS_PER_SEASON; k++) {
      const m: Mgr = { season, starGen: gen, results: new Array(k * PACE).fill(0), arcFired: [...fired] };
      const id = pickManagerArc(seedFor(m, blind), situation(season), fired);
      if (!id) break;
      fired.add(id);
      out.push(id);
    }
  }
  return out;
}

const sameSlots = (a: string[], b: string[]) => a.filter((x, i) => x === b[i]).length;
const gens = [0, 1, 2].map((g) => generation(g, false));
const N = SEASONS * OFFERS_PER_SEASON;

console.log(`  ..   gen 1 opens with ${gens[0][0]}, gen 2 with ${gens[1][0]}, gen 3 with ${gens[2][0]}`);

// NOT VACUOUS. Every assertion below compares two 60-long sequences; if the walk offered nothing, or offered
// the same arc over and over, "they differ" would be unmeasurable or trivially true.
ok(gens.every((g) => g.length === N), `each generation is actually offered its ${N} arcs (${gens.map((g) => g.length).join('/')})`);
ok(new Set(gens[0]).size >= N - 2, `a generation draws a varied library, not one arc repeatedly (${new Set(gens[0]).size} distinct of ${gens[0].length})`);

const pairs: Array<[number, number]> = [[0, 1], [1, 2], [0, 2]];
for (const [a, b] of pairs) {
  const n = sameSlots(gens[a], gens[b]);
  // A hash can collide in a slot by chance; ~1 in 60 is expected. A father-and-son transcript is not 6.
  ok(n <= 6, `gen ${a + 1} and gen ${b + 1} are living different careers (${n}/${N} slots hold the same arc)`);
}
ok(gens[0][0] !== gens[1][0], `the heir's very first story is not his father's (${gens[0][0]} vs ${gens[1][0]})`);

// MUTATION CONTROL. The comparison above is worth nothing unless it can see the defect. Feed it the
// pre-fix derivation on purpose — the seed with the generation hidden from it, which is exactly what
// shipped — and it must come back with the transcript.
const blind = [0, 1].map((g) => generation(g, true));
const blindSame = sameSlots(blind[0], blind[1]);
console.log(`  ..   with the generation hidden from the seed: ${blindSame}/${N} slots identical`);
ok(blindSame >= N - 6, `the check can see a generation-blind seed at all (${blindSame}/${N} when forced)`);

console.log(fails ? `\n✗ ${fails} check(s) failed — the heir is being handed his father's stories` : '\n✓ every generation of the bloodline gets its own stories');
if (fails) process.exitCode = 1;
