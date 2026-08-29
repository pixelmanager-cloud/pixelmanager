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
  return line.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}

import { CM_EXTRA_1 } from './pack_1.js';
import { CM_EXTRA_2 } from './pack_2.js';
import { CM_EXTRA_3 } from './pack_3.js';
import { CM_EXTRA_4 } from './pack_4.js';
import { CM_EXTRA_5 } from './pack_5.js';
import { CM_EXTRA_6 } from './pack_6.js';

const PACKS: CommentaryBank[] = [CM_EXTRA_1, CM_EXTRA_2, CM_EXTRA_3, CM_EXTRA_4, CM_EXTRA_5, CM_EXTRA_6];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 {}]/g, '').replace(/\s+/g, ' ').trim();
const cache = new Map<string, string[]>();
/** Every authored line for an event type, de-duplicated across packs. */
export function commentaryExtra(key: string): string[] {
  const hit = cache.get(key);
  if (hit) return hit;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of PACKS) for (const l of p[key] ?? []) {
    const n = norm(l);
    if (!n || seen.has(n)) continue;
    seen.add(n); out.push(l);
  }
  cache.set(key, out);
  return out;
}
