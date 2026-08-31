import type { Duty, Player, PlayerAttrs, Role, Team } from './types.js';
import { PITCH } from './types.js';
import { makeRng } from './rng.js';
import { FORMATIONS, type Formation } from './formations.js';
// The Living Squad reuses the bloodline star's OWN character generators, so a squad player's personality
// and traits mean exactly what the star's do (career.ts doesn't import teams.ts — no cycle).
import { rollPersonality, eligibleTraits, MAX_TRAITS, type CareerPlayerAttrs } from './career.js';
import { START_MORALE } from './morale.js';

const FIRST = ['Jan', 'Marco', 'Luis', 'Kofi', 'Sven', 'Timo', 'Ade', 'Ivan', 'Paulo', 'Ryo', 'Emil', 'Noah', 'Idris', 'Beto', 'Cato', 'Dario', 'Enzo', 'Felix'];
const LAST = ['Berg', 'Silva', 'Okafor', 'Larsen', 'Costa', 'Novak', 'Tanaka', 'Mensah', 'Weber', 'Rossi', 'Dubois', 'Kovac', 'Moreau', 'Santos', 'Vidal', 'Haas', 'Ito', 'Zeman'];

/** Roll 8 stats on a 1-20 scale, biased by role, around a team-quality centre. */
function rollAttrs(rng: () => number, role: Role, quality: number): PlayerAttrs {
  // quality is a 1-20 centre; jitter +-3, then per-stat role bias.
  const s = (bias: number) => Math.max(1, Math.min(20, Math.round(quality + bias + (rng() - 0.5) * 6)));
  switch (role) {
    case 'GK': return { pace: s(-4), strength: s(-1), passing: s(-3), shooting: s(-8), tackling: s(-6), positioning: s(2), workrate: s(-2), keeping: s(6), setPiece: s(-6), stamina: s(-3) };
    case 'DF': return { pace: s(0), strength: s(2), passing: s(-1), shooting: s(-5), tackling: s(4), positioning: s(3), workrate: s(1), keeping: s(-10), setPiece: s(-2), stamina: s(1) };
    case 'MF': return { pace: s(1), strength: s(0), passing: s(3), shooting: s(0), tackling: s(0), positioning: s(1), workrate: s(3), keeping: s(-10), setPiece: s(2), stamina: s(3) };
    case 'FW': return { pace: s(3), strength: s(1), passing: s(0), shooting: s(4), tackling: s(-4), positioning: s(2), workrate: s(0), keeping: s(-10), setPiece: s(2), stamina: s(1) };
  }
}

/**
 * Fill in setPiece/stamina for legacy 8-stat players (made before those stats existed),
 * WITHOUT touching the 8 core stats (so overall() is unchanged). Deterministic from the
 * player id + role + correlated stats, so it feels natural and replays identically.
 * A no-op for players that already have both stats. Returns the same object mutated.
 */
export function backfillAttrs(p: Player): Player {
  const a = p.attrs as PlayerAttrs & { setPiece?: number; stamina?: number };
  if (a.setPiece != null && a.stamina != null) return p;
  let h = 2166136261;
  for (let i = 0; i < p.id.length; i++) { h ^= p.id.charCodeAt(i); h = Math.imul(h, 16777619); }
  const jitter = (n: number) => (((h >>> (n * 5)) & 7) - 3); // deterministic -3..+3 per stat
  const clamp = (v: number) => Math.max(1, Math.min(20, Math.round(v)));
  const roleSet: Record<Role, number> = { GK: -6, DF: -2, MF: 2, FW: 2 };
  const roleSta: Record<Role, number> = { GK: -3, DF: 1, MF: 3, FW: 1 };
  if (a.setPiece == null) a.setPiece = clamp((a.passing + a.shooting) / 2 + roleSet[p.role] + jitter(0));
  if (a.stamina == null) a.stamina = clamp(a.workrate + roleSta[p.role] + jitter(1));
  return p;
}

/**
 * Generate a squad deterministically from a seed, laid out in a formation.
 * quality ~ team strength on the 1-20 stat scale (11-15 typical).
 */
export function generateTeam(
  id: string, name: string, shirtColor: number,
  quality: number, seed: number, formation: Formation = '4-4-2',
): Team {
  const rng = makeRng(seed);
  const slots = FORMATIONS[formation];
  const players: Player[] = slots.map((slot, i) => ({
    id: `${id}-${i}`,
    name: `${FIRST[Math.floor(rng() * FIRST.length)]} ${LAST[Math.floor(rng() * LAST.length)]}`,
    role: slot.role,
    attrs: rollAttrs(rng, slot.role, quality),
    anchor: { x: slot.x, y: slot.y },
  }));
  return { id, name, shirtColor, players };
}

/** Overall rating 1-20: weighted average of the stats that matter for the role. */
export function overall(p: Player): number {
  const a = p.attrs;
  // A MISSING ATTRIBUTE IS A 10, NOT A NaN. The mental layer (workrate, positioning and the rest) was added
  // to Player after some saves were already written, and any absent stat turned the whole average into NaN
  // — which then flowed into sellPlayer, into addCoins, and permanently poisoned the wallet, after which
  // every affordability check silently passed because `NaN < cost` is false. 10 is the scale's neutral
  // midpoint and the same default the match engine already assumes for these stats.
  const avg = (...xs: Array<number | undefined>) =>
    xs.reduce((s: number, x) => s + (Number.isFinite(x as number) ? (x as number) : 10), 0) / xs.length;
  switch (p.role) {
    case 'GK': return Math.round(avg(a.keeping, a.keeping, a.positioning, a.strength));
    case 'DF': return Math.round(avg(a.tackling, a.positioning, a.strength, a.pace, a.passing));
    case 'MF': return Math.round(avg(a.passing, a.workrate, a.tackling, a.positioning, a.pace));
    case 'FW': return Math.round(avg(a.shooting, a.pace, a.strength, a.positioning, a.passing));
  }
}

/** Mirror an anchor for the team defending the right goal (attacking right -> left). */
export function mirroredAnchor(a: { x: number; y: number }): { x: number; y: number } {
  return { x: PITCH.w - a.x, y: PITCH.h - a.y };
}

// ---- clubs, rosters & lineups ----

/** A club owns a full roster (~20 players); a Lineup selects 11 of them into a formation. */
export type Club = Team;

/** Roster shape: 2 GK, 7 DF, 7 MF, 4 FW = 20 players. */
const ROSTER_ROLES: Role[] = [
  'GK', 'GK',
  'DF', 'DF', 'DF', 'DF', 'DF', 'DF', 'DF',
  'MF', 'MF', 'MF', 'MF', 'MF', 'MF', 'MF',
  'FW', 'FW', 'FW', 'FW',
];

// ── THE LIVING SQUAD ─────────────────────────────────────────────────────────────────────────────
// A squad player is a full character, not filler: the SAME 15 stat categories the bloodline star carries
// (10 physical/technical + the 5-stat mental layer), plus a personality and earned traits. The manager's
// attachment to his squad is the point of the mode, so every player he can select, buy or lose is minted
// here. Deliberately a LIGHTWEIGHT mint (a seeded roll), not a full career sim — 20 starters + a market
// every season would be far too heavy for that, and only the bloodline star earns his stats by playing.
// Opponent clubs keep the cheap rollAttrs path (they're regenerated per fixture and never persist).

/** The mental layer, rolled around the same quality centre as the physical stats. Kept a touch tighter
 *  (±2.5 vs ±3) so temperament reads as a personality trait rather than another random stat. */
function rollMentals(rng: () => number, quality: number): Pick<PlayerAttrs, 'composure' | 'aggression' | 'creativity' | 'teamwork' | 'leadership'> {
  const m = () => Math.max(1, Math.min(20, Math.round(quality + (rng() - 0.5) * 5)));
  return { composure: m(), aggression: m(), creativity: m(), teamwork: m(), leadership: m() };
}

/** Mint a FULL squad player: 15 stats + durability, a personality, 0-2 earned traits, and an age.
 *  `age` defaults to a seeded 18-33 spread so a squad has youth to develop and veterans to replace. */
export function mintSquadPlayer(id: string, role: Role, quality: number, seed: number, age?: number): Player {
  const rng = makeRng(seed);
  const name = `${FIRST[Math.floor(rng() * FIRST.length)]} ${LAST[Math.floor(rng() * LAST.length)]}`;
  const base = rollAttrs(rng, role, quality);
  const mentals = rollMentals(rng, quality);
  // durability mirrors the career formula (strength+stamina driven) so injury-resistance reads consistently
  const durability = Math.max(1, Math.min(20, Math.round((base.strength + base.stamina) / 2)));
  const attrs: PlayerAttrs = { ...base, ...mentals, durability };
  const personality = rollPersonality(seed).id;
  // reuse the career trait gates: a squad player earns a trait only if his stats genuinely qualify, so a
  // trait always means something. `log` is empty — play-history traits (e.g. Big-Game Player) need a real
  // career and are reserved for the bloodline star.
  const earned = eligibleTraits(attrs as unknown as CareerPlayerAttrs, []).slice(0, MAX_TRAITS);
  // A trait has to BITE, not just decorate the card: apply the same stat bump the bloodline star gets when he
  // locks a trait in at graduation, so a squad "Clinical Finisher" really does finish better. The engine has no
  // trait hook of its own, so stats are how a trait reaches the pitch — and the bumps are the tuned +1s the
  // career game already uses, which keeps match calibration untouched.
  for (const t of earned) t.apply?.(attrs as unknown as CareerPlayerAttrs);
  const traits = earned.map((t) => t.id);
  const finalAge = age ?? 18 + Math.floor(rng() * 16); // 18..33
  return { id, name, role, attrs, anchor: { x: 0, y: 0 }, personality, traits, age: finalAge, morale: START_MORALE };
}

/** Generate a full club roster (~20 players) deterministically from a seed. */
/** `rich` STAYS FALSE BY DEFAULT — and that default is a known trap, deliberately left in place.
 *
 *  A rich squad carries the mental layer (composure, aggression, creativity, teamwork, leadership,
 *  durability); a plain one leaves all six undefined, and mental.ts centres a missing stat at 10. Every
 *  production call site passes `true`, so only harnesses ever see the thin version — where
 *  `attrs.composure + 4` yields NaN, propagates into goalProb, and silently stops that side scoring. A
 *  balance investigation lost a measurement to exactly that, which is why this comment exists.
 *
 *  Flipping the default to `true` was tried and REVERTED, because it is not the cosmetic change it looks
 *  like: `shared/fuzz_test.ts` builds its squads through this default, and with the mental layer present
 *  goals/match goes 2.8 -> 6.17, outside the sane range the fuzzer enforces. That is a real signal worth
 *  chasing — varying mentals around 10 destabilises the engine far more than centring them — but it is a
 *  balance investigation, not a default change, and production already runs on rich squads. Pass the flag
 *  explicitly in new harnesses rather than relying on either default. */
export function generateClub(id: string, name: string, shirtColor: number, quality: number, seed: number, rich = false): Club {
  const rng = makeRng(seed);
  // `rich` = a full character (15 stats + personality + traits + age) rather than the 10 physical/technical
  // stats alone. Originally only the MANAGER'S squad was rich, on the reasoning that opponents are
  // regenerated per fixture and never persist so the depth is invisible — but the mental layer is not
  // decoration, the match engine READS it, and an absent mental defaults to 10. That made the comparison
  // wildly asymmetric: measured, a manager's squad at quality 6 averaged 5.9 mentals against every
  // opponent's flat 10 (a 4.1 handicap in the basement), and at quality 18 averaged 17.9 against the same
  // flat 10 (a 7.9 advantage in the top flight). The pyramid was harder at the bottom and easier at the
  // top than anything intended it to be. Opponents are rich too now — one extra mint per fixture. (PT-305)
  const players: Player[] = ROSTER_ROLES.map((role, i) => rich
    ? mintSquadPlayer(`${id}-${i}`, role, quality, (seed ^ ((i + 1) * 0x9e3779b1)) >>> 0)
    : {
      id: `${id}-${i}`,
      name: `${FIRST[Math.floor(rng() * FIRST.length)]} ${LAST[Math.floor(rng() * LAST.length)]}`,
      role,
      attrs: rollAttrs(rng, role, quality),
      anchor: { x: 0, y: 0 }, // assigned when placed into a lineup
    });
  return { id, name, shirtColor, players };
}

/**
 * Generate one trial/loan player deterministically from a seed. `quality` is the
 * 1-20 stat centre for the loanee's rarity band; every stat is hard-capped at
 * `maxStat` (default 15) so a loanee never rivals a top NFT star.
 */
export function generateTrialist(id: string, quality: number, seed: number, maxStat = 15): Player {
  const rng = makeRng(seed);
  const roles: Role[] = ['DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'GK'];
  const role = roles[Math.floor(rng() * roles.length)];
  // a trialist joins the manager's own squad, so he's a full character too (Living Squad) — just capped
  // DECORRELATE the seed. mintSquadPlayer re-seeds makeRng(seed) and spends its first draw on the first
  // name, while the role above came from the first draw of makeRng(seed) too — so role and name were
  // locked to the same value and every GK trialist drew one of two names. (PT-604)
  const p = mintSquadPlayer(id, role, quality, (seed ^ 0x5bf03635) >>> 0);
  const attrs = p.attrs;
  (Object.keys(attrs) as Array<keyof PlayerAttrs>).forEach((k) => { const v = attrs[k]; if (v !== undefined) attrs[k] = Math.min(maxStat, v); });
  return { ...p, attrs };
}

/** A lineup: 11 roster player-ids ordered to match FORMATIONS[formation] slots (slot 0 = GK). */
export interface Lineup {
  formation: Formation;
  playerIds: string[]; // length 11
  /** optional per-slot manager duties (parallel to playerIds); absent slots auto-derive from stats */
  duties?: Duty[];
  /** manager squad roles (slot indices into playerIds): the captain, and the set-piece takers. */
  captainIdx?: number;
  takers?: { pen?: number; fk?: number; corner?: number };
}

/** Auto-select the best available XI for a formation, best player per slot by overall rating. */
export function autoPickXI(club: Club, formation: Formation): Lineup {
  const slots = FORMATIONS[formation];
  const pool = [...club.players].sort((a, b) => overall(b) - overall(a));
  const used = new Set<string>();
  const playerIds = slots.map((slot) => {
    const pick = pool.find((p) => !used.has(p.id) && p.role === slot.role) ?? pool.find((p) => !used.has(p.id))!;
    used.add(pick.id);
    return pick.id;
  });
  return { formation, playerIds };
}

/** Build a match-ready Team (11 players placed at formation anchors) from a club + lineup. */
export function buildXI(club: Club, lineup: Lineup): Team {
  const slots = FORMATIONS[lineup.formation];
  const players: Player[] = lineup.playerIds.map((pid, i) => {
    const p = club.players.find((x) => x.id === pid)!;
    // a manager-assigned duty for this slot overrides the player's stat-derived default
    return {
      ...p, anchor: { x: slots[i].x, y: slots[i].y }, duty: lineup.duties?.[i] ?? p.duty,
      // squad roles (manager designations): captain armband + set-piece takers
      captain: lineup.captainIdx === i || undefined,
      takesPen: lineup.takers?.pen === i || undefined,
      takesFk: lineup.takers?.fk === i || undefined,
      takesCorner: lineup.takers?.corner === i || undefined,
    };
  });
  // bench: the best squad players outside the XI (up to 7), for the engine's late-game subs
  const used = new Set(lineup.playerIds);
  const bench = club.players.filter((p) => !used.has(p.id)).sort((a, b) => overall(b) - overall(a)).slice(0, 7);
  return { id: club.id, name: club.name, shirtColor: club.shirtColor, players, bench };
}
