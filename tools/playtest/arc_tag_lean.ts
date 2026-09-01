// WHICH PLAYER DOES THE STORY LIBRARY BUILD? Every arc choice can lean an attribute, and those leans are
// the main way a career's identity is authored rather than rolled. If one tag takes most of them, every
// career converges on it whatever the player picks, and the choices stop meaning anything.
//
// It did: composure held 36.4% of all attribute awards against creativity's 5.5%, a 6.6x gap, and only 34%
// of composure awards had any composure cue in their own text. It was the default award -- what a choice
// got when nobody decided what it should give. A weight-only pass fixed it (see the commit): composure
// keeps full weight in the chapters it is ABOUT (youth_doubt, crisis) and wherever the prose earns it,
// and creativity/flair count double where a choice already awards them. No tag was ever REASSIGNED --
// keyword-matching prose to pick a tag is unreliable ("Not spectacular" reads as flair; "steadier than
// any drill" reads as stamina), so it is used only to protect, never to relabel.
import { readdirSync } from 'node:fs';

const CAP = 0.32;  // no single attribute may take more than this share of the library's leans

async function main() {
  const pos: Record<string, number> = {};
  let choices = 0;
  for (const f of readdirSync('shared/src/storyarcs').filter((x) => x.endsWith('.ts'))) {
    const mod: any = await import(`../../shared/src/storyarcs/${f.replace(/\.ts$/, '.js')}`);
    for (const arc of Object.values(mod).flat().filter((a: any) => a?.beats) as any[])
      for (const b of Object.values(arc.beats ?? {}) as any[])
        for (const c of b.choices ?? []) {
          choices++;
          for (const [k, v] of Object.entries(c.effect?.attr ?? {}))
            if ((v as number) > 0) pos[k] = (pos[k] ?? 0) + (v as number);
        }
  }
  const total = Object.values(pos).reduce((a, b) => a + b, 0);
  const rows = Object.entries(pos).sort((a, b) => b[1] - a[1]);
  console.log(`=== Arc attribute lean — ${choices} choices, +${total} awarded ===`);
  let fails = 0;
  for (const [k, v] of rows) {
    const share = v / total;
    const over = share > CAP;
    if (over) fails++;
    console.log(`  ${over ? 'FLAG' : '    '} ${k.padEnd(12)} +${String(v).padStart(4)}  ${(share * 100).toFixed(1)}%`);
  }
  // The spread matters as much as the peak: keeping is goalkeeper-only and legitimately tiny, so the
  // ratio is taken across the outfield tags only.
  const out = rows.filter(([k]) => k !== 'keeping').map(([, v]) => v);
  const ratio = out[0] / out[out.length - 1];
  console.log(`  top-to-bottom outfield ratio ${ratio.toFixed(1)}x`);
  console.log(fails ? `\n⚠ ${fails} attribute(s) above the ${CAP * 100}% cap — the library builds one player`
    : `\n✓ no attribute dominates the library's leans`);
  if (fails) process.exitCode = 1;
}
void main();
