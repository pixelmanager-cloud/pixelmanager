// BRANCH SWITCHING, end to end through the real facade.
//
// shared/qa_branching.ts proves the arithmetic bounds the forest. It does not prove any of it is WIRED —
// that succeed() actually mints nephews, that a cousin can be taken on, that taking him moves the trunk,
// or that the branches left behind stop cluttering the prospect pool. Those are exactly the failures this
// project keeps producing: a system that is built, correct, and never called. So this runs three real
// generations and deliberately SWITCHES THE LINE onto a cousin at the last one.
import { api, __setBackendForTests } from './src/api.js';
import { createInMemoryBackend } from './src/save.js';
import { overall } from '@fm/shared';

__setBackendForTests(createInMemoryBackend());

let failures = 0;
const assert = (cond: boolean, msg: string) => {
  if (cond) console.log(`  ok   ${msg}`);
  else { console.log(`  FAIL ${msg}`); failures++; }
};

/** Play a card career start to finish, taking the first legal option every time. */
async function playCareer(id: string): Promise<void> {
  const { agents } = await api.careerAgents();
  let state = (await api.startCareer(id, agents[0].id)).state;
  for (let guard = 0; guard < 3000; guard++) {
    const phase = state.phase;
    const action = phase === 'arc' ? { type: 'arc', cardId: (state as any).arc.choices[0].id }
      : phase === 'focus' ? { type: 'focus', cardId: state.focus![0].id }
      : phase === 'offer' ? { type: 'offer', cardId: state.offers![0].id }
      : phase === 'coach' ? { type: 'coach', cardId: state.coaches![0].id }
      : phase === 'draft' ? { type: 'draft', cardId: state.options![0].id }
      : { type: 'play', cardId: state.hand![0].id };
    const r = await api.careerAct(id, action);
    if (r.graduated) return;
    state = r.state!;
  }
  throw new Error(`career ${id} never graduated`);
}

console.log('=== found the line ===');
// PIN THE WORLD. freshSave() seeds from Math.random(), so this suite drew a different world every run and
// the cousin assertion below failed roughly one run in eight — inside `npm run verify`, with no diff to
// explain it. Seeded, this is a real regression gate instead of a coin toss.
await api.register('ignored', 'ignored', 'Kestrel', 20260830, 'qa-branch-switch-slot');
const board = await api.scoutProspects(3);
await api.signProspect(board.candidates[0].seed);
let line = (await api.prospects()).prospects[0].id;

// Run generations until a cousin is offered, then TAKE HIM. Six is chosen against the measured rate: a
// given branch fathers nobody 70% of the time, so a two-generation run passes without ever exercising the
// switch — which is the one thing this file exists to test.
const GENS = 6;
let switched = false;
let maxCandidates = 0;
for (let g = 0; g < GENS; g++) {
  await playCareer(line);
  const s: any = await api.succeed(line, { seasons: 6, titles: g === 0 ? 1 : 0, mentorship: 1 });
  const cousins = s.siblings.filter((b: any) => b.cousin);
  const total = 1 + s.siblings.length;
  maxCandidates = Math.max(maxCandidates, total);
  console.log(`  gen ${g} → ${total} candidate(s), ${cousins.length} cousin(s)`);
  assert(total <= 7, `succession ${g} offered ${total} candidates — inside the cap`);
  assert(s.siblings.every((b: any) => b.temper && b.familyTrait && b.fatherName),
    `succession ${g}: every candidate carries a temperament, the family trait and whose son he is`);
  if (g === 0) assert(cousins.length === 0, 'the first succession cannot offer a cousin — nothing has been passed over yet');

  // A PERSON ON THE TREE MUST NEVER BECOME A BODY IN THE SQUAD. Retiring the passed-over branches put a
  // NaN player into the club per generation — they never played, so they have no attributes, and the
  // season header rendered "wage bill ~NaNc" while autoPickXI happily selected them. Cheap to check, and
  // the failure was invisible until someone summed a column.
  const squad = (await api.me()).club.players;
  const ghosts = squad.filter((p: any) => !Number.isFinite(overall(p)));
  assert(ghosts.length === 0,
    `succession ${g}: no unplayable ghost in the squad${ghosts.length ? ` (${ghosts.map((p: any) => p.name).join(', ')})` : ''}`);
  assert(squad.every((p: any) => p.age == null || Number.isFinite(p.age)), `succession ${g}: every squad player has a usable age`);

  const pool = (await api.prospects()).prospects;
  assert(pool.every((p: any) => p.generation === s.prospect.generation),
    `succession ${g}: the prospect pool holds only the current generation — passed-over branches are retired, not left as selectable boys`);

  if (cousins.length && !switched) {
    const target = cousins[0];
    const before: any = (await api.bloodline()).nodes.find((n: any) => n.id === target.id);
    assert(before?.branch === 'sibling', 'a candidate starts life as an unplayed branch');
    await api.startCareer(target.id, (await api.careerAgents()).agents[0].id);
    const after: any = (await api.bloodline()).nodes.find((n: any) => n.id === target.id);
    assert(after?.branch === 'played', 'TAKING HIM ON MOVES THE TRUNK: the cousin becomes the played line');
    assert(after?.parentId && after.parentId !== s.prospect.id,
      "the new line's father is the uncle, not the man who just retired");
    console.log(`  ↳ switched the line onto ${target.name}, ${target.fatherName}'s boy`);
    switched = true;
    line = target.id;
  } else {
    line = s.prospect.id;
  }
}
assert(switched, `a cousin was offered and taken within ${GENS} generations — the switch itself was exercised, not skipped`);

console.log('=== the record is a forest, not a chain ===');
const nodes = (await api.bloodline()).nodes;
const roots = nodes.filter((n: any) => !n.parentId);
assert(roots.length === 1, `exactly one root — the founder (got ${roots.length})`);
assert(nodes.every((n: any) => !n.parentId || nodes.some((p: any) => p.id === n.parentId)), 'every node hangs off a father that exists — no orphans on the tree');
assert(nodes.some((n: any) => n.branch === 'sibling'), 'the tree carries the branches, not just the played chain');
const names = nodes.map((n: any) => `${n.generation}|${n.name}`);
assert(new Set(names).size === names.length, `no two people on one rank share a name (${names.join(', ')})`);
console.log(`  (${nodes.length} people on the record after ${GENS} generations, widest succession ${maxCandidates})`);

console.log(failures ? `\n✗ ${failures} failure(s)` : '\n✓ branch switching works end to end');
if (failures) process.exitCode = 1;
