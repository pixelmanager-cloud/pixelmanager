// A SEED BUILT FROM `season` ALONE REPEATS AT EVERY SUCCESSION.
//
// Two facts about this codebase collide. `leagueSeed()` is a hash of the account handle and is CONSTANT for
// the life of a save. `MgrState.season` RESETS TO 1 at every succession. So any value derived from those two
// and nothing else is byte-identical for generation 1 season 3, generation 2 season 3, and generation 7
// season 3 — in a game whose entire premise is that each heir lives a fresh career.
//
// The audit found these one at a time, in four different subsystems, over three waves: the World Finals
// edition (F-194), the transfer market (F-195), the manager story arcs (F-229), the Continental Cup and its
// tie blurbs (F-230), the pre-match presser (F-232). That is not five bugs. It is one habit, and picking off
// the instances leaves the habit in place for the next person to hit — so this probe holds the RULE:
//
//     if an expression mixes leagueSeed() with a per-generation season, it must also mix the generation.
//
// The generation lives at `m.starGen`. main.ts:2098 already does it right —
// `houseListings(this.leagueSeed(), m.season, tier, gen, …)` — one line above a call that does not.
//
// SITES THAT PASS leagueSeed() WITHOUT A SEASON ARE NOT IN SCOPE and must not be: the fixture list, the
// seeded opponents and their tactics are deliberately save-constant ("the same club always plays the same
// way"), and flagging them would be wrong.
//
// Run: `npx tsx tools/playtest/generation_scoped_seeds.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== Every season-derived seed also carries the generation ===');

const SEASON = /\bm\.season\b|\bmgr\.season\b|loadMgr\(\)\.season/;
const GEN = /\bgen\b|starGen|\bgeneration\b|genSeed/;

// Anything listed here is a site where repeating across generations is INTENDED. Each needs a reason, not a
// line number, so that moving the code does not silently widen the exemption.
const INTENDED: Array<{ match: RegExp; why: string }> = [
  // (empty — every site found so far was a defect. Add here only with a reason a player would agree with.)
];

const lines = readFileSync('client/src/main.ts', 'utf8').split('\n');
let scoped = 0;
const missing: string[] = [];
lines.forEach((line, i) => {
  if (!/leagueSeed\(\)|genSeed\(\)/.test(line) || !SEASON.test(line)) return;
  if (INTENDED.some((x) => x.match.test(line))) return;
  scoped++;
  if (!GEN.test(line)) missing.push(`main.ts:${i + 1}  ${line.trim().slice(0, 118)}`);
});

console.log(`  ..   ${scoped} expression(s) mix leagueSeed() with a per-generation season`);
// VACUITY GUARDS. If leagueSeed is renamed, or the manager state stops calling it `season`, this scan finds
// nothing and passes having checked nothing — the failure mode the whole factory exists to catch.
const whole = lines.join('\n');
ok(/private leagueSeed\(\)/.test(whole) && /private genSeed\(\)/.test(whole),
   'both leagueSeed() and genSeed() still exist under those names');
// AND genSeed MUST ACTUALLY CARRY THE GENERATION. Everything below is shape-based: it checks that a
// season-derived seed goes through genSeed(). That is worth nothing if genSeed is ever gutted to return
// leagueSeed() — mutation-tested, and the first draft of this probe stayed GREEN through exactly that, which
// is the same class of hole the probe exists to catch. So read the helper's own body.
const body = /private genSeed\(\)[^\n]*/.exec(whole)?.[0] ?? '';
console.log(`  ..   genSeed body: ${body.replace(/^\s*/, '').slice(0, 110)}`);
ok(/starGen|generation/.test(body), 'genSeed() mixes the generation in (a gutted helper would pass every check below)');
ok(scoped >= 10, `the scan actually matched season-derived seeds (${scoped}) — a low number here means the pattern moved, not that it was fixed`);
for (const m of missing) console.log(`       ${m}`);
ok(missing.length === 0, `every one of them also carries the generation (${missing.length} do not)`);

console.log(fails === 0 ? '\n✓ an heir does not replay his father\'s season' : `\n✗ ${fails} problem(s)`);
process.exit(fails === 0 ? 0 : 1);
