// A BOUGHT OUTSIDER IS NOT THE FIRST OF THE LINE.
//
// `pedigreeText` takes a third argument, `isFounder`, and its own comment says why it exists: "'First of
// the line' belongs to the FOUNDER, not to every generation-0 token — a bought prospect is a scouted
// outsider who happens to have no pedigree yet, and calling him the head of the bloodline while the real
// founder is on the same screen made the family name look like a label anyone could wear."
//
// That argument DEFAULTS TO TRUE, so a call site that forgets it still compiles, still renders and still
// reads fine in review — it just quietly bills every stranger as the founder. showAcademy did exactly
// that, on the one screen where the founder and the 300-coin purchase are listed side by side.
//
// The NAME half of this same defect was already fixed a floor down (api.ts, mintGenesisLocal: "a 300-coin
// purchase came back carrying the player's own surname and the academy called him 'first of the line'").
// The caption half shipped on regardless, because nothing measured it.
//
// HOW THIS MEASURES IT, rather than reading the source and hoping:
//   * it drives a REAL save — register, sign the founding prospect, buy one 300c genesis outsider — so the
//     two rows are the ones the Academy actually renders;
//   * it lifts the SHIPPED `pedigreeText` and `carriesFamilyName` out of main.ts (parsed, transpiled,
//     instantiated) instead of reimplementing them, so a change to either is felt here;
//   * it calls them through each call site's OWN argument list, passing `undefined` where a site omits the
//     third argument — which is exactly what a default parameter receives, default and all.
// The assertion is then the thing the player sees: the founder and the bought outsider must not be handed
// the same caption.
//
// NOT VACUOUS: the run first asserts the save produced one row that carries the family name and one that
// does not, and that BOTH are generation 0 with pedigree 0 — i.e. that the first two arguments genuinely
// cannot tell them apart, so the third is the only thing doing the work. Mutation-test it by deleting the
// third argument at any of the three call sites: those two captions collapse onto the founder line and
// this goes red. That is the current tree at showAcademy.
//
// Run: `npx tsx tools/playtest/pedigree_caption.ts`
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend } from '../../client/src/save.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const srcPath = fileURLToPath(new URL('../../client/src/main.ts', import.meta.url));
const src = readFileSync(srcPath, 'utf8');
const ast = ts.createSourceFile(srcPath, src, ts.ScriptTarget.ESNext, true);

/** The SHIPPED helper, lifted out of main.ts and made callable — not a copy of it. Both helpers close over
 *  nothing but their own parameters, which is what makes this safe; if that ever stops being true the
 *  instantiation throws and this probe goes red rather than quietly measuring a stub. */
function lift(name: string): (...a: any[]) => any {
  let text = '';
  const visit = (n: ts.Node): void => {
    if (text) return;
    if (ts.isFunctionDeclaration(n) && n.name?.text === name && n.body) { text = n.getText(ast); return; }
    ts.forEachChild(n, visit);
  };
  visit(ast);
  if (!text) throw new Error(`main.ts no longer declares ${name}() — this probe would be measuring nothing`);
  const js = ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  return new Function(`${js}; return ${name};`)();
}

/** Every `pedigreeText(...)` call in main.ts, with the method it renders from and its literal arguments. */
function callSites(): { line: number; where: string; args: string[] }[] {
  const out: { line: number; where: string; args: string[] }[] = [];
  const enclosing = (n: ts.Node): string => {
    for (let q: ts.Node | undefined = n; q; q = q.parent) {
      if ((ts.isMethodDeclaration(q) || ts.isFunctionDeclaration(q)) && q.name && ts.isIdentifier(q.name)) return q.name.text;
    }
    return '<top level>';
  };
  const visit = (n: ts.Node): void => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'pedigreeText') {
      out.push({ line: ast.getLineAndCharacterOfPosition(n.getStart(ast)).line + 1, where: enclosing(n), args: n.arguments.map((a) => a.getText(ast)) });
    }
    ts.forEachChild(n, visit);
  };
  visit(ast);
  return out;
}

async function main() {
  console.log('=== The 300c outsider is not billed as the first of the line ===');
  const pedigreeText = lift('pedigreeText');
  const carriesFamilyName = lift('carriesFamilyName');

  // A real save, reached the way the Academy is reached: found the line, then buy a stranger.
  __setBackendForTests(createInMemoryBackend());
  const reg: any = await api.register('dynasty', 'x', 'Ashcombe', 20260902, 'fam');
  const clubName: string = reg.club.name;
  const { candidates } = await api.scoutProspects(3) as any;
  await api.signProspect(candidates[0].seed);
  // The purchase is the whole subject. If it ever stops being affordable out of the starting purse this is
  // a red with a reason, not a silent skip over an empty prospect list.
  try { await api.genesis(); } catch (e: any) {
    throw new Error(`could not buy the 300c outsider: ${e?.body?.error ?? e?.message ?? e}`);
  }
  const { prospects } = await api.prospects() as any;

  const founder = prospects.find((p: any) => carriesFamilyName(p.name, clubName));
  const outsider = prospects.find((p: any) => !carriesFamilyName(p.name, clubName));
  console.log(`  ..   club "${clubName}" · ${prospects.length} prospects on the academy board`);
  console.log(`  ..   founder ${founder ? `"${founder.name}"` : '(none)'} · bought outsider ${outsider ? `"${outsider.name}"` : '(none)'}`);
  ok(!!founder && !!outsider, 'the save produced BOTH a founder and a bought outsider (this is not an empty check)');
  if (!founder || !outsider) { console.log('\n✗ nothing to measure'); process.exit(1); }
  console.log(`  ..   founder gen ${founder.generation}/ped ${founder.pedigree} · outsider gen ${outsider.generation}/ped ${outsider.pedigree}`);
  ok(founder.generation === 0 && founder.pedigree === 0 && outsider.generation === 0 && outsider.pedigree === 0,
     'both are generation 0 with pedigree 0 — the first two arguments genuinely cannot tell them apart');

  const sites = callSites();
  ok(sites.length >= 3, `main.ts still renders this caption from ${sites.length} call site(s)`);
  for (const s of sites) {
    // `undefined` for a missing third argument is not a stand-in — it is precisely what a default parameter
    // receives, so an omitted argument is evaluated here exactly as the browser evaluates it.
    const cap = (p: any) => pedigreeText(p.pedigree, p.generation, s.args.length >= 3 ? carriesFamilyName(p.name, clubName) : undefined);
    const a = cap(founder), b = cap(outsider);
    console.log(`  ..   main.ts:${s.line} ${s.where}() → founder "${a}" · outsider "${b}"`);
    ok(a !== b, `${s.where}() (main.ts:${s.line}) gives the founder and the bought outsider DIFFERENT captions`);
    ok(!/first of the line/i.test(b), `${s.where}() (main.ts:${s.line}) does not call the bought outsider the first of the line`);
    // A hard-coded `true`/`false` would satisfy the arity while restoring the defect, so the third argument
    // has to be derived from the family name and nothing else.
    if (s.args.length >= 3) {
      ok(/^carriesFamilyName\(/.test(s.args[2]),
         `${s.where}() derives isFounder from the family name, not a literal (${s.args[2]})`);
    }
  }

  console.log(fails ? `\n✗ ${fails} failure(s) — a stranger you bought is being called the head of the bloodline`
                    : '\n✓ every caption site tells the founder apart from the man he bought');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
