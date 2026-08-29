// The manager arc library. Target 800+ arcs: they fire 4-6 a season, so a ~10-season career sees ~50 and a
// five-generation dynasty ~250 — the library must be several times that to stay fresh. Validates shape,
// reachability and coverage, because an arc that can never fire is worse than one that does not exist.
import { MANAGER_ARCS, arcFits, pickManagerArc, type MgrSituation } from '../../shared/src/managerarc.js';

let errors = 0;
const fail = (m: string) => { console.log(`  FAIL ${m}`); errors++; };
const ids = new Set<string>();
for (const a of MANAGER_ARCS) {
  if (ids.has(a.id)) fail(`duplicate id ${a.id}`); else ids.add(a.id);
  if (!a.beats[a.first]) fail(`${a.id}: first beat '${a.first}' does not exist`);
  for (const [bid, b] of Object.entries(a.beats)) {
    if (!b.choices?.length) fail(`${a.id}.${bid}: no choices`);
    for (const c of b.choices ?? []) {
      if (c.next && !a.beats[c.next]) fail(`${a.id}.${bid}.${c.id}: next '${c.next}' does not exist`);
      if (!c.outcome) fail(`${a.id}.${bid}.${c.id}: no outcome`);
    }
  }
}
const cats = new Map<string, number>();
for (const a of MANAGER_ARCS) cats.set(a.category, (cats.get(a.category) ?? 0) + 1);

// REACHABILITY: simulate careers across a spread of situations and see what actually fires. The sample is
// deliberately large (2000 careers, ~120k draws): a marginal arc — three stacked gates plus `rare` — can
// miss a smaller sample by luck, and then "fix" it only to expose the next marginal one. A wide sample
// answers the real question, which is whether an arc is IMPOSSIBLE or merely uncommon.
const seen = new Set<string>();
let firedTotal = 0;
for (let career = 0; career < 2000; career++) {
  const fired = new Set<string>();
  for (let season = 1; season <= 12; season++) {
    const s: MgrSituation = {
      season, tier: 1 + ((career + season) % 9),
      posFrac: ((career * 7 + season * 13) % 100) / 100,
      coins: (career * 137 + season * 91) % 1200,
      hasWonderkid: (career + season) % 3 === 0,
      hasVeteran: (career + season) % 2 === 0,
      hasUnhappy: (career + season) % 4 === 0,
      squadSize: 14 + ((career + season) % 9),
      tags: new Set<string>(),
      temper: (['disciplinarian','players-manager','tactician','chancer','builder','firefighter'] as const)[career % 6],
    };
    for (let k = 0; k < 5; k++) {          // 4-6 arcs a season
      const id = pickManagerArc(career * 7919 + k * 31, s, fired);
      if (id) { fired.add(id); seen.add(id); firedTotal++; }
    }
  }
}
const unreachable = MANAGER_ARCS.filter((a) => !seen.has(a.id));
console.log(`=== Manager arcs — ${MANAGER_ARCS.length} arcs (target 800+) ===`);
console.log('  by category: ' + [...cats.entries()].sort().map(([c, n]) => `${c} ${n}`).join(' · '));
console.log(`  reachability: ${seen.size}/${MANAGER_ARCS.length} fired across 2000 simulated careers`);
if (unreachable.length) console.log('  never fires: ' + unreachable.slice(0, 8).map((a) => a.id).join(', ') + (unreachable.length > 8 ? ` (+${unreachable.length - 8})` : ''));
const perCareer = firedTotal / 2000;
console.log(`  arcs per career: ${perCareer.toFixed(1)} (a ~10-season career should see ~50)`);

const checks: Array<[string, boolean, string]> = [
  ['every arc is structurally valid', errors === 0, `${errors} error(s)`],
  ['every arc can actually fire', unreachable.length === 0, `${unreachable.length} unreachable`],
  ['a career sees enough of them', perCareer >= 30, perCareer.toFixed(1)],
];
console.log('\n=== verdict ===');
let f = 0;
for (const [n, ok, v] of checks) { console.log(`  ${ok ? 'OK  ' : 'FLAG'} ${n}  (${v})`); if (!ok) f++; }
console.log(f ? `\n⚠ ${f} problem(s)` : `\n✓ the manager arc library is healthy`);
if (f) process.exitCode = 1;
