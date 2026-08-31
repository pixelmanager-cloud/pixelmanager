// ── A SAVE IS NEVER REPLAYED IN THE PROCESS THAT WROTE IT ─────────────────────────────────────────────
//
// `career_sim.ts` asserts determinism by replaying the same seed twice and comparing — both replays inside
// ONE process. That cannot see the failure mode that actually threatens saves. A mutation put a
// module-scope `Date.now()` salt into `graduate`'s seed: stable within a run, different between runs. The
// check printed `ok same seed + same choices → identical player` on both runs, while the two runs' output
// differed by 98 lines.
//
// The same signature comes from anything that is per-process rather than per-seed: a lazily initialised
// cache, an iteration order that depends on import order, a `Math.random()` on a cold path, a `Date.now()`
// anywhere. A player's save is written today and replayed tomorrow, in a new process, against a NEW BUILD.
//
// So the expectation lives OUTSIDE the process, in a committed file. This is the check every determinism
// test in this repo was missing: they all record an action list and replay it inside their own build, which
// is precisely the gap the KIND_BIAS incident fell through.
//
// Regenerating is a deliberate act: `GOLDEN_WRITE=1 npx tsx tools/playtest/golden_replay.ts`. If a change makes
// this fail, that is the tool working — it means existing saves will not replay the same way, and the
// question is whether that is intended, not whether the fixture is inconvenient.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Career, rollGenes } from '../../shared/src/career.js';
import { loadCareer, graduatedFields } from '../../shared/src/tokens.js';
import type { Token } from '../../shared/src/token.js';
import type { CareerAction } from '../../shared/src/tokens.js';
import type { Track } from '../../shared/src/types.js';

const FIXTURE = fileURLToPath(new URL('./fixtures/golden-careers.json', import.meta.url));
const WRITE = process.env.GOLDEN_WRITE === '1';
let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };
interface Expected { turn: number; finished: boolean; replayShortfall: unknown; grad: Record<string, unknown> }
const short = (v: unknown) => { const s = JSON.stringify(v) ?? 'undefined'; return s.length > 42 ? s.slice(0, 39) + '...' : s; };

/** Drive a career to the end, answering every phase, and return the record the game would store. */
function drive(seed: number, track: Track, agentId?: string) {
  const c = new Career(seed, track, agentId);
  let step = 0;
  while (!c.finished && step < 600) {
    const st = c.current() as any;
    const pick = (xs: any[]): any => xs[step % xs.length];
    try {
      if (st.phase === 'arc') c.resolveArc(pick(st.arc.choices).id);
      else if (st.phase === 'focus') c.chooseFocus(pick(st.focus).id);
      else if (st.phase === 'offer') c.resolveOffer(pick(['develop', 'money', 'brand']) as string);
      else if (st.phase === 'coach') c.appointCoach(pick(st.coaches).id);
      else if (st.phase === 'draft') c.draft(pick(st.options).id);
      else if (st.phase === 'lifestyle') c.buyLifestyle(pick(st.items).id);
      else { if (!c.hand.length) break; c.play(c.hand[step % c.hand.length].id); }
    } catch { break; }
    step++;
  }
  return c;
}

/** Everything about a graduated career that a save must reproduce.
 *
 *  This pins `graduatedFields` — the function the game actually calls when a career ends, whose return
 *  value IS what gets written to the token. The previous version re-implemented a subset of it here, and
 *  that is exactly how it went wrong: it captured 5 of the 9 `CareerPlayer` fields, called `graduate`
 *  without `finContext()` so earnings were always 0, and read `p.personality?.id` off a field that is a
 *  `string` — through an `any`, so the compiler never saw it. All four committed careers recorded
 *  `"personality": null`, and the check named in the pass message had never compared anything.
 *  A projection you maintain by hand drifts from the thing it projects. Pin the real function. */
function outcome(seed: number, track: Track, actions: CareerAction[], agentId?: string, devBonus?: Record<string, number>) {
  const token = {
    id: 'g', name: 'Golden Player', state: 'prospect', career_seed: seed, track,
    agent_id: agentId ?? null,
    genes_json: JSON.stringify(rollGenes(seed)), dev_bonus_json: JSON.stringify(devBonus ?? {}),
    career_actions: JSON.stringify(actions), career_action_count: actions.length,
  } as unknown as Token;
  const c = loadCareer(token);
  return {
    turn: c.turn, finished: c.finished, replayShortfall: c.replay ?? null,
    grad: graduatedFields(token, c) as Record<string, unknown>,
  };
}

// PINNING THE OUTPUT IS NOT ENOUGH IF THE INPUT IS FROZEN. Every fixture career used to be built with
// `agent_id: null` and `dev_bonus_json: '{}'`, and none graduated above 14. So three things graduation
// writes to a real save were untestable by construction, and an audit confirmed all three walk through the
// whole gate: zeroing the agent's effect on greed and marketability (no career had an agent), zeroing the
// bloodline legacyBonus (no career had a dev bonus), and zeroing elite international caps (careerHonours'
// `peakOverall >= 15` branch was unreachable at a maximum of 14). The last three entries exist to make
// each of those a live comparison, and the coverage gate below refuses a fixture that loses them.
const LEGACY: Record<string, number> = { composure: 3, leadership: 3, positioning: 2, passing: 2, shooting: 2, pace: 2, strength: 2, stamina: 2 };
const TRACKS: Array<{ seed: number; track: Track; agentId?: string; devBonus?: Record<string, number> }> = [
  { seed: 1, track: 'outfield' },    // FW, Workhorse, 2 traits
  { seed: 4, track: 'outfield' },    // DF, Workhorse, 1 trait
  { seed: 9, track: 'outfield' },    // MF, The Stoic, 2 traits
  { seed: 1, track: 'goalkeeper' },  // GK, Workhorse, 4 traits
  { seed: 2, track: 'outfield' },    // FW, Perfectionist, 2 traits
  { seed: 3, track: 'outfield' },    // FW, Showman, 3 traits
  { seed: 5, track: 'outfield' },    // DF, Model Professional, 3 traits
  { seed: 14, track: 'outfield' },   // DF, Big-Game Player, 3 traits
  // the three that unfreeze the inputs
  { seed: 2, track: 'goalkeeper', agentId: 'super', devBonus: LEGACY },  // peak 17 + 24 caps + a greedy agent
  { seed: 20, track: 'outfield', agentId: 'family' },                    // the OTHER end of the agent axis (greed -5)
  { seed: 12, track: 'outfield', devBonus: LEGACY },                     // an inherited legacy bonus, no agent
];

// NO ESCAPE HATCH. This used to be `if (WRITE || !existsSync(FIXTURE))` — a missing fixture regenerated
// itself from the current build and exited 0, printing the pass line. A checkout, a packaging step or a
// stray `rm` that lost one JSON file turned the strictest gate in the suite into a no-op that self-heals
// to whatever the build does today. A missing expectation is a failure, never a fresh expectation.
if (!WRITE && !existsSync(FIXTURE)) {
  console.log('[golden] FIXTURE MISSING: tools/playtest/fixtures/golden-careers.json');
  console.log('[golden] This gate compares against a file committed by an earlier build. Without it there is');
  console.log('[golden] nothing to compare to, and regenerating it here would only assert that today equals today.');
  console.log('[golden] Restore it from git. Regenerate ONLY if the change of meaning is deliberate:');
  console.log('[golden]   GOLDEN_WRITE=1 npx tsx tools/playtest/golden_replay.ts');
  process.exit(1);
}

if (WRITE) {
  const golden = TRACKS.map(({ seed, track, agentId, devBonus }) => {
    const c = drive(seed, track, agentId);
    return { seed, track, agentId, devBonus, actions: c.actions,
             expected: outcome(seed, track, c.actions as CareerAction[], agentId, devBonus) };
  });
  writeFileSync(FIXTURE, JSON.stringify(golden, null, 2) + '\n');
  console.log(`[golden] wrote ${golden.length} careers to tools/playtest/fixtures/golden-careers.json`);
  console.log('[golden] REGENERATED — if this was not deliberate, every existing save just changed meaning.');
} else {
  const golden = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Array<{ seed: number; track: Track; agentId?: string; devBonus?: Record<string, number>; actions: CareerAction[]; expected: Expected }>;
  console.log(`[golden] replaying ${golden.length} committed careers against this build\n`);
  for (const g of golden) {
    const got = outcome(g.seed, g.track, g.actions, g.agentId, g.devBonus);
    const label = `seed ${g.seed} (${g.track}), ${g.actions.length} actions`;
    check(got.turn === g.expected.turn && got.finished === g.expected.finished,
      `${label}: replays to turn ${g.expected.turn}, finished ${g.expected.finished} (got ${got.turn}/${got.finished})`);
    check(!got.replayShortfall, `${label}: no replay shortfall`);
    // EVERY persisted field, compared by key. Not a hand-picked list: a key present on one side and absent
    // on the other counts as moved, so adding a field to what graduation writes fails here until the
    // fixture is deliberately regenerated. This is what makes a constant-returning mutation visible.
    const keys = [...new Set([...Object.keys(got.grad), ...Object.keys(g.expected.grad ?? {})])].sort();
    const moved = keys.filter(k => JSON.stringify(got.grad[k]) !== JSON.stringify((g.expected.grad ?? {})[k]));
    check(moved.length === 0 && keys.length > 0,
      `${label}: all ${keys.length} persisted graduation fields identical`
      + (moved.length ? ` — MOVED: ${moved.map(k => `${k} (${short(g.expected.grad?.[k])} -> ${short(got.grad[k])})`).join(', ')}` : ''));
  }

  // ── The fixture is only as good as what it covers. A regeneration that quietly narrowed the set — every
  // career an outfield forward, every graduate the same temperament — would still pass every check above
  // while testing a fraction of the surface. So the committed set has to keep spanning the space.
  const grads = golden.map(g => g.expected.grad ?? {});
  const roles = new Set(grads.map(g => g.role as string));
  const pers = new Set(grads.map(g => g.personality as string));
  const traitCounts = grads.map(g => { try { return (JSON.parse(String(g.traits_json ?? '[]')) as unknown[]).length; } catch { return 0; } });
  console.log(`\n[coverage] roles ${[...roles].sort().join('/')} · ${pers.size} personalities · traits ${Math.min(...traitCounts)}-${Math.max(...traitCounts)} per career`);
  check(roles.size === 4, `the committed careers cover all four roles (got ${[...roles].sort().join('/') || 'none'})`);
  check(pers.size >= 5, `the committed careers cover >= 5 personalities (got ${pers.size} of ${13})`);
  check(Math.max(...traitCounts) >= 2, `at least one committed career earned 2+ traits (max ${Math.max(...traitCounts)})`);
  check(grads.every(g => typeof g.personality === 'string' && g.personality.length > 0),
    'every committed career recorded a real personality (this read `null` for four careers, and nobody noticed)');
  check(grads.some(g => Number(g.earnings ?? 0) > 0),
    'at least one committed career recorded non-zero earnings (0 everywhere means finContext() is not being passed)');

  // ── AND THE INPUTS, which pinning the outputs does not cover ────────────────────────────────────────
  // Each of these was untestable by construction until the fixture carried the input that reaches it, and
  // an audit confirmed a mutation zeroing each one passed the entire gate.
  const withAgent = golden.filter(g => g.agentId).length;
  const withLegacy = golden.filter(g => g.devBonus && Object.keys(g.devBonus).length).length;
  const peaks = grads.map(g => Number(g.peak_overall ?? 0));
  const caps = grads.map(g => { try { return Number((JSON.parse(String(g.career_honours_json ?? '{}')) as { caps?: number }).caps ?? 0); } catch { return 0; } });
  console.log(`[inputs] ${withAgent} careers signed an agent · ${withLegacy} inherited a legacy bonus · peak overall ${Math.min(...peaks)}-${Math.max(...peaks)} · caps up to ${Math.max(...caps)}`);
  check(withAgent >= 2, `at least two committed careers signed an agent (got ${withAgent}) — with none, zeroing the agent's effect on greed and marketability changes nothing here`);
  check(withLegacy >= 1, `at least one committed career inherited a legacy bonus (got ${withLegacy}) — with none, zeroing the bloodline's dev_bonus changes nothing here`);
  check(Math.max(...peaks) >= 15, `at least one committed career graduates at peak overall >= 15 (max ${Math.max(...peaks)}) — careerHonours' elite-caps branch is unreachable below it`);
  check(Math.max(...caps) > 0, `at least one committed career earned international caps (max ${Math.max(...caps)})`);
  const greeds = grads.map(g => Number(g.greed ?? 0));
  check(Math.max(...greeds) - Math.min(...greeds) >= 8,
    `the committed careers span a real range of agent greed (${Math.min(...greeds)}-${Math.max(...greeds)}) — a narrow spread means the agent axis is barely exercised`);
}

console.log(fails
  ? `\n✗ ${fails} golden-replay check(s) failed — a save written by an earlier build no longer replays the same way`
  : '\n✓ careers recorded by an earlier build still replay identically');
if (fails) process.exit(1);
