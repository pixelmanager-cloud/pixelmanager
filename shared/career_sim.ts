// Career-sim harness. Validates: (1) different styles → distinct, specialised players + roles;
// (2) skill → magnitude; (3) the turn-by-turn engine is deterministic. Run: `npx tsx career_sim.ts`.
import { Career, simCareer, graduate, careerOverall, prospectValuation, contractCost, contractLength, releaseClause, legacyBoost, AGENTS, seedFrom, rollGenes, inheritGenes, mulberry32, TAGS, DECK, STARTER_DECK, cardPower, type Style, type CareerPlayerAttrs, type Role, type Genes, type PlayerAchievements, type Tag } from './src/career.js';

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
  console.log(pad(style.name, 15), pad(p.role, 4), num(p.overall) + '   ' + KEYS.map((k) => pad(num(p.attrs[k]), 4)).join('') + ' ' + [p.personality, ...p.traits].join(', '));
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

// ── THIS FILE ASSERTED NOTHING FOR 126 SECONDS OF EVERY `npm run verify` ─────────────────────────────
// It printed eight verdict-shaped lines — "should decrease with skill", "big-game should be higher",
// "graduates the SAME player", "identical player: true" — and exited 0 whichever way they read. A mutation
// made `graduate()` non-deterministic; it printed `identical player: false` and `graduates the SAME
// player: false` and the build was green. `grep -c 'process.exit|exitCode|throw'` returned 0.
//
// The two determinism claims are not decoration: the entire save format is (career_seed, actions[]) replayed
// through this code, so "same seed and choices gives the same player" is the contract every save depends on.
let simFailures = 0;
const simCheck = (ok: boolean, msg: string) => {
  if (ok) console.log(`  ok   ${msg}`);
  else { console.log(`  FAIL ${msg}`); simFailures++; }
};

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

// reborn: a decorated father's TEAM achievements (not personal tallies) pass pedigree to the son
console.log('\n=== reborn — team-achievement pedigree carries into the next generation ===');
{
  const dad = rollGenes(seedFrom('dynasty'));
  const legend: PlayerAchievements = { seasons: 14, apps: 380, leagueTitles: 6, cupTitles: 3, promotions: 2, highestTierIdx: 8 };
  const journey: PlayerAchievements = { seasons: 9, apps: 150, leagueTitles: 0, cupTitles: 0, promotions: 1, highestTierIdx: 2 };
  const breed = (ach: PlayerAchievements) => {
    const b = legacyBoost(ach);
    const sonGenes = inheritGenes(dad, seedFrom('heir'), 0.6, b.ceilingLift);   // pedigree lifts physical ceilings
    // identical development (same seed + policy) so the ONLY difference is the inherited pedigree
    const c = new Career(seedFrom('heir-career'), 'outfield', 'loyal');
    while (!c.finished) { const st = c.current(); st.phase === 'arc' ? c.resolveArc((st as any).arc.choices[0].id) : st.phase === 'focus' ? c.chooseFocus(st.focus[0].id) : st.phase === 'offer' ? c.resolveOffer(st.offers[0].id) : st.phase === 'coach' ? c.appointCoach(st.coaches[0].id) : st.phase === 'draft' ? c.draft(st.options[0].id) : c.play(st.hand[0].id); }
    const p = graduate(c.log, seedFrom('heir-career'), sonGenes, undefined, { ...c.finContext(), legacyBonus: b.devBonus });
    return { b, p };
  };
  for (const [label, ach] of [['legend father', legend], ['journeyman father', journey]] as const) {
    const { b, p } = breed(ach);
    console.log(`  ${label.padEnd(18)} pedigree ${b.pedigree.toFixed(2)} · ceiling+${b.ceilingLift} → son pace-ceiling ${p.genes.pace.ceiling} · leadership ${p.attrs.leadership} composure ${p.attrs.composure} · ovr ${p.overall}  (${b.note})`);
  }
  console.log('  → position-neutral: a decorated centre-back or keeper breeds the same pedigree as a striker (team trophies, not goals)');
}

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
  const pool: readonly Tag[] = goalkeeper ? (['keeping'] as Tag[]) : OUT;
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
const share = (r: string) => (roles[r] ?? 0) / N;
console.log(`  role spread: GK ${pct('GK')}  DF ${pct('DF')}  MF ${pct('MF')}  FW ${pct('FW')}  (NOT balanced — FW-heavy; see the reachability note below)`);

// ── ROLE REACHABILITY — which is a different defect from role BALANCE ─────────────────────────────────
// The spread above is not balanced, and this line used to claim it "should be roughly balanced" while the
// note at the bottom of this file admitted it isn't. The imbalance is a known open design item (the
// `deriveStats` normaliser) logged for CK, and it stays deliberately unasserted: a tuning question does
// not belong in a red build.
//
// Reachability does. A mutation restricting `deriveRole` to ['DF','FW'] — so that no career in the game
// could ever graduate a midfielder — printed `MF 0%` into this very line and exited 0. A probe that
// reports a real defect into scrollback with no failure path is not a gate, it is a log. The floor is 2%,
// well under the measured MF share of 6% (about 720 of 12,000 careers), so ordinary tuning drift will not
// trip it while a role going unreachable trips it at once.
for (const r of ['GK', 'DF', 'MF', 'FW']) {
  simCheck(share(r) >= 0.02, `${r} is still a reachable role (${pct(r)} of ${N} careers, floor 2%)`);
}
simCheck(share('FW') <= 0.75, `no single role has eaten the game (FW ${pct('FW')}, ceiling 75%)`);
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
  const coaches: string[] = [];
  while (!dc.finished) {
    const st = dc.current();
    if (st.phase === 'arc') { dc.resolveArc((st as any).arc.choices[0].id); continue; } if (st.phase === 'focus') { dc.chooseFocus(st.focus[0].id); continue; }
    if (st.phase === 'offer') { dc.resolveOffer(st.offers[0].id); continue; }
    if (st.phase === 'coach') { coaches.push(st.coaches[0].name); dc.appointCoach(st.coaches[0].id); }
    else if (st.phase === 'draft') { offers.push(st.options.map((o) => `${o.name}${o.rarity && o.rarity !== 'common' ? ` (${o.rarity})` : ''}`)); dc.draft(st.options[0].id); }
    else dc.play(st.hand[0].id);
  }
  console.log(`  starting deck (${STARTER_DECK.length}):`, STARTER_DECK.map((c) => c.name).join(', '));
  console.log('  coaches appointed:', coaches.join(', '));
  offers.forEach((o, i) => console.log(`  draft ${i + 1} offered:`, o.join('  |  ')));
  console.log(`  final deck (${dc.deck.length}):`, dc.deck.map((c) => c.name + (cardPower(c) > 1 ? `*${cardPower(c)}` : '')).join(', '));
}

// a life: age chapters, events, big moments over one development (age 10→25)
console.log('\n=== a development life (age 10→25, seed arc) ===');
{
  const c = new Career(seedFrom('arc'));
  const chapters: string[] = [];
  let big = 0, huge = 0, bigWins = 0, lastChapter = '';
  while (!c.finished) {
    const st = c.current();
    if (st.phase === 'arc') { c.resolveArc((st as any).arc.choices[0].id); continue; } if (st.phase === 'focus') { c.chooseFocus(st.focus[0].id); continue; }
    if (st.phase === 'offer') { c.resolveOffer(st.offers[0].id); continue; } if (st.phase === 'coach') { c.appointCoach(st.coaches[0].id); continue; }
    if (st.phase === 'draft') { c.draft(st.options[0].id); continue; }
    if (st.chapter !== lastChapter) { lastChapter = st.chapter; chapters.push(`age ${st.age} — ${st.chapter}${c.coach ? ` · coach: ${c.coach.name}` : ''}${c.seasonEvent ? `  ·  ${c.seasonEvent.name}` : ''}`); }
    if (st.scenario.stakes === 3) huge++; else if (st.scenario.stakes === 2) big++;
    const ch = c.play(st.hand[0].id);
    if (ch.stakes >= 2 && ch.success >= 0.75) bigWins++;
  }
  const p = graduate(c.log, seedFrom('arc'), undefined, undefined, c.finContext());
  chapters.forEach((e) => console.log('  ' + e));
  console.log(`  big moments faced: ${big} big + ${huge} huge  |  delivered in ${bigWins}  |  serious injuries: ${c.seriousInjuries}`);
  console.log(`  graduates at 25 (PRIME): ${p.role} ovr ${p.overall}, durability ${p.attrs.durability}, ${p.personality}${p.traits.length ? ', ' + p.traits.join(', ') : ''}`);

}

// personality: temperament changes how the SAME big moments play out
console.log('\n=== personality — same big moments, different temperament ===');
{
  // find seeds that roll each personality, then measure success in high-stakes moments
  const bigGameAvg = (persId: string) => {
    let sum = 0, n = 0, found = 0;
    for (let i = 0; found < 40 && i < 20000; i++) {
      const c = new Career(seedFrom('pers', i));
      if (c.personality.id !== persId) continue; found++;
      while (!c.finished) { const st = c.current(); if (st.phase === 'arc') { c.resolveArc((st as any).arc.choices[0].id); continue; } if (st.phase === 'focus') { c.chooseFocus(st.focus[0].id); continue; } if (st.phase === 'offer') { c.resolveOffer(st.offers[0].id); continue; } if (st.phase === 'coach') { c.appointCoach(st.coaches[0].id); continue; } if (st.phase === 'draft') { c.draft(st.options[0].id); continue; } c.play(st.hand[0].id); }
      for (const ch of c.log) if (ch.stakes >= 2) { sum += ch.success; n++; }
    }
    return n ? (sum / n).toFixed(2) : 'n/a';
  };
  console.log(`  avg success in BIG moments — Big-Game Player: ${bigGameAvg('biggame')}  vs  Fragile: ${bigGameAvg('fragile')}  (big-game should be higher)`);
  const dist: Record<string, number> = {};
  for (let i = 0; i < 6000; i++) { const p = new Career(seedFrom('pd', i)).personality.id; dist[p] = (dist[p] ?? 0) + 1; }
  console.log('  personality spread:', Object.fromEntries(Object.entries(dist).map(([k, v]) => [k, `${Math.round(v / 6000 * 100)}%`])));
}

// sports agents: the agent you sign shapes exposure (big stages), opportunities, greed → contract cost
console.log('\n=== sports agents — the agent you sign shapes a whole career ===');
{
  const style: Style = { name: 'Talent', pref: { creativity: 1, flair: 0.8, composure: 0.5 }, skill: 0.85 };
  const bigMoments = (seed: number, agentId?: string) => {
    const c = new Career(seed, 'outfield', agentId);
    while (!c.finished) { const st = c.current(); st.phase === 'arc' ? c.resolveArc((st as any).arc.choices[0].id) : st.phase === 'focus' ? c.chooseFocus(st.focus[0].id) : st.phase === 'offer' ? c.resolveOffer(st.offers[0].id) : st.phase === 'coach' ? c.appointCoach(st.coaches[0].id) : st.phase === 'draft' ? c.draft(st.options[0].id) : c.play(st.hand[0].id); }
    return c.log.filter((ch) => ch.stakes >= 2).length;
  };
  // average big-stage moments each agent's exposure produces (over many careers)
  const avgBig = (agentId?: string) => { let s = 0; const N = 200; for (let i = 0; i < N; i++) s += bigMoments(seedFrom('agent', i), agentId); return (s / N).toFixed(1); };
  console.log(`  big-stage moments/career — none: ${avgBig(undefined)}  loyal: ${avgBig('loyal')}  ambitious: ${avgBig('ambitious')}  super-agent: ${avgBig('super')}  (exposure buys the big stage)`);
  console.log('  same talent, different representation → greed + what it costs a manager to keep him at his peak (age 26):');
  for (const ag of AGENTS) {
    const p = simCareer(seedFrom('rep'), style, undefined, 'outfield', ag.id);
    const flag = p.traits.find((t) => t === 'mercenary' || t === 'loyal') ?? '—';
    console.log(`    ${ag.name.padEnd(16)} greed ${String(p.greed).padStart(2)} ${flag.padEnd(9)} · extend @26 ${String(contractCost(p.overall, 26, p.greed)).padStart(4)} coins`);
  }
  // contract cost bends with age: a mercenary star costs a fortune at his peak, a bargain past 33
  const ovr = 16, greedy = 18, cheap = 4;
  console.log(`  contract cost by age (ovr ${ovr}) — greedy(18): 26→${contractCost(ovr, 26, greedy)} 30→${contractCost(ovr, 30, greedy)} 35→${contractCost(ovr, 35, greedy)}  |  loyal(4): 26→${contractCost(ovr, 26, cheap)} 35→${contractCost(ovr, 35, cheap)}`);
}

// financial decisions: the money fork — chase it (earnings/fame/greed↑, development↓) or stay & develop
console.log('\n=== financial decisions — the money fork (same player, different choices) ===');
{
  const style: Style = { name: 'Talent', pref: { creativity: 1, flair: 0.8, composure: 0.5 }, skill: 0.85 };
  // drive one seed down each path by always taking the same offer id, everything else identical
  const runPath = (offerId: string, seed = seedFrom('fork')) => {
    const c = new Career(seed, 'outfield', 'ambitious');
    while (!c.finished) {
      const st = c.current();
      if (st.phase === 'arc') { c.resolveArc((st as any).arc.choices[0].id); continue; } if (st.phase === 'focus') { c.chooseFocus(st.focus[0].id); continue; }
      if (st.phase === 'offer') { c.resolveOffer(st.offers.find((o) => o.id === offerId)?.id ?? st.offers[0].id); continue; }
      if (st.phase === 'coach') { c.appointCoach(st.coaches[0].id); continue; }
      if (st.phase === 'draft') { const best = st.options.reduce((b, o) => cardPower(o) > cardPower(b) ? o : b, st.options[0]); c.draft(best.id); continue; }
      // play to identity
      let pick = st.hand[0], bs = -Infinity;
      for (const h of st.hand) { const s = h.tags.reduce((a, t) => a + (style.pref[t] ?? 0), 0); if (s > bs) { bs = s; pick = h; } }
      c.play(pick.id);
    }
    return { c, p: graduate(c.log, seed, undefined, undefined, c.finContext()) };
  };
  for (const [label, id] of [['chase the money', 'money'], ['stay & develop ', 'develop']] as const) {
    const { c, p } = runPath(id);
    console.log(`  ${label}: ovr ${String(p.overall).padStart(2)} · earnings ${String(c.earnings).padStart(4)} coins · greed ${String(p.greed).padStart(2)} · fame ${String(p.marketability).padStart(2)} · extend @26 ${contractCost(p.overall, 26, p.greed)} coins`);
  }
  // the development cost is subtle on one career (noisy) but real in aggregate — average it out
  let mo = 0, de = 0; const N = 120;
  for (let i = 0; i < N; i++) { mo += runPath('money', seedFrom('fk', i)).p.overall; de += runPath('develop', seedFrom('fk', i)).p.overall; }
  console.log(`  averaged over ${N} careers — chase money: ovr ${(mo / N).toFixed(2)}   stay & develop: ovr ${(de / N).toFixed(2)}   (money pays now but staying develops a better, cheaper player)`);
}

// contract cost-of-ownership: greed drives BOTH renewal cadence (contract length) and per-renewal cost
console.log('\n=== contract cost-of-ownership — extend or sell (NFT stays owned either way) ===');
{
  const ovr = 16;
  // model a 15-season pro career (age 25→40); a player re-signs every contractLength seasons
  const ownership = (greed: number, personality: string) => {
    const len = contractLength(greed, personality);
    let total = 0, renewals = 0;
    for (let age = 25; age < 40; age += len) { total += contractCost(ovr, age, greed); renewals++; }
    return { len, renewals, total };
  };
  for (const [label, greed, pers] of [['mercenary star', 18, 'maverick'], ['loyal one-club man', 4, 'leader']] as const) {
    const o = ownership(greed, pers);
    console.log(`  ${label.padEnd(18)} greed ${String(greed).padStart(2)} · ${o.len}-season deals · ${o.renewals} renewals over 15y · total wages ${String(o.total).padStart(5)} coins · sell for ${releaseClause(ovr, greed >= 15 ? 16 : 8, greed)} coins`);
  }
  console.log('  → a mercenary re-signs often at a premium (drains coins) but resells high; a loyal star is cheap to keep for years');
  // established wage: a proven high-EARNER costs more to keep (a retention cost, not power); and the
  // breeder banks those earnings when the NFT first sells (rewards developing a player well).
  for (const earn of [0, 3000, 6000]) console.log(`  established-wage @ovr16 greed10 age27 — earnings ${String(earn).padStart(4)}c → extend ${contractCost(16, 27, 10, earn)}c`);
  // The breeder sale payout that used to print here was removed with the function: it had no production
  // caller, and it was the only upside to banking earnings against contractCost's +40% retention premium.
}

// prospect market: snapshot a half-developed player, resume it elsewhere, value it
console.log('\n=== prospect market — trade an in-development player ===');
{
  const genes = rollGenes(seedFrom('prospect'));
  // develop a player halfway (a promising teenager), then a buyer resumes from the snapshot
  const seller = new Career(seedFrom('prospect'));
  while (seller.age < 19 && !seller.finished) { const st = seller.current(); st.phase === 'arc' ? seller.resolveArc((st as any).arc.choices[0].id) : st.phase === 'focus' ? seller.chooseFocus(st.focus[0].id) : st.phase === 'offer' ? seller.resolveOffer(st.offers[0].id) : st.phase === 'coach' ? seller.appointCoach(st.coaches[0].id) : st.phase === 'draft' ? seller.draft(st.options[0].id) : seller.play(st.hand[0].id); }
  const snap = seller.snapshot();
  const val = prospectValuation(seller, genes);
  console.log(`  FOR SALE — age ${val.age} (${val.chapter}), ${val.role}: current ovr ${val.currentOverall}, potential ${val.potential}, physical ceiling ${val.physicalCeiling}, ${'★'.repeat(val.stars)}${'☆'.repeat(5 - val.stars)}`);
  console.log(`  snapshot: ${snap.actions.length} actions (seed+track+actions — tiny, verifiable off-chain)`);
  // buyer resumes and finishes the career from exactly where the seller stopped
  const buyer = Career.resume(snap);
  while (!buyer.finished) { const st = buyer.current(); st.phase === 'arc' ? buyer.resolveArc((st as any).arc.choices[0].id) : st.phase === 'focus' ? buyer.chooseFocus(st.focus[0].id) : st.phase === 'offer' ? buyer.resolveOffer(st.offers[0].id) : st.phase === 'coach' ? buyer.appointCoach(st.coaches[0].id) : st.phase === 'draft' ? buyer.draft(st.options[0].id) : buyer.play(st.hand[0].id); }
  // verify: resume+continue is identical to developing straight through the same choices
  const straight = new Career(seedFrom('prospect'));
  while (!straight.finished) { const st = straight.current(); st.phase === 'arc' ? straight.resolveArc((st as any).arc.choices[0].id) : st.phase === 'focus' ? straight.chooseFocus(st.focus[0].id) : st.phase === 'offer' ? straight.resolveOffer(st.offers[0].id) : st.phase === 'coach' ? straight.appointCoach(st.coaches[0].id) : st.phase === 'draft' ? straight.draft(st.options[0].id) : straight.play(st.hand[0].id); }
  const same = JSON.stringify(graduate(buyer.log, seedFrom('prospect'), genes, undefined, buyer.finContext())) === JSON.stringify(graduate(straight.log, seedFrom('prospect'), genes, undefined, straight.finContext()));
  simCheck(same, 'a resumed career graduates the SAME player as continuous development');
}

// determinism: same seed + same choices (play + draft) → identical player
console.log('\n=== determinism check ===');
const replay = (seed: number) => {
  const c = new Career(seed); const ids: string[] = [];
  while (!c.finished) { const st = c.current(); if (st.phase === 'arc') { const ch=(st as any).arc.choices[0]; ids.push('A:'+ch.id); c.resolveArc(ch.id); } else if (st.phase === 'focus') { ids.push('F:' + st.focus[0].id); c.chooseFocus(st.focus[0].id); } else if (st.phase === 'offer') { ids.push('O:' + st.offers[0].id); c.resolveOffer(st.offers[0].id); } else if (st.phase === 'coach') { ids.push('C:' + st.coaches[0].id); c.appointCoach(st.coaches[0].id); } else if (st.phase === 'draft') { ids.push('D:' + st.options[0].id); c.draft(st.options[0].id); } else { ids.push(st.hand[0].id); c.play(st.hand[0].id); } }
  return { player: graduate(c.log, seed), ids };
};
const r1 = replay(999), r2 = replay(999);
const deterministic = JSON.stringify(r1.player) === JSON.stringify(r2.player) && r1.ids.join() === r2.ids.join();
simCheck(deterministic, 'same seed + same choices → identical player (every save in the game replays through this)');

// 3. skill must pay. Averaged over 60 careers a side, so this is signal rather than one noisy career.
const hi = Number(avgOvr(0.9)), mid = Number(avgOvr(0.6)), lo = Number(avgOvr(0.3));
simCheck(hi > lo, `playing better produces a better player (skill .90 → ${hi}, .30 → ${lo})`);
simCheck(hi >= mid && mid >= lo, `and it is monotone (${hi} ≥ ${mid} ≥ ${lo})`);

// The role spread printed above is NOT balanced, and `ROLE_BASELINE`'s own comment claims it is. That
// remains a known open design item (the deriveStats normaliser), logged for CK rather than turned into a
// red build. What this note used to say — "measured FW ~86% / DF ~14% / MF ~0.4%" — is now stale by a
// wide margin: today it measures FW 54% / DF 28% / MF 6% / GK 12%. Midfield went from a rounding error to
// one career in sixteen, so the item is smaller than it was, not gone. Reachability IS asserted, up where
// the spread is printed; balance still is not.

console.log(simFailures ? `\n✗ ${simFailures} career-sim invariant(s) failed` : '\n✓ career-sim invariants hold');
if (simFailures) process.exit(1);
