// THE LATE GAME HAS NEVER BEEN DRIVEN END TO END, and that is where this game actually lives. Every
// existing harness either exercises pure maths or drives one career; the multi-generation state — the
// honours ledger, the renown ladder, award attribution across a token that is reborn under its own id,
// prestige, and whether any of it survives a save/reload — accumulates across generations and so is
// reachable only by playing several.
//
// The Family Record bug (#29) is what prompted this: it survived every bloodline harness in the suite
// because they all measured a tree built from tokens, and it took a four-generation save to see. This
// drives six generations through the real facade and asserts the invariants the late game claims.
//
// Run: `npx tsx tools/playtest/late_game.ts [generations]`
import { api, __setBackendForTests } from '../../client/src/api.js';
import { createInMemoryBackend, getActiveModel, setSaveBackend, continueSave } from '../../client/src/save.js';
import { buildDynasty } from '../dev_dynasty_save.js';

const GENS = Math.max(2, Math.min(8, Number(process.argv[2] ?? 6)));
const fails: string[] = [];
const bad = (m: string) => fails.push(m);
const finite = (v: unknown) => typeof v === 'number' && Number.isFinite(v);

async function main() {
  __setBackendForTests(createInMemoryBackend());

  // Renown is sampled at every succession, because the claim the game makes on screen is about the SHAPE
  // of the curve over time, not its final value.
  const renownByGen: number[] = [];
  const pid = await buildDynasty({
    gens: GENS, familyName: 'Ashcombe', slot: 'probe-late',
    onGeneration: async () => { renownByGen.push((await api.houses() as any).mine.renown); },
  });

  const [houses, legends, honours, bloodline, prestige, awards] = await Promise.all([
    api.houses(), api.legends(), api.honours(9999), api.bloodline(), api.prestige(), api.awards(),
  ]) as any[];
  const model = getActiveModel();
  console.log(`  ${GENS} generations · ${legends.legends.length} legend(s) · ${honours.honours.length} honour(s) · renown ${renownByGen.join(' → ')}`);

  // 1 — "Renown never falls." The trophy room says this in so many words, and the whole point of the ladder
  //     is that a bad generation costs you ground relative to the rivals but never takes anything back.
  for (let i = 1; i < renownByGen.length; i++) {
    if (renownByGen[i] < renownByGen[i - 1]) bad(`renown fell between generation ${i - 1} and ${i} (${renownByGen[i - 1]} → ${renownByGen[i]}) — the trophy room promises it never does`);
  }

  // 2 — The honours ledger is the save's accounting record: one row per season closed, seasons never
  //     repeating. A duplicated season means a campaign was banked twice, which inflates prizes and titles.
  const seasons = honours.honours.map((h: any) => h.season_number);
  const dupes = seasons.filter((s: number, i: number) => seasons.indexOf(s) !== i);
  if (dupes.length) bad(`the honours ledger banks season(s) ${[...new Set(dupes)].join(', ')} more than once — that season's prize and title were counted twice`);

  // 3 — Award attribution. `succeed()` rebirths the token under its OWN id, so an award filed against a
  //     bare id belongs to whoever holds that id NOW, not the man who won it.
  // Each node claims a set of award keys, exactly as `bloodline()` resolves them: a forebear claims his own
  // generation-qualified id; a living token claims both its qualified id and its bare one (awards written
  // before the suffix existed). The invariant is that every bloodline award is claimed by EXACTLY ONE man —
  // nobody claiming it means the winner has no node (the grandfather's medals, orphaned), and two claiming
  // it means the record cannot say which of them won it.
  const claims = new Map<string, string[]>();
  const claim = (key: string, who: string) => claims.set(key, [...(claims.get(key) ?? []), who]);
  for (const n of bloodline.nodes as any[]) {
    if (String(n.id).includes(':g')) claim(n.id, n.name);
    else { claim(`${n.id}:g${n.generation ?? 0}`, n.name); claim(String(n.id), n.name); }
  }
  let awardsChecked = 0;
  for (const a of (awards.awards ?? [])) {
    const owner = String(a.playerId ?? a.player_id ?? '');
    // Squad players win awards too and have no node to hang them on — that is by design. Only awards
    // belonging to the BLOODLINE are the record's business.
    if (!owner.startsWith('nft:')) continue;
    awardsChecked++;
    const who = claims.get(owner) ?? [];
    if (who.length === 0) bad(`award "${a.kind ?? a.label}" (${owner}) belongs to nobody on the Family Record — the man who won it has no node`);
    else if (who.length > 1) bad(`award "${a.kind ?? a.label}" (${owner}) is claimed by ${who.length} people at once: ${who.join(', ')}`);
  }

  // A check over an empty list proves nothing. Say out loud how many awards were actually examined, and
  // fail if the answer is none — a silent zero here is how this assertion passed against a reverted fix.
  if (!awardsChecked) bad('no bloodline award was found to check — this assertion measured nothing');

  // 4 — Nothing in the late game may go non-finite. A NaN here is silent: it renders as "NaN" on a screen
  //     nobody looks at until generation five.
  // managerPrestige returns the whole standing (score, level, title), not a bare number.
  if (!finite(prestige.prestige?.score)) bad(`prestige score is ${prestige.prestige?.score}`);
  if (!finite(prestige.prestige?.progress) || prestige.prestige.progress < 0 || prestige.prestige.progress > 1) bad(`prestige progress is ${prestige.prestige?.progress}, outside 0..1`);
  if (!prestige.prestige?.title) bad('prestige has no title to show');
  if (!finite(houses.mine.renown)) bad(`house renown is ${houses.mine.renown}`);
  if (!finite(model.profile.coins) || model.profile.coins < 0) bad(`coins are ${model.profile.coins}`);
  for (const n of bloodline.nodes as any[]) {
    if (!finite(n.generation)) bad(`${n.name} has generation ${n.generation}`);
    if (n.legend && !finite(n.legend.legendRating)) bad(`${n.name}'s legend card rates ${n.legend.legendRating}`);
  }

  // 5 — Your house sits in the table on the same terms as the rivals, and the table is sorted by renown.
  //     A ladder that disagrees with its own numbers is worse than no ladder.
  const you = houses.table.filter((r: any) => r.you);
  if (you.length !== 1) bad(`the houses table contains ${you.length} entries for your own house`);
  else if (you[0].renown !== houses.mine.renown) bad(`the ladder shows your renown as ${you[0].renown} but the header says ${houses.mine.renown}`);
  for (let i = 1; i < houses.table.length; i++) {
    if (houses.table[i].renown > houses.table[i - 1].renown) { bad('the houses table is not ordered by renown'); break; }
  }

  // 6 — THE SAVE HAS TO SURVIVE BEING A SAVE. Everything above is read out of the live in-memory model;
  //     a player closes the game. Round-trip the model through the backend and re-read the same surfaces.
  const json = JSON.parse(JSON.stringify(model));
  const be = createInMemoryBackend();
  await be.save('reloaded', json);
  setSaveBackend(be);
  await continueSave('reloaded');
  const [h2, l2, b2, p2] = await Promise.all([api.houses(), api.legends(), api.bloodline(), api.prestige()]) as any[];
  if (h2.mine.renown !== houses.mine.renown) bad(`renown changed across a save/reload: ${houses.mine.renown} → ${h2.mine.renown}`);
  if (l2.legends.length !== legends.legends.length) bad(`legend count changed across a save/reload: ${legends.legends.length} → ${l2.legends.length}`);
  if (b2.nodes.length !== bloodline.nodes.length) bad(`the Family Record changed size across a save/reload: ${bloodline.nodes.length} → ${b2.nodes.length} people`);
  if (p2.prestige?.score !== prestige.prestige?.score) bad(`prestige changed across a save/reload: ${prestige.prestige?.score} → ${p2.prestige?.score}`);

  void pid;
  console.log(fails.length ? `\n  FAIL ${fails.length} problem(s):` : `\n  OK   ${GENS} generations of ledger, ladder, attribution and reload all hold`);
  for (const f of fails) console.log(`    - ${f}`);
  if (fails.length) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
