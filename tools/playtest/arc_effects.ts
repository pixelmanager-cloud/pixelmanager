// EVERY FIELD AN ARC CAN SET MUST BE CONSUMED SOMEWHERE.
//
// 1,633 of 2,513 manager-arc options carried a `prestige` effect and 1,142 carried `boardMood`, and
// applyArcEffect handled neither — so two thirds of every decision in the library had a written
// consequence that did not happen. You could gamble the dressing room on a chancer's call, read that the
// board's patience was spent, and watch nothing move. Nothing caught it, because every existing probe
// asked whether arcs were REACHABLE, and they all were; none asked whether choosing one did anything.
//
// This compares the declared effect fields against the ones applyArcEffect actually reads, and fails on
// any field an author can write that the game will silently discard.
import { readFileSync } from 'node:fs';
import { MANAGER_ARCS } from '../../shared/src/managerarc.js';

const main = readFileSync(new URL('../../client/src/main.ts', import.meta.url), 'utf8');
const body = main.slice(main.indexOf('private applyArcEffect'));
const impl = body.slice(0, body.indexOf('\n  }'));

const used: Record<string, number> = {};
let options = 0;
for (const a of MANAGER_ARCS) for (const b of Object.values((a as any).beats ?? {})) {
  for (const o of (b as any).choices ?? (b as any).options ?? []) {
    options++;
    for (const k of Object.keys((o as any).effect ?? {})) used[k] = (used[k] ?? 0) + 1;
  }
}

console.log(`=== Manager arc effects — ${MANAGER_ARCS.length} arcs, ${options} options ===`);
// A probe that traverses nothing reports everything as clean. The first version of this file walked the
// wrong key, found zero options, and printed a green tick — the same shape as the bug it exists to catch.
if (options < 1000) { console.log(`✗ only ${options} options traversed — the walk is broken, not the library`); process.exitCode = 1; }
const dropped: string[] = [];
for (const [k, n] of Object.entries(used).sort((a, b) => b[1] - a[1])) {
  const handled = new RegExp(`\\be\\.${k}\\b`).test(impl);
  console.log(`  ${handled ? '✓' : '✗'} ${k.padEnd(13)} on ${String(n).padStart(4)} options (${String(Math.round((n / options) * 100)).padStart(2)}%)${handled ? '' : '   <-- WRITTEN BY AUTHORS, DISCARDED BY THE GAME'}`);
  if (!handled) dropped.push(`${k} (${n} options, ${Math.round((n / options) * 100)}%)`);
}
if (dropped.length) {
  console.log(`\n✗ applyArcEffect discards: ${dropped.join(', ')}`);
  process.exitCode = 1;
} else console.log('\n✓ every effect an arc can write is consumed');
