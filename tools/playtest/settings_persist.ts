// ── A SETTING THE PLAYER CHOSE MUST SURVIVE THE THING HE CHOSE IT FOR ─────────────────────────────────
//
// `api.setStandingOrders` had two call sites and ONE OF THEM WAS UNREACHABLE. `saveTeam()` runs only when
// `editorMode === 'standing'`, and all three `openLineup(...)` calls pass 'match', so `editorMode` is
// 'match' from the first fixture onward and the save path could never execute. The orders were therefore
// written exactly once — at the founding handoff, with only `playerIds` set — while `openLineup` rebuilds
// `draftTactics` / `draftLineup` / `draftDuties` / `draftCaptain` / `draftTakers` from `this.standingOrders`
// at the top of every call.
//
// Net effect: formation, five sliders, three instructions, the XI, eleven duties, the captain and three
// set-piece takers — 35 of the 42 settings on the pre-match screen — reset to 4-4-2 / Balanced /
// defaultDuty() / no captain / no takers on EVERY matchday, eighteen times a season, for the whole dynasty.
// And the defaults are the measured-worst options: `defaultDuty()` emits 8 of 19 duties and picks ranks 5
// and 6 of 6 for defenders. The game re-imposed an inferior team sheet after every match and deleted the
// player's correction, which quietly made every tactical screen in the game a toy — including all of the
// duty and preset balancing work done against them.
//
// Nothing could catch it: it is DOM-coupled, so no harness drives it, and every engine test passes tactics
// in directly rather than through the screen the player uses. This is a source-level guard for exactly that
// blind spot — cruder than a behavioural test, and it MISSED THE REGRESSION THE FIX ITSELF INTRODUCED.
//
// Persisting at kickoff turned a transient wipe into a permanent one. `openLineup` used to check the saved
// XI against AVAILABLE players, so a single injury made it "invalid" and rebuilt from `autoPickXI`,
// discarding the duties, captain and set-piece takers — harmless while nothing wrote it back, fatal the
// moment kicking off started saving. Measured: one injury on matchday 2 and 0 of the next 17 matchdays
// opened with the manager's own sheet. A grep for "does this call persist?" says yes in both worlds.
//
// The rule that was wrong is now in `shared/src/teamsheet.ts` as a pure function with real tests
// (`shared/qa_teamsheet.ts`). What is left here is the reachability question a unit test cannot answer:
// is the writer wired to the screen at all.
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// PARSED, NOT SLICED. The first version read a fixed 2,400-character window from a string index and asked
// whether `persistTeamSheet` appeared in it. Measured in today's `main.ts`, the real call sits at delta
// 2,290 and the NEXT METHOD'S OWN DECLARATION at 2,507 — 107 characters outside, in the file that grows
// comments faster than any other in the repo. Collapse a comment above the call and the declaration slides
// into the window and vouches for a call that is gone: an adversarial pass removed the call, tidied one
// comment, and this probe printed all-ok and exited 0 with the original defect bit-for-bit restored.
const file = fileURLToPath(new URL('../../client/src/main.ts', import.meta.url));
const src = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ESNext, true);
let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

/** The class member with this name, wherever it is in the file. */
function method(name: string): ts.MethodDeclaration | undefined {
  let found: ts.MethodDeclaration | undefined;
  const visit = (n: ts.Node): void => {
    if (found) return;
    if (ts.isMethodDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name) { found = n; return; }
    ts.forEachChild(n, visit);
  };
  visit(src);
  return found;
}

/** Does `owner`'s own body call `this.<name>(...)`? Its body, not the bytes that happen to follow it. */
function calls(owner: ts.MethodDeclaration | undefined, name: string): boolean {
  if (!owner?.body) return false;
  let found = false;
  const visit = (n: ts.Node): void => {
    if (found) return;
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)
      && n.expression.expression.kind === ts.SyntaxKind.ThisKeyword
      && n.expression.name.text === name) { found = true; return; }
    ts.forEachChild(n, visit);
  };
  visit(owner.body);
  return found;
}

/** Every `this.<name>(...)` call site in the file, with the method that contains it. */
function callersOf(name: string): string[] {
  const out: string[] = [];
  const visit = (n: ts.Node, owner?: string): void => {
    const nextOwner = ts.isMethodDeclaration(n) && ts.isIdentifier(n.name) ? n.name.text : owner;
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)
      && n.expression.expression.kind === ts.SyntaxKind.ThisKeyword
      && n.expression.name.text === name && nextOwner) out.push(nextOwner);
    ts.forEachChild(n, (c) => visit(c, nextOwner));
  };
  visit(src);
  return out;
}

const kick = method('kickOffMatch');
const persist = method('persistTeamSheet');
check(!!kick, 'kickOffMatch() exists');
check(!!persist, 'persistTeamSheet() exists');

// 1. the reachability question a unit test cannot answer: is the writer wired to the screen?
check(calls(kick, 'persistTeamSheet'),
  'kicking off PERSISTS the team sheet — the player committing to a XI is him choosing it');

// 2. and it must be reachable from somewhere OTHER than the editor-mode branch that was dead for months.
//    `saveTeam()` only runs when `editorMode === 'standing'`, which never happens, so a lone caller there
//    is exactly the state this whole guard exists to detect.
const callers = callersOf('persistTeamSheet');
check(callers.some((c) => c !== 'saveTeam'),
  `persistTeamSheet has a caller outside saveTeam() (callers: ${callers.join(', ') || 'none'})`);

// 3. the writer must go through the facade, and write the whole sheet
const body = persist?.body ? persist.body.getText(src) : '';
check(/api\.setStandingOrders\s*\(/.test(body), 'persistTeamSheet() calls api.setStandingOrders');
for (const field of ['formation', 'playerIds', 'tactics', 'duties']) {
  check(new RegExp(`${field}\\s*:`).test(body), `persistTeamSheet() saves \`${field}\``);
}
check(/draftRoles\s*\(\s*\)/.test(body), 'persistTeamSheet() saves the captain and set-piece takers (draftRoles)');
check(/intentOf\s*\(/.test(body),
  'persistTeamSheet() saves the manager INTENT (intentOf), not the substituted matchday XI');

// 4. and openLineup must still read them back, or the round trip is broken at the other end
check(calls(method('openLineup'), 'starGuarded') || /this\.standingOrders/.test(method('openLineup')?.body?.getText(src) ?? ''),
  'openLineup() still seeds the draft from the saved standing orders');

console.log(fails
  ? `\n✗ ${fails} settings-persistence check(s) failed — a screen the player uses is being discarded`
  : '\n✓ the team sheet the player sets survives the match he sets it for');
if (fails) process.exit(1);
