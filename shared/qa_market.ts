// ── WHAT THIS GUARDS: shared/src/market.ts — the coin economy's constants, the scout-gated stat reveal
//    and the season prize schedule — plus the price surface those constants exist to bound
//    (transfermarket.ts, houses.ts) and the facade that actually spends them (client/src/api.ts) ───────
//
// `market.ts` is 52 lines, six of its seven exports had never been imported by a harness, and it is the
// file whose header says "it handles MONEY". Three things make it worth a harness of its own:
//
//   1. A PRICE DEFECT IS FELT. Every other module in this repo can be wrong quietly. A transfer fee
//      cannot: the player watches the number leave his wallet. So the checks below are on the numbers a
//      real listing really carries, not on the formulas retyped here — `transferFee(ov)` is asserted
//      against fees taken out of `transferList()`, and the buy/sell round trip is driven through
//      `api.buyPlayer` / `api.sellPlayer` with a real in-memory save behind it, because the round trip is
//      the one thing the economy has no second line of defence against. A closed-form check that the
//      formula is lossy proves the formula; only the facade proves the GAME is.
//
//   2. THE CONSTANTS ARE CLAIMS ABOUT A GAME, and claims rot. `START_COINS = 500` is a claim about what
//      `register` hands you; `MIN_SQUAD`/`MAX_SQUAD` are claims about what the facade refuses;
//      `PRICE_MIN`/`PRICE_MAX` are claims about the range every price in the game lives inside. Each is
//      checked by DOING the thing, not by comparing the constant to a copy of itself. `save.ts` writes
//      `coins: 500` as a bare literal rather than importing `START_COINS`, so the two agree today only by
//      coincidence, and nothing but the check below would notice the day one of them moved.
//
//   3. THE SCALE TRAP OF §24. `generateClub(q)` yields an XI measuring `q + 2.35`, and the market shops by
//      handing `tierStrength(tier) + headroom` to `generateClub` — a QUALITY in, a QUALITY out, which is
//      the correct scale — but the number the player then reads on the listing is an `overall()`. §26
//      records that this repo has shipped that confusion twice. §6 below therefore compares the market to
//      the division it shops for with BOTH sides measured by `overall()`, one scale, and prints the margin
//      per tier so the next person can see which end of the pyramid the headroom actually reaches.
//
// The section marked MEASURED is deliberately NOT gated, on the same reasoning qa_mental.ts records:
// those are the defects this file found, and pinning today's behaviour would turn the harness red the day
// somebody fixes one. They are measured on every run so they stay visible, and written up rather than
// asserted. Every number in them is computed here, not quoted from a comment. D0 is the one to read: the
// transfer market has never, in any save, offered a forward — and the existing check for exactly that,
// `every(x => ['GK','DF','MF','FW'].includes(x.player.role))` in qa_transfer_fuzz.ts, cannot fail, because
// a market of pure defenders satisfies it. Every gate below was proved breakable: six single-line
// mutations of market.ts and transfermarket.ts (START_COINS, the sell coefficient, the market headroom,
// the reveal ladder, the sort order, the size argument), each typechecking clean, each turning this file
// red, each restored to green.
//
// Run: `npx tsx shared/qa_market.ts` (auto-globbed by `npm run qa`).
import {
  START_COINS, WIN_COINS, DRAW_COINS, LOSS_COINS, MIN_SQUAD, MAX_SQUAD, PRICE_MIN, PRICE_MAX,
  revealPlayer, seasonPlacementReward, type PlayerScoutTier,
} from './src/market.js';
import {
  transferList, transferFee, sellValue, squadSaleValue, squadSeasonWage, squadRenewCost, wageEra,
  incomingBid, TRANSFER_LIST_SIZE, SQUAD_PEAK_AGE, type Listing,
} from './src/transfermarket.js';
import { houseListings, HOUSE_FEE_PREMIUM } from './src/houses.js';
import { advanceSquadPlayer } from './src/squad.js';
import { overall, generateClub } from './src/teams.js';
import { tierStrength, TIERS, tierName } from './src/clubseason.js';
import type { Player, PlayerAttrs, Role } from './src/types.js';
import { api, __setBackendForTests } from '../client/src/api.js';
import { createInMemoryBackend } from '../client/src/save.js';

let fails = 0;
const ok = (name: string, cond: boolean, detail = '') => {
  console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`);
  if (!cond) fails++;
};
const money = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isInt = (v: number) => Number.isInteger(v);
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const errOf = (e: unknown) => (e instanceof Error ? e.message : String(e));
const ROLES: Role[] = ['GK', 'DF', 'MF', 'FW'];
const TIERS_ALL = Array.from({ length: TIERS }, (_, i) => i + 1);

// ── THE CENSUS — every price the game can actually mint, taken from the real generators ──────────────
// Reused by §3, §4, §5 and §6. Seeds/seasons/tiers are all fixed, so this is the same population on
// every run and on every machine.
const CENSUS_SEEDS = [13, 7919, 104729, 2166136261, 1, 65537];
const CENSUS_SEASONS = [0, 1, 5, 17, 42];
interface Window { seed: number; season: number; tier: number; list: Listing[] }
const WINDOWS: Window[] = [];
for (const seed of CENSUS_SEEDS) for (const season of CENSUS_SEASONS) for (const tier of TIERS_ALL) {
  WINDOWS.push({ seed, season, tier, list: transferList(seed, season, tier) });
}
const ALL_LISTINGS = WINDOWS.flatMap((w) => w.list);
// House sons are rare on purpose (~1 house in 33 a season), so this sweep is wide and cheap: it exits on
// the roll for all but ~3% of (seed, season, house) triples.
const HOUSE_BY_TIER: Record<number, Listing[]> = {};
for (const tier of TIERS_ALL) {
  const out: Listing[] = [];
  for (let s = 1; s <= 260; s++) for (const season of [0, 3, 9, 30]) {
    for (const hl of houseListings(s * 104729, season, tier, 2, tierStrength(tier))) out.push(hl);
  }
  HOUSE_BY_TIER[tier] = out;
}
const ALL_HOUSE = TIERS_ALL.flatMap((t) => HOUSE_BY_TIER[t]);

// ── the facade, with a real in-memory save behind it (same rig client/qa_offline_facade.ts uses) ──────
const WORLD_SEED = 424242;
async function freshSave(name: string) {
  __setBackendForTests(createInMemoryBackend());
  await api.register('qa', 'qa', name, WORLD_SEED);
}
const coinsNow = async () => (await api.me()).account.coins;
const squadNow = async () => (await api.me()).club.players;

// ═════════════════════════════════════════════════════════════════════════════════════════════════════
console.log('=== 1. the constants are claims about the game — checked by DOING, not by comparing ===');
// ═════════════════════════════════════════════════════════════════════════════════════════════════════
{
  ok('every economy constant is a finite positive integer',
    [START_COINS, WIN_COINS, DRAW_COINS, LOSS_COINS, MIN_SQUAD, MAX_SQUAD, PRICE_MIN, PRICE_MAX].every((c) => money(c) && isInt(c) && c > 0));
  ok('a win pays more than a draw pays more than a loss', WIN_COINS > DRAW_COINS && DRAW_COINS > LOSS_COINS, `${WIN_COINS}/${DRAW_COINS}/${LOSS_COINS}`);
  ok('the squad bounds leave room to trade', MIN_SQUAD < MAX_SQUAD && MIN_SQUAD >= 11, `${MIN_SQUAD}..${MAX_SQUAD}`);
  ok('the price bounds are a real interval', PRICE_MIN < PRICE_MAX, `${PRICE_MIN}..${PRICE_MAX}`);

  await freshSave('QA Market FC');
  // START_COINS says "seed balance for a new club". save.ts writes `coins: 500` as a bare literal and does
  // not import the constant, so this is the only thing in the repo that ties the two together.
  ok('START_COINS is what a real new game actually hands you', (await coinsNow()) === START_COINS, `register gave ${await coinsNow()}, constant says ${START_COINS}`);

  // MAX_SQUAD, at the point it is enforced. Also the PT-304 property: eight DIFFERENT listings must become
  // eight DIFFERENT squad members — two collapsing into one id is what bricked the team sheet permanently.
  await api.cupPrize(200000);
  const start = (await squadNow()).length;
  const shop = transferList(4242, 0, 6);
  let boughtIds: string[] = [], sizeStepsOk = true;
  for (let i = 0; start + i < MAX_SQUAD; i++) {
    const before = (await squadNow()).length;
    const r = await api.buyPlayer(shop[i % shop.length].player, shop[i % shop.length].fee);
    if (r.squadSize !== before + 1) sizeStepsOk = false;
  }
  boughtIds = (await squadNow()).map((p) => p.id);
  ok('every buy adds exactly one squad member', sizeStepsOk);
  ok('a full squad holds MAX_SQUAD distinct players (no id collapse)',
    boughtIds.length === MAX_SQUAD && new Set(boughtIds).size === MAX_SQUAD, `${new Set(boughtIds).size} distinct of ${boughtIds.length}, MAX_SQUAD ${MAX_SQUAD}`);
  {
    const before = await coinsNow();
    let threw = '';
    try { await api.buyPlayer(shop[0].player, shop[0].fee); } catch (e) { threw = errOf(e); }
    ok('buying past MAX_SQUAD is refused', threw !== '', threw || 'IT WENT THROUGH');
    ok('...and the refused buy takes no coins', (await coinsNow()) === before, `${before} -> ${await coinsNow()}`);
  }
  // MIN_SQUAD, likewise.
  let sells = 0;
  for (;;) {
    const sq = await squadNow();
    if (sq.length <= MIN_SQUAD) break;
    await api.sellPlayer(sq[sq.length - 1].id); sells++;
    if (sells > 100) break;
  }
  ok('selling stops exactly at MIN_SQUAD', (await squadNow()).length === MIN_SQUAD, `${(await squadNow()).length} left after ${sells} sales`);
  {
    const before = await coinsNow();
    let threw = '';
    try { await api.sellPlayer((await squadNow())[0].id); } catch (e) { threw = errOf(e); }
    ok('selling below MIN_SQUAD is refused', threw !== '', threw || 'IT WENT THROUGH');
    ok('...and the refused sale pays nothing', (await coinsNow()) === before, `${before} -> ${await coinsNow()}`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n=== 2. revealPlayer — the scout tier reveals real values, in order, and never leaks ===');
// ═════════════════════════════════════════════════════════════════════════════════════════════════════
const TIER_ORDER: PlayerScoutTier[] = ['base', 'bronze', 'silver', 'gold'];
{
  // THE GUARANTEED TEN, derived from the game rather than retyped here. A plain (non-rich) generated
  // player carries exactly the attributes every Player is required to have; intersecting across roles and
  // qualities yields that set without this file asserting a list against a copy of itself. If an eleventh
  // required attribute is ever added, this set grows and the reveal check below goes red — which is
  // precisely the notification the scout screen would otherwise never get.
  let guaranteed: string[] | null = null;
  for (let q = 4; q <= 18; q += 2) {
    for (const p of generateClub('g', 'G', 1, q, q * 7919, false).players) {
      const ks = Object.keys(p.attrs);
      guaranteed = guaranteed === null ? ks : guaranteed.filter((k) => ks.includes(k));
    }
  }
  const CORE = (guaranteed ?? []).slice().sort();
  ok('every player the game mints carries the same guaranteed attribute set', CORE.length === 10, `${CORE.length}: ${CORE.join(',')}`);

  // One real, rich player of each role. These come from `generateClub(rich)` — the same mint the market
  // uses — and NOT from the market itself, because the market never offers a forward (see D0) and a
  // reveal harness fed only by the market would silently never test a forward at all.
  const sample: Record<string, Player> = {};
  for (const p of generateClub('rv', 'RV', 1, 14, 991, true).players) if (!sample[p.role]) sample[p.role] = p;
  ok('a reveal fixture exists for all four roles', ROLES.every((r) => sample[r] !== undefined), Object.keys(sample).join(','));

  let counts: number[] = [], nested = 0, valuesTrue = 0, pure = 0, overallShown = 0, permutation = 0, cases = 0;
  for (const role of ROLES) {
    const p = sample[role]; if (!p) continue;
    const before = JSON.stringify(p);
    const shown = TIER_ORDER.map((t) => Object.keys(revealPlayer(p, t).attrs));
    if (JSON.stringify(p) === before) pure++;
    counts = shown.map((s) => s.length);
    for (let i = 1; i < shown.length; i++) if (shown[i - 1].every((k) => shown[i].includes(k))) nested++;
    for (const t of TIER_ORDER) {
      cases++;
      const r = revealPlayer(p, t);
      const attrs = r.attrs as Record<string, number | undefined>;
      if (Object.keys(attrs).every((k) => attrs[k] === (p.attrs as unknown as Record<string, number>)[k])) valuesTrue++;
      if (r.overall === overall(p)) overallShown++;
    }
    const gold = shown[3].slice().sort();
    if (gold.length === new Set(gold).size && gold.length === CORE.length && gold.every((k, i) => k === CORE[i])) permutation++;
  }
  ok('revealPlayer never mutates the player it is shown', pure === ROLES.length, `${pure}/${ROLES.length}`);
  ok('each tier reveals strictly more than the last, and never un-reveals', nested === ROLES.length * 3, `${nested}/${ROLES.length * 3}`);
  ok('a revealed attribute always carries the player\'s REAL value', valuesTrue === cases, `${valuesTrue}/${cases}`);
  ok('the overall is shown at every tier, base included (info-not-power)', overallShown === cases, `${overallShown}/${cases}`);
  ok('a gold scout sees every attribute the game guarantees, once each, for every role',
    permutation === ROLES.length, `${permutation}/${ROLES.length} roles cover all ${CORE.length}`);
  ok('the reveal ladder climbs 0 -> 3 -> 6 -> 10', counts.join(',') === '0,3,6,10', counts.join(','));

  // An unknown tier must degrade to the SAFE end (show nothing), never to the generous one.
  const junk = revealPlayer(sample.MF ?? sample.DF ?? sample.GK ?? sample.FW, 'platinum' as PlayerScoutTier);
  ok('an unrecognised scout tier reveals nothing rather than everything', Object.keys(junk.attrs).length === 0, `${Object.keys(junk.attrs).length} attrs shown`);

  // A player short of the optional stats (a legacy save) must not surface `undefined` as a stat value.
  const thin: Player = { ...(sample.MF ?? ALL_LISTINGS[0].player), attrs: Object.fromEntries(CORE.map((k) => [k, 11])) as unknown as PlayerAttrs };
  const thinGold = revealPlayer(thin, 'gold');
  ok('a legacy player with only the guaranteed stats reveals no undefined values',
    Object.values(thinGold.attrs).every((v) => typeof v === 'number' && Number.isFinite(v)), `${Object.keys(thinGold.attrs).length} shown`);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════════
const UNDER_MIN = { n: 0, example: '', widest: 0 };
console.log('\n=== 3. the price surface: monotone in ability, never free, never non-finite ===');
// ═════════════════════════════════════════════════════════════════════════════════════════════════════
{
  let feeUp = 0, sellUp = 0, haircut = 0, steps = 0;
  for (let ov = 1; ov < 20; ov++) {
    steps++;
    if (transferFee(ov + 1) > transferFee(ov)) feeUp++;
    if (sellValue(ov + 1) > sellValue(ov)) sellUp++;
    if (sellValue(ov) < transferFee(ov)) haircut++;
  }
  ok('a better player always costs more to buy', feeUp === steps, `${feeUp}/${steps}`);
  ok('a better player is always worth more to sell', sellUp === steps, `${sellUp}/${steps}`);
  ok('the sell value is always under the buy fee — the haircut holds at every ability', haircut === steps, `${haircut}/${steps}`);

  // The ability scale is 1-20 and both ends are CLAMPED, not extrapolated: an off-scale rating must not
  // buy a cheaper player or a dearer one than the ceiling.
  const offscale = [-1000, -1, 0, 0.5, 20.5, 21, 1000];
  ok('an off-scale rating clamps to the 1-20 price, never past it',
    offscale.every((v) => transferFee(v) >= transferFee(1) && transferFee(v) <= transferFee(20) && sellValue(v) >= sellValue(1) && sellValue(v) <= sellValue(20)),
    `fee(-1000)=${transferFee(-1000)} fee(1)=${transferFee(1)} fee(1000)=${transferFee(1000)} fee(20)=${transferFee(20)}`);

  // Age: at EQUAL ability an older man is never dearer and never worth more. Checked on the real listings
  // — the youth premium lives inside transferList and is not retyped here.
  const byOv = new Map<number, Listing[]>();
  for (const l of ALL_LISTINGS) { const a = byOv.get(l.ov) ?? []; a.push(l); byOv.set(l.ov, a); }
  let agePairs = 0, ageOk = 0;
  for (const [, group] of byOv) for (const a of group) for (const b of group) {
    if (a.age >= b.age) continue;
    agePairs++;
    if (b.fee <= a.fee) ageOk++;
  }
  ok('at equal ability the older man is never the dearer signing', ageOk === agePairs, `${ageOk}/${agePairs} ordered pairs across ${byOv.size} ability bands`);
  let saleAgeOk = 0, saleAgeSteps = 0, floorOk = 0;
  for (let ov = 1; ov <= 20; ov++) {
    for (let age = 16; age < 46; age++) { saleAgeSteps++; if (squadSaleValue(ov, age + 1) <= squadSaleValue(ov, age)) saleAgeOk++; }
    if (squadSaleValue(ov, 999) >= Math.round(sellValue(ov) * 0.2) - 1) floorOk++;
  }
  ok('a player\'s sale value never rises with age', saleAgeOk === saleAgeSteps, `${saleAgeOk}/${saleAgeSteps}`);
  ok('...and never decays past the documented 20% floor', floorOk === 20, `${floorOk}/20, e.g. ov20 at 999 = ${squadSaleValue(20, 999)} vs floor ${Math.round(sellValue(20) * 0.2)}`);
  ok('a player at his peak age takes no age discount at all', Array.from({ length: 20 }, (_, i) => i + 1).every((ov) => squadSaleValue(ov, SQUAD_PEAK_AGE) === sellValue(ov)));

  // EVERY price the game can mint, from the real generators. Split by side of the counter, because
  // PRICE_MIN/PRICE_MAX are declared as bounds on what a player is BOUGHT for.
  const buySide: Array<{ what: string; v: number }> = [];
  const paidOut: Array<{ what: string; v: number }> = [];
  for (const l of ALL_LISTINGS) { buySide.push({ what: `listing ov${l.ov}`, v: l.fee }); paidOut.push({ what: `sale ov${l.ov} age${l.age}`, v: squadSaleValue(l.ov, l.age) }); }
  for (const l of ALL_HOUSE) buySide.push({ what: `house ov${l.ov}`, v: l.fee });
  for (let ov = 1; ov <= 20; ov++) for (let age = 18; age <= 45; age++) {
    const b = incomingBid(ov * 7919 + age, age, ov, age);
    if (b) paidOut.push({ what: `bid ov${ov}`, v: b.fee });
    buySide.push({ what: `wage ov${ov}`, v: squadSeasonWage(ov, age) });
    buySide.push({ what: `renew ov${ov}`, v: squadRenewCost(ov, age) });
    paidOut.push({ what: `sale ov${ov} age${age}`, v: squadSaleValue(ov, age) });
  }
  const prices = [...buySide, ...paidOut];
  const bad = prices.filter((p) => !money(p.v) || !isInt(p.v) || p.v <= 0);
  ok('no price in the game is zero, negative, fractional or non-finite', bad.length === 0,
    bad.length ? `${bad.length} bad, e.g. ${bad[0].what}=${bad[0].v}` : `${prices.length} prices from real listings, house sons, bids, wages and sales`);
  const feesOutside = [...ALL_LISTINGS, ...ALL_HOUSE].filter((l) => l.fee < PRICE_MIN || l.fee > PRICE_MAX);
  ok('every transfer FEE the game can quote lies inside [PRICE_MIN, PRICE_MAX]', feesOutside.length === 0,
    feesOutside.length ? `${feesOutside.length} outside, e.g. ov${feesOutside[0].ov} = ${feesOutside[0].fee}`
      : `${Math.min(...[...ALL_LISTINGS, ...ALL_HOUSE].map((l) => l.fee))}..${Math.max(...[...ALL_LISTINGS, ...ALL_HOUSE].map((l) => l.fee))} against ${PRICE_MIN}..${PRICE_MAX}`);
  const under = prices.filter((p) => p.v < PRICE_MIN);
  UNDER_MIN.n = under.length;
  UNDER_MIN.example = under.length ? `${under[0].what} = ${under[0].v}` : '';
  UNDER_MIN.widest = Math.max(...[...ALL_LISTINGS, ...ALL_HOUSE].map((l) => l.fee));
  ok('the wage era multiplier is bounded and monotone, so inflation cannot run away',
    wageEra(0) === 1 && wageEra(1e6) < 2.0000001 && Array.from({ length: 60 }, (_, i) => i).every((s) => wageEra(s + 1) > wageEra(s)),
    `season 0 ${wageEra(0).toFixed(2)} … 20 ${wageEra(20).toFixed(2)} … 100 ${wageEra(100).toFixed(2)} … ceiling ${wageEra(1e6).toFixed(2)}`);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n=== 4. THE ROUND TRIP — buy a man and sell him back. This must never make money ===');
// ═════════════════════════════════════════════════════════════════════════════════════════════════════
// A round trip that profits is a money printer, and the economy has no other defence against one: the
// squad screen has no cooldown, no listing limit and no per-season cap, so a single profitable (ov, age)
// pair would be worth an unbounded number of coins in one sitting. PT-303 records this exact shape going
// live once already — a free trialist, signed and sold on repeat.
{
  // (a) EVERY listing the census produced, priced by the game, sold back by the game's own sale rule.
  let worst = -Infinity, worstAt = '', profitable = 0;
  for (const l of [...ALL_LISTINGS, ...ALL_HOUSE]) {
    const net = squadSaleValue(l.ov, l.age) - l.fee;
    if (net >= 0) profitable++;
    if (net > worst) { worst = net; worstAt = `ov ${l.ov} age ${l.age}: paid ${l.fee}, sold ${squadSaleValue(l.ov, l.age)}`; }
  }
  ok('no listing in the game can be bought and sold back at a profit', profitable === 0,
    `${ALL_LISTINGS.length + ALL_HOUSE.length} real listings, best case still loses ${-worst} (${worstAt})`);

  // (b) the same claim over the WHOLE (ability, age) plane, so a future price tweak that opens a corner
  //     the census happens not to sample is still caught.
  let gridWorst = -Infinity, gridAt = '', gridBad = 0, gridN = 0;
  for (let ov = 1; ov <= 20; ov++) for (let age = 16; age <= 45; age++) {
    gridN++;
    // the cheapest the game will ever sell him for is the flat fee with no premium; the most it will ever
    // pay back is the un-aged sale value. Even that most-generous pairing must lose.
    const net = sellValue(ov) - transferFee(ov);
    if (net >= 0) gridBad++;
    const real = squadSaleValue(ov, age) - transferFee(ov);
    if (real > gridWorst) { gridWorst = real; gridAt = `ov ${ov} age ${age}`; }
  }
  ok('even the most generous buy/sell pairing in the price model loses money', gridBad === 0,
    `${gridN} (ability, age) cells, best margin ${gridWorst} at ${gridAt}`);

  // (c) THROUGH THE REAL FACADE. (a) and (b) prove the formulas are lossy; only this proves the GAME is —
  //     `buyPlayer` charges one number and `sellPlayer` computes another, and nothing but a live round
  //     trip checks that the two are still the same pair of numbers.
  await freshSave('QA Round Trip FC');
  await api.cupPrize(400000);
  let trips = 0, gains = 0, worstLive = -Infinity, liveDetail = '';
  for (const tier of [1, 4, 7, 10]) {
    for (const l of transferList(31337, 2, tier)) {
      const before = await coinsNow();
      await api.buyPlayer(l.player, l.fee);
      const mine = (await squadNow()).filter((p) => p.id.startsWith('bought-'));
      const him = mine[mine.length - 1];
      const r = await api.sellPlayer(him.id);
      const net = r.coins - before;
      trips++;
      if (net >= 0) gains++;
      if (net > worstLive) { worstLive = net; liveDetail = `tier ${tier} ov ${l.ov} age ${l.age}: paid ${l.fee}, got back ${r.value}`; }
    }
  }
  ok('buying and immediately selling through the real facade always LOSES coins', gains === 0,
    `${trips} live round trips, best still loses ${-worstLive} (${liveDetail})`);

  // (d) THE PATIENT VERSION. Buy a kid, develop him through the real squad model at a maxed Training
  //     ground, pay the real wage every season, and sell at the best possible moment. This is the loop a
  //     player would actually find, and it is the one a closed-form check cannot see.
  let bestNet = -Infinity, bestAt = '', profitableHolds = 0, holds = 0;
  for (const tier of [1, 5, 10]) {
    for (const l of transferList(4242, 0, tier)) {
      if (l.age > 23) continue;
      let p: Player = { ...l.player, attrs: { ...l.player.attrs }, age: l.age };
      let spend = l.fee;
      for (let season = 0; season < 14; season++) {
        spend += squadSeasonWage(overall(p), season);
        p = advanceSquadPlayer(p, 10);
        const net = squadSaleValue(overall(p), p.age ?? 26) - spend;
        holds++;
        if (net >= 0) profitableHolds++;
        if (net > bestNet) { bestNet = net; bestAt = `tier ${tier}: ov ${l.ov} age ${l.age} for ${l.fee}, held ${season + 1} seasons -> ov ${overall(p)} age ${p.age}, sold ${squadSaleValue(overall(p), p.age ?? 26)} against ${spend} spent`; }
      }
    }
  }
  ok('buy-young, develop and sell never profits either, at any hold length', profitableHolds === 0,
    `${holds} (signing, hold length) pairs, best still loses ${-bestNet} — ${bestAt}`);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n=== 5. the listing: deterministic, sized as declared, and every row a real player ===');
// ═════════════════════════════════════════════════════════════════════════════════════════════════════
{
  const key = (l: Listing[]) => l.map((x) => `${x.player.id}/${x.player.name}/${x.player.role}/${x.ov}/${x.age}/${x.fee}/${JSON.stringify(x.player.attrs)}`).join('|');
  let same = 0;
  for (const w of WINDOWS) if (key(transferList(w.seed, w.season, w.tier)) === key(w.list)) same++;
  ok('the same (seed, season, tier) always returns the identical market', same === WINDOWS.length, `${same}/${WINDOWS.length} windows`);

  // A parameter that does not move the result is a parameter that is not being read — the same defect
  // class as a trait bonus keyed on an id no catalogue entry has.
  ok('the seed actually reaches the market', key(transferList(1, 3, 5)) !== key(transferList(2, 3, 5)));
  ok('the season actually reaches the market', key(transferList(1, 3, 5)) !== key(transferList(1, 4, 5)));
  ok('the tier actually reaches the market', key(transferList(1, 3, 5)) !== key(transferList(1, 3, 6)));

  ok('the default window is exactly TRANSFER_LIST_SIZE rows', WINDOWS.every((w) => w.list.length === TRANSFER_LIST_SIZE), `TRANSFER_LIST_SIZE = ${TRANSFER_LIST_SIZE}`);
  const sizes = [0, 1, 3, 8, 12, 16, 20];
  ok('an explicit size is honoured exactly, up to the pool', sizes.every((n) => transferList(9, 1, 4, n).length === n), sizes.map((n) => `${n}->${transferList(9, 1, 4, n).length}`).join(' '));

  // PT-304: two listings that collapse to one squad id put two men under one key, and sellPlayer's filter
  // then removes BOTH. A save has ONE world seed, so the contract that matters is uniqueness across every
  // window a single save can ever open — all seasons, all tiers, for its own seed. (The seed is not part
  // of the listing id, which is fine: two saves never share a squad.)
  let uniquePerSave = 0;
  for (const seed of CENSUS_SEEDS) {
    const ids = WINDOWS.filter((w) => w.seed === seed).flatMap((w) => w.list.map((l) => l.player.id));
    if (new Set(ids).size === ids.length) uniquePerSave++;
  }
  ok('within one save, no two listings ever share an id (PT-304)', uniquePerSave === CENSUS_SEEDS.length,
    `${uniquePerSave}/${CENSUS_SEEDS.length} saves, ${CENSUS_SEASONS.length * TIERS} windows each`);
  ok('every window offers distinct rows', WINDOWS.every((w) => new Set(w.list.map((l) => l.player.id)).size === w.list.length));

  let wellFormed = 0, sorted = 0;
  for (const w of WINDOWS) {
    if (w.list.every((l) => ROLES.includes(l.player.role) && l.age >= 18 && l.age <= 32 && l.player.age === l.age
      && l.ov >= 1 && l.ov <= 20 && l.ov === overall(l.player) && typeof l.player.name === 'string' && l.player.name.length > 1
      && Object.values(l.player.attrs).every((v) => v === undefined || (money(v) && v >= 1 && v <= 20)))) wellFormed++;
    if (w.list.every((l, i) => i === 0 || w.list[i - 1].ov >= l.ov)) sorted++;
  }
  ok('every row is a legal, fully-formed player whose advertised OV is his real one', wellFormed === WINDOWS.length, `${wellFormed}/${WINDOWS.length} windows`);
  ok('the market is presented best-first', sorted === WINDOWS.length, `${sorted}/${WINDOWS.length}`);
  ok('the age stamped on the listing is the age carried into the squad (PT-90)',
    ALL_LISTINGS.every((l) => l.player.age === l.age), `${ALL_LISTINGS.length} listings`);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n=== 6. §24: the shop and the division, compared on ONE scale ===');
// ═════════════════════════════════════════════════════════════════════════════════════════════════════
// `transferList` hands `tierStrength(tier) + headroom` to `generateClub` — a quality against a quality,
// which is correct. But the number the player then reads is an `overall()`, and §24 records that a club
// measured by `overall()` runs ~2.35 above the quality it was generated from. So the check that matters
// is not "is the quality bigger" but "is the SHOP measurably better than the DIVISION", with both sides
// measured the same way. Headroom is the only lever that lets a club outgrow its league (§24), so if this
// margin ever goes to zero the climb stops being buyable and the pyramid closes at whatever tier the club
// happens to be sitting in.
const MARGIN: Array<{ tier: number; market: number; division: number }> = [];
{
  for (const tier of TIERS_ALL) {
    const market: number[] = [], division: number[] = [];
    for (let s = 0; s < 10; s++) {
      for (const l of transferList(s * 7919 + 13, s, tier)) market.push(l.ov);
      for (const p of generateClub(`d${tier}`, 'D', 1, tierStrength(tier), s * 104729 + 7, true).players) division.push(overall(p));
    }
    MARGIN.push({ tier, market: mean(market), division: mean(division) });
  }
  const thin = MARGIN.filter((m) => m.market - m.division < 1);
  ok('the market can strengthen a club above its own division, at every tier', thin.length === 0,
    thin.length ? thin.map((m) => `tier ${m.tier} margin ${(m.market - m.division).toFixed(2)}`).join('; ')
      : MARGIN.map((m) => `t${m.tier} +${(m.market - m.division).toFixed(1)}`).join(' '));
  // and the division itself must still get harder as you climb, or the market is compensating for nothing
  ok('a higher division is a genuinely stronger division', MARGIN.every((m, i) => i === 0 || MARGIN[i - 1].division > m.division),
    MARGIN.map((m) => m.division.toFixed(1)).join(' > '));
  // TOLERANCE OF 0.5, NOT 0.1, AND THE REASON IS A DESIGNED PLATEAU RATHER THAN NOISE-FITTING.
  // `transferList` hands generateClub `clamp(tierStrength(tier) + headroom, 4, 18)`, and that clamp
  // SATURATES at the top: tier 1 = 18.0, tier 2 = 18.0, tier 3 = 17.9. The top three divisions shop in
  // the same market by construction, so their measured ordering is decided by role mix, not by quality,
  // and a strict monotone bar there cannot distinguish a regression from a rounding artefact. It fired
  // the moment the market was fixed to actually contain forwards (it had never listed one), because
  // `overall()` is role-weighted and the mix moved by about 0.2.
  // Below the plateau the steps are 1.3 of quality apart, so 0.5 still catches a real inversion there.
  ok('the shop never gets WORSE as you climb', MARGIN.every((m, i) => i === 0 || MARGIN[i - 1].market >= m.market - 0.5),
    MARGIN.map((m) => m.market.toFixed(1)).join(' '));
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n=== 7. seasonPlacementReward — a prize schedule must reward doing better ===');
// ═════════════════════════════════════════════════════════════════════════════════════════════════════
{
  let n = 0, finite = 0, positive = 0, betterPaysMore = 0, betterSteps = 0, promoPays = 0, biggerPodPays = 0;
  for (let ti = 0; ti < TIERS; ti++) for (const pod of [2, 4, 10, 16, 20, 24]) for (let pos = 1; pos <= pod; pos++) {
    n++;
    const v = seasonPlacementReward(ti, pos, pod, false);
    if (money(v) && isInt(v)) finite++;
    if (v > 0) positive++;
    if (seasonPlacementReward(ti, pos, pod, true) > v) promoPays++;
    if (pos > 1) { betterSteps++; if (seasonPlacementReward(ti, pos - 1, pod, false) > v) betterPaysMore++; }
    if (pod < 24 && seasonPlacementReward(ti, pos, pod + 1, false) > v) biggerPodPays++;
  }
  ok('every prize in the legal domain is a finite whole number of coins', finite === n, `${finite}/${n}`);
  ok('...and is never zero or negative', positive === n, `${positive}/${n}`);
  ok('finishing one place higher always pays more', betterPaysMore === betterSteps, `${betterPaysMore}/${betterSteps}`);
  ok('promotion always pays a bonus on top', promoPays === n, `${promoPays}/${n}`);
  ok('winning a bigger league pays more than winning a smaller one', biggerPodPays > 0, `${biggerPodPays} of ${n} pod-size steps`);
  ok('a champion is paid strictly more than the linear place money would give',
    seasonPlacementReward(3, 1, 20, false) - seasonPlacementReward(3, 2, 20, false) > seasonPlacementReward(3, 2, 20, false) - seasonPlacementReward(3, 3, 20, false),
    `1st ${seasonPlacementReward(3, 1, 20, false)} / 2nd ${seasonPlacementReward(3, 2, 20, false)} / 3rd ${seasonPlacementReward(3, 3, 20, false)}`);
  ok('a finish outside the pod floors instead of going negative', seasonPlacementReward(0, 99, 20, false) > 0, `${seasonPlacementReward(0, 99, 20, false)}`);
  let tierUp = 0;
  for (let ti = 0; ti < TIERS - 1; ti++) if (seasonPlacementReward(ti + 1, 1, 20, false) > seasonPlacementReward(ti, 1, 20, false)) tierUp++;
  ok('a higher tierIndex pays more (the schedule\'s own stated direction)', tierUp === TIERS - 1, `${tierUp}/${TIERS - 1}`);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n=== MEASURED — defects found writing this file. Reported, NOT gated. ===');
// ═════════════════════════════════════════════════════════════════════════════════════════════════════
{
  // ── D0 ── THE ONE TO READ FIRST: the transfer market has never sold anybody a striker.
  const roleCount: Record<string, number> = { GK: 0, DF: 0, MF: 0, FW: 0 };
  for (const l of ALL_LISTINGS) roleCount[l.player.role]++;
  const mixes = new Set(WINDOWS.map((w) => ROLES.map((r) => `${r}${w.list.filter((l) => l.player.role === r).length}`).join(' ')));
  let houseWindows = 0, houseFwWindows = 0;
  for (let s = 1; s <= 200; s++) for (const season of [0, 3, 9, 30]) for (const tier of TIERS_ALL) {
    houseWindows++;
    if (houseListings(s * 104729, season, tier, 2, tierStrength(tier)).some((x) => x.player.role === 'FW')) houseFwWindows++;
  }
  // ── NOW A BAR, because the defect it reported is FIXED. transferList took a PREFIX of a roster ordered
  // GK,GK, DF x7, MF x7, FW x4, so at size 12 it was exactly 2 GK + 7 DF + 3 MF and never once a forward,
  // in any seed, season or tier, in a squad-building football game. It now allocates proportionally with a
  // floor of one per position. These were console.log lines when this harness was written — correct then,
  // since a bar would have been red on arrival — and they are bars now, or nothing holds the fix.
  for (const r of ROLES) {
    ok(`the market offers ${r}s at all`, roleCount[r] > 0, `${roleCount[r]} of ${ALL_LISTINGS.length} listings`);
  }
  const fwShare = roleCount.FW / ALL_LISTINGS.length;
  ok('forwards are a real share of the market, not a token', fwShare >= 0.12,
    `${(100 * fwShare).toFixed(1)}% (the roster is 20% forwards)`);
  const noFw = WINDOWS.filter((w) => !w.list.some((l) => l.player.role === 'FW')).length;
  ok('no single market window is striker-less', noFw === 0, `${noFw} of ${WINDOWS.length} windows had none`);
  ok('the market is not one fixed position mix in every save', mixes.size > 1,
    `${mixes.size} distinct mixes across ${WINDOWS.length} windows`);
  console.log(`  D0 ${ALL_LISTINGS.length} listings across ${WINDOWS.length} markets — every seed, season and tier — contained ${roleCount.FW} forwards.`);
  console.log(`     Every market in the game is the identical position mix: ${[...mixes].join(' / ')}.`);
  console.log('     `transferList` generates a 20-man club and then takes `pool[i]` for i < size. ROSTER_ROLES is ordered');
  console.log('     GK,GK, DF x7, MF x7, FW x4, so the first TRANSFER_LIST_SIZE = ' + TRANSFER_LIST_SIZE + ' entries stop three men short of the');
  console.log('     forwards and four short of the midfielders. The code\'s own comment says it takes "a spread across');
  console.log('     positions" and the header says "across all four positions"; it takes a prefix. Raise the size to the full');
  console.log(`     roster and the strikers appear (${transferList(1, 0, 5, 20).filter((l) => l.player.role === 'FW').length} of 20), so nothing is wrong with the generator — only with the slice.`);
  console.log(`     The single way to sign a forward is a rival house\'s son, offered in ${(100 * houseFwWindows / houseWindows).toFixed(1)}% of season-windows.`);
  console.log('     qa_transfer_fuzz.ts already "checks" this and cannot fail: `every(x => [GK,DF,MF,FW].includes(x.role))`');
  console.log('     passes for a market of pure defenders. A game about building a squad to climb a pyramid sells you seven');
  console.log('     centre-halves and no centre-forward, and has done in every save ever played.');

  // ── D1 ── the gold scout is told he can see everything, and cannot see the half that decides matches.
  const p = ALL_LISTINGS[0].player;
  const total = Object.keys(p.attrs).length;
  const rows = TIER_ORDER.map((t) => { const r = revealPlayer(p, t); return `${t}: shows ${Object.keys(r.attrs).length}, says ${r.hidden} hidden, really hides ${total - Object.keys(r.attrs).length}`; });
  const never = Object.keys(p.attrs).filter((k) => !Object.keys(revealPlayer(p, 'gold').attrs).includes(k));
  console.log(`  D1 revealPlayer.hidden is hard-coded as \`10 - n\`, but a real market player carries ${total} attributes.`);
  console.log(`     ${rows.join('  |  ')}`);
  console.log(`     A GOLD scout is told hidden = 0 while these stay locked forever: ${never.join(', ')}.`);
  console.log('     Those are the five stats the match engine reads (mental.ts) plus injury resistance — the layer the');
  console.log('     bloodline inherits. The most expensive scout tier in the game reports full disclosure and delivers');
  console.log(`     ${Math.round((100 * Object.keys(revealPlayer(p, 'gold').attrs).length) / total)}% of the player.`);

  // ── D2 ── the exported prize schedule is not the prize the game pays, and it has already cost money.
  await freshSave('QA Prize FC');
  const live: Record<string, number> = {};
  for (const tier of [1, TIERS]) {
    await freshSave('QA Prize FC');
    const r = await api.spSeasonReward({ pos: 1, size: 20, tier, kind: 'league' });
    live[`t${tier}`] = r.prize;
  }
  const careerIdx = (tier: number) => TIERS - tier;               // prestige.ts / career.ts: 0 = Sunday … 9 = World Class
  console.log(`\n  D2 seasonPlacementReward is not what the game pays, and the two disagree by more than a factor of two.`);
  console.log(`     A 20-club title, measured through the real season roll (api.spSeasonReward):`);
  console.log(`       top flight   live ${live.t1}   |  seasonPlacementReward ${seasonPlacementReward(careerIdx(1), 1, 20, false)}  (career tier index)`);
  console.log(`       Sunday League live ${live[`t${TIERS}`]}   |  seasonPlacementReward ${seasonPlacementReward(careerIdx(TIERS), 1, 20, false)}  (career tier index)`);
  console.log('     facilities.ts\'s own header records this schedule being read as the real prize once already: "it used');
  console.log(`     seasonPlacementReward (${seasonPlacementReward(9, 1, 20, true)}) where the real prize is ${live.t1}". Income came out 45% high, the facility`);
  console.log('     upkeep coefficient was fitted to it, levels 6-10 became unreachable and a relegated club sat on 0');
  console.log('     coins for sixty straight seasons. The wrong number is still exported, still unused, still plausible.');

  // ── D3 ── and the same function reads a tier index in the OPPOSITE direction to the rest of the repo.
  console.log(`\n  D3 \`tierIndex\` in market.ts counts UP from the basement (its comment: "Sunday League x1.0 … World Class x3.7"),`);
  console.log(`     matching prestige.ts and career.ts. Everywhere else — TIERS, tierName, tierStrength, spSeasonReward's`);
  console.log(`     \`tier\` argument — 1 is the TOP flight. Hand this function the pyramid tier the rest of the game passes`);
  console.log(`     around and the prize inverts: ${tierName(1)} champion ${seasonPlacementReward(1, 1, 20, false)}, ${tierName(TIERS)} champion ${seasonPlacementReward(TIERS, 1, 20, false)}`);
  console.log(`     — the basement paid ${(seasonPlacementReward(TIERS, 1, 20, false) / seasonPlacementReward(1, 1, 20, false)).toFixed(1)}x the top flight, in a function whose comment is "Higher divisions pay more (a`);
  console.log('     reason to climb)". Nothing calls it today, so nothing is red; the trap is armed for whoever wires it.');

  // ── D4 ── the undefended domain, next to a live sibling that defends the same one.
  console.log(`\n  D4 seasonPlacementReward validates nothing, while api.ts's spSeasonReward — the live prize — clamps pos,`);
  console.log('     cross-clamps pos > size, range-checks the tier and console.warns on a bad one:');
  console.log(`       pos = 0        -> ${seasonPlacementReward(0, 0, 20, false)}          pos = -100 -> ${seasonPlacementReward(0, -100, 20, false)}   (a better-than-first finish pays better than first)`);
  console.log(`       podSize = 1e9  -> ${seasonPlacementReward(0, 1, 1e9, false)}`);
  console.log(`       tierIndex = -5 -> ${seasonPlacementReward(-5, 1, 20, false)}          (a NEGATIVE payout — a coin burn)`);
  console.log(`       pos = NaN      -> ${seasonPlacementReward(0, NaN, 20, false)}          (save.ts's addCoins refuses a non-finite delta, so this pays silently nothing)`);

  // ── D5 ── the per-match earnings constants describe income the game does not pay, at a scale that would
  //          dwarf everything if anyone believed them.
  console.log(`\n  D5 WIN_COINS/DRAW_COINS/LOSS_COINS (${WIN_COINS}/${DRAW_COINS}/${LOSS_COINS}) are advertised as "match earnings". The season roll pays no`);
  console.log(`     per-match coins at all — facilities.ts records a calibration that "added 2,810 of per-match WIN/DRAW/LOSS`);
  console.log(`     earnings that the manager season roll does not pay". At 18 fixtures a season an all-win record would be`);
  console.log(`     ${18 * WIN_COINS} coins against a measured top-flight title prize of ${live.t1} — one wired constant would outweigh winning`);
  console.log('     the league. Same for PRICE_MIN/PRICE_MAX: nothing reads them, they bound a feature that no longer exists');
  console.log(`     (the header\'s "managers list squad players for coins" — you sell at a computed price, you never set one),`);
  console.log(`     the widest fee the game can quote is ${UNDER_MIN.widest} against a declared ceiling of ${PRICE_MAX}, and ${UNDER_MIN.n} of the amounts it really`);
  console.log(`     moves fall UNDER the declared floor of ${PRICE_MIN} anyway (e.g. ${UNDER_MIN.example}).`);

  // ── D6 ── the same man, twice, in one squad — and the only thing stopping it is not in the save.
  await freshSave('QA Dupe FC');
  await api.cupPrize(100000);
  const l0 = transferList(12345, 0, 5)[0];
  await api.buyPlayer(l0.player, l0.fee);
  await api.buyPlayer(l0.player, l0.fee);
  const copies = (await squadNow()).filter((q) => q.name === l0.player.name);
  const relisted = transferList(12345, 0, 5).some((x) => x.player.id === l0.player.id);
  console.log(`\n  D6 The same listing can be signed twice: the squad now holds ${copies.length} of "${l0.player.name}" (${copies.map((c) => c.id).join(', ')}),`);
  console.log(`     identical age and rating, and the market still lists him afterwards (${relisted}). transferList is pure and has`);
  console.log('     no memory of the club, which is right; but the ONLY thing that hides a signed player is main.ts filtering');
  console.log('     on a localStorage key (`fm_bought_<handle>_<season>`) that is not part of the save. Clear site data, open');
  console.log('     the save in another browser, or move it to another machine — offline-first, the save is the artefact —');
  console.log('     and the men you already bought are back on the shelf.');

  // ── D7 ── the facade computes what it PAYS you and trusts what it CHARGES you.
  await freshSave('QA Fee FC');
  const l1 = transferList(777, 0, 3)[0];
  const before = await coinsNow();
  await api.buyPlayer(l1.player, 0);
  const gotFree = (await squadNow()).filter((q) => q.id.startsWith('bought-')).slice(-1)[0];
  const sold = await api.sellPlayer(gotFree.id);
  console.log(`\n  D7 buyPlayer takes the FEE FROM ITS CALLER (\`Math.max(0, Math.round(fee))\`) while sellPlayer computes the sale`);
  console.log(`     price itself from the player. Signing a ${l1.fee}-coin listing for 0 and selling him back nets +${sold.coins - before} coins a cycle,`);
  console.log('     unbounded and instant. This is single-player and offline, so it is self-cheating rather than an exploit —');
  console.log('     but it is the exact shape PT-303 fixed in this same file ("sign a free trialist, sell him, repeat"), and');
  console.log('     the fix went into the facade, not the UI, because the facade is where the game decides what things cost.');

  // ── D8 ── the climb stops paying for itself at the top, measured.
  const top = MARGIN.slice(0, 3);
  console.log(`\n  D8 The shop saturates before the summit. Mean listed OV by tier: ${MARGIN.map((m) => `t${m.tier} ${m.market.toFixed(1)}`).join('  ')}`);
  console.log(`     Tiers 1-3 are the same market (${top.map((m) => m.market.toFixed(2)).join(' / ')}): \`clamp(tierStrength(tier) + headroom, 4, 18)\` pins`);
  console.log(`     the quality at 18 from tier 3 upward, so the two hardest promotions in the game buy nothing new to sign.`);
  console.log(`     The margin over your own division falls as you climb — ${MARGIN.map((m) => `t${m.tier} +${(m.market - m.division).toFixed(1)}`).join(' ')} —`);
  console.log('     which is backwards from §24\'s intent: headroom was raised 2/0 -> 7/5 precisely because the top flight was');
  console.log(`     unwinnable, and ${(tierStrength(1) + 7 - 18).toFixed(1)} of tier 1's 7 points of headroom are discarded by the clamp.`);

  // ── D9 ── the great families are dearer and worse than the free agent listed beneath them.
  console.log('\n  D9 A rival house\'s son costs HOUSE_FEE_PREMIUM (x' + HOUSE_FEE_PREMIUM + ') and is measurably worse than the ordinary market:');
  for (const tier of [1, 3, 5, 7]) {
    const h = HOUSE_BY_TIER[tier];
    const m = MARGIN.find((x) => x.tier === tier)!;
    if (!h.length) continue;
    console.log(`     tier ${String(tier).padStart(2)}: house son mean OV ${mean(h.map((x) => x.ov)).toFixed(2)} (n=${h.length}) vs market mean OV ${m.market.toFixed(2)} — ${(m.market - mean(h.map((x) => x.ov))).toFixed(2)} worse, 35% dearer`);
  }
  console.log('     houseListings gates on |houseQuality - tierStrength(tier)| <= 3.5, i.e. against YOUR DIVISION, while the');
  console.log('     market beside it is drawn 5-7 quality points ABOVE that division. Both sides are qualities, so this is not');
  console.log('     the §24 scale bug — it is two different baselines. The effect is the same: the vanity signing the Houses');
  console.log('     screen is built to sell you is strictly dominated by the anonymous free agent one row down.');

  // ── D10 ── no domain guard on the tier, on a function that mints things you can buy.
  const nanList = transferList(1, 0, NaN);
  const nanAttrs = nanList.filter((x) => Object.values(x.player.attrs).some((v) => typeof v === 'number' && !Number.isFinite(v))).length;
  console.log(`\n  D10 transferList(seed, season, NaN) returns ${nanList.length} listings, ${nanAttrs} of them with NaN attributes, all reading OV`);
  console.log(`      ${[...new Set(nanList.map((x) => x.ov))].join(',')} and priced ${Math.min(...nanList.map((x) => x.fee))}-${Math.max(...nanList.map((x) => x.fee))} coins — because overall() defends itself against NaN and hands back 10,`);
  console.log('      so a player made of NaN reads as a perfectly ordinary mid-table signing. Buy one and mental.ts\'s M1 applies:');
  console.log('      a NaN in the attrs makes `rng() < NaN` false forever and the side quietly stops scoring. api.ts validates its');
  console.log('      own tier argument and warns; transferList takes whatever it is given. `size` is unguarded the same way:');
  console.log(`      transferList(1, 0, 5, 40) silently returns ${transferList(1, 0, 5, 40).length} rows, not 40, and a negative size returns ${transferList(1, 0, 5, -3).length}.`);

  // ── D11 ── two different men, one name, in a twelve-row shop.
  let dupWindows = 0, example = '';
  for (const w of WINDOWS) {
    const names = w.list.map((l) => l.player.name);
    if (new Set(names).size !== names.length) {
      dupWindows++;
      if (!example) {
        const dup = names.find((nm, i) => names.indexOf(nm) !== i)!;
        example = `"${dup}" — ` + w.list.filter((l) => l.player.name === dup).map((l) => `${l.player.role} OV ${l.ov} age ${l.age} ${l.fee}c`).join(' and ');
      }
    }
  }
  console.log(`\n  D11 ${Math.round((100 * dupWindows) / WINDOWS.length)}% of markets (${dupWindows} of ${WINDOWS.length} windows) list two DIFFERENT players under the SAME NAME, e.g. ${example}.`);
  console.log('      Ids are distinct so nothing breaks; the player is simply asked to choose between two men called the same');
  console.log('      thing in a twelve-row shop, and then to tell them apart on his own team sheet afterwards.');

  // ── NOT DEFECTS — checked, and they are the design working. Recorded so nobody re-opens them. ───────
  console.log('\n  NOT DEFECTS (checked, and they are the design working):');
  console.log('    · The market re-offers a player after you sign him — transferList is pure and seeded, and a market with');
  console.log('      memory would not be. The defect is where the memory lives (D6), not that the function lacks it.');
  console.log('    · The youth premium (x1.25 under 24) makes a good young player dearer than a better old one. That is age');
  console.log('      pricing, and §4(d) confirms it is still not recoverable at sale, so it costs the player nothing but coins.');
  console.log('    · Free youth intake cannot be farmed: advanceSquad tops the squad up only TO MIN_SQUAD, and sellPlayer');
  console.log('      refuses at MIN_SQUAD, so the free kids can never be sold. Checked, not assumed.');
  console.log('    · squadSaleValue(ov, NaN) is NaN, but save.ts\'s addCoins refuses a non-finite delta, so the wallet survives.');
  console.log('      The player would vanish for zero coins; no wallet poisoning.');
}

console.log(fails
  ? `\n✗ ${fails} market check(s) failed`
  : '\n✓ prices are monotone and positive, the round trip cannot make money, and the market is deterministic and sized as declared');
if (fails) process.exit(1);
