// THE FAMILY RECORD MUST CONTAIN THE FAMILY. The bloodline tree is the screen the whole dynasty fantasy
// is displayed on, and it is drawn from `api.bloodline()`.
//
// `succeed()` reworks the played token IN PLACE — same id, generation counter +1 — so after four
// generations the save holds exactly ONE token for the line you actually played. The forebears survive
// only as legend snapshots keyed `<id>:g<gen>`. A tree built from `tokens` alone therefore renders the
// living star and the brothers he was picked over, and omits his father, grandfather and the founder:
// the dynasty is missing from the dynasty screen.
//
// This drives the real facade through several generations and asserts the tree is a whole family:
//   1. every generation from the founder to the living star has a node on the played line
//   2. the founder is generation 0 (renderFamilyTree puts the lowest generation at the base of the page)
//   3. every non-founder node hangs off a parent exactly one generation above him
//
// Run: `npx tsx tools/playtest/bloodline_tree.ts [generations]`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend } from '../../client/src/save.js';
import { buildDynasty } from '../dev_dynasty_save.js';

const GENS = Math.max(2, Math.min(6, Number(process.argv[2] ?? 4)));
const fails: string[] = [];

async function main() {
  __setBackendForTests(createInMemoryBackend());
  const pid = await buildDynasty({ gens: GENS, familyName: 'Ashcombe', slot: 'probe-tree' });
  const { nodes } = await api.bloodline() as any;
  const byId = new Map(nodes.map((n: any) => [n.id, n]));

  // 1 — the played line is unbroken from the founder to the living star.
  const played = nodes.filter((n: any) => (n.branch ?? 'played') === 'played').sort((a: any, b: any) => a.generation - b.generation);
  console.log(`  tree has ${nodes.length} node(s); ${played.length} on the played line, generations [${played.map((n: any) => n.generation).join(', ')}]`);
  for (let g = 0; g < GENS; g++) {
    if (!played.some((n: any) => n.generation === g)) fails.push(`generation ${g} of the played line has no node — that man is missing from the Family Record`);
  }

  // 2 — the founder sits at generation 0, which is what puts him at the base of the drawing.
  if (played.length && played[0].generation !== 0) fails.push(`lowest played generation is ${played[0].generation}, not 0 — nobody is drawn at the root`);

  // 3 — lineage runs one generation at a time. A son hanging off a man of his own (or a later) generation
  //     draws a branch that runs sideways or backwards across the page.
  for (const n of nodes as any[]) {
    if (!n.parentId) { if (n.generation !== 0) fails.push(`${n.name} (gen ${n.generation}) has no father and is not the founder`); continue; }
    const p: any = byId.get(n.parentId);
    if (!p) { fails.push(`${n.name} (gen ${n.generation}) hangs off "${n.parentId}", which is not a node on this tree`); continue; }
    if (p.generation !== n.generation - 1) fails.push(`${n.name} is gen ${n.generation} but his father ${p.name} is gen ${p.generation} — the branch does not run one generation`);
  }

  // 4 — a retired forebear must caption. The medallion prints his legend tier; with no card he is a blank
  //     oval under a name, which reads as a rendering failure.
  for (const n of played as any[]) {
    if (n.generation < GENS - 1 && !n.legend?.tier) fails.push(`${n.name} (gen ${n.generation}) retired with no legend card — his medallion has no caption`);
  }

  // 5 — AND HE MUST KEEP HIS CAPS SENTENCE. `careerHonours` freezes ONE call-up line onto the token at
  //     graduation, and `rebornFields` then nulls `career_honours_json` — so unless `succeed()` folds that
  //     line onto the legend card beside the caps, it dies at the succession. The Family Record is the only
  //     permanent record this family has, and it was the one screen a full international's sentence could
  //     never appear on: it showed for the living star and for nobody who came before him.
  //     THE CAPPED COUNT IS ASSERTED FIRST. With nobody capped the loop below runs over an empty list and
  //     reports green having measured nothing, which is the shape of check this repo keeps being bitten by.
  const cappedForebears = (played as any[]).filter((n) => n.generation < GENS - 1 && Number(n.legend?.caps) > 0);
  const capSentence = (n: any) => n.honours?.capLine ?? n.legend?.capLine ?? null;
  console.log(`  ..   ${cappedForebears.length}/${GENS - 1} forebear(s) won caps; ${cappedForebears.filter(capSentence).length} still carry their call-up line`);
  if (!cappedForebears.length) fails.push(`no forebear of these ${GENS} generations was ever capped — the call-up check measured nothing`);
  for (const n of cappedForebears) {
    if (!capSentence(n)) fails.push(`${n.name} (gen ${n.generation}) won ${n.legend.caps} caps and his call-up line did not survive the succession`);
  }

  void pid;
  console.log(fails.length ? `\n  FAIL ${fails.length} problem(s):` : `\n  OK   the Family Record holds all ${GENS} generations, each hanging off his father`);
  for (const f of fails) console.log(`    - ${f}`);
  if (fails.length) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
