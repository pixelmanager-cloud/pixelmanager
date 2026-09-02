#!/usr/bin/env node
// Runs every playtest probe, by globbing the directory rather than by a list somebody has to remember.
//
// THE LIST WAS THE DEFECT. `npm run playtest` was a hand-maintained `&&` chain in package.json while
// `run-qa.mjs` next door auto-globbed — and an audit found TEN probes in no gate at all: arc_dupes,
// duty_power, focus_power, mismatch, prompt_register, quality_curve, shot_geometry, tactical_power,
// tactics_matrix and width_diagnosis. Two of them were RED at the time and had been for nobody knows how
// long, because nothing ran them. That is the same failure this directory's sibling runner was written to
// stop, one directory over.
//
// SLOW is the one honest reason to leave a probe out, and it is declared here rather than by omission —
// `tactics_matrix` takes 47.7 minutes at its default scale (111,850 matches). A probe excluded for any
// other reason is a probe someone has decided not to hear from, so it has to say so out loud.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'tools', 'playtest');

/** Probes that are research runs, not gates. Each needs a reason, and the reason must be about COST. */
const TOO_SLOW = {
  'tactics_matrix.ts': '47.7 min at default scale (111,850 matches) — a research run; give it a CI-sized SCALE default to gate it',
  'tactical_power.ts': '5.3 min at n=900 — gate it once it takes an N env default the way fuzz_test takes FUZZ_N',
};

/** Arguments some probes want. Anything not listed runs bare. */
const ARGS = {
  'analyze_player_career.ts': ['400'],
  'analyze_manager_career.ts': ['300', '15'],
  'analyze_text_repetition.ts': ['250'],
  'generations.ts': ['12'],
  'objectives.ts': ['200'],
  'manager_career_real.ts': ['8', '12', '30'],
  // Both drive real careers through the facade, which replays the whole career on every action — so the
  // cost is superlinear in generations. Four is enough to exercise a founder, two successions and a
  // living heir; six is for running by hand when chasing something.
  'bloodline_tree.ts': ['4'],
  'late_game.ts': ['4'],
};

const files = readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.startsWith('_')).sort();
const skipped = files.filter((f) => TOO_SLOW[f]);
const run = files.filter((f) => !TOO_SLOW[f]);

console.log(`[playtest] ${run.length} probes, globbed from tools/playtest/`);
for (const f of skipped) console.log(`[playtest] SKIPPED ${f} — ${TOO_SLOW[f]}`);
console.log('');

let failed = 0;
for (const f of run) {
  const started = process.hrtime.bigint();
  const r = spawnSync('node', [join(root, 'node_modules', '.bin', 'tsx'), join(dir, f), ...(ARGS[f] ?? [])],
    { cwd: root, stdio: 'inherit' });
  const secs = Number(process.hrtime.bigint() - started) / 1e9;
  if (r.status !== 0) {
    console.log(`\n[playtest] ✗ ${f} FAILED (exit ${r.status}, ${secs.toFixed(1)}s)\n`);
    failed++;
    break;   // fail loudly on the first red, like run-qa.mjs
  }
}

if (failed) { console.log(`[playtest] ✗ ${failed} probe(s) failed`); process.exit(1); }
console.log(`\n[playtest] ✓ all ${run.length} probes passed`);
