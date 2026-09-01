// A CHOICE WITHOUT A COST IS NOT A DECISION. If no option in a beat gives anything up, the player reads
// the effects, takes the biggest number and moves on -- the beat is a reading comprehension exercise with
// a reward attached. `youth_joy.ts` was 16 of its 25 multi-choice beats costless (64%) against 4.4% for
// the library, because a children's chapter felt like the wrong place for a price. It was not: a child
// pays in standing and attention rather than money, and choosing one thing is choosing not to be another.
//
// Guards the shape, not the number: a file may sit well above the library average and still be authored
// well, so the bar is deliberately loose. It exists to catch a whole file drifting back to free picks.
import { readdirSync } from 'node:fs';

const LIMIT = 0.30; // share of a file's multi-choice beats that may be entirely costless

const costs = (e: any): boolean => {
  if (!e) return false;
  if (e.injury) return true;
  for (const k of ['energy', 'form', 'earnings', 'market'] as const) if ((e[k] ?? 0) < 0) return true;
  for (const v of Object.values(e.meters ?? {})) if ((v as number) < 0) return true;
  for (const v of Object.values(e.attr ?? {})) if ((v as number) < 0) return true;
  return false;
};

async function main() {
  const rows: Array<{ f: string; multi: number; free: number; worst: string[] }> = [];
  for (const f of readdirSync('shared/src/storyarcs').filter((x) => x.endsWith('.ts'))) {
    const mod: any = await import(`../../shared/src/storyarcs/${f.replace(/\.ts$/, '.js')}`);
    const arcs = Object.values(mod).flat().filter((a: any) => a?.beats) as any[];
    let multi = 0, free = 0; const worst: string[] = [];
    for (const arc of arcs) for (const b of Object.values(arc.beats ?? {}) as any[]) {
      if ((b.choices ?? []).length < 2) continue;
      multi++;
      if (!b.choices.some((c: any) => costs(c.effect))) { free++; worst.push(`${arc.id}/${b.id}`); }
    }
    if (multi) rows.push({ f, multi, free, worst });
  }
  rows.sort((a, b) => b.free / b.multi - a.free / a.multi);
  let tm = 0, tf = 0, fails = 0;
  console.log('=== Choice cost — multi-choice beats where NO option costs anything ===');
  for (const r of rows) {
    tm += r.multi; tf += r.free;
    const share = r.free / r.multi;
    if (share > LIMIT) {
      fails++;
      console.log(`  FLAG ${r.f} — ${r.free}/${r.multi} beats (${(share * 100).toFixed(0)}%) offer no cost at all`);
      for (const w of r.worst.slice(0, 6)) console.log(`         ${w}`);
    }
  }
  console.log(`  library: ${tf}/${tm} costless (${(100 * tf / tm).toFixed(1)}%), worst file ${rows[0].f} at ${(100 * rows[0].free / rows[0].multi).toFixed(0)}%`);
  console.log(fails ? `\n⚠ ${fails} arc file(s) above the ${LIMIT * 100}% bar — free picks, not decisions`
    : `\n✓ no arc file is mostly free picks`);
  if (fails) process.exitCode = 1;
}
void main();
