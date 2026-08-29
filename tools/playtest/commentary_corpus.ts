// The match feed is the game's most-read text and was its thinnest: 159 lines against ~700 shown in a
// single match, i.e. every line about four times a game, identical across all ~180 matches of a manager
// career. Tracks the authored corpus and fails on duplicates. (content audit, 2026-08-30)
import { commentaryExtra } from '../../shared/src/commentary/extra.js';
const KEYS = ['kickoff','goal','chance','shot_saved','shot_missed','tackle_won','fatigue','woodwork','loose_ball','foul','yellow_card','red_card','free_kick','penalty','penalty_missed','corner','injury','sub','momentum','lull'];
let total = 0;
const rows: Array<[string, number]> = [];
const seen = new Map<string, string>();
let dupes = 0;
for (const k of KEYS) {
  const lines = commentaryExtra(k);
  total += lines.length; rows.push([k, lines.length]);
  for (const l of lines) {
    const n = l.toLowerCase().replace(/[^a-z0-9 {}]/g, '').replace(/\s+/g, ' ').trim();
    const prev = seen.get(n);
    if (prev) { console.log(`  DUPLICATE "${l.slice(0, 62)}"  (${k} — already in ${prev})`); dupes++; }
    else seen.set(n, k);
  }
}
rows.sort((a, b) => a[1] - b[1]);
console.log(`=== Match commentary — ${total} authored lines (base banks add ~159) ===`);
console.log('  thinnest events:');
for (const [k, n] of rows.slice(0, 8)) console.log(`    ${String(n).padStart(5)}  ${k}`);
console.log(dupes ? `\n⚠ ${dupes} duplicate line(s)` : `\n✓ no duplicated commentary lines`);
if (dupes) process.exitCode = 1;
