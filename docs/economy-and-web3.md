# Economy & web3 design — decision record

> ❌ **OBSOLETE (2026-08-27).** Web3 removed — see `docs/direction.md`. Historical only. The surviving
> economy is the closed coin system; monetization is premium + cosmetics/expansions (Steam).

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

**What gives the token durable value (not just buy pressure):**
1. **Recurring consumptive utility is the primary anchor.** Prioritise sinks players
   spend on *repeatedly* (contract/energy refills, seasonal passes, consumables,
   cosmetic drops, higher-league entry) over one-time permanent upgrades. Recurring
   consumption = steady, gameplay-driven demand.
2. **Emissions ≤ sinks + buybacks — the make-or-break rule.** Prizes are a faucet; if
   more is emitted than burned/absorbed, the token hyperinflates and rewards become
   worthless (the play-to-earn death spiral). **Model the flows; keep total prize
   emission below total absorption over time.** Fund prizes from treasury + recycled
   sink revenue, never from unbounded printing.
3. **Buyback-and-burn from *diversified* revenue.** Route protocol revenue into buying
   the token off-market and burning it — but source it from **primary NFT sales +
   secondary royalties + cosmetic/consumable/premium-feature sales + sponsorships**, not
   secondary NFT trading fees alone (volatile, royalties often unenforced).
4. **Token-gated prestige** (soft demand): exclusive cosmetics / limited NFTs buyable
   *only* with the token (and burned on purchase); stake-for-**access** to higher leagues
   — never stake-for-yield (that's a ponzi faucet).
5. **Fun-first.** The game must be fun *without* the earning. If players only play to
   extract, they leave when rewards dip and no buyback saves it. The token amplifies a
   fun game; it cannot manufacture one. (This is why the off-chain loop is proven fun
   first.)

- Emission/treasury schedule: **TBD — must be modelled before mainnet**, keeping faucets
  (prizes) below sinks (utility burns + buybacks).

**Honest framing:** even in this model, in aggregate players spend more than the pool
pays out (the burn is a net drain). This is entertainment + skill competition, **not
passive income** — market it that way. Never imply guaranteed earnings.

## Token demand from the two-layer lifecycle (added 2026-08-26)

The Career Sim + player lifecycle we built is, by design, a **token-demand engine**: it
constantly needs *new* players created, which is where the ERC-20 gets its recurring,
utility-driven demand. Recommended shape:

**Two currencies, cleanly separated (keeps the competitive game free + non-p2w):**
- **COINS** — soft, in-game, freely *emitted by play* (match + season rewards). Run the
  everyday competitive loop with coins: facilities, transfers, **contract extensions**,
  scouting, wages. Because you earn coins by playing, retention/convenience never require
  real spend → matches the user's "retention + convenience, not pay-to-win" decision.
- **PTEST (ERC-20)** — scarce **hard** token, gated to **asset CREATION & permanence,
  never to competitive power.** Token buys *the right to create/keep lasting on-chain
  assets*, not a stat edge.

**Token SINKS (the demand) — all creation/permanence, none pay-to-win:**
1. **Genesis mint** — minting a new player/prospect NFT costs PTEST (+ supply cap). The
   breeder economy needs a steady *supply* of new players → steady, gameplay-driven demand.
2. **Reborn / lineage mint** — breeding the next generation at retirement (the lifecycle's
   reborn step) costs PTEST → recurring demand tied to every player that ages out.
3. **Legacy / prestige mint** — minting a manager's soulbound Legacy card or a player's
   retirement "legend card" costs PTEST (vanity permanence — pure flex, zero power).
4. **Marketplace fee** — a small % of every NFT trade, taken in PTEST → routed to
   buyback-burn + reward pool. Money flow scales with trade volume (the breeder↔manager
   market), not with new-buyer inflows.
5. **Premium convenience** (the convenience lane): deep-scout unlocks, extra scouting
   expeditions, cosmetic club identity — optional PTEST sinks that don't touch balance.

**Money FLOW TO the token (value accrual, per the rules above):** mint fees + a cut of
market fees are **burned** (deflation as the game grows); the remainder funds the
**protocol reward pool** (prizes are pool-funded, *never* loser→winner transfers). Value
accrues from must-have creation utility + burn scarcity + fee-funded prizes — demand rises
with the player/breeder base, not with speculation.

**The elegant fit:** every *new* and every *reborn* player already requires a mint, and the
breeder needs to keep producing supply → the lifecycle itself generates recurring token
demand. earnings/greed/contracts stay in **coins** (soft, competitive, free-to-earn); PTEST
sits on **creation + permanence + fees**.

**Guardrails (unchanged stance):** competitive advantage stays earnable with free coins (no
p2w); no wagering-shaped flows; **PTEST stays testnet/valueless until the flows are modelled
(sinks ≥ emissions proven) and legally reviewed.** Axie-style growth-dependence is the
structural risk → model sustainability before any real value.

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
