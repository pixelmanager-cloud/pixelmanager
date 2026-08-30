// WHERE do shots come from? Instruments the engine's own shot resolver to record distance-from-goal
// for every attempt, plus how much time attackers spend inside the box.
import { MatchEngine, TICK_SEC } from '../../shared/src/engine.js';
import { generateTeam, autoPickXI, buildXI } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import type { Team } from '../../shared/src/types.js';

const N = Number(process.env.N ?? 200);
const dists: number[] = [];
let goals = 0, shots = 0, matches = 0, carrierTicks = 0, carrierInBox = 0, attInBoxTicks = 0, tickCount = 0;
const ballDist: number[] = [];
let through = 0, openPlay = 0;
const spells: number[] = [];
let curTeam: number | null = null, curLen = 0;
const fwDist: number[] = [];

for (let iter = 0; iter < N; iter++) {
  const seed = (iter * 7919 + 13) >>> 0;
  const mk = (s: number, q: number): Team => {
    const t = generateTeam(`t${s}`, 'Team', 'TM', 0x445566, q, s);
    const xi = buildXI(t, autoPickXI(t, '4-4-2'), '4-4-2');
    return xi;
  };
  let teams: [Team, Team];
  try { teams = [mk(seed, 12), mk(seed + 1, 12)]; } catch (e) { console.log('setup', String(e).slice(0,150)); break; }
  const m: any = new MatchEngine(teams, seed, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
  // instrument the shot resolver
  const proto = Object.getPrototypeOf(m);
  if (!proto.__instr) {
    const orig = proto.resolveShot;
    proto.resolveShot = function (...args: any[]) {
      const st = this.state;
      const c = st.carrier;
      if (c) {
        const g = this.goalOf(c.teamIdx);
        const p = st.players[c.teamIdx][c.playerIdx];
        dists.push(Math.hypot(p.x - g.x, p.y - g.y));
      }
      shots++;
      if (args[3]) through++; else openPlay++;
      return orig.apply(this, args);
    };
    proto.__instr = true;
  }
  for (let t = 0; t < 12000 && !m.state.finished; t++) {
    m.tick(); tickCount++;
    const c = m.state.carrier;
    // possession spell length
    const tnow = c ? c.teamIdx : null;
    if (tnow !== curTeam) { if (curTeam !== null && curLen) spells.push(curLen); curTeam = tnow; curLen = 0; }
    if (tnow !== null) curLen++;
    if (c) {
      carrierTicks++;
      const g = m.goalOf(c.teamIdx);
      const p = m.state.players[c.teamIdx][c.playerIdx];
      if (Math.hypot(p.x - g.x, p.y - g.y) < 18) carrierInBox++;
      ballDist.push(Math.abs(m.state.ball.x - g.x));
      // attackers of the carrying team inside the box
      for (let i = 1; i < 11; i++) {
        const q = m.state.players[c.teamIdx][i];
        if (Math.abs(q.x - g.x) < 16.5 && Math.abs(q.y - 34) < 20) attInBoxTicks++;
        if (teams[c.teamIdx].players[i]?.role === 'FW') fwDist.push(Math.abs(q.x - g.x));
      }
    }
  }
  matches++;
  goals += m.state.score[0] + m.state.score[1];
}
dists.sort((a, b) => a - b);
const q = (p: number) => dists.length ? dists[Math.floor(dists.length * p)].toFixed(1) : 'n/a';
console.log(`matches=${matches} shots/match=${(shots/matches).toFixed(1)} goals/match=${(goals/matches).toFixed(2)}`);
console.log(`  from through-ball: ${(through/matches).toFixed(1)}/match   from open play: ${(openPlay/matches).toFixed(1)}/match`);
console.log(`shot distance  p10 ${q(0.1)}  median ${q(0.5)}  p90 ${q(0.9)}   (metres from goal)`);
console.log(`shots inside 18m: ${(100 * dists.filter((d) => d < 18).length / (dists.length||1)).toFixed(1)}%`);
console.log(`carrier inside 18m: ${(100 * carrierInBox / (carrierTicks||1)).toFixed(1)}% of carrier time`);
ballDist.sort((a,b)=>a-b);
const bq = (p: number) => ballDist.length ? ballDist[Math.floor(ballDist.length*p)].toFixed(1) : 'n/a';
console.log(`ball dist from attacked goal: p10 ${bq(0.1)} median ${bq(0.5)} p90 ${bq(0.9)}`);
console.log(`ball in final third (<35m): ${(100*ballDist.filter(d=>d<35).length/(ballDist.length||1)).toFixed(1)}% of attacking time`);
spells.sort((a,b)=>a-b); fwDist.sort((a,b)=>a-b);
console.log(`possession spell ticks: median ${spells.length?spells[Math.floor(spells.length/2)]:0}  p90 ${spells.length?spells[Math.floor(spells.length*0.9)]:0}  (TICK_SEC=${TICK_SEC})`);
console.log(`FW dist from attacked goal while attacking: p10 ${fwDist.length?fwDist[Math.floor(fwDist.length*0.1)].toFixed(1):'-'} median ${fwDist.length?fwDist[Math.floor(fwDist.length*0.5)].toFixed(1):'-'}`);
console.log(`attackers in box: ${(attInBoxTicks / (carrierTicks||1)).toFixed(2)} players on average while attacking`);
