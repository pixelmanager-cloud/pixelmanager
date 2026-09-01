// THROWAWAY PROBE 5 — where the forward ACTUALLY stands, vs the claimed "anchor + attackPush" target.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam, autoPickXI, buildXI } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import { FORMATIONS, type Formation } from '../../shared/src/formations.js';
import type { Team } from '../../shared/src/types.js';
const SHAPES = Object.keys(FORMATIONS) as Formation[];
const N = Number(process.argv[2] ?? 3);
const mk = (f: Formation, seed: number): Team => { const c = generateTeam(`t${seed}`, 'T', 0x445566, 12, seed, f); return buildXI(c, autoPickXI(c, f)); };
const stat: Record<string, { xs: number[]; in30: number; n: number }> = {};
for (const s of SHAPES) stat[s] = { xs: [], in30: 0, n: 0 };
let seed = 1;
for (const A of SHAPES) for (const B of SHAPES) { if (A === B) continue;
  for (let k = 0; k < N; k++) { const s = seed++;
    const e: any = new MatchEngine([mk(A, s * 7 + 1), mk(B, s * 7 + 2)], s, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
    const sh = [A, B]; let g = 0;
    while (!e.state.finished && g++ < 20000) { e.tick();
      const c = e.state.carrier; if (!c || g % 4) continue;
      const t = c.teamIdx as 0 | 1;                       // only while ATTACKING (his side has the ball)
      const st = stat[sh[t]]; const gx = t === 0 ? 105 : 0;
      let best = Infinity, bx = 0;
      for (let i = 1; i < 11; i++) { if (e.teams[t].players[i].role !== 'FW') continue;
        const p = e.state.players[t][i]; const d = Math.hypot(gx - p.x, 34 - p.y);
        if (d < best) { best = d; bx = t === 0 ? p.x : 105 - p.x; } }
      if (best === Infinity) continue;
      st.xs.push(bx); st.n++; if (best < 30) st.in30++;
    } } }
const med = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
console.log('shape       anchFW  claimedTarget  MEDIAN x of the most advanced FW while attacking  mean  %ticks that FW is <30m from goal');
for (const f of SHAPES) { const a = Math.max(...FORMATIONS[f].filter((s) => s.role === 'FW').map((s) => s.x)); const st = stat[f];
  console.log(`${f.padEnd(11)} ${String(a).padStart(4)} ${String(a + 6).padStart(13)} ${med(st.xs).toFixed(1).padStart(20)} ${(st.xs.reduce((x, y) => x + y, 0) / st.n).toFixed(1).padStart(30)} ${(100 * st.in30 / st.n).toFixed(1).padStart(10)}%`); }
