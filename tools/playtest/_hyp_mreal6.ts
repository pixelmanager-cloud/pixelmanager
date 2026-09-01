// MEASUREMENT LENS probe 6 — is the "scale-free" normalisation (spread divided by goals/match) valid?
// It is only valid if neutralising the role bias scales EVERY shape's scoring by the SAME factor.
// If two-striker shapes lose proportionally more goals-for than lone-striker shapes, then the goal-rate
// drop is itself shape-specific and dividing it out silently credits the geometry channel.
import { MatchEngine, generateTeam, autoPickXI, buildXI, DEFAULT_TACTICS, FORMATIONS } from '@fm/shared';
const names = Object.keys(FORMATIONS) as any[];
const N = Number(process.env.FN ?? 30);
const COND = process.env.COND ?? 'base';
const BIAS: Record<string, Record<string, number>> = {
  DF: { pace: 0, strength: 2, passing: -1, shooting: -5, tackling: 4, positioning: 3, workrate: 1, keeping: -10, setPiece: -2, stamina: 1 },
  MF: { pace: 1, strength: 0, passing: 3, shooting: 0, tackling: 0, positioning: 1, workrate: 3, keeping: -10, setPiece: 2, stamina: 3 },
  FW: { pace: 3, strength: 1, passing: 0, shooting: 4, tackling: -4, positioning: 2, workrate: 0, keeping: -10, setPiece: 2, stamina: 1 },
};
const KEYS = ['pace','strength','passing','shooting','tackling','positioning','workrate','keeping','setPiece','stamina'];
function doctor(t: any) {
  if (COND === 'base') return t;
  for (const p of t.players) { if (p.role === 'GK') continue; const b = BIAS[p.role]; for (const k of KEYS) p.attrs[k] = k === 'keeping' ? 2 : p.attrs[k] - b[k]; }
  return t;
}
const mk = (id: string, sd: number, f: any) => { const t: any = doctor(generateTeam(id, id, 0xff0000, 12, sd, f)); return buildXI(t, autoPickXI(t, f)); };
const gf: Record<string, number> = {}, ga: Record<string, number> = {}, k: Record<string, number> = {};
for (const n of names) { gf[n] = 0; ga[n] = 0; k[n] = 0; }
for (const A of names) for (const B of names) {
  if (A === B) continue;
  for (let i = 0; i < N; i++) {
    const e: any = new MatchEngine([mk('a', i * 7 + 1, A), mk('b', i * 11 + 3, B)], i * 31 + 5,
      [{ ...DEFAULT_TACTICS, formation: A }, { ...DEFAULT_TACTICS, formation: B }]);
    let g = 0; while (!e.state.finished && g++ < 40000) e.tick();
    gf[A] += e.state.score[0]; ga[A] += e.state.score[1]; k[A]++;
    gf[B] += e.state.score[1]; ga[B] += e.state.score[0]; k[B]++;
  }
}
console.log(`COND=${COND} N=${N}`);
console.log('  shape        GF/m   GA/m   GD/m');
const rows = names.map((n) => ({ n, gf: gf[n] / k[n], ga: ga[n] / k[n] })).sort((a, b) => (b.gf - b.ga) - (a.gf - a.ga));
for (const r of rows) console.log(`  ${r.n.padEnd(11)} ${r.gf.toFixed(3)}  ${r.ga.toFixed(3)}  ${((r.gf - r.ga) >= 0 ? '+' : '') + (r.gf - r.ga).toFixed(3)}`);
