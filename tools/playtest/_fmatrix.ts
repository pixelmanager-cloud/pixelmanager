import { MatchEngine, generateTeam, autoPickXI, buildXI, DEFAULT_TACTICS, FORMATIONS } from '@fm/shared';
const names = Object.keys(FORMATIONS) as any[];
const N = Number(process.env.FN ?? 120);
const mk = (id: string, sd: number, f: any) => { const t: any = generateTeam(id, id, 0xff0000, 12, sd, f); return buildXI(t, autoPickXI(t, f)); };
// Every ordered pair, so each shape plays every other home AND away — venue is not a confound.
const gdFor: Record<string, number[]> = {};
for (const n of names) gdFor[n] = [];
for (const A of names) for (const B of names) {
  if (A === B) continue;
  for (let i = 0; i < N; i++) {
    const e: any = new MatchEngine([mk('a', i * 7 + 1, A), mk('b', i * 11 + 3, B)], i * 31 + 5,
      [{ ...DEFAULT_TACTICS, formation: A }, { ...DEFAULT_TACTICS, formation: B }]);
    let g = 0; while (!e.state.finished && g++ < 40000) e.tick();
    gdFor[A].push(e.state.score[0] - e.state.score[1]);
    gdFor[B].push(e.state.score[1] - e.state.score[0]);
  }
}
const rows = names.map((n) => {
  const d = gdFor[n]; const m = d.reduce((a, b) => a + b, 0) / d.length;
  const sd = Math.sqrt(d.reduce((a, b) => a + (b - m) ** 2, 0) / (d.length - 1));
  return { n, m, ci: 1.96 * sd / Math.sqrt(d.length), k: d.length };
}).sort((a, b) => b.m - a.m);
console.log(`  mean goal difference per match, each shape vs the whole field (n=${rows[0].k} matches each)`);
for (const r of rows) console.log(`    ${String(r.n).padEnd(10)} ${r.m >= 0 ? '+' : ''}${r.m.toFixed(3)}  +/- ${r.ci.toFixed(3)}`);
console.log(`  spread best-to-worst: ${(rows[0].m - rows[rows.length-1].m).toFixed(3)} goals/match`);
