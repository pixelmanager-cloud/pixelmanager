// ── THE INSTRUMENT FOR THE REBUILD ───────────────────────────────────────────────────────────────────
//
// The engine rebuild failed the first time for one reason: I measured whether the MATCH looked like
// football and never measured whether the LEAGUE still worked. It did not — top-vs-bottom fixtures went
// from 5% to 53% won by six or more — and I presented my own regression to CK as a discovery.
//
// So this prints BOTH axes side by side, from one command, and refuses to report either alone. Neither
// half is new; what is new is that they are read together. Run it before a change and after it.
//
//   npx tsx tools/playtest/engine_panel.ts            (N=120, ~30s)
//   N=400 npx tsx tools/playtest/engine_panel.ts      (tighter intervals)
//
// This is a REPORT, not a gate: shot_geometry and division_balance hold the ratchets. It exists so a
// person can see, in one screen, whether a change bought football at the cost of the league.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import { seededOpponents, tierStrength, TIERS } from '../../shared/src/clubseason.js';

const N = Number(process.env.N ?? 120);
const REAL = { shots: 25, medianDist: 16, insideBox: 40, spellSec: 6, inBox: 3.5 };

function play(qA: number, qB: number, seed: number) {
  const a = generateTeam('a', 'A', 0x1, qA, seed * 7 + 1, '4-4-2');
  const b = generateTeam('b', 'B', 0x2, qB, seed * 11 + 3, '4-4-2');
  const m = new MatchEngine([a, b], seed * 31 + 5, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
  const dists: number[] = [];
  const proto = Object.getPrototypeOf(m) as { resolveShot?: (...a: unknown[]) => unknown };
  const orig = proto.resolveShot;
  if (typeof orig !== 'function') { console.log('  FAIL resolveShot not found — the hook is stale'); process.exit(1); }
  (m as unknown as Record<string, unknown>).resolveShot = function (...args: unknown[]) {
    dists.push(Number(args[2])); return (orig as (...a: unknown[]) => unknown).apply(this, args);
  };
  while (!m.state.finished) m.tick();
  return { score: m.state.score as [number, number], dists };
}
const pct = (xs: number[], p: number) => { const s = [...xs].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))] ?? 0; };

// ── AXIS 1: is it football? ──
let shots = 0, goals = 0; const allD: number[] = [];
for (let i = 0; i < N; i++) { const r = play(13, 13, i + 1); shots += r.dists.length; goals += r.score[0] + r.score[1]; allD.push(...r.dists); }
const inside = allD.filter((d) => d <= 18).length / Math.max(1, allD.length) * 100;
console.log('\n=== IS IT FOOTBALL? (13 v 13, n=' + N + ') ===');
console.log(`  shots/match     ${(shots / N).toFixed(1).padStart(6)}   real ~${REAL.shots}`);
console.log(`  goals/match     ${(goals / N).toFixed(2).padStart(6)}   real ~2.7`);
console.log(`  shot dist p50   ${pct(allD, 0.5).toFixed(1).padStart(6)}m  real ~${REAL.medianDist}m`);
console.log(`  shots in box    ${inside.toFixed(2).padStart(6)}%  real >${REAL.insideBox}%`);

// ── AXIS 2: is it still a league? ──
console.log('\n=== IS IT STILL A LEAGUE? (top vs bottom of the same division) ===');
console.log('  tier   fixture     GD     won by 6+   fav win%');
let worstBig = 0, worstGd = 0;
for (let tier = 1; tier <= TIERS; tier++) {
  // THE SAME FIXTURE division_balance BUILDS, because a panel that disagrees with the gate is worse than
  // no panel. This used to take max/min of one seededOpponents draw, which is NARROWER than the gate's
  // measured spread — it reported 8% thrashing where the gate measured 17%, and I tuned against it.
  const sample: number[] = [];
  for (let s2 = 0; s2 < 40; s2++) for (const c of seededOpponents('Mine', s2 * 7919 + 13, tier)) sample.push(c.strength);
  const spread = (Math.max(...sample) - Math.min(...sample)) / 2;
  const base = tierStrength(tier);
  const hi = Math.max(3, Math.min(20, Math.round(base + spread)));
  const lo = Math.max(3, Math.min(20, Math.round(base - spread)));
  let gd = 0, big = 0, wins = 0;
  for (let i = 0; i < N; i++) {
    const r = play(hi, lo, i + 101); const d = r.score[0] - r.score[1];
    gd += d; if (Math.abs(d) >= 6) big++; if (d > 0) wins++;
  }
  worstBig = Math.max(worstBig, big / N); worstGd = Math.max(worstGd, Math.abs(gd / N));
  console.log(`   ${String(tier).padStart(2)}    ${hi} v ${String(lo).padEnd(2)}   ${(gd / N >= 0 ? '+' : '')}${(gd / N).toFixed(2).padStart(5)}      ${(100 * big / N).toFixed(0).padStart(3)}%       ${(100 * wins / N).toFixed(0)}%`);
}
console.log(`\n  worst thrashing rate ${(100 * worstBig).toFixed(0)}%  (pre-rebuild engine: 1-8%; the rebuild I reverted: 53-63%)`);
console.log(`  worst avg margin     ${worstGd.toFixed(2)}   (pre-rebuild: <= 2.8)`);
console.log('\n  Read BOTH panels. The rebuild that was reverted made the top panel good and this one catastrophic.');
