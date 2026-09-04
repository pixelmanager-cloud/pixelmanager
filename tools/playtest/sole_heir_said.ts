// ── THE ONE-SON SUCCESSION HAS TO SAY SO, IN WORDS ───────────────────────────────────────────────────
// shared/src/bloodline.ts states the requirement outright: a generation with a single heir is DELIBERATE,
// and the UI must say so in words, or a one-heir succession reads as a bug rather than a fact of the
// family. heirCount hands back one boy about a fifth of the time, and at the FIRST succession of a save
// there are no passed-over branches to sweep a cousin out of, so that fifth lands with nothing to soften
// it — on the payoff beat of the whole dynasty loop.
//
// It did not say so. bringThroughHeir calls showHeirChoice ONLY when the sibling list is non-empty, and
// showHeirChoice builds `all` as [the played son, ...siblings] — so `all.length` inside it is never 1.
// Both sentences written for the lone heir ('The next of the line' / 'One son, and the name goes with
// him.') sat on that screen behind `all.length === 1`: authored, shipped, unreachable. The succession with
// no choice in it fell through to showProspectCard, which was byte-for-byte the card a three-brother pick
// produces. Two dead strings, and silence exactly where the design doc asked for a sentence.
//
// main.ts is a DOM-coupled monolith with no seam to drive headlessly, so this guards the invariant at the
// SOURCE level, like heir_signal.ts and succession_carries.ts next door. PARSED, NOT SLICED: every body
// comes from the TypeScript AST, so a fixed byte window cannot drift off the end as comments grow.
//
// MUTATION-TESTING THIS PROBE (it must not be able to pass over nothing):
//   - put `all.length === 1 ? 'The next of the line'` back on the heir screen  -> check 3 FAILs
//   - delete the `soleHeir ?` pc-stake line from showProspectCard              -> check 4 FAILs
//   - drop the third argument at the no-siblings call site                     -> check 5 FAILs
//   - pass the flag from mintGenesis's card as well                            -> check 6 FAILs
//   - delete the `sibs?.length` guard so every succession opens the heir screen -> check 2 FAILs, which is
//     the right answer and not a nuisance: without that guard a lone heir DOES reach showHeirChoice, and
//     the one-heir arm check 3 forbids would have to come back.
//   - rename showProspectCard / showHeirChoice / bringThroughHeir -> check 1 FAILs and the run stops
//     there, which is the point: checks 3 and 6 are negatives that would sail through an empty string.
//
// Run: `npx tsx tools/playtest/sole_heir_said.ts`
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const srcPath = fileURLToPath(new URL('../../client/src/main.ts', import.meta.url));
const src = readFileSync(srcPath, 'utf8');
const ast = ts.createSourceFile(srcPath, src, ts.ScriptTarget.ESNext, true);

let fails = 0;
const check = (ok: boolean, msg: string) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails++; };

/** The named method's own node, from the AST — not a byte window off a string index. */
function methodNode(name: string): ts.MethodDeclaration | undefined {
  let found: ts.MethodDeclaration | undefined;
  const visit = (n: ts.Node): void => {
    if (found) return;
    if (ts.isMethodDeclaration(n) && n.name && ts.isIdentifier(n.name) && n.name.text === name && n.body) { found = n; return; }
    ts.forEachChild(n, visit);
  };
  visit(ast);
  return found;
}

/** Every `this.<name>(...)` call in the file, with the method that encloses each one. */
function callsTo(name: string): Array<{ node: ts.CallExpression; owner: string }> {
  const out: Array<{ node: ts.CallExpression; owner: string }> = [];
  const visit = (n: ts.Node): void => {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)
      && n.expression.expression.kind === ts.SyntaxKind.ThisKeyword && n.expression.name.text === name) {
      let up: ts.Node | undefined = n, owner = '(top level)';
      while (up) {
        if (ts.isMethodDeclaration(up) && up.name && ts.isIdentifier(up.name)) { owner = up.name.text; break; }
        up = up.parent;
      }
      out.push({ node: n, owner });
    }
    ts.forEachChild(n, visit);
  };
  visit(ast);
  return out;
}

console.log('=== A generation with one heir says so ===');

// 1. ANTI-VACUITY GATE. Checks 3 and 6 are NEGATIVES — they pass over an empty string — so all three
//    bodies have to be found, and have to still be the screens this probe is about, before anything else
//    is allowed to report.
const prospect = methodNode('showProspectCard');
const heirs = methodNode('showHeirChoice');
const bring = methodNode('bringThroughHeir');
const pBody = prospect?.body ? prospect.body.getText(ast) : '';
const hBody = heirs?.body ? heirs.body.getText(ast) : '';
const bBody = bring?.body ? bring.body.getText(ast) : '';
console.log(`  ..   bodies from the AST: showProspectCard ${pBody.length}B · showHeirChoice ${hBody.length}B · bringThroughHeir ${bBody.length}B`);
check(pBody.includes('pc-stake') && pBody.includes('player-card-ov') && hBody.includes('data-heir')
  && hBody.includes('cg-heir-go') && bBody.includes('api.succeed'),
  'all three succession methods were found and still render the cards / run the handover');
if (!pBody || !hBody || !bBody) { console.log('\n✗ nothing to check — a succession method is gone or renamed'); process.exit(1); }

// 2. THE PREMISE OF CHECK 3. The heir screen is reachable only behind a non-empty sibling list; that is
//    the whole reason a one-heir arm on it is dead. If this fork ever changes, check 3 changes with it.
const forks: ts.IfStatement[] = [];
const seekFork = (n: ts.Node): void => {
  if (ts.isIfStatement(n) && n.thenStatement.getText(ast).includes('showHeirChoice')) forks.push(n);
  ts.forEachChild(n, seekFork);
};
seekFork(bring!.body!);
const cond = forks[0]?.expression.getText(ast) ?? '(none)';
const elseTxt = forks[0]?.elseStatement?.getText(ast) ?? '';
console.log(`  ..   ${forks.length} fork(s) into the heir screen; guard: \`${cond}\``);
check(forks.length === 1 && /\.length\b/.test(cond) && elseTxt.includes('showProspectCard'),
  'the heir screen is opened only when a sibling list is non-empty, and the empty case falls to the prospect card');

// 3. So no branch on that screen may test for a single heir, and the sentence for one must not be left
//    there. `all` is [played, ...siblings]; with the guard above it cannot be shorter than 2.
//    READ AS CODE, NOT AS TEXT: a comment on this screen explaining why the arm is gone would otherwise
//    match a regex over the body and fail the very fix it documents.
const deadArms: string[] = [];
const seekArm = (n: ts.Node): void => {
  if (ts.isBinaryExpression(n)) {
    const sides = [n.left.getText(ast).trim(), n.right.getText(ast).trim()];
    const op = n.operatorToken.getText(ast);
    const one = sides.some((s) => /^all\.length$/.test(s)) && sides.some((s) => s === '1') && /^[!=]==?$/.test(op);
    const under = /^all\.length$/.test(sides[0]) && ((op === '<=' && sides[1] === '1') || (op === '<' && sides[1] === '2'));
    if (one || under) deadArms.push(n.getText(ast));
  }
  ts.forEachChild(n, seekArm);
};
seekArm(heirs!.body!);
/** Every string / template chunk the screen can actually print — comments excluded. */
function spoken(node: ts.Node): string {
  let out = '';
  const visit = (n: ts.Node): void => {
    if (ts.isStringLiteralLike(n)) out += ` ${n.text}`;
    else if (ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) out += ` ${n.text}`;
    ts.forEachChild(n, visit);
  };
  visit(node);
  return out;
}
const hSaid = spoken(heirs!.body!);
console.log(`  ..   showHeirChoice: ${deadArms.length} single-heir comparison(s) ${deadArms.length ? `— ${deadArms.join(', ')} ` : ''}· ${hSaid.length}B of printable copy`);
check(deadArms.length === 0 && !/one son/i.test(hSaid),
  'the heir screen carries no one-heir branch and no one-heir sentence — that succession never reaches it');

// 4. The prospect card is where a lone heir lands, so the sentence lives there, gated on a parameter the
//    caller sets — not on `gen`, which every heir has.
const flag = prospect!.parameters[2]?.name.getText(ast) ?? '';
const gated: string[] = [];
const seekCond = (n: ts.Node): void => {
  if (ts.isConditionalExpression(n) && flag && n.condition.getText(ast).includes(flag)) gated.push(n.whenTrue.getText(ast));
  ts.forEachChild(n, seekCond);
};
seekCond(prospect!.body!);
console.log(`  ..   third parameter: ${flag || '(none)'} · ${gated.length} branch(es) gated on it`);
check(gated.some((t) => /one son/i.test(t) && /pc-stake|pc-legend|pc-flash/.test(t)),
  'the prospect card renders a one-heir line of its own, gated on a caller-set flag');

// 5. …and the no-siblings arm of the succession actually sets it. A written sentence nothing passes true
//    to is the same dead copy one screen further on.
const elseCall = callsTo('showProspectCard').find((c) => c.owner === 'bringThroughHeir'
  && forks[0]?.elseStatement?.getText(ast).includes(c.node.getText(ast)));
const thirdArg = elseCall?.node.arguments[2]?.getText(ast) ?? '(absent)';
console.log(`  ..   no-siblings call: ${elseCall ? elseCall.node.getText(ast) : '(not found)'}`);
check(thirdArg === 'true', 'the choice-less succession passes the one-heir flag as true');

// 6. And nobody else does. The genesis mint and the heir-choice commit both open this card after a
//    succession that DID offer a choice (or none at all, for the founder); either of them setting the flag
//    would put the sentence on a card it is a lie about.
const others = callsTo('showProspectCard').filter((c) => c.node !== elseCall?.node);
for (const c of others) console.log(`  ..   other call in ${c.owner}: ${c.node.arguments.length} arg(s)`);
check(others.length > 0 && others.every((c) => c.node.arguments.length < 3),
  'no other prospect-card call claims a one-heir succession');

console.log(fails
  ? `\n✗ ${fails} problem(s) — a choice-less succession goes out without a word of explanation`
  : '\n✓ the lone heir is named as a lone heir, on the card he actually lands on');
if (fails) process.exitCode = 1;
