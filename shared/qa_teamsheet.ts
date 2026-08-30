// A knock must not rewrite the team sheet. See shared/src/teamsheet.ts for what went wrong.
import { resolveMatchXI, intentOf, type SheetPlayer } from './src/teamsheet.js';

let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

const ROLES = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'];
const squad: SheetPlayer[] = [
  ...ROLES.map((role, i) => ({ id: `s${i}`, role, ovr: 14 - (i % 3) })),
  ...['DF', 'MF', 'FW', 'GK'].map((role, i) => ({ id: `b${i}`, role, ovr: 10 })),
];
const saved = ROLES.map((_, i) => `s${i}`);

console.log('[qa-teamsheet] a saved sheet survives an injury...');
{
  const injured = new Set(['s6']);                       // one midfielder knocked out
  const avail = squad.filter((p) => !injured.has(p.id));
  const r = resolveMatchXI(saved, squad, avail);
  check(r.usable, 'the sheet is still usable with an injured man in it');
  check(!r.ids.includes('s6'), 'the injured man does not take the field today');
  check(r.ids.filter((id) => saved.includes(id)).length === 10, 'the other ten slots are untouched');
  check(r.subs.get(6)?.out === 's6', 'the covered slot remembers who the manager picked');
  check(r.subs.get(6)?.in === r.ids[6], '...and who came in for him');
  const kept = intentOf(r.ids, r.subs);
  check(kept.join() === saved.join(), 'SAVING AFTER THE MATCH RESTORES THE MANAGER SHEET EXACTLY');
  check(squad.find((p) => p.id === r.ids[6])!.role === 'MF', 'the stand-in plays in the same role');
}

console.log('\n[qa-teamsheet] several out at once, and the genuinely broken cases...');
{
  const out = new Set(['s0', 's3', 's9']);
  const avail = squad.filter((p) => !out.has(p.id));
  const r = resolveMatchXI(saved, squad, avail);
  check(r.usable && r.subs.size === 3, 'three unavailable men produce three covered slots');
  check(new Set(r.ids).size === 11, 'nobody is picked twice');
  check(intentOf(r.ids, r.subs).join() === saved.join(), 'saving still restores all three');

  const sold = squad.filter((p) => p.id !== 's4');       // a saved starter is no longer in the squad
  check(!resolveMatchXI(saved, sold, sold).usable, 'a sheet naming a player who LEFT is not usable');
  check(!resolveMatchXI(saved.slice(0, 10), squad, squad).usable, 'a sheet of ten is not usable');
  check(resolveMatchXI(saved, squad, squad).subs.size === 0, 'a fully fit squad substitutes nobody');
}

console.log('\n[qa-teamsheet] and the manager overruling the stand-in...');
{
  const injured = new Set(['s6']);
  const avail = squad.filter((p) => !injured.has(p.id));
  const r = resolveMatchXI(saved, squad, avail);
  // he does not want the automatic choice — he picks someone else for that slot. It must be someone OTHER
  // than the stand-in, or the rule correctly restores his original man and the test proves nothing.
  const standIn = r.subs.get(6)!.in;
  const other = ['b0', 'b1', 'b2', 'b3'].find((id) => id !== standIn)!;
  const edited = [...r.ids]; edited[6] = other;
  check(intentOf(edited, r.subs)[6] === other, 'a slot the manager edited HIMSELF keeps his pick, not the injured man');
  check(intentOf([...r.ids], r.subs)[6] === 's6', '...while an untouched covered slot still hands his man back');
  // ...and Autopick, which rebuilds the whole XI and can shift every slot
  const autopicked = ['s0', 's1', 's2', 's3', 's4', 's5', 's7', 's8', 's9', 's10', 'b0'];
  const kept = intentOf(autopicked, r.subs);
  check(!kept.includes('s6'), 'Autopick is not silently overwritten with the injured man');
  check(kept.join() === autopicked.join(), '...and no slot of an autopicked XI is rewritten at all');
}

console.log(fails ? `\n✗ ${fails} team-sheet check(s) failed` : '\n✓ an injury costs the manager one slot for one match, not his team sheet');
if (fails) process.exit(1);

// ── reconcileSheet: designations follow the man, not the slot ────────────────────────────────────────
import { reconcileSheet, type TeamSheet } from './src/teamsheet.js';

const legal = (role: string, duty: string) => duty.startsWith(role.toLowerCase());
const dflt = (p: SheetPlayer) => `${p.role.toLowerCase()}-default`;
const baseSheet = (): TeamSheet => ({
  playerIds: [...saved],
  duties: ROLES.map((r) => `${r.toLowerCase()}-set`),
  captainIdx: 5,                       // s5, a midfielder
  takers: { pen: 9, fk: 5, corner: 10 },   // s9, s5, s10
});

console.log('\n[qa-teamsheet] reconcileSheet — a changed squad must not move the armband...');
{
  const s = baseSheet();
  check(reconcileSheet(s, squad, legal, dflt) === s, 'an unchanged squad returns the SAME object (write-skips still work)');

  // the bloodline star was being evicted every season because the RAW club was passed; here the man is
  // genuinely gone
  const gone = squad.filter((p) => p.id !== 's3');
  const r = reconcileSheet(baseSheet(), gone, legal, dflt)!;
  check(!!r, 'a departed player is repaired rather than refused');
  check(r.playerIds.length === 11 && new Set(r.playerIds).size === 11, 'the XI is still eleven distinct men');
  check(r.playerIds[3] !== 's3' && r.playerIds.filter((_, i) => i !== 3).join() === saved.filter((_, i) => i !== 3).join(),
    'ONLY the vacated slot changed — no compaction');
  check(r.captainIdx === 5 && r.playerIds[5] === 's5', 'the armband stayed on the same man');
  check(r.takers!.pen === 9 && r.takers!.fk === 5 && r.takers!.corner === 10, 'all three takers stayed on their men');
  check(r.duties!.filter((d, i) => i !== 3 && d !== baseSheet().duties![i]).length === 0, 'untouched slots keep their duties');
  check(legal(squad.find((p) => p.id === r.playerIds[3])!.role, r.duties![3]), "the refilled slot's duty is legal for the man who came in");
}

console.log('\n[qa-teamsheet] ...and a designated man leaving drops HIS designation, not someone else\'s...');
{
  const noCaptain = squad.filter((p) => p.id !== 's5');          // the captain AND the fk taker
  const r = reconcileSheet(baseSheet(), noCaptain, legal, dflt)!;
  check(r.captainIdx === undefined, 'the captain leaving DROPS the armband rather than handing it to a stranger');
  check(r.takers?.fk === undefined, '...and his free-kick duty with it');
  check(r.takers?.pen === 9 && r.takers?.corner === 10, 'the other two takers are untouched');
}

console.log('\n[qa-teamsheet] ...and it refuses rather than writing something invalid');
{
  check(reconcileSheet(baseSheet(), squad.slice(0, 9), legal, dflt) === null, 'a squad of nine is refused, not truncated to a nine-man XI');
  check(reconcileSheet({ playerIds: saved.slice(0, 6) } as TeamSheet, squad, legal, dflt) === null, 'a six-man sheet is refused');
  check(reconcileSheet(null, squad, legal, dflt) === null, 'a missing sheet is refused');
  check(reconcileSheet({ playerIds: 'nope' } as unknown as TeamSheet, squad, legal, dflt) === null, 'a malformed sheet is refused');
  // a duplicate id used to reach the saved XI and make setStandingOrders reject forever
  const dup = { ...baseSheet(), playerIds: ['s0', 's1', 's1', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'] };
  const r = reconcileSheet(dup, squad, legal, dflt)!;
  check(!!r && new Set(r.playerIds).size === 11, 'a duplicated id is refilled, not persisted');
}
