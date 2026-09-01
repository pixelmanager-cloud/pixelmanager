// MEASUREMENT LENS probe 3 — a structural asymmetry NEITHER the harness nor the null controls for.
// engine.ts giveKickoff() hands the ball to players[teamIdx][SLOT 6] unconditionally. Slot 6 is a
// different anchor in every formation (4-1-4-1: wide MF y=10; 5-4-1: wide MF y=12; 4-3-3: central MF
// y=34; 4-2-2-2: MF y=42). There are ~5-6 kickoffs a match. A/B: keep it, vs hand the ball to the most
// CENTRAL outfielder in every shape, so the restart is shape-neutral.
import { MatchEngine, generateTeam, autoPickXI, buildXI, DEFAULT_TACTICS, FORMATIONS, PITCH } from '@fm/shared';
const names = Object.keys(FORMATIONS) as any[];
const N = Number(process.env.FN ?? 50);
const NEUTRAL = process.env.KICK === 'neutral';

const orig = (MatchEngine.prototype as any).giveKickoff;
if (typeof orig !== 'function') { console.log('PATCH FAILED: giveKickoff is not on the prototype'); process.exit(1); }
let patched = 0;
if (NEUTRAL) {
  (MatchEngine.prototype as any).giveKickoff = function (teamIdx: 0 | 1) {
    orig.call(this, teamIdx);
    const ps = this.teams[teamIdx].players;
    let best = 6, bd = Infinity;
    for (let i = 1; i < ps.length; i++) { const d = Math.abs(ps[i].anchor.y - 34); if (d < bd) { bd = d; best = i; } }
    const s = this.state;
    // undo slot 6's teleport, then teleport the chosen man instead
    if (best !== 6) {
      const a6 = teamIdx === 0 ? ps[6].anchor : { x: PITCH.w - ps[6].anchor.x, y: PITCH.h - ps[6].anchor.y };
      s.players[teamIdx][6] = { ...s.players[teamIdx][6], x: a6.x, y: a6.y };
      s.players[teamIdx][best] = { ...s.players[teamIdx][best], x: PITCH.w / 2, y: PITCH.h / 2 };
      s.carrier = { teamIdx, playerIdx: best };
    }
    patched++;
  };
}
const mk = (id: string, sd: number, f: any) => { const t: any = generateTeam(id, id, 0xff0000, 12, sd, f); return buildXI(t, autoPickXI(t, f)); };
const gdFor: Record<string, number[]> = {}; for (const n of names) gdFor[n] = [];
let tg = 0, tm = 0;
for (const A of names) for (const B of names) {
  if (A === B) continue;
  for (let i = 0; i < N; i++) {
    const e: any = new MatchEngine([mk('a', i * 7 + 1, A), mk('b', i * 11 + 3, B)], i * 31 + 5,
      [{ ...DEFAULT_TACTICS, formation: A }, { ...DEFAULT_TACTICS, formation: B }]);
    let g = 0; while (!e.state.finished && g++ < 40000) e.tick();
    const d = e.state.score[0] - e.state.score[1];
    gdFor[A].push(d); gdFor[B].push(-d); tg += e.state.score[0] + e.state.score[1]; tm++;
  }
}
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
const rows = names.map((n) => ({ n, m: mean(gdFor[n]) })).sort((a, b) => b.m - a.m);
console.log(`KICK=${NEUTRAL ? 'neutral' : 'slot6'} N=${N} matches=${tm} goals/match=${(tg / tm).toFixed(3)} patchCalls=${patched}`);
for (const r of rows) console.log(`  ${r.n.padEnd(10)} ${r.m >= 0 ? '+' : ''}${r.m.toFixed(3)}`);
console.log(`  spread ${(rows[0].m - rows[rows.length - 1].m).toFixed(3)}`);
(MatchEngine.prototype as any).giveKickoff = orig;
