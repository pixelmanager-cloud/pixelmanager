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
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = readFileSync(fileURLToPath(new URL('../../client/src/main.ts', import.meta.url)), 'utf8');
let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

/** Body of a method, from its declaration to the next same-indent method. */
function body(name: string, chars = 2400): string {
  const i = src.indexOf(name);
  return i < 0 ? '' : src.slice(i, i + chars);
}

// 1. kicking off a match must commit the team sheet the player just set
const kick = body('private kickOffMatch()');
check(kick.length > 0, 'kickOffMatch() exists');
check(/persistTeamSheet\s*\(/.test(kick),
  'kicking off PERSISTS the team sheet — the player committing to a XI is him choosing it');

// 2. the persist helper must actually write through the facade, and write the whole sheet
const persist = body('private async persistTeamSheet');
check(/api\.setStandingOrders\s*\(/.test(persist), 'persistTeamSheet() calls api.setStandingOrders');
check(/intentOf\s*\(/.test(persist),
  'persistTeamSheet() saves the manager INTENT (intentOf), not the substituted matchday XI');
for (const field of ['formation', 'playerIds', 'tactics', 'duties']) {
  check(new RegExp(`${field}\\s*:`).test(persist), `persistTeamSheet() saves \`${field}\``);
}
check(/draftRoles\s*\(\s*\)/.test(persist), 'persistTeamSheet() saves the captain and set-piece takers (draftRoles)');

// 3. the reachability trap itself: if the ONLY writer is behind an editorMode check, it is dead again
const writers = [...src.matchAll(/api\.setStandingOrders\s*\(/g)].length;
check(writers >= 2, `api.setStandingOrders has more than one writer (found ${writers}) — one of them used to be unreachable`);

// 4. and openLineup must still be the thing that reads them back, or the round trip is broken elsewhere
const open = body('private openLineup(', 3000);
check(/this\.standingOrders/.test(open), 'openLineup() still seeds the draft from the saved standing orders');

console.log(fails
  ? `\n✗ ${fails} settings-persistence check(s) failed — a screen the player uses is being discarded`
  : '\n✓ the team sheet the player sets survives the match he sets it for');
if (fails) process.exit(1);
