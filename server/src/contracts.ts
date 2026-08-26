// Server glue for the shared contract model. The NFT is always owned; a contract only gates SELECTION.
// On first sight of an owned NFT we lazily (a) record its lifecycle age and (b) sign an initial contract
// of the player's preferred length. Base/academy/loan players carry no contract and are always available.
import { overall, signContract, contractView, type Player } from '@fm/shared';
import type { Store } from './store.js';

/** Contract-eligible players are the tradeable NFT assets (id `nft:<tokenId>` or a dev-injected `nft:*`). */
export const isNftPlayer = (id: string) => id.startsWith('nft:');

export interface ContractInfo {
  playerId: string; age: number; available: boolean; seasonsLeft: number;
  lengthSeasons: number; extendCost: number; sellValue: number; stakedSeasons: number;
}

/** Age of an NFT player this season: 25 at his prime_season, +1 per season, capped at 40 (retirement). */
export function ageOf(primeSeason: number, currentSeason: number): number {
  return Math.min(40, Math.max(25, 25 + (currentSeason - primeSeason)));
}

/** Set of NFT player ids that CANNOT be selected this season — a lapsed contract benches them (the NFT
 *  stays owned). Used to bench them for selection exactly like injured players. */
export async function unavailableNftIds(db: Store, ownerId: string, players: Player[], currentSeason: number): Promise<Set<string>> {
  const info = await squadContracts(db, ownerId, players, currentSeason);
  const ids = new Set<string>();
  for (const [id, ci] of info) if (!ci.available) ids.add(id);
  return ids;
}

/** Ensure every owned NFT player has a lifecycle (age) + a contract (sign-on-first-sight), then return
 *  each one's contract situation. `currentSeason` is the global season NUMBER. */
export async function squadContracts(db: Store, ownerId: string, players: Player[], currentSeason: number): Promise<Map<string, ContractInfo>> {
  const nfts = players.filter((p) => isNftPlayer(p.id));
  const existing = new Map((await db.getContracts(ownerId)).map((c) => [c.player_id, c]));
  const out = new Map<string, ContractInfo>();
  for (const p of nfts) {
    const prime = await db.ensurePrimeSeason(p.id, currentSeason);
    const age = ageOf(prime, currentSeason);
    let c = existing.get(p.id);
    if (!c) { // first sight → sign an initial deal, start the staking clock
      const fresh = signContract(currentSeason, p.greed ?? 10, p.personality);
      await db.setContract(ownerId, p.id, fresh.signedSeason, fresh.lengthSeasons, currentSeason);
      c = { player_id: p.id, signed_season: fresh.signedSeason, length_seasons: fresh.lengthSeasons, staked_since: currentSeason };
    }
    const contract = { signedSeason: c.signed_season, lengthSeasons: c.length_seasons };
    const stakedSeasons = Math.max(0, currentSeason - (c.staked_since || currentSeason));
    const v = contractView(overall(p), age, p.greed ?? 10, p.marketability ?? 10, p.personality, contract, currentSeason, p.earnings ?? 0, stakedSeasons);
    out.set(p.id, { playerId: p.id, age, available: v.available, seasonsLeft: v.seasonsLeft, lengthSeasons: v.lengthSeasons, extendCost: v.extendCost, sellValue: v.sellValue, stakedSeasons });
  }
  return out;
}
