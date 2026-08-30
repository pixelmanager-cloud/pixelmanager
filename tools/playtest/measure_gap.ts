// Why does goals/match read 2.87 in the strategy suite and 1.97 in the geometry probe? Same engine, same
// tick loop — so the difference has to be in how each one BUILDS the two teams. This isolates the three
// candidate factors (squad quality, who picks the XI, and the seed scheme) one at a time.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam, autoPickXI, buildXI } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import type { Team } from '../../shared/src/types.js';

const N = Number(process.env.N ?? 120);

function run(label: string, make: (i: number) => [Team, Team, number]) {
  let g = 0, sh = 0;
  for (let i = 0; i < N; i++) {
    const [a, b, seed] = make(i);
    const m = new MatchEngine([a, b], seed, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
    while (!m.state.finished) m.tick();
    g += m.state.score[0] + m.state.score[1];
    sh += (m.state.shotAttempts?.[0] ?? 0) + (m.state.shotAttempts?.[1] ?? 0);
  }
  console.log(`${label.padEnd(46)} goals/match=${(g / N).toFixed(2)}  attempts/match=${(sh / N).toFixed(1)}`);
}

const plain = (q: number, s: number) => generateTeam(`t${s}`, 'T', 'TM', 0x445566, q, s, '4-4-2');
const rebuilt = (q: number, s: number) => { const t = plain(q, s); return buildXI(t, autoPickXI(t, '4-4-2'), '4-4-2'); };

// strategy_test's exact setup
run('A  q13, generateTeam XI, strategy seeds', (i) => [plain(13, i * 7 + 1), plain(13, i * 11 + 3), i * 31 + 5]);
// one factor changed at a time
run('B  q12, generateTeam XI, strategy seeds', (i) => [plain(12, i * 7 + 1), plain(12, i * 11 + 3), i * 31 + 5]);
run('C  q13, autoPickXI+buildXI, strategy seeds', (i) => [rebuilt(13, i * 7 + 1), rebuilt(13, i * 11 + 3), i * 31 + 5]);
run('D  q13, generateTeam XI, geometry seeds', (i) => { const s = (i * 7919 + 13) >>> 0; return [plain(13, s), plain(13, s + 1), s]; });
// shot_geometry's exact setup
run('E  q12, autoPickXI+buildXI, geometry seeds', (i) => { const s = (i * 7919 + 13) >>> 0; return [rebuilt(12, s), rebuilt(12, s + 1), s]; });
