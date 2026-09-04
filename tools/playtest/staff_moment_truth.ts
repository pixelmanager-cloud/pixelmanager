// THE BACKROOM CANNOT CONGRATULATE THE CLUB ON A TRANSFER NOBODY MADE.
//
// The club screen picks one of five StaffMoments for its staff card, and two of the five name a specific
// EVENT rather than a mood. 'signing' speaks in the Head Scout's voice about a new arrival — "Been
// watching this one for eighteen months. Delighted it's finally over the line" — and 'milestone' in the
// goalkeeping coach's about an occasion just reached: "Every keeper remembers their first one of those."
// Each is a claim that something happened, not colour that reads true on any Tuesday.
//
// The selector was a margin ladder with those two as its fallbacks: any matchday whose last result was
// inside two goals took 'signing' before the club's first title and 'milestone' after it. It consulted
// nothing about transfers and nothing about occasions, so on roughly half of every pre-title era's
// matchdays the scout congratulated the club on a signing nobody made — on the screen the player visits
// between most matches.
//
// THE RULE THIS PROBE HOLDS: an event moment may only be selected from evidence that the event happened.
// The selector sees `played`, the last result line and a lifetime title count; none of those records an
// arrival or a just-won honour, so neither event moment may be selected from them at all. If someone
// later hands the selector real evidence — the transfer market's bought-ids list, a title-won-this-season
// flag — then the two assertions below are the ones to relax, and they must be relaxed to "only fires
// when the evidence says so", never deleted. A parked bank is the cheap failure here; the expensive one
// is a reader taking the missing case for an oversight and wiring the fallback straight back in.
//
// The selector is a ternary inside a private method of a 9k-line class, so this lifts the expression out
// of the source and evaluates it rather than standing the app up to reach it — the check is on the actual
// arithmetic the game runs, not on a pattern a rewrite could satisfy while changing the answer.
//
// Run: `npx tsx tools/playtest/staff_moment_truth.ts`
import { readFileSync } from 'node:fs';
import { staffQuip, staffRoster, type StaffMoment } from '../../shared/src/staff.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== The staff card only claims things that actually happened ===');

// ── The selector, lifted from source ─────────────────────────────────────────────────────────────
const src = readFileSync('client/src/main.ts', 'utf8');
const DECL = 'const moment: StaffMoment = ';
const found = src.split(DECL).length - 1;
ok(found === 1, `\`${DECL.trim()}\` appears exactly once in client/src/main.ts (found ${found})`);
if (found !== 1) { console.log('\n✗ could not find the staff-moment selector — renamed?'); process.exit(1); }
const at0 = src.indexOf(DECL) + DECL.length;
const momentSrc = src.slice(at0, src.indexOf(';', at0));
console.log(`  ..   selector: ${momentSrc.trim().replace(/\s+/g, ' ')}`);

type Res = { myGoals: number; oppGoals: number };
type Mgr = { titles: number; results: Res[] };
const pick = new Function('played', 'last', 'm0', `return (${momentSrc});`) as
  (played: number, last: Res | null, m0: Mgr) => StaffMoment;

// ── Every state the club screen can be opened in ─────────────────────────────────────────────────
// A whole league season of matchdays x every plausible scoreline x a club with no title, its first, and
// a cabinet full — which is the entire input the selector reads.
const MOMENTS: StaffMoment[] = ['preSeason', 'signing', 'bigWin', 'bigLoss', 'milestone'];
const grid: { moment: StaffMoment; what: string }[] = [];
for (let played = 0; played <= 38; played++) {
  for (let mine = 0; mine <= 5; mine++) for (let opp = 0; opp <= 5; opp++) for (const titles of [0, 1, 4]) {
    const last = played ? { myGoals: mine, oppGoals: opp } : null;
    grid.push({
      moment: pick(played, last, { titles, results: last ? [last] : [] }),
      what: played ? `matchday ${played}, last result ${mine}-${opp}, ${titles} title(s)` : 'before a ball is kicked',
    });
  }
}
const count = (m: StaffMoment) => grid.filter((c) => c.moment === m).length;
console.log(`  ..   ${grid.length} states → ${MOMENTS.map((m) => `${m} ${count(m)}`).join(' · ')}`);

// ── VACUITY GUARD ────────────────────────────────────────────────────────────────────────────────
// "never selects 'signing'" is free if the lifted function throws its answers away or the grid is empty.
// Proving the three mood moments all come out of THIS grid proves the expression really ran and really
// varies, so the two assertions under it are measuring something.
ok(grid.length > 0, 'there are states to check (this is not measuring an empty grid)');
ok(count('bigWin') > 0 && count('bigLoss') > 0 && count('preSeason') > 0,
   'the lifted selector runs and varies — bigWin, bigLoss and preSeason all come out of this grid');

// ── The two event moments must not be asserted without the event ─────────────────────────────────
const falseSigning = grid.find((c) => c.moment === 'signing');
const falseMilestone = grid.find((c) => c.moment === 'milestone');
ok(!falseSigning, falseSigning
  ? `'signing' fires with no transfer in evidence — ${falseSigning.what} → the Head Scout announces an arrival that did not happen`
  : `no state picks 'signing' — the scout never announces a transfer the save has no record of`);
ok(!falseMilestone, falseMilestone
  ? `'milestone' fires with no occasion in evidence — ${falseMilestone.what} → the keeper reacts to a moment that is not happening`
  : `no state picks 'milestone' — the keeper never reacts to an occasion the save has no record of`);

// ── MUTATION GUARD ───────────────────────────────────────────────────────────────────────────────
// Returning 'preSeason' unconditionally would satisfy everything above and hand the fitness coach every
// matchday of the season, which is the same class of lie one bank over. The result still has to be read.
const on = (played: number, mine: number, opp: number, titles = 0) =>
  pick(played, played ? { myGoals: mine, oppGoals: opp } : null, { titles, results: [] });
console.log(`  ..   1-0 → ${on(9, 1, 0)} · 4-0 → ${on(9, 4, 0)} · 1-2 → ${on(9, 1, 2)} · 0-4 → ${on(9, 0, 4)} · 2-2 → ${on(9, 2, 2)} · matchday 0 → ${on(0, 0, 0)}`);
ok(on(9, 1, 0) === 'bigWin' && on(9, 4, 0) === 'bigWin', 'a win is a win at any margin — the assistant still celebrates a 1-0');
ok(on(9, 1, 2) === 'bigLoss' && on(9, 0, 4) === 'bigLoss', 'a defeat is a defeat at any margin — the assistant still regroups after a 1-2');
ok(on(0, 0, 0) === 'preSeason', 'before a ball is kicked it is still pre-season');

// ── The parked banks are parked, not deleted ─────────────────────────────────────────────────────
// If a later change makes 'signing' or 'milestone' selectable on real evidence, the prose has to still be
// there to select. This is the half that tells the difference between "not reachable yet" and "gone".
const roster = staffRoster(4242);
for (const [role, moment] of [[roster.scout.role, 'signing'], [roster.goalkeepingCoach.role, 'milestone']] as const) {
  const lines = new Set([0, 1, 2, 3, 4, 5, 6, 7].map((s) => staffQuip(4242, role, moment, s)));
  console.log(`  ..   ${role} / ${moment}: ${lines.size} line(s) still authored — e.g. ${[...lines][0]}`);
  ok(lines.size > 1, `the ${role}'s '${moment}' bank is parked, not deleted — it is there the day the event is`);
}

console.log(fails ? `\n✗ ${fails} check(s) failed — the staff card is announcing something that did not happen` : '\n✓ every moment the staff card picks is one the save can actually see');
if (fails) process.exitCode = 1;
