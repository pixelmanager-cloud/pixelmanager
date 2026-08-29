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
import { mergeBanks, type Bank } from './prompts/merge.js';
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
 *  un-tiered event still narrates rather than going silent. */
export function tierFor(event: MgrEvent, p?: PersonCtx): string[] {
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
export function eligible(event: MgrEvent, p?: PersonCtx): string[] {
  const out: string[] = [];
  for (const k of tierFor(event, p)) for (const l of BANK[k] ?? []) out.push(l);
  return out;
}

function h32(...n: number[]): number {
  let h = 2166136261 >>> 0;
  for (const v of n) { h ^= v >>> 0; h = Math.imul(h, 16777619); }
  h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
  return (h ^ (h >>> 13)) >>> 0;
}
const strh = (s: string): number => { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0; return h >>> 0; };

export interface FillVars { p?: string; club?: string; from?: string; to?: string; n?: string | number; fee?: string | number; }

/** Substitute the supported placeholders. Anything unknown is LEFT ALONE rather than blanked, so an
 *  author's typo is visible in review instead of silently deleting half a sentence. */
export function fillMgr(line: string, v: FillVars): string {
  return line.replace(/\{(\w+)\}/g, (m, k) => {
    const val = (v as Record<string, unknown>)[k];
    return val == null ? m : String(val);
  });
}

/** Narrate one manager event. Deterministic from (seed, event, who) so a replayed season reads the same. */
export function narrateManager(event: MgrEvent, ctx: { seed: number; person?: PersonCtx; club?: ClubCtx; vars?: FillVars }): string | null {
  const pool = eligible(event, ctx.person);
  if (!pool.length) return null;
  const idx = h32(ctx.seed >>> 0, strh(event), strh(ctx.person?.name ?? ''), ctx.club?.season ?? 0) % pool.length;
  return fillMgr(pool[idx], {
    p: ctx.person?.name,
    club: ctx.club?.club,
    from: ctx.club?.fromTierName,
    to: ctx.club?.toTierName,
    ...ctx.vars,
  });
}
