# Economy & web3 design — decision record

Status: **draft**. Captures the token/NFT economy for Pixel Manager, restructured
to keep the crypto appeal (own NFTs, earn tokens, deflationary supply) while
removing the clearest gambling mechanic. **Not legal advice** — see Regulatory.

## The core restructure: prizes, not a betting pool

**Removed:** the player-funded wager (original points 6–7 — pay a token entry fee
into a pot, winner takes the other players' fees). Paying to enter + winning other
players' money on an outcome is the structure regulators treat as gambling.

**Replaced with:** **free to enter + protocol-funded prizes.**
- **No token fee to play a match / enter a round.** Anyone can commit a lineup and
  compete for free (with base players or their NFT stars).
- **Rewards come from a protocol reward pool**, not from other players' stakes. The
  pool is funded by the treasury + a share of token-sink revenue (see below), not by
  wagers. This makes it a *skill competition with sponsored prizes*, not a bet
  between players.
- **Rewards are distributed by competitive performance** — primarily a **season /
  leaderboard** model (earn ranking points over many rounds; the top of the table
  earns from the pool), rather than a per-match cash-out that feels like a bet.

Net effect: players still *earn tokens by being good managers*, the token is still
deflationary, but no player stakes money against another player.

## Token model

**Sinks (token demand + deflation) — keep all of these:**
- **Player upgrades** — apply a consumable NFT / burn tokens for permanent stat boosts
  (capped — see NFTs).
- **Contract extensions** — a recurring token burn to keep a roster slot/energy active
  (design as an *energy/fitness refill*, not "your NFT stops working" — see NFTs).
- **Premium analytics** — burn for *advanced* scouting (win-probability sims, optimal-XI
  solver, deep opponent breakdown). **Basic tactical recommendations stay free** (already
  built into the scouting report) — never paywall existing free value.
- **Cosmetics** — kits, crests, stadium skins.

**Faucets (how tokens enter players' hands):**
- Initial distribution (sale / liquidity), and the **protocol reward pool** payouts.
- Sink revenue recirculates: tokens spent on sinks are split **partly burned
  (deflation) and partly routed to the reward pool** — so the economy loops
  (buy → spend on sinks → burn + fund prizes → paid to winners → hold/respend)
  instead of relying on new buyers to pay old winners.
- Emission/treasury schedule: **TBD — must be modelled before mainnet.** Deflation is
  good only until players can't afford to play; keep faucets and sinks balanced.

**Honest framing:** even in this model, in aggregate players spend more than the pool
pays out (the burn is a net drain). This is entertainment + skill competition, **not
passive income** — market it that way. Never imply guaranteed earnings.

## NFTs

- **Base + upgrades split.** An NFT stores **immutable base stats**; upgrades from
  consumables live in a **mutable game-layer** keyed to the token id. Keeps ownership
  clean while stats can grow.
- **Power-creep caps.** Boosts are **bounded** (hard cap at the 20 stat ceiling, and/or
  a per-player boost budget with diminishing returns). Protects the tuned 1–20 engine
  balance and keeps new players able to catch up. **This is non-negotiable — uncapped
  permanent boosts break the engine.**
- **Star players vs base players.** Non-holders play with low-stat base players (free
  on-ramp). NFT players are the "stars." Balance via matchmaking, not by making base
  players unusable.

## Balance & matchmaking (makes free-to-play actually competitive)

- **Rating/strength-based matchmaking (Elo + squad rating).** Base-player teams mostly
  face similar teams; star-heavy squads face each other. Without this, free players just
  lose and churn, and "free to play" is hollow.
- **Squad-shape cap** (optional) — limit how many star players in an XI so lineups have
  shape, not just "most NFTs wins."
- **Payout curve, not winner-take-all.** Reward the **top ~10–20%** on a sliding scale.
  Pure winner-take-all makes most entrants feel robbed and quit.

## Fairness (fits the deterministic engine)

- **Commit-reveal lineups.** Commit a **hash** of your lineup on-chain, reveal at lock.
  Cheap gas, and it **hides everyone's lineup until the round locks** so opponents can't
  counter-pick by reading the chain.
- **Verifiable results.** Matches run off-chain on the deterministic engine from the
  revealed lineups + a committed seed; anyone can re-run to verify. Results settle the
  leaderboard/pool trustlessly.

## The revised round loop

1. Player commits a lineup for the upcoming round (free) — committed as a hash on-chain.
2. At round lock, lineups reveal; the server runs the deterministic sims (matchmade by
   rating).
3. Results update the **season leaderboard / ranking**; standings settle on-chain.
4. **Protocol reward pool** pays out by ranking on a curve; a portion of sink revenue is
   burned (deflation) and a portion tops up the pool.
5. Repeat. No player-funded pot; no stake-to-win-others'-money.

## Regulatory stance (not legal advice)

- The restructure (free entry + sponsored prizes + skill emphasis) materially lowers
  gambling exposure but is **not a guarantee** — classification varies by jurisdiction,
  and "skill vs chance" and "sweepstakes" rules differ everywhere.
- **Lean skill-heavy**: keep match variance modest so outcomes are driven by squad +
  tactics, strengthening the game-of-skill characterization.
- **Process:** testnet with **valueless** tokens first → prove it's fun → **get real
  legal counsel for target markets before any real value** → geofence where needed.
- Treat "is it fun on testnet" and "is it lawful with value where my users are" as
  **parallel tracks**; don't wire real value until both clear.

## Sequencing (unchanged)

Build and prove the **off-chain loop** first (generated + base players, matchmaking,
season table) — it must be fun with **no money on the line**. Only then layer wallet →
NFTs → token sinks → protocol-funded rewards, on **testnet** first.
