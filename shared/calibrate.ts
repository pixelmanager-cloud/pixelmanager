// Headless calibration: simulate N matches, report goal/shot distributions.
import { MatchEngine } from './src/engine.js';
import { generateTeam } from './src/teams.js';

const N = 40;
let goals = 0, shots = 0;
const scores: string[] = [];
for (let i = 0; i < N; i++) {
  const home = generateTeam('h', 'Home', 'HOM', 0xff0000, 70, i * 7 + 1);
  const away = generateTeam('a', 'Away', 'AWY', 0x0000ff, 68, i * 13 + 2);
  const m = new MatchEngine([home, away], i * 31 + 5);
  while (!m.state.finished) m.tick();
  const [h, a] = m.state.score;
  goals += h + a;
  shots += m.state.events.filter((e) => e.type.startsWith('shot') || e.type === 'goal').length;
  scores.push(`${h}-${a}`);
}
console.log(`matches=${N} avg goals/match=${(goals / N).toFixed(2)} avg shots/match=${(shots / N).toFixed(1)}`);
console.log('sample scores:', scores.slice(0, 12).join('  '));
