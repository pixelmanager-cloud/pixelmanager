# Web3 lifecycle loop — local dev (Anvil)

> ❌ **OBSOLETE (2026-08-27).** Web3 removed — see `docs/direction.md`. Historical only.

We prove the whole career→manager→reborn loop against a **local chain** first, then deploy the
same contract to Base Sepolia. The chain holds only **ownership + lineage** (generation,
genesSeed); all game state stays off-chain keyed by the on-chain tokenId (the "minimal on-chain"
trust model).

## Contract

`contracts/src/LifecycleNFT.sol` — ERC-721Enumerable. `mint()` (cap-enforced genesis prospect),
`reborn(tokenId)` (owner-only; generation++ + reseed, same token), `lineageOf` / `generationOf` /
`genesSeedOf` views. Foundry tests: `contracts/test/LifecycleNFT.t.sol`.

```bash
export PATH="$PATH:$HOME/.foundry/bin"
cd contracts && forge test --match-contract LifecycleNFTTest    # 6 passing
```

## Run the local loop

1. **Start Anvil** (local chain, 10 pre-funded accounts, chain id 31337):
   ```bash
   export PATH="$PATH:$HOME/.foundry/bin"
   anvil > /tmp/anvil.log 2>&1 &
   ```
2. **Deploy LifecycleNFT** (Anvil's first dev key; deterministic address `0x5FbDB231…80aa3`):
   ```bash
   cd contracts
   SUPPLY_CAP=10000 forge script script/DeployLifecycleNFT.s.sol \
     --rpc-url http://127.0.0.1:8545 \
     --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
     --broadcast
   ```
3. **Point the server at it** — set these env vars for `cd server && npm run dev`:
   ```
   LIFECYCLE_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   LIFECYCLE_RPC=http://127.0.0.1:8545
   LIFECYCLE_CHAIN_ID=31337
   LIFECYCLE_SIGNER_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
   `LIFECYCLE_SIGNER_KEY` enables the **dev-mode server signer**: the server mints/reborns on-chain
   on the player's behalf so we can drive the whole loop without a browser wallet on Anvil. In prod
   (Base Sepolia) this is unset and the **user's wallet** signs mint/reborn client-side.

## Deploy to Base Sepolia (later)

Same script, real key + RPC (needs testnet ETH), then set `LIFECYCLE_ADDRESS`/`LIFECYCLE_RPC`/
`LIFECYCLE_CHAIN_ID=84532` on the server and leave `LIFECYCLE_SIGNER_KEY` unset:
```bash
forge script script/DeployLifecycleNFT.s.sol \
  --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY --broadcast
```

## Server bridge

`server/src/lifecyclenft.ts` — viem reads (`ownedTokens`, `ownerOf`, `lineageOf`) + dev-mode
server-signer writes (`serverMintTo`, `serverReborn`). Env-driven chain config (Anvil default).
