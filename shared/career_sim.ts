// Career-sim prototype harness. Runs several distinct "career styles" through a full
// career and prints the players they produce — to validate the make-or-break questions:
//   (1) do different play styles → DIFFERENT, SPECIALIZED players? (diversity)
//   (2) does higher skill → higher MAGNITUDE? (a skilled vs crude version of a style)
// Run: `npx tsx career_sim.ts` from shared/.
import { playCareer, deriveStats, careerOverall, seedFrom, type Style, type CareerStats } from './src/career.js';

const STYLES: Style[] = [
  { name: 'Poacher',    pref: { composure: 1, flair: 0.8 },              skill: 0.85 },
  { name: 'Enforcer',   pref: { aggression: 1, teamwork: 0.5 },         skill: 0.85 },
  { name: 'Playmaker',  pref: { creativity: 1, teamwork: 0.8 },         skill: 0.85 },
  { name: 'Captain',    pref: { leadership: 1, composure: 0.7 },        skill: 0.85 },
  { name: 'Engine',     pref: { stamina: 1, teamwork: 0.7 },           skill: 0.85 },
  { name: 'Maverick',   pref: { flair: 1, creativity: 0.8 },           skill: 0.85 },
  { name: 'Enforcer(raw)', pref: { aggression: 1, teamwork: 0.5 },     skill: 0.25 }, // same style, low skill
];

const STAT_KEYS: (keyof CareerStats)[] = ['composure', 'aggression', 'creativity', 'teamwork', 'leadership', 'stamina', 'pace', 'shooting', 'tackling', 'passing'];
const pad = (s: string, n: number) => s.padEnd(n);
const num = (n: number) => String(n).padStart(2);

console.log('\n=== Career Sim — players produced by different styles ===\n');
console.log(pad('STYLE', 15), STAT_KEYS.map((k) => k.slice(0, 4)).map((k) => pad(k, 5)).join(''), ' OVR  top-3 stats');

const players: Array<{ name: string; stats: CareerStats }> = [];
for (const style of STYLES) {
  const seed = seedFrom('career', style.name);
  const log = playCareer(seed, style);
  const stats = deriveStats(log, seed);
  players.push({ name: style.name, stats });
  const top3 = STAT_KEYS.map((k) => [k, stats[k]] as const).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${v}`).join(', ');
  console.log(pad(style.name, 15), STAT_KEYS.map((k) => pad(num(stats[k]), 5)).join(''), ` ${num(careerOverall(stats))}  ${top3}`);
}

// diversity check: are the archetypes' top stats actually different?
console.log('\n=== diversity check ===');
const topStatOf = (s: CareerStats) => STAT_KEYS.reduce((best, k) => (s[k] > s[best] ? k : best), STAT_KEYS[0]);
const distinctTops = new Set(players.filter((p) => !p.name.includes('raw')).map((p) => topStatOf(p.stats)));
console.log(`distinct top-stat archetypes: ${distinctTops.size} of 6  ->`, [...distinctTops].join(', '));

// magnitude check: same style, high vs low skill
const skilled = players.find((p) => p.name === 'Enforcer')!.stats;
const raw = players.find((p) => p.name === 'Enforcer(raw)')!.stats;
console.log(`\n=== magnitude check (Enforcer skill .85 vs .25) ===`);
console.log(`  aggression ${skilled.aggression} vs ${raw.aggression}  |  overall ${careerOverall(skilled)} vs ${careerOverall(raw)}  (skilled should be higher)`);

// pairwise distance: are any two produced players near-identical? (want them spread out)
console.log('\n=== pairwise stat distance (higher = more different; want no near-zero) ===');
const dist = (a: CareerStats, b: CareerStats) => Math.round(Math.sqrt(STAT_KEYS.reduce((s, k) => s + (a[k] - b[k]) ** 2, 0)));
const core = players.filter((p) => !p.name.includes('raw'));
let minD = Infinity;
for (let i = 0; i < core.length; i++) for (let j = i + 1; j < core.length; j++) minD = Math.min(minD, dist(core[i].stats, core[j].stats));
console.log(`  closest pair distance: ${minD}  (a diverse roster keeps this comfortably > 0)`);
console.log('');
