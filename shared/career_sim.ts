// Career-sim harness. Validates: (1) different styles → distinct, specialised players + roles;
// (2) skill → magnitude; (3) the turn-by-turn engine is deterministic. Run: `npx tsx career_sim.ts`.
import { Career, simCareer, graduate, seedFrom, rollGenes, inheritGenes, DECK, type Style, type CareerPlayerAttrs, type Role, type Genes } from './src/career.js';

const STYLES: Style[] = [
  { name: 'Poacher',   pref: { composure: 1, flair: 0.8 },        skill: 0.85 },
  { name: 'Enforcer',  pref: { aggression: 1, teamwork: 0.4 },    skill: 0.85 },
  { name: 'Playmaker', pref: { creativity: 1, teamwork: 0.8 },    skill: 0.85 },
  { name: 'Captain',   pref: { leadership: 1, composure: 0.7 },   skill: 0.85 },
  { name: 'Engine',    pref: { stamina: 1, aggression: 0.5 },     skill: 0.85 },
  { name: 'Maverick',  pref: { flair: 1, creativity: 0.8 },       skill: 0.85 },
  { name: 'Enforcer(raw)', pref: { aggression: 1, teamwork: 0.4 }, skill: 0.25 },
];

const KEYS: (keyof CareerPlayerAttrs)[] = ['pace', 'strength', 'stamina', 'passing', 'shooting', 'tackling', 'positioning', 'workrate', 'keeping', 'setPiece', 'composure', 'aggression', 'creativity', 'teamwork', 'leadership'];
const pad = (s: string, n: number) => s.padEnd(n);
const num = (n: number) => String(n).padStart(2);

console.log('\n=== Career Sim — players produced by different play styles ===\n');
console.log(pad('STYLE', 15), 'ROLE OVR  ' + KEYS.map((k) => pad(k.slice(0, 3), 4)).join(''));
const players: Array<{ name: string; role: Role; a: CareerPlayerAttrs; ovr: number }> = [];
for (const style of STYLES) {
  const seed = seedFrom('career', style.name);
  const p = simCareer(seed, style);
  players.push({ name: style.name, role: p.role, a: p.attrs, ovr: p.overall });
  console.log(pad(style.name, 15), pad(p.role, 4), num(p.overall) + '   ' + KEYS.map((k) => pad(num(p.attrs[k]), 4)).join(''));
}

// role spread + top-stat diversity
console.log('\n=== diversity ===');
const core = players.filter((p) => !p.name.includes('raw'));
console.log('roles produced:', core.map((p) => `${p.name}=${p.role}`).join(', '));
const topStat = (a: CareerPlayerAttrs) => KEYS.reduce((b, k) => (a[k] > a[b] ? k : b), KEYS[0]);
console.log('distinct top stats:', new Set(core.map((p) => topStat(p.a))).size, 'of', core.length, '->', [...new Set(core.map((p) => topStat(p.a)))].join(', '));
const dist = (a: CareerPlayerAttrs, b: CareerPlayerAttrs) => Math.round(Math.sqrt(KEYS.reduce((s, k) => s + (a[k] - b[k]) ** 2, 0)));
let minD = Infinity;
for (let i = 0; i < core.length; i++) for (let j = i + 1; j < core.length; j++) minD = Math.min(minD, dist(core[i].a, core[j].a));
console.log('closest pair distance:', minD, '(want comfortably > 0 — no near-clones)');

// magnitude: same style, high vs low skill — AVERAGED over many seeds (single careers are noisy)
const avgOvr = (skill: number) => {
  let sum = 0; const N = 60;
  for (let s = 0; s < N; s++) sum += simCareer(seedFrom('mag', skill, s), { name: 'x', pref: { aggression: 1, teamwork: 0.4 }, skill }).overall;
  return (sum / N).toFixed(1);
};
console.log('\n=== magnitude — avg overall over 60 careers by skill (Enforcer style) ===');
console.log(`  skill .90 → ${avgOvr(0.9)}   .60 → ${avgOvr(0.6)}   .30 → ${avgOvr(0.3)}   (should decrease with skill)`);

// hybrid model: identical pacey career, fast vs slow PACE genes → different realised pace (capped)
console.log('\n=== hybrid model — genes cap the innate physical stats ===');
const pacey: Style = { name: 'Flyer', pref: { stamina: 1, flair: 1 }, skill: 0.85 };
const fastGenes: Genes = { pace: { floor: 12, ceiling: 20 }, strength: { floor: 6, ceiling: 12 }, stamina: { floor: 10, ceiling: 18 } };
const slowGenes: Genes = { pace: { floor: 3, ceiling: 9 }, strength: { floor: 6, ceiling: 12 }, stamina: { floor: 4, ceiling: 10 } };
const fast = simCareer(seedFrom('flyer'), pacey, fastGenes);
const slow = simCareer(seedFrom('flyer'), pacey, slowGenes);
console.log(`  same pacey career — fast genes → pace ${fast.attrs.pace}, slow genes → pace ${slow.attrs.pace}  (a slow seed can't grind pace)`);
console.log(`  meanwhile developed stats match (creativity ${fast.attrs.creativity} vs ${slow.attrs.creativity}) — technique isn't gene-capped`);

// lineage: a "son" inherits physical genes as a biased roll (not a copy)
console.log('\n=== lineage — son inherits physical genes (biased, not copied) ===');
const parentGenes = rollGenes(seedFrom('parent'));
const son = inheritGenes(parentGenes, seedFrom('son'), 0.6);
console.log(`  parent pace band [${parentGenes.pace.floor}-${parentGenes.pace.ceiling}]  →  son pace band [${son.pace.floor}-${son.pace.ceiling}]  (near, regressed, re-rolled)`);

// determinism: same seed + same choices → identical player
console.log('\n=== determinism check ===');
const replay = (seed: number) => { const c = new Career(seed); const ids: string[] = []; while (!c.finished) { const id = c.current().hand[0].id; ids.push(id); c.play(id); } return { player: graduate(c.log, seed), ids }; };
const r1 = replay(999), r2 = replay(999);
const same = JSON.stringify(r1.player) === JSON.stringify(r2.player) && r1.ids.join() === r2.ids.join();
console.log('  same seed + same choices → identical player:', same);

// a peek at one real turn (what the client will render)
console.log('\n=== sample opening turn (seed 999) ===');
const c = new Career(999);
const { season, turn, scenario, hand } = c.current();
console.log(`  Season ${season}, turn ${turn + 1} — ${scenario.label}`);
console.log('  hand:', hand.map((h) => `${h.name} [${h.tags.join('/')}]`).join('  |  '));
console.log(`  deck size: ${DECK.length} cards, hand ${hand.length}\n`);
