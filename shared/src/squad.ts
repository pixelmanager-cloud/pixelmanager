// ── THE LIVING SQUAD — per-season lifecycle for the manager's own players ─────────────────────────
// The bloodline star is only ONE member of the squad. For the manager to get attached to the others,
// they have to LIVE: a 19-year-old you sign improves under you, a 31-year-old fades, contracts run
// down and force a keep-or-lose call, and wages make holding a big squad cost something. This module
// is the pure, deterministic core of that (no rng, no wall-clock) so it's replay-safe and testable.
//
// The bloodline STAR keeps his own token path (age in MgrState, developPlayer, tokenContract) — this
// covers everyone else in club.players: the starting squad, signings and trialists.
import type { Player } from './types.js';
import { developAttrs } from './lifecycle.js';
import { ageSquadAttrs, squadSeasonWage, SQUAD_CONTRACT_SEASONS, SQUAD_PEAK_AGE } from './transfermarket.js';
import { overall, mintSquadPlayer } from './teams.js';
import { MIN_SQUAD } from './market.js';
import { updateMorale, driftMorale, START_MORALE, type MoraleEvent } from './morale.js';

/** Below this age a squad player still GROWS; at/after SQUAD_PEAK_AGE he plateaus then declines. */
export const SQUAD_GROWTH_AGE = SQUAD_PEAK_AGE - 1; // grows to 29, plateaus at 30, declines from 31

/** When a squad player hangs up his boots — robust players last longer (34..37, deterministic). */
export function squadRetireAge(p: Player): number {
  const a: any = p.attrs ?? {};
  const robust = (a.durability ?? a.stamina ?? 10) as number;
  return 34 + Math.max(0, Math.min(3, Math.round(robust / 7)));
}

/** Seasons remaining on a squad player's contract (0 = expired/expiring now). */
export function squadSeasonsLeft(p: Player, season: number): number {
  if (p.signedSeason == null || p.contractSeasons == null) return 0;
  return Math.max(0, p.signedSeason + p.contractSeasons - season);
}
/** Give a player a fresh contract as of `season` (signing or renewal). */
export function signSquadContract(p: Player, season: number, seasons = SQUAD_CONTRACT_SEASONS): Player {
  return { ...p, signedSeason: season, contractSeasons: seasons };
}
/** A STAGGERED deal length (2-5 seasons), derived from the player id. Used when a whole squad is put under
 *  contract at once — the founding roster, or an older save being grandfathered in. Giving everyone the same
 *  length makes the entire squad's deal expire in the same summer, and the club loses all 14 players at once;
 *  staggering turns that cliff into a normal churn of two or three a year. */
export function staggeredContractSeasons(id: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  return 2 + ((h >>> 0) % 4); // 2..5
}

export interface SquadSeasonChange {
  player: Player;
  ovrBefore: number;
  ovrAfter: number;
  retired: boolean;
  expiring: boolean;   // contract runs out at the end of this rollover → keep-or-lose decision
  moraleBefore: number;
  moraleAfter: number;
}
/** How a season treated one squad player, morale-wise. A player who spent the year in the XI of a winning
 *  side is settled; one who never got a game and is out of contract is agitating. This is what turns a
 *  squad list into a dressing room the manager has to actually manage. */
export function squadMoraleAfterSeason(p: Player, opts: { inXI: boolean; wonSomething: boolean; goodSeason: boolean; expiring: boolean }): number {
  let m = p.morale ?? START_MORALE;
  const ev: MoraleEvent[] = [];
  ev.push(opts.inXI ? (opts.goodSeason ? 'played_win' : 'played_draw') : 'unused');
  if (opts.wonSomething) ev.push('won_trophy');
  if (opts.expiring) ev.push('contract_lapsed');
  for (const e of ev) m = updateMorale(m, e);
  return driftMorale(m); // grudges fade a little over the summer
}
export interface SquadRollover {
  players: Player[];            // everyone still at the club (retirees removed)
  changes: SquadSeasonChange[]; // per-player deltas, for the season report
  wageBill: number;             // total wages to charge for the season just played
  retired: Player[];
  expiring: Player[];
  departed: Player[];   // deals that ran out and were never renewed — they walk
  intake: Player[];     // academy kids promoted to keep the squad viable
}


/** Per-ROLE development ceilings for squad players. A keeper is not going to develop a striker's finishing
 *  and a centre-half is not going to grow into a goalkeeper; the stats a role never uses should stay where
 *  they were minted so players keep distinct shapes as they mature. Shaped like the career `genes` object
 *  so it drops straight into developAttrs. Anything unlisted keeps the generic 18. (PT-603) */
const ROLE_CEIL: Record<string, Record<string, number>> = {
  GK: { keeping: 19, shooting: 7, passing: 12, tackling: 9, pace: 12, creativity: 10, setPiece: 11 },
  DF: { keeping: 5, shooting: 10, tackling: 19, positioning: 18, strength: 18, creativity: 13 },
  MF: { keeping: 5, shooting: 15, passing: 19, creativity: 18, workrate: 18, tackling: 15 },
  FW: { keeping: 5, shooting: 19, pace: 18, tackling: 10, positioning: 17, creativity: 17 },
};
function roleCeilings(role: string | undefined): Record<string, { ceiling: number }> | undefined {
  const m = ROLE_CEIL[String(role ?? '')];
  if (!m) return undefined;
  const out: Record<string, { ceiling: number }> = {};
  for (const k of Object.keys(m)) out[k] = { ceiling: m[k] };
  return out;
}

/** Advance ONE squad player a season: age +1, then grow (young) / plateau / decline (old).
 *  `trainingLvl` is the club's Training Ground level — better facilities grow youth faster and slow
 *  the fade, so investing in the club visibly pays off in the squad. */
export function advanceSquadPlayer(p: Player, trainingLvl = 1): Player {
  const age = (p.age ?? 24) + 1;
  let attrs = p.attrs as any;
  if (age <= SQUAD_GROWTH_AGE) {
    // reuse the star's own growth curve, but against a ROLE-SHAPED ceiling. With generic ceilings every
    // developable stat climbed toward 18 regardless of position, so a centre-half's goalkeeping rose
    // season after season and the whole squad compressed toward one identical statline — the opposite of
    // a dressing room of distinct people. (PT-603)
    attrs = developAttrs(attrs, roleCeilings(p.role), Math.min(age, 31), trainingLvl);
  } else if (age > SQUAD_PEAK_AGE) {
    attrs = ageSquadAttrs(attrs, age);
  } // == SQUAD_PEAK_AGE: prime plateau
  return { ...p, age, attrs };
}

/** Roll the WHOLE squad forward one season. Pure: returns the new squad + everything the season
 *  report needs (who grew, who faded, who retired, whose deal is up, and the wage bill). */
export function advanceSquad(players: Player[], season: number, trainingLvl = 1, ctx: { xi?: ReadonlySet<string>; wonSomething?: boolean; goodSeason?: boolean; quality?: number } = {}): SquadRollover {
  const out: Player[] = [];
  const changes: SquadSeasonChange[] = [];
  const retired: Player[] = [];
  const expiring: Player[] = [];
  const departed: Player[] = [];
  let wageBill = 0;
  for (const p of players) {
    const ovrBefore = overall(p);
    wageBill += squadSeasonWage(ovrBefore, season); // he was on the books all season, priced in this season's money
    let adv = advanceSquadPlayer(p, trainingLvl);
    const isRetired = (adv.age ?? 0) >= squadRetireAge(adv);
    // `season` is ALREADY the upcoming season here — spSeasonReward bumps profile.season before the rollover
    // runs — so adding another +1 made every deal expire a season early (a 3-season contract lasted 2) (PT-601).
    const isExpiring = !isRetired && p.signedSeason != null && squadSeasonsLeft(adv, season) <= 0;
    const moraleBefore = p.morale ?? START_MORALE;
    const moraleAfter = squadMoraleAfterSeason(p, {
      inXI: ctx.xi ? ctx.xi.has(p.id) : true,
      wonSomething: !!ctx.wonSomething, goodSeason: !!ctx.goodSeason, expiring: isExpiring,
    });
    adv = { ...adv, morale: moraleAfter };
    changes.push({ player: adv, ovrBefore, ovrAfter: overall(adv), retired: isRetired, expiring: isExpiring, moraleBefore, moraleAfter });
    if (isRetired) { retired.push(adv); continue; }
    // A DEAL THAT RAN OUT AND WASN'T RENEWED MEANS HE LEAVES. Without this the "expiring" list re-fired every
    // season forever, renewing was a pure coin sink with no downside for ignoring it, and the contract layer —
    // the whole point of the phase — enforced nothing (PT-302).
    if (p.signedSeason != null && p.contractSeasons != null && p.signedSeason + p.contractSeasons < season) { departed.push(adv); continue; }
    out.push(adv);
    if (isExpiring) expiring.push(adv);
  }
  // YOUTH INTAKE: a club whose squad ages out doesn't evaporate — the academy pushes kids up. Without a floor
  // the squad ratcheted below 11 and autoPickXI/buildXI threw on a short roster, BRICKING the save (PT-300).
  // The intake is deliberately raw (age 17-19, below the club's level), so neglecting the squad still hurts —
  // it just costs you quality instead of the game.
  const intake: Player[] = [];
  const q = Math.max(4, Math.round(ctx.quality ?? 8));
  // A DUPLICATE ID IN THE SQUAD BRICKS THE TEAM SHEET PERMANENTLY. `youth-${season}-${i}` was never checked
  // against the roster, and two intakes under one season counter is reachable: `spSeasonReward` — the only
  // call that bumps `profile.season`, and only for `kind: 'league'` — sits inside a `try { } catch { }` in
  // the rollover, while `advanceSquadSeason` runs regardless. A repeat then mints `youth-0-0` a second
  // time, the duplicate reaches the saved XI, and `validateLineup` rejects it — so `setStandingOrders`
  // fails from that moment on, every kickoff toasts "Couldn't save your team sheet", and there is no way
  // back from inside the game.
  const taken = new Set(out.map((p) => p.id));
  const uniqueId = (base: string): string => {
    if (!taken.has(base)) { taken.add(base); return base; }
    for (let n = 2; ; n++) { const id = `${base}-${n}`; if (!taken.has(id)) { taken.add(id); return id; } }
  };
  for (let i = 0; out.length + intake.length < MIN_SQUAD; i++) {
    const roles = ['GK', 'DF', 'DF', 'MF', 'MF', 'FW'] as const;
    const seed = (((season * 7919) ^ ((out.length + i) * 104729)) >>> 0);
    const kid = mintSquadPlayer(uniqueId(`youth-${season}-${i}`), roles[i % roles.length], Math.max(4, q - 3), seed, 17 + (i % 3));
    intake.push(signSquadContract(kid, season, staggeredContractSeasons(kid.id)));
    if (i > 40) break; // guard: never spin
  }
  return { players: [...out, ...intake], changes, wageBill, retired, expiring, departed, intake };
}

// ── SQUAD STORYLINES (Phase 4) ────────────────────────────────────────────────────────────────────
// A number moving on a table isn't a story. These are the short beats that turn a season's stat changes
// into things that happened to PEOPLE — the kid who suddenly arrived, the veteran whose legs went, the
// one-club man quietly re-signing, the star a rival is sniffing around. Every beat is EARNED: it fires
// only when the player's real state (age, form swing, morale, contract) justifies it, so it reads as
// reporting rather than flavour text. Deterministic — a pure hash of (id, season), no rng.
function pick(list: readonly string[], id: string, season: number): string {
  let h = 2166136261 >>> 0;
  const s = `${id}:${season}`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return list[(h >>> 0) % list.length];
}
const BREAKOUT = [
  'has come back a different player — training staff noticed inside a week.',
  'has kicked on hard over the summer; suddenly he looks like he belongs.',
  'spent the year improving faster than anyone at the club.',
  'has gone from squad filler to first name on the sheet in ten months.',
  'grew into himself this season, and it shows in everything he does.',
  'is barely the same player who turned up last August.',
];
const ONE_TO_WATCH = [
  'is starting to look like a real prospect.',
  'is getting better every month — worth building around.',
  'has quietly become one of the best young players here.',
  'is one to keep hold of; the improvement curve is steep.',
  'looks like he has another level in him yet.',
  'is young, and already better than his age suggests.',
];
const SLUMP = [
  'has had a season to forget; the sharpness isn\'t there.',
  'is going the wrong way, and he knows it.',
  'looked half a yard off it all year.',
  'never got going this season — worth finding out why.',
  'has lost something, and it hasn\'t come back yet.',
  'spent the year chasing the form he had last spring.',
];
const TWILIGHT = [
  'is nearing the end — the legs are going, though the head is still good.',
  'can\'t do it twice a week any more, and he\'d tell you so himself.',
  'is in the last of it now. Worth deciding what he\'s for.',
  'has one, maybe two years left in those legs.',
  'is running on know-how rather than pace these days.',
  'is winding down. He\'s earned a say in how it ends.',
];
const LOYAL = [
  'has been here longer than anyone and has never once made a fuss.',
  'is the sort the dressing room is built on. He\'ll sign whatever\'s put in front of him.',
  'wants to stay. That counts for something.',
  'has never given the club a moment\'s trouble in all his years here.',
  'would run through a wall for this club, and probably has.',
  'is happy here, and says so to anyone who asks.',
];
const WANTS_AWAY = [
  'is unsettled, and other clubs will have noticed.',
  'has stopped looking happy about being here.',
  'wants away — or at least wants to be asked to stay.',
  'is going through the motions. Something needs saying.',
  'has one eye elsewhere, and it\'s showing on the pitch.',
  'isn\'t enjoying it any more, and hasn\'t hidden it well.',
];
const COVETED = [
  'is being watched. Somebody will come in for him if his deal runs down.',
  'has scouts at games now. That\'s the price of him being good.',
  'is the one a rival would take tomorrow.',
  'is attracting interest the club can\'t pretend isn\'t there.',
  'will have offers if this contract gets close to running out.',
  'is exactly the player other clubs go looking for.',
];

/** A short "what happened to him this season" line for a squad player, or null if his season was ordinary.
 *  Fires at most one beat per player, ranked so the most notable thing wins. */
export function squadStoryline(ch: SquadSeasonChange, season: number, expiringSoon: boolean): string | null {
  const p = ch.player;
  const age = p.age ?? 24;
  const delta = ch.ovrAfter - ch.ovrBefore;
  const morale = ch.moraleAfter;
  if (ch.retired) return null;                                    // his send-off is already in the report
  if (delta >= 2 && age <= 23) return pick(BREAKOUT, p.id, season);
  if (delta <= -2 && age >= 31) return pick(TWILIGHT, p.id, season);
  if (delta <= -2) return pick(SLUMP, p.id, season);
  if (morale <= 30) return pick(WANTS_AWAY, p.id, season);
  if (expiringSoon && ch.ovrAfter >= 14) return pick(COVETED, p.id, season);
  if (delta >= 1 && age <= 21) return pick(ONE_TO_WATCH, p.id, season);
  if (morale >= 85 && age >= 28) return pick(LOYAL, p.id, season);
  return null;
}

/** The season's squad storylines, most notable first and capped so they stay special. */
export function squadStorylines(roll: SquadRollover, season: number, max = 3): string[] {
  const expiring = new Set(roll.expiring.map((p) => p.id));
  const rank = (ch: SquadSeasonChange) => Math.abs(ch.ovrAfter - ch.ovrBefore) * 10 + (100 - ch.moraleAfter) / 10;
  const chosen = roll.changes
    .filter((ch) => !ch.retired)
    .map((ch) => ({ ch, line: squadStoryline(ch, season, expiring.has(ch.player.id)) }))
    .filter((x) => !!x.line)
    .sort((a, b) => rank(b.ch) - rank(a.ch));
  // Two players can legitimately have the same KIND of season, but printing the same sentence twice in one
  // report reads like a bug. Keep the first, and drop a later duplicate of the identical line.
  const out: string[] = []; const seen = new Set<string>();
  for (const x of chosen) {
    if (seen.has(x.line!)) continue;          // squadStoryline returns the sentence alone, so this compares cleanly
    seen.add(x.line!); out.push(`${x.ch.player.name} ${x.line!}`);
    if (out.length >= max) break;
  }
  return out;
}
