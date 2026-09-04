// ── THE MANAGER'S NARRATION LAYER ──────────────────────────────────────────────────────────────────
//
// Audit finding (docs/manager-content-investigation.md): the manager half of the game had ~926 authored
// lines against the player career's ~24,100, for roughly the same playtime — and, more importantly, it had
// NOWHERE TO PUT any. Its biggest moments were one-line toasts with a number in them:
//
//     ⬆️ PROMOTED to League Two!        ← the achievement of an entire season
//     💸 Sold · +420c                   ← a player who may have been here a decade
//     🤕 Kofi Moreau injured — out 3 matches
//
// A promotion got less text than a throw-in. This module is the missing surface: it turns manager events
// into prose, the way narrate.ts does for the card career.
//
// WHERE THE DEPTH COMES FROM — this is the whole design idea, so it is worth stating plainly.
// It is not bank size. It is that the narration KNOWS WHO IT IS TALKING ABOUT. Selling a squad filler you
// bought last summer and selling the centre-half who has been here eleven seasons and four promotions are
// not the same event, and must never draw from the same bank. Every event therefore resolves to a CONTEXT
// TIER first (see `tierFor`), and only then picks a line. That is what makes it read as though the game was
// paying attention.
//
// Pure + seeded: no rng draw, no wall clock, so a season replays identically.
import { mergeBanks, fillTokens, type Bank } from './prompts/merge.js';
import { MGR_EXTRA_1 } from './manager/pack_1.js';
import { MGR_EXTRA_2 } from './manager/pack_2.js';
import { MGR_EXTRA_3 } from './manager/pack_3.js';
import { MGR_EXTRA_4 } from './manager/pack_4.js';
import { MGR_EXTRA_5 } from './manager/pack_5.js';
import { MGR_EXTRA_6 } from './manager/pack_6.js';
import { BASE_MGR } from './manager/base.js';

/** Who the event is about. Everything here is already on the Player type or trivially derived. */
export interface PersonCtx {
  name: string;
  role?: string;
  age?: number;
  morale?: number;            // 0-100
  overall?: number;
  seasonsAtClub?: number;     // season - signedSeason
  isStar?: boolean;           // the bloodline player
  wasRegular?: boolean;       // in the XI this season
  personality?: string;
}

/** Where the club is. Lets a relegation in your first season read differently from your ninth. */
export interface ClubCtx {
  club: string;
  season: number;
  tier: number;               // 1 = top flight
  tierName: string;
  fromTierName?: string;
  toTierName?: string;
}

export type MgrEvent =
  | 'injury' | 'injury_long' | 'injury_return'
  | 'transfer_in' | 'transfer_out' | 'released' | 'bid_received' | 'bid_rejected'
  | 'contract_renewed' | 'contract_expired'
  | 'promotion' | 'relegation' | 'title' | 'near_miss'
  | 'retirement' | 'youth_intake'
  | 'scout_dispatched' | 'scout_found' | 'scout_empty'
  | 'facility_upgraded' | 'staff_hired';

/** CONTEXT TIER — the heart of it. An event plus who it happened to becomes a specific bank key, so a
 *  ten-year servant and a summer signing never share a line. Falls back to the plain event, so an
 *  un-tiered event still narrates rather than going silent.
 *
 *  `vars` is read for exactly one thing: HOW MANY CAME UP FROM THE ACADEMY. Every one of the 140
 *  `youth_intake` lines is written for a group — 45 of them count it out loud, and the other 95 say
 *  'they', 'the new lot', 'a batch of boys'. But `advanceSquad` only tops the roster back up to
 *  MIN_SQUAD, so the intake is simply whatever the squad lost that summer, and losing one man is the
 *  commonest summer there is: measured over 40 saves x 25 seasons, 138 of the 735 intakes that fired
 *  were a single boy (19%). Those printed '1 boys sign scholarship forms' and '1 lads, one dressing
 *  room, and about four years to find out'. So a one-boy intake gets its own bank and — uniquely — does
 *  NOT fall through to the general one, because falling through is exactly what produced the broken
 *  line. Scoped to youth_intake deliberately: {n} is a run of seasons for contract_renewed and an age
 *  for retirement, and neither wants this. */
export function tierFor(event: MgrEvent, p?: PersonCtx, vars?: FillVars): string[] {
  if (event === 'youth_intake' && Number(vars?.n) === 1) return ['youth_intake.one'];
  const keys: string[] = [];
  const yrs = p?.seasonsAtClub ?? 0;
  const age = p?.age ?? 0;
  if (p) {
    if (p.isStar) keys.push(`${event}.star`);
    if (yrs >= 8) keys.push(`${event}.servant`);          // a decade man
    else if (yrs >= 4) keys.push(`${event}.established`);
    else if (yrs <= 1) keys.push(`${event}.newcomer`);
    if (age >= 33) keys.push(`${event}.veteran`);
    else if (age > 0 && age <= 20) keys.push(`${event}.young`);
    if ((p.morale ?? 65) < 40) keys.push(`${event}.unhappy`);
    if (p.wasRegular === false) keys.push(`${event}.fringe`);
  }
  keys.push(event);                                        // the general bank, always available
  return keys;
}

const BANK: Bank = mergeBanks(BASE_MGR, MGR_EXTRA_1, MGR_EXTRA_2, MGR_EXTRA_3, MGR_EXTRA_4, MGR_EXTRA_5, MGR_EXTRA_6);

/** Every line eligible for this event in this context — the specific tiers first, then the general bank,
 *  so a servant leaving draws from servant lines when they exist and never reads as generic. */
export function eligible(event: MgrEvent, p?: PersonCtx, vars?: FillVars): string[] {
  const out: string[] = [];
  for (const k of tierFor(event, p, vars)) for (const l of BANK[k] ?? []) out.push(l);
  // Belt and braces for the one tier that deliberately does not fall back (see tierFor). If a later edit
  // ever empties `youth_intake.one`, a single-boy intake would go SILENT — an intake sitting in the
  // season report with no line against it — and silence is a worse failure than a clumsy sentence. Fall
  // back to the general bank minus the lines that count the group out loud, since those are the ones
  // that read '1 boys'.
  if (!out.length && event === 'youth_intake') for (const l of BANK[event] ?? []) if (!l.includes('{n}')) out.push(l);
  return out;
}

function h32(...n: number[]): number {
  let h = 2166136261 >>> 0;
  for (const v of n) { h ^= v >>> 0; h = Math.imul(h, 16777619); }
  h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
  return (h ^ (h >>> 13)) >>> 0;
}
const strh = (s: string): number => { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0; return h >>> 0; };

// `name` is what the event is ABOUT rather than a token any authored line substitutes today — the facility
// being upgraded, the club that bid, the specialist hired. narrateManager hashes it to tell one firing of an
// event from the next, so it is declared here instead of being smuggled past the type at the call sites.
export interface FillVars { p?: string; club?: string; from?: string; to?: string; name?: string; n?: string | number; fee?: string | number; }

/** Substitute the supported placeholders. Anything unknown is LEFT ALONE rather than blanked, so an
 *  author's typo is visible in review instead of silently deleting half a sentence. */
export function fillMgr(line: string, v: FillVars): string {
  // Same article repair as the commentary filler (see fillTokens). '{p} is a {club} player. Ink dries
  // faster than a reputation.' is an authored transfer_in line, and {club} is the manager's OWN club,
  // which he names himself — call it Ashcombe Town, or let it default to a handle starting with a vowel,
  // and every signing that drew that line read "is a Ashcombe Town player" in the season log, for the
  // whole save. Fixing it here rather than in the line, because the club name does not exist until this
  // call and the next author to write 'a {club}' would reintroduce it.
  return fillTokens(line, (k) => {
    const val = (v as Record<string, unknown>)[k];
    return val == null ? undefined : String(val);
  });
}

/** Narrate one manager event. Deterministic from (seed, event, who) so a replayed season reads the same. */
export function narrateManager(event: MgrEvent, ctx: { seed: number; person?: PersonCtx; club?: ClubCtx; vars?: FillVars }): string | null {
  const pool = eligible(event, ctx.person, ctx.vars);
  if (!pool.length) return null;
  // WHICH FIRING THIS IS has to reach the hash, or one season of one event is one sentence repeated.
  // The index keyed on (seed, event, person, season) alone — and the club-side events pass no person at all
  // (facility_upgraded, staff_hired, scout_empty) or the same bloodline star every time (scout_dispatched),
  // so every upgrade, hire and scouting trip in a season landed on the SAME index. Measured: 1 distinct
  // line out of the 120-line facility bank across the 13 upgradeable facilities, and the same collapse for
  // a player hurt twice in a season. The vars already carry the discriminator — the facility's name and new
  // level, the destination scouted, the fee — so they go in. Keys are sorted so the order a call site
  // happened to build the object in cannot change the line, and values are stringified so a var added later
  // discriminates without anyone having to remember this line. Still pure: vars are engine values, so a
  // replayed season reads the same.
  const v = (ctx.vars ?? {}) as Record<string, unknown>;
  const about = Object.keys(v).sort().map((k) => `${k}=${String(v[k])}`).join('|');
  const idx = h32(ctx.seed >>> 0, strh(event), strh(ctx.person?.name ?? ''), ctx.club?.season ?? 0, strh(about)) % pool.length;
  return fillMgr(pool[idx], {
    p: ctx.person?.name,
    club: ctx.club?.club,
    from: ctx.club?.fromTierName,
    to: ctx.club?.toTierName,
    ...ctx.vars,
  });
}
