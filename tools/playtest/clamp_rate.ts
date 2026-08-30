// Raising PASS_BASE to flatten the pyramid pushes the completion expression toward its 0.96 ceiling. If most
// passes clamp there, every modifier that feeds it — teamwork, Metronome, the play-out drill, the passer's own
// quality — is silently inert. This measures how much of the distribution is against the ceiling.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';

const N = Number(process.env.N ?? 30);
const raw: number[] = [];
const g: any = globalThis;
g.__COMPLETION_TAP = (v: number) => raw.push(v);
for (const q of [8, 13, 18]) {
  raw.length = 0;
  for (let i = 0; i < N; i++) {
    const a = generateTeam('a', 'A', 'A', 0x1, q, i * 7 + 1, '4-4-2');
    const b = generateTeam('b', 'B', 'B', 0x2, q, i * 11 + 3, '4-4-2');
    const m = new MatchEngine([a, b], i * 31 + 5, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
    while (!m.state.finished) m.tick();
  }
  if (!raw.length) { console.log('tap not installed'); break; }
  const at = raw.filter((v) => v >= 0.96).length;
  const lo = raw.filter((v) => v <= 0.1).length;
  const s = raw.slice().sort((x, y) => x - y);
  console.log(`q=${q}  n=${raw.length}  AT CEILING ${(100 * at / raw.length).toFixed(1)}%  at floor ${(100 * lo / raw.length).toFixed(1)}%  median ${s[Math.floor(s.length / 2)].toFixed(3)}  p10 ${s[Math.floor(s.length * 0.1)].toFixed(3)}`);
}
