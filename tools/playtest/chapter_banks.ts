// EVERY CHAPTER MUST BE FED. Six chapters had ~370 SETTINGS and ~335 FRAME lines; 'Youth Team' had 11 and
// 10, and 'First Team' the same — so 38 of the 120 career turns, a third of every playthrough, recycled
// twenty-one phrases while the rest drew on seven hundred. It went unseen because prompt_register.ts pools
// every bank into one array before measuring, and the pooled total looked magnificent.
//
// A bank is only as good as its THINNEST key. This measures per chapter and fails on a starved one.
import { SETTINGS } from '../../shared/src/prompts/settings.js';
import { FRAME_BY_CHAPTER } from '../../shared/src/prompts/frame.js';
import { AGE_BANDS } from '../../shared/src/career.js';

const rows = AGE_BANDS.map((b) => ({
  name: b.name, turns: b.turns,
  s: (SETTINGS as any)[b.name]?.length ?? 0,
  f: (FRAME_BY_CHAPTER as any)[b.name]?.length ?? 0,
}));
const medS = [...rows.map((r) => r.s)].sort((a, b) => a - b)[Math.floor(rows.length / 2)];
const medF = [...rows.map((r) => r.f)].sort((a, b) => a - b)[Math.floor(rows.length / 2)];

console.log('=== Per-chapter prompt banks ===');
console.log('chapter          turns  SETTINGS   FRAME   lines per turn');
let bad = 0;
for (const r of rows) {
  const starved = r.s < medS * 0.5 || r.f < medF * 0.5;
  if (starved) bad++;
  console.log(`${r.name.padEnd(15)} ${String(r.turns).padStart(5)}  ${String(r.s).padStart(8)}  ${String(r.f).padStart(6)}   ${((r.s + r.f) / r.turns).toFixed(0).padStart(4)}${starved ? '   <-- STARVED' : ''}`);
}
console.log(`\n  median: SETTINGS ${medS}, FRAME ${medF}`);
if (bad) { console.log(`\n✗ ${bad} chapter(s) below half the median — a third of a career can run on a handful of lines`); process.exitCode = 1; }
else console.log('\n✓ every chapter is fed');
