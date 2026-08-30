// Headless smoke test for the phase 3 offline facade (client/src/api.ts). Run: `npx tsx
// client/qa_offline_facade.ts`. Drives the facade exactly as main.ts does — New Game -> prospects ->
// career -> graduation -> a few economy calls -> succeed/reborn — with an in-memory backend injected
// (via `__setBackendForTests`) so no IndexedDB/browser is needed. Asserts no throws and sane shapes;
// does NOT re-verify game rules (shared/career_sim.ts and client/qa_savestore.ts already do that) —
// this is about the WIRING: does every reachable api.ts call run in-process end to end.
import { api, __setBackendForTests, setToken } from './src/api.js';
import { createInMemoryBackend } from './src/save.js';
import { transferList, wageForLength } from '@fm/shared';

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
// The base champion prize is 800, LIFTED by the house's renown — sponsorship and gate follow a famous
// name. Asserting the relationship rather than the old literal, so the check keeps meaning something if
// either the base or the multiplier is retuned; a hard-coded 800 just encodes today's numbers.
assert(reward.houseMult >= 1 && reward.houseMult <= 1.4, `renown income multiplier in range (${reward.houseMult})`);
// The champion prize is the 800 base scaled by the pyramid TIER and by the house's renown. No `tier` is
// passed here, so it defaults to the basement and its 0.4x — winning the bottom division should not pay
// what winning the top one does, which was the defect this multiplier exists to fix.
assert(reward.tierMult > 0.39 && reward.tierMult < 1.61, `tier multiplier in range (${reward.tierMult})`);
assert(reward.prize === Math.round(800 * reward.tierMult * reward.houseMult),
  `champion prize for pos=1/size=10 (800 × ${reward.tierMult} tier × ${reward.houseMult} renown = ${reward.prize})`);
// Coins banked are the prize PLUS whatever the facilities earned off the pitch. At a founding club every
// facility is level 1 — the neutral baseline — so this is 0 here, and asserting the sum rather than the
// prize alone is what will catch it if that ever silently stops being true.
assert(reward.facilities.total >= 0, 'facility income is never negative');
assert(reward.coins === coinsBeforeReward + reward.prize + reward.sponsorBonus + reward.facilities.total,
  `season prize + facility income banked (${reward.prize} + ${reward.sponsorBonus} + ${reward.facilities.total})`);
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
const fair = await api.negotiateStar(prospectId, wageForLength(info, info.prefLength), info.prefLength);
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

console.log(failures === 0 ? `\n✓ all offline-facade checks passed` : `\n✗ ${failures} offline-facade check(s) FAILED`);
if (failures > 0) process.exit(1);
