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
