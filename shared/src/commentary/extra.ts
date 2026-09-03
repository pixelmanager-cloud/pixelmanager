// ── MATCH COMMENTARY: authored extra lines ─────────────────────────────────────────────────────────
//
// Measured, this is the WEAKEST content surface in the game by a distance: 159 lines total, against ~700
// lines shown in a single match. Every line therefore appears about four times a game, and it is the same
// 159 sentences across all ~180 matches of a manager career. Nothing else comes close — the scenario
// prompts, which had a whole authoring fleet pointed at them, were nowhere near this bad.
//
// The live banks are template literals inline in client/src/main.ts, which authors cannot safely edit in
// parallel. So instead they write DATA here, with `{p}` `{team}` `{zone}` `{off}` `{name}` placeholders that
// the picker substitutes at draw time. Keys are the match event types.
export type CommentaryBank = Record<string, string[]>;

/** Placeholders an author may use. Anything else is left alone rather than rendered as a broken token. */
export const CM_VARS = ['p', 'team', 'opp', 'zone', 'off', 'name'] as const;

export function fillCm(line: string, vars: Record<string, string | undefined>): string {
  // ARTICLE REPAIR RIDES ALONG WITH THE SUBSTITUTION (see fillTokens). This used to be a bare
  // `line.replace(/\{(\w+)\}/g, ...)`, which meant the authored line 'Someone in a {team} shirt
  // eventually settles it {zone}.' printed "Someone in a Ashcombe Town shirt" whenever the drawn club
  // began with a vowel — 23 of the 108 clubs in LEAGUE_POOL, 21.3% of draws. It is the worst possible
  // line to get wrong: loose_ball is the biggest authored bank there is (499 lines) against ~114
  // loose_ball events a match, so the player reads it every few games for the whole save.
  return fillTokens(line, (k) => (vars[k] != null ? String(vars[k]) : undefined));
}

import { fillTokens } from '../prompts/merge.js';
import { CM_EXTRA_1 } from './pack_1.js';
import { CM_EXTRA_2 } from './pack_2.js';
import { CM_EXTRA_3 } from './pack_3.js';
import { CM_EXTRA_4 } from './pack_4.js';
import { CM_EXTRA_5 } from './pack_5.js';
import { CM_EXTRA_6 } from './pack_6.js';
import { CM_EXTRA_7 } from './pack_7.js';

export const RAW_PACKS: CommentaryBank[] = [CM_EXTRA_1, CM_EXTRA_2, CM_EXTRA_3, CM_EXTRA_4, CM_EXTRA_5, CM_EXTRA_6, CM_EXTRA_7];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 {}]/g, '').replace(/\s+/g, ' ').trim();
const cache = new Map<string, string[]>();

// ── BRANCHES ───────────────────────────────────────────────────────────────────────────────────────
// A few event types render as two visually distinct beats. `tackle_won` is the clear case: a ⚡ PRESSING
// turnover high up the pitch and a 🦵 ordinary challenge are different moments, and the live banks mark
// which is which with the leading icon. Authors write both under the one event key and follow the same
// icon convention — so drawing from the flat bank put "Hounded into the mistake!" on a sliding tackle in
// the back four about half the time. Filtering by that leading icon is what keeps the two apart.
//
// The icon set is DERIVED from the bank rather than declared, so an author who opens a new branch gets
// the separation for free instead of silently polluting an existing one.
const LEAD_ICON = /^([^\p{ASCII}\s]+)\s/u;
function leadIcon(line: string): string | null { const m = LEAD_ICON.exec(line); return m ? m[1] : null; }

/** How to narrow an event's bank to one of its rendered branches.
 *  `icon` — take the lines that open with this icon.
 *  `neutral` — ALSO take the un-iconed lines. Set this on the branch that reads as the default beat
 *  (an ordinary tackle), so a line written without a marker still gets used rather than stranded. */
export interface CommentaryBranch { icon: string; neutral?: boolean }

/** Every authored line for an event type, de-duplicated across packs; optionally narrowed to one branch. */
export function commentaryExtra(key: string, branch?: CommentaryBranch): string[] {
  const ck = branch ? `${key}\u0000${branch.icon}${branch.neutral ? '+' : ''}` : key;
  const hit = cache.get(ck);
  if (hit) return hit;
  const seen = new Set<string>();
  const all: string[] = [];
  for (const p of RAW_PACKS) for (const l of p[key] ?? []) {
    const n = norm(l);
    if (!n || seen.has(n)) continue;
    seen.add(n); all.push(l);
  }
  let out = all;
  if (branch) {
    // Only icons that actually mark a branch in THIS bank count as markers. A one-off decoration an
    // author used on a single line shouldn't make every other line look "iconed" and get dropped.
    const counts = new Map<string, number>();
    for (const l of all) { const i = leadIcon(l); if (i) counts.set(i, (counts.get(i) ?? 0) + 1); }
    const markers = new Set([...counts].filter(([, n]) => n >= 3).map(([i]) => i));
    out = all.filter((l) => {
      const i = leadIcon(l);
      if (i && markers.has(i)) return i === branch.icon;
      return !!branch.neutral;
    });
  }
  cache.set(ck, out);
  return out;
}
