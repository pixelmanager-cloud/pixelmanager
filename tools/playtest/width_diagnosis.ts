// ── WHY WIDTH DOES NOT PAY ────────────────────────────────────────────────────────────────────────────
// The diagnostic behind the width half of the engine rebuild. Six of strategy_test's assertions measure a
// reward for playing wide (wide 3-4-3 vs a narrow diamond, wide-playmaker vs central duties in the wide
// slot, 3-4-3's central-vs-wide attacking focus). They fail because the engine does not implement that
// reward — and this reports, in order, exactly where the flank falls out of the simulation.
//
// Findings on the pre-rebuild engine, reproduced by running this:
//   formation anchors put FOUR players ~24m off centre, and they hold ~14.5m off centre all match
//   38.4% of legal pass candidates are wide (>10m off centre)
//   ... but only 4.6% of passes actually chosen are wide
//   so the CARRIER sits a median of 2.8m from the centre line (p90 4.9m) on a pitch 68m wide
//   and a cross can therefore never be attempted, because the ball is never in a crossing position
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam, autoPickXI, buildXI } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import type { Team } from '../../shared/src/types.js';

const mk = (s: number): Team => {
  const t = generateTeam(`t${s}`, 'T', 'T', 0x445566, 12, s);
  return buildXI(t, autoPickXI(t, '4-4-2'), '4-4-2');
};

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
  for (let i = 1; i < 11; i++) {
    const a = Math.abs(m.baseAnchor(0, i).y - 34);
    const v = per[i].slice().sort((x, y) => x - y);
    console.log(`  p${String(i).padEnd(2)} anchor ${a.toFixed(0).padStart(2)}  actual p50 ${v[Math.floor(v.length / 2)].toFixed(1).padStart(4)}  p90 ${v[Math.floor(v.length * 0.9)].toFixed(1)}`);
  }
}

// 2. of the passes AVAILABLE, how many are wide — and how many get played
{
  const seed = 13;
  const m: any = new MatchEngine([mk(seed), mk(seed + 1)], seed, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
  const proto = Object.getPrototypeOf(m);
  const orig = proto.pickPassTarget;
  let cands = 0, candWide = 0, chosen = 0, chosenWide = 0;
  proto.pickPassTarget = function (teamIdx: 0 | 1, playerIdx: number, goal: { x: number; y: number }) {
    const s = this.state, cs = s.players[teamIdx][playerIdx];
    for (let i = 0; i < 11; i++) {
      if (i === playerIdx) continue;
      const ts = s.players[teamIdx][i];
      const d = Math.hypot(ts.x - cs.x, ts.y - cs.y);
      if (d > 42 || d < 3) continue;
      cands++; if (Math.abs(ts.y - 34) > 10) candWide++;
    }
    const r = orig.call(this, teamIdx, playerIdx, goal);
    if (r) { chosen++; if (Math.abs(s.players[teamIdx][r.idx].y - 34) > 10) chosenWide++; }
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
  console.log('\n── what happens to the ball ──');
  console.log(`  pass candidates wide (>10m off centre): ${(100 * candWide / cands).toFixed(1)}%`);
  console.log(`  passes CHOSEN that are wide:            ${(100 * chosenWide / chosen).toFixed(1)}%   <- the gap is the defect`);
  console.log(`  carrier |y-34|: p50 ${carrierOff[Math.floor(carrierOff.length / 2)].toFixed(1)}  p90 ${carrierOff[Math.floor(carrierOff.length * 0.9)].toFixed(1)}  max ${carrierOff[carrierOff.length - 1].toFixed(1)}`);
}
