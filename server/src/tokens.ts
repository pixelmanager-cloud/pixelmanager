// DB-touching orchestration for the UNIFIED, fixed-supply NFT lifecycle. The pure core
// (conversions, contract math, the career-replay engine wrapper, graduation/reborn field
// derivation, legacy cards) moved to @fm/shared/tokens.ts (phase 1 offline migration) —
// these three still need the Store, so they stay here.
import { rollGenes, nameFor, tokenContract, type Token } from '@fm/shared';
import type { Store } from './store.js';

// Fixed-supply economy knobs, env-driven (so not part of the pure @fm/shared rules).
export const SUPPLY_CAP = Number(process.env.SUPPLY_CAP ?? 10000); // fixed total NFTs in the economy
// Lifecycle SINKS (coins now — the seam that becomes a PTEST spend later; see docs/economy-and-web3.md).
// With fixed supply, token demand comes from the ACTIVITY of cycling the set, not from minting more.
export const GENESIS_COST = Number(process.env.GENESIS_COST ?? 300);   // mint a brand-new prospect
export const REBORN_COST = Number(process.env.REBORN_COST ?? 150);     // breed a retiree's next generation
export const MARKET_FEE_PCT = Number(process.env.MARKET_FEE_PCT ?? 5); // % skimmed off every token sale (a burn)

function seedFrom(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) || 1; }

/** Bank a match's individual output onto an NFT token (career goals/assists/POTM — permanent, tradable). */
export async function bumpTokenStats(db: Store, tokenId: string, d: { goals?: number; assists?: number; potm?: number }): Promise<void> {
  const t = await db.getToken(tokenId);
  if (!t) return;
  await db.updateToken(tokenId, {
    ach_goals: t.ach_goals + (d.goals ?? 0),
    ach_assists: t.ach_assists + (d.assists ?? 0),
    ach_potm: t.ach_potm + (d.potm ?? 0),
  });
}

// ── genesis: mint a fresh 10yo prospect (fresh genes, no pedigree). Enforces the fixed supply cap. ──
export async function mintGenesis(db: Store, ownerId: string): Promise<Token> {
  if ((await db.countTokens()) >= SUPPLY_CAP) throw new Error('supply cap reached');
  const n = (await db.countTokens()) + 1;
  const id = `nft:${n}`;
  const seed = seedFrom(id + ':genesis');
  const genes = rollGenes(seed);
  await db.createToken({ id, owner_id: ownerId, generation: 0, state: 'prospect', name: nameFor(seed), genes_json: JSON.stringify(genes), pedigree: 0, dev_bonus_json: '{}' });
  await db.updateToken(id, { role: seedFrom(id + ':gk') % 100 < 12 ? 'GK' : 'MF' }); // track hint (~12% keepers)
  return (await db.getToken(id))!;
}

/** Token ids that CANNOT be selected this season (lapsed contract or retired) — benched like injuries. */
export async function unavailableTokenIds(db: Store, ownerId: string, season: number): Promise<Set<string>> {
  const out = new Set<string>();
  for (const t of await db.tokensOwnedBy(ownerId)) if (t.state !== 'prospect' && !tokenContract(t, season).available) out.add(t.id);
  return out;
}
