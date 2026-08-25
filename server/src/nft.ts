// PlayerNFT bridge (web3 Step 3) — read a wallet's owned star players from chain
// and turn them into engine Player objects. The deterministic match engine is
// unchanged: stats just come from the NFT instead of the generator.
import { createPublicClient, http, getContract } from 'viem';
import { baseSepolia } from 'viem/chains';
import type { Player, Role } from '@fm/shared';

// Deployed PlayerNFT on Base Sepolia. Override per-env with NFT_ADDRESS; '' = off.
export const NFT_ADDRESS = (process.env.NFT_ADDRESS ?? '0x6E66DDF087d79281f16Df49aA36E3DC0d4330D55') as `0x${string}` | '';

const abi = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'tokenOfOwnerByIndex', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'index', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'roleOf', stateMutability: 'view', inputs: [{ name: '', type: 'uint256' }], outputs: [{ type: 'uint8' }] },
  {
    type: 'function', name: 'statsOf', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{
      type: 'tuple', components: [
        { name: 'pace', type: 'uint8' }, { name: 'strength', type: 'uint8' }, { name: 'passing', type: 'uint8' },
        { name: 'shooting', type: 'uint8' }, { name: 'tackling', type: 'uint8' }, { name: 'positioning', type: 'uint8' },
        { name: 'workrate', type: 'uint8' }, { name: 'keeping', type: 'uint8' },
        { name: 'setPiece', type: 'uint8' }, { name: 'stamina', type: 'uint8' },
      ],
    }],
  },
] as const;

const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
const ROLES: Role[] = ['GK', 'DF', 'MF', 'FW'];
const FIRST = ['Nova', 'Zane', 'Kai', 'Rex', 'Neo', 'Axel', 'Vex', 'Jax', 'Ryu', 'Cruz', 'Blaze', 'Onyx'];
const LAST = ['Striker', 'Volt', 'Steel', 'Comet', 'Fox', 'Storm', 'Blade', 'Ace', 'Phantom', 'Titan', 'Rocket', 'King'];
function nameFor(id: bigint): string {
  const n = Number(id % 1000n);
  return `${FIRST[n % FIRST.length]} ${LAST[(n * 7) % LAST.length]}`;
}

export const nftEnabled = () => !!NFT_ADDRESS;
export const nftInfo = () => ({ address: NFT_ADDRESS, chainId: baseSepolia.id, enabled: nftEnabled() });

/** Read the star players owned by a wallet as engine Player objects (id = `nft:<tokenId>`). */
export async function ownedPlayers(wallet: string | null): Promise<Player[]> {
  if (!NFT_ADDRESS || !wallet) return [];
  try {
    const c = getContract({ address: NFT_ADDRESS, abi, client: publicClient });
    const bal = Number(await c.read.balanceOf([wallet as `0x${string}`]));
    const players: Player[] = [];
    for (let i = 0; i < bal; i++) {
      const tokenId = await c.read.tokenOfOwnerByIndex([wallet as `0x${string}`, BigInt(i)]);
      const [roleIdx, st] = await Promise.all([c.read.roleOf([tokenId]), c.read.statsOf([tokenId])]);
      players.push({
        id: `nft:${tokenId.toString()}`,
        name: nameFor(tokenId),
        role: ROLES[Number(roleIdx)] ?? 'MF',
        attrs: {
          pace: st.pace, strength: st.strength, passing: st.passing, shooting: st.shooting,
          tackling: st.tackling, positioning: st.positioning, workrate: st.workrate, keeping: st.keeping,
          setPiece: st.setPiece, stamina: st.stamina,
        },
        anchor: { x: 0, y: 0 },
      });
    }
    return players;
  } catch {
    return []; // chain unreachable → fall back to the off-chain squad, never break the game
  }
}
