// PASS_REL decides how much a passer's edge over the defence he is playing carries. Too little and squad
// quality stops mattering; too much and a mismatch turns into a cricket score. This measures both ends.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';

const N = Number(process.env.N ?? 60);
const pair = (qa: number, qb: number) => {
  let win = 0, gd = 0, gf = 0, ga = 0;
  for (let i = 0; i < N; i++) {
    const a = generateTeam(`a${i}`, 'A', 'A', 0x1, qa, i * 7 + 1, '4-4-2');
    const b = generateTeam(`b${i}`, 'B', 'B', 0x2, qb, i * 11 + 3, '4-4-2');
    const m = new MatchEngine([a, b], i * 31 + 5, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
    while (!m.state.finished) m.tick();
    if (m.state.score[0] > m.state.score[1]) win++;
    gd += m.state.score[0] - m.state.score[1]; gf += m.state.score[0]; ga += m.state.score[1];
  }
  return `win=${(100 * win / N).toFixed(0)}% GD=${(gd / N).toFixed(2)} (${(gf / N).toFixed(2)}-${(ga / N).toFixed(2)})`;
};
console.log(`15v11  ${pair(15, 11)}`);
console.log(`14v12  ${pair(14, 12)}`);
console.log(`13v13  ${pair(13, 13)}`);
