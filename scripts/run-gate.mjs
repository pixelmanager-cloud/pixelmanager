// THE GATE THAT CAN ACTUALLY GATE.
//
// `gate` was `npm run verify && npm run playtest && npm run qa`, and `verify` ends in a leg that exits 1 BY
// DESIGN -- shared/strategy_test.ts has four assertions documented in section 68 as permanently, knowingly
// red. A POSIX && chain therefore short-circuited at leg one on every run since that redness was accepted:
// playtest and qa never executed, and neither did the fourteen verify legs sitting after `test:engine` in
// its own && chain. CI had the same shape (three steps, no `if: always()`), under a comment claiming "All
// three legs run here now". And agent/run.sh used `if ! npm run verify` as its "authoritative verification
// gate", so the overnight runner took its failure branch every single time: branch deleted, no PR, forever.
//
// The fix is NOT to make verify green -- that would mean editing a bar to make numbers look better, which is
// the one thing forbidden here. It is to run all three legs unconditionally and judge the result against a
// COMMITTED BASELINE of accepted failures. A known-red assertion is not a gate failure; a NEW one is.
//
// Exit 0 when every failure is in the baseline (and nothing in the baseline has silently started passing).
// Exit 1 when a new failure appears, naming it.
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';

const BASELINE = new URL('./gate-baseline.txt', import.meta.url);

import { norm, collect } from './gate-parse.mjs';

const legs = [
  ['verify', ['run', 'verify']],
  ['playtest', ['run', 'playtest']],
  ['qa', ['run', 'qa']],
];

const seen = new Set();
const results = [];
for (const [name, args] of legs) {
  const t0 = Date.now();
  const r = spawnSync('npm', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
  for (const f of collect(out)) seen.add(f);
  const code = r.status ?? 1;
  results.push({ name, code });
  seen.add(`leg ${name} exits ${code}`);
  console.log(`[gate] ${name} exited ${code} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  // ECHO THE DIAGNOSTIC LINES EVEN WHEN THE LEG IS GREEN. The gate swallows each leg's stdout and prints
  // only its own summary plus failures, which is right for signal — but it means a PASSING assertion tells
  // you nothing about its margin. That bit after sim_stats.ts was changed to scale its budget by machine
  // speed: the whole point of printing the calibration was to see what CI measures, and CI never showed it,
  // because the probe passed. A budget you cannot observe is a budget you cannot tune.
  //
  // Probes mark such lines with a leading '  .. '. Nothing else uses that prefix.
  for (const line of out.split('\n')) {
    if (/^\s{2}\.\.\s/.test(line)) console.log(`[gate]   ${line.trim()}`);
  }
}

const WRITE = process.argv.includes('--write-baseline');
if (WRITE) {
  // Deliberate act, like regenerating the golden fixtures: it declares "these failures are accepted".
  const body = [
    '# Accepted gate failures. Every line here is a KNOWN, MEASURED, DELIBERATE red documented in',
    '# docs/decisions-for-ck.md section 68. A failure NOT in this list fails the gate.',
    '# Measured numbers are stripped before comparison, so "(got 588 vs 602)" drifting does not matter.',
    '# Regenerate with: node scripts/run-gate.mjs --write-baseline  (and say why in the commit).',
    '',
    ...[...seen].sort(),
    '',
  ].join('\n');
  writeFileSync(BASELINE, body);
  console.log(`\n[gate] wrote ${seen.size} accepted failure(s) to scripts/gate-baseline.txt`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error('\n[gate] scripts/gate-baseline.txt is missing — cannot tell an accepted failure from a new one.');
  console.error('[gate] To create it from the CURRENT state (a deliberate act):');
  console.error('[gate]   node scripts/run-gate.mjs --write-baseline');
  process.exit(1);
}

const accepted = readFileSync(BASELINE, 'utf8')
  .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const acceptedSet = new Set(accepted.map(norm));

const novel = [...seen].filter((f) => !acceptedSet.has(f));
const vanished = [...acceptedSet].filter((f) => !seen.has(f));

console.log(`\n[gate] ${seen.size} failing assertion(s); ${accepted.length} accepted in the baseline`);
if (vanished.length) {
  console.log('\n[gate] these accepted failures now PASS — remove them from the baseline so they can never rot back:');
  for (const v of vanished) console.log(`  ✓ ${v}`);
}
if (novel.length) {
  console.error('\n[gate] NEW FAILURES — not in the baseline:');
  for (const n of novel) console.error(`  ✗ ${n}`);
  console.error('\n[gate] FAILED');
  process.exit(1);
}
console.log('\n[gate] PASSED — every failure is a documented, accepted one (see decisions-for-ck section 68)');
