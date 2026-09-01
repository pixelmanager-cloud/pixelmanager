// LENS: does the ATTRIBUTION null actually VARY WITH STRIKER COUNT?
// Arms differ ONLY in the rollAttrs bias table; team seeds + match seeds are IDENTICAL across arms
// (paired), so arm-to-arm differences are not sampling noise in the shape means.
import { MatchEngine } from '../../shared/src/engine.js';
import { DEFAULT_TACTICS } from '../../shared/src/tactics.js';
import { makeRng } from '../../shared/src/rng.js';
import { FORMATIONS, type Formation } from '../../shared/src/formations.js';
import { defaultDuty } from '../../shared/src/duties.js';
import type { Player, PlayerAttrs, Role, Team } from '../../shared/src/types.js';

const STATS = ['pace','strength','passing','shooting','tackling','positioning','workrate','keeping','setPiece','stamina'] as const;
type Bias = Record<Role, number[]>;
// EXACT copy of shared/src/teams.ts rollAttrs, in object-literal (= rng draw) order.
const REAL: Bias = {
  GK: [-4,-1,-3,-8,-6, 2,-2, 6,-6,-3],
  DF: [ 0, 2,-1,-5, 4, 3, 1,-10,-2, 1],
  MF: [ 1, 0, 3, 0, 0, 1, 3,-10, 2, 3],
  FW: [ 3, 1, 0, 4,-4, 2, 0,-10, 2, 1],
};
const clone = (b: Bias): Bias => ({ GK: [...b.GK], DF: [...b.DF], MF: [...b.MF], FW: [...b.FW] });
// B: the forward keeps his ANCHOR but is given the MIDFIELDER's statline.
const FW_AS_MF = clone(REAL); FW_AS_MF.FW = [...REAL.MF];
// C: full outfield neutralisation (the claim's counterfactual) — every outfield bias 0 except keeping.
const FLAT = clone(REAL);
for (const r of ['DF','MF','FW'] as Role[]) FLAT[r] = [0,0,0,0,0,0,0,-10,0,0];
// D: SCALE CONTROL. Real role contrasts intact; every outfielder's shooting cut by the same 4 points.
// Lowers goals/match without touching any role DIFFERENCE, so it tests the "spread per goal/match"
// normalisation that the 16% headline rests on.
const SHOOT_DOWN = clone(REAL);
for (const r of ['DF','MF','FW'] as Role[]) SHOOT_DOWN[r][3] -= 4;

const ARMS: Record<string, Bias> = { A_baseline: REAL, B_fw_as_mf: FW_AS_MF, C_flat_outfield: FLAT, D_shoot_minus4: SHOOT_DOWN };

const FIRST = ['Jan','Marco','Luis','Kofi','Sven','Timo','Ade','Ivan','Paulo','Ryo','Emil','Noah','Idris','Beto','Cato','Dario','Enzo','Felix'];
const LAST  = ['Berg','Silva','Okafor','Larsen','Costa','Novak','Tanaka','Mensah','Weber','Rossi','Dubois','Kovac','Moreau','Santos','Vidal','Haas','Ito','Zeman'];

// mirrors generateTeam's rng stream exactly (2 name draws + 10 stat draws per slot)
function mkTeam(id: string, quality: number, seed: number, formation: Formation, bias: Bias): Team {
  const rng = makeRng(seed);
  const slots = FORMATIONS[formation];
  const players: Player[] = slots.map((slot, i) => {
    const name = `${FIRST[Math.floor(rng() * FIRST.length)]} ${LAST[Math.floor(rng() * LAST.length)]}`;
    const row = bias[slot.role];
    const attrs = {} as PlayerAttrs;
    for (let k = 0; k < STATS.length; k++) {
      (attrs as any)[STATS[k]] = Math.max(1, Math.min(20, Math.round(quality + row[k] + (rng() - 0.5) * 6)));
    }
    return { id: `${id}-${i}`, name, role: slot.role, attrs, anchor: { x: slot.x, y: slot.y } };
  });
  return { id, name: id, shirtColor: 0x445566, players };
}

const F = Object.keys(FORMATIONS) as Formation[];
const NFW: Record<string, number> = {};
for (const f of F) NFW[f] = FORMATIONS[f].filter((s) => s.role === 'FW').length;

const N = Number(process.env.N ?? 24);
const armName = process.argv[2];
const bias = ARMS[armName];
if (!bias) throw new Error('arm?');

const gd: Record<string, number[]> = {}; for (const f of F) gd[f] = [];
const duties: Record<string, number> = {};
let totGoals = 0, matches = 0;
const pairGD: Record<string, number> = {};

for (let ai = 0; ai < F.length; ai++) {
  for (let bi = 0; bi < F.length; bi++) {
    if (ai === bi) continue;
    const fh = F[ai], fa = F[bi];
    let sum = 0;
    for (let m = 0; m < N; m++) {
      // seeds depend ONLY on (fh, fa, m) — identical in every arm
      const sh = (ai * 1000003 + bi * 7919 + m * 104729 + 11) >>> 0;
      const sa = (bi * 1000003 + ai * 7919 + m * 104729 + 977) >>> 0;
      const H = mkTeam('H', 12, sh, fh, bias);
      const A = mkTeam('A', 12, sa, fa, bias);
      if (matches < 220) for (const p of H.players) duties[`${p.role}:${defaultDuty(p)}`] = (duties[`${p.role}:${defaultDuty(p)}`] ?? 0) + 1;
      const e = new MatchEngine([H, A], (ai * 31 + bi * 131 + m * 7 + 5) >>> 0, [DEFAULT_TACTICS, DEFAULT_TACTICS]);
      while (!e.state.finished) e.tick();
      const d = e.state.score[0] - e.state.score[1];
      gd[fh].push(d); gd[fa].push(-d);
      sum += d;
      totGoals += e.state.score[0] + e.state.score[1]; matches++;
    }
    pairGD[`${fh}|${fa}`] = sum / N;
  }
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs: number[]) => { const m = mean(xs); return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)); };
const rows = F.map((f) => ({ f, n: gd[f].length, nfw: NFW[f], m: mean(gd[f]), se: sd(gd[f]) / Math.sqrt(gd[f].length) }));
rows.sort((a, b) => b.m - a.m);
console.log(`\n===== ARM ${armName}   matches=${matches}  goals/match=${(totGoals / matches).toFixed(3)}  N/pair=${N} =====`);
for (const r of rows) console.log(`  ${r.f.padEnd(10)} nFW=${r.nfw}  GD=${r.m >= 0 ? '+' : ''}${r.m.toFixed(3)}  +-${(1.96 * r.se).toFixed(3)}  (n=${r.n})`);
const spread = rows[0].m - rows[rows.length - 1].m;
const g1 = rows.filter((r) => r.nfw === 1), g2 = rows.filter((r) => r.nfw === 2), g3 = rows.filter((r) => r.nfw === 3);
const gm = (g: typeof rows) => mean(g.map((r) => r.m));
console.log(`  SPREAD          ${spread.toFixed(3)}   (per goal/match ${(spread / (totGoals / matches)).toFixed(4)})`);
console.log(`  mean GD  1FW=${gm(g1).toFixed(3)}  2FW=${gm(g2).toFixed(3)}  3FW=${gm(g3).toFixed(3)}`);
const contrast = gm(g1) - gm(g2);
console.log(`  STRIKER CONTRAST (1FW - 2FW) = ${contrast.toFixed(3)}   (per goal/match ${(contrast / (totGoals / matches)).toFixed(4)})`);
// pooled se for the contrast, from the per-shape ses
const sePool = Math.sqrt(g1.reduce((a, r) => a + (r.se / g1.length) ** 2, 0) + g2.reduce((a, r) => a + (r.se / g2.length) ** 2, 0));
console.log(`  contrast 95% CI  +-${(1.96 * sePool).toFixed(3)}`);
// head-to-head only: every 1FW shape vs every 2FW shape, both venues (no third-party shapes involved)
let h2h = 0, h2hN = 0;
for (const a of F) for (const b of F) { if (a === b) continue; if (NFW[a] === 1 && NFW[b] === 2) { h2h += pairGD[`${a}|${b}`]; h2h -= pairGD[`${b}|${a}`]; h2hN += 2; } }
console.log(`  1FW-vs-2FW HEAD-TO-HEAD ONLY (both venues, ${h2hN} ordered pairs) = ${(h2h / h2hN).toFixed(3)}`);
console.log('  duty mix (first 220 home XIs):', JSON.stringify(duties));
