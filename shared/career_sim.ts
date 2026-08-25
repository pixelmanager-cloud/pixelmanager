// Career-sim harness. Validates: (1) different styles → distinct, specialised players + roles;
// (2) skill → magnitude; (3) the turn-by-turn engine is deterministic. Run: `npx tsx career_sim.ts`.
import { Career, simCareer, graduate, seedFrom, rollGenes, inheritGenes, mulberry32, TAGS, DECK, STARTER_DECK, cardPower, type Style, type CareerPlayerAttrs, type Role, type Genes } from './src/career.js';

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
console.log(pad('STYLE', 15), 'ROLE OVR  ' + KEYS.map((k) => pad(k.slice(0, 3), 4)).join('') + ' TRAITS');
const players: Array<{ name: string; role: Role; a: CareerPlayerAttrs; ovr: number }> = [];
for (const style of STYLES) {
  const seed = seedFrom('career', style.name);
  const p = simCareer(seed, style);
  players.push({ name: style.name, role: p.role, a: p.attrs, ovr: p.overall });
  console.log(pad(style.name, 15), pad(p.role, 4), num(p.overall) + '   ' + KEYS.map((k) => pad(num(p.attrs[k]), 4)).join('') + ' ' + (p.traits.join(', ') || '—'));
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

// GK track: a goalkeeper career produces a keeper
console.log('\n=== goalkeeper track ===');
const gk = simCareer(seedFrom('keeper1'), { name: 'GK', pref: { keeping: 1, composure: 0.7, leadership: 0.5 }, skill: 0.85 }, undefined, 'goalkeeper');
console.log(`  role=${gk.role} ovr=${gk.overall} — keeping ${gk.attrs.keeping}, positioning ${gk.attrs.positioning}, composure ${gk.attrs.composure}, shooting ${gk.attrs.shooting}`);

// design space + role balance (sampling random careers)
console.log('\n=== design space + role balance (sampling random careers) ===');
const OUT = TAGS.filter((t) => t !== 'keeping');
const SIG: (keyof CareerPlayerAttrs)[] = ['shooting', 'passing', 'tackling', 'pace', 'creativity', 'composure', 'aggression', 'leadership', 'stamina', 'teamwork', 'keeping'];
const N = 12000;
const arche = new Set<string>();
const fine = new Set<string>();
const roles: Record<string, number> = {};
const geneTier = (ceil: number) => (ceil <= 9 ? 'L' : ceil <= 14 ? 'M' : 'H');
for (let i = 0; i < N; i++) {
  const rng = mulberry32(seedFrom('space', i));
  const goalkeeper = rng() < 0.12;                              // ~1 in 8 players choose the GK track
  const pool = goalkeeper ? (['keeping'] as typeof OUT) : OUT;
  const pref: Partial<Record<typeof TAGS[number], number>> = {};
  if (goalkeeper) { pref.keeping = 1; pref.composure = rng() * 0.6; pref.leadership = rng() * 0.6; }
  else for (const t of pool) if (rng() < 0.5) pref[t] = rng();
  const p = simCareer(seedFrom('space', i), { name: 'x', pref, skill: 0.3 + rng() * 0.6 }, undefined, goalkeeper ? 'goalkeeper' : 'outfield');
  const top2 = SIG.map((s) => [s, p.attrs[s]] as const).sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]).sort().join('+');
  const a = `${p.role}:${top2}`;
  arche.add(a);
  fine.add(`${a}|${geneTier(p.genes.pace.ceiling)}${geneTier(p.genes.strength.ceiling)}${geneTier(p.genes.stamina.ceiling)}`);
  roles[p.role] = (roles[p.role] ?? 0) + 1;
}
const pct = (r: string) => `${Math.round((roles[r] ?? 0) / N * 100)}%`;
console.log(`  role spread: GK ${pct('GK')}  DF ${pct('DF')}  MF ${pct('MF')}  FW ${pct('FW')}  (outfield DF/MF/FW should be roughly balanced)`);
// trait distribution
const traitCount: Record<string, number> = {}; let withTrait = 0;
for (let i = 0; i < N; i++) {
  const rng = mulberry32(seedFrom('space', i));
  const goalkeeper = rng() < 0.12;
  const pref: any = {};
  if (goalkeeper) { pref.keeping = 1; pref.composure = rng() * 0.6; pref.leadership = rng() * 0.6; }
  else for (const t of OUT) if (rng() < 0.5) pref[t] = rng();
  const p = simCareer(seedFrom('space', i), { name: 'x', pref, skill: 0.3 + rng() * 0.6 }, undefined, goalkeeper ? 'goalkeeper' : 'outfield');
  if (p.traits.length) withTrait++;
  for (const t of p.traits) traitCount[t] = (traitCount[t] ?? 0) + 1;
}
console.log(`  players with ≥1 trait: ${Math.round(withTrait / N * 100)}%  |  trait spread:`, Object.fromEntries(Object.entries(traitCount).map(([k, v]) => [k, `${Math.round(v / N * 100)}%`])));
console.log(`  playstyle archetypes (role + top-2 identity stats): ${arche.size}`);
console.log(`  × physical gene tiers (L/M/H per innate): ${fine.size} meaningfully-distinct types`);
console.log(`  (raw distinct players are effectively unbounded: fine gene bands + per-stat seeded noise → every mint is unique)`);

// deck-building: a career drafts its identity between seasons
console.log('\n=== deck-building — drafts grow your deck (pick first offer for the demo) ===');
{
  const dc = new Career(seedFrom('drafter'));
  const offers: string[][] = [];
  while (!dc.finished) {
    const st = dc.current();
    if (st.phase === 'draft') { offers.push(st.options.map((o) => `${o.name}${o.rarity && o.rarity !== 'common' ? ` (${o.rarity})` : ''}`)); dc.draft(st.options[0].id); }
    else dc.play(st.hand[0].id);
  }
  console.log(`  starting deck (${STARTER_DECK.length}):`, STARTER_DECK.map((c) => c.name).join(', '));
  offers.forEach((o, i) => console.log(`  draft ${i + 1} offered:`, o.join('  |  ')));
  console.log(`  final deck (${dc.deck.length}):`, dc.deck.map((c) => c.name + (cardPower(c) > 1 ? `*${cardPower(c)}` : '')).join(', '));
}

// determinism: same seed + same choices (play + draft) → identical player
console.log('\n=== determinism check ===');
const replay = (seed: number) => {
  const c = new Career(seed); const ids: string[] = [];
  while (!c.finished) { const st = c.current(); if (st.phase === 'draft') { ids.push('D:' + st.options[0].id); c.draft(st.options[0].id); } else { ids.push(st.hand[0].id); c.play(st.hand[0].id); } }
  return { player: graduate(c.log, seed), ids };
};
const r1 = replay(999), r2 = replay(999);
console.log('  same seed + same choices → identical player:', JSON.stringify(r1.player) === JSON.stringify(r2.player) && r1.ids.join() === r2.ids.join());
