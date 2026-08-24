# Web3 implementation plan — decision record

Status: **draft**. The technical layer for putting ownership + value on-chain.
Builds on `docs/economy-and-web3.md` (the economic design). **Not legal advice.**
Everything targets **XLayer testnet with valueless tokens first.**

## Trust model (decided): minimal on-chain

On-chain holds **ownership and value**; the game stays off-chain:
- **Match sim + results stay off-chain** — the server (reusing `@fm/shared`) remains
  authoritative and stores results in Postgres.
- **On-chain:** player NFTs, consumables, the token, per-NFT upgrades, and reward
  payouts.
- A **backend signer** (a protocol-controlled key) distributes token rewards based on
  the off-chain league results.
- Designed so **on-chain verifiability (commit-reveal of seed + lineup hashes)** can be
  layered on later without redesign — the deterministic engine already makes results
  reproducible.

## Contract set

| Contract | Standard | Purpose |
|---|---|---|
| **PlayerNFT** | ERC-721 | Unique star players; **base stats immutable** in metadata. |
| **Consumables** | ERC-1155 | Stackable items (energy, boost packs). Burned for effects. |
| **Token** | ERC-20 | Utility + rewards. Sinks per the economy doc. |
| **PlayerUpgrades** | custom | `tokenId → boosts` (mutable, **capped**). Burning a consumable/token records a bounded boost that travels with the NFT on sale. |
| **RewardPool** | custom | Holds protocol-funded tokens; the backend signer pays out by league performance. |

**ERC-6551 (token-bound accounts): deferred.** Additive on top of ERC-721; revisit if
"wages accrue into the player NFT's own account" becomes a headline feature.

## The stats bridge (how it plugs into the engine)

> **effective stat = base stat (PlayerNFT metadata) + boosts (PlayerUpgrades), clamped 1–20.**

When the server builds a squad it: reads the wallet's **owned PlayerNFTs** (ownership),
their **base stats** (metadata) and **boosts** (PlayerUpgrades), computes effective
stats, fills the rest of the XI with **free base players**, and feeds that into the
**same deterministic engine**. Match logic is unchanged — stats just come from chain
instead of a generator. This is clean *because* the engine is pure.

### Star players vs base players (decided)

- **Star players = NFTs.** ERC-721, on-chain, owned, tradeable, upgradeable. The *only*
  players that are NFTs.
- **Base players = off-chain fillers.** Server-generated, **low stats**, **not NFTs** —
  no ownership, no trading, no upgrades. Pure squad filler.
- **A squad = owned star NFTs + base fillers to reach 11.** 0 stars → 11 fillers (free
  to play, weak); N stars → best N stars + (11−N) fillers. The upgrade path is to
  **acquire stars to replace fillers**.
- Base players are a fixed low-stat template per position (light generated names for
  flavour is optional); they are never persisted on-chain and never upgradeable — that
  keeps the star NFTs the clear source of squad strength and value.
- **Free-to-play viability rides entirely on strength/rating-based matchmaking** so
  all-filler squads mostly face similar squads. This is load-bearing.

### Stat ranges (decided) — engine 1–20 scale

| Tier | Individual stats | ~Overall | Notes |
|---|---|---|---|
| **Base / fake players** | ~3–9 (role-biased) | **~5–7** | Off-chain filler. Weak floor, kept high enough that all-filler matches still have action. Fixed low template, **not upgradeable**. |
| **Common star** (NFT) | ~9–15 | ~11–13 | Entry-level stars. |
| **Rare star** | ~11–17 | ~13–16 | |
| **Epic star** | ~14–19 | ~16–18 | |
| **Legendary star** | ~16–20 | **~18–20** | Elite; standout stats at the ceiling. |

- Gap: filler (~6) → common star (~12) is ~6 points; → legendary (~19) is ~13 points —
  stars are clearly powerful and aspirational, while f2p stays watchable.
- **On-chain upgrades** (PlayerUpgrades) can raise a star's stats, **capped at 20** — a
  common can be improved, but a legendary starts far ahead.
- The star range gives **rarity tiers** for collectibility, pricing, and the secondary
  market; NFT appeal also comes from ownership, upgradeability, and winning matches →
  rank → rewards, not the stat gap alone.
- **Validated** by `shared/ladder_sim.ts` (400 matches/matchup, identical tactics):
  filler-vs-filler is ~50/50 and high-scoring (watchable); a **common star** squad beats
  filler ~83% but filler still wins ~2% (rare upset — good for morale); rare/epic/
  legendary beat filler ~90/96/99% (filler ≈ never, but matchmaking rarely pairs them);
  adjacent star tiers stay competitive (legendary beats epic only ~46% vs 27%), so the
  top tier isn't mandatory to compete. The ladder is effective.

## Acquisition (decided): capped genesis sale, priced in the token

- A **fixed total supply** of PlayerNFTs sold once at genesis; afterwards **secondary
  market only** (no protocol minting of new players → no player-supply inflation).
- **Minted by paying the ERC-20 token** (decided). This makes genesis a large one-time
  **token sink** and gives the token immediate utility.
- **Chicken-and-egg:** buyers need the token first, so **token distribution must precede
  the genesis sale** (see build sequence). On testnet, a faucet supplies test tokens.
- **Genesis token proceeds** split between **burn** (deflation) and **treasury /
  RewardPool** (funds prizes + buyback). **Secondary royalties → buyback-burn**
  (diversified revenue, per the economy doc).
- **Onboarding dependency:** late joiners buy stars on the secondary market, so the
  **free base players + strength/rating-based matchmaking must keep no-NFT players
  competitive** — this is load-bearing, not optional.
- Ongoing token sinks are therefore **upgrades, consumables, premium analytics,
  cosmetics** (not player packs) — recurring utility, per the economy doc.

## Off-chain ↔ on-chain bridge

- **Read:** server uses **viem** to read PlayerNFT ownership + base stats + boosts.
- **Write:** a **backend signer** submits reward payouts (and any protocol txs). Hot-key
  management is a real security concern — multisig / careful ops before mainnet.
- **Auth:** wallet sign-in (connect → sign a nonce → session) replaces the prototype
  handle+token; identity = wallet address.

## Stack

Contracts in **Foundry** (Solidity), deployed to **XLayer testnet**; **viem** for
read/write from the server + client; wallet connect on the client. Existing OKX/XLayer
tooling available.

## Build sequence (each a shippable testnet step)

1. **Wallet sign-in** — connect + sign a nonce; identity = address.
2. **Token (ERC-20) + testnet faucet** — must exist first, since the genesis is priced
   in it. The faucet lets testers acquire tokens to buy players.
3. **PlayerNFT + token-priced genesis mint** — deploy ERC-721, the genesis sale (pay
   token → mint player), and the **"owned NFTs → star players"** squad integration. *The
   core proof: chain ownership drives the squad.*
4. **PlayerUpgrades + Consumables (ERC-1155)** — burn to apply capped boosts; read into
   effective stats. (Consumable specifics feed from the agent's `game-upgrade-ideas` doc.)
5. **RewardPool + distribution** — protocol pool + signer paying by league.
6. **(Later) verifiability** — commit-reveal of seed + lineup hashes; disputes.

## Open sub-decisions (settle as we reach them)
- **Initial token distribution** — how testers/players first get the token before genesis
  (testnet faucet now; a sale/airdrop model for mainnet later).
- **Genesis supply size + price** — how many PlayerNFTs total, and the token price each.
- **Squad caps** — how many star players allowed in an XI (balance + matchmaking).
- **Consumable set** — energy, boost types, etc. (from the upgrade-ideas doc).

## Security / risk
- Testnet + **valueless tokens first**; prove the loop before real value.
- **Contract audits** before mainnet; keep contracts simple.
- **Signer key** management (multisig / ops).
- **Regulatory** parallel track (from economy doc) before any real value; capped genesis
  + secondary is a securities-adjacent question in some jurisdictions — get counsel.
