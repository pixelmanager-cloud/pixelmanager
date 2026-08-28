// Headless player-career playtest probe. Simulates many careers under a SKILLED policy (always play the
// best-fit card) and a RANDOM policy, and measures the player-experience questions a human tester raised:
//   • is skilled play actually rewarded? (grade distribution, skilled vs random gap)
//   • is the rival beatable by good play?
//   • how often is the hand a forced bad draw (no decent card for the demand)?
//   • is content repetitive (scenario-label repeats within a career / back-to-back)?
// Deterministic, fast, browser-free — the workhorse for 24/7 balance testing. Run:
//   npx tsx tools/playtest/analyze_player_career.ts [N]
import { Career, fit, seedFrom } from '../../shared/src/career.js';

const N = Number(process.argv[2] ?? 400);
// mirror tokens.ts careerScoreOf / rivalRateOf so we can judge rival beatability without importing internals
const rivalRate = (seed: number) => 3 + ((seed >>> 3) % 3);

type Row = { successes: number[]; stakes: number[]; bestFits: number[]; labels: string[]; score: number };
function run(seedTag: string, policy: 'skilled' | 'random'): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < N; i++) {
    const seed = seedFrom(seedTag, i);
    const c = new Career(seed, 'outfield', 'loyal');
    const r: Row = { successes: [], stakes: [], bestFits: [], labels: [], score: 0 };
    let guard = 0;
    while (!c.finished && guard++ < 3000) {
      const st = c.current();
      if (st.phase === 'focus') { c.chooseFocus(st.focus![0].id); continue; }
      if (st.phase === 'offer') { c.resolveOffer(st.offers![0].id); continue; }
      if (st.phase === 'coach') { c.appointCoach(st.coaches![0].id); continue; }
      if (st.phase === 'draft') { c.draft(st.options![0].id); continue; }
      const hand = st.hand!, sc = st.scenario!;
      const pick = policy === 'skilled'
        ? hand.reduce((b, x) => (fit(x, sc) > fit(b, sc) ? x : b), hand[0])
        : hand[Math.floor((i * 2654435761 + guard * 40503) % hand.length)]; // deterministic pseudo-random pick
      const ch = c.play(pick.id);
      r.successes.push(ch.success); r.stakes.push(ch.stakes); r.bestFits.push(ch.bestFit); r.labels.push(ch.scenario);
      r.score += ch.success * 8 * (ch.stakes ?? 1);
    }
    r.score = Math.round(r.score);
    rows.push(r);
  }
  return rows;
}

const pct = (xs: boolean[]) => (100 * xs.filter(Boolean).length / Math.max(1, xs.length)).toFixed(0);
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
function summarise(label: string, rows: Row[]) {
  const allSucc = rows.flatMap((r) => r.successes);
  const solidPlus = pct(allSucc.map((s) => s >= 0.58));
  const brilliant = pct(allSucc.map((s) => s >= 0.78));
  const poor = pct(allSucc.map((s) => s < 0.38));
  const badHand = pct(rows.flatMap((r) => r.bestFits).map((b) => b < 0.5)); // no card gets even a fair fit
  const rivalBeat = pct(rows.map((r, i) => r.score > rivalRate(seedFrom('probe', i)) * r.successes.length));
  // repetition: back-to-back identical scenario labels, and avg distinct labels per career
  let b2b = 0, tot = 0, distinct = 0;
  for (const r of rows) { for (let k = 1; k < r.labels.length; k++) { tot++; if (r.labels[k] === r.labels[k - 1]) b2b++; } distinct += new Set(r.labels).size; }
  console.log(`\n[${label}]  avg success ${avg(allSucc).toFixed(2)}`);
  console.log(`  grades:   Solid+ ${solidPlus}%   Brilliant ${brilliant}%   Poor ${poor}%`);
  console.log(`  bad hand (no fair-fit card available): ${badHand}% of turns`);
  console.log(`  back-to-back same scenario: ${(100 * b2b / Math.max(1, tot)).toFixed(1)}%   avg distinct scenarios/career: ${(distinct / rows.length).toFixed(0)}`);
  return { solidPlus: +solidPlus, brilliant: +brilliant, rivalBeat: +rivalBeat, badHand: +badHand, avgSucc: avg(allSucc) };
}

console.log(`=== Player-career playtest probe — ${N} careers/policy (skilled = always best-fit) ===`);
const sk = summarise('SKILLED', run('probe', 'skilled'));
const rn = summarise('RANDOM', run('probe', 'random'));
console.log(`\n=== player-experience verdict ===`);
const checks: Array<[string, boolean, string]> = [
  ['skilled play is usually rewarded (Solid+ ≥ 60%)', sk.solidPlus >= 60, `${sk.solidPlus}%`],
  ['skill clearly beats random (Solid+ gap ≥ 20pts)', sk.solidPlus - rn.solidPlus >= 20, `${sk.solidPlus}% vs ${rn.solidPlus}%`],
  ['rival is beatable by good play (≥ 60% of skilled careers)', sk.rivalBeat >= 60, `${sk.rivalBeat}%`],
  ['rival is NOT trivial for random play (< 55%)', rn.rivalBeat < 55, `${rn.rivalBeat}%`],
  ['few forced bad hands (< 25% of turns)', sk.badHand < 25, `${sk.badHand}%`],
];
let fails = 0;
for (const [name, ok, val] of checks) { console.log(`  ${ok ? 'OK  ' : 'FLAG'} ${name}  (${val})`); if (!ok) fails++; }
console.log(fails ? `\n⚠ ${fails} concern(s) flagged` : `\n✓ player-career balance reads healthy`);
