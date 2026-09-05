// TWO MEN ON ONE RANK, BOTH DRAWN AS THE LINE YOU PLAYED.
//
// The succession screen's second offer — "or, from the brother you passed over" — runs `startCareer` on
// that brother's token, and that call is what moves the trunk onto him. It flipped HIM to 'played' and
// left the boy he was chosen over exactly as he was. The trunk heir is the one candidate on the rank that
// is not minted as a sibling: `succeed()` reworks the father's own token in place and `createToken`
// stamped `branch: 'played'` on it at birth. So the rank ended up holding two 'played' men, and the
// Family Record reads that field twice:
//
//   main.ts  `const cls = n.branch === "sibling" ? " fr-sib" : "";`   → nobody is drawn paler, against
//            the screen's own footer, "Sons who were passed over are shown paler"
//   main.ts  `const playedAt = row.findIndex((n) => n.branch !== 'sibling');`  → a findIndex takes the
//            FIRST of the two, which is the boy the player declined; he is placed on the trunk centre-line
//            and the line actually taken is pushed off to one side
//
// This drives the real facade through a succession, TAKES A BROTHER, and asserts what the renderer would
// compute from the nodes it is handed:
//   1. the succession offered somebody to take, and the rank holds more than one man  — without both of
//      these every check below is a green tick over a list of one
//   2. exactly one man on that rank is not drawn paler
//   3. and he is the man whose career was actually started
//   4. the demoted man still hangs off a father that exists, and the tree still has ONE root — demoting
//      him moves his `parentId` onto the sibling arm, and the played line's token id carries a null
//      `parent_id` by construction, so a demotion alone would cut his branch off the drawing entirely
//
// MUTATION TEST — each must turn a line below red: drop the demotion in `startCareer` (checks 2 and 3 go
// red, and 4 stays green because nothing moved); keep the demotion but revert the `lastAncestorOf`
// fallback in `bloodline()`'s `parentId` (check 4 alone goes red, at two roots); put back the
// `&& o.career_seed == null` the demotion used to be guarded on (the first pass stays green and only the
// SECOND goes red, which is the whole reason that pass exists); demote the developed man but score
// `played` off `branch` alone in `membersOf` (only the second pass's renown line goes red, measured
// 1331 -> 1320). Check 1 is what stops the rest passing over an empty rank if the succession ever stops
// offering brothers.
//
// Run: `npx tsx tools/playtest/branch_switch_demotes.ts`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend } from '../../client/src/save.js';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

function bestCard(s: any): string {
  const dem = s.scenario?.demand ?? {};
  let best = s.hand[0], bestScore = -Infinity;
  for (const c of s.hand) {
    let score = 0;
    for (const [tag, w] of Object.entries(dem)) score += (Number((c.tags ?? {})[tag]) || 0) * Number(w);
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return best.id;
}
/** Play the card career to graduation, taking the best-fitting card each turn. */
async function playCareer(pid: string): Promise<void> {
  for (let guard = 0; guard < 4000; guard++) {
    const { state } = await api.getCareer(pid) as any;
    if (!state || state.finished) return;
    const s: any = state;
    const act = s.phase === 'arc' ? { type: 'arc', cardId: s.arc.choices[0].id }
      : s.phase === 'focus' ? { type: 'focus', cardId: s.focus[0].id }
      : s.phase === 'offer' ? { type: 'offer', cardId: s.offers[0].id }
      : s.phase === 'coach' ? { type: 'coach', cardId: s.coaches[0].id }
      : s.phase === 'draft' ? { type: 'draft', cardId: s.options[0].id }
      : { type: 'play', cardId: bestCard(s) };
    const r: any = await api.careerAct(pid, act);
    if (r.graduated) return;
  }
  throw new Error(`career ${pid} never graduated`);
}

async function main() {
  __setBackendForTests(createInMemoryBackend());
  console.log('=== taking a brother takes the other man off the line ===');
  await api.register('dynasty', 'x', 'Ashcombe', 20260902, 'probe-branch-demote');
  const board: any = await api.scoutProspects(3);
  let line = (await api.signProspect(board.candidates[0].seed) as any).prospect.id;

  // Run successions until one offers a brother or a cousin, then TAKE HIM — that click is the whole
  // subject of this probe, so a run that never gets to make it has to say so rather than report green.
  let taken: any = null, trunk = '', rank = 0, offered = 0;
  for (let g = 0; g < 4 && !taken; g++) {
    await api.startCareer(line, null);
    await playCareer(line);
    const s: any = await api.succeed(line, { seasons: 5, titles: 1, cups: 0, mentorship: 2, inheritance: 'name' });
    offered = s.siblings.length;
    line = s.prospect.id;
    if (offered) {
      taken = s.siblings[0]; trunk = s.prospect.id; rank = s.prospect.generation;
      await api.startCareer(taken.id, null);
    }
  }
  console.log(`  ..   generation ${rank}: ${offered + 1} candidate(s) on the rank; took ${taken ? `${taken.name} (${taken.id})` : '(nobody)'} over the trunk heir ${trunk}`);
  ok(!!taken, 'a succession offered a brother and the line was moved onto him — the switch itself was exercised');
  if (!taken) { console.log('\n✗ nothing was taken, so nothing below was measured'); process.exitCode = 1; return; }

  const { nodes } = await api.bloodline() as any;
  const row = (nodes as any[]).filter((n) => (n.generation ?? 0) === rank);
  console.log(`  ..   rank ${rank} holds ${row.length} node(s): ${row.map((n) => `${n.name} [${n.branch}]`).join(', ')}`);
  ok(row.length > 1, 'that rank holds more than one man — "exactly one of them is the line" is not a statement about a list of one');

  // The two expressions renderFamilyTree computes off `branch`, run here on the same nodes it is handed.
  const onTheLine = row.filter((n) => n.branch !== 'sibling');
  console.log(`  ..   ${onTheLine.length} of ${row.length} would be drawn at full opacity: ${onTheLine.map((n) => n.name).join(', ')}`);
  ok(onTheLine.length === 1, 'exactly one man on the rank is drawn as the played line — the rest are the road not taken, and are drawn paler');

  const centred = row[row.findIndex((n) => n.branch !== 'sibling')];
  console.log(`  ..   the trunk centre-line would be given to ${centred?.name} (${centred?.id}); the career started is ${taken.id}`);
  ok(centred?.id === taken.id, 'the man on the trunk centre-line is the man whose career the player actually started');

  // Demoting him moves his parentId onto the sibling arm, and the played line's token id has a null
  // parent_id by construction — so without a fallback he comes back fatherless and the renderer, which
  // draws a branch only when both ends are placed, leaves him as a medallion with no line to his father.
  const byId = new Map((nodes as any[]).map((n) => [n.id, n]));
  const roots = (nodes as any[]).filter((n) => !n.parentId);
  const demoted: any = byId.get(trunk);
  console.log(`  ..   the man passed over (${demoted?.name}) hangs off ${demoted?.parentId ?? 'NOBODY'}; the tree has ${roots.length} root(s): ${roots.map((n: any) => `${n.name} gen ${n.generation}`).join(', ')}`);
  ok(!!demoted?.parentId && byId.has(demoted.parentId) && (byId.get(demoted.parentId) as any).generation === rank - 1,
    'the man passed over still hangs off his father, one rank below — a demotion must not cut his branch off the drawing');
  ok(roots.length === 1, `the record still has one root, the founder (got ${roots.length})`);

  // ── THE SAME SWITCH, ON AN HEIR THE PLAYER HAD ALREADY DEVELOPED ────────────────────────────────────
  //
  // Everything above takes the brother while the trunk heir is still an untouched boy, and the demotion
  // was guarded on exactly that shape: `o.career_seed == null`. Both the Academy list and the hub invite
  // the heir to be developed FIRST and reconsidered at the brother afterwards, and that order walked
  // straight past the guard — two 'played' men on the rank again, and findIndex handing the trunk
  // centre-line to the boy whose career had just been abandoned. A probe that exercises one shape of a
  // case is how a fix stays green while the failure it was written for is still one click away.
  //
  // The demotion also has to be FREE. This man's career is one the player actually lived, so moving him
  // off the trunk must not reprice him as a notional passed-over branch at BRANCH_SHARE: that is renown
  // falling at the succession, which the Houses screen promises cannot happen.
  const renown = async () => Math.round(((await api.houses()) as any).mine.renown);
  let line2 = taken.id, taken2: any = null, trunk2 = '', rank2 = 0, before = 0, after = 0;
  for (let g = 0; g < 4 && !taken2; g++) {
    await api.startCareer(line2, null);
    await playCareer(line2);
    const s: any = await api.succeed(line2, { seasons: 5, titles: 1, cups: 0, mentorship: 2, inheritance: 'name' });
    line2 = s.prospect.id;
    if (s.siblings.length) {
      taken2 = s.siblings[0]; trunk2 = s.prospect.id; rank2 = s.prospect.generation;
      // THE WHOLE DIFFERENCE FROM THE PASS ABOVE: the trunk heir's career is started and played out
      // before the player changes his mind, so by the time the brother is taken he carries a career_seed
      // and a record of his own — which is what the old guard read as "leave this one on the line".
      await api.startCareer(trunk2, null);
      await playCareer(trunk2);
      before = await renown();
      await api.startCareer(taken2.id, null);
      after = await renown();
    }
  }
  console.log(`  ..   generation ${rank2}: took ${taken2 ? `${taken2.name} (${taken2.id})` : '(nobody)'} over ${trunk2 || '(nobody)'}, whose career had already been played out`);
  ok(!!taken2, 'a later succession offered a brother and the line moved onto him AFTER the trunk heir was developed');
  if (!taken2) { console.log('\n✗ the developed-heir order was never reached, so nothing below was measured'); process.exitCode = 1; return; }

  const row2 = ((await api.bloodline() as any).nodes as any[]).filter((n) => (n.generation ?? 0) === rank2);
  console.log(`  ..   rank ${rank2} holds ${row2.length} node(s): ${row2.map((n) => `${n.name} [${n.branch}]`).join(', ')}`);
  ok(row2.length > 1, 'that rank holds more than one man — again, "exactly one of them is the line" must not be a statement about a list of one');
  const onTheLine2 = row2.filter((n) => n.branch !== 'sibling');
  console.log(`  ..   ${onTheLine2.length} of ${row2.length} would be drawn at full opacity: ${onTheLine2.map((n) => n.name).join(', ')}`);
  ok(onTheLine2.length === 1, 'an heir who was developed and then passed over comes off the line like any other brother');
  const centred2 = row2[row2.findIndex((n) => n.branch !== 'sibling')];
  console.log(`  ..   the trunk centre-line would be given to ${centred2?.name} (${centred2?.id}); the career started is ${taken2.id}`);
  ok(centred2?.id === taken2.id, 'the trunk centre-line is the man taken, not the developed boy the player declined');
  console.log(`  ..   the house was worth ${before} before that switch and ${after} after it`);
  ok(before > 0 && after >= before, `taking the brother does not shrink the house (${before} -> ${after}) — the demoted man's career was lived, not notional`);

  console.log(fails ? `\n✗ ${fails} problem(s) — the Family Record draws two men as one line` : '\n✓ taking a brother moves the trunk onto him and takes the other man off it');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
