// THE SON YOU PLAY MUST LOOK LIKE HIS BROTHERS.
//
// mintHeirs models a family on purpose: every attribute gets a family MEAN shared by all the brothers, plus
// a per-child deviation that is deliberately tiny on the family attribute and wide on the others — "the
// family attribute regresses far LESS from the father than the others do, that is what makes it the
// family's, rather than merely a trait the brothers happen to share" (shared/src/bloodline.ts).
//
// It mints nHeirs of them and the succession's sibling loop consumes heirs[1..n-1], because heirs[0] IS the
// played heir. But his genes used to come from rebornFields' own plain inheritGenes roll, so every brother
// carried the family attribute and the boy the player actually embodies did not — the model missing at
// exactly its centre, and invisible because he still had perfectly reasonable-looking genes.
//
// Measured, not read: across many successions, how far is the played heir from his brothers' mean on the
// FAMILY attribute, versus on the other two?
//
// Run: `npx tsx tools/playtest/family_resemblance.ts [successions]`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, localStore } from '../../client/src/save.js';
import { buildDynasty } from '../dev_dynasty_save.js';

const N = Math.max(3, Math.min(20, Number(process.argv[2] ?? 8)));
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const mid = (g: any) => ((g?.floor ?? 0) + (g?.ceiling ?? 0)) / 2;

async function main() {
  console.log('=== The played heir carries the family attribute ===');
  const famGaps: number[] = [], otherGaps: number[] = [];
  let dynastiesWithBrothers = 0;
  for (let run = 0; run < N; run++) {
    __setBackendForTests(createInMemoryBackend());
    // Four generations, not two: heirCount legitimately returns 1 at the early successions, so a shallow
    // dynasty produces no brothers at all and this measures nothing.
    const pid = await buildDynasty({ gens: 4, familyName: 'Ashcombe', slot: `fam-${run}` });
    const played = await localStore.getToken(pid);
    const gen = (played as any)?.generation ?? 0;
    // Read the brothers through localStore by their id convention rather than through getActiveModel().
    // A dynamic import of save.js inside a tsx-run probe hands back a SEPARATE module instance with its own
    // empty model — getActiveModel() reported zero tokens while localStore.getToken on the same ids worked.
    // Same specifier, two module records; the mixed static/dynamic import is what splits them.
    const brothers: any[] = [];
    for (let i = 1; i <= 4; i++) {
      const b2 = await localStore.getToken(`${pid}:b${gen}.${i}`);
      if (b2) brothers.push(b2);
    }
    if (!played || brothers.length < 2) continue;
    dynastiesWithBrothers++;

    const pg = JSON.parse((played as any).genes_json);
    const bg = brothers.map((b: any) => JSON.parse(b.genes_json));
    // WHICH attribute is the family's is identified from the brothers themselves — it is by construction
    // the one they agree on most. Recomputing it from a seed means reproducing succeed()'s exact seed
    // derivation, and getting that subtly wrong would silently compare the wrong column.
    const spread = (attr: string) => {
      const vals = bg.map((g: any) => mid(g[attr]));
      const m = vals.reduce((x: number, y: number) => x + y, 0) / vals.length;
      return vals.reduce((s: number, v: number) => s + Math.abs(v - m), 0) / vals.length;
    };
    const attrs = ['pace', 'strength', 'stamina'] as const;
    const fam = [...attrs].sort((a3, b3) => spread(a3) - spread(b3))[0];
    for (const attr of attrs) {
      const bmean = bg.reduce((s: number, g: any) => s + mid(g[attr]), 0) / bg.length;
      (attr === fam ? famGaps : otherGaps).push(Math.abs(mid(pg[attr]) - bmean));
    }
  }
  console.log(`  ..   ${dynastiesWithBrothers}/${N} dynasties produced two or more brothers to compare against`);

  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  const f = avg(famGaps), o = avg(otherGaps);
  console.log(`  ..   ${famGaps.length} family-attribute samples, ${otherGaps.length} other-attribute samples`);
  console.log(`  ..   played heir's distance from his brothers' mean: family ${f.toFixed(2)}, other ${o.toFixed(2)}`);
  ok(famGaps.length >= 3, 'enough successions produced brothers to measure (this is not an empty check)');
  ok(f < o, `he resembles his brothers MORE on the family attribute than on the others (${f.toFixed(2)} < ${o.toFixed(2)})`);

  console.log(fails ? `\n✗ ${fails} failure(s) — the played heir is not part of his own family` : '\n✓ the boy you play looks like his brothers');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
