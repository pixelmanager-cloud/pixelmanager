// THE MORALE LADDER MUST STAY IN THE ORDER IT MEANS.
//
// Every MoraleEvent is applied at most once per season and then drifts 15% toward 60, so what a delta
// actually means is the fixed point it settles at — not the number in the table. Two things must hold, and
// neither is visible from the table itself:
//
//   1. EVERY EVENT MUST HAVE AN EMITTER. `played_loss` did not, for the life of the game: squad.ts read one
//      boolean that could name only `played_win` and `played_draw`, so a losing season paid +2 and a
//      first-team regular at a club beaten every week for twelve years ended HAPPIER than the day he signed.
//      A declared consequence nothing can trigger is the defect this project keeps finding.
//
//   2. THE ORDER MUST SURVIVE RE-TUNING. A player receives exactly ONE of these per season, so they share a
//      scale and their ordering is a claim about the game: winning beats drawing beats losing, and playing —
//      even badly — is not worse than not being picked. `played_loss: -4` was proposed and rejected for
//      exactly this: it settles at 40, below `benched`'s 46, which would say a man who plays every week in a
//      losing side is unhappier than one who never gets on the pitch.
//
// Run: `npx tsx tools/playtest/morale_ladder.ts`
import { readFileSync } from 'node:fs';
import { updateMorale, driftMorale, START_MORALE, moraleEffects, type MoraleEvent } from '../../shared/src/morale.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

/** Where one event repeated every season settles, through squadMoraleAfterSeason's real sequence. */
const settle = (e: MoraleEvent, seasons = 40) => {
  let m = START_MORALE;
  for (let i = 0; i < seasons; i++) m = driftMorale(updateMorale(m, e));
  return m;
};

console.log('=== The morale ladder ===');
const EVENTS: MoraleEvent[] = ['played_win', 'played_draw', 'played_loss', 'benched', 'unused', 'contract_lapsed'];
const at: Record<string, number> = {};
for (const e of EVENTS) { at[e] = settle(e); const f = moraleEffects(at[e]); console.log(`  ..   ${e.padEnd(16)} -> ${String(at[e]).padStart(3)}  ${f.label}${f.unsettled ? ' [unsettled]' : ''}`); }
ok(new Set(Object.values(at)).size > 1, 'the events settle at different places (this is not measuring a flat model)');

console.log('\n-- results order --');
ok(at.played_win > at.played_draw, 'winning is better than drawing');
ok(at.played_draw > at.played_loss, 'drawing is better than losing');

console.log('\n-- losing actually costs something --');
const drawEff = moraleEffects(at.played_draw), lossEff = moraleEffects(at.played_loss);
console.log(`  ..   re-sign: draw x${drawEff.extendMult.toFixed(2)} vs loss x${lossEff.extendMult.toFixed(2)} · sale: x${drawEff.sellMult.toFixed(2)} vs x${lossEff.sellMult.toFixed(2)}`);
ok(at.played_draw - at.played_loss >= 15,
   `a losing season is meaningfully worse than a drawing one (${at.played_draw - at.played_loss} points apart)`);
ok(lossEff.extendMult > drawEff.extendMult && lossEff.sellMult < drawEff.sellMult,
   'and it shows up in what the club pays to keep him and gets when it sells him');

console.log('\n-- playing is never worse than not being picked --');
ok(at.played_loss >= at.benched, `losing every week is not worse than sitting on the bench (${at.played_loss} vs ${at.benched})`);
ok(at.benched > at.unused, 'being on the bench is better than never being involved');
ok(at.unused > at.contract_lapsed, 'and being ignored is better than being let go');

console.log('\n-- every event can actually happen --');
// The emitters, read from source with comments stripped: this codebase quotes old code in its post-mortems.
const strip = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const src = strip(readFileSync('shared/src/squad.ts', 'utf8')) + strip(readFileSync('client/src/api.ts', 'utf8'));
for (const e of ['played_win', 'played_draw', 'played_loss', 'unused', 'contract_lapsed', 'extended', 'won_trophy'] as MoraleEvent[]) {
  ok(src.includes(`'${e}'`), `'${e}' has a production emitter`);
}
// These two are knowingly unemitted; see decisions-for-ck. Asserted so the list cannot grow in silence.
for (const e of ['benched', 'transfer_listed']) {
  ok(!src.includes(`'${e}'`), `'${e}' is still knowingly unemitted (needs a mechanic that does not exist)`);
}

console.log(fails ? `\n✗ ${fails} — the ladder does not mean what it says` : '\n✓ the ladder is ordered, it bites, and every rung that should fire can');
if (fails) process.exitCode = 1;
