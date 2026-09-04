// A CONTINENTAL BADGE MUST BRING ITS OWN ELEVEN.
//
// `contOpponent` goes to real trouble to draw a differently-named club out of a 30-name pool for every
// continental round of every season — and then `playContinentalTie` seeded that club with
// `(leagueSeed ^ (round * 131))`, which knows nothing about WHO was drawn. The season was passed only in
// `generateClub`'s `id` argument, and `id` reaches no generator: teams.ts mints each row with
// `mintSquadPlayer(id-i, role, quality, seed ^ ...)`, so the name and every stat come off `seed`. The whole
// pool therefore collapsed to THREE squads per save, one per round — twenty-two different badges over
// twelve seasons with three different elevens behind them — and `seededOpponentTactics`, fed the same seed,
// gave those three the same press, line and tempo for the life of the save. One playing of a quarter-final
// solved every quarter-final that save would ever stage.
//
// Measured over 40 saves x 12 seasons x 3 rounds: 1,440 ties, 1,207 distinct (badge, round) draws, and 120
// distinct elevens with the name left out of the seed against 1,207 with it in. The thinnest save saw ONE
// of the six tactical presets instead of all six.
//
// THE SEASON IS DELIBERATELY NOT IN THE SEED. Mixing `m.season` in scatters the squads too, but it breaks
// the invariant the rest of the game keeps — league opponents are name-keyed (clubseason.ts:
// `hash32(seed, nameSeed(n))`) and seededOpponentTactics is documented "same club always plays the same
// way" — by making one named club field two unrelated sides two seasons apart. Both halves are asserted
// here: the seed must move with the NAME, and must not move with the SEASON.
//
// The round stays in the seed on purpose. contOpponent already makes the same club stronger in the final
// than in the quarter-final (12 + r*2), so this competition's clubs are round-scaled by design.
//
// main.ts is a browser module nothing can import, so the seed expression is lifted out of the file and
// EVALUATED rather than eyeballed; if it can no longer be found the probe FAILS rather than quietly
// passing over nothing.
//
// Run: `npx tsx tools/playtest/cont_opponent_identity.ts`
import { readFileSync } from 'node:fs';
import { contOpponent, generateClub, seededOpponentTactics, type ContTie, type ContRound } from '@fm/shared';

const src = readFileSync('client/src/main.ts', 'utf8');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The continental opponent is seeded on WHO was drawn ===');

type SeedFn = (S: number, round: number, tie: ContTie, m: { season: number }) => number;

/** Lift `const oppSeed = <expr>;` out of playContinentalTie and hand back a runnable
 *  (leagueSeed, round, tie, mgr) => seed. `this.leagueSeed()` is the only reach into Game the expression is
 *  allowed: anything else `this.` means the seed depends on state a probe cannot supply, and the honest
 *  answer is to fail rather than to measure something else. */
function seedFn(): SeedFn | null {
  const i = src.indexOf('private playContinentalTie()');
  if (i < 0) return null;
  const end = src.indexOf('\n  }', i);
  const hit = (end < 0 ? '' : src.slice(i, end)).match(/const oppSeed = (.+?);/);
  if (!hit) return null;
  const expr = hit[1].replace(/this\.leagueSeed\(\)/g, '(S >>> 0)');
  if (/this\./.test(expr)) return null;
  try {
    const f = new Function('S', 'round', 'tie', 'm', `return ${expr};`) as SeedFn;
    f(1, 0, contOpponent(1, 1, 0), { season: 1 });   // it has to actually run on the arguments we can supply
    return f;
  } catch { return null; }
}

const seedOf = seedFn();
ok(!!seedOf, 'the oppSeed expression can still be lifted out of playContinentalTie (a probe that cannot find it fails, it does not pass)');

if (seedOf) {
  // ── the seed itself, before a single squad is minted ─────────────────────────────────────────────
  const S0 = [...'continental'].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) >>> 0;
  let sB = -1;
  for (let s = 2; s <= 60 && sB < 0; s++) if (contOpponent(S0, s, 0).oppName !== contOpponent(S0, 1, 0).oppName) sB = s;
  const tA = contOpponent(S0, 1, 0), tB = contOpponent(S0, sB < 0 ? 1 : sB, 0);
  ok(tA.oppName !== tB.oppName, 'the draw really does put two different badges in the same round (otherwise the next check compares a club with itself)');
  // same leagueSeed, same round, SAME season — only the club differs, so only the club can explain a difference
  ok(seedOf(S0, 0, tA, { season: 1 }) !== seedOf(S0, 0, tB, { season: 1 }),
     `${tA.oppName} and ${tB.oppName} are seeded differently — the seed knows who was drawn`);
  ok(seedOf(S0, 0, tA, { season: 1 }) === seedOf(S0, 0, tA, { season: 9 }),
     `${tA.oppName} is seeded identically eight seasons apart — a club keeps one identity (tactics.ts: "same club always plays the same way")`);

  // ── what that buys, measured on the squads and shapes the player is actually shown ───────────────
  function sweep(f: SeedFn) {
    let worstRatio = 1, minTactics = 99, minXI = 99, draws = 0, repeats = 0, drifted = 0;
    for (let k = 0; k < 40; k++) {
      const S = [...('save' + k)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) >>> 0;
      const badges = new Set<string>(), elevens = new Set<string>(), shapes = new Set<string>(), seen = new Map<string, string>();
      for (let season = 1; season <= 12; season++) for (const r of [0, 1, 2] as ContRound[]) {
        const tie = contOpponent(S, season, r);
        const seed = f(S, r, tie, { season });
        const club = generateClub('cont-' + season + '-' + r, tie.oppName, 0x8844cc, tie.oppStrength, seed, true);
        const t = seededOpponentTactics(seed);
        const xi = club.players.map((p) => p.name).join(',');
        const shape = `${t.formation}|${t.mentality}|${t.line}|${t.press}|${t.tempo}|${t.width}`;
        const key = tie.oppName + '|' + r;
        badges.add(key); elevens.add(xi); shapes.add(shape); draws++;
        if (seen.has(key)) { repeats++; if (seen.get(key) !== xi + '#' + shape) drifted++; } else seen.set(key, xi + '#' + shape);
      }
      worstRatio = Math.min(worstRatio, elevens.size / badges.size);
      minTactics = Math.min(minTactics, shapes.size);
      minXI = Math.min(minXI, elevens.size);
    }
    return { worstRatio, minTactics, minXI, draws, repeats, drifted };
  }

  const real = sweep(seedOf);
  // MUTATION CONTROL. Hand the same measurement the defect on purpose — the pre-fix expression, blind to the
  // name. If it does not come back collapsed then the assertions under it are decoration and would go green
  // over any seed at all.
  const blind = sweep((S, round) => (S ^ (round * 131)) >>> 0);
  console.log(`  ..   ${real.draws} continental tie(s) over 40 saves x 12 seasons x 3 rounds`);
  console.log(`  ..   own eleven per (badge, round) in the thinnest save: ${(real.worstRatio * 100).toFixed(1)}%, vs ${(blind.worstRatio * 100).toFixed(1)}% with the name left out of the seed`);
  console.log(`  ..   tactical shapes reaching the thinnest save: ${real.minTactics} of 6, vs ${blind.minTactics} of 6 with the name left out`);
  ok(blind.minXI <= 3 && blind.worstRatio < 0.25,
     `the measurement can see a name-blind seed at all (it collapses to ${blind.minXI} eleven(s) a save)`);
  ok(real.worstRatio >= 0.9,
     `a different badge brings a different eleven (${(real.worstRatio * 100).toFixed(1)}% of the draws in the thinnest save)`);
  // 4, not 5: a name-blind seed has only three values per save, so it can never clear 3 however the presets
  // fall. The threshold sits one above the ceiling of the defect, with headroom under the measured 5.
  ok(real.minTactics >= 4,
     `and a different opponent brings a different shape (${real.minTactics} of the 6 presets reach the thinnest save; a round-only seed cannot exceed 3)`);

  // The other half of the invariant, over the whole sweep rather than the single pair above. `repeats > 0` is
  // the vacuity guard: a 30-name pool over 36 draws redraws constantly, but if it ever stopped, `drifted === 0`
  // would be zero of zero and green for the wrong reason. Mutation-tested by seeding on `m.season` instead of
  // the name — the fix this codebase must NOT take — which turns all 211 repeats into drift.
  console.log(`  ..   ${real.repeats} redraw(s) of a badge already seen in that round, ${real.drifted} of them with a changed eleven or shape`);
  ok(real.repeats > 0, 'a badge really is drawn again in a later season (this guard is not measuring an empty set)');
  ok(real.drifted === 0, `a club that comes back is the same club (${real.drifted} drift(s) over ${real.repeats} redraws)`);
}

console.log(fails ? `\n✗ ${fails} check(s) failed — the continent's clubs are not their own sides` : '\n✓ every continental badge fields its own eleven, and keeps it');
if (fails) process.exitCode = 1;
