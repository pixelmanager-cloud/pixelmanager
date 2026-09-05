// THE KNOCKOUT PRESSER BANK HAS TO REACH THE KNOCKOUTS THIS GAME ACTUALLY HAS.
//
// `pressConferenceLine` gated PRE_CUP on `input.competition === 'cup'` (shared/src/press.ts) and nothing
// in the game can produce that value: `spFixture.comp` is typed `'league' | 'cont' | 'wc'` and both call
// sites map it to 'league' | 'continental' | 'international'. So 57 finished lines — written for a
// single-game knockout, "One game. No second leg, no second chance." — had never been on screen once,
// which is exactly what the Continental Cup's QF/SF/Final and the World Finals knockouts are.
//
// The competition values are ternaries buried in a 9k-line class, so this lifts BOTH expressions out of
// the source and evaluates them over the declared `comp` union, the way press_stakes_occasion.ts does —
// the check is then on the values the game really passes, not on a pattern a rewrite could satisfy while
// changing the answer.
//
// It also holds the fixture to the truth in the other direction. The bank is domestic-cup prose, and it
// survives the move (both competitions really are one game settled on penalties, so the shoot-out lines
// are literally true) except for one: "the atmosphere at a smaller ground" names a venue neither tie can
// have. That line is out of the bank and kept here as a CONTROL — the matcher has to fire on it, and to
// fire on nothing a real fixture can draw. Widening the gate without that removal turns this probe red.
//
// Run: `npx tsx tools/playtest/press_cup_reach.ts`
import { readFileSync } from 'node:fs';
import { pressConferenceLine, type PressCompetition, type PressForm } from '../../shared/src/press.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The cup-tie presser reaches the cup ties the game has ===');

// ── WHAT THE GAME CAN ACTUALLY PASS, LIFTED OUT OF THE CALL SITES ────────────────────────────────
const src = readFileSync('client/src/main.ts', 'utf8');
function between(open: string, close: string): string {
  const n = src.split(open).length - 1;
  ok(n === 1, `\`${open.trim()}\` appears exactly once in client/src/main.ts (found ${n})`);
  if (n !== 1) return '';
  const i = src.indexOf(open) + open.length;
  return src.slice(i, src.indexOf(close, i));
}
const preExpr = between(`{ timing: 'pre', competition: `, `, stakes:`);
const postExpr = between('const competition: PressCompetition = ', ';');
const compUnion = between('oppTactics: Tactics; comp?: ', ';');
if (!preExpr || !postExpr || !compUnion) { console.log('\n✗ could not read both press call sites and the spFixture comp union — renamed?'); process.exit(1); }
console.log(`  ..   pre : ${preExpr}`);
console.log(`  ..   post: ${postExpr}`);

// Every value `spFixture.comp` can hold, straight off the field declaration, plus the league default.
const COMPS: Array<string | undefined> = [...compUnion.matchAll(/'(\w+)'/g)].map((m) => m[1]);
COMPS.push(undefined); // a league fixture never sets `comp` at all
console.log(`  ..   spFixture.comp can be: ${COMPS.map((c) => c ?? 'undefined').join(', ')}`);
ok(COMPS.length >= 3, `the comp union was parsed (${COMPS.length} value(s))`);

const evalComp = (expr: string) => new Function(`return (${expr});`) as (this: { spFixture: { comp?: string } }) => PressCompetition;
const pre = evalComp(preExpr), post = evalComp(postExpr);
const PRODUCED = new Set<PressCompetition>();
for (const comp of COMPS) { PRODUCED.add(pre.call({ spFixture: { comp } })); PRODUCED.add(post.call({ spFixture: { comp } })); }
console.log(`  ..   the two call sites can pass: ${[...PRODUCED].sort().join(', ')}${PRODUCED.has('cup') ? '' : "  (no 'cup' — there is no domestic cup in the game)"}`);

// ── THE AUTHORED BANK, READ OUT OF THE CORPUS ────────────────────────────────────────────────────
// Parsed rather than inferred by set difference: a set difference can only ever find lines the function
// already reaches, so an emptied or half-unreachable bank would report clean.
function bank(file: string, open: string, close: string): string[] {
  const s = readFileSync(file, 'utf8');
  const i = s.indexOf(open);
  if (i < 0) return [];
  const body = s.slice(i + open.length, s.indexOf(close, i));
  return [...body.matchAll(/`([^`]*)`|'((?:[^'\\]|\\.)*)'/g)].map((m) => (m[1] ?? m[2]).replace(/\\'/g, "'")).filter((l) => l.length > 20);
}
const packBank = (key: string) => [1, 2, 3, 4].flatMap((n) => bank(`shared/src/extra/press_pack_${n}.ts`, `  ${key}: [`, '\n  ],'));
const corpus = (key: string) => [...new Set([...bank('shared/src/press.ts', `const BASE_${key}: string[] = [`, '\n];'), ...packBank(key)])];
const CUP = corpus('PRE_CUP'), CONT = corpus('PRE_CONTINENTAL'), INTL = corpus('PRE_INTERNATIONAL');
console.log(`  ..   authored: PRE_CUP ${CUP.length} · PRE_CONTINENTAL ${CONT.length} · PRE_INTERNATIONAL ${INTL.length}`);
// VACUITY GUARD. Everything below is free if the bank is empty — then "no line is stranded" is true and
// says nothing. Deleting the pool is decision (b) in docs section 94; if someone takes it, this fires.
ok(CUP.length > 40, `PRE_CUP is a real bank and was parsed (${CUP.length} lines)`);

// ── WHAT A REAL FIXTURE CAN DRAW ─────────────────────────────────────────────────────────────────
// Seed and salt swept independently: a salt that moves with the seed lands on a fraction of a bank
// (press_pre_salt.ts hit that exact degeneracy) and would understate reachability here.
const FORMS: PressForm[] = ['hot', 'cold', 'level'];
function reach(competition: PressCompetition): Set<string> {
  const seen = new Set<string>();
  for (let seed = 0; seed < 400; seed++) for (let salt = 0; salt < 60; salt++)
    for (const stakes of [1, 2, 3] as const) for (const form of FORMS)
      seen.add(pressConferenceLine(seed, salt, { timing: 'pre', competition, stakes, form }));
  return seen;
}
const BY_COMP = new Map([...PRODUCED].map((c) => [c, reach(c)] as const));
const reachable = (l: string) => [...BY_COMP.values()].some((s) => s.has(l));

const stranded = CUP.filter((l) => !reachable(l));
console.log(`  ..   ${CUP.length - stranded.length}/${CUP.length} PRE_CUP lines are reachable from a fixture the game can build`);
ok(stranded.length === 0, stranded.length
  ? `${stranded.length} cup-tie line(s) can never be shown, e.g. “${stranded[0].slice(0, 64)}…”`
  : 'every authored cup-tie line reaches at least one competition the game passes');

// ── MUTATION GUARD ───────────────────────────────────────────────────────────────────────────────
// Pushing PRE_CUP unconditionally would pass the check above and put "Cup week." in front of a Tuesday
// league fixture — the opposite bug, and the reason the pool is gated on the competition at all.
const leaked = CUP.filter((l) => BY_COMP.get('league')?.has(l));
console.log(`  ..   ${leaked.length} cup-tie line(s) reachable on a plain league fixture`);
ok(leaked.length === 0, leaked.length
  ? `${leaked.length} cup-tie line(s) leak into league week, e.g. “${leaked[0].slice(0, 64)}…”`
  : 'a league fixture still never draws cup-tie prose');

// ── THE POOLS IT RIDES ALONGSIDE ARE NOT DROWNED ─────────────────────────────────────────────────
// `pick(h, pools)` weights by POOL, not by line, so a third pool takes a third of the nights. That is
// the cost of the fix and it is bounded here: joining PRE_CONTINENTAL / PRE_INTERNATIONAL, not replacing
// them. Both call sites force stakes 3 on these ties, so that is the only sample worth measuring.
function share(competition: PressCompetition, of: string[]): number {
  const set = new Set(of); let hit = 0, n = 0;
  for (let seed = 0; seed < 400; seed++) for (let salt = 0; salt < 60; salt++) { n++; if (set.has(pressConferenceLine(seed, salt, { timing: 'pre', competition, stakes: 3, form: 'level' }))) hit++; }
  return hit / n;
}
const contShare = share('continental', CONT), intlShare = share('international', INTL), cupOnCont = share('continental', CUP);
console.log(`  ..   continental night: ${(100 * contShare).toFixed(1)}% continental prose · ${(100 * cupOnCont).toFixed(1)}% cup-tie prose`);
console.log(`  ..   World-Finals tie : ${(100 * intlShare).toFixed(1)}% international prose`);
ok(contShare >= 0.25, `a continental night still draws its own pool at least a quarter of the time (${(100 * contShare).toFixed(1)}%)`);
ok(intlShare >= 0.25, `a World-Finals tie still draws its own pool at least a quarter of the time (${(100 * intlShare).toFixed(1)}%)`);

// ── AND NO LINE LIES ABOUT WHERE THE TIE IS BEING PLAYED ─────────────────────────────────────────
// The continental QF/SF is away at a club that finished top-3 in another country and the final, like
// every World-Finals tie, is on neutral ground — `neutral: true` at both spFixture sites. A giant-killing
// trip to a smaller ground is the one domestic-cup beat that cannot survive the move, so it is out of the
// bank; CONTROL is the removed sentence, kept here so this check cannot go quietly vacuous — if the
// matcher stops firing on it, the matcher is broken, not the corpus.
const VENUE_LIE = /smaller ground|lower-league|non-league/i;
const CONTROL = 'A question about the atmosphere at a smaller ground gets a genuinely enthusiastic reply.';
ok(VENUE_LIE.test(CONTROL), 'the venue matcher still fires on the line this fix removed (it is not mis-spelled)');
const lying = [...(BY_COMP.get('continental') ?? []), ...(BY_COMP.get('international') ?? [])].filter((l) => VENUE_LIE.test(l));
console.log(`  ..   ${lying.length} reachable knockout line(s) claim a venue the tie cannot have`);
ok(lying.length === 0, lying.length
  ? `${lying.length} line(s) put a continental or World-Finals tie at a small ground, e.g. “${lying[0].slice(0, 64)}…”`
  : 'no reachable knockout line puts the tie at a ground the fixture cannot be at');

console.log(fails ? `\n✗ ${fails} check(s) failed — the cup-tie press bank is still dark, or it is lying about the fixture` : '\n✓ the cup-tie bank rides with the continental and World-Finals ties, and tells the truth about them');
if (fails) process.exitCode = 1;
