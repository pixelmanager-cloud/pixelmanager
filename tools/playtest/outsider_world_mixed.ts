// THE 300-COIN STRANGER MUST BE A DIFFERENT BOY IN EVERY SAVE.
//
// `mintGenesisLocal` (client/src/api.ts) mints the outsider the academy sells for 300 coins. It makes three
// draws off the token id — the name, the genes, the position — and the id is `nft:${countTokens() + 1}`, a
// PER-SAVE COUNTER, not a UUID. So the id alone is not an identity: every dynasty that signs a founder
// (nft:1) and then buys its first outsider mints `nft:2`. Only the NAME mixed the active save id in. The
// genes and the position were keyed on the bare counter, so every player's first purchase was the same boy
// — pace 10-20, strength 3-10, stamina 6-11, MF, 3 stars — wearing a different name.
//
// The comment sitting in the middle of those three lines already CLAIMED the save was mixed in ("so two
// saves do not mint the same stranger"), which is how this lasted: the intent was written down, one of the
// three draws implemented it, and nothing measured the other two. The purchase is billed as a gamble on an
// unknown and it was the same gamble for everyone.
//
// A name-only check would have gone green throughout, so this measures the GENES and the POSITION, and
// keeps the name as a control: when the genes line regresses the name column stays distinct, which points
// straight at the line that broke.
//
// Run: `npx tsx tools/playtest/outsider_world_mixed.ts [saves]`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, localStore } from '../../client/src/save.js';

// How many saves the position scan may open before it gives up. The GK draw fires 12% of the time, so a
// world-mixed position shows both inside a handful of saves (measured: 21); 96 is ~5e-6 of a false red.
const CAP = Math.max(8, Math.min(400, Number(process.argv[2] ?? 96)));
let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

type Bought = { id: string; name: string; role: string; genes: string };

/** One fresh dynasty in the given save slot: sign the founder (nft:1), then buy the first outsider (nft:2)
 *  — the near-universal case, and the one where two saves are guaranteed to be at the same token count. */
async function buyFirstOutsider(slot: string): Promise<Bought> {
  await api.register('dynasty', 'x', 'Ashcombe', 20260902, slot);
  const { candidates } = await api.scoutProspects(3) as any;
  await api.signProspect(candidates[0].seed);
  const r: any = await api.genesis();
  return { id: r.prospect.id, name: r.prospect.name, role: r.prospect.roleHint, genes: JSON.stringify(r.prospect.genes) };
}

async function main() {
  console.log('=== The bought academy prospect is a different boy in every save ===');
  __setBackendForTests(createInMemoryBackend());   // one install, several saves — exactly the real case

  const K = 6;
  const first: Bought[] = [];
  for (let i = 0; i < K; i++) first.push(await buyFirstOutsider(`w12-12-save-${i}`));
  console.log(`  ..   ${K} saves, each signs a founder then buys its first outsider (${first[0].id})`);
  for (const b of first) console.log(`  ..   ${b.name} — ${b.role} — ${b.genes}`);
  const names = new Set(first.map((b) => b.name)).size, genes = new Set(first.map((b) => b.genes)).size;
  ok(first.length === K, `there are ${K} purchases to compare (this is not measuring an empty set)`);
  ok(names === K, `the strangers have ${K} different NAMES — the one draw that already mixed the save in (${names}/${K})`);
  ok(genes === K, `the strangers have ${K} different GENE sets — not one boy under six names (${genes}/${K})`);

  // VACUITY GUARD. If the mint stopped varying with the token id, every assertion above could still pass
  // off a world-only seed while the academy sold the same child over and over inside one save.
  await api.register('dynasty', 'x', 'Ashcombe', 20260902, 'w12-12-repeat');
  const { candidates } = await api.scoutProspects(3) as any;
  await api.signProspect(candidates[0].seed);
  await localStore.addCoins('local', 2000);        // four purchases at 300c, on a 500c starting purse
  const run: string[] = [];
  for (let i = 0; i < 4; i++) run.push(JSON.stringify(((await api.genesis()) as any).prospect.genes));
  console.log(`  ..   four purchases inside ONE save: ${new Set(run).size} distinct gene sets`);
  ok(new Set(run).size === 4, 'consecutive purchases within a save still differ (the id term is live)');

  // THE POSITION IS A DRAW TOO. It is the other line keyed on the bare counter, and because 88% of
  // outsiders are midfielders either way, only a scan across saves can tell "the roll came up MF" apart
  // from "there is no roll".
  const seen = new Map<string, string>();
  let scanned = 0;
  for (let i = 0; i < CAP && seen.size < 2; i++) {
    const slot = `w12-12-role-${i}`;
    seen.set((await buyFirstOutsider(slot)).role, slot);
    scanned++;
  }
  console.log(`  ..   scanned ${scanned}/${CAP} saves for the first outsider's POSITION: saw ${[...seen.keys()].join(', ')}`);
  ok(seen.size >= 2, `the first outsider is not the same position in every save (both found within ${scanned} saves)`);

  console.log(fails ? `\n✗ ${fails} failure(s) — the academy sells every player the same stranger` : '\n✓ every save buys its own outsider');
  if (fails) process.exitCode = 1;
}
main().catch((e) => { console.error('FAILED: ' + (e?.stack ?? e)); process.exit(1); });
