import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
const t0 = Date.now();
let g = 0;
for (let i = 0; i < 100; i++) {
  const a = generateTeam('a', 'A', 1, 12, i * 13 + 1, '4-4-2');
  const b = generateTeam('b', 'B', 2, 12, i * 13 + 7, '4-3-3');
  const m = new MatchEngine([a, b], i * 31 + 5, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
  while (!m.state.finished) m.tick();
  g += m.state.score[0] + m.state.score[1];
}
console.log('100 matches ms=', Date.now() - t0, 'goals/match=', g / 100);
