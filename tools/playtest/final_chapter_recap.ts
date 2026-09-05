// THE CHAPTER THAT ENDS IN GRADUATION NEVER GOT A RECAP.
//
// The recap is the "the story so far" passage a player reads when a chapter closes. careerState gated it on
// `prevChapter !== c.chapter` — but `c.chapter` CLAMPS at TOTAL_TURNS - 1 (career.ts's getter), so at the
// final boundary both sides read 'Establishing' and that test is false by construction. Six of the seven
// chapters were recapped and the last one was not: the chapter that ends at 25 with graduation, the beat the
// epilogue is built around, was the only one the player never got a story-so-far for, and all thirteen
// authored lines in RECAP_OPENERS.Establishing were unreachable. This probe measured it at 84/96/96/96/96/96
// recap states for the first six chapters and 0 for Establishing.
//
// It reads the TEXT the player would see, not the guard's own expression: the RECAP_OPENERS banks are parsed
// out of narrate.ts and each emitted recap is attributed to the bank its opening line came from. That is
// deliberate — chapterRecap falls back to `RECAP_OPENERS.Academy` for an unknown chapter name, so a fix that
// fired on the right turn with the wrong `chapter` string would emit a perfectly plausible recap of the
// WRONG chapter, and a probe that trusted bandAt() would bless it.
//
// Nothing follows the last chapter, so its recap must carry no RECAP_AHEAD clause promising the chapter it is
// already in. That is checked too, and only counts once a last-chapter recap exists.
//
// THE HANDOFF MUST NOT COME WITH IT. The handoff payload is built inside the same `if`, and main.ts's
// renderHandoff replaces the whole career render and returns early — so widening that block wholesale would
// hide this recap from every career that reached the end as a first-team regular (every one of them, when it
// was tried) and would offer the reins on the turn the career ends. The final-boundary handoff count is held
// at zero here, with the earlier boundaries as the control that proves the zero means something.
//
// VACUITY is how a probe of this shape dies quietly, so every count it leans on is printed and asserted
// non-zero: careers driven, recap states seen, banks parsed, openers unique across banks, handoffs seen at
// all. Mutation-test it by restoring `prevChapter !== c.chapter` as the whole gate (the last-chapter
// assertion goes red), by passing `nextChapter: c.chapter` at the final boundary (the ahead-clause assertion
// goes red, 84 of 84), or by dropping `boundary &&` from the handoff condition (the final-boundary handoff
// assertion goes red, 84). All three were run against this probe before it landed.
//
// Run: `npx tsx tools/playtest/final_chapter_recap.ts`
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Career, mulberry32, AGE_BANDS, TOTAL_TURNS } from '../../shared/src/career.js';
import { careerState } from '../../shared/src/tokens.js';
import type { Token } from '../../shared/src/token.js';

// `new URL(...).pathname` is percent-encoded and this repo lives under a path with a space in it — the
// same trap kit_promise.ts documents.
const ROOT = fileURLToPath(new URL('../../', import.meta.url));

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

console.log('=== Every chapter closes with a recap, the last one included ===');

// ── 1. THE AUTHORED BANKS, read out of narrate.ts rather than described here.
const narr = readFileSync(`${ROOT}shared/src/narrate.ts`, 'utf8');
const bankStart = narr.indexOf('const RECAP_OPENERS');
const bankBlock = bankStart < 0 ? '' : narr.slice(bankStart, narr.indexOf('\n};', bankStart));
const OPENERS = new Map<string, string[]>();
let key: string | null = null;
for (const line of bankBlock.split('\n')) {
  const k = line.match(/^  '?([A-Za-z ]+)'?: \[$/);
  if (k) { key = k[1]; OPENERS.set(key, []); continue; }
  if (line.startsWith('  ],')) { key = null; continue; }
  const v = key && line.match(/^\s*'(.+)',$/);
  if (v) OPENERS.get(key!)!.push(v[1]);
}
const CHAPTERS = AGE_BANDS.map((b) => b.name);
const LAST = CHAPTERS[CHAPTERS.length - 1];
console.log(`  ..   RECAP_OPENERS banks parsed: ${[...OPENERS].map(([k, v]) => `${k} ${v.length}`).join(', ')}`);
ok(CHAPTERS.every((ch) => (OPENERS.get(ch)?.length ?? 0) >= 10), 'every chapter has a parsed opener bank of 10+ lines (nothing below reads an empty bank)');

// Attribution is only sound if an opening line names exactly one bank. Matched with startsWith rather
// than by splitting on the first full stop — several openers are two sentences ('He was ten. That is most
// of the story, really.'), and splitting mis-attributed 83 of 564 recaps when this was first run.
const owner = new Map<string, string>();
let shared = 0;
for (const [ch, lines] of OPENERS) for (const l of lines) { if (owner.has(l)) shared++; else owner.set(l, ch); }
const chapterOf = (recap: string): string | null => {
  let hit: string | null = null, len = 0;
  for (const [line, ch] of owner) if (recap.startsWith(line) && line.length > len) { hit = ch; len = line.length; }
  return hit;
};
ok(shared === 0, `no opener line appears in two banks, so an emitted recap names one chapter (${shared} shared)`);

// ── 2. DRIVE REAL CAREERS and take what careerState hands the client, exactly as the offline facade does.
function makeToken(): Token {
  return {
    id: 'nft:probe', owner_id: 'owner:probe', generation: 0, state: 'prospect', name: 'Kai Vance',
    genes_json: JSON.stringify({ pace: { floor: 5, ceiling: 15 }, strength: { floor: 5, ceiling: 15 }, stamina: { floor: 5, ceiling: 15 } }),
    pedigree: 0, dev_bonus_json: '{}',
    career_seed: null, agent_id: null, track: null, career_actions: null,
    attrs_json: null, role: null, traits_json: null, personality: null,
    greed: null, marketability: null, earnings: null, prime_season: null, peak_overall: 0,
    signed_season: null, length_seasons: null, staked_since: null,
    ach_seasons: 0, ach_apps: 0, ach_league: 0, ach_cup: 0, ach_promotions: 0, ach_tier: 0, morale: 65,
    ach_goals: 0, ach_assists: 0, ach_potm: 0,
    kit_json: null, career_honours_json: null,
  };
}

const CAREERS = 12;
const seen = new Map<string, number>();       // chapter the recap is OF -> states that carried it
const lastRecaps: string[] = [];              // the last chapter's recaps, verbatim
let recapStates = 0, unattributed = 0, handoffEarly = 0, handoffFinal = 0, careers = 0;

for (let s = 0; s < CAREERS; s++) {
  const seed = s * 977 + 13;
  const c = new Career(seed, 'outfield');
  const rng = mulberry32(seed ^ 0xfeed01);
  const token = makeToken();
  let guard = 0;
  while (!c.finished && guard++ < TOTAL_TURNS * 10 + 2000) {
    const st: any = careerState(token, c, 'Ardwick Town', 2);
    if (st.recap) {
      recapStates++;
      const of = chapterOf(String(st.recap));
      if (of) { seen.set(of, (seen.get(of) ?? 0) + 1); if (of === LAST) lastRecaps.push(st.recap); }
      else unattributed++;
    }
    if (st.handoff) { if (c.turn >= TOTAL_TURNS) handoffFinal++; else handoffEarly++; }
    if (st.phase === 'arc') { c.resolveArc(st.arc.choices[0].id); continue; }
    if (st.phase === 'focus') { c.chooseFocus(st.focus[Math.floor(rng() * st.focus.length)].id); continue; }
    if (st.phase === 'offer') { c.resolveOffer(st.offers[Math.floor(rng() * st.offers.length)].id); continue; }
    if (st.phase === 'coach') { c.appointCoach(st.coaches[Math.floor(rng() * st.coaches.length)].id); continue; }
    if (st.phase === 'draft') { c.draft(st.options[Math.floor(rng() * st.options.length)].id); continue; }
    c.play(st.hand[Math.floor(rng() * st.hand.length)].id);
  }
  careers++;
}

console.log(`  ..   ${careers} careers driven to graduation, ${recapStates} states carried a recap`);
console.log(`  ..   recaps by the chapter they close: ${CHAPTERS.map((ch) => `${ch} ${seen.get(ch) ?? 0}`).join(', ')}`);
ok(careers === CAREERS && recapStates > 0, 'the sweep actually ran and recaps were actually emitted');
ok(unattributed === 0, `every emitted recap opens with a line from a RECAP_OPENERS bank (${unattributed} unmatched)`);

const missing = CHAPTERS.filter((ch) => !(seen.get(ch) ?? 0));
ok(missing.length === 0, `every chapter is recapped when it closes — missing: ${missing.join(', ') || 'none'}`);

// ── 3. NOTHING FOLLOWS THE LAST CHAPTER, so its recap must not promise one.
if (lastRecaps[0]) console.log(`       e.g. ${lastRecaps[0]}`);
const promising = lastRecaps.filter((r) => r.includes(LAST));
ok(lastRecaps.length > 0 && promising.length === 0,
  `the ${LAST} recap exists and promises no chapter after it (${promising.length} of ${lastRecaps.length} named ${LAST} again)`);

// ── 4. THE HANDOFF STAYS WHERE IT WAS. handoffEarly is the control: a zero below must mean "not offered
// at the final boundary", never "never offered at all".
console.log(`  ..   handoff payloads raised: ${handoffEarly} at chapter changes, ${handoffFinal} at the final boundary`);
ok(handoffEarly > 0, 'the handoff is still offered at real chapter changes, so the count below is not vacuous');
ok(handoffFinal === 0, `no handoff is raised at the final boundary, where it would replace this recap and end the career (${handoffFinal})`);

console.log(fails === 0 ? '\n✓ the last chapter is recapped too' : `\n✗ ${fails} problem(s)`);
process.exit(fails === 0 ? 0 : 1);
