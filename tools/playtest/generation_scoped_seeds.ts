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

/** The WINDOW lines of actual code either side of `i`, skipping comment-only and blank lines. A seed built
 *  across two statements is two CODE lines apart however much explanation sits between them. */
const isCodeLine = (l: string) => { const t = l.trim(); return t !== '' && !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*'); };
function codeWindow(all: string[], i: number, w: number): string {
  const isCode = isCodeLine;
  const out = [all[i]];
  for (const dir of [-1, 1]) {
    let taken = 0;
    for (let j = i + dir; j >= 0 && j < all.length && taken < w - 1; j += dir) {
      if (!isCode(all[j])) continue;
      out.push(all[j]); taken++;
    }
  }
  return out.join('\n');
}
const stripComments = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');
const SEASON = /\bm\.season\b|\bmgr\.season\b|loadMgr\(\)\.season/;
const GEN = /\bgen\b|starGen|\bgeneration\b|genSeed/;
// A WINDOW THAT WAS TOO KIND. `transferList(this.leagueSeed(), m.season, tier)` sat ONE LINE under
// `houseListings(this.leagueSeed(), m.season, tier, gen, …)` — the site the header above holds up as the
// one that does it right — and that neighbour's `gen` argument fell inside the window and vouched for the
// line below it. Mutation-tested: with the transfer market's fix (§98) reverted, this probe printed
// `0 do not` and exited 0, green over the exact defect it was written for. So an expression that names
// leagueSeed() and a per-generation season ON ONE LINE is self-contained and is judged on that line alone;
// no neighbour answers for it. The window still covers the seeds genuinely built across two statements.
const dropsGen = (line: string) => /leagueSeed\(\)/.test(line) && SEASON.test(line) && !GEN.test(line);

// Anything listed here is a site where repeating across generations is INTENDED. Each needs a reason, not a
// line number, so that moving the code does not silently widen the exemption.
const INTENDED: Array<{ match: RegExp; why: string }> = [
  { match: /seasonFixtures\(this\.club\.name, this\.leagueSeed\(\)/,
    why: 'The fixture list is the DIVISION\'s, not the generation\'s — an heir inheriting the club inherits its ' +
         'opponents, which is the point of a pyramid you climb. The m.season on the following line builds match ' +
         'ids and never reaches the seed; the window sees it, the code does not use it.' },
  { match: /const oppSeed = \(\(this\.leagueSeed\(\) \^ \(round \* 131\)\)/,
    why: 'seededOpponentTactics, whose own comment is "same club always plays the same way". A club that changed ' +
         'shape between generations would break the one thing this seed exists to guarantee.' },
];

const lines = readFileSync('client/src/main.ts', 'utf8').split('\n');
// AND AN ALIAS IS STILL A CALL. simRemainingFixtures wrote `const seed = this.leagueSeed()` and built the
// match seed off `seed` four code lines later. That site was invisible in BOTH directions: the seed line
// names no leagueSeed() so it was never an anchor, and the declaration, which is one, carries no season in
// its own window — so this probe was green over a match seed with no generation in it. Annotating the
// DECLARATION fixes nothing; the USE has to become an anchor in its own right or the same-line rule never
// gets to judge it. So resolve one-hop locals and substitute them at every use.
// Mutation-tested: swapping each of the 17 genSeed() call sites for a bare `seed` local caught 0 of 17
// before this, and 17 of 17 after. The direct revert to leagueSeed() stayed at 17 of 17 throughout.
const ALIAS = /^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*this\.leagueSeed\(\)/;
const aliasNames = [...new Set(lines.map((l) => ALIAS.exec(l)?.[1]).filter(Boolean) as string[])];
const ALIAS_USE = aliasNames.length ? new RegExp(`\\b(?:${aliasNames.join('|')})\\b`, 'g') : null;
const deAlias = (t: string) => (ALIAS_USE ? t.replace(ALIAS_USE, 'this.leagueSeed()') : t);
// A WINDOW, NOT A LINE. The first draft of this probe tested one line at a time, and the manager-arc site
// slipped straight through it: `const salt = (m.season * 7919 + …)` on one line, `pickManagerArc((this.
// leagueSeed() ^ salt) …)` on the next. The probe was green over both the defect and its fix — it could not
// see either. A seed is routinely built across two or three statements, so the scan reads a small window and
// the whole window has to carry the generation.
const WINDOW = 2;
let scoped = 0, selfLine = 0, viaAlias = 0;
const missing: string[] = [];
for (let i = 0; i < lines.length; i++) {
  // BOTH DIRECTIONS. The first widening only looked FORWARD from the seed line, and the case it was written
  // for reads `const salt = (m.season * 7919 …)` on the line BEFORE `pickManagerArc((this.leagueSeed() ^
  // salt) …)`. Mutation-testing the widened probe caught that: reverting the arc fix left it green.
  // COMMENTS DO NOT COUNT AS CODE. This codebase deliberately quotes the old broken spelling in the
  // comment that explains the fix — "genSeed, NOT leagueSeed" sits directly above the arc site — so a
  // window that reads comments lets the post-mortem vouch for the code. Measured: reverting that site to
  // leagueSeed left this probe GREEN on three of seventeen sites. Same trap phantom_mechanics and
  // destructive_delete both fell into; strip them before asking whether the generation is carried.
  // AND THE WINDOW COUNTS CODE LINES, NOT SOURCE LINES. Blanking a comment to spaces still leaves the LINE,
  // and the two multi-line seed builds in this file carry six- and seven-line explanations between the salt
  // and the seed — so a two-line window measured from the seed never reached the `m.season` above it.
  // Mutation sweep over all 16 sites: 14 caught, and exactly those 2 missed until the window began skipping
  // comment-only lines. It now walks outward past them, so the distance is in statements, not in prose.
  const win = deAlias(stripComments(codeWindow(lines, i, WINDOW)));
  const raw = lines[i];
  const here = deAlias(raw);
  // Anchor on the line that names the seed, so one site is reported once rather than WINDOW times.
  // The ANCHOR has to be code too — several comments in this file quote `leagueSeed()` while explaining
  // why a site no longer calls it, and anchoring on one reports the post-mortem as the defect.
  if (!isCodeLine(raw)) continue;
  if (!/leagueSeed\(\)|genSeed\(\)/.test(here)) continue;
  if (/private (league|gen)Seed\(\)/.test(here)) continue;   // the helpers themselves
  if (!/leagueSeed\(\)|genSeed\(\)/.test(raw)) viaAlias++;   // an anchor only because the alias resolved
  if (!SEASON.test(win)) continue;
  if (INTENDED.some((x) => x.match.test(win))) continue;
  scoped++;
  if (SEASON.test(here)) selfLine++;
  if (dropsGen(here) || !GEN.test(win)) missing.push(`main.ts:${i + 1}  ${raw.trim().slice(0, 112)}`);
}

console.log(`  ..   ${scoped} expression(s) mix leagueSeed() with a per-generation season, ${selfLine} of them on one line`);
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
// AND THE SAME-LINE RULE MUST STILL FIRE. `dropsGen` is the whole of the tightening and it matches on
// vocabulary — rename leagueSeed, or stop calling the field `season`, and it accepts everything in silence.
// The canary is the transfer-market line byte for byte as it read before §98 was fixed; the count below is
// its other half, because a rule no line reaches is just as inert as a rule that matches nothing.
ok(dropsGen('      ...transferList(this.leagueSeed(), m.season, tier),'),
   'the same-line rule still fires on the transfer-market line as it read before the fix');
ok(selfLine >= 2, `the same-line rule is not inert (${selfLine} self-contained seed expression(s) reach it)`);
// AND THE ALIAS RESOLUTION MUST STILL REACH. Its canary is simRemainingFixtures' match seed byte for byte
// as it read before this was fixed — `seed`, the local, not the call — because with the alias unresolved
// that line is not an anchor at all and nothing else in this file would notice.
console.log(`  ..   one-hop leagueSeed() aliases resolved: ${aliasNames.join(', ') || '(none)'}`);
ok(dropsGen(deAlias('      const mseed = ((seed >>> 0) ^ ((m.season * 131 + i) >>> 0)) >>> 0;')),
   'the alias rule still fires on the simmed-fixture match seed as it read before the fix');
ok(viaAlias >= 4, `the alias rule is not inert (${viaAlias} anchor(s) reached only by resolving an alias)`);
ok(scoped >= 10, `the scan actually matched season-derived seeds (${scoped}) — a low number here means the pattern moved, not that it was fixed`);
for (const m of missing) console.log(`       ${m}`);
ok(missing.length === 0, `every one of them also carries the generation (${missing.length} do not)`);

console.log(fails === 0 ? '\n✓ an heir does not replay his father\'s season' : `\n✗ ${fails} problem(s)`);
process.exit(fails === 0 ? 0 : 1);
