// ── DOES THE CHOICE COST ANYTHING? ───────────────────────────────────────────────────────────────────
// A story beat where every branch is a win is not a choice, it is a menu. This counts beats where NOT ONE
// option carries a cost — a negative number anywhere in its effect, an injury, or a greed increase.
//
// Measured when this was written: 295 of 735 multi-choice player-arc beats (40.1%), concentrated hard in
// the celebratory banks — signature 81%, triumph 76% — while the manager library, written later, sits at
// 2.6%. So this is not a house style; it is one authoring wave that drifted, and the rest of the game
// already demonstrates the standard.
import { ARCS } from '../../shared/src/storyarc.js';
import { MANAGER_ARCS } from '../../shared/src/managerarc.js';

const costOf = (e: any): boolean => {
  if (!e) return false;
  if (e.injury) return true;
  if (typeof e.greed === 'number' && e.greed > 0) return true;   // wanting more IS the cost
  for (const [k, v] of Object.entries(e)) {
    if (typeof v === 'number' && v < 0) return true;
    if (v && typeof v === 'object' && k !== 'clubLegacy') {
      for (const n of Object.values(v as Record<string, unknown>)) if (typeof n === 'number' && n < 0) return true;
    }
  }
  return false;
};

function survey(label: string, lib: any[]) {
  const byCat: Record<string, { total: number; free: number }> = {};
  let total = 0, free = 0;
  const worst: string[] = [];
  for (const a of lib) {
    const cat = a.category ?? 'manager';
    for (const b of Object.values(a.beats ?? {}) as any[]) {
      const choices = b.choices ?? [];
      if (choices.length < 2) continue;
      total++;
      byCat[cat] ??= { total: 0, free: 0 };
      byCat[cat].total++;
      if (!choices.some((c: any) => costOf(c.effect))) {
        free++; byCat[cat].free++;
        if (worst.length < 12) worst.push(`${a.id}/${b.id}`);
      }
    }
  }
  console.log(`\n[arc-stakes] ${label}: ${free}/${total} beats have NO cost on ANY branch (${(100 * free / total).toFixed(1)}%)`);
  for (const [cat, v] of Object.entries(byCat).sort((a, b) => (b[1].free / b[1].total) - (a[1].free / a[1].total))) {
    console.log(`   ${cat.padEnd(14)} ${String(v.free).padStart(3)}/${String(v.total).padStart(3)}  ${(100 * v.free / v.total).toFixed(0)}%`);
  }
  return { free, total, worst };
}

const player = survey('player arcs', ARCS as any[]);
const manager = survey('manager arcs', MANAGER_ARCS as any[]);
if (player.worst.length) console.log(`\n   first costless player beats: ${player.worst.join(', ')}`);
console.log(`\n${player.free ? `⚠ ${player.free} player beat(s) ask for a decision and charge nothing for it` : '✓ every multi-choice beat costs something on at least one branch'}`);
