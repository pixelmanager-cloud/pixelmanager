// QA fuzz harness — SCRIPTED "OPTIMAL PLAY" STRATEGY VARIANTS (backlog item #3).
//
// Every other career-fuzzing harness (qa_career_fuzz.ts, qa_dynasty_fuzz.ts's playFullCareer,
// qa_career_state_fuzz.ts) drives `Career` with RANDOM-CHOICE policies — uniformly picking among the
// legal options each phase. `shared/src/career.ts` also has an internal `simCareer()`/`Style` policy used
// by strategy_test.ts for balance sampling, but that's still probabilistic (rng-jittered scoring, not a
// deterministic maximizer). None of the existing harnesses drive the engine with a purely DETERMINISTIC,
// always-pick-the-best/worst-case policy — which tends to surface different edge cases than uniform
// random choice (e.g. a policy that always maximizes `fit()` will hammer whichever code path is
// "the ideal answer" every single turn, all career long; a policy that always picks the flashiest/
// highest-variance card will hammer the opposite extreme).
//
// Three scripted policies (using ONLY exported functions from shared/src/career.ts — no engine changes):
//   - ALWAYS-DEVELOP: every phase picks the option that best matches the track's core identity tag
//     (deterministic max-fit at play; 'develop' at offer; highest-specialty-match coach; highest fit*power
//     draft pick).
//   - ALWAYS-SAFE: every phase picks the lowest-stakes / lowest-variance option — minimum `fit` mismatch
//     risk by leaning on 'composure'/'teamwork' tags, safest financial offer, most defensively-specialized
//     coach.
//   - ALWAYS-AGGRESSIVE: every phase picks the highest-power/highest-stakes option regardless of fit —
//     'money'/'brand' financial offers, highest-power draft picks, boldest ('flair'/'creativity'-tagged)
//     plays even when they don't match the scenario's demand.
//
// Invariants checked per career: reaches graduation within the turn budget (no softlock), no exceptions,
// attrs/overall/earnings stay in their documented bounds, and — since these are 100% deterministic
// policies with no rng jitter — the SAME seed+policy replayed twice must produce a byte-identical
// graduate() result (a stronger determinism bar than the other harnesses' rng-driven policies, since here
// any nondeterminism can only come from the engine itself, never policy noise).
//
// Run: `npx tsx shared/qa_strategy_fuzz.ts` (QA_N env overrides careers-per-strategy, default 600).

import {
  Career, graduate, rollGenes, seedFrom, mulberry32, AGENTS, fit, cardPower, TOTAL_TURNS,
  type Track, type Card, type Choice, type CareerPlayer, type CareerPlayerAttrs,
} from './src/career.js';

const MAX_LOGGED = 60;
const failures: string[] = [];
const log = (msg: string) => { if (failures.length < MAX_LOGGED) failures.push(msg); };
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const ATTR_KEYS: (keyof CareerPlayerAttrs)[] = [
  'pace', 'strength', 'stamina', 'passing', 'shooting', 'tackling', 'positioning', 'workrate',
  'keeping', 'setPiece', 'composure', 'aggression', 'creativity', 'teamwork', 'leadership', 'durability',
];
function checkPlayer(p: CareerPlayer, ctx: string) {
  for (const k of ATTR_KEYS) {
    const v = p.attrs[k];
    if (!finite(v)) log(`NON-FINITE attrs.${k}=${v}  ${ctx}`);
    else if (v < 1 || v > 20) log(`OUT-OF-RANGE attrs.${k}=${v} (want 1..20)  ${ctx}`);
  }
  if (!finite(p.overall) || p.overall < 1 || p.overall > 20) log(`overall=${p.overall} out of [1,20]  ${ctx}`);
  if (!finite(p.earnings) || p.earnings < 0) log(`earnings=${p.earnings} invalid  ${ctx}`);
  if (!finite(p.marketability) || p.marketability < 0) log(`marketability=${p.marketability} invalid  ${ctx}`);
  if (!finite(p.greed) || p.greed < 1 || p.greed > 20) log(`greed=${p.greed} out of [1,20]  ${ctx}`);
}

type PolicyName = 'always-develop' | 'always-safe' | 'always-aggressive';

/** Run one career start-to-finish under a fully deterministic scripted policy (no rng anywhere in the
 *  choice logic — a tie is broken by stable array order, never Math.random/jitter). */
function runPolicy(seed: number, track: Track, agentId: string | undefined, policy: PolicyName): Career {
  const c = new Career(seed, track, agentId);
  let guard = 0; const HARD_CAP = TOTAL_TURNS * 20 + 2000;
  while (!c.finished) {
    if (++guard > HARD_CAP) throw new Error(`softlock: exceeded ${HARD_CAP} steps without finishing (policy=${policy})`);
    const st = c.current();
    if (st.phase === 'focus') {
      const opts = st.focus;
      let pick = opts[0];
      if (policy === 'always-develop') {
        // the tagged option (soft skill-tree) beats an untagged one — deterministic: first tagged option.
        pick = opts.find((o) => o.tag != null) ?? opts[opts.length - 1];
      } else if (policy === 'always-safe') {
        // the option touching the most meters (spreads relationship upkeep) — deterministic: max effect count, ties broken by array order.
        pick = opts.reduce((best, o) => (Object.keys(o.effects).length > Object.keys(best.effects).length ? o : best), opts[0]);
      } else {
        // always-aggressive: skip relationship maintenance, go straight for the attribute-tagged option (no safety net).
        pick = opts.find((o) => o.tag != null) ?? opts[0];
      }
      c.chooseFocus(pick.id);
      continue;
    }
    if (st.phase === 'offer') {
      const ids = st.offers.map((o) => o.id);
      const target = policy === 'always-develop' ? 'develop' : policy === 'always-safe' ? 'develop' : (ids.includes('money') ? 'money' : ids.includes('brand') ? 'brand' : ids[0]);
      c.resolveOffer(ids.includes(target) ? target : ids[0]);
      continue;
    }
    if (st.phase === 'coach') {
      const opts = st.coaches;
      let best = opts[0];
      if (policy === 'always-safe') {
        // most specialties = broadest, lowest-variance coverage
        best = opts.reduce((b, o) => (o.specialty.length > b.specialty.length ? o : b), opts[0]);
      } else if (policy === 'always-aggressive') {
        // highest single-stat bonus, specialties be damned
        best = opts.reduce((b, o) => (o.bonus > b.bonus ? o : b), opts[0]);
      } else {
        // always-develop: the coach ('coach' kind, not 'mentor') with the most specialty tags — deterministic tie-break by array order
        best = opts.filter((o) => o.kind === 'coach')[0] ?? opts[0];
      }
      c.appointCoach(best.id);
      continue;
    }
    if (st.phase === 'draft') {
      const opts = st.options;
      let best: Card = opts[0], bestScore = -Infinity;
      for (const card of opts) {
        const score = policy === 'always-aggressive' ? cardPower(card)
          : policy === 'always-safe' ? (card.tags.includes('composure') || card.tags.includes('teamwork') ? 2 : 0) + cardPower(card) * 0.1
          : cardPower(card) + card.tags.length * 0.5; // always-develop: broad, powerful cards build the deepest deck
        if (score > bestScore) { bestScore = score; best = card; }
      }
      c.draft(best.id);
      continue;
    }
    // PLAY phase — the core of each policy's identity.
    const hand = st.hand, sc = st.scenario;
    let best: Card = hand[0];
    if (policy === 'always-develop') {
      // deterministic MAXIMIZER: always the single best-fit card for the scenario's demand — the "ideal
      // answer" every turn, all career long. Ties broken by stable array order (first max wins).
      let bestFit = -Infinity;
      for (const card of hand) { const f = fit(card, sc); if (f > bestFit) { bestFit = f; best = card; } }
    } else if (policy === 'always-safe') {
      // lowest-power card that still has nonzero fit — minimum commitment, minimum risk, every turn.
      const viable = hand.filter((card) => fit(card, sc) > 0);
      const pool = viable.length ? viable : hand;
      best = pool.reduce((b, card) => (cardPower(card) < cardPower(b) ? card : b), pool[0]);
    } else {
      // always-aggressive: highest-power card, fit be damned — swing for the fences every single turn.
      best = hand.reduce((b, card) => (cardPower(card) > cardPower(b) ? card : b), hand[0]);
    }
    c.play(best.id);
  }
  return c;
}

// ── run each policy across many seeds x tracks x agents ──
const N = Number(process.env.QA_N ?? 600);
const TRACKS: Track[] = ['outfield', 'goalkeeper'];
const POLICIES: PolicyName[] = ['always-develop', 'always-safe', 'always-aggressive'];

console.log(`\n[qa-strategy] simulating ${N} careers x ${POLICIES.length} scripted policies (${N * POLICIES.length} total)...`);
const summary: Record<PolicyName, { overallSum: number; earningsSum: number; count: number; roleCounts: Record<string, number> }> =
  Object.fromEntries(POLICIES.map((p) => [p, { overallSum: 0, earningsSum: 0, count: 0, roleCounts: {} }])) as any;

for (const policy of POLICIES) {
  for (let i = 0; i < N; i++) {
    const seed = seedFrom('qa-strategy', policy, i);
    const track: Track = TRACKS[i % TRACKS.length];
    const agentId = AGENTS[i % AGENTS.length].id;
    const genes = rollGenes(seed);
    const ctx = `policy=${policy} seed=${seed} track=${track} i=${i}`;
    try {
      const c = runPolicy(seed, track, agentId, policy);
      const grad = graduate(c.log, seed, genes, undefined, c.finContext());
      checkPlayer(grad, ctx);
      summary[policy].overallSum += grad.overall;
      summary[policy].earningsSum += grad.earnings;
      summary[policy].count++;
      summary[policy].roleCounts[grad.role] = (summary[policy].roleCounts[grad.role] ?? 0) + 1;
    } catch (err) {
      log(`EXCEPTION: ${(err as Error).stack ?? err}  ${ctx}`);
    }
  }
}
console.log(`[qa-strategy] all policies completed their run budget (or logged an exception above)`);

// ── DETERMINISM: same seed+policy, replayed twice, must be byte-identical (no rng jitter anywhere in these policies) ──
console.log('\n[qa-strategy] strict determinism replay (each policy is 100% deterministic — zero tolerance)...');
{
  let mismatches = 0, checked = 0;
  for (const policy of POLICIES) {
    for (let i = 0; i < Math.min(40, N); i++) {
      const seed = seedFrom('qa-strategy', policy, i);
      const track: Track = TRACKS[i % TRACKS.length];
      const agentId = AGENTS[i % AGENTS.length].id;
      const genes = rollGenes(seed);
      const a = runPolicy(seed, track, agentId, policy);
      const b = runPolicy(seed, track, agentId, policy);
      const ga = graduate(a.log, seed, genes, undefined, a.finContext());
      const gb = graduate(b.log, seed, genes, undefined, b.finContext());
      checked++;
      if (JSON.stringify(ga) !== JSON.stringify(gb)) { mismatches++; log(`DETERMINISM BREAK: policy=${policy} seed=${seed} i=${i} — identical scripted policy produced different results on replay`); }
    }
  }
  console.log(`[qa-strategy] determinism: ${mismatches} mismatch(es) out of ${checked} replayed (policy,seed) pairs`);
}

// ── balance summary (contributes to backlog item #5 — a non-random baseline to compare fuzz averages against) ──
console.log('\n[qa-strategy] balance summary — avg overall/earnings + role spread per scripted policy:');
for (const policy of POLICIES) {
  const s = summary[policy];
  if (s.count === 0) continue;
  const roles = Object.entries(s.roleCounts).map(([r, n]) => `${r}=${Math.round(100 * n / s.count)}%`).join(' ');
  console.log(`  ${policy.padEnd(18)} avg overall=${(s.overallSum / s.count).toFixed(2)}  avg earnings=${Math.round(s.earningsSum / s.count)}  roles: ${roles}  (n=${s.count})`);
}

if (failures.length) {
  console.error(`\n[qa-strategy] FAILED — ${failures.length} issue(s)${failures.length >= MAX_LOGGED ? ' (capped)' : ''}:`);
  failures.forEach((f, i) => console.error(`\n  x [${i + 1}] ${f}`));
  process.exit(1);
}
console.log('\n[qa-strategy] clean — no invariant violations found across all scripted policies.');
