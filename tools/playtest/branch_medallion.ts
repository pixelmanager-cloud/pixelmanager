// A BROTHER THE GAME NEVER SIMULATED STILL HAS A CAREER, AND THE FAMILY RECORD HAS TO SHOW IT.
//
// `branchCareer` (shared/src/renown.ts) was written for exactly one man — the son you passed over — and its
// own comment says why: "the game never simulates his seasons, so without this he sits on the Family Record
// with a peak of zero and contributes nothing." It had ONE caller, `membersOf`, which is the renown scorer.
// So the Houses footer told the player "N% of it was earned by the sons you passed over" while the tree in
// the panel below drew those same men off `peak_overall` — 0, because nobody ever played those seasons —
// and renderFamilyTree gates the ability badge on `ovr > 0`. The result, on the one screen the dynasty
// exists to display: a face, a name and nothing else, for every brother the game had already priced.
//
// This drives the real facade through a dynasty and checks, for every man the succession retired without
// ever simulating a season of his:
//   1. that there is at least one of him — otherwise every check below is a green tick over an empty list
//   2. that the number renderFamilyTree computes for his badge (`legend?.peakOverall ?? overall`) is not 0
//   3. that it is the SAME number the Houses table already scores him at, so two panels of one screen
//      cannot tell the player different things about the same brother
//   4. and that a PROSPECT carrying a branch seed is left alone — `succeed()` stamps one onto the played
//      line's own newborn, and he must keep reading "yet to play" rather than wear a fabricated peak at ten
//
// MUTATION TEST — each must turn a line below red: put `t.peak_overall ?? 0` back as bloodline()'s `overall`
// (check 2); widen its guard from `state === 'retired'` to any token holding a branch seed (check 4); return
// some other number than branchCareer's peak (check 3). Check 1 is what stops the rest passing over nobody:
// if the harness ever stops producing passed-over brothers it goes red instead of reporting all-green.
//
// Run: `npx tsx tools/playtest/branch_medallion.ts [generations]`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, getActiveModel } from '../../client/src/save.js';
import { branchCareer } from '../../shared/src/renown.js';
import { buildDynasty } from '../dev_dynasty_save.js';

const GENS = Math.max(2, Math.min(6, Number(process.argv[2] ?? 3)));
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

async function main() {
  __setBackendForTests(createInMemoryBackend());
  await buildDynasty({ gens: GENS, familyName: 'Ashcombe', slot: 'probe-branch' });
  const { nodes } = await api.bloodline() as any;
  const houses: any = await api.houses();
  // The branch seed lives on the token; the node is what the renderer is handed. Both are needed to say
  // "this is a man whose career was derived, and this is the number his medallion will print".
  const tokenById = new Map<string, any>(getActiveModel().tokens.map((t: any) => [t.id, t]));
  const seedOf = (id: string) => ((tokenById.get(id)?.branch_seed ?? 0) >>> 0);
  // The exact expression renderFamilyTree computes for the badge, and the exact gate it draws it behind.
  const medallionOvr = (n: any) => Math.round(Number(n.legend?.peakOverall ?? n.overall) || 0);

  console.log('=== The Family Record shows the brothers it already scores ===');
  console.log(`  ..   ${GENS} generations, ${nodes.length} node(s); the house is worth ${houses.mine.renown}, of which ${houses.mine.fromBranches} was earned by passed-over sons`);

  // The men the game never simulated and never will. The succession bulk-retires a whole generation of
  // brothers and cousins at once, and they never graduate — so they carry no legend card and no honours.
  const unplayed = (nodes as any[]).filter((n) => tokenById.has(n.id) && n.state === 'retired' && !n.legend && !n.honours && seedOf(n.id) !== 0);
  console.log(`  ..   retired, no legend, no honours, branch seed present: ${unplayed.length ? unplayed.map((n) => `${n.name} (gen ${n.generation}, ${n.branch}) ovr ${medallionOvr(n)}`).join('; ') : '(none)'}`);
  ok(unplayed.length > 0, 'the dynasty produced at least one passed-over brother — the checks below are not measuring an empty list');

  const blank = unplayed.filter((n) => medallionOvr(n) === 0);
  console.log(`  ..   ${blank.length} of ${unplayed.length} would render with the ability badge suppressed`);
  ok(blank.length === 0, 'every passed-over brother carries an ability on his medallion — a man the Houses table has paid for is not a blank oval');

  const wrong = unplayed.filter((n) => medallionOvr(n) !== branchCareer(seedOf(n.id), tokenById.get(n.id).pedigree ?? 0).peakOverall);
  console.log(`  ..   ${wrong.length} disagree with branchCareer${wrong.length ? `: ${wrong.map((n) => `${n.name} tree ${medallionOvr(n)} vs scorer ${branchCareer(seedOf(n.id), tokenById.get(n.id).pedigree ?? 0).peakOverall}`).join('; ')}` : ''}`);
  ok(wrong.length === 0, 'the tree prints the same peak the renown scorer prices him at — the two panels read one man off one number');

  // THE OTHER DIRECTION, and the reason the guard is on `state` rather than on the seed: `succeed()` stamps
  // a branch seed onto the played line's own newborn, so a seed-only test would hang a derived peak on a boy
  // who has not kicked a ball — the medallion says "yet to play" for him, and that is the truth.
  const boys = (nodes as any[]).filter((n) => tokenById.has(n.id) && n.state === 'prospect' && seedOf(n.id) !== 0);
  const inflated = boys.filter((n) => Number(n.overall) !== Number(tokenById.get(n.id).peak_overall ?? 0));
  console.log(`  ..   prospects carrying a branch seed: ${boys.length ? boys.map((n) => `${n.name}=${n.overall}`).join(', ') : '(none)'}`);
  ok(boys.length > 0, 'the dynasty left at least one prospect holding a branch seed — the check below is not measuring an empty list');
  ok(inflated.length === 0, 'a boy who has not played is still shown at what he has actually reached, not at a career nobody watched');

  console.log(fails ? `\n✗ ${fails} problem(s) — the Family Record draws men the Houses table has already paid for` : '\n✓ every passed-over brother wears the career the game derived for him');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
