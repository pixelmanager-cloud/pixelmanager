// The match feed is the game's most-read text and was its thinnest: 159 lines against ~700 shown in a
// single match, i.e. every line about four times a game, identical across all ~180 matches of a manager
// career. Tracks the authored corpus and fails on duplicates. (content audit, 2026-08-30)
//
// The key list used to be typed out here, and it drifted the moment a new key was added: `red_card_second`
// was authored, wired, and invisible to this probe, which cheerfully reported the old total. Keys are now
// READ OUT OF THE CALL SITES, so a key can only be missed if nothing in the game draws it — and a key the
// authors wrote that no call site draws is itself reported, because those lines are dead weight.
import { readFileSync } from 'node:fs';
import { commentaryExtra, RAW_PACKS } from '../../shared/src/commentary/extra.js';

const src = readFileSync(new URL('../../client/src/main.ts', import.meta.url), 'utf8');
const KEYS = [...new Set([...src.matchAll(/\bcpickNR\([\s\S]*?,\s*\d+,\s*'([a-z_]+)'/g)].map((m) => m[1]))].sort();
if (KEYS.length < 15) { console.log(`⚠ only ${KEYS.length} commentary keys found in main.ts — the scrape has broken`); process.exitCode = 1; }

let total = 0;
const rows: Array<[string, number]> = [];
const seen = new Map<string, string>();
let dupes = 0;
for (const k of KEYS) {
  const lines = commentaryExtra(k);
  total += lines.length; rows.push([k, lines.length]);
  // DUPLICATES ARE CHECKED ON THE RAW PACKS, not on this. commentaryExtra() de-duplicates before it
  // returns, so the previous version of this probe fed itself already-clean output and printed a green
  // tick that could not have gone red under any input — while exact duplicates sat in the source files.
  for (const l of RAW_PACKS.flatMap((p) => p[k] ?? [])) {
    const n = l.toLowerCase().replace(/[^a-z0-9 {}]/g, '').replace(/\s+/g, ' ').trim();
    const prev = seen.get(n);
    if (prev) { console.log(`  DUPLICATE "${l.slice(0, 62)}"  (${k} — already in ${prev})`); dupes++; }
    else seen.set(n, k);
  }
}
rows.sort((a, b) => a[1] - b[1]);
console.log(`=== Match commentary — ${total} authored lines across ${KEYS.length} keys (base banks add ~159) ===`);
console.log('  thinnest events:');
for (const [k, n] of rows.slice(0, 8)) console.log(`    ${String(n).padStart(5)}  ${k}`);

// THE OTHER DIRECTION, which the header above promises and this file did not do. The loop only ever asks
// for keys it already scraped out of main.ts, so a bank opened under a key no cpickNR call draws was
// invisible here: the probe printed its cheerful total and a green tick over lines no player can ever be
// shown. That is the `red_card_second` miss pointing the other way. So enumerate the packs themselves.
const packKeys = [...new Set(RAW_PACKS.flatMap((p) => Object.keys(p)))].sort();
const orphans = packKeys.filter((k) => !KEYS.includes(k));
// Printed even when green, because a reconciliation of two sets is worthless if you cannot see that both
// were non-empty — nothing against nothing passes exactly as loudly as a real match.
console.log(`  ..   ${packKeys.length} authored key(s) in the packs vs ${KEYS.length} drawn by main.ts — ${orphans.length} orphaned`);
for (const k of orphans) {
  // Count in parentheses so the gate's norm() strips it: the KEY is the failure's identity, the line
  // total drifts with every edit to the pack.
  console.log(`  FAIL '${k}' is authored but no cpickNR call site draws it (${RAW_PACKS.flatMap((p) => p[k] ?? []).length} lines) — dead weight`);
}
if (orphans.length) process.exitCode = 1;

// Branch splits: an event that renders as two distinct beats has its bank divided by the leading icon,
// and a branch that ends up starved is a repetition bug that the flat total hides completely.
const BRANCHES: Array<[string, string, boolean]> = [['tackle_won', '⚡', false], ['tackle_won', '🦵', true]];
console.log('  branches:');
for (const [k, icon, neutral] of BRANCHES) {
  const n = commentaryExtra(k, { icon, neutral }).length;
  console.log(`    ${String(n).padStart(5)}  ${k} ${icon}${neutral ? ' (+un-iconed)' : ''}`);
  if (n < 40) { console.log(`      ⚠ starved branch — under 40 lines`); process.exitCode = 1; }
}
console.log(dupes ? `\n⚠ ${dupes} duplicate line(s)` : `\n✓ no duplicated commentary lines`);
if (dupes) process.exitCode = 1;
