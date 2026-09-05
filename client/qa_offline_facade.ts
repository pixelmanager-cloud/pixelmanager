// Headless smoke test for the phase 3 offline facade (client/src/api.ts). Run: `npx tsx
// client/qa_offline_facade.ts`. Drives the facade exactly as main.ts does — New Game -> prospects ->
// career -> graduation -> a few economy calls -> succeed/reborn — with an in-memory backend injected
// (via `__setBackendForTests`) so no IndexedDB/browser is needed. Asserts no throws and sane shapes;
// does NOT re-verify game rules (shared/career_sim.ts and client/qa_savestore.ts already do that) —
// this is about the WIRING: does every reachable api.ts call run in-process end to end.
import { api, __setBackendForTests, setToken } from './src/api.js';
import { createInMemoryBackend, getActiveModel } from './src/save.js';
import { transferList, wageForLength, TIERS, mintSquadPlayer } from '@fm/shared';

__setBackendForTests(createInMemoryBackend());

let failures = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) console.log(`  ok   ${msg}`);
  else { console.log(`  FAIL ${msg}`); failures++; }
}
async function assertThrows(label: string, fn: () => Promise<any>): Promise<void> {
  try { await fn(); assert(false, `${label} throws`); }
  catch { assert(true, `${label} throws`); }
}

console.log('=== 1. New Game ===');
const reg = await api.register('ignored', 'ignored', 'Bloodline FC');
assert(!!reg.token, 'register() returns a save-slot token');
assert(reg.account.coins === 500, 'register() does not charge coins (the founding prospect is scouted + signed, not auto-minted)');
assert(reg.club.name === "Bloodline FC's Club", "club name derives from the chosen name (makeClub appends 's Club, see shared/src/game.ts)");
assert(reg.club.players.length === 20, 'starting squad has 20 base players');
assert(reg.standingOrders.playerIds.length === 11, 'a valid starting XI is set');

console.log('=== 2. me() reflects the same save ===');
const me1 = await api.me();
assert(me1.account.coins === reg.account.coins, 'me() coins match register()');
assert(me1.season === 0, 'season starts at 0');

console.log('=== 3. scout board -> sign the founding prospect ===');
assert((await api.prospects()).prospects.length === 0, 'register mints nothing — the academy is empty until you sign someone');
const board = await api.scoutProspects(3);
assert(board.candidates.length === 3, 'scoutProspects returns 3 candidates');
assert(board.candidates.every((c) => c.roleHint && c.glimpse && c.note), 'each candidate shows a role hint, a glimpsed trait and a note');
assert(board.candidates.every((c) => !('potentialStars' in c)), 'the board hides the true potential (mystery/anticipation) — no stars shown');
const signed = await api.signProspect(board.candidates[0].seed);
assert(signed.ok && signed.prospect.generation === 0, 'signProspect mints the founding generation-0 token');
const { prospects, supply, cap } = await api.prospects();
assert(prospects.length === 1, 'exactly one prospect now (the signed founder)');
assert(supply === 1 && cap > 0, 'supply/cap reported');
const prospectId = prospects[0].id;

console.log('=== 4. genesis() mints a second prospect (coin sink) ===');
const g = await api.genesis();
assert(g.prospect.id !== prospectId, 'a distinct new token id');
assert((await api.prospects()).prospects.length === 2, 'now two prospects');

console.log('=== 5. career: start -> act to graduation ===');
const { agents } = await api.careerAgents();
assert(agents.length > 0, 'agent roster available');
const started = await api.startCareer(prospectId, agents[0].id);
assert(started.state.turn === 0 && !started.state.finished, 'career starts at turn 0, not finished');
let state = started.state;
let graduated = false;
let player: any = null;
let guard = 0;
let sawArc = false;
while (!graduated && guard++ < 2000) {
  const phase = state.phase;
  let action: { type: string; cardId: string };
  if (phase === 'arc') {
    // REGRESSION GUARD (PT-52/PT-53): an arc-phase state must still carry the full career wrapper —
    // prospectId/name/turn — or the client can't render the header or dispatch the choice (soft-lock).
    // careerState's arc branch once early-returned the bare state, stripping these; never again.
    sawArc = true;
    assert((state as any).prospectId === prospectId, 'arc-phase state keeps prospectId (else the client cannot dispatch the choice → soft-lock)');
    assert(typeof (state as any).name === 'string' && (state as any).name.length > 0, 'arc-phase state keeps the player name (else header reads "undefined")');
    assert(typeof state.turn === 'number', 'arc-phase state keeps the turn counter');
    action = { type: 'arc', cardId: (state as any).arc.choices[0].id };
  }
  else if (phase === 'focus') action = { type: 'focus', cardId: state.focus![0].id };
  else if (phase === 'offer') action = { type: 'offer', cardId: state.offers![0].id };
  else if (phase === 'coach') action = { type: 'coach', cardId: state.coaches![0].id };
  else if (phase === 'draft') action = { type: 'draft', cardId: state.options![0].id };
  else action = { type: 'play', cardId: state.hand![0].id };
  const r = await api.careerAct(prospectId, action);
  if (r.graduated) { graduated = true; player = r.player; assert(!!r.epilogue, 'graduation carries an epilogue'); break; }
  state = r.state!;
}
assert(graduated, `career reached graduation within the turn budget (${guard} actions)`);
assert(sawArc, 'the career hit at least one story-arc beat (so the arc-wrapper regression guard above actually ran)');
assert(!!player && !!player.role, 'the graduated pro has a role');

console.log('=== 6. the graduated token is now a fieldable pro ===');
const me2 = await api.me();
assert(me2.club.players.some((p) => p.id === prospectId), 'the pro-state token is merged into the club as a fieldable player');
assert(!!me2.contracts[prospectId], 'the new pro has a contract entry');
// Captured here because the star is SUCCEEDED later in this harness and leaves `club.players`; the
// brand-economy check at the end needs the value while it is still reachable.
const starBrand = (me2.club.players as any[]).find((p) => p.id === prospectId)?.marketability;
assert(typeof starBrand === 'number', `the graduated star carries a marketability (got ${starBrand})`);
assert(me2.contracts[prospectId].available === true, 'freshly graduated + staked -> available for selection');

console.log('=== 7. setStandingOrders accepts the merged squad (NFT pro included) ===');
const soRes = await api.setStandingOrders({ ...me2.standingOrders, playerIds: me2.standingOrders.playerIds });
assert(soRes.ok, 'setStandingOrders ok');

console.log('=== 8. economy: facilities upgrade, spSeasonReward, hireStaff ===');
const facBefore = await api.facilities();
const stadium = facBefore.facilities.find((f) => f.key === 'stadium')!;
assert(stadium.level === 1, 'stadium starts at level 1');
const up = await api.upgradeFacility('stadium');
assert(up.level === 2, 'stadium upgraded to level 2');
assert(up.coins === facBefore.coins - (stadium.upgradeCost ?? 0), 'coins debited by the upgrade cost');

const coinsBeforeReward = (await api.me()).account.coins;
const reward = await api.spSeasonReward({ pos: 1, size: 10, wins: 24, draws: 8, losses: 6 });
// The base champion prize is 800, LIFTED by the house's renown at the prize-giving and nowhere else.
// Asserting the relationship rather than the old literal, so the check keeps meaning something if
// either the base or the multiplier is retuned; a hard-coded 800 just encodes today's numbers.
assert(reward.houseMult >= 1 && reward.houseMult <= 1.4, `renown income multiplier in range (${reward.houseMult})`);
// THESE TWO CHECKS USED TO BE VACUOUS, AND THE COMMENT ABOVE THEM WAS BACKWARDS.
// `tierMult > 0.39 && tierMult < 1.61` spans the ENTIRE range the function can return, so it could only
// fail on a NaN; and `prize === Math.round(800 * reward.tierMult * reward.houseMult)` is the response
// checking itself. Flattening `tierMult` to a constant 1.0 — so winning the basement pays the top-flight
// champion's prize — passed both.
//
// The old comment also claimed "no `tier` is passed here, so it defaults to the basement and its 0.4x".
// It does not: with `tier` undefined, `tierIdx` resolves to `TIERS - 1`, so the multiplier is 1.6 — the TOP
// FLIGHT — and the band was wide enough to accept the exact opposite of what the comment asserted. A reader
// checking the gate for reassurance was being actively misinformed.
assert(Math.abs(reward.tierMult - 1.6) < 1e-6,
  `an unspecified tier resolves to the TOP flight's 1.6x, not the basement (got ${reward.tierMult})`);
assert(reward.prize === Math.round(800 * 1.6 * reward.houseMult),
  `champion prize is 800 x 1.6 x renown (got ${reward.prize})`);
// Coins banked are the prize PLUS whatever the facilities earned off the pitch. At a founding club every
// facility is level 1 — the neutral baseline — so this is 0 here, and asserting the sum rather than the
// prize alone is what will catch it if that ever silently stops being true.
assert(reward.facilities.total >= 0, 'facility income is never negative');
// UPKEEP is the other side of this ledger — what the club earns off the pitch, minus what it costs to run.
// It is charged in the same league roll that pays the income, so the banked total has to net it off.
assert(reward.upkeep >= 0, 'upkeep is never negative');
assert(reward.coins === coinsBeforeReward + reward.prize + reward.sponsorBonus + reward.facilities.total - reward.upkeep,
  `season prize + facility income banked, less upkeep (${reward.prize} + ${reward.sponsorBonus} + ${reward.facilities.total} - ${reward.upkeep})`);
const meAfterReward = await api.me();
assert(meAfterReward.season === 1, 'spSeasonReward advances the local season counter');

const staffRes = await api.hireStaff('fitness');
assert(staffRes.cost === 350, 'fitness coach costs 350');

console.log('=== 8b. transfer market: buy / sell / negotiate (money safety) ===');
const tmList = transferList(123456, 5, 10).sort((a, b) => a.fee - b.fee); // bottom tier → cheap low-OV players
assert(tmList.length > 0, 'transfer market lists players to buy');
const meTM0 = await api.me();
const coinsTM0 = meTM0.account.coins;
const cheap = tmList[0];
assert(coinsTM0 >= cheap.fee, `an affordable listing is available (cheapest ${cheap.fee} <= ${coinsTM0} coins)`);
const buy = await api.buyPlayer(cheap.player, cheap.fee);
assert(buy.coins === coinsTM0 - cheap.fee, 'buying debits exactly the fee');
await assertThrows('buying beyond budget throws (no negative coins)', () => api.buyPlayer(cheap.player, 10_000_000));
const bought = (await api.me()).club.players.find((p) => p.id.startsWith('bought'))!;
assert(!!bought, 'the bought player joins the squad');
const coinsBeforeSell = (await api.me()).account.coins;
const sell = await api.sellPlayer(bought.id);
assert(sell.coins > coinsBeforeSell && sell.value > 0, 'selling credits coins');
assert(sell.squadSize === buy.squadSize - 1, 'the sold player leaves the squad');
await assertThrows('cannot sell the bloodline star via the market', () => api.sellPlayer(prospectId));
const info = await api.starContractInfo(prospectId);
assert(info.baseWage > 0 && info.prefLength >= 2, 'star contract info is sane');
const low = await api.negotiateStar(prospectId, Math.round(wageForLength(info, info.prefLength) * 0.5), info.prefLength);
assert(low.outcome === 'reject', 'a lowball contract offer is rejected');
assert(low.coins === (await api.me()).account.coins, 'a rejected offer does NOT charge coins');
// HIS ASK MOVED, BECAUSE THE LOWBALL ABOVE NOW COSTS HIM MORALE. tokenContract has always said "morale
// bends the numbers: an unhappy player holds out for more to re-sign" (tokens.ts:101), but nothing ever
// moved his morale during a negotiation — evaluateContractOffer's moraleDelta was computed and discarded —
// so the path never fired. It fires now, which means `info`, fetched before we insulted him, is stale: the
// figure it quotes is no longer his ask. Re-read it, so this still asserts what it says it asserts.
const infoAfterLowball = await api.starContractInfo(prospectId);
assert(infoAfterLowball.baseWage > info.baseWage,
  `insulting him raises his price (${info.baseWage} -> ${infoAfterLowball.baseWage})`);
const fair = await api.negotiateStar(prospectId, wageForLength(infoAfterLowball, infoAfterLowball.prefLength), infoAfterLowball.prefLength);
assert(fair.outcome === 'accept', 'meeting his ask re-signs him');

console.log('=== 9. honours recorded a title for the champion finish ===');
const { honours } = await api.honours();
assert(honours.length === 1 && honours[0].title === 1, 'spSeasonReward(pos=1) banks a league title honour');

console.log('=== 10. prestige (rebuilt: accrues local W/D/L) + trophy-room data ===');
const prestige = await api.prestige();
assert(prestige.prestige.leagueTitles >= 1, 'prestige reflects the banked title');
assert(prestige.record.wins === 24 && prestige.record.draws === 8 && prestige.record.losses === 6, 'prestige accrues the season W/D/L passed to spSeasonReward (offline rebuild)');
assert(prestige.record.seasons >= 1, 'prestige counts seasons managed');
// second season accumulates onto the lifetime record
await api.spSeasonReward({ pos: 4, size: 10, wins: 10, draws: 10, losses: 18 });
const prestige2 = await api.prestige();
assert(prestige2.record.wins === 34 && prestige2.record.losses === 24, 'a second season adds to the lifetime W/D/L record');
const { legends } = await api.legends();
assert(Array.isArray(legends), 'legends() returns an array (empty — nobody has retired yet)');

console.log('=== 11. stake / extendContract on the pro ===');
const stakeOff = await api.stake(prospectId, false);
assert(stakeOff.contract.staked === false, 'unstake clears staked');
const stakeOn = await api.stake(prospectId, true);
assert(stakeOn.contract.staked === true, 'stake re-arms it');

console.log('\n=== commercial income follows the bloodline star ===');
{
  // `squadMarketability(club.players)` returned EXACTLY 10 for every club in every save: no mint path sets
  // marketability on a squad player, and the one man who has it -- the star, whose brand is built through
  // his card career -- is not in `club.players` at all, he is a Token merged in for reads. So `brandMult`
  // was pinned at 1.0 and the commercial layer was a constant, while career.ts promised this stat gives
  // greed "a genuine upside instead of being a pure tax".
  // Including him in an AVERAGE was measured and rejected (1197 -> 1215, ~1.5%); income reads him directly.
  // sponsorIncome pays nothing below level 2, so the Commercial Dept has to exist before the brand term
  // can be observed at all. (That is also why this was so easy to leave broken: on a fresh save the whole
  // commercial layer is legitimately zero, so a pinned brandMult looks identical to a working one.)
  try { await api.upgradeFacility('sponsor'); } catch { /* not enough coins is fine; asserted below */ }
  const facs = await api.facilities();
  const sponsorLvl = facs.facilities.find((f) => f.key === 'sponsor')?.level ?? 1;
  assert(sponsorLvl >= 2, `the Commercial Dept is built, so sponsorship is non-zero (level ${sponsorLvl})`);
  const args = { pos: 4, size: 10, wins: 18, draws: 10, losses: 10 } as any;
  const withStar: any = await api.spSeasonReward({ ...args, starId: prospectId });
  const without: any = await api.spSeasonReward({ ...args });
  const a = withStar.facilities?.sponsor, b = without.facilities?.sponsor;
  assert(typeof a === 'number' && typeof b === 'number', `spSeasonReward reports a sponsor figure (${a} / ${b})`);
  if (starBrand > 10) assert(a > b, `a marketable star (${starBrand}) earns MORE sponsorship than none (${a} v ${b})`);
  else if (starBrand < 10) assert(a < b, `an unmarketable star (${starBrand}) earns LESS than none (${a} v ${b})`);
  else assert(a === b, `a neutral star (10) is indistinguishable from none (${a} v ${b})`);
}

console.log('=== 12. succeed(): fold a managed career into achievements, then reborn ===');
const succ = await api.succeed(prospectId, { seasons: 5, titles: 1, mentorship: 2 });
assert(succ.prospect.id === prospectId, 'succeed() keeps the same token id (reborn, not reminted)');
assert(succ.prospect.generation === 1, 'succeed() advances the generation');
const meAfterSucceed = await api.me();
assert(!meAfterSucceed.contracts[prospectId] || meAfterSucceed.contracts[prospectId].retired == null, 'the token is a prospect again, not a contracted pro');
const afterProspects = await api.prospects();
assert(afterProspects.prospects.some((p) => p.id === prospectId && p.generation === 1), 'the reborn generation-1 prospect is back in the academy');
// succeed() must SNAPSHOT the retiring pro as a legend so the Bloodline Tree / Hall of Legends populates
// (regression guard for PT-18 — saveLegacy was defined but never called, leaving the signature tree empty).
const legendsAfter = await api.legends();
assert(legendsAfter.legends.length >= 1, 'succeed() records a legend — the bloodline tree / legends now populate');
assert(legendsAfter.legends.some((l) => l.playerId === prospectId && !!l.card), 'the recorded legend is this bloodline, with a legend card');

console.log('\n=== a bloodline player\u2019s honours land on his family-tree node ===');
{
  // The join is award.player_id -> token.id, which holds only because the star sits in club.players under
  // his TOKEN id (api.ts looks him up with getToken(starId)). If that ever drifts the tree goes quietly
  // blank, so assert the join on a real token. This lives HERE, not down in the awards section, because
  // section 16 resumes a different save and leaves no tokens to hang an honour on.
  const tok = getActiveModel().tokens[0];
  assert(!!tok, `there is a bloodline token to decorate (${getActiveModel().tokens.length} tokens)`);
  if (tok) {
    const rows: any = [];
    for (let m = 0; m < 20; m++) rows.push({ id: tok.id, name: tok.name, goals: 1, assists: 1, apps: 1, potm: 1, rating: 8 });
    await api.recordMatchStats({ rows });
    // starId matters: without it spSeasonReward never looks the token up, so nothing about his career
    // record is written and every assertion below would pass vacuously on zeroes.
    await api.spSeasonReward({ pos: 3, size: 10, sponsor: undefined, tier: 5, starId: tok.id } as any);
    const node = (await api.bloodline()).nodes.find((n: any) => n.id === tok.id) as any;
    assert(!!node, 'the bloodline still lists the token we just decorated');
    assert((node?.awards ?? []).length > 0,
      `his honours reach his family-tree node (got ${(node?.awards ?? []).length})`);
    assert((node?.awards ?? []).every((a: any) => a.label && typeof a.season === 'number'),
      'each node honour carries the label and season the medallion renders');
    // AND HIS CAREER RECORD, which the legend card renders. ach_goals/ach_assists/ach_potm were declared,
    // read and rendered but written nowhere except as a literal 0, while ach_apps was written as a flat
    // +18 -- so every legend card permanently read "0 goals · 0 assists · 0 ★ · 18 apps".
    const after = getActiveModel().tokens.find((t: any) => t.id === tok.id) as any;
    assert((after?.ach_goals ?? 0) === 20, `his goals reach his career record (got ${after?.ach_goals}, scored 20)`);
    assert((after?.ach_assists ?? 0) === 20, `and his assists (got ${after?.ach_assists})`);
    assert((after?.ach_potm ?? 0) === 20, `and his player-of-the-match awards (got ${after?.ach_potm})`);
    assert((after?.ach_apps ?? 0) === 20, `and the appearances are his real ones, not a flat +18 (got ${after?.ach_apps})`);
  }
}

console.log('=== 13. missions + trials wiring ===');
const missions = await api.missions();
assert(missions.destinations.length > 0, 'scouting destinations listed');
assert(missions.tripsLeft === missions.tripsPerSeason, 'no trips used yet this season');
const trials = await api.trials();
assert(trials.pool.length > 0, 'a trial pool is generated');

console.log('=== 14. diary + scoutTiers don\'t throw ===');
const diary = await api.diary();
assert(typeof diary.entry === 'string' && diary.entry.length > 0, 'diary() returns a non-empty entry');
const tiers = await api.scoutTiers();
assert(tiers.opp === 'base' && tiers.player === 'base', 'scout tiers default to base off-chain');

console.log('=== 16. setToken()+me() resumes a save the way loadSave() in main.ts does ===');
const reg2 = await api.register('ignored', 'ignored', 'Second Club FC');
setToken(reg.token); // switch back to the FIRST save purely via the token, like main.ts's loadSave()
const meFirst = await api.me();
assert(meFirst.club.name === "Bloodline FC's Club", 'setToken() + me() resumed save #1');
setToken(reg2.token);
const meSecond = await api.me();
assert(meSecond.club.name === "Second Club FC's Club", 'setToken() + me() resumed save #2');

// ── THE PYRAMID PAYS BY DIVISION ─────────────────────────────────────────────────────────────────────
// Checked against numbers stated HERE rather than read back out of the response, at both ends of the
// pyramid. Its own backend and save, because banking two champion seasons would otherwise advance the
// season counter and honours ledger that the checks above depend on.
__setBackendForTests(createInMemoryBackend());
await api.register('tiers', 'x', 'Tier Test', 909);
for (const [tier, wantMult] of [[TIERS, 0.4], [1, 1.6]] as const) {
  const r = await api.spSeasonReward({ pos: 1, size: 10, wins: 24, draws: 8, losses: 6, tier });
  assert(Math.abs(r.tierMult - wantMult) < 1e-6, `tier ${tier} pays x${wantMult} (got x${r.tierMult})`);
  assert(r.prize === Math.round(800 * wantMult * r.houseMult),
    `tier ${tier} champion prize is 800 x ${wantMult} x renown (got ${r.prize})`);
}

console.log('\n=== MAX_SQUAD is a squad bound, not a purchase bound ===');
{
  // LOANEE_CAP limits how many loanees you may sign in a SEASON. MAX_SQUAD limits how many players a
  // squad may HOLD. Different questions, and only `buyPlayer` enforced the second — so a squad already
  // full from the transfer market could still take a free walk-up trialist or a scouted loanee and end up
  // at 29, past the bound the transfer UI shows the player as "Squad full (max 28)".
  //
  // The squad is filled through the PUBLIC api (buyPlayer at fee 0) rather than by writing to the backend,
  // because the facade caches its active model and a direct write would not be the state the code reads.
  let bought = 0;
  for (let i = 0; i < 60 && bought < 60; i++) {
    try { await api.buyPlayer(mintSquadPlayer(`cap-${i}`, 'MF', 10, i * 31 + 5), 0); bought++; }
    catch { break; }
  }
  assert(bought > 0, `filled the squad through buyPlayer until it refused (${bought} signings)`);

  // ASSERT THE REASON, NOT MERELY A THROW. `signTrial` also throws 'no such trialist' and
  // 'you can sign at most N loanees a season'; either would make a bare assertThrows pass while the
  // squad bound stayed unenforced — a check that cannot fail is the defect this repo is full of.
  let msg = '';
  try { await api.signTrial(0); } catch (e) { msg = String((e as Error)?.message ?? e); }
  assert(/squad is full/i.test(msg), `signTrial into a full squad is refused FOR BEING FULL (got: ${msg || 'no throw'})`);
}

console.log('\n=== per-player season stats survive a round trip ===');
{
  // The chain deriveMatchStats -> bumpPlayerStats -> seasonPlayerStats -> SaveModel.playerStats existed in
  // full and was connected at no point; deriveMatchStats' only importer was its own QA harness. This
  // covers the facade half: what onFullTime records must come back out, and must ACCUMULATE across
  // matches rather than overwrite -- a season total that silently reset every week would look plausible
  // and be wrong, which is the failure mode this repo specialises in.
  const before = (await api.seasonStats()).stats.length;
  await api.recordMatchStats({ rows: [
    { id: 'p-1', name: 'A Striker', goals: 2, assists: 0, apps: 1, potm: 1 },
    { id: 'p-2', name: 'A Winger', goals: 0, assists: 1, apps: 1, potm: 0 },
  ] });
  await api.recordMatchStats({ rows: [
    { id: 'p-1', name: 'A Striker', goals: 1, assists: 1, apps: 1, potm: 0 },
  ] });
  const after = (await api.seasonStats()).stats;
  assert(after.length === before + 2, `two players recorded (${before} -> ${after.length})`);
  const striker = after.find((r) => r.player_id === 'p-1');
  assert(striker?.goals === 3 && striker?.assists === 1 && striker?.apps === 2 && striker?.potm === 1,
    `totals ACCUMULATE across matches (3g 1a 2apps 1potm, got ${striker?.goals}g ${striker?.assists}a ${striker?.apps}apps ${striker?.potm}potm)`);
  // a row with no id is not a player; recording it would create a ghost in the table
  await api.recordMatchStats({ rows: [{ id: '', name: 'Nobody', goals: 9, assists: 9, apps: 9, potm: 9 } as any] });
  assert((await api.seasonStats()).stats.length === after.length, 'an id-less row is ignored, not stored as a ghost');
}

console.log('\n=== season awards, and honours reaching the family tree ===');
{
  // The Award row and its store methods existed since the server era with NOTHING calling them -- and for
  // a simpler reason than usual: there was no per-player season data to derive an award from, because
  // deriveMatchStats was itself unwired. Wiring that made these derivable.
  const { seasonAwards } = await import('@fm/shared');
  const rows: any = [
    { season_id: '0', account_id: 'local', player_id: 'z-striker', player_name: 'Z', goals: 12, assists: 2, apps: 30, potm: 4 },
    { season_id: '0', account_id: 'local', player_id: 'a-striker', player_name: 'A', goals: 12, assists: 1, apps: 20, potm: 1 },
    { season_id: '0', account_id: 'local', player_id: 'c-winger',  player_name: 'C', goals: 3,  assists: 9, apps: 34, potm: 2 },
  ];
  const ctx = { seasonId: '0', seasonNumber: 0, tier: '5', accountId: 'local', awardedAt: 0 };
  const got = seasonAwards(rows, ctx);
  assert(got.length === 4, `four honours from a full season (got ${got.length})`);
  // A TIE MUST NOT DEPEND ON ARRAY ORDER. Two men level on 12 goals is a common season, and resolving it
  // by whichever row came back first would differ between runs and platforms.
  assert(got.find((a: any) => a.kind === 'golden_boot')?.player_id === 'a-striker',
    'a tie on goals resolves by stable player id, not array order');
  // An honour for two goals is not an honour; a bad season should award nothing.
  const thin = seasonAwards([{ ...rows[0], goals: 1, assists: 0, apps: 3, potm: 0 }] as any, ctx);
  assert(thin.length === 0, `a season nobody performed in awards nothing (got ${thin.length})`);
  // and the store round-trips them, which is the half that was never called
  const read = await api.awards();
  assert(Array.isArray(read.awards), 'api.awards() reads the store back');

  // THE INTEGRATION, which is the half that actually breaks: recorded matches -> season stats -> the roll.
  // Asserting only the pure function would be exactly the "check that cannot fail" this project keeps
  // finding, since seasonAwards is trivially correct and the WIRING is what was missing.
  {
    const season = String(getActiveModel().profile.season);
    const rows: any = [];
    for (let m = 0; m < 20; m++) rows.push({
      id: 'qa-hotshot', name: 'Hotshot', goals: m % 2 === 0 ? 1 : 0,
      assists: m % 4 === 0 ? 1 : 0, apps: 1, potm: m % 5 === 0 ? 1 : 0, rating: 7,
    });
    await api.recordMatchStats({ rows });
    const before = (await api.awards()).awards.length;
    const roll: any = await api.spSeasonReward({ pos: 4, size: 10, sponsor: undefined, tier: 5 });
    const won = (roll.awards ?? []) as any[];
    assert(won.length > 0, `a real recorded season produces honours at the league roll (got ${won.length})`);
    assert(won.some((a) => a.player_name === 'Hotshot'), 'the man who actually scored them wins one');
    assert(won.every((a) => a.label && a.label !== a.kind), 'every honour carries its readable label for the feed');
    assert((await api.awards()).awards.length > before, 'and the roll persisted them, not just returned them');
  }

}

console.log(failures === 0 ? `\n✓ all offline-facade checks passed` : `\n✗ ${failures} offline-facade check(s) FAILED`);
if (failures > 0) process.exit(1);
