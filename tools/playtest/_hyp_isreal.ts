// MEASUREMENT LENS — re-derive the through-ball-gate claim's numbers at the call sites, not from events.
import { MatchEngine, generateTeam, autoPickXI, buildXI, DEFAULT_TACTICS, FORMATIONS } from '@fm/shared';

const names = Object.keys(FORMATIONS) as any[];
const N = Number(process.env.FN ?? 12);
const mk = (id: string, sd: number, f: any) => { const t: any = generateTeam(id, id, 0xff0000, 12, sd, f); return buildXI(t, autoPickXI(t, f)); };

type Acc = {
  matches: number; calls: number; picks: number;
  byRole: Record<string, number>; gainSum: number; gainByRole: Record<string, number>;
  eligible: number;       // picks with gain>16 && role FW  (through-ball gate's structural half)
  blocked: number;        // picks with gain>16 && role!=FW (high-value pass a non-FW received: gate refuses)
  through: number;        // picks flagged through (gate + rng passed)
  bldCalls: number; bldTrue: number;   // beatsLastDefender = the clear-chance gate itself
  shots: number; clearShots: number; distSum: number; goals: number;
  evShots: number; evChance: number;   // what an EVENT-derived counter would have reported
  gf: number; ga: number; clearTicks: number;
};
const A: Record<string, Acc> = {};
const blank = (): Acc => ({ matches: 0, calls: 0, picks: 0, byRole: {}, gainSum: 0, gainByRole: {}, eligible: 0,
  blocked: 0, through: 0, bldCalls: 0, bldTrue: 0, shots: 0, clearShots: 0, distSum: 0, goals: 0,
  evShots: 0, evChance: 0, gf: 0, ga: 0, clearTicks: 0 });
for (const n of names) A[n] = blank();

let SHAPE: [string, string] = ['', ''];
let live = false;

const proto: any = (MatchEngine as any).prototype;
const oPick = proto.pickPassTarget, oBld = proto.beatsLastDefender, oShot = proto.resolveShot;
for (const [n, f] of [['pickPassTarget', oPick], ['beatsLastDefender', oBld], ['resolveShot', oShot]] as any[]) {
  if (typeof f !== 'function') { console.log(`INSTRUMENT DEAD: ${n} is not a function`); process.exit(1); }
}

proto.pickPassTarget = function (this: any, teamIdx: 0 | 1, playerIdx: number, goal: any) {
  if (!live) return oPick.call(this, teamIdx, playerIdx, goal);
  const acc = A[SHAPE[teamIdx]];
  acc.calls++;
  const s = this.state, cs = s.players[teamIdx][playerIdx];
  const myDistGoal = Math.hypot(goal.x - cs.x, goal.y - cs.y);
  const r = oPick.call(this, teamIdx, playerIdx, goal);
  if (r) {
    const ts = s.players[teamIdx][r.idx];
    const gain = myDistGoal - Math.hypot(goal.x - ts.x, goal.y - ts.y);
    const role = this.teams[teamIdx].players[r.idx].role;
    acc.picks++;
    acc.byRole[role] = (acc.byRole[role] ?? 0) + 1;
    acc.gainSum += gain;
    acc.gainByRole[role] = (acc.gainByRole[role] ?? 0) + gain;
    if (gain > 16) { if (role === 'FW') acc.eligible++; else acc.blocked++; }
    if (r.through) acc.through++;
  }
  return r;
};
proto.beatsLastDefender = function (this: any, teamIdx: 0 | 1, recIdx: number) {
  const r = oBld.call(this, teamIdx, recIdx);
  if (live) { const a = A[SHAPE[teamIdx]]; a.bldCalls++; if (r) a.bldTrue++; }
  return r;
};
proto.resolveShot = function (this: any, teamIdx: 0 | 1, playerIdx: number, distGoal: number, clear: boolean, ar = true) {
  if (live) { const a = A[SHAPE[teamIdx]]; a.shots++; a.distSum += distGoal; if (clear) a.clearShots++; }
  const before = this.state.score[teamIdx];
  const r = oShot.call(this, teamIdx, playerIdx, distGoal, clear, ar);
  if (live && this.state.score[teamIdx] > before) A[SHAPE[teamIdx]].goals++;
  return r;
};

const pairGd: Record<string, Record<string, number[]>> = {};
for (const a of names) { pairGd[a] = {}; for (const b of names) pairGd[a][b] = []; }
const gdFor: Record<string, number[]> = {}; for (const n of names) gdFor[n] = [];

const t0 = Date.now();
for (const Af of names) for (const Bf of names) {
  if (Af === Bf) continue;
  for (let i = 0; i < N; i++) {
    const e: any = new MatchEngine([mk('a', i * 7 + 1, Af), mk('b', i * 11 + 3, Bf)], i * 31 + 5,
      [{ ...DEFAULT_TACTICS, formation: Af }, { ...DEFAULT_TACTICS, formation: Bf }]);
    SHAPE = [Af, Bf]; live = true;
    let g = 0;
    while (!e.state.finished && g++ < 40000) {
      e.tick();
      if (e.clearRun[0] !== -1) A[Af].clearTicks++;
      if (e.clearRun[1] !== -1) A[Bf].clearTicks++;
    }
    live = false;
    A[Af].matches++; A[Bf].matches++;
    A[Af].gf += e.state.score[0]; A[Af].ga += e.state.score[1];
    A[Bf].gf += e.state.score[1]; A[Bf].ga += e.state.score[0];
    for (const ev of e.state.events) {
      const acc = A[SHAPE[ev.teamIdx as 0 | 1]]; if (!acc) continue;
      if (ev.type === 'chance') acc.evChance++;
      if (ev.type === 'shot_missed' || ev.type === 'woodwork' || ev.type === 'goal' || ev.type === 'shot_saved') acc.evShots++;
    }
    gdFor[Af].push(e.state.score[0] - e.state.score[1]);
    gdFor[Bf].push(e.state.score[1] - e.state.score[0]);
    pairGd[Af][Bf].push(e.state.score[0] - e.state.score[1]);
    pairGd[Bf][Af].push(e.state.score[1] - e.state.score[0]);
  }
}
proto.pickPassTarget = oPick; proto.beatsLastDefender = oBld; proto.resolveShot = oShot;

const mean = (d: number[]) => d.reduce((a, b) => a + b, 0) / (d.length || 1);
const ci = (d: number[]) => { const m = mean(d); return 1.96 * Math.sqrt(d.reduce((a, b) => a + (b - m) ** 2, 0) / (d.length - 1)) / Math.sqrt(d.length); };
console.log(`elapsed ${((Date.now() - t0) / 1000).toFixed(0)}s   N=${N} per ordered pair, ${A[names[0]].matches} matches per shape`);
const rows = names.slice().sort((a, b) => mean(gdFor[b]) - mean(gdFor[a]));

console.log('\nA. GD / goals / CLEAR CHANCES (measured at beatsLastDefender, the gate itself)');
console.log('shape         GD    +/-     GF     GA   gateCall/m  CLEARCH/m  ev:chance/m   TRUEshot/m ev:shot/m  conv%  clrTick/ch');
for (const n of rows) {
  const a = A[n], m = a.matches, p = (x: number) => (x / m).toFixed(2).padStart(9);
  console.log(`${String(n).padEnd(10)} ${mean(gdFor[n]) >= 0 ? '+' : ''}${mean(gdFor[n]).toFixed(3)} ${ci(gdFor[n]).toFixed(3)} ${(a.gf / m).toFixed(2).padStart(6)} ${(a.ga / m).toFixed(2).padStart(6)} ` +
    `${p(a.bldCalls)} ${p(a.bldTrue)} ${p(a.evChance)} ${p(a.shots)} ${p(a.evShots)} ${((a.goals / Math.max(1, a.shots)) * 100).toFixed(1).padStart(6)} ${(a.clearTicks / Math.max(1, a.bldTrue)).toFixed(1).padStart(8)}`);
}

console.log('\nB. PASS PICKS (measured inside pickPassTarget, per match)');
console.log('shape       calls/m  picks/m  FWpick  MFpick  DFpick  meanGain  FWgain  MFgain  gain>16&FW  gain>16&notFW  through/m');
for (const n of rows) {
  const a = A[n], m = a.matches, p = (x: number) => (x / m).toFixed(1).padStart(7);
  console.log(`${String(n).padEnd(10)} ${p(a.calls)} ${p(a.picks)} ${p(a.byRole.FW ?? 0)} ${p(a.byRole.MF ?? 0)} ${p(a.byRole.DF ?? 0)} ` +
    `${(a.gainSum / Math.max(1, a.picks)).toFixed(2).padStart(8)} ${((a.gainByRole.FW ?? 0) / Math.max(1, a.byRole.FW ?? 1)).toFixed(2).padStart(7)} ${((a.gainByRole.MF ?? 0) / Math.max(1, a.byRole.MF ?? 1)).toFixed(2).padStart(7)} ` +
    `${p(a.eligible)} ${p(a.blocked)} ${p(a.through)}`);
}

console.log('\nC. head-to-head mean GD (row vs column)');
process.stdout.write('           ' + rows.map((c) => String(c).padStart(10)).join('') + '\n');
for (const r of rows) {
  let line = String(r).padEnd(11), w = 0, l = 0;
  for (const c of rows) {
    if (r === c) { line += '         -'; continue; }
    const v = mean(pairGd[r][c]); line += (v >= 0 ? '+' : '') + v.toFixed(2).padStart(9);
    if (v > 0) w++; else if (v < 0) l++;
  }
  console.log(line + `   [${w}W ${l}L]`);
}
