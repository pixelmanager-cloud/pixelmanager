// THE SEND-OFF MUST NAME THE HONOURS THAT MAN WON, NOT THE WHOLE HOUSE'S.
//
// `retireStar` writes the sentence the dynasty turns on — "retires a club great after ${era} steering
// ${club}${honourLine}" — and `era` is `m.season`, which `resetMgrForHeir` puts back to 1 at every
// succession. The honours beside it were not: `titles`, `contTitles` and `wcWins` are dynasty-LIFETIME
// counters the handover deliberately carries ("they are the dynasty rather than the season"), and the
// honours array read all three raw. So from generation 2 the emotional peak of the game credited one man
// with his fathers' silverware inside his own generation's era — "after 9 seasons and 12 league titles",
// arithmetically impossible on its face.
//
// It also contradicted the game's own answer. The SAME succession, ~90 lines on in `bringThroughHeir`,
// subtracts `cupsBanked` before stamping the permanent legend card (PT-113 / cups_per_generation.ts), and
// api.succeed's league count is the man's own accrued `ach_league` (rebornFields zeroes it per man). Two
// surfaces, one moment, two different men. The legend card is the one that is right; this probe holds the
// prose to it, so the send-off's cup terms must SUM to the number the legend card banks.
//
// main.ts is a DOM-coupled browser module nothing can import, so — like cups_per_generation.ts next door —
// this probe LIFTS the real honours construction and the real succession reset out of the file, EVALUATES
// them, and walks a five-generation dynasty through them. If either can no longer be lifted the probe
// FAILS rather than quietly passing over nothing.
//
// Run: `npx tsx tools/playtest/send_off_honours.ts`
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

/** The initializer of a `const <name> = ...` inside a method, as a callable of the manager save. Same lift
 *  cups_per_generation.ts uses, so both probes read the succession off one derivation. */
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

/** The object literal `resetMgrForHeir` writes back, as a callable of the prior save. */
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

/** The send-off's honour STRINGS, built by the real statements. Every `const` retireStar declares up to
 *  and including `honours` is taken verbatim; the ones that need the live Game (`this.loadMgr()`) are
 *  skipped and their values passed in instead, which is why a skipped statement the array actually needs
 *  throws at call time and is reported rather than silently producing a shorter list. */
function liftHonours(): ((m: Mgr, titles: number, contTitles: number) => string[]) | null {
  const body = methodBody('retireStar') as ts.Block | null;
  if (!body || !ts.isBlock(body)) return null;
  const parts: string[] = [];
  let reached = false;
  for (const st of body.statements) {
    if (reached) break;
    if (!ts.isVariableStatement(st)) continue;
    const text = st.getText(ast);
    if (/\bthis\./.test(text)) continue;
    parts.push(text);
    if (st.declarationList.declarations.some((d) => ts.isIdentifier(d.name) && d.name.text === 'honours')) reached = true;
  }
  if (!reached) return null;
  // THE LIFTED SPAN SEES retireStar's PARAMETERS TOO. It is a method body, so a `const` in it may read an
  // argument as freely as a local — `seasonsServed` arrived as one in the same wave that wrote this probe,
  // and lifting the span without it threw ReferenceError at evaluation rather than failing an assertion.
  // Every parameter this probe does not model is passed as undefined, which is exactly what the send-off
  // path supplies for the optional ones, so the lifted code takes the same branch the game takes.
  const params = (methodParams('retireStar') ?? []).filter((n) => n !== 'titles' && n !== 'contTitles');
  try {
    const fn = new Function('m', 'titles', 'contTitles', ...params, `${parts.join('\n')}\nreturn honours;`) as any;
    return (m: Mgr, titles: number, contTitles: number) => fn(m, titles, contTitles);
  } catch { return null; }
}

/** The parameter names of a method, so a lifted span can be evaluated with them in scope. */
function methodParams(method: string): string[] | null {
  let found: string[] | null = null;
  const walk = (n: ts.Node) => {
    if (ts.isMethodDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === method) {
      found = n.parameters.map((p) => (ts.isIdentifier(p.name) ? p.name.text : '')).filter(Boolean);
    }
    if (!found) ts.forEachChild(n, walk);
  };
  walk(ast);
  return found;
}

const honoursOf = liftHonours();
const cupsOf = liftConst('bringThroughHeir', 'cups');
const reset = liftReset();
ok(honoursOf != null, "the send-off's `honours` construction can still be lifted and evaluated — otherwise this probe is blind and must be re-pointed");
ok(cupsOf != null, "the succession's `cups` derivation can still be lifted and evaluated — otherwise this probe is blind and must be re-pointed");
ok(reset != null, "resetMgrForHeir's reset object can still be lifted and evaluated — otherwise this probe is blind and must be re-pointed");

/** What each generation actually wins. One wins NOTHING on purpose: a trophyless heir eulogised with his
 *  father's titles is the sharpest form of the defect. */
const WON = [
  { league: 2, cont: 1, wc: 0 },
  { league: 3, cont: 2, wc: 1 },
  { league: 0, cont: 0, wc: 0 },
  { league: 1, cont: 1, wc: 2 },
  { league: 4, cont: 3, wc: 1 },
];
const CAREER = 9;   // seasons a generation plays before the handover — this is the `era` the prose prints

const LEAGUE = /^(\d+) league title/;
const CONT = /^(\d+) continental cup/;
const WC = /^(\d+) World Finals title/;
const said = (lines: string[], re: RegExp): number => { const l = lines.find((x) => re.test(x)); return l ? Number(re.exec(l)![1]) : 0; };

type Row = { league: number; cont: number; wc: number; cups: number; terms: number };

/** Walk the dynasty through the REAL increment sites, the REAL send-off honours and the REAL succession
 *  reset, in the order the game runs them: the send-off is rendered, then succeed() banks the legend card,
 *  then the handover stamps the high-water marks. */
function dynasty(honours: (m: Mgr, titles: number, contTitles: number) => string[]): Row[] {
  const rows: Row[] = [];
  let m: Mgr = { season: 1, results: [] };
  for (const gen of WON) {
    for (let i = 0; i < gen.league; i++) m.titles = (m.titles ?? 0) + 1;
    for (let i = 0; i < gen.cont; i++) m.contTitles = (m.contTitles ?? 0) + 1;
    for (let i = 0; i < gen.wc; i++) m.wcWins = (m.wcWins ?? 0) + 1;
    m.season = CAREER; m.starName = 'Ravi Kestrel'; m.starAge = 34;
    // exactly what the two call sites pass: the rollover saves `titles` onto the save before handing off,
    // and the sale path reads `m.titles` / `m.contTitles` straight back out.
    const lines = honours(m, m.titles ?? 0, m.contTitles ?? 0);
    rows.push({ league: said(lines, LEAGUE), cont: said(lines, CONT), wc: said(lines, WC), cups: cupsOf!(m), terms: lines.length });
    m = reset!(m);
  }
  return rows;
}

if (!honoursOf || !cupsOf || !reset) { ok(false, 'nothing to walk — the checks above already said why'); }
else {
  const rows = dynasty(honoursOf);
  console.log('\n=== Five generations, each read its own send-off ===');
  rows.forEach((r, g) => console.log(`  ..   gen ${g}: won ${WON[g].league}/${WON[g].cont}/${WON[g].wc} (league/cont/wc) in ${CAREER} seasons — the send-off says ${r.league}/${r.cont}/${r.wc}, the legend card banks ${r.cups} cup(s)`));

  // NOT VACUOUS. A walk that won nothing, or a reworded sentence these regexes can no longer read, would
  // make "said === won" trivially true at 0 === 0 for every generation. Both ends are pinned: silverware
  // is won, and the prose must actually be printing terms this probe can parse.
  const totalWon = WON.reduce((a, g) => a + g.league + g.cont + g.wc, 0);
  ok(totalWon > 0, `the walk actually wins silverware (${totalWon} honours over ${WON.length} generations)`);
  const parsed = rows.reduce((a, r) => a + r.league + r.cont + r.wc, 0);
  const printed = rows.reduce((a, r) => a + r.terms, 0);
  ok(parsed > 0 && printed > 0, `the send-off still prints honour terms this probe can read (${printed} term(s), ${parsed} honour(s) parsed)`);

  const wrong = rows.filter((r, g) => r.league !== WON[g].league || r.cont !== WON[g].cont || r.wc !== WON[g].wc);
  ok(wrong.length === 0, `every send-off names the honours THAT man won (${wrong.length} of ${WON.length} generation(s) were handed an ancestor's)`);

  // AND THE TWO SURFACES AGREE. The legend card is the one that is right; the prose has to add up to it.
  const split = rows.filter((r) => r.cont + r.wc !== r.cups);
  ok(split.length === 0, `the send-off's cups sum to the cups the legend card banks (${split.length} generation(s) disagreed with themselves)`);

  const idle = WON.findIndex((g) => g.league + g.cont + g.wc === 0);
  ok(rows[idle].terms === 0, `a generation that wins nothing is eulogised with nothing (gen ${idle} listed ${rows[idle].terms} honour(s))`);

  // MUTATION CONTROL. The assertions above are only worth anything if they can see the defect. Feed them
  // the pre-fix construction on purpose — the raw lifetime counters, exactly what shipped — and the same
  // walk must come back compounding.
  const broken = dynasty((m, titles, contTitles) => [titles ? `${titles} league title` : '', contTitles ? `${contTitles} continental cup` : '', (m.wcWins ?? 0) ? `${m.wcWins} World Finals title` : ''].filter(Boolean));
  const brokenTotal = broken.reduce((a, r) => a + r.league + r.cont + r.wc, 0);
  console.log(`  ..   the same walk on the raw lifetime counters → ${broken.map((r) => `${r.league}/${r.cont}/${r.wc}`).join(', ')} (${brokenTotal} honours claimed for ${totalWon} won)`);
  ok(brokenTotal > totalWon, `the check can see the house's honours piling onto one man at all (${brokenTotal} vs ${totalWon} when forced)`);
}

console.log(fails ? `\n✗ ${fails} check(s) failed — a man's send-off is reading out the whole house's honours` : '\n✓ every send-off names only the honours that man won');
if (fails) process.exitCode = 1;
