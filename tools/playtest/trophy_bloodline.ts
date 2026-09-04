// ONE FAMILY IS ONE BLOODLINE, EVEN AFTER YOU TAKE A BROTHER.
//
// The branching bloodline is the headline of the dynasty: at a succession you may take a brother or a
// cousin instead of the son the game pre-selects. Doing that CHANGES THE PLAYED TOKEN ID — `nft:1` becomes
// `nft:1:b3.1`, a nephew becomes `<uncle>.n0` — while the man is still the next generation of the same
// family. `legends()` keyed its rows on that token id (`player_id.split(':g')[0]`) and the Trophy Room
// groups its bloodline chains on that key, so from the switch onwards one house was drawn as TWO unrelated
// lines under the same surname, the hub line printed "🌳 2 bloodlines", and the second chain's generation
// labels restarted at 1: men the prospect card and the academy list both call gen 2-5 were captioned
// "Generation 1..4", one generation short each. `heirlooms` is keyed by the REAL generation
// (`recordHeirloom`), so the same off-by-one hung the previous generation's inheritance on every one of them.
//
// This drives the real facade through several successions, deliberately switching the line the first time a
// brother or a cousin is offered, and then evaluates the Trophy Room's OWN expressions — lifted out of
// client/src/main.ts and run against the rows `legends()` actually returns — rather than a re-implementation
// of them, which could drift green while the screen stayed wrong.
//
// WHY THE INDEX CHECK IS SEPARATE FROM THE LABEL CHECK. Once the grouping is fixed the family is one
// unbroken chain again, and a chain index then HAPPENS to equal the generation — so a caption numbered off
// the index passes the label check by coincidence, and the coincidence breaks the moment one line root
// holds two men of one generation (measured: the facade lets you develop the son you passed over as well as
// the brother you took, and both write a `:g1` legend row). The last check therefore asserts the property
// directly: shift the chain index and nothing on the node may move.
//
// MUTATION TEST — each of these must turn a named line below red:
//   * put `player_id.split(':g')[0]` back as the legends() key (the bug)   → checks 4 and 8
//   * caption the node off the chain index again (`Generation ${gi + 1}`)  → check 7 (and check 5 only
//     while the grouping is also broken, which is why check 7 exists)
//   * read `heirlooms[gi]` again                                           → check 7 (check 6 likewise)
//   * checks 1-3 are what stop the rest reporting green over nothing: 1 goes red if this harness ever
//     stops moving the line onto a branch, 2 if the expressions can no longer be found in main.ts, 3 if a
//     legend row can no longer be matched back to the generation its token actually carried.
//
// Run: `npx tsx tools/playtest/trophy_bloodline.ts [generations]`
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, getActiveModel } from '../../client/src/save.js';

// `new URL(...).pathname` is percent-encoded and this repo lives under a path with a space in it, so that
// spelling hands readFileSync a directory called `Clause%20Coding` — field_wiring.ts died on it first.
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const GENS = Math.max(3, Math.min(8, Number(process.argv[2] ?? 5)));
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

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

async function main() {
  console.log('=== One family, one bloodline, after the line moves onto a branch ===');

  // ── the dynasty, played for real through the offline facade ────────────────────────────────────────
  __setBackendForTests(createInMemoryBackend());
  await api.register('dynasty', 'x', 'Ashcombe', 20260830, 'probe-trophy-line');
  const board = await api.scoutProspects(3);
  await api.signProspect(board.candidates[0].seed);
  let line = (await api.prospects()).prospects[0].id;

  // The truth every check below is measured against, read off the token BEFORE `succeed()` renames it and
  // advances its generation counter. Keyed the way a legend row can be found again — the man's name and the
  // season he retired in — so that nothing in it comes from the code under test.
  const realGen = new Map<string, number>();
  const switchedTo: string[] = [];
  for (let g = 0; g < GENS; g++) {
    await playCareer(line);
    // SEASONS HAVE TO PASS. `legaciesFor` sorts newest-first and the Trophy Room sorts the chain back by
    // `retiredSeason`, so a run where every man retires in season 0 would draw the spine upside down and
    // every generation check below would be measuring an artefact of this harness.
    for (let s = 0; s < 3; s++) {
      await api.spSeasonReward({ pos: g === 0 ? 3 : 1, size: 14, wins: 18, draws: 8, losses: 12, tier: 2, starId: line, kind: 'league' });
    }
    const t: any = getActiveModel().tokens.find((x: any) => x.id === line);
    realGen.set(`${t.name}|${getActiveModel().profile.season}`, t.generation ?? 0);
    const s: any = await api.succeed(line, { seasons: 3, titles: g === 0 ? 1 : 0, mentorship: 1, inheritance: 'name' });
    // TAKE THE BRANCH the first time one is offered — a cousin for preference, a brother otherwise. This is
    // the one player decision the whole finding hangs on, and a run that never makes it proves nothing.
    const branch = (s.siblings ?? []).find((b: any) => b.cousin) ?? (s.siblings ?? [])[0];
    if (branch && !switchedTo.length) {
      await api.startCareer(branch.id, (await api.careerAgents()).agents[0].id);
      switchedTo.push(branch.id);
      line = branch.id;
    } else {
      line = s.prospect.id;
    }
  }

  const { legends } = await api.legends() as any;
  const rawIds = getActiveModel().legacies.map((l: any) => l.playerId);
  console.log(`  ..   ${GENS} successions; legend rows written under ${JSON.stringify(rawIds)}`);
  console.log(`  ..   the line moved onto ${switchedTo.length ? switchedTo.join(', ') : '(nothing — it stayed on the trunk)'}`);
  ok(switchedTo.length === 1 && legends.length === GENS && new Set(rawIds.map((id: string) => id.split(':g')[0])).size === 2,
     `the family really did move onto a branch: ${GENS} legend rows under 2 different token ids — nothing below is measuring one unbroken chain`);

  // ── the screen's own expressions, lifted out of main.ts ─────────────────────────────────────────────
  // Re-implementing the grouping here would let this probe stay green while the Trophy Room stayed wrong,
  // which is the failure this repo keeps producing. These are the real ones.
  const src = readFileSync(ROOT + 'client/src/main.ts', 'utf8');
  const pick = (re: RegExp) => src.match(re)?.[1]?.trim() ?? '';
  const keyExpr = pick(/byLine\.get\(([^)]+)\)/);                               // the bloodline grouping key
  const labelExpr = pick(/bt-genlbl">Generation \$\{([^}]+)\}/);                // the node's generation caption
  const heirExpr = pick(/heirlooms\[([^\]]+)\]/);                               // which generation's heirloom
  const hubExpr = pick(/new Set\(l\.legends\.map\(\(x\) => ([^)]+)\)\)\.size/); // the hub's bloodline count
  console.log(`  ..   main.ts groups on \`${keyExpr}\`, captions \`Generation ${labelExpr}\`, reads \`heirlooms[${heirExpr}]\`, hub counts \`${hubExpr}\``);
  ok(!!(keyExpr && labelExpr && heirExpr && hubExpr),
     'all four Trophy Room expressions were found in client/src/main.ts — a probe that cannot find them measures nothing');
  if (fails) { console.log(`\n✗ ${fails} problem(s)`); process.exitCode = 1; return; }

  const keyOf = new Function('l', `return (${keyExpr});`) as (l: any) => string;
  const labelOf = new Function('l', 'gi', `return (${labelExpr});`) as (l: any, gi: number) => number;
  const heirIdxOf = new Function('l', 'gi', `return (${heirExpr});`) as (l: any, gi: number) => number;
  const hubKeyOf = new Function('x', `return (${hubExpr});`) as (x: any) => string;
  const genOf = (l: any) => realGen.get(`${l.name}|${l.retiredSeason}`);

  ok(realGen.size === GENS && legends.every((l: any) => genOf(l) != null),
     `every legend row was matched back to the generation its token actually carried (${legends.filter((l: any) => genOf(l) != null).length}/${legends.length})`);

  // main.ts's own grouping and ordering, run over the rows the facade really returned.
  const byLine = new Map<string, any[]>();
  for (const l of legends) { const arr = byLine.get(keyOf(l)) ?? []; arr.push(l); byLine.set(keyOf(l), arr); }
  const chains = [...byLine.values()].map((c) => c.slice().sort((a, b) => a.retiredSeason - b.retiredSeason));
  for (const [k, chain] of byLine) console.log(`  ..   chain "${k}": ${chain.length} node(s), real generations [${chain.map((l: any) => genOf(l)).sort((a: number, b: number) => a - b).join(', ')}]`);
  ok(byLine.size === 1, `the Trophy Room draws this house as ONE bloodline (it draws ${byLine.size})`);

  const mislabelled = chains.flatMap((chain) => chain
    .map((l: any, i: number) => ({ l, want: (genOf(l) ?? 0) + 1, got: labelOf(l, i) }))
    .filter((x) => x.got !== x.want));
  console.log(`  ..   ${mislabelled.length} node(s) captioned with the wrong generation${mislabelled.length ? `: ${mislabelled.map((x) => `${x.l.name} reads "Generation ${x.got}", he is Generation ${x.want}`).join('; ')}` : ''}`);
  ok(mislabelled.length === 0, 'every node is captioned with the generation his prospect card and the academy list already give him');

  const wrongHeir = chains.flatMap((chain) => chain
    .map((l: any, i: number) => ({ l, want: genOf(l), got: heirIdxOf(l, i) }))
    .filter((x) => x.got !== x.want));
  console.log(`  ..   ${wrongHeir.length} node(s) would read the wrong generation's heirloom${wrongHeir.length ? `: ${wrongHeir.map((x) => `${x.l.name} reads heirlooms[${x.got}], he was handed heirlooms[${x.want}]`).join('; ')}` : ''}`);
  ok(wrongHeir.length === 0, 'every node shows the inheritance recorded against HIS generation, not the one before it');

  // AND IT MUST BE READ OFF THE MAN, not off his place in the list. Shift the chain index and nothing on
  // the node may move: an expression that still answers to `gi` is right only for as long as one line root
  // holds exactly one man per generation, and a save where the passed-over son was developed too breaks
  // that without any of the checks above noticing.
  const indexBound = chains.flatMap((chain) => chain
    .map((l: any, i: number) => ({ l, i }))
    .filter((x) => labelOf(x.l, x.i + 7) !== labelOf(x.l, x.i) || heirIdxOf(x.l, x.i + 7) !== heirIdxOf(x.l, x.i)));
  console.log(`  ..   ${indexBound.length}/${legends.length} node(s) change caption or heirloom when the chain index is shifted`);
  ok(indexBound.length === 0, 'the caption and the heirloom are numbered off the man, not off his position in the chain');

  const hubLines = new Set(legends.map(hubKeyOf)).size;
  ok(hubLines === 1, `the home hub counts the same one bloodline (it prints "🌳 ${hubLines} bloodline${hubLines === 1 ? '' : 's'}")`);

  console.log(fails ? `\n✗ ${fails} failure(s) — a branch switch splits the house in two on the screen whose whole job is its record` : '\n✓ the family reads as one family, at its real generations, on both screens');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
