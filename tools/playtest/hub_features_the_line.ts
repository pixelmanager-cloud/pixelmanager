// THE HUB NAMES A BROTHER THE PLAYER PASSED OVER, UNDER A HEADING THAT PROMISES THE LINE.
//
// `#hub-player` sits under "YOUR PLAYER — the bloodline you're living" (client/index.html), and
// `refreshHubPlayer` chose the man to put there with
//
//   const active = prospects.find((p) => p.careerStarted) ?? prospects[prospects.length - 1];
//
// Both arms miss the heir in the moments right after a succession. `rebornFields` leaves the trunk's
// `career_seed` null, so nothing in the pool is `careerStarted` yet and the `find` returns undefined; and
// `succeed()` reworks the father's token IN PLACE and only then mints the brothers and the cousins, each
// one pushed onto `model.tokens` after it — so `prospects[length - 1]` is by construction the newest
// brother, never the heir the succession screen just handed the player. Nothing on the row could tell them
// apart either: a brother carries the same family surname, the same pedigree and the same generation, and
// `api.prospects()` did not emit `branch` at all. Measured over three saves, 6 of 6 successions that
// offered anybody featured a man who was not the line — and the row's own button is the door onto starting
// HIS career instead of the heir's.
//
// The window is the deferred path: press "Develop him →" on the card the succession drops you onto and
// `startCareer` writes `career_seed`, after which the first arm finds him for ever. Press "Later", or come
// back to the hub before beginning him, and the row is a different man. So this probe reads the pool in
// exactly that state — the succession is over and nothing has been developed yet.
//
// The pick is LIFTED OUT OF main.ts AND EVALUATED, never restated here: a copy would go green over
// whatever the hub actually does, which is the copy-instead-of-derive failure that produced the stadium
// card. If the expression can no longer be lifted this FAILS rather than quietly measuring nothing.
//
// MUTATION TEST — each of these must turn a named line below red:
//   * drop `branch` from `prospects()` (client/src/api.ts): checks 3, 4, 5 and 7 go red together, because
//     every row then reads `undefined` and the lifted expression falls back to the last prospect again;
//   * "fix" the hub by preferring `prospects[0]`, or the founder's token id: check 6 goes red — taking a
//     brother is precisely the case where the line is NOT the token the dynasty started on;
//   * revert `startCareer`'s demotion sweep: check 7 goes red at two men reading 'played' on one rank,
//     which is the state in which the new arm's `find` could take the wrong one of them.
// Checks 1 and 2 are the non-vacuity guards. Without them every assertion here is a green tick over a rank
// of one, which is the real shape of a succession that gives a lone son and sweeps no cousins — half of
// them, measured — and the reason the hub is right often enough that a player cannot learn the rule.
//
// Run: `npx tsx tools/playtest/hub_features_the_line.ts`
import { readFileSync } from 'node:fs';
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend } from '../../client/src/save.js';

const src = readFileSync('client/src/main.ts', 'utf8');
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

/** The body of a method on Game, from its signature to the first close-brace at method indentation. */
function methodBody(sig: string): string {
  const i = src.indexOf(sig);
  if (i < 0) return '';
  const end = src.indexOf('\n  }', i);
  return end < 0 ? '' : src.slice(i, end);
}

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
  console.log('=== the hub row is the man whose career you are living ===');

  // The pick holds no semicolon of its own, so `[^;]+` lifts it whole however it is wrapped across lines.
  const pickExpr = (/\bconst active = ([^;]+);/.exec(methodBody('private async refreshHubPlayer()')) ?? [])[1] ?? '';
  console.log(`  ..   hub pick = ${pickExpr.replace(/\s+/g, ' ').trim()}`);
  ok(!!pickExpr, "the hub row's pick can still be lifted out of refreshHubPlayer — otherwise this probe is blind and must be re-pointed");
  if (!pickExpr) { console.log('\n✗ nothing below was measured'); process.exitCode = 1; return; }
  const pick = new Function('prospects', `return ${pickExpr};`) as (p: any[]) => any;

  const SLOTS = ['probe-hub-line-a', 'probe-hub-line-b', 'probe-hub-line-c'];
  const wrong: string[] = [];
  let ranks = 0, offeredRanks = 0, noBranch = 0, notOneOnTheLine = 0;
  let switched: { taken: string; featured: string; pool: number; onTheLine: number } | null = null;

  for (const slot of SLOTS) {
    __setBackendForTests(createInMemoryBackend());
    await api.register('dynasty', 'x', 'Ashcombe', 20260902, slot);
    const board: any = await api.scoutProspects(3);
    let line = (await api.signProspect(board.candidates[0].seed) as any).prospect.id;
    for (let g = 0; g < 4; g++) {
      await api.startCareer(line, null);
      await playCareer(line);
      const s: any = await api.succeed(line, { seasons: 5, titles: 1, cups: 0, mentorship: 2, inheritance: 'name' });
      const heir = s.prospect.id;
      const { prospects } = await api.prospects() as any;
      ranks++;
      line = heir;
      if (!s.siblings.length) continue;   // a lone son: nobody on the rank to feature by mistake
      offeredRanks++;
      const featured = pick(prospects);
      if (prospects.some((p: any) => p.branch === undefined)) noBranch++;
      if (prospects.filter((p: any) => p.branch === 'played').length !== 1) notOneOnTheLine++;
      if (featured?.id !== heir) wrong.push(`${slot} gen ${(s.prospect.generation ?? 0) + 1}: the heir is ${s.prospect.name} (${heir}) — the hub row would read ${featured?.name} (${featured?.id})`);
      // ...and the other direction, once: TAKING a brother has to move the row onto him.
      if (!switched) {
        await api.startCareer(s.siblings[0].id, null);
        const after: any = await api.prospects();
        switched = { taken: s.siblings[0].id, featured: pick(after.prospects)?.id, pool: after.prospects.length,
                     onTheLine: after.prospects.filter((p: any) => p.branch === 'played').length };
        line = s.siblings[0].id;
      }
    }
  }

  console.log(`  ..   ${ranks} succession(s) driven, ${offeredRanks} of them put a brother or a cousin on the rank`);
  ok(offeredRanks >= 3, `enough successions actually offered a rival to measure (${offeredRanks} of ${ranks})`);
  ok(noBranch === 0, `every row api.prospects() hands the hub says which branch the man is on (${noBranch} of ${offeredRanks} rank(s) had rows with no \`branch\`)`);
  ok(notOneOnTheLine === 0, `exactly one prospect on each of those ranks reads branch 'played' (${notOneOnTheLine} rank(s) did not)`);
  for (const w of wrong) console.log(`  ..   ${w}`);
  ok(wrong.length === 0, `the hub features the heir the succession handed the player, on every rank (${wrong.length}/${offeredRanks} featured somebody else)`);
  console.log(`  ..   after taking the brother ${switched?.taken} out of a pool of ${switched?.pool}, the hub row would read ${switched?.featured}; ${switched?.onTheLine} man/men in that pool read 'played'`);
  ok(!!switched && switched.featured === switched.taken,
     'and once a brother is taken the row moves onto HIM — the line follows the career the player started, not the token the dynasty began on');
  // The new arm is a `find`, so the pool must never hold two men on the line: `startCareer` demotes the
  // heir who was passed over, and without that sweep the arm could hand the hub whichever came first.
  ok(!!switched && switched.onTheLine === 1,
     `and only one man in the pool reads 'played' after the switch (got ${switched?.onTheLine}) — the arm is a find, so a second one would be a coin toss`);

  console.log(fails ? `\n✗ ${fails} check(s) failed — "the bloodline you're living" is naming a man the player is not` : '\n✓ the hub row names the man whose career the player is in');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
