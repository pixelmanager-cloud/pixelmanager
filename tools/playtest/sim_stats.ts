// A SIMMED MATCH MUST LEAVE THE SAME TRACE AS A PLAYED ONE. Sim used to roll a scoreline from a strength
// difference instead of playing the match. That was survivable until season awards shipped: honours are
// derived from per-player match stats, and a scoreline has no players in it, so a manager who simmed his
// season won nothing and could not have been told why. Sim now runs the real engine headlessly.
//
// This guards the contract that makes it work -- deriveMatchStats must hand back rows that
// api.recordMatchStats will actually store (it drops any row without an `id`), and the goals in those rows
// must reconcile with the scoreline, or the Golden Boot would be awarded off a different match than the
// one the table recorded.
import { MatchEngine, generateClub, autoPickXI, buildXI, seededOpponentTactics, deriveMatchStats } from '@fm/shared';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== A simmed fixture leaves recordable per-player stats ===');
let totalRows = 0, reconciled = 0, expectedRows = 0, appsOk = 0;
const perMatch: number[] = [];
const N = 12;
for (let i = 0; i < N; i++) {
  const a = generateClub('sim-m' + i, 'Mine', 0x3b6bd2, 11, 5000 + i, true);
  const b = generateClub('sp-' + (7000 + i), 'Them', 0xcc4444, 10, 7000 + i, true);
  const ta = seededOpponentTactics(5000 + i), tb = seededOpponentTactics(7000 + i);
  const t0 = Date.now();
  const e = new MatchEngine([buildXI(a, autoPickXI(a, ta.formation)), buildXI(b, autoPickXI(b, tb.formation))], (4242 ^ i) >>> 0, [ta, tb] as any);
  let guard = 0;
  while (!e.state.finished && guard++ < 40000) e.tick();
  perMatch.push(Date.now() - t0);
  const rows: any[] = deriveMatchStats(e.teams[0], e.teams[1], e.state.events, e.state.score as [number, number])[0];
  totalRows += rows.length;
  // Everyone who took the field: the XI plus every man brought on. A substituted player is on neither
  // roster list by full time, and used to lose his whole row -- goals included.
  const subsOn = e.state.events.filter((v: any) => v.type === 'sub' && v.teamIdx === 0).length;
  expectedRows += 11 + subsOn;
  if (rows.filter((r) => r.apps).length === 11 + subsOn) appsOk++;
  if (rows.reduce((s, r) => s + (r.goals ?? 0), 0) === e.state.score[0]) reconciled++;
  if (!rows.every((r) => r.id && r.name)) { ok(false, `match ${i}: every row carries the id recordMatchStats keys on`); break; }
}
ok(totalRows === expectedRows, `a row for everyone who took the field, subs included (${totalRows}, expected ${expectedRows})`);
ok(appsOk === N, `and each of them is credited with the appearance (${appsOk}/${N} matches)`);
ok(reconciled === N, `the goals in the rows reconcile with the scoreline (${reconciled}/${N})`);
// The whole point of simming is that it is fast. A remaining season is ~20 fixtures; if one match costs
// more than ~150ms the button stops being a shortcut and starts being a wait.
//
// THIS USED TO ASSERT A BARE `each < 150` AND IT WAS NOT A GATE, IT WAS A COIN FLIP. CI ran identical
// engine code twice on consecutive commits — the second changed nothing but trailer tooling and markdown —
// and it passed at 35 minutes and failed at 60. Nothing about the product moved; the shared runner was
// simply busier. An assertion that flips on the load average tells you about GitHub's fleet, not about the
// game, and once a gate has cried wolf the next real regression gets waved through.
//
// So the budget is scaled by how fast THIS machine is right now, measured in the same process moments
// before. A genuine algorithmic regression — someone making the engine several times slower — still trips
// it on any hardware; a loaded runner no longer does. The absolute figure is printed either way, because
// that is the number with actual product meaning: what the player waits.
// 60M iterations, not 4M: at 4M this machine measured 4ms with a 4-6ms spread, so timer granularity alone
// moved the reading by 50% and the derived budget with it. At 60M the spread is 52-54ms — a calibration
// that is itself noisy is no better than the flaky assertion it replaces.
const CALIB_ITERS = 60_000_000;
const CALIB_REFERENCE_MS = 53; // measured here: median of 5 runs (52, 53, 53, 54, 54)
const c0 = Date.now();
let sink = 0;
for (let i = 1; i <= CALIB_ITERS; i++) sink += (i % 7) * (i % 13); // fixed arithmetic; no allocation, no I/O
const calibMs = Math.max(1, Date.now() - c0);
void sink;
// Clamped: a wildly slow reading (a runner descheduled mid-calibration) must not licence an unlimited
// budget, and a machine faster than the reference does not get a budget tighter than the one we tuned.
const slowdown = Math.min(8, Math.max(1, calibMs / CALIB_REFERENCE_MS));
const budget = 150 * slowdown;

// AND THE MEDIAN, NOT THE MEAN — the calibration alone was not enough, and the CI logs proved it. Across
// the failing run and the two that passed, the verify leg took 1057s, 1030s and 1068s: the runner's
// sustained speed was identical every time, and the calibration measures 2.4x, which puts a 26ms dev-box
// match at ~62ms on CI, nowhere near the 150ms it blew. So the failure was never sustained slowness. It
// was one match stalling — a GC pause, a descheduled core, a noisy neighbour — and a mean over 12 samples
// carries that straight into the result.
//
// The median cannot be moved by one stalled sample, while a real regression slows EVERY match and moves it
// immediately. Both numbers are printed: a large gap between them is itself the signature of a spike.
const sorted = [...perMatch].sort((x, y) => x - y);
const median = sorted[Math.floor(sorted.length / 2)];
const mean = perMatch.reduce((a, b) => a + b, 0) / perMatch.length;
const worst = sorted[sorted.length - 1];
console.log(`  ..   machine calibration ${calibMs}ms vs ${CALIB_REFERENCE_MS}ms reference → ${slowdown.toFixed(1)}x, budget ${budget.toFixed(0)}ms`);
console.log(`  ..   sim cost per match: median ${median}ms, mean ${mean.toFixed(0)}ms, worst ${worst}ms over ${N} matches`);
ok(median < budget, `a full ninety minutes sims fast enough to loop over a season (median ${median}ms, budget ${budget.toFixed(0)}ms on this machine)`);
console.log(fails ? `\n✗ ${fails} sim-stats check(s) failed` : `\n✓ a simmed season records what the honours are derived from`);
if (fails) process.exitCode = 1;
