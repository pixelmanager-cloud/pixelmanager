// GATE RECEIPTS MUST NOT PAY FOR MORE HOME MATCHES THAN THE SEASON STAGES.
//
// `seasonFacilityIncome` is handed a season W/D/L with no home/away breakdown, so it splits the record in
// half and pays `stadiumIncome` per home result. Rounding a three-way split three times and adding the
// pieces does not preserve the total: the first version rounded wins, draws and losses INDEPENDENTLY and
// paid for ten home games in a nine-home season on 71% of records. F-116 gave the LOSSES bucket the
// remainder — which repairs every record that has a loss in it, and none of the records that do not. Wins
// and draws were still rounded up on their own with nothing clamping them to the whole, so an UNBEATEN
// season with an odd win count (1W/17D, 3W/15D … 17W/1D — nine records, and 17W/1D/0L is an ordinary
// dominant season) still bought a tenth home match. At a maxed top-flight ground 17W/1D/0L paid 1,314c
// where nine home wins, the most a nine-home season can possibly be worth, cap out at 1,223c.
//
// This does NOT re-implement the split. A check that re-implements the thing it checks is exactly how the
// D7 report in shared/qa_facilities.ts went on printing the pre-F-116 71% figure long after the shipped
// function had moved on, and why nothing in the suite saw the second half of the defect. It RECOVERS the
// split from the money instead: at the fan zone's neutral L1 multiplier the gate is an exact integer
// combination of the three per-outcome stadium figures, so three stadium/tier configurations give three
// equations and Cramer's rule returns the (homeWins, homeDraws, homeLosses) the shipped function actually
// used. If the gate ever stops being that linear combination the solve stops returning whole numbers and
// this says so, rather than passing quietly on a model that no longer holds.
//
// MUTATION TEST: drop the `Math.min` on homeDraws in seasonFacilityIncome and the nine unbeaten records go red
// again; force `homeTotal` to 8 and all 190 go red. Nothing here can pass by measuring an empty list — the
// staged home-match count and the record count are both asserted before anything is derived from them.
//
// Run: `npx tsx tools/playtest/gate_home_matches.ts`
import {
  seasonFacilityIncome, stadiumIncome, fanIncomeMult, MAX_LEVEL, DEFAULT_FACILITIES, type Facilities,
} from '../../shared/src/facilities.js';
import { seasonFixtures, TIERS } from '../../shared/src/clubseason.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== Gate receipts: a season is paid for exactly the home matches it stages ===');

// ── 1. THE FIXTURE LIST IS THE AUTHORITY, not a 9 typed into this file ─────────────────────────────
const fixtures = seasonFixtures('Marlow', 7, 1);
const staged = fixtures.filter((f) => f.venue === 'H').length;
console.log(`  ..   seasonFixtures stages ${fixtures.length} league fixtures, ${staged} of them at home`);
ok(fixtures.length > 0 && staged > 0, 'the league season stages home matches at all (not an empty schedule)');

const TOP = TIERS - 1;
const facAt = (stadium: number, fanzone: number): Facilities => ({ ...DEFAULT_FACILITIES, stadium, fanzone });
const gateOf = (fac: Facilities, tierIdx: number, w: number, d: number, l: number) =>
  seasonFacilityIncome(fac, tierIdx, 0, 10, { wins: w, draws: d, losses: l }).gate;

const records: Array<[number, number, number]> = [];
for (let w = 0; w <= fixtures.length; w++) for (let d = 0; w + d <= fixtures.length; d++) records.push([w, d, fixtures.length - w - d]);
console.log(`  ..   ${records.length} reachable W/D/L splits of that season`);
ok(records.length > 0, 'there are records to measure (not an empty enumeration)');

// ── 2. THE CEILING — no algebra needed, and it catches the loudest three of the nine ───────────────
// The best a nine-home season can be worth is nine home wins. Any record paid more than that has been paid
// for a match the fixture list never staged, whatever split produced it.
const MAXED = facAt(MAX_LEVEL, MAX_LEVEL);
const ceiling = Math.round(staged * stadiumIncome(MAX_LEVEL, TOP, 'win') * fanIncomeMult(MAX_LEVEL));
let best: [number, number, number] = records[0], bestGate = -1;
for (const [w, d, l] of records) { const g = gateOf(MAXED, TOP, w, d, l); if (g > bestGate) { bestGate = g; best = [w, d, l]; } }
console.log(`  ..   top gate at a maxed ground is ${bestGate}c (${best[0]}W/${best[1]}D/${best[2]}L) against a ${ceiling}c ceiling of ${staged} home wins — headroom ${ceiling - bestGate}c`);
ok(ceiling > 0, 'a home win is worth something at a maxed ground (the ceiling is not zero)');
ok(bestGate <= ceiling, `no record out-earns ${staged} home wins (${bestGate}c <= ${ceiling}c)`);

// ── 3. THE SPLIT ITSELF, recovered from the money rather than re-derived ───────────────────────────
ok(fanIncomeMult(1) === 1, 'fanzone L1 is still the neutral multiplier the exact solve depends on');
const CFG: Array<[number, number]> = [[MAX_LEVEL, TOP], [MAX_LEVEL, 0], [4, TOP]];
const M = CFG.map(([lv, t]) => [stadiumIncome(lv, t, 'win'), stadiumIncome(lv, t, 'draw'), stadiumIncome(lv, t, 'loss')]);
const det3 = (m: number[][]) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
  - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
  + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
const D = det3(M);
console.log(`  ..   solve matrix ${JSON.stringify(M)}, determinant ${D}`);
ok(D !== 0, 'the three stadium/tier probes are still linearly independent (the solve is not degenerate)');
ok(M.every((r) => r.every((v) => Number.isInteger(v))), 'stadiumIncome still pays whole coins (the solve is exact)');

const offenders: string[] = [];
let inexact = 0, lo = Infinity, hi = -Infinity;
for (const [w, d, l] of records) {
  const b = CFG.map(([lv, t]) => gateOf(facAt(lv, 1), t, w, d, l));
  const part = (col: number) => det3(M.map((r, i) => r.map((v, j) => (j === col ? b[i] : v))));
  const raw = [part(0), part(1), part(2)];
  if (raw.some((n) => n % D !== 0)) { inexact++; continue; }   // gate is no longer that linear combination
  const [hw, hd, hl] = raw.map((n) => n / D);
  const n = hw + hd + hl;
  lo = Math.min(lo, n); hi = Math.max(hi, n);
  if (n !== staged) offenders.push(`${w}W/${d}D/${l}L → ${hw}+${hd}+${hl} = ${n} home matches, ${gateOf(MAXED, TOP, w, d, l)}c`);
  // The parts must also fit the buckets they came from — the invariant F-116's `Math.max(0, …)` was
  // protecting, and the reason the remainder cannot simply be handed to whichever bucket is left over.
  else if (hw > w || hd > d || hl > l) offenders.push(`${w}W/${d}D/${l}L → ${hw}+${hd}+${hl} claims results the season did not contain`);
}
console.log(`  ..   solved home-match counts span ${lo}..${hi} across all ${records.length} records`);
ok(inexact === 0, `every record's gate is still an exact combination of the per-outcome figures (${inexact} were not)`);
for (const o of offenders.slice(0, 6)) console.log(`       ${o}`);
ok(offenders.length === 0, `every record is paid for exactly ${staged} home matches (${offenders.length} of ${records.length} are not)`);

console.log(fails ? `\n✗ ${fails} check(s) failed — the gate pays for home matches the fixture list never staged` : `\n✓ every W/D/L split is paid for exactly the ${staged} home matches the season stages`);
if (fails) process.exitCode = 1;
