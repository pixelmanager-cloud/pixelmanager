// The calibration gate measures goals/match at ONE squad quality (13). The pyramid spans tier strengths
// from the basement to the top flight, so this sweeps the whole range the game actually generates.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';

const N = Number(process.env.N ?? 120);
console.log('quality  goals/match  attempts  onTargetGoalRate');
const QS = (process.env.QS ?? '4,6,8,10,12,13,14,16,18').split(',').map(Number);
for (const q of QS) {
  let g = 0, at = 0;
  for (let i = 0; i < N; i++) {
    const a = generateTeam(`a${i}`, 'A', 'A', 0x1, q, i * 7 + 1, '4-4-2');
    const b = generateTeam(`b${i}`, 'B', 'B', 0x2, q, i * 11 + 3, '4-4-2');
    const m = new MatchEngine([a, b], i * 31 + 5, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
    while (!m.state.finished) m.tick();
    g += m.state.score[0] + m.state.score[1];
    at += (m.state.shotAttempts?.[0] ?? 0) + (m.state.shotAttempts?.[1] ?? 0);
  }
  console.log(`  ${String(q).padStart(2)}     ${(g / N).toFixed(2).padStart(6)}      ${(at / N).toFixed(1).padStart(5)}      ${(g / (at || 1) * 100).toFixed(1)}%`);
}
