// SHOOT_ABS turned out to be another dial that does nothing, so the 3.1x spread in shot ATTEMPTS across
// squad quality is not the shot decision — it is how often play reaches a shooting position at all. This
// measures the chain: pass completion, possession spell length, time in the final third, carrier time in
// the box, and then the finish (mean shot quality, mean keeper resistance, mean goal probability).
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';

const N = Number(process.env.N ?? 40);
const QS = (process.env.QS ?? '6,10,13,16,18').split(',').map(Number);
console.log('  q  pass%  spell  final3rd%  boxTime%  shotQ  gkNorm  goalP   att   goals');
for (const q of QS) {
  let passOk = 0, passN = 0, spellSum = 0, spellN = 0, f3 = 0, ballN = 0, boxT = 0, carT = 0;
  let sq = 0, sqN = 0, gp = 0, gkn = 0, att = 0, goals = 0;
  for (let i = 0; i < N; i++) {
    const a = generateTeam(`a${i}`, 'A', 'A', 0x1, q, i * 7 + 1, '4-4-2');
    const b = generateTeam(`b${i}`, 'B', 'B', 0x2, q, i * 11 + 3, '4-4-2');
    const m: any = new MatchEngine([a, b], i * 31 + 5, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
    const proto = Object.getPrototypeOf(m);
    if (!proto.__why) {
      const oShot = proto.resolveShot;
      proto.resolveShot = function (ti: any, pi: any, d: number, clear: boolean, ar?: boolean) {
        const shooter = this.teams[ti].players[pi], ss = this.state.players[ti][pi];
        const gk = this.teams[1 - ti].players[0];
        const qual = Math.max(0, Math.min(1, (shooter.attrs.shooting / 20) * (0.7 + 0.3 * ss.fitness) * (1 - d / 26)));
        sq += qual; sqN++; gkn += gk.attrs.keeping / 20;
        gp += Math.max(0.02, Math.min(0.9, 0.08 + qual * 0.36 - (gk.attrs.keeping / 20) * 0.95 * 0.2));
        return oShot.call(this, ti, pi, d, clear, ar);
      };
      const oPass = proto.pickPassTarget;
      proto.__why = true;
      void oPass;
    }
    let curTeam: number | null = null, curLen = 0;
    const before = { s: 0 };
    void before;
    while (!m.state.finished) {
      const prevCarrier = m.state.carrier;
      m.tick();
      const c = m.state.carrier;
      const t = c ? c.teamIdx : null;
      if (t !== curTeam) { if (curTeam !== null && curLen) { spellSum += curLen; spellN++; } curTeam = t; curLen = 0; }
      if (t !== null) curLen++;
      // a pass "attempt" is any tick where we had a carrier; completion proxied by whether we still do
      if (prevCarrier) { passN++; if (c && c.teamIdx === prevCarrier.teamIdx) passOk++; }
      if (c) {
        carT++;
        const g = m.goalOf(c.teamIdx);
        const p = m.state.players[c.teamIdx][c.playerIdx];
        ballN++;
        if (Math.abs(m.state.ball.x - g.x) < 35) f3++;
        if (Math.hypot(p.x - g.x, p.y - g.y) < 18) boxT++;
      }
    }
    att += m.state.shotAttempts[0] + m.state.shotAttempts[1];
    goals += m.state.score[0] + m.state.score[1];
  }
  const pct = (a: number, b: number) => (100 * a / (b || 1)).toFixed(1);
  console.log(` ${String(q).padStart(2)}  ${pct(passOk, passN).padStart(5)}  ${(spellSum / (spellN || 1)).toFixed(1).padStart(5)}  ${pct(f3, ballN).padStart(8)}  ${pct(boxT, carT).padStart(7)}  ${(sq / (sqN || 1)).toFixed(3)}  ${(gkn / (sqN || 1)).toFixed(3)}   ${(gp / (sqN || 1)).toFixed(3)}  ${(att / N).toFixed(1).padStart(5)}  ${(goals / N).toFixed(2)}`);
}
