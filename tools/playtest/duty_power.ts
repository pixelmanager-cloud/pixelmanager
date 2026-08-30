// Same power question for the anchor duty and the play-out-of-defence instruction: is the assertion wrong
// about the engine, or is the engine wrong about football? A paired design (identical seeds either side)
// removes the match-to-match variance that a bare sum over 60 matches cannot see past.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import type { Team, Duty, Tactics } from '../../shared/src/types.js';

const N = Number(process.env.N ?? 400);
const withMfDuty = (t: Team, duty: Duty): Team => ({ ...t, players: t.players.map((p) => (p.role === 'MF' ? { ...p, duty } : p)) });
const direct: Tactics = { ...DEFAULT_TACTICS, formation: '4-3-3', mentality: 1, tempo: 2 } as any;

function stat(d: number[], label: string) {
  const mean = d.reduce((a, b) => a + b, 0) / d.length;
  const sd = Math.sqrt(d.reduce((a, b) => a + (b - mean) ** 2, 0) / (d.length - 1));
  const se = sd / Math.sqrt(d.length);
  console.log(`${label.padEnd(44)} ${mean >= 0 ? '+' : ''}${mean.toFixed(3)}  95% CI [${(mean - 1.96 * se).toFixed(3)}, ${(mean + 1.96 * se).toFixed(3)}]`);
}

const concede = (duty: Duty, i: number) => {
  const def = withMfDuty(generateTeam('d', 'D', 'D', 0x1, 13, i * 7 + 1, '4-4-2'), duty);
  const atk = generateTeam('a', 'A', 'A', 0x2, 13, i * 11 + 3, '4-3-3');
  const m = new MatchEngine([def, atk], i * 31 + 5, [DEFAULT_TACTICS, direct]);
  while (!m.state.finished) m.tick();
  return m.state.score[1];
};
const aBw: number[] = [], aB2b: number[] = [], aDlp: number[] = [];
for (let i = 0; i < N; i++) {
  const a = concede('anchor', i);
  aBw.push(a - concede('ball-winner', i));
  aB2b.push(a - concede('box-to-box', i));
  aDlp.push(a - concede('deep-lying-playmaker', i));
}
console.log(`anchor vs the other MF duties, goals conceded (negative = anchor is better), N=${N}`);
stat(aBw, '  anchor - ball-winner'); stat(aB2b, '  anchor - box-to-box'); stat(aDlp, '  anchor - deep-lying-playmaker');

console.log(`\nplay-out-of-defence vs a high press, goals conceded, N=${N}`);
const hp: Tactics = { ...DEFAULT_TACTICS, press: 2 } as any;
const po: number[] = [], poss: number[] = [];
for (let i = 0; i < N; i++) {
  const run = (on: boolean) => {
    const a = generateTeam('a', 'A', 'A', 0x1, 13, i * 7 + 1, '4-4-2');
    const b = generateTeam('b', 'B', 'B', 0x2, 13, i * 11 + 3, '4-4-2');
    const m = new MatchEngine([a, b], i * 31 + 5, [{ ...DEFAULT_TACTICS, playOutOfDefence: on } as any, hp]);
    while (!m.state.finished) m.tick();
    const tot = m.state.possession[0] + m.state.possession[1] || 1;
    return { ga: m.state.score[1], gf: m.state.score[0], poss: m.state.possession[0] / tot };
  };
  const on = run(true), off = run(false);
  po.push(on.ga - off.ga); poss.push(on.poss - off.poss);
}
stat(po, '  ON - OFF, goals conceded (want negative)');
stat(poss, '  ON - OFF, possession share (the trade-off?)');
