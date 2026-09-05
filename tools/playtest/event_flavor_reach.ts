// THE CHILD VOICE THAT NEVER SPOKE.
//
// EVENT_FLAVOR re-words every season event for the life stage it lands in, and its `kid` half — eleven
// authored name+desc pairs, the entire 10-12 register ("Best Player at School", "A Cup Run With the School
// Team", a district call-up read out in front of the whole school) — reached nobody for as long as it
// existed. `advanceSeasonEvent()` is called from play() AFTER `this.turn++`, so `this.chapter` inside it
// already names the band being ENTERED; `flavorTier` answers 'kid' only for 'Grassroots', and Grassroots is
// never the band at a boundary. Measured on the broken tree: 0 of 11 kid lines across 250 played careers,
// against 11 of 11 teen lines. The summer focus bank in play() had the identical off-by-one and was fixed
// by keying on `completed`; this one line was left reading `this.chapter`.
//
// Nothing could see it. The kid bank is an ALTERNATIVE wording, so the screen was never wrong or empty —
// every summer showed a correctly worded event in the teen or default voice, and a player cannot notice
// prose he was never offered. Only a probe that plays careers and compares the output against the bank
// itself can tell "authored" from "reachable".
//
// Compared against the BANK, never against a copy of its strings: a twelfth entry authored tomorrow is
// covered the day it is written, and cannot pass by being forgotten here.
//
// N=250 against a measured need of 25: every kid entry is reached by 25 careers, and the rarest branches
// ('international-honour' is ~2.8% of one roll per career) are what set that floor. Ten times the margin,
// and the whole file runs in 0.7s.
//
// Run: `npx tsx tools/playtest/event_flavor_reach.ts`  (N=250 careers by default, override with N=)
import { AGE_BANDS, Career, EVENT_FLAVOR, TAGS, TOTAL_TURNS } from '../../shared/src/career.js';

const N = Number(process.env.N ?? 250);
let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

// ── what the bank offers ─────────────────────────────────────────────────────────────────────────────
// One authored entry can render as several strings: 'new-gaffer' interpolates the demanded tag. Sweep
// every bias the engine can pass (TAGS covers both the outfield and the goalkeeper pool, plus null).
const BIASES: Array<string | null> = [null, ...TAGS];
const line = (name: string, desc: string) => `${name} — ${desc}`;   // exactly what main.ts renders
interface Entry { id: string; tier: 'kid' | 'teen'; variants: string[] }
const entries: Entry[] = [];
for (const [id, byTier] of Object.entries(EVENT_FLAVOR)) {
  for (const tier of ['kid', 'teen'] as const) {
    const f = byTier[tier];
    if (f) entries.push({ id, tier, variants: BIASES.map((b) => { const v = f(b); return line(v.name, v.desc); }) });
  }
}
const kid = entries.filter((e) => e.tier === 'kid');
const teen = entries.filter((e) => e.tier === 'teen');

// ── what a played career actually prints ─────────────────────────────────────────────────────────────
/** Pick the card that best answers what the moment asked for — a career that plays WELL is the only one
 *  that can roll `breakthrough`, whose bank entry is gated behind `playedWell`. A probe driven by
 *  `hand[step % n]` alone reports 'Breakout Year' unreachable and is measuring its own driver. */
function bestCard(c: any): string {
  const dem = c.scenario?.demand ?? {};
  let best = c.hand[0], bestScore = -Infinity;
  for (const card of c.hand) {
    let score = 0;
    for (const t of card.tags ?? []) score += Number(dem[t] ?? 0);
    if (score > bestScore) { bestScore = score; best = card; }
  }
  return best.id;
}

const seen = new Set<string>();
let events = 0, completed = 0;
for (let s = 1; s <= N; s++) {
  // both tracks, and both a skilled and an indifferent hand — the event table branches on `playedWell`
  // and on the goalkeeper tag pool, so a single style of driver cannot reach the whole bank.
  const c = new Career(s * 7 + 1, s % 5 === 0 ? 'goalkeeper' : 'outfield');
  const skilled = s % 2 === 0;
  let step = 0, last: unknown = null;
  while (!c.finished && step < 900) {
    const st = c.current() as any;
    const pick = (xs: any[]): any => xs[step % xs.length];
    try {
      if (st.phase === 'arc') c.resolveArc(pick(st.arc.choices).id);
      else if (st.phase === 'focus') {
        if (c.seasonEvent && c.seasonEvent !== last) { last = c.seasonEvent; events++; seen.add(line(c.seasonEvent.name, c.seasonEvent.desc)); }
        const afford = (st.lifestyle as any[]).filter((i) => st.earnings >= i.cost);
        if (afford.length) c.buyLifestyle(pick(afford).id);
        c.chooseFocus(pick(st.focus).id);
      }
      else if (st.phase === 'offer') c.resolveOffer(pick(['develop', 'money', 'brand']) as string);
      else if (st.phase === 'coach') c.appointCoach(pick(st.coaches).id);
      else if (st.phase === 'draft') c.draft(pick(st.options).id);
      else { if (!c.hand.length) break; c.play(skilled ? bestCard(c) : c.hand[step % c.hand.length].id); }
    } catch { break; }
    step++;
  }
  if (c.finished && c.turn >= TOTAL_TURNS) completed++;
}

const unreached = (es: Entry[]) => es.filter((e) => !e.variants.some((v) => seen.has(v)));
const missKid = unreached(kid), missTeen = unreached(teen);
console.log(`=== Season-event flavour: is every authored re-wording reachable? ===`);
console.log(`  ..   ${completed}/${N} careers played to turn ${TOTAL_TURNS}, ${events} season events raised over ${AGE_BANDS.length} boundaries each, ${seen.size} distinct event lines seen`);
console.log(`  ..   bank offers ${kid.length} kid + ${teen.length} teen re-wordings; reached ${kid.length - missKid.length} kid, ${teen.length - missTeen.length} teen`);

// VACUITY GUARDS FIRST. "every entry in the bank was reached" is trivially true of an empty bank, and it is
// just as true of a driver that dies at turn 3 and reaches nothing at all. Both floors below are far under
// today's numbers (11/11 authored, 250 careers, 1765 events, 55 distinct lines) and exist only to make an
// empty bank or a dead driver read as a FAIL rather than as a clean sweep. Both were mutation-tested.
check(kid.length >= 8 && teen.length >= 8, `the bank still has both voices to test (${kid.length} kid, ${teen.length} teen; floor 8 each — an emptied bank must not pass this file by having nothing left to reach)`);
check(completed === N && seen.size >= 20, `the careers were really played to the end (${completed}/${N} finished, ${seen.size} distinct lines; floor 20 — a driver that dies at turn 3 must report that as a FAIL, not as a clean sweep)`);

check(missKid.length === 0, missKid.length === 0
  ? `all ${kid.length} kid-voice re-wordings reach a player`
  : `${missKid.length} of ${kid.length} kid-voice re-wordings are UNREACHABLE — authored prose no career can print: ${missKid.map((e) => e.id).join(', ')}`);
check(missTeen.length === 0, missTeen.length === 0
  ? `all ${teen.length} teen-voice re-wordings reach a player`
  : `${missTeen.length} of ${teen.length} teen-voice re-wordings are UNREACHABLE: ${missTeen.map((e) => e.id).join(', ')}`);

console.log(fails
  ? `\n✗ ${fails} — a season-event voice is authored but unreachable. Nothing on screen looks wrong when this fails: the event still renders, in another tier's words, so only this file can see it. Check what \`flavorTier\` is keyed on — \`advanceSeasonEvent\` runs after \`this.turn++\`, so \`this.chapter\` there is already the NEXT band.`
  : '\n✓ every authored season-event re-wording reaches a player');
if (fails) process.exit(1);
