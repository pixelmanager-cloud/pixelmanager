// The three things the rebuilt engine has to hold at once, in one run — because tuning any one of them in
// isolation broke another every time. (1) goals/match must stay in the gate's [1.6, 3.6] across the WHOLE
// pyramid, not just at the one quality it was calibrated on; (2) a mismatch must not be a cricket score;
// (3) a press must actually deny the pass, or half the tactical layer is decoration.
import { MatchEngine } from '../../shared/src/engine.js';
import { generateTeam } from '../../shared/src/teams.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';

const N = Number(process.env.N ?? 40);
const mk = (q: number, s: number, f: any = '4-4-2') => generateTeam(`t${s}`, 'T', 'T', 0x1, q, s, f);
const playOut = (a: any, b: any, ta: any, tb: any, seed: number) => {
  const m = new MatchEngine([a, b], seed, [ta, tb]);
  while (!m.state.finished) m.tick();
  return m.state;
};

let lo = Infinity, hi = -Infinity;
const curve: string[] = [];
for (const q of [6, 10, 13, 16, 18]) {
  let g = 0;
  for (let i = 0; i < N; i++) { const s = playOut(mk(q, i * 7 + 1), mk(q, i * 11 + 3), DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5); g += s.score[0] + s.score[1]; }
  const v = g / N; lo = Math.min(lo, v); hi = Math.max(hi, v);
  curve.push(`q${q}=${v.toFixed(2)}`);
}
let gd = 0;
for (let i = 0; i < N; i++) { const s = playOut(mk(15, i * 7 + 1), mk(11, i * 11 + 3), DEFAULT_TACTICS, DEFAULT_TACTICS, i * 31 + 5); gd += s.score[0] - s.score[1]; }

// pressure denied to the passing side in its OWN defensive third, against a maximum press
let pn = 0, ps = 0;
(globalThis as any).__PRESS_TAP = (p: number, isDef: boolean) => { if (isDef) { pn++; ps += p; } };
const hp: any = { ...DEFAULT_TACTICS, press: 2 };
for (let i = 0; i < 12; i++) playOut(mk(13, i * 7 + 1), mk(13, i * 11 + 3), DEFAULT_TACTICS, hp, i * 31 + 5);

console.log(`curve ${curve.join(' ')}  | in-gate=${lo >= 1.6 && hi <= 3.6}  spread=${(hi / lo).toFixed(2)}x`
  + `  | 15v11 GD=${(gd / N).toFixed(2)}  | defThirdPressure=${pn ? (ps / pn).toFixed(3) : 'no tap'}`);
