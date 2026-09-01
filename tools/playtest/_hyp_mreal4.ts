// MEASUREMENT LENS probe 4 — (a) do the ground-truth harness's shapes share IDENTICAL personnel?
// (b) per-shape home/away split: does venue interact with shape (which would survive venue balancing)?
import { MatchEngine, generateTeam, autoPickXI, buildXI, DEFAULT_TACTICS, FORMATIONS } from '@fm/shared';
const names = Object.keys(FORMATIONS) as any[];
const mk = (id: string, sd: number, f: any) => { const t: any = generateTeam(id, id, 0xff0000, 12, sd, f); return buildXI(t, autoPickXI(t, f)); };
const fp = (f: any, sd: number) => JSON.stringify(mk('a', sd, f).players
  .map((p: any) => [p.role, JSON.stringify(p.attrs)]).sort());
console.log('personnel fingerprint (11 players + attrs, order-insensitive), seed 1 / 8 / 15:');
const groups: Record<string, string[]> = {};
for (const f of names) { const k = [1, 8, 15].map((s) => fp(f, s)).join('|'); (groups[k] ??= []).push(f); }
Object.values(groups).forEach((g, i) => console.log(`   group ${i + 1}: ${g.join(', ')}`));

const N = Number(process.env.FN ?? 30);
const home: Record<string, number[]> = {}, away: Record<string, number[]> = {};
for (const n of names) { home[n] = []; away[n] = []; }
for (const A of names) for (const B of names) {
  if (A === B) continue;
  for (let i = 0; i < N; i++) {
    const e: any = new MatchEngine([mk('a', i * 7 + 1, A), mk('b', i * 11 + 3, B)], i * 31 + 5,
      [{ ...DEFAULT_TACTICS, formation: A }, { ...DEFAULT_TACTICS, formation: B }]);
    let g = 0; while (!e.state.finished && g++ < 40000) e.tick();
    const d = e.state.score[0] - e.state.score[1];
    home[A].push(d); away[B].push(-d);
  }
}
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
console.log(`\nper-shape venue split (N=${N}/pair, ${home[names[0]].length} home + ${away[names[0]].length} away records each):`);
const rows = names.map((n) => ({ n, h: mean(home[n]), a: mean(away[n]) })).sort((x, y) => (y.h + y.a) - (x.h + x.a));
for (const r of rows) console.log(`   ${r.n.padEnd(10)} home ${r.h >= 0 ? '+' : ''}${r.h.toFixed(3)}  away ${r.a >= 0 ? '+' : ''}${r.a.toFixed(3)}  HA ${(r.h - r.a).toFixed(3)}  field ${((r.h + r.a) / 2 >= 0 ? '+' : '') + ((r.h + r.a) / 2).toFixed(3)}`);
const ha = rows.map((r) => r.h - r.a);
console.log(`   home advantage: mean ${(mean(ha) / 2).toFixed(3)} gd/match, per-shape HA spread ${(Math.max(...ha) - Math.min(...ha)).toFixed(3)}`);
console.log(`   home-only spread ${(Math.max(...rows.map(r=>r.h)) - Math.min(...rows.map(r=>r.h))).toFixed(3)}   away-only spread ${(Math.max(...rows.map(r=>r.a)) - Math.min(...rows.map(r=>r.a))).toFixed(3)}   field spread ${(Math.max(...rows.map(r=>(r.h+r.a)/2)) - Math.min(...rows.map(r=>(r.h+r.a)/2))).toFixed(3)}`);
