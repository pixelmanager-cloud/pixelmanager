// ── WHY WIDTH DOES NOT PAY ────────────────────────────────────────────────────────────────────────
// The diagnostic behind the width half of the engine rebuild. Six of strategy_test's assertions measure a
// reward for playing wide (wide 3-4-3 vs a narrow diamond, wide-playmaker vs central duties in the wide
// slot, 3-4-3's central-vs-wide attacking focus). They fail because the engine does not implement that
// reward — and this reports, in order, exactly where the flank falls out of the simulation.
//
// Findings on the pre-rebuild engine, reproduced by running this:
//   formation anchors put FOUR players ~24m off centre, and they hold ~14.5m off centre all match
//   ~40% of legal pass candidates are wide (>10m off centre)
//   ... but only ~1% of passes actually chosen are wide
//   so the CARRIER sits a median of ~2.9m from the centre line (p90 4.7m) on a pitch 68m wide
//   and a cross can therefore never be attempted, because the ball is never in a crossing position
//
// THIS PROBE HAD NO FAILURE PATH. It printed the sentence "the gap is the defect" and exited 0, on every
// build, for as long as anyone can remember. The bars at the bottom are RATCHETS pinned to what the
// pre-rebuild engine measures today (2026-08-31) — they bless a broken engine as a CEILING so it cannot
// rot further. Open item: docs/decisions-for-ck.md section 19, and section 1 (the measured match-engine
// rebuild that fixes this axis and was reverted because it inverted the tactical layer).
//
// A RE-DERIVATION BUG WAS FOUND AND FIXED WHILE ARMING THIS. The "killed by the gain > -6 veto" figure was
// computed from `(myD - tD) * 0.35 + (|goal.x - cs.x| - |goal.x - ts.x|) * 0.65`. The engine's gain is
// plainly `myDistGoal - dGoal` (engine.ts, pickPassTarget) — no 0.35/0.65 blend exists anywhere in it.
// The probe was gating on a formula the engine does not use, which is the exact defect division_balance.ts
// documents: a gate that re-derives its subject from a local copy cannot see its subject change. The blend
// reported 72.5%; the engine's real rule kills 74.1%. The number moved, the conclusion did not.
//
// Because the veto rate STILL has to be re-derived from outside (pickPassTarget makes the decision
// internally and returns only the winner), a staleness guard is asserted alongside it: every target the
// engine actually returns must satisfy this file's copy of `gain > -6`. The day that stops holding, this
// probe's headline number is fiction and the guard says so instead of quietly reporting it.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam, autoPickXI, buildXI } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import type { Team } from '../../shared/src/types.js';

// ── THRESHOLD CONSTANTS ───────────────────────────────────────────────────────────────────────────
// Two kinds of bar, and the failure text says which tripped:
//   [known-bad]  a MUST-NOT-GET-WORSE ceiling/floor around an already-broken value. Passing it does NOT
//                mean the number is acceptable; the figure a working engine would show is named beside it.
//   [structural] a fact about the shape the game is asked to play, which is not broken and must not become so.
// Measured 2026-08-31, seed 13, one full mirrored 4-4-2 match per block.
const MIN_WIDE_ANCHORS = 4;             // [structural] measured 4. baseAnchor is deterministic geometry, not a
                                        //   sampled statistic, and a 4-4-2 has exactly four wide players (two
                                        //   full-backs, two wide midfielders). Below 4 the shape stopped being wide.
const MIN_WIDE_ANCHOR_HOLD_M = 11.0;    // [known-bad] measured 14.31m. Those four are ANCHORED at 24m and hold 14m.
const MIN_WIDE_CANDIDATE_PCT = 30.0;    // [structural] measured 40.85%. The wide ball must stay ON THE MENU —
                                        //   if it leaves the candidate set the rest of this diagnosis is moot.
const MAX_WIDE_VETO_PCT = 85.0;         // [known-bad] measured 74.15%. A working engine has no such veto: ~0%.
const MAX_VETO_WIDE_BIAS_PP = 22.0;     // [known-bad] measured 15.19 points. The veto kills 74.1% of wide options
                                        //   against 58.95% of central ones — that GAP is the anti-width bias itself.
const MIN_WIDE_CHOSEN_PCT = 0.80;       // [known-bad] measured 1.31% (40 passes of 3043). Real football: 20-35%.
const MIN_CARRIER_OFFSET_P90_M = 3.5;   // [known-bad] measured 4.72m on a pitch 68m wide. A cross needs ~25m.

const mk = (s: number): Team => {
  const t = generateTeam(`t${s}`, 'T', 'T', 0x445566, 12, s);
  return buildXI(t, autoPickXI(t, '4-4-2'), '4-4-2');
};

let fails = 0, brokeKnownBad = 0, brokeStructural = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };
const knownBad = (ok: boolean, msg: string) => { if (!ok) brokeKnownBad++; check(ok, `[known-bad]  ${msg}`); };
const structural = (ok: boolean, msg: string) => { if (!ok) brokeStructural++; check(ok, `[structural] ${msg}`); };

// results hoisted out of the two measurement blocks so the bars can see them
let wideAnchors = 0, maxAnchor = 0, minWideHold = NaN, samplesPerPlayer = 0;
let cands = 0, candWide = 0, candNarrow = 0, chosen = 0, chosenWide = 0;
let wideVetoed = 0, narrowVetoed = 0, chosenViolatingVeto = 0;
let carrierP50 = NaN, carrierP90 = NaN, carrierMax = NaN, carrierN = 0;

// 1. where the formation PUTS people, and where they actually stand
{
  const seed = 13;
  const m: any = new MatchEngine([mk(seed), mk(seed + 1)], seed, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
  const per: number[][] = Array.from({ length: 11 }, () => []);
  for (let t = 0; t < 12000 && !m.state.finished; t++) {
    m.tick();
    if (t % 10) continue;
    for (let i = 1; i < 11; i++) per[i].push(Math.abs(m.state.players[0][i].y - 34));
  }
  console.log('── where the players are (|y - 34|, pitch half-width 34) ──');
  const holds: number[] = [];
  for (let i = 1; i < 11; i++) {
    const a = Math.abs(m.baseAnchor(0, i).y - 34);
    const v = per[i].slice().sort((x, y) => x - y);
    const p50 = v[Math.floor(v.length / 2)];
    console.log(`  p${String(i).padEnd(2)} anchor ${a.toFixed(0).padStart(2)}  actual p50 ${p50.toFixed(1).padStart(4)}  p90 ${v[Math.floor(v.length * 0.9)].toFixed(1)}`);
    maxAnchor = Math.max(maxAnchor, a);
    samplesPerPlayer = v.length;
    if (a >= 20) { wideAnchors++; holds.push(p50); }
  }
  minWideHold = holds.length ? Math.min(...holds) : NaN;
}

// 2. of the passes AVAILABLE, how many are wide — and how many get played
{
  const seed = 13;
  const m: any = new MatchEngine([mk(seed), mk(seed + 1)], seed, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
  const proto = Object.getPrototypeOf(m);
  const orig = proto.pickPassTarget;
  // If the rebuild renames or replaces pickPassTarget, every counter below stays at zero and this probe
  // reports a clean 0% wide-veto rate — the most flattering possible reading of the defect it exists to
  // watch. Refuse to run rather than gate on nothing.
  if (typeof orig !== 'function') {
    console.log('\n  FAIL INSTRUMENT DEAD — MatchEngine.prototype.pickPassTarget is not a function, so every');
    console.log('       width counter below would read zero. Re-point the hook at whatever picks passes now.');
    process.exit(1);
  }
  /** The engine's own veto, copied from engine.ts pickPassTarget: `gain = myDistGoal - dGoal`, kept only
   *  `if (gain > -6 && score > bestScore)`. NOT a paraphrase of it — see the header. */
  const VETO_FLOOR = -6;
  const gainOf = (goal: { x: number; y: number }, from: { x: number; y: number }, to: { x: number; y: number }) =>
    Math.hypot(goal.x - from.x, goal.y - from.y) - Math.hypot(goal.x - to.x, goal.y - to.y);

  proto.pickPassTarget = function (this: any, teamIdx: 0 | 1, playerIdx: number, goal: { x: number; y: number }) {
    const s = this.state, cs = s.players[teamIdx][playerIdx];
    for (let i = 0; i < 11; i++) {
      if (i === playerIdx) continue;
      if (this.sentOff?.has(teamIdx * 100 + i)) continue;   // the engine skips these; so must the count
      const ts = s.players[teamIdx][i];
      const d = Math.hypot(ts.x - cs.x, ts.y - cs.y);
      if (d > 42 || d < 3) continue;
      cands++;
      const wide = Math.abs(ts.y - 34) > 10;
      const killed = !(gainOf(goal, cs, ts) > VETO_FLOOR);
      // does this option die at the SCORE, or at the hard `gain > -6` veto applied after it?
      if (wide) { candWide++; if (killed) wideVetoed++; } else { candNarrow++; if (killed) narrowVetoed++; }
    }
    const r = orig.call(this, teamIdx, playerIdx, goal);
    if (r) {
      chosen++;
      const rs = s.players[teamIdx][r.idx];
      if (Math.abs(rs.y - 34) > 10) chosenWide++;
      // STALENESS GUARD: the engine can only ever return a target that cleared its own veto. If one comes
      // back that our copy of the rule would have killed, the copy is wrong and the headline is fiction.
      if (!(gainOf(goal, cs, rs) > VETO_FLOOR)) chosenViolatingVeto++;
    }
    return r;
  };
  const carrierOff: number[] = [];
  for (let t = 0; t < 12000 && !m.state.finished; t++) {
    m.tick();
    const c = m.state.carrier;
    if (c) carrierOff.push(Math.abs(m.state.players[c.teamIdx][c.playerIdx].y - 34));
  }
  proto.pickPassTarget = orig;
  carrierOff.sort((a, b) => a - b);
  carrierN = carrierOff.length;
  carrierP50 = carrierOff[Math.floor(carrierOff.length / 2)];
  carrierP90 = carrierOff[Math.floor(carrierOff.length * 0.9)];
  carrierMax = carrierOff[carrierOff.length - 1];
}

const pct = (n: number, d: number) => (100 * n) / (d || 1);
const candWidePct = pct(candWide, cands);
const wideVetoPct = pct(wideVetoed, candWide);
const narrowVetoPct = pct(narrowVetoed, candNarrow);
const vetoBiasPP = wideVetoPct - narrowVetoPct;
const chosenWidePct = pct(chosenWide, chosen);

console.log('\n── what happens to the ball ──');
console.log(`  pass candidates wide (>10m off centre): ${candWidePct.toFixed(1)}%   (${candWide} of ${cands})`);
console.log(`  wide candidates KILLED by the gain > -6 veto: ${wideVetoPct.toFixed(1)}%  <- a hard gate the score cannot outvote`);
console.log(`  central candidates killed by the same veto:   ${narrowVetoPct.toFixed(1)}%  <- the ${vetoBiasPP.toFixed(1)}pt gap IS the anti-width bias`);
console.log(`  passes CHOSEN that are wide:            ${chosenWidePct.toFixed(1)}%   <- the gap is the defect   (${chosenWide} of ${chosen})`);
console.log(`  carrier |y-34|: p50 ${carrierP50.toFixed(1)}  p90 ${carrierP90.toFixed(1)}  max ${carrierMax.toFixed(1)}`);

// ── BARS ──────────────────────────────────────────────────────────────────────────────────────────
console.log('');

// The instrument first — a hook that came loose reads as a flawlessly narrow-free engine.
check(cands > 0 && chosen > 0 && carrierN > 0 && samplesPerPlayer > 0,
  `the pickPassTarget hook is live: ${cands} candidates scored, ${chosen} passes chosen, ${carrierN} carrier ticks`);
check(chosenViolatingVeto === 0,
  `this file's copy of the engine's \`gain > -6\` veto still matches the engine (${chosenViolatingVeto} chosen passes violated it)`
  + (chosenViolatingVeto ? ' — THE COPY IS STALE. The wide-veto percentages above are fiction until it is re-derived from engine.ts pickPassTarget. Do not re-baseline the threshold; fix the formula.' : ''));

// The shape the game was asked to play.
structural(wideAnchors >= MIN_WIDE_ANCHORS,
  `the 4-4-2 still anchors ${MIN_WIDE_ANCHORS} players >= 20m off centre (got ${wideAnchors}, widest anchor ${maxAnchor.toFixed(0)}m) — two full-backs and two wide midfielders`);
knownBad(minWideHold >= MIN_WIDE_ANCHOR_HOLD_M,
  `the wide-anchored four have not drifted further in than ${MIN_WIDE_ANCHOR_HOLD_M}m (closest holds ${minWideHold.toFixed(1)}m, anchored at ${maxAnchor.toFixed(0)}m) — they already give up ~10m of the width they were asked for`);
structural(candWidePct >= MIN_WIDE_CANDIDATE_PCT,
  `the wide ball is still on the menu: ${candWidePct.toFixed(1)}% of legal candidates are wide (floor ${MIN_WIDE_CANDIDATE_PCT}%) — the defect is the CHOICE, not the supply`);

// The defect itself.
knownBad(wideVetoPct <= MAX_WIDE_VETO_PCT,
  `the gain > -6 veto has not killed more than ${MAX_WIDE_VETO_PCT}% of wide options (now ${wideVetoPct.toFixed(1)}%; an engine that rewards width kills ~0% — this ceiling blesses nothing)`);
knownBad(vetoBiasPP <= MAX_VETO_WIDE_BIAS_PP,
  `the veto is not more than ${MAX_VETO_WIDE_BIAS_PP} points harsher on wide options than central ones (now ${vetoBiasPP.toFixed(1)}pt: ${wideVetoPct.toFixed(1)}% wide vs ${narrowVetoPct.toFixed(1)}% central)`);
knownBad(chosenWidePct >= MIN_WIDE_CHOSEN_PCT,
  `passes actually played wide have not fallen below ${MIN_WIDE_CHOSEN_PCT}% (now ${chosenWidePct.toFixed(2)}%, ${chosenWide} of ${chosen}; real football is 20-35% — this floor is set at a catastrophic value ON PURPOSE)`);
knownBad(carrierP90 >= MIN_CARRIER_OFFSET_P90_M,
  `the carrier has not been squeezed further onto the centre line than ${MIN_CARRIER_OFFSET_P90_M}m at p90 (now ${carrierP90.toFixed(1)}m on a 68m pitch; a cross needs ~25m, which is why no cross is ever attempted)`);

console.log('');
if (fails) {
  if (brokeKnownBad) console.log(`  !! ${brokeKnownBad} known-bad ratchet(s) tripped — a measured catastrophe got WORSE. These bars exist so the`);
  if (brokeKnownBad) console.log(`     flank cannot fall further out of the sim while the rebuild (decisions-for-ck.md s.1, s.19) is parked.`);
  if (brokeStructural) console.log(`  !! ${brokeStructural} structural bar(s) tripped — the shape or the candidate supply changed, so the diagnosis above`);
  if (brokeStructural) console.log(`     is now measuring a different game. Re-read the probe before re-baselining anything.`);
  console.log(`\n✗ ${fails} width-diagnosis check(s) failed`);
  process.exit(1);
}
console.log('✓ width has not got worse — and the flank is still outside the simulation:');
console.log(`  ${candWidePct.toFixed(1)}% of pass options are wide, ${wideVetoPct.toFixed(1)}% of those are vetoed outright, ${chosenWidePct.toFixed(2)}% get played (real football 20-35%).`);
console.log('  A green run here means "no new damage", not "width works". See docs/decisions-for-ck.md s.19.');
