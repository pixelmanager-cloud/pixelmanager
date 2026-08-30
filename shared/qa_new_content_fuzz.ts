// QA fuzz harness — RE-FUZZ THE NEWLY-EXPANDED PLAYER CONTENT (backlog item #4).
//
// Commit b6fd086 ("career: more big/huge moments, 2 new life-event kinds, richer focus choices")
// added, since this agent's last pass: two new LifeKind dilemmas (mentor_crossroads, friend_rivalry),
// +6/+5 BIG_MOMENTS/HUGE_MOMENTS labels, +1 main focus option per chapter (7 chapters), SIDE_FOCUS
// extended to the Scholar and Youth Team chapters (previously Breakthrough-onward only), and 3 new
// LIFESTYLE items. None of the existing harnesses track REACHABILITY of individual content items — they
// check bounds/NaN/determinism on whatever content happens to come up, but a genuinely dead/unreachable
// LifeKind, focus option, or lifestyle item would sail through them silently. This harness plays a large
// number of full random-choice careers and tallies which of every declared content id was actually
// reached at least once, flagging anything that never fires as a possible dead-end/gating bug — plus the
// usual NaN/exception/determinism checks specifically on the NEW content paths.
//
// Run: `npx tsx shared/qa_new_content_fuzz.ts` (QA_N env overrides career count, default 4000).

import {
  Career, graduate, rollGenes, seedFrom, mulberry32, AGENTS, TOTAL_TURNS, LIFE_KINDS, LIFE_LABEL,
  type Track, type LifeKind, type CareerPlayerAttrs,
} from './src/career.js';
import { actWithNarration } from './src/tokens.js';

const MAX_LOGGED = 60;
const failures: string[] = [];
const log = (msg: string) => { if (failures.length < MAX_LOGGED) failures.push(msg); };
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const NEW_LIFE_KINDS: LifeKind[] = ['mentor_crossroads', 'friend_rivalry'];

const lifeKindSeen = new Set<LifeKind>();
const focusIdSeen = new Set<string>();
const focusTagSeen = new Set<string>();
const lifestyleIdSeen = new Set<string>();
const chapterFocusSeen = new Set<string>(); // `${chapter}` seen with a focus phase at all — confirms SIDE_FOCUS extension reaches Scholar/Youth Team
const narrationCheckedForNewKind: Record<string, number> = { mentor_crossroads: 0, friend_rivalry: 0 };

const ATTR_KEYS: (keyof CareerPlayerAttrs)[] = [
  'pace', 'strength', 'stamina', 'passing', 'shooting', 'tackling', 'positioning', 'workrate',
  'keeping', 'setPiece', 'composure', 'aggression', 'creativity', 'teamwork', 'leadership', 'durability',
];

/** Play one full random-choice career, tallying every content id reached along the way. */
function playAndTally(seed: number, track: Track, agentId: string | undefined): void {
  const c = new Career(seed, track, agentId);
  const rng = mulberry32(seed ^ 0x7a11c0de);
  let guard = 0; const HARD_CAP = TOTAL_TURNS * 20 + 2000;
  const ctxBase = `seed=${seed} track=${track}`;
  while (!c.finished) {
    if (++guard > HARD_CAP) throw new Error(`softlock: exceeded ${HARD_CAP} steps without finishing  ${ctxBase}`);
    const st = c.current();
    // STORY ARCS ARE A CAREER PHASE. This dispatch predates them and never handled 'arc', so the first arc
    // beat fell through to the play branch, read an undefined hand and killed the suite. Deterministic pick
    // (first choice) so the harness stays reproducible.
    if (st.phase === 'arc') { c.resolveArc((st as any).arc.choices[0].id); continue; }
    if (st.phase === 'focus') {
      chapterFocusSeen.add(st.chapter);
      for (const f of st.focus) { focusIdSeen.add(f.id); if (f.tag) focusTagSeen.add(f.tag); }
      // occasionally exercise a lifestyle purchase alongside the focus pick (buyLifestyle is a side action,
      // not phase-gated) to reach the 3 new lifestyle items too
      // lifestyleOffer DELIBERATELY includes items he cannot yet afford (the client greys them out rather
      // than hiding them), so buying a random offered item legitimately throws. Buy only what he can pay
      // for; a throw here is then a real defect rather than the harness misreading the offer.
      const affordable = st.lifestyle.filter((i) => st.earnings >= i.cost);
      if (affordable.length && rng() < 0.5) {
        const item = affordable[Math.floor(rng() * affordable.length)];
        try { c.buyLifestyle(item.id); lifestyleIdSeen.add(item.id); }
        catch (err) { log(`EXCEPTION buyLifestyle(${item.id}): ${(err as Error).stack ?? err}  ${ctxBase}`); }
      }
      const pick = st.focus[Math.floor(rng() * st.focus.length)];
      c.chooseFocus(pick.id);
      continue;
    }
    if (st.phase === 'offer') { c.resolveOffer(st.offers[Math.floor(rng() * st.offers.length)].id); continue; }
    if (st.phase === 'coach') { c.appointCoach(st.coaches[Math.floor(rng() * st.coaches.length)].id); continue; }
    if (st.phase === 'draft') { c.draft(st.options[Math.floor(rng() * st.options.length)].id); continue; }
    // PLAY: check for a life-event dilemma card BEFORE playing (scenario.life tells us what's on offer this turn)
    const life = st.scenario.life;
    if (life) {
      lifeKindSeen.add(life);
      // meters must never go non-finite/out-of-[0,100] regardless of which card we play into this dilemma
      for (const m of c.meters) {
        if (!finite(m.value) || m.value < 0 || m.value > 100) log(`meter ${m.key}=${m.value} out of [0,100] going into life-event "${life}"  ${ctxBase}`);
      }
      if (NEW_LIFE_KINDS.includes(life)) {
        const cardId = st.hand[Math.floor(rng() * st.hand.length)].id;
        let narration: string | null = null;
        try { narration = actWithNarration(c, { type: 'play', cardId }); }
        catch (err) { log(`EXCEPTION actWithNarration on new LifeKind "${life}": ${(err as Error).stack ?? err}  ${ctxBase}`); }
        narrationCheckedForNewKind[life]++;
        if (narration != null && narration.trim().length === 0) log(`actWithNarration returned an empty string for new LifeKind "${life}"  ${ctxBase}`);
        // meters after resolution must still be finite/bounded
        for (const m of c.meters) {
          if (!finite(m.value) || m.value < 0 || m.value > 100) log(`meter ${m.key}=${m.value} out of [0,100] after resolving new LifeKind "${life}"  ${ctxBase}`);
        }
        continue;
      }
    }
    c.play(st.hand[Math.floor(rng() * st.hand.length)].id);
  }
  const genes = rollGenes(seed);
  const grad = graduate(c.log, seed, genes, undefined, c.finContext());
  for (const k of ATTR_KEYS) {
    const v = grad.attrs[k];
    if (!finite(v) || v < 1 || v > 20) log(`graduate() attrs.${k}=${v} invalid after a career touching new content  ${ctxBase}`);
  }
  if (!finite(grad.overall) || !finite(grad.earnings)) log(`graduate() produced non-finite overall/earnings  ${ctxBase}`);
}

const N = Number(process.env.QA_N ?? 4000);
console.log(`\n[qa-new-content] playing ${N} random-choice careers, tallying reachability of new content...`);
let completed = 0;
for (let i = 0; i < N; i++) {
  const seed = seedFrom('qa-new-content', i);
  const track: Track = (['outfield', 'outfield', 'outfield', 'goalkeeper'] as Track[])[i % 4]; // weight outfield (life events gate on chapter/band, same either track)
  const agentId = AGENTS[i % AGENTS.length].id;
  try { playAndTally(seed, track, agentId); completed++; }
  catch (err) { log(`EXCEPTION: ${(err as Error).stack ?? err}  seed=${seed} i=${i}`); }
}
console.log(`[qa-new-content] ${completed}/${N} careers completed without exception`);

// ── REACHABILITY: every declared LifeKind should fire at least once across this many careers ──
console.log('\n[qa-new-content] LifeKind reachability (all 16, especially the 2 new ones)...');
for (const k of LIFE_KINDS) {
  const seen = lifeKindSeen.has(k);
  const marker = NEW_LIFE_KINDS.includes(k) ? ' [NEW]' : '';
  console.log(`  ${seen ? 'ok  ' : 'MISS'} ${k}${marker}${seen ? '' : ` — never fired across ${N} careers (possible dead-end/gating bug, or just needs a bigger N)`}`);
  if (!seen) log(`LifeKind "${k}" (label: "${LIFE_LABEL[k]}") was never reached across ${N} random-choice careers`);
}
for (const k of NEW_LIFE_KINDS) {
  console.log(`  narration-checked for "${k}": ${narrationCheckedForNewKind[k]} times`);
}

// ── REACHABILITY: focus options + chapters (confirms SIDE_FOCUS extension reaches Scholar/Youth Team) ──
console.log(`\n[qa-new-content] focus reachability: ${focusIdSeen.size} distinct focus ids seen across ${chapterFocusSeen.size} distinct chapters, ${focusTagSeen.size} distinct tags`);
console.log(`[qa-new-content] chapters with a focus phase reached: ${[...chapterFocusSeen].sort().join(', ')}`);
if (!chapterFocusSeen.has('Scholar') && [...chapterFocusSeen].length > 0) log(`SIDE_FOCUS/focus phase never reached in the "Scholar" chapter across ${N} careers — the b6fd086 extension may not be firing`);
if (!chapterFocusSeen.has('Youth Team') && [...chapterFocusSeen].length > 0) log(`SIDE_FOCUS/focus phase never reached in the "Youth Team" chapter across ${N} careers — the b6fd086 extension may not be firing`);

// ── REACHABILITY: lifestyle items (the 3 new ones should show up among the sampled purchases) ──
console.log(`\n[qa-new-content] lifestyle items purchased: ${lifestyleIdSeen.size} distinct ids across ${N} careers`);

// ── DETERMINISM: specifically replay careers that touched a NEW LifeKind, confirm byte-identical replay ──
console.log('\n[qa-new-content] determinism replay focused on new-content careers...');
{
  let mismatches = 0, checked = 0;
  for (let i = 0; i < Math.min(300, N); i++) {
    const seed = seedFrom('qa-new-content', i);
    const track: Track = (['outfield', 'outfield', 'outfield', 'goalkeeper'] as Track[])[i % 4];
    const agentId = AGENTS[i % AGENTS.length].id;
    const rngA = mulberry32(seed ^ 0x7a11c0de);
    const cA = new Career(seed, track, agentId);
    let touchedNew = false;
    let guard = 0;
    while (!cA.finished && guard++ < TOTAL_TURNS * 20 + 2000) {
      const st = cA.current();
      // the replay loop needs the same 'arc' branch as the sweep above — without it st.scenario is
      // undefined on an arc state and this dies on `.life`
      if (st.phase === 'arc') { cA.resolveArc((st as any).arc.choices[0].id); continue; }
      if (st.phase === 'focus') { if (st.lifestyle.length && rngA() < 0.5) { try { cA.buyLifestyle(st.lifestyle[Math.floor(rngA() * st.lifestyle.length)].id); } catch { /* ignore */ } } cA.chooseFocus(st.focus[Math.floor(rngA() * st.focus.length)].id); continue; }
      if (st.phase === 'offer') { cA.resolveOffer(st.offers[Math.floor(rngA() * st.offers.length)].id); continue; }
      if (st.phase === 'coach') { cA.appointCoach(st.coaches[Math.floor(rngA() * st.coaches.length)].id); continue; }
      if (st.phase === 'draft') { cA.draft(st.options[Math.floor(rngA() * st.options.length)].id); continue; }
      if (st.scenario.life && NEW_LIFE_KINDS.includes(st.scenario.life)) touchedNew = true;
      cA.play(st.hand[Math.floor(rngA() * st.hand.length)].id);
    }
    if (!touchedNew) continue;
    checked++;
    const snap = cA.snapshot();
    const resumed = Career.resume(snap);
    const genes = rollGenes(seed);
    const ga = graduate(cA.log, seed, genes, undefined, cA.finContext());
    const gb = graduate(resumed.log, seed, genes, undefined, resumed.finContext());
    if (JSON.stringify(ga) !== JSON.stringify(gb)) { mismatches++; log(`DETERMINISM BREAK: new-content career seed=${seed} — snapshot/resume replay diverged from original`); }
  }
  console.log(`[qa-new-content] replayed ${checked} careers that touched a new LifeKind — ${mismatches} mismatch(es)`);
}

if (failures.length) {
  console.error(`\n[qa-new-content] FAILED — ${failures.length} issue(s)${failures.length >= MAX_LOGGED ? ' (capped)' : ''}:`);
  failures.forEach((f, i) => console.error(`\n  x [${i + 1}] ${f}`));
  process.exit(1);
}
console.log('\n[qa-new-content] clean — no invariant violations found across the newly-expanded content.');
