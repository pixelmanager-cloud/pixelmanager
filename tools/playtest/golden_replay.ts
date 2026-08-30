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
import { Career } from '../../shared/src/career.js';
import { loadCareer } from '../../shared/src/tokens.js';
import { graduate } from '../../shared/src/career.js';
import type { Token } from '../../shared/src/token.js';
import type { CareerAction } from '../../shared/src/tokens.js';
import type { Track } from '../../shared/src/types.js';

const FIXTURE = fileURLToPath(new URL('./fixtures/golden-careers.json', import.meta.url));
const WRITE = process.env.GOLDEN_WRITE === '1';
let fails = 0;
const check = (ok: boolean, msg: string) => { if (ok) console.log(`  ok   ${msg}`); else { console.log(`  FAIL ${msg}`); fails++; } };

/** Drive a career to the end, answering every phase, and return the record the game would store. */
function drive(seed: number, track: Track) {
  const c = new Career(seed, track);
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

/** Everything about a graduated career that a save must reproduce. */
function outcome(seed: number, track: Track, actions: CareerAction[]) {
  const token = {
    id: 'g', name: 'Golden Player', state: 'prospect', career_seed: seed, track,
    career_actions: JSON.stringify(actions), career_action_count: actions.length,
  } as unknown as Token;
  const c = loadCareer(token);
  const p: any = graduate(c.log, seed);
  return {
    turn: c.turn, finished: c.finished, replayShortfall: c.replay ?? null,
    overall: p.overall, role: p.role, attrs: p.attrs, personality: p.personality?.id ?? null,
    traits: (p.traits ?? []).map((t: any) => t.id ?? t).sort(),
  };
}

const TRACKS: Array<{ seed: number; track: Track }> = [
  { seed: 11, track: 'outfield' }, { seed: 2027, track: 'outfield' },
  { seed: 90210, track: 'goalkeeper' }, { seed: 7, track: 'goalkeeper' },
];

if (WRITE || !existsSync(FIXTURE)) {
  const golden = TRACKS.map(({ seed, track }) => {
    const c = drive(seed, track);
    return { seed, track, actions: c.actions, expected: outcome(seed, track, c.actions as CareerAction[]) };
  });
  writeFileSync(FIXTURE, JSON.stringify(golden, null, 2) + '\n');
  console.log(`[golden] wrote ${golden.length} careers to tools/playtest/fixtures/golden-careers.json`);
  console.log('[golden] REGENERATED — if this was not deliberate, every existing save just changed meaning.');
  if (!WRITE) console.log('[golden] (the fixture did not exist; committing it is what makes this a gate)');
} else {
  const golden = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Array<{ seed: number; track: Track; actions: CareerAction[]; expected: any }>;
  console.log(`[golden] replaying ${golden.length} committed careers against this build\n`);
  for (const g of golden) {
    const got = outcome(g.seed, g.track, g.actions);
    const label = `seed ${g.seed} (${g.track}), ${g.actions.length} actions`;
    check(got.turn === g.expected.turn && got.finished === g.expected.finished,
      `${label}: replays to turn ${g.expected.turn}, finished ${g.expected.finished} (got ${got.turn}/${got.finished})`);
    check(!got.replayShortfall, `${label}: no replay shortfall`);
    check(JSON.stringify(got.attrs) === JSON.stringify(g.expected.attrs),
      `${label}: graduates the SAME attributes as the committed run`);
    check(got.overall === g.expected.overall && got.role === g.expected.role
      && got.personality === g.expected.personality && got.traits.join() === g.expected.traits.join(),
      `${label}: same overall (${g.expected.overall}), role (${g.expected.role}), personality and traits`);
  }
}

console.log(fails
  ? `\n✗ ${fails} golden-replay check(s) failed — a save written by an earlier build no longer replays the same way`
  : '\n✓ careers recorded by an earlier build still replay identically');
if (fails) process.exit(1);
