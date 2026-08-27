#!/usr/bin/env node
// Runs every standalone QA harness so they can't silently bit-rot. `npm run verify` stays the fast
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
    // surface the tail of the failing harness's output so CI logs show why
    const out = `${r.stdout || ''}${r.stderr || ''}`.trimEnd().split('\n').slice(-12).join('\n');
    console.log(out ? `\n${out}\n` : '(no output)\n');
  }
}

if (failed.length) {
  console.log(`\n✗ ${failed.length}/${harnesses.length} QA harness(es) FAILED: ${failed.join(', ')}`);
  process.exit(1);
}
console.log(`\n✓ all ${harnesses.length} QA harnesses passed`);
