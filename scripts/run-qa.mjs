#!/usr/bin/env node
// Runs every standalone QA harness so they can't silently bit-rot.
//
// AND THEY DID BIT-ROT, exactly as this file's own header warns, because auto-globbing only guarantees a
// harness is RUN — not that anyone runs this script. `verify` is the pre-commit gate and does not include
// `qa`, so nothing routinely invoked it, and seven harnesses were failing at once: six crashed on an
// unhandled 'arc' career phase (qa_facade_invariant_fuzz had never completed a single career in its life)
// and one had a stale fixture. `verify` stayed green throughout.
//
// `npm run gate` (verify + playtest + qa) is the one command that runs everything. Use it before anything
// you would call finished; `verify` alone is the fast inner-loop check, not proof. `npm run verify` stays the fast
// pre-commit gate (build + engine + fuzz + career_sim + savestore + offline_facade); `npm run qa` is the
// heavier full sweep of the shared/ and client/ qa_*.ts fuzz harnesses. Auto-globs, so a NEW harness is
// covered the moment it's added — no list to forget to update (the failure mode that broke three harnesses
// when the server/ dir was removed). Fails loudly on the first red harness.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const harnesses = [
  ...readdirSync(join(root, 'shared')).filter((f) => /^qa_.*\.ts$/.test(f)).map((f) => `shared/${f}`),
  ...readdirSync(join(root, 'client')).filter((f) => /^qa_.*\.ts$/.test(f)).map((f) => `client/${f}`),
].sort();

console.log(`[qa] running ${harnesses.length} harnesses…\n`);
const failed = [];
for (const h of harnesses) {
  process.stdout.write(`── ${h} … `);
  const t0 = Date.now();
  const r = spawnSync('npx', ['tsx', h], { cwd: root, encoding: 'utf8' });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (r.status === 0) {
    console.log(`ok (${secs}s)`);
  } else {
    console.log(`FAIL (${secs}s)`);
    failed.push(h);
    // Surface the tail of the failing harness's output so CI logs show why -- AND every FAIL line,
    // wherever it sits. The tail alone is not enough: qa_matchstats prints its failing assertion well
    // outside the last twelve lines, so `npm run gate` could see only that the HARNESS failed, not which
    // check. That let a fix and a regression inside one file cancel out invisibly in the gate baseline.
    const all = `${r.stdout || ''}${r.stderr || ''}`.trimEnd().split('\n');
    const tail = all.slice(-12);
    const missed = all.filter((l) => /^\s*FAIL\s+\S/.test(l) && !tail.includes(l));
    const out = [...missed, ...tail].join('\n');
    console.log(out ? `\n${out}\n` : '(no output)\n');
  }
}

if (failed.length) {
  console.log(`\n✗ ${failed.length}/${harnesses.length} QA harness(es) FAILED: ${failed.join(', ')}`);
  process.exit(1);
}
console.log(`\n✓ all ${harnesses.length} QA harnesses passed`);
