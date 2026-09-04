// A LEGEND CARD MUST CARRY THE CUPS THAT MAN WON, NOT THE WHOLE HOUSE'S.
//
// `bringThroughHeir` hands `cups` to api.succeed, which writes `ach_cup: (t.ach_cup ?? 0) + cups` — and
// rebornFields has just zeroed ach_cup for the new generation, so the number passed IS the retiring man's
// permanent legend card. It was derived from `m.contTitles` and `m.wcWins`, which are DYNASTY-LIFETIME
// counters: they only ever increment (`(m.contTitles ?? 0) + 1`), and `resetMgrForHeir` deliberately
// carries them because "they are the dynasty rather than the season". So from generation 2 every man was
// banked with his fathers' silverware as well as his own, and a trophyless heir retired credited with cups
// he never played for. It is not cosmetic: membersOf scores `cups` through manRenown at 40 renown each, so
// the house's cup renown grows triangularly, and legacyCard's trophyPts moves legendRating — the tier
// word, the mintable gate and the testimonial coin purse succeed() actually pays out.
//
// main.ts is a DOM-coupled browser module nothing can import, so — like wc_edition_dynasty.ts next door —
// this probe LIFTS the real `cups` expression and the real `resetMgrForHeir` literal out of the file,
// EVALUATES them, and walks a five-generation dynasty through them. If either can no longer be lifted the
// probe FAILS rather than quietly passing over nothing.
//
// Run: `npx tsx tools/playtest/cups_per_generation.ts`
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const srcPath = fileURLToPath(new URL('../../client/src/main.ts', import.meta.url));
const src = readFileSync(srcPath, 'utf8');
const ast = ts.createSourceFile(srcPath, src, ts.ScriptTarget.ESNext, true);
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

type Mgr = Record<string, any>;

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

/** The initializer of a `const <name> = ...` inside a method, as a callable of the manager save. It can
 *  only be evaluated if it is a pure function of that save — any other `this.` reference and there is
 *  nothing here to reason about, so the lift fails loudly instead of guessing. */
function liftConst(method: string, name: string): ((m: Mgr) => number) | null {
  const body = methodBody(method);
  if (!body) return null;
  let text = '';
  const seek = (n: ts.Node): void => {
    if (text) return;
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name && n.initializer) { text = n.initializer.getText(ast); return; }
    ts.forEachChild(n, seek);
  };
  seek(body);
  if (!text || /this\./.test(text)) return null;
  try { return new Function('m', `return (${text});`) as (m: Mgr) => number; } catch { return null; }
}

/** The object literal `resetMgrForHeir` writes back, as a callable of the prior save — so whatever the
 *  handover really carries (by the spread) and really stamps is what the dynasty below is walked through. */
function liftReset(): ((prior: Mgr) => Mgr) | null {
  const body = methodBody('resetMgrForHeir');
  if (!body) return null;
  let lit = '';
  const seek = (n: ts.Node): void => {
    if (lit) return;
    if (ts.isObjectLiteralExpression(n)) { lit = n.getText(ast); return; }
    ts.forEachChild(n, seek);
  };
  seek(body);
  if (!lit || !/\.\.\.prior/.test(lit) || /this\./.test(lit)) return null;
  try { return new Function('prior', `return ${lit};`) as (p: Mgr) => Mgr; } catch { return null; }
}

const cupsOf = liftConst('bringThroughHeir', 'cups');
const reset = liftReset();
ok(cupsOf != null, "the succession's `cups` derivation can still be lifted and evaluated — otherwise this probe is blind and must be re-pointed");
ok(reset != null, "resetMgrForHeir's reset object can still be lifted and evaluated — otherwise this probe is blind and must be re-pointed");

/** Continental cups and World Finals each generation actually wins. One generation wins NOTHING on
 *  purpose: a trophyless heir banked with his father's cups is the sharpest form of the defect. */
const WON = [
  { cont: 1, wc: 0 },
  { cont: 2, wc: 1 },
  { cont: 0, wc: 0 },
  { cont: 1, wc: 2 },
  { cont: 3, wc: 1 },
];
const CAREER = 11; // seasons a generation plays before the handover

/** Walk the dynasty through the REAL increment sites (`(m.contTitles ?? 0) + 1` when the continental cup
 *  is won, `(m.wcWins ?? 0) + 1` for the World Finals), the real `cups` derivation and the real succession
 *  reset — in the order bringThroughHeir runs them: succeed() banks the card first, then the handover. */
function dynasty(cupsF: (m: Mgr) => number): number[] {
  const banked: number[] = [];
  let m: Mgr = { season: 1, results: [] };
  for (const gen of WON) {
    for (let i = 0; i < gen.cont; i++) m.contTitles = (m.contTitles ?? 0) + 1;
    for (let i = 0; i < gen.wc; i++) m.wcWins = (m.wcWins ?? 0) + 1;
    m.season = CAREER;
    // api.succeed floors and clamps to 0..40; this walk stays inside that, so the number derived here is
    // the number that lands on ach_cup.
    banked.push(cupsF(m));
    m = reset!(m);
  }
  return banked;
}

if (!cupsOf || !reset) { ok(false, 'nothing to walk — the checks above already said why'); }
else {
  const won = WON.map((g) => g.cont + g.wc);
  const banked = dynasty(cupsOf);
  console.log('\n=== Five generations, each banked onto its own legend card at its handover ===');
  banked.forEach((b, g) => console.log(`  ..   gen ${g}: won ${won[g]} cup(s) this generation, banked ${b}${b === won[g] ? '' : `  ← ${b - won[g]} of them his fathers'`}`));

  // NOT VACUOUS: a walk that won nothing, or a derivation stuck at 0, would make "banked === won"
  // trivially true. Both ends are pinned — cups are won, and the total banked has to match them.
  const totalWon = won.reduce((a, b) => a + b, 0);
  ok(totalWon > 0, `the walk actually wins silverware (${totalWon} cups over ${WON.length} generations)`);

  const wrong = banked.filter((b, g) => b !== won[g]).length;
  ok(wrong === 0, `every generation banks the cups IT won (${wrong} of ${WON.length} generation(s) banked someone else's)`);

  const totalBanked = banked.reduce((a, b) => a + b, 0);
  ok(totalBanked === totalWon, `the bloodline banks each cup exactly once (${totalBanked} banked for ${totalWon} won)`);

  const idle = WON.findIndex((g) => g.cont + g.wc === 0);
  ok(banked[idle] === 0, `a generation that wins nothing banks nothing (gen ${idle} banked ${banked[idle]})`);

  // MUTATION CONTROL. The assertions above are only worth something if they can see the defect at all.
  // Feed them the pre-fix derivation on purpose — the raw lifetime sum, exactly what shipped — and it must
  // come back compounding.
  const brokenBanked = dynasty((m) => (m.contTitles ?? 0) + (m.wcWins ?? 0));
  const brokenTotal = brokenBanked.reduce((a, b) => a + b, 0);
  console.log(`  ..   the same walk on the raw lifetime sum → banked ${brokenBanked.join(', ')} (${brokenTotal} for ${totalWon} cups won)`);
  ok(brokenTotal > totalWon, `the check can see cups compounding across generations at all (${brokenTotal} vs ${totalWon} when forced)`);
}

console.log(fails ? `\n✗ ${fails} check(s) failed — a man's legend card is carrying the whole house's cups` : '\n✓ every legend card carries only the cups that man won');
if (fails) process.exitCode = 1;
