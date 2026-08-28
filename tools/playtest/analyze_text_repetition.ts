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

for (let i = 0; i < N; i++) {
  const c = new Career(seedFrom('rep', i), 'outfield', ['loyal', 'ambitious', 'family', 'super'][i % 4]);
  let lastO = '', lastP = ''; let guard = 0;
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
    for (const s of sentences(narr)) { outcome.set(s, (outcome.get(s) ?? 0) + 1); outcomeTotal++; }
    for (const s of sentences(pStory)) { prompt.set(s, (prompt.get(s) ?? 0) + 1); promptTotal++; }
  }
}

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
console.log('\n=== verdict ===');
const checks: Array<[string, boolean, string]> = [
  ['no single OUTCOME line dominates (top < 3% of sentences)', oTop < 3, `${oTop.toFixed(1)}%`],
  ['no single SCENARIO prompt dominates (top < 4%)', pTop < 4, `${pTop.toFixed(1)}%`],
  ['back-to-back identical outcome is rare (< 1%)', 100 * b2bOutcome / Math.max(1, turns) < 1, `${(100 * b2bOutcome / Math.max(1, turns)).toFixed(2)}%`],
  ['back-to-back identical prompt is rare (< 2%)', 100 * b2bPrompt / Math.max(1, turns) < 2, `${(100 * b2bPrompt / Math.max(1, turns)).toFixed(2)}%`],
];
let fails = 0;
for (const [name, ok, val] of checks) { console.log(`  ${ok ? 'OK  ' : 'FLAG'} ${name}  (${val})`); if (!ok) fails++; }
console.log(fails ? `\n⚠ ${fails} repetition concern(s) — expand the flagged banks above` : `\n✓ text variety reads healthy`);
