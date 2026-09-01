// THROWAWAY PROBE — ATTRIBUTION lens.
// Q: does the `gain > 16 && role === 'FW'` through-ball gate (engine.ts:834) EXPLAIN the 1.029-goal
//    formation gradient, or is it a constant that merely exists in every formation?
// Modes via MODE env: geom | meas | abl
import { MatchEngine, generateTeam, autoPickXI, buildXI, DEFAULT_TACTICS, FORMATIONS } from '@fm/shared';
import { mAdd, hasTrait } from '../../shared/src/mental.js';

const names = Object.keys(FORMATIONS) as any[];
const MODE = process.env.MODE ?? 'geom';
const N = Number(process.env.FN ?? 12);
const VAR = process.env.VAR ?? 'v0';

const norm = (s: number) => (Number.isFinite(s) ? s : 10) / 20;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const mk = (id: string, sd: number, f: any) => { const t: any = generateTeam(id, id, 0xff0000, 12, sd, f); return buildXI(t, autoPickXI(t, f)); };
const mkEngine = (A: any, B: any, i: number) => {
  const e: any = new MatchEngine([mk('a', i * 7 + 1, A), mk('b', i * 11 + 3, B)], i * 31 + 5,
    [{ ...DEFAULT_TACTICS, formation: A }, { ...DEFAULT_TACTICS, formation: B }]);
  e.__f = [A, B];
  return e;
};
const play = (e: any) => { let g = 0; while (!e.state.finished && g++ < 40000) e.tick(); return e; };

// ─────────────────────────────────────────────────────────────────────────────────────────
if (MODE === 'geom') {
  // where players ACTUALLY stand (not just anchors), split by role, while their side has the ball
  console.log('formation   FWn  FWx(mean)  topNonFWx  gap   anchorFWx  anchorTopNonFW  anchorGap');
  for (const F of names) {
    const sums: number[] = new Array(11).fill(0); let k = 0;
    for (let i = 0; i < 6; i++) {
      const e: any = mkEngine(F, '4-4-2', i);
      for (let t = 0; t < 12000 && !e.state.finished; t++) {
        e.tick();
        if (t % 20) continue;
        if (!e.state.carrier || e.state.carrier.teamIdx !== 0) continue;
        for (let p = 1; p < 11; p++) sums[p] += e.state.players[0][p].x;
        k++;
      }
    }
    const slots = FORMATIONS[F as keyof typeof FORMATIONS];
    const mean = sums.map((s) => s / Math.max(1, k));
    let fwx = -1, top = -1, fwn = 0;
    for (let p = 1; p < 11; p++) {
      if (slots[p].role === 'FW') { fwn++; fwx = Math.max(fwx, mean[p]); } else top = Math.max(top, mean[p]);
    }
    let afw = -1, atop = -1;
    for (let p = 1; p < 11; p++) { if (slots[p].role === 'FW') afw = Math.max(afw, slots[p].x); else atop = Math.max(atop, slots[p].x); }
    console.log(`${String(F).padEnd(11)} ${fwn}   ${fwx.toFixed(1).padStart(7)}  ${top.toFixed(1).padStart(8)}  ${(fwx - top).toFixed(1).padStart(5)}   ${String(afw).padStart(6)}  ${String(atop).padStart(10)}  ${String(afw - atop).padStart(8)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────
if (MODE === 'meas') {
  const orig = (MatchEngine as any).prototype.pickPassTarget;
  type S = { picks: number; fw: number; gain: number; gainFW: number; thru: number; fwAvail: number; fwLost: number; matches: number; chances: number; gf: number; ga: number; shots: number; ticksClear: number };
  const st: Record<string, S> = {};
  for (const n of names) st[n] = { picks: 0, fw: 0, gain: 0, gainFW: 0, thru: 0, fwAvail: 0, fwLost: 0, matches: 0, chances: 0, gf: 0, ga: 0, shots: 0, ticksClear: 0 };

  (MatchEngine as any).prototype.pickPassTarget = function (teamIdx: 0 | 1, playerIdx: number, goal: any) {
    const s = this.state; const cs = s.players[teamIdx][playerIdx];
    const myD = Math.hypot(goal.x - cs.x, goal.y - cs.y);
    // rng-free availability scan: was a FW candidate with gain>16 legally on the menu?
    let avail = false;
    for (let i = 0; i < 11; i++) {
      if (i === playerIdx || this.sentOff.has(teamIdx * 100 + i)) continue;
      const ts = s.players[teamIdx][i];
      const dPass = Math.hypot(ts.x - cs.x, ts.y - cs.y);
      if (dPass > 42 || dPass < 3) continue;
      const gain = myD - Math.hypot(goal.x - ts.x, goal.y - ts.y);
      if (gain > 16 && this.teams[teamIdx].players[i].role === 'FW') { avail = true; break; }
    }
    const pick = orig.call(this, teamIdx, playerIdx, goal);
    const F = this.__f[teamIdx]; const r = st[F];
    if (pick) {
      const ts = s.players[teamIdx][pick.idx];
      const gain = myD - Math.hypot(goal.x - ts.x, goal.y - ts.y);
      const isFW = this.teams[teamIdx].players[pick.idx].role === 'FW';
      r.picks++; r.gain += gain; if (isFW) { r.fw++; r.gainFW += gain; }
      if (pick.through) r.thru++;
      if (avail) { r.fwAvail++; if (!(isFW && gain > 16)) r.fwLost++; }
    }
    return pick;
  };

  for (const A of names) for (const B of names) {
    if (A === B) continue;
    for (let i = 0; i < N; i++) {
      const e = play(mkEngine(A, B, i));
      for (const side of [0, 1] as const) {
        const F = e.__f[side]; const r = st[F];
        r.matches++; r.gf += e.state.score[side]; r.ga += e.state.score[1 - side];
        for (const ev of e.state.events) if (ev.teamIdx === side) { if (ev.type === 'chance') r.chances++; if (ev.type === 'goal' || ev.type === 'shot_saved' || ev.type === 'shot_missed' || ev.type === 'woodwork') r.shots++; }
      }
    }
  }
  (MatchEngine as any).prototype.pickPassTarget = orig;
  console.log('formation   picks/m  FW%   meanGain  meanGainFW  through/m  chance/m  shots/m  GF/m   GA/m  FWavail/m  FWlost%');
  for (const F of names) {
    const r = st[F]; const m = r.matches;
    console.log(`${String(F).padEnd(11)} ${(r.picks / m).toFixed(0).padStart(6)} ${((100 * r.fw) / r.picks).toFixed(1).padStart(6)} ${(r.gain / r.picks).toFixed(2).padStart(9)} ${(r.gainFW / Math.max(1, r.fw)).toFixed(2).padStart(11)} ${(r.thru / m).toFixed(1).padStart(9)} ${(r.chances / m).toFixed(1).padStart(9)} ${(r.shots / m).toFixed(2).padStart(8)} ${(r.gf / m).toFixed(3).padStart(6)} ${(r.ga / m).toFixed(3).padStart(6)} ${(r.fwAvail / m).toFixed(1).padStart(10)} ${((100 * r.fwLost) / Math.max(1, r.fwAvail)).toFixed(1).padStart(8)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────
if (MODE === 'abl') {
  // rng-NEUTRAL re-implementation of pickPassTarget: the second rng draw happens for EVERY candidate,
  // so v0/v1/v2/v3 consume identical random streams and are exactly paired.
  const patched = function (this: any, teamIdx: 0 | 1, playerIdx: number, goal: any) {
    const s = this.state; const mods = this.mods[teamIdx]; const defTeam = (1 - teamIdx) as 0 | 1;
    const cs = s.players[teamIdx][playerIdx];
    const myDistGoal = Math.hypot(goal.x - cs.x, goal.y - cs.y);
    const directness = (playerIdx === 0 && this.tactics[teamIdx].playOutOfDefence) ? -1 : mods.directness;
    let best: any = null; let bestScore = -Infinity;
    const counter = this.onCounter(teamIdx);
    const passer = this.teams[teamIdx].players[playerIdx];
    const throughP = clamp(0.5 + 0.16 * directness + (counter ? 0.14 : 0)
      + mAdd(passer.attrs.creativity, 0.12) + (hasTrait(passer, 'maestro') ? 0.05 : 0), 0.25, 0.9);
    for (let i = 0; i < 11; i++) {
      if (i === playerIdx) continue;
      if (this.sentOff.has(teamIdx * 100 + i)) continue;
      const ts = s.players[teamIdx][i];
      const dGoal = Math.hypot(goal.x - ts.x, goal.y - ts.y);
      const dPass = Math.hypot(ts.x - cs.x, ts.y - cs.y);
      if (dPass > 42 || dPass < 3) continue;
      const gain = myDistGoal - dGoal;
      const pressure = this.pressureOn(defTeam, ts);
      const focus = this.tactics[teamIdx].attackFocus;
      const focusBias = focus === 'wide' ? Math.abs(ts.y - 34) * 0.18 : focus === 'central' ? -Math.abs(ts.y - 34) * 0.18 : 0;
      const score = gain * (0.7 + 0.6 * (directness + 1))
        - dPass * (0.2 - directness * 0.1)
        - pressure * 3
        + this.dm[teamIdx][i].magnet
        + focusBias
        + this.rng() * 6;
      const roll = this.rng();                      // ALWAYS drawn -> rng-neutral across variants
      const gGate = gain > (counter ? 14 : 16);
      const rGate = this.teams[teamIdx].players[i].role === 'FW';
      const gate = VAR === 'v0' ? (gGate && rGate) : VAR === 'v1' ? gGate : VAR === 'v2' ? rGate : true;
      const through = gate && roll < throughP;
      if (gain > -6 && score > bestScore) { bestScore = score; best = { idx: i, through }; }
    }
    return best;
  };
  if (VAR !== 'native') (MatchEngine as any).prototype.pickPassTarget = patched;

  const gd: Record<string, number[]> = {}; for (const n of names) gd[n] = [];
  const chances: Record<string, number> = {}; const mt: Record<string, number> = {};
  for (const n of names) { chances[n] = 0; mt[n] = 0; }
  for (const A of names) for (const B of names) {
    if (A === B) continue;
    for (let i = 0; i < N; i++) {
      const e = play(mkEngine(A, B, i));
      gd[A].push(e.state.score[0] - e.state.score[1]);
      gd[B].push(e.state.score[1] - e.state.score[0]);
      mt[A]++; mt[B]++;
      for (const ev of e.state.events) if (ev.type === 'chance') chances[e.__f[ev.teamIdx]]++;
    }
  }
  const rows = names.map((n) => {
    const d = gd[n]; const m = d.reduce((a, b) => a + b, 0) / d.length;
    const sd = Math.sqrt(d.reduce((a, b) => a + (b - m) ** 2, 0) / (d.length - 1));
    return { n, m, ci: 1.96 * sd / Math.sqrt(d.length), k: d.length, ch: chances[n] / mt[n] };
  }).sort((a, b) => b.m - a.m);
  console.log(`VARIANT=${VAR}  n=${rows[0].k} matches/shape`);
  for (const r of rows) console.log(`  ${String(r.n).padEnd(10)} ${r.m >= 0 ? '+' : ''}${r.m.toFixed(3)} +/- ${r.ci.toFixed(3)}   chances/m ${r.ch.toFixed(1)}`);
  console.log(`SPREAD ${VAR} = ${(rows[0].m - rows[rows.length - 1].m).toFixed(3)}`);
}

// ─────────────────────────────────────────────────────────────────────────────────────────
if (MODE === 'prov') {
  // WHERE DO SHOTS ACTUALLY COME FROM? clear-run vs ordinary carry, and how much carrier time
  // each shape spends inside SHOOT_RANGE (30m) at all.
  const origShot = (MatchEngine as any).prototype.resolveShot;
  const origPick = (MatchEngine as any).prototype.pickPassTarget;
  type S = { m: number; shots: number; shotsClear: number; dist: number; inRange: number; carrierTicks: number; nullPick: number; pickTry: number; clearTicks: number; central: number; gf: number };
  const st: Record<string, S> = {};
  for (const n of names) st[n] = { m: 0, shots: 0, shotsClear: 0, dist: 0, inRange: 0, carrierTicks: 0, nullPick: 0, pickTry: 0, clearTicks: 0, central: 0, gf: 0 };

  (MatchEngine as any).prototype.resolveShot = function (teamIdx: 0 | 1, playerIdx: number, distGoal: number, clear: boolean, allowRebound = true) {
    const r = st[this.__f[teamIdx]];
    r.shots++; r.dist += distGoal;
    if (this.clearRun[teamIdx] === playerIdx) r.shotsClear++;
    return origShot.call(this, teamIdx, playerIdx, distGoal, clear, allowRebound);
  };
  (MatchEngine as any).prototype.pickPassTarget = function (teamIdx: 0 | 1, playerIdx: number, goal: any) {
    const r = st[this.__f[teamIdx]]; r.pickTry++;
    const p = origPick.call(this, teamIdx, playerIdx, goal);
    if (!p) r.nullPick++;
    return p;
  };

  for (const A of names) for (const B of names) {
    if (A === B) continue;
    for (let i = 0; i < N; i++) {
      const e: any = mkEngine(A, B, i);
      let g = 0;
      while (!e.state.finished && g++ < 40000) {
        e.tick();
        const c = e.state.carrier;
        if (c) {
          const r = st[e.__f[c.teamIdx]];
          const cs = e.state.players[c.teamIdx][c.playerIdx];
          const goalX = e.attackDir(c.teamIdx) === 1 ? 105 : 0;
          const d = Math.hypot(goalX - cs.x, 34 - cs.y);
          r.carrierTicks++;
          if (d < 30) { r.inRange++; r.central += 1 - Math.abs(cs.y - 34) / 34; }
          if (e.clearRun[c.teamIdx] === c.playerIdx) r.clearTicks++;
        }
      }
      for (const side of [0, 1] as const) { const r = st[e.__f[side]]; r.m++; r.gf += e.state.score[side]; }
    }
  }
  (MatchEngine as any).prototype.resolveShot = origShot;
  (MatchEngine as any).prototype.pickPassTarget = origPick;
  console.log('formation   shots/m  %fromClearRun  meanShotDist  carrierTicks/m  inRange/m  %inRange  clearTicks/m  GF/m  nullPick%');
  for (const F of names) {
    const r = st[F];
    console.log(`${String(F).padEnd(11)} ${(r.shots / r.m).toFixed(2).padStart(7)} ${((100 * r.shotsClear) / Math.max(1, r.shots)).toFixed(1).padStart(13)} ${(r.dist / Math.max(1, r.shots)).toFixed(1).padStart(12)} ${(r.carrierTicks / r.m).toFixed(0).padStart(14)} ${(r.inRange / r.m).toFixed(0).padStart(9)} ${((100 * r.inRange) / Math.max(1, r.carrierTicks)).toFixed(1).padStart(8)} ${(r.clearTicks / r.m).toFixed(0).padStart(12)} ${(r.gf / r.m).toFixed(3).padStart(6)} ${((100 * r.nullPick) / Math.max(1, r.pickTry)).toFixed(1).padStart(9)}`);
  }
}
