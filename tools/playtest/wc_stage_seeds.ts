// THE QUARTER-FINAL AND THE SEMI-FINAL OF A WORLD FINALS MUST NOT BE THE SAME MATCH.
//
// Both World-Finals seeds keyed their per-round discriminator on `stage.length`, and `'qf'.length` and
// `'sf'.length` are both 2 — so the only round the discriminator could tell apart was the final. The
// quarter-final and the semi-final of one edition were handed the IDENTICAL seed, at the tie
// (`simWorldCupTie`) and again at the level-tie penalty shootout (`resolveWorldCup`).
//
// That is invisible from the outside: two plausible scorelines, no error, no NaN. But one mixed seed drives
// both of goalPair's Poisson streams, so QF and SF draw the same numbers and only lambda moves — and a one-
// or two-point gap between two rival nations usually does not move a goal count. Measured over 230,400
// (leagueSeed, edition, qfStrength, sfStrength) combinations at the strengths intl.ts actually generates
// (8..19): the two rounds printed the byte-identical scoreline 52.8% of the time. With the seed keyed on a
// round index instead, 6.6%. The sibling competition never had this — simContinentalTie keys on `round * 17`
// and resolveContinental on `round * 29`, both integer round indices.
//
// This is checked at the source level because main.ts is a browser module nothing can import: the probe
// lifts the two seed expressions out of the file and EVALUATES them, rather than eyeballing them, so a
// future edit that swaps `stage.length` for some other stage-blind term is caught by the same assertion.
// If the expressions can no longer be found the probe FAILS rather than quietly passing over nothing.
//
// Run: `npx tsx tools/playtest/wc_stage_seeds.ts`
import { readFileSync } from 'node:fs';
import { goalPair, mixSeed } from '@fm/shared';

const src = readFileSync('client/src/main.ts', 'utf8');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const STAGES = ['qf', 'sf', 'final'] as const;

/** The body of a method on Game, from its signature to the first close-brace at method indentation. */
function methodBody(sig: string): string {
  const i = src.indexOf(sig);
  if (i < 0) return '';
  const end = src.indexOf('\n  }', i);
  return end < 0 ? '' : src.slice(i, end);
}

/** Lift `((this.leagueSeed() >>> 0) ^ ((m.wcEdition * MUL + <disc>) >>> 0)) >>> 0` out of a method and hand
 *  back a runnable (leagueSeed, edition, stage) => seed. `<disc>` is the per-round discriminator — the whole
 *  point of the seed and the thing that was broken — so any identifier it uses is resolved from a `const` in
 *  the same method, and must be a pure function of `stage` (no `this.`, no save state) or there is nothing
 *  here a probe can reason about. */
function seedFn(sig: string, mul: number): ((S: number, E: number, stage: string) => number) | null {
  const body = methodBody(sig);
  const hit = body.match(new RegExp(`\\(\\(this\\.leagueSeed\\(\\) >>> 0\\) \\^ \\(\\(m\\.wcEdition \\* ${mul} \\+ (.+?)\\) >>> 0\\)\\) >>> 0`));
  if (!hit) return null;
  const disc = hit[1];
  // property names and string literals are not free variables: `stage.length` needs `stage`, not `length`
  const bare = disc.replace(/'[^']*'/g, "''").replace(/\.[A-Za-z_$][\w$]*/g, '');
  let prelude = '';
  for (const name of new Set(bare.match(/[A-Za-z_$][\w$]*/g) ?? [])) {
    if (name === 'stage') continue;
    const decl = body.match(new RegExp(`^\\s*const ${name} = ([^;]+);`, 'm'));
    if (!decl || /this\.|\bm\./.test(decl[1])) return null;
    prelude += `const ${name} = ${decl[1]};\n`;
  }
  return new Function('S', 'E', 'stage', `${prelude}return ((S >>> 0) ^ ((E * ${mul} + ${disc}) >>> 0)) >>> 0;`) as (S: number, E: number, stage: string) => number;
}

console.log('=== The three World-Finals rounds are three different draws ===');

const sites: { label: string; fn: ((S: number, E: number, stage: string) => number) | null }[] = [
  { label: 'the tie itself (simWorldCupTie)', fn: seedFn('private simWorldCupTie()', 977) },
  { label: 'the level-tie shootout (resolveWorldCup)', fn: seedFn('private resolveWorldCup(', 733) },
];

let tieSeed: ((S: number, E: number, stage: string) => number) | null = null;
for (const site of sites) {
  if (!site.fn) { ok(false, `${site.label}: could not read the seed expression — it moved, so this probe is now blind and must be re-pointed`); continue; }
  let collide = 0, pairs = 0;
  for (let S = 1; S <= 600; S++) for (let E = 1; E <= 8; E++) {
    const v = STAGES.map((s) => site.fn!(S, E, s));
    for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) { pairs++; if (v[a] === v[b]) collide++; }
  }
  console.log(`  ..   ${site.label}: seeds at leagueSeed 12345 edition 1 → qf ${site.fn(12345, 1, 'qf')}, sf ${site.fn(12345, 1, 'sf')}, final ${site.fn(12345, 1, 'final')}`);
  ok(collide === 0, `${site.label}: all three rounds get their own seed (${collide} collision(s) over ${pairs} round pairs)`);
  if (site.label.startsWith('the tie')) tieSeed = site.fn;
}

console.log('\n=== ...so the semi-final is not a replay of the quarter-final ===');

/** simFixtureResult's arithmetic for a World-Finals tie: neutral ground, so no home term. */
const tie = (myStr: number, oppStr: number, seed: number) => goalPair(mixSeed(seed >>> 0), (myStr - oppStr) * 0.10);

/** How often QF and SF print the same scoreline, given a seed function. Star quality 15 (a mid-table
 *  international); the rivals sweep 8..19, the range intl.ts seeds a World-Finals field with. */
function replayRate(seed: (S: number, E: number, stage: string) => number) {
  let same = 0, n = 0;
  for (let S = 1; S <= 400; S++) for (let E = 1; E <= 4; E++)
    for (let qs = 8; qs <= 19; qs++) for (let ss = 8; ss <= 19; ss++) {
      const a = tie(15, qs, seed(S, E, 'qf')), b = tie(15, ss, seed(S, E, 'sf'));
      n++; if (a[0] === b[0] && a[1] === b[1]) same++;
    }
  return same / n;
}

if (!tieSeed) { ok(false, 'no tie seed to measure — the check above already said why'); }
else {
  const real = replayRate(tieSeed);
  // MUTATION CONTROL. If this measurement could not see a shared seed, the assertion under it would be
  // decoration — it would pass over any seed at all. Feed it the defect on purpose: one seed for both
  // rounds. It must come back high, and it does (52.8% when the bug was live).
  const collided = replayRate((S, E) => tieSeed!(S, E, 'qf'));
  console.log(`  ..   identical QF/SF scoreline: ${(real * 100).toFixed(1)}% as seeded, ${(collided * 100).toFixed(1)}% with one shared seed`);
  ok(collided > 0.40, `the measurement can see a shared seed at all (${(collided * 100).toFixed(1)}% identical when forced)`);
  // Two different draws against two rivals a couple of strength points apart still land on the same
  // scoreline sometimes — 6.6% measured. Anything near the collided rate means the rounds share a stream.
  ok(real < 0.20, `the semi-final rolls its own scoreline (${(real * 100).toFixed(1)}% identical to the quarter-final, ${(collided * 100).toFixed(1)}% if seeded alike)`);
}

console.log(fails ? `\n✗ ${fails} check(s) failed — a World-Finals round is being replayed` : '\n✓ every World-Finals round is seeded, and drawn, on its own');
if (fails) process.exitCode = 1;
