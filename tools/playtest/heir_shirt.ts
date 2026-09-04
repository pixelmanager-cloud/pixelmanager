// THE SHIRT DOES NOT PASS TO THE SON — and a shirt hung up stays hung up.
//
// The succession reuses the father's token id (that is what makes the legend chain `${id}:g<gen>`
// contiguous), so every column `rebornFields` forgets to clear is a piece of the dead man handed to a
// different person. It cleared his attributes, his traits, his temperament, his earnings and his honours
// card — and never mentioned `kit_json`, which is his SQUAD NUMBER and the nickname the player chose for
// him. So the boy's Identity screen opened pre-filled with his father's #7 and his father's "The Wolf".
//
// The number half contradicts the game in writing. The Trophy Room hangs a number up under "Shirts hung up
// forever for the club's immortals — no future player wears these", and renders that shelf into the SAME
// innerHTML as the bloodline tree, whose nodes are badged `#<number>` off the legend card — so one screen
// showed "no future player wears these — #7" above a Generation-2 node badged #7. And because the retire
// button is gated `!retiredNums.has(num)` (showTrophyRoom), the heir wearing it could then never have his
// own shirt retired either.
//
// TWO GATES, because clearing kit_json alone does not close it: kitTabHtml defaults an heir with no kit to
// `number: 10`, and `api.saveKit` only ever clamped 1..99 — so the son of a #10 whose shirt was retired
// re-acquires it the first time the player presses Save, without ever choosing it.
//
// THROUGH THE FACADE, not by calling rebornFields directly — a direct call would pass the moment the field
// exists while `succeed()` kept writing the father's kit, which is the wiring failure heir_name_world.ts
// was written for. So this registers a real slot, scouts, signs, plays the founder's career out, saves him
// a kit, and reads what the succession actually leaves on the token and on the heir's own career screen.
//
// NOT AN EMPTY CHECK, at every step that could measure nothing: the father's kit is asserted PRESENT and
// carrying both halves before anything is claimed about the heir; the succession is asserted to have
// happened (generation advanced, name changed); `retiredNumbers()` is asserted to actually hold the shirt
// before saveKit is asked to refuse it; and a free number is saved immediately afterwards, so a saveKit
// that refused everything fails here instead of passing the rule above.
//
// Mutation-test it by dropping `kit_json: null` from `rebornFields` (shared/src/tokens.ts) — the "carries
// none of his father's kit" and "Identity screen opens blank" checks go red with the father's #7 and "The
// Wolf" printed on the heir — or by dropping the retired-shirt refusal from `api.saveKit`
// (client/src/api.ts), which reds "cannot be put in the retired #7" alone. Both were run before this
// landed: 3 failures and 1 failure respectively, against a clean run of 8 checks.
//
// Run: `npx tsx tools/playtest/heir_shirt.ts`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, localStore, retiredNumbers, retireNumber } from '../../client/src/save.js';

const NUM = 7, NICK = 'The Wolf', FREE = 23;
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
    if ((await api.careerAct(pid, act) as any).graduated) return;
  }
  throw new Error('career did not finish');
}
const kitOf = async (pid: string) => { const t = await localStore.getToken(pid); return t?.kit_json ? JSON.parse(t.kit_json) : null; };

async function main() {
  console.log('=== The heir does not inherit his father\'s shirt ===');
  __setBackendForTests(createInMemoryBackend());
  await api.register('dynasty', 'x', 'Ashcombe', 20260904, 'slot-w13-7');
  const { candidates } = await api.scoutProspects(3) as any;
  const pid = (await api.signProspect(candidates[0].seed) as any).prospect.id;
  await api.startCareer(pid, null);
  await playCareer(pid);

  // ── the father, with a kit he chose — everything below is measured against this.
  await api.saveKit(pid, { number: NUM, boots: 'white', celebration: 'kneeslide', nickname: NICK, hairstyle: 'buzz', accessory: 'none' } as any);
  // COPIED OUT, not held as a reference. `getToken` hands back the live object out of the in-memory
  // model, and `succeed()` reborns the token in place — so a `father` variable read after the succession
  // is the SON (api.ts says the same about `decorated`). Held live, the generation check below compares
  // the heir with himself and passes on a save where nothing happened at all.
  const t0 = (await localStore.getToken(pid))!;
  const father = { name: t0.name, generation: t0.generation };
  const fKit = await kitOf(pid);
  console.log(`  ..   father: ${father.name} (generation ${father.generation}) wearing #${fKit?.number} "${fKit?.nickname}"`);
  ok(fKit?.number === NUM && fKit?.nickname === NICK, 'the father actually has a saved kit to hand down (this is not an empty check)');

  for (let s = 0; s < 5; s++) await api.spSeasonReward({ pos: 1, size: 14, wins: 22, draws: 8, losses: 8, tier: 2, starId: pid, kind: 'league' } as any);
  await api.succeed(pid, { seasons: 5, titles: 3, cups: 1, mentorship: 2, inheritance: 'name' });

  const heir = (await localStore.getToken(pid))!;
  console.log(`  ..   heir:   ${heir.name} (generation ${heir.generation}), kit_json ${JSON.stringify(heir.kit_json)}`);
  ok(heir.generation === father.generation + 1 && heir.name !== father.name, 'the succession actually happened (a new man on the same token id)');

  // THE RULE. A different person, so a blank shirt — not his father's number and not his father's name.
  const hKit = await kitOf(pid);
  ok(hKit === null, `the heir carries none of his father's kit${hKit ? ` — got #${hKit.number} "${hKit.nickname}"` : ''}`);

  // ...and the screen the player actually opens agrees. careerState is what fills the Identity inputs.
  await api.startCareer(pid, null);
  const st = ((await api.getCareer(pid)) as any)?.state ?? null;
  ok(!!st, 'the heir\'s career screen was reachable (this check is not measuring nothing)');
  ok(st?.kit == null, `the heir's Identity screen opens blank${st?.kit ? ` — pre-filled #${st.kit.number} "${st.kit.nickname}"` : ''}`);

  // ── the honour half: hang the father's shirt up, then try to put a living man in it.
  retireNumber(NUM, father.name);
  const hung = retiredNumbers().some((r) => r.n === NUM);
  console.log(`  ..   retired shelf: ${retiredNumbers().map((r) => `#${r.n} (${r.name})`).join(', ') || '(empty)'}`);
  ok(hung, `#${NUM} is on the retired shelf before saveKit is asked to refuse it (this is not an empty check)`);

  let refused = false;
  try { await api.saveKit(pid, { number: NUM, boots: 'white', celebration: 'kneeslide', nickname: '', hairstyle: 'buzz', accessory: 'none' } as any); }
  catch (e: any) { refused = true; console.log(`  ..   saveKit(#${NUM}) refused: ${e?.body?.error ?? e?.message}`); }
  const afterRetired = await kitOf(pid);
  ok(refused && afterRetired?.number !== NUM, `a living player cannot be put in the retired #${NUM}${afterRetired?.number === NUM ? ' — he is wearing it' : ''}`);

  // Control: the guard must refuse the hung-up shirt, not every shirt.
  await api.saveKit(pid, { number: FREE, boots: 'white', celebration: 'kneeslide', nickname: '', hairstyle: 'buzz', accessory: 'none' } as any);
  const afterFree = await kitOf(pid);
  ok(afterFree?.number === FREE, `a free number still saves normally (#${FREE} → ${afterFree?.number}) — the guard is not refusing everything`);

  console.log(fails
    ? `\n✗ ${fails} check(s) failed — the succession is handing the son his father's shirt, or a retired shirt is back in circulation`
    : '\n✓ every generation starts with a blank shirt, and a retired one stays hung up');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
