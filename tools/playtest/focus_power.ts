// Two assertions in the strategy suite compare shot COUNTS summed over 60 matches and call a difference of
// nine shots in ~1,780 a result. That is a fifth of a standard deviation. This runs the same comparison at
// enough matches to say whether the effect exists at all, and reports the paired difference with its own
// error bar rather than a bare inequality.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';

const N = Number(process.env.N ?? 600);
const shots = (m: any, idx: 0 | 1) => m.state.events.filter((e: any) => e.teamIdx === idx && (e.type === 'goal' || e.type.startsWith('shot'))).length;

function paired(formation: any, fa: 'wide' | 'central', fb: 'wide' | 'central') {
  const d: number[] = [];
  for (let i = 0; i < N; i++) {
    const mk = () => [generateTeam('a', 'A', 'A', 0x1, 13, i * 7 + 1, formation), generateTeam('b', 'B', 'B', 0x2, 13, i * 11 + 3, '4-4-2')] as any;
    const run = (f: 'wide' | 'central') => {
      const [a, b] = mk();
      const m = new MatchEngine([a, b], i * 31 + 5, [{ ...DEFAULT_TACTICS, formation, attackFocus: f }, DEFAULT_TACTICS]);
      while (!m.state.finished) m.tick();
      return shots(m, 0);
    };
    d.push(run(fa) - run(fb));
  }
  const mean = d.reduce((x, y) => x + y, 0) / N;
  const sd = Math.sqrt(d.reduce((x, y) => x + (y - mean) ** 2, 0) / (N - 1));
  const se = sd / Math.sqrt(N);
  const ident = d.filter((x) => x === 0).length;
  return `${fa}-${fb} = ${mean >= 0 ? '+' : ''}${mean.toFixed(3)} shots/match  95% CI [${(mean - 1.96 * se).toFixed(3)}, ${(mean + 1.96 * se).toFixed(3)}]  identical in ${(100 * ident / N).toFixed(0)}% of matches`;
}
console.log(`N=${N} paired matches per comparison`);
console.log(`3-4-3 (wide shape)      ${paired('3-4-3', 'central', 'wide')}`);
console.log(`4-1-2-1-2 (narrow)      ${paired('4-1-2-1-2', 'wide', 'central')}`);
