// MEASUREMENT LENS — adversarial re-derivation of the "formation gradient is not a harness artifact" null.
// CONDition via env COND: base | norole | flat | gk20 . N via env FN.
import { MatchEngine, generateTeam, autoPickXI, buildXI, DEFAULT_TACTICS, FORMATIONS } from '@fm/shared';

const names = Object.keys(FORMATIONS) as any[];
const N = Number(process.env.FN ?? 40);
const COND = process.env.COND ?? 'base';

// rollAttrs' role bias table, copied from teams.ts:19-21 (integers, so subtraction is exact:
// round(q+bias+jit) - bias === round(q+jit) for integer bias).
const BIAS: Record<string, Record<string, number>> = {
  DF: { pace: 0, strength: 2, passing: -1, shooting: -5, tackling: 4, positioning: 3, workrate: 1, keeping: -10, setPiece: -2, stamina: 1 },
  MF: { pace: 1, strength: 0, passing: 3, shooting: 0, tackling: 0, positioning: 1, workrate: 3, keeping: -10, setPiece: 2, stamina: 3 },
  FW: { pace: 3, strength: 1, passing: 0, shooting: 4, tackling: -4, positioning: 2, workrate: 0, keeping: -10, setPiece: 2, stamina: 1 },
};
const KEYS = ['pace','strength','passing','shooting','tackling','positioning','workrate','keeping','setPiece','stamina'];

function doctor(t: any) {
  for (const p of t.players) {
    if (p.role === 'GK') { if (COND === 'gk20') p.attrs.keeping = 20; continue; }
    if (COND === 'norole') { const b = BIAS[p.role]; for (const k of KEYS) p.attrs[k] = k === 'keeping' ? 2 : p.attrs[k] - b[k]; }
    else if (COND === 'flat') { for (const k of KEYS) p.attrs[k] = k === 'keeping' ? 2 : 12; }
  }
  return t;
}
const mk = (id: string, sd: number, f: any) => { const t: any = doctor(generateTeam(id, id, 0xff0000, 12, sd, f)); return buildXI(t, autoPickXI(t, f)); };

const gdFor: Record<string, number[]> = {};
const ptsFor: Record<string, number[]> = {};
for (const n of names) { gdFor[n] = []; ptsFor[n] = []; }
// pairwise ordered matrix: pm[A][B] = mean GD for A when A is HOME vs B
const pm: Record<string, Record<string, number>> = {};
for (const n of names) pm[n] = {};
let totGoals = 0, totMatches = 0;

for (const A of names) for (const B of names) {
  if (A === B) continue;
  let sum = 0;
  for (let i = 0; i < N; i++) {
    const e: any = new MatchEngine([mk('a', i * 7 + 1, A), mk('b', i * 11 + 3, B)], i * 31 + 5,
      [{ ...DEFAULT_TACTICS, formation: A }, { ...DEFAULT_TACTICS, formation: B }]);
    let g = 0; while (!e.state.finished && g++ < 40000) e.tick();
    const d = e.state.score[0] - e.state.score[1];
    gdFor[A].push(d); gdFor[B].push(-d);
    ptsFor[A].push(d > 0 ? 3 : d === 0 ? 1 : 0); ptsFor[B].push(d < 0 ? 3 : d === 0 ? 1 : 0);
    sum += d; totGoals += e.state.score[0] + e.state.score[1]; totMatches++;
  }
  pm[A][B] = sum / N;
}

const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
const rows = names.map((n) => {
  const d = gdFor[n]; const m = mean(d);
  const sd = Math.sqrt(d.reduce((a, b) => a + (b - m) ** 2, 0) / (d.length - 1));
  return { n, m, p: mean(ptsFor[n]), ci: 1.96 * sd / Math.sqrt(d.length), k: d.length };
}).sort((a, b) => b.m - a.m);

console.log(`COND=${COND} N=${N} matches=${totMatches} goals/match=${(totGoals / totMatches).toFixed(3)} (n=${rows[0].k} records/shape)`);
for (const r of rows) console.log(`  ${String(r.n).padEnd(10)} GD ${r.m >= 0 ? '+' : ''}${r.m.toFixed(3)} +/-${r.ci.toFixed(3)}   pts/m ${r.p.toFixed(3)}`);
const gdSpread = rows[0].m - rows[rows.length - 1].m;
const ptsSpread = Math.max(...rows.map(r => r.p)) - Math.min(...rows.map(r => r.p));
console.log(`  GD spread ${gdSpread.toFixed(3)}   PTS spread ${ptsSpread.toFixed(3)}   goals/match ${(totGoals / totMatches).toFixed(3)}`);

// ── SELF-EXCLUSION: the round-robin field-mean is NOT the latent strength. Under GD_ij = s_i - s_j,
// field-mean_i = s_i * n/(n-1) - S/(n-1). Fit s by least squares (= field-mean * (n-1)/n) and report
// how much of the headline spread is pure round-robin scaling, plus how well the additive model fits.
const n = names.length;
const fm: Record<string, number> = {}; for (const r of rows) fm[r.n] = r.m;
const s: Record<string, number> = {}; for (const k of names) s[k] = fm[k] * (n - 1) / n;
const sv = names.map(k => s[k]);
console.log(`  latent-strength spread (self-exclusion corrected) ${(Math.max(...sv) - Math.min(...sv)).toFixed(3)}  -> headline overstates by ${(((Math.max(...sv.map(x=>x)) ? 1 : 1) * (gdSpread / (Math.max(...sv) - Math.min(...sv)) - 1)) * 100).toFixed(1)}%`);
// additive-model fit quality on the ordered pairwise matrix (venue-averaged so home advantage cancels)
let ss = 0, sr = 0, cnt = 0; const vals: number[] = [];
for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
  const A = names[i], B = names[j];
  const obs = (pm[A][B] - pm[B][A]) / 2;      // venue-balanced observed edge of A over B
  const pred = s[A] - s[B];
  vals.push(obs); sr += (obs - pred) ** 2; cnt++;
}
const mv = mean(vals); for (const v of vals) ss += (v - mv) ** 2;
console.log(`  additive model fit over ${cnt} venue-balanced pairings: R2=${(1 - sr / ss).toFixed(3)}  rmse=${Math.sqrt(sr / cnt).toFixed(3)}`);
