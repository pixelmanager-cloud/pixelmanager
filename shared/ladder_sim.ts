// Ad-hoc balance check: does the star-vs-filler stat ladder produce the intended
// gradient — stronger squads win most, but weaker squads win occasionally (never = bad)?
import { MatchEngine } from './src/engine.js';
import { generateTeam } from './src/teams.js';
import { DEFAULT_TACTICS } from './src/tactics.js';

// quality centres for each tier (1-20 engine scale), per the decided ranges
const TIER = { filler: 6, common: 12, rare: 14, epic: 17, legendary: 19 };

function play(qA: number, qB: number, seed: number): [number, number] {
  const A = generateTeam('a', 'A', 'AAA', 0xff0000, qA, seed * 7 + 1, '4-4-2');
  const B = generateTeam('b', 'B', 'BBB', 0x0000ff, qB, seed * 13 + 3, '4-4-2');
  const m = new MatchEngine([A, B], seed * 31 + 5, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
  while (!m.state.finished) m.tick();
  return [m.state.score[0], m.state.score[1]];
}

const N = 400;
function series(label: string, qStrong: number, qWeak: number) {
  let sw = 0, d = 0, ww = 0, g = 0;
  for (let i = 0; i < N; i++) {
    const [ss, ws] = play(qStrong, qWeak, i + 1);
    g += ss + ws;
    if (ss > ws) sw++; else if (ws > ss) ww++; else d++;
  }
  const pct = (x: number) => `${(x / N * 100).toFixed(1)}%`;
  console.log(`${label.padEnd(26)} strong ${pct(sw).padStart(6)}  draw ${pct(d).padStart(6)}  WEAK-WINS ${pct(ww).padStart(6)}   goals/match ${(g / N).toFixed(2)}`);
}

console.log(`(${N} matches each, identical tactics, so only stats differ)\n`);
series('filler vs filler', TIER.filler, TIER.filler);
series('common  vs filler', TIER.common, TIER.filler);
series('rare    vs filler', TIER.rare, TIER.filler);
series('epic    vs filler', TIER.epic, TIER.filler);
series('legendary vs filler', TIER.legendary, TIER.filler);
console.log('');
series('legendary vs common', TIER.legendary, TIER.common);
series('legendary vs epic', TIER.legendary, TIER.epic);
series('epic    vs rare', TIER.epic, TIER.rare);
series('common  vs common', TIER.common, TIER.common);
