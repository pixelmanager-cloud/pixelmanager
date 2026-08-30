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

// ── DOMINATED OPTIONS ───────────────────────────────────────────────────────────────────────────────
//
// A choice where one option is better on every axis and worse on none is not a choice — it is a button
// with a right answer wearing a dilemma's clothes. `mgr-p1-schoolboy-question` offers prestige 3 / 2 / 1
// and nothing else, anywhere.
//
// An editorial pass counted 547 such pairs, and the structural reading is the important part: that is not
// 547 authoring slips, it is what happens when effects are assigned after the prose, by feel, one arc at a
// time, with no tool checking the vectors. So this is a RATCHET rather than a pass/fail — the backlog is
// too large to clear in one go, but it must never grow. Lower the budget as the list is worked through.
//
// The editorial pass reported 547 on a stricter definition (numbers only) and 400 on a looser one. This
// measures 523 because it treats a tag, a club legacy or a per-player morale effect as a real
// differentiator — an option that grants one is not dominated even when its numbers are lower, because it
// buys something the other cannot. The budget is set to what THIS file measures, so the ratchet is exact
// rather than inherited from a slightly different question.
const DOMINATED_BUDGET = 523;

const AXES = ['squadMorale', 'boardMood', 'prestige', 'coins'] as const;
const vecOf = (o: any) => {
  const e = o?.effect ?? {};
  const v: Record<string, number> = {};
  for (const a of AXES) v[a] = Number(e[a] ?? 0);
  // A tag, a club legacy or a per-player morale effect is a real differentiator — an option that grants one
  // is not dominated even if its numbers are lower, because it buys something the other option cannot.
  v.extra = (e.tag ? 1 : 0) + (e.clubLegacy ? 1 : 0) + (e.playerMorale ? 1 : 0);
  return v;
};
let dominated = 0;
const worst: string[] = [];
for (const a of MANAGER_ARCS) for (const [bk, b] of Object.entries((a as any).beats ?? {})) {
  const opts = ((b as any).choices ?? (b as any).options ?? []) as any[];
  for (let i = 0; i < opts.length; i++) for (let j = 0; j < opts.length; j++) {
    if (i === j) continue;
    const x = vecOf(opts[i]), y = vecOf(opts[j]);
    const keys = [...AXES, 'extra'];
    const geAll = keys.every((k) => x[k] >= y[k]);
    const gtAny = keys.some((k) => x[k] > y[k]);
    if (geAll && gtAny) {
      dominated++;
      if (worst.length < 5) worst.push(`${(a as any).id}/${bk}: "${opts[i].label ?? i}" dominates "${opts[j].label ?? j}"`);
    }
  }
}
console.log(`\n=== Dominated options — ${dominated} pair(s), budget ${DOMINATED_BUDGET} ===`);
for (const w of worst) console.log(`  ${w}`);
if (dominated > DOMINATED_BUDGET) {
  console.log(`\n✗ ${dominated - DOMINATED_BUDGET} new dominated pair(s) — an option that is better on every axis and worse on none is not a choice`);
  process.exitCode = 1;
} else if (dominated < DOMINATED_BUDGET) {
  console.log(`\n✓ ${DOMINATED_BUDGET - dominated} fewer than the budget — lower DOMINATED_BUDGET to ${dominated} to lock the gain in`);
} else console.log('\n✓ no new dominated options');
