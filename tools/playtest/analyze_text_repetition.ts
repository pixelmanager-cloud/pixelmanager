// Headless TEXT-REPETITION analyzer — the tool for the thing that matters most in a text game: catching
// repeated / thin prose before it makes the game read cheap. Runs many careers, captures the two biggest
// text surfaces (the SCENARIO prompt you read each turn, and the OUTCOME narration after you play), splits
// them into sentences, and reports which sentences recur too often — a thin vocabulary bank is exactly a
// sentence that shows up in a large % of turns. Deterministic, browser-free.
//   npx tsx tools/playtest/analyze_text_repetition.ts [careers]
import { Career, fit, seedFrom } from '../../shared/src/career.js';
import { actWithNarration } from '../../shared/src/tokens.js';
import { scenarioStory } from '../../shared/src/narrate.js';

const N = Number(process.argv[2] ?? 250);

const sentences = (s: string | null | undefined): string[] =>
  !s ? [] : s.replace(/<[^>]+>/g, ' ').split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter((x) => x.length > 8);

const outcome = new Map<string, number>();   // outcome-narration sentences
const prompt = new Map<string, number>();     // scenario-prompt sentences
let outcomeTotal = 0, promptTotal = 0;
let b2bOutcome = 0, b2bPrompt = 0, turns = 0;
// PER-CAREER counts. The aggregate share above is what a designer looks at, but it is NOT what a player
// experiences: a line can be a harmless 0.9% of all text across 40 careers and still be read 25 times in
// the single career someone actually sits through. That is precisely how PT-402 (a 3-line personality
// bank read 25x in one sitting) passed this probe as "healthy". Worst-in-one-career is the real metric.
const perCareerWorst: Array<{ line: string; n: number; seat: string }> = [];
// PER-CAREER SHAPE. §23 of docs/decisions-for-ck.md states the finding this probe exists to hold onto in
// the only units a reader feels: "the first repeat arrives at line 60 of a 7,027-line dynasty", and
// "across five generations: 75.8% of lines distinct". Neither of those is visible in an aggregate share
// over 250 careers, and neither was measured here. They are now, per career and in reading order.
const firstRepeatAt: number[] = [];   // how many lines in before this career repeated itself
const careerUniquePct: number[] = []; // distinct share of the lines ONE career shows you
const careerWorstPct: number[] = [];  // the most-repeated line's share of that career's lines

for (let i = 0; i < N; i++) {
  const c = new Career(seedFrom('rep', i), 'outfield', ['loyal', 'ambitious', 'family', 'super'][i % 4]);
  let lastO = '', lastP = ''; let guard = 0;
  const mine = new Map<string, number>();   // this career's sentences only
  let lines = 0, firstRepeat = 0;
  while (!c.finished && guard++ < 3000) {
    const st = c.current();
    if (st.phase === 'arc') { c.resolveArc((st as any).arc.choices[0].id); continue; }
    if (st.phase === 'focus') { c.chooseFocus(st.focus![0].id); continue; }
    if (st.phase === 'offer') { c.resolveOffer(st.offers![0].id); continue; }
    if (st.phase === 'coach') { c.appointCoach(st.coaches![0].id); continue; }
    if (st.phase === 'draft') { c.draft(st.options![0].id); continue; }
    const hand = st.hand!, sc = st.scenario!;
    // the ACTUAL prompt prose the player reads (careerState builds this via scenarioStory — reconstruct its
    // inputs here so we measure the real text, not the "match: flair" label fallback).
    const topTag = (Object.entries(sc.demand).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0]) ?? 'teamwork';
    const sd = (c as any).seed >>> 0;
    const pStory = scenarioStory((sc as any).kind, topTag, null, { seed: (sd + c.turn * 40503) >>> 0, age: c.age, chapter: c.chapter, seasonEventId: c.seasonEvent?.id ?? null, careerSeed: sd, turn: c.turn });
    const pick = hand.reduce((b, x) => (fit(x, sc) > fit(b, sc) ? x : b), hand[0]);
    const narr = actWithNarration(c, { type: 'play', cardId: pick.id }) ?? ''; // applies + returns the outcome prose
    turns++;
    if (pStory === lastP) b2bPrompt++; lastP = pStory;
    if (narr === lastO) b2bOutcome++; lastO = narr;
    const oS = sentences(narr), pS = sentences(pStory);
    for (const s of oS) { outcome.set(s, (outcome.get(s) ?? 0) + 1); outcomeTotal++; }
    for (const s of pS) { prompt.set(s, (prompt.get(s) ?? 0) + 1); promptTotal++; }
    // READING ORDER — prompt first, then the outcome it produced, exactly as the turn is played. The
    // aggregate maps above are order-blind; first-repeat is not, and order is the whole metric.
    for (const s of [...pS, ...oS]) {
      lines++;
      const seen = (mine.get(s) ?? 0) + 1;
      mine.set(s, seen);
      if (seen === 2 && firstRepeat === 0) firstRepeat = lines;
    }
  }
  const worst = [...mine.entries()].sort((a, b) => b[1] - a[1])[0];
  if (worst) perCareerWorst.push({ line: worst[0], n: worst[1], seat: `career ${i}` });
  firstRepeatAt.push(firstRepeat || lines);   // a career that never repeated scores its full length
  careerUniquePct.push(100 * mine.size / Math.max(1, lines));
  careerWorstPct.push(100 * (worst?.[1] ?? 0) / Math.max(1, lines));
}
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? 0; };
const lowest = (a: number[]) => a.reduce((m, x) => Math.min(m, x), Infinity);

function report(label: string, map: Map<string, number>, total: number) {
  const top = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  const distinct = map.size;
  console.log(`\n=== ${label} — ${total} sentences, ${distinct} distinct (${(100 * distinct / Math.max(1, total)).toFixed(1)}% unique) ===`);
  for (const [s, n] of top) {
    const share = 100 * n / Math.max(1, total);
    console.log(`  ${share >= 3 ? 'FLAG' : 'ok  '} ${share.toFixed(1)}%  “${s.slice(0, 74)}${s.length > 74 ? '…' : ''}”`);
  }
  return top[0] ? 100 * top[0][1] / total : 0;
}

console.log(`=== Text-repetition analyzer — ${N} careers, ${turns} play-turns ===`);
const oTop = report('OUTCOME narration', outcome, outcomeTotal);
const pTop = report('SCENARIO prompt', prompt, promptTotal);
// what the worst-served player actually sits through
perCareerWorst.sort((a, b) => b.n - a.n);
const med = perCareerWorst[Math.floor(perCareerWorst.length / 2)]?.n ?? 0;
const wc = perCareerWorst[0];
console.log(`\n=== WORST LINE INSIDE A SINGLE CAREER — median ${med}x, worst ${wc?.n ?? 0}x ===`);
for (const w of perCareerWorst.slice(0, 5)) console.log(`  ${String(w.n).padStart(3)}x  “${w.line.slice(0, 70)}${w.line.length > 70 ? '…' : ''}”`);

// ── WHAT ONE PLAYER'S SITTING ACTUALLY LOOKS LIKE ───────────────────────────────────────────────────
const medFirst = median(firstRepeatAt), medUnique = median(careerUniquePct);
const worstUnique = lowest(careerUniquePct), worstShare = Math.max(...careerWorstPct);
console.log('\n=== INSIDE ONE CAREER — what one player actually sits through ===');
console.log(`  first repeat arrives at line ${medFirst} (median career)`);
console.log(`  ${medUnique.toFixed(1)}% of a career's lines are distinct (median), ${worstUnique.toFixed(1)}% in the worst-served career`);
console.log(`  the most-repeated line in a career is ${worstShare.toFixed(2)}% of everything that career shows you (worst career)`);

console.log('\n=== verdict ===');
// ── THE BARS ────────────────────────────────────────────────────────────────────────────────────────
// MEASURED ON THIS BUILD at the gate's own scale (250 careers, 30,000 play-turns), then given room.
// Re-measured at 30/60/100/150/400 careers to size that room. The per-career numbers barely move with
// sample size — median first repeat is line 47 at 60, 250 and 400 careers; median per-career uniqueness
// is 82.7-83.2% everywhere — which is what makes them the honest bars. The aggregate SHARES do move,
// because the prompt corpus saturates (6,467 distinct prompt sentences at 30 careers, 8,517 at 60,
// 9,989 at 150, 10,400 at 250, 10,572 at 400), so the bank-size bar below is scale-guarded rather than
// asserted against a number it would fail for the wrong reason.
//
// ⚠ THE FIRST-REPEAT NUMBER IS A KNOWN-BAD VALUE AND THIS BAR DOES NOT BLESS IT.
// Line 47 is not an acceptable answer, it is the current answer. §23 of docs/decisions-for-ck.md names
// this exact defect — "the first repeat arrives at line 60 of a 7,027-line dynasty — twenty minutes in",
// caused by ~590 hard-coded lines in shared/src/narrate.ts (the 17-line CHARLINE bank fires on 40% of
// turns at a 65.6% repeat rate) — and scopes the fix at 4-6 hours of authoring, still OPEN. §19 and §1
// are the other half of the same story: work reverted rather than finished. So MIN_FIRST_REPEAT_LINE is
// a floor under a hole, not a standard. It exists to make the prose getting WORSE impossible to ship
// quietly. When the banks in narrate.ts are expanded, this bar should be RAISED, not left where it is.
const MAX_OUTCOME_TOP_SHARE = 3;      // measured 1.0%  (pre-existing bar, kept)
const MAX_PROMPT_TOP_SHARE = 4;       // measured 1.0%  (pre-existing bar, kept)
const MAX_B2B_OUTCOME_PCT = 1;        // measured 0.00% (pre-existing bar, kept)
const MAX_B2B_PROMPT_PCT = 2;         // measured 0.00% (pre-existing bar, kept)
const MAX_LINE_IN_ONE_CAREER = 12;    // measured 9x    (pre-existing bar, kept)
const MAX_MEDIAN_LINE_IN_CAREER = 9;  // measured 6x    (pre-existing bar, kept)
// RAISED after the §23 authoring pass landed, which is what the block above says to do. narrate.ts's banks
// went from ~590 hard-coded lines to ~3,600, and the anonymous inline cast arrays — which held the single
// most-repeated PROMPT string in the game at 1.0% of everything a player read — were extracted and taken
// from 7 and 10 lines to 40 each. Measured after: first repeat at line 109 (was 48), median career 92.6%
// distinct (was 83.4%), worst-served career 90.1% (was 79.5%), top prompt line 0.2% (was 1.0%). Bars set
// with a real margin under those, because the point is to stop it regressing, not to pin today's number.
const MIN_FIRST_REPEAT_LINE = 85;     // measured 109 — no longer a floor under a hole
const MIN_CAREER_UNIQUE_PCT = 88;     // measured 92.6% median
const MIN_WORST_CAREER_UNIQUE_PCT = 85; // measured 90.1% in the worst-served career
const MAX_CAREER_LINE_SHARE_PCT = 2.5;  // measured 1.3% in the worst-served career
const MIN_PROMPT_BANK = 8000;         // measured 10,400 distinct prompt sentences (9,989 at 150 careers)
const BANK_BAR_NEEDS = 150;           // careers below which the prompt corpus has not saturated

const b2bO = 100 * b2bOutcome / Math.max(1, turns), b2bP = 100 * b2bPrompt / Math.max(1, turns);
const checks: Array<[string, boolean, string]> = [
  [`no single OUTCOME line dominates (top < ${MAX_OUTCOME_TOP_SHARE}% of sentences)`, oTop < MAX_OUTCOME_TOP_SHARE, `${oTop.toFixed(1)}%`],
  [`no single SCENARIO prompt dominates (top < ${MAX_PROMPT_TOP_SHARE}%)`, pTop < MAX_PROMPT_TOP_SHARE, `${pTop.toFixed(1)}%`],
  [`back-to-back identical outcome is rare (< ${MAX_B2B_OUTCOME_PCT}%)`, b2bO < MAX_B2B_OUTCOME_PCT, `${b2bO.toFixed(2)}%`],
  [`back-to-back identical prompt is rare (< ${MAX_B2B_PROMPT_PCT}%)`, b2bP < MAX_B2B_PROMPT_PCT, `${b2bP.toFixed(2)}%`],
  // the check the aggregate shares above could never make (PT-402 read 25x in one career while sitting at
  // a "healthy" 0.9% of all text). A player reads ONE career; no sentence should land more than ~12 times.
  [`no line is read more than ${MAX_LINE_IN_ONE_CAREER}x in ONE career`, (wc?.n ?? 0) <= MAX_LINE_IN_ONE_CAREER, `worst ${wc?.n ?? 0}x`],
  [`the typical career has no line above ${MAX_MEDIAN_LINE_IN_CAREER}x`, med <= MAX_MEDIAN_LINE_IN_CAREER, `median ${med}x`],
  // ── the four bars that hold §23's actual findings. A count of 12x cannot see a bank being halved: cut
  //    CHARLINE from 17 lines to 8 and the worst line goes from 9x to maybe 14x, but uniqueness and
  //    first-repeat move immediately and unmistakably. These are the ones that catch a content EDIT.
  [`REGRESSION BAR — the first repeat arrives no earlier than line ${MIN_FIRST_REPEAT_LINE} (was 47 when this bar was written; the §23 authoring pass took it to 132)`,
    medFirst >= MIN_FIRST_REPEAT_LINE, `line ${medFirst}`],
  [`a career's prose stays >= ${MIN_CAREER_UNIQUE_PCT}% distinct (median career)`, medUnique >= MIN_CAREER_UNIQUE_PCT, `${medUnique.toFixed(1)}%`],
  [`even the worst-served career stays >= ${MIN_WORST_CAREER_UNIQUE_PCT}% distinct`, worstUnique >= MIN_WORST_CAREER_UNIQUE_PCT, `${worstUnique.toFixed(1)}%`],
  [`no line is more than ${MAX_CAREER_LINE_SHARE_PCT}% of everything one career shows you`, worstShare <= MAX_CAREER_LINE_SHARE_PCT, `${worstShare.toFixed(2)}%`],
];
// The prompt corpus is the bank a content edit would shrink, and its measured size is the most direct
// reading there is of "did somebody delete lines". It only means anything once the sample is large
// enough to have SEEN the bank, so at small N it is reported and skipped OUT LOUD rather than silently.
if (N >= BANK_BAR_NEEDS) {
  checks.push([`the SCENARIO bank still holds >= ${MIN_PROMPT_BANK} distinct sentences`, prompt.size >= MIN_PROMPT_BANK, `${prompt.size}`]);
} else {
  console.log(`  --   SCENARIO bank-size bar NOT ASSERTED: needs >= ${BANK_BAR_NEEDS} careers, ran ${N} (saw ${prompt.size} distinct)`);
}
let fails = 0;
for (const [name, ok, val] of checks) { console.log(`  ${ok ? 'OK  ' : 'FLAG'} ${name}  (${val})`); if (!ok) fails++; }
console.log(fails
  ? `\n✗ ${fails} repetition concern(s) — the game repeats itself sooner than the build that set these bars did; expand the flagged banks in shared/src/narrate.ts`
  : '\n✓ text variety reads healthy');
if (fails) process.exit(1);
