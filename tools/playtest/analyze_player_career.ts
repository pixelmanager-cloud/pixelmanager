// Headless player-career playtest probe. Simulates many careers under a SKILLED policy (always play the
// best-fit card) and a RANDOM policy, and measures the player-experience questions a human tester raised:
//   • is skilled play actually rewarded? (grade distribution, skilled vs random gap)
//   • is the rival beatable by good play?
//   • how often is the hand a forced bad draw (no decent card for the demand)?
//   • is content repetitive (scenario-label repeats within a career / back-to-back)?
// Deterministic, fast, browser-free — the workhorse for 24/7 balance testing. Run:
//   npx tsx tools/playtest/analyze_player_career.ts [N]
import { Career, fit, seedFrom } from '../../shared/src/career.js';
import { rivalRateOf, rivalScoreAt } from '../../shared/src/tokens.js';

const N = Number(process.argv[2] ?? 400);
// The rival model is IMPORTED from the game, never copied. This block used to be a hand-maintained mirror
// with a comment insisting it must track the real thing — and it drifted twice anyway, most recently
// within an hour of the rival being retuned, so the probe went on reporting a rival it no longer shared a
// formula with. A copy that must be kept in sync is a bug with a waiting period. (PT-1000)
const rivalRate = rivalRateOf;

type Row = { successes: number[]; stakes: number[]; bestFits: number[]; labels: string[]; score: number };
function run(seedTag: string, policy: 'skilled' | 'decent' | 'random'): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < N; i++) {
    const seed = seedFrom(seedTag, i);
    const c = new Career(seed, 'outfield', 'loyal');
    const r: Row = { successes: [], stakes: [], bestFits: [], labels: [], score: 0 };
    let guard = 0;
    while (!c.finished && guard++ < 3000) {
      const st = c.current();
      if (st.phase === 'arc') { c.resolveArc((st as any).arc.choices[0].id); continue; }
    if (st.phase === 'focus') { c.chooseFocus(st.focus![0].id); continue; }
      if (st.phase === 'offer') { c.resolveOffer(st.offers![0].id); continue; }
      if (st.phase === 'coach') { c.appointCoach(st.coaches![0].id); continue; }
      if (st.phase === 'draft') { c.draft(st.options![0].id); continue; }
      const hand = st.hand!, sc = st.scenario!;
      // DECENT = plays a card carrying SOME demanded tag, but not necessarily the best one. This is what a
      // player who half-reads the moment does, and the gap between it and SKILLED is what makes reading the
      // moment properly worth doing. If the two score the same, the game only looks like it has decisions.
      const decent = hand.filter((x) => fit(x, sc) > 0);
      const pick = policy === 'skilled'
        ? hand.reduce((b, x) => (fit(x, sc) > fit(b, sc) ? x : b), hand[0])
        : policy === 'decent'
          ? (decent.length ? decent[Math.floor((i * 2654435761 + guard * 40503) % decent.length)] : hand[0])
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
  // Defined ONCE. I first wrote the by-quarter breakdown below with its own 0.55 against solidPlus's 0.60
  // and it silently reported a career 9 points rosier than the aggregate — the same duplicated-constant
  // drift that had the rival probe judging a formula the game no longer used.
  const SOLID = 0.60, BRILLIANT = 0.80, POOR = 0.40;
  // kept in sync with the on-screen grade pills in client/src/main.ts (PT-700 retune)
  const solidPlus = pct(allSucc.map((s) => s >= SOLID));
  const brilliant = pct(allSucc.map((s) => s >= BRILLIANT));
  const poor = pct(allSucc.map((s) => s < POOR));
  const badHand = pct(rows.flatMap((r) => r.bestFits).map((b) => b < 0.5)); // no card gets even a fair fit
  const rivalBeat = pct(rows.map((r, i) => r.score > rivalScoreAt(r.successes.length, rivalRate(seedFrom('probe', i)))));
  // A rival who is beaten but never THREATENS is not a rival. Measure how much of the career is a real
  // contest — the share of turns where the gap is within a couple of good moments either way.
  const contested = pct(rows.map((r, i) => {
    const rate = rivalRate(seedFrom('probe', i));
    let close = 0, run = 0;
    r.successes.forEach((sc, t) => { run += sc * 8 * (r.stakes[t] ?? 1); if (Math.abs(run - rivalScoreAt(t + 1, rate)) <= 60) close++; });
    return close / Math.max(1, r.successes.length) >= 0.25;   // a quarter of the career still in the balance
  }));
  // repetition: back-to-back identical scenario labels, and avg distinct labels per career
  let b2b = 0, tot = 0, distinct = 0;
  for (const r of rows) { for (let k = 1; k < r.labels.length; k++) { tot++; if (r.labels[k] === r.labels[k - 1]) b2b++; } distinct += new Set(r.labels).size; }
  console.log(`\n[${label}]  avg success ${avg(allSucc).toFixed(2)}`);
  console.log(`  grades:   Solid+ ${solidPlus}%   Brilliant ${brilliant}%   Poor ${poor}%`);
  console.log(`  bad hand (no fair-fit card available): ${badHand}% of turns`);
  // BY CAREER PHASE. An aggregate hides decay: the grade curve was fixed for the first 30 turns and then
  // drifted back to a near-guaranteed Brilliant in the late career, and a single career-wide number could
  // not see it. Quarters of the career, so a trend is visible rather than an average. (PT-1001)
  const q = [0, 1, 2, 3].map((k) => {
    const seg = rows.flatMap((r) => r.successes.slice(Math.floor(r.successes.length * k / 4), Math.floor(r.successes.length * (k + 1) / 4)));
    return { sp: +pct(seg.map((v) => v >= SOLID)), br: +pct(seg.map((v) => v >= BRILLIANT)) };
  });
  console.log(`  by quarter:  Solid+ ${q.map((x) => `${x.sp}%`).join(' → ')}   Brilliant ${q.map((x) => `${x.br}%`).join(' → ')}`);
  const drift = Math.max(...q.map((x) => x.br)) - Math.min(...q.map((x) => x.br));
  console.log(`  back-to-back same scenario: ${(100 * b2b / Math.max(1, tot)).toFixed(1)}%   avg distinct scenarios/career: ${(distinct / rows.length).toFixed(0)}`);
  return { drift, solidPlus: +solidPlus, brilliant: +brilliant, poor: +poor, rivalBeat: +rivalBeat, contested: +contested, badHand: +badHand, avgSucc: avg(allSucc) };
}

console.log(`=== Player-career playtest probe — ${N} careers/policy (skilled = always best-fit) ===`);
const skRows = run('probe', 'skilled');
const dcRows = run('probe', 'decent');
const sk = summarise('SKILLED', skRows);
const dc = summarise('DECENT', dcRows);
const rn = summarise('RANDOM', run('probe', 'random'));
// Spread of final career score under IDENTICAL play. A narrow band means the number you finish on was
// settled at character creation and the 120 turns barely moved it. (PT-705)
const scores = skRows.map((r) => r.score).sort((a, b) => a - b);
const at = (q: number) => scores[Math.min(scores.length - 1, Math.floor(scores.length * q))];
const spread = 100 * (at(0.9) - at(0.1)) / Math.max(1, at(0.1));
console.log(`\ncareer score (skilled): p10 ${Math.round(at(0.1))} · p50 ${Math.round(at(0.5))} · p90 ${Math.round(at(0.9))}  → p90/p10 spread ${spread.toFixed(1)}%`);
const dcMed = [...dcRows.map((r) => r.score)].sort((a, b) => a - b)[Math.floor(dcRows.length / 2)];
const playGap = 100 * (at(0.5) - dcMed) / Math.max(1, dcMed);
console.log(`skilled vs decent: career score ${Math.round(at(0.5))} vs ${Math.round(dcMed)}  → play is worth ${playGap.toFixed(1)}%`);
console.log(`\n=== player-experience verdict ===`);
const checks: Array<[string, boolean, string]> = [
  ['skilled play is usually rewarded (Solid+ ≥ 60%)', sk.solidPlus >= 60, `${sk.solidPlus}%`],
  // These two checks had a FLOOR and no CEILING, so "90% of turns come out Solid or better" scored as a
  // pass — when 90% is the actual complaint. A loop the player cannot fail has no tension in it, and the
  // probe was structurally unable to say so. Same one-sided blind spot the manager probe had. (PT-151/1407)
  ['skilled play can still FAIL (Solid+ ≤ 82%)', sk.solidPlus <= 82, `${sk.solidPlus}%`],
  // NOTE on this floor: 'skilled' here means the best card in hand EVERY turn, which no human sustains.
  // For a perfect-play policy a Poor result requires a large adverse swing, so it is rare by construction
  // and demanding 7% would only push me to add noise the game does not need. The real anti-inflation
  // guards are the two ceilings above; this one exists so failure stays VISIBLE rather than impossible.
  ['failure is still possible for skilled play (Poor ≥ 3%)', sk.poor >= 3, `${sk.poor}%`],
  ['Brilliant stays special (≤ 45% of turns)', sk.brilliant <= 45, `${sk.brilliant}%`],
  ['difficulty does not decay late (Brilliant spread across quarters ≤ 18pts)', sk.drift <= 18, `${sk.drift}pts`],
  ['skill clearly beats random (Solid+ gap ≥ 20pts)', sk.solidPlus - rn.solidPlus >= 20, `${sk.solidPlus}% vs ${rn.solidPlus}%`],
  // Reading the moment PROPERLY has to beat half-reading it, or the decision is cosmetic. (PT-706)
  ['reading it right beats half-reading it (Brilliant gap ≥ 8pts)', sk.brilliant - dc.brilliant >= 8, `${sk.brilliant}% vs ${dc.brilliant}%`],
  // PT-705 asked for career-score DISPERSION, and I first checked p90/p10 across skilled careers — but
  // that varies only the SEED, so it measures how much luck decides, not how much play decides. Low seed
  // spread is desirable when play spread is high; the two only looked alike in the old build where
  // success pinned to the clamp and NOTHING moved the number. The honest check is the play gap: the same
  // seed pool, played well versus played half-well.
  ['play moves the career score more than luck does (≥ 8%)', playGap >= 8, `${playGap.toFixed(1)}% (skilled ${Math.round(at(0.5))} vs decent ${Math.round(dcMed)}), seed spread ${spread.toFixed(1)}%`],
  ['rival is beatable by good play (≥ 60% of skilled careers)', sk.rivalBeat >= 60, `${sk.rivalBeat}%`],
  ['the rival STAYS a contest, not just beatable (≥ 40%)', sk.contested >= 40, `${sk.contested}%`],
  ['rival is NOT trivial for random play (< 55%)', rn.rivalBeat < 55, `${rn.rivalBeat}%`],
  ['few forced bad hands (< 25% of turns)', sk.badHand < 25, `${sk.badHand}%`],
];
let fails = 0;
for (const [name, ok, val] of checks) { console.log(`  ${ok ? 'OK  ' : 'FLAG'} ${name}  (${val})`); if (!ok) fails++; }
console.log(fails ? `\n⚠ ${fails} concern(s) flagged` : `\n✓ player-career balance reads healthy`);
