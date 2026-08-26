# Direction — mainstream game, Steam launch (web3 REMOVED)

**Status:** DECIDED (2026-08-27). This supersedes all prior web3/on-chain plans.

## The decision
Pixel Manager is a **mainstream premium PC game targeting a Steam launch.** **Web3 is fully removed** — no
NFTs, no wallets, no smart contracts, no on-chain anything. Players are ordinary account-owned save data.

## Why
- **Bigger, receptive market.** Management/sim is a top Steam genre; the addressable audience is ~100× the
  crypto-native one, and it *likes* this kind of game (vs. actively boycotting "NFT games").
- **More revenue, not less.** Bigger market × far better conversion (one-click buy vs. wallet friction) ×
  proven higher-LTV models (premium + cosmetics + expansions) − the reputational drag of NFT branding. The
  mint was never the money-maker anyway (capped ~$150k); the real revenue is ongoing content, which works
  *better* mainstream.
- **Collapses risk & complexity.** All the securities/gacha/MSB/AML/audit/wallet/RPC overhead disappears.
- **Steam bans blockchain games** — so mainstream and web3 were mutually exclusive on the target platform.

## What STAYS (the actual game — unchanged)
The web3 layer was never where the fun lived. All of this is untouched:
- The **development loop** ("grow with care → flourish; neglect → regress") — the cash cow. See
  `growth-and-content-strategy.md`.
- The **player career** (NSS-style: stages, cards, meters, focus, lifestyle, kit, matchday moments).
- The **dynasty / reborn** model and inheritance (regressed toward the mean) — a pure game mechanic, never
  needed a chain. See `mint-and-dynasty-design.md` (§ still valid, minus the on-chain framing).
- The **manager/owner mode**, seasons, leagues, tactics, facilities.
- The **closed coin economy** (already web3-free by design).
- The deterministic seeded match engine, and the whole content roadmap.

## What GOES (subtraction)
- thirdweb, viem, wallet sign-in, the LifecycleNFT contract + Foundry/Anvil, RPC/on-chain sync, all
  `LIFECYCLE_*`/RPC/SIGNER env, `scripts/dev-web3.sh`.
- The "NFT mint" becomes an **in-game prospect acquisition** (the scouting-board *concept* survives as a
  scouting UI; it is NOT a paid-per-player cash purchase — see Monetization below).
- Kept in git history, just removed from the build.

## Monetization — DECIDED: premium base + cosmetic/content-DLC IAP (never pay-to-win)
The model is **premium base game + optional cosmetic/content IAP** — the native, well-liked model of the
management/sim genre (Football Manager, Paradox, Cities: Skylines all do premium + DLC). It monetizes the
*content flywheel* (see `growth-and-content-strategy.md`) instead of friction.

**The hard rule: IAP is COSMETIC and/or genuine CONTENT DLC only — NEVER gameplay power.** The Steam audience
tolerates "buy the game + buy cosmetics/expansions"; it revolts at "pay twice" the instant IAP touches
competitive power. So:
- ✅ **Cosmetics** — kits, celebrations, stadium/pitch skins, badges, portraits. Pure expression, zero power.
- ✅ **Content expansions (DLC)** — new leagues/eras, scenario packs, new competitions, cosmetic sets.
- ❌ **Never:** selling prospects/players for money, currency that buys gameplay advantage (growth speed,
  facilities, stat edges), loot boxes/gacha, or energy/timer removal.

**Currency split (keeps it clean, avoids pay-to-win):**
- **Earned coins** (in-game only, not buyable) buy *gameplay* things — prospects, facilities, reborn.
- **Real money buys COSMETICS/DLC directly** (or a separate cosmetic-only currency). Real money never buys
  the gameplay-power currency.
- Prospects are acquired **in-game** (scout/develop), free or via *earned* coins — never a paid power buy.

**Sequencing:** ship **premium-only at launch** (own the whole core, no paywalls), then add cosmetic packs +
content DLC *after* goodwill is built — lowest-risk. Real-money purchases on Steam go through **Steamworks**,
not Stripe (`coin-purchases.md`'s rails still apply, re-targeted to Steamworks and cosmetic-only).

---

# Worklist

## Phase 1 — De-web3 (subtraction; do first)
- [ ] **Client:** gut `client/src/wallet.ts`; remove all wallet imports/usages in `main.ts`; remove the
      wallet sign-in UI (`wallet-email`, `wallet-code` inputs, `wallet-email-btn`, `wallet-injected-btn`,
      the `walletVerify` flow) from `index.html`/`main.ts`. Keep handle+password login as the only path.
- [ ] **Client deps:** remove `thirdweb` (and any wallet SDKs) from `client/package.json`; `npm install`.
      Verify the bundle shrinks massively (was multiple MB of wallet JS).
- [ ] **Server:** delete `server/src/lifecyclenft.ts`; remove the on-chain branch of `/genesis`, the on-chain
      `/reborn` path, `/onchain/:id`, and `syncOnchainTokens`/`materializeOnchain` calls in `tokens.ts`;
      remove the wallet auth path (`walletOf`/`walletVerify`); drop `viem` dep.
- [ ] **Contract/tooling:** remove `contracts/` (LifecycleNFT.sol + Foundry) and `scripts/dev-web3.sh` from
      the build (retain in git history).
- [ ] **Env:** drop `LIFECYCLE_ADDRESS`, `RPC`, `CHAIN_ID`, `SIGNER_KEY` from all env/config/docs.
- [ ] Verify: full build + `npm run verify` green; the game plays start→finish (create prospect → career →
      graduate → squad → reborn) entirely off-chain.

## Phase 2 — Rewire the acquisition/economy (small)
- [ ] Make the off-chain `mintGenesis` the sole "acquire a prospect" path (it already exists); reborn uses
      `rebornFields` directly (already off-chain logic) — no chain calls.
- [ ] Keep `nft:N` ids as internal ids for now (optional later rename to `player:`/`prospect:`).
- [ ] Decide coin economy on Steam: premium-only (no IAP) for launch, or Steamworks microtransactions later.
- [ ] Fold the surviving "scouting board / known-frame, earned-greatness" concept into an **in-game**
      acquisition UI (not a cash mint).

### Hosting note
- **Server (Railway/Postgres) stays** — the online leagues run through it regardless of platform.
- **Netlify (web client host) is now optional** — not needed for the Steam build (the desktop wrapper bundles
  the client). Keep it for dev previews and, later, an optional **browser web demo to drive Steam wishlists**.
  Same client build serves both web (Netlify) and desktop (wrapper).

## Phase 3 — Steam readiness (new track; after the game is solid)
- [ ] **Desktop packaging:** wrap the web client as a desktop app — **Tauri** (light) or **Electron**
      (mature, best Steamworks examples). Decide.
- [ ] **Steamworks integration:** app id, achievements, stats, cloud saves, overlay (greenworks/steamworks.js
      for Electron; Tauri has community plugins).
- [ ] **Multiplayer:** keep the existing server (Railway/Postgres) — the desktop client talks to it; leagues
      stay online. (Optionally add an offline single-player mode.)
- [ ] **Store setup:** Steam page, capsule art, trailer, wishlist campaign, pricing, age rating.
- [ ] **QA/build pipeline:** signed desktop builds for Win/Mac(/Linux) uploaded via Steamworks.

### Developing on a Mac (single MacBook is fine)
- Development is 100% Mac-friendly (web stack). The only Mac limit is *building/testing the Windows build*.
- **Build Windows/Linux binaries via CI (GitHub Actions)** — free Windows+Mac+Linux cloud runners; no PC
  needed. (Electron also cross-builds Windows from macOS directly; Tauri leans on CI for Windows.)
- **Test the Windows build pre-launch** via a free **Windows VM** (UTM/Parallels; Windows-on-ARM on Apple
  Silicon is fine for testing) or a cheap Windows mini-PC (~$150–300). Only needed near launch.
- **Steamworks tooling + upload run on Mac**; store setup is web-based. ($100 Steam Direct fee per app.)
- **Wrapper lean for Mac-solo:** **Electron** (smoother Windows cross-build from macOS + best Steamworks
  examples) unless bundle size becomes a priority (then Tauri).

## Ongoing — the game itself
- Content depth continues (the overnight agents + us), steered by `growth-and-content-strategy.md`. This is
  and remains the #1 priority — a mainstream launch lives or dies on how good and deep the game is.

## Open decisions
- [x] ~~Premium vs F2P~~ → **DECIDED: premium base + cosmetic/content-DLC IAP, never pay-to-win** (above).
- [ ] Final premium price point (and cosmetic/DLC pricing).
- [ ] Tauri vs. Electron for the desktop wrapper.
- [x] ~~Online-leagues-core vs offline-career-entry~~ → **DECIDED: OFFLINE-FIRST** (see Architecture below).
- [ ] Timeline: how much content depth before starting the Steam track.

## Architecture — DECIDED: offline-first (single-player dynasty is the core)
The core game is **fully offline single-player** — develop players, build dynasties, play seasons/cups vs AI
clubs, all locally. Chosen for far lower maintenance (no always-on server/DB, no live-ops, no matchmaking,
no anti-cheat), instant/plane-friendly play, and because it puts the unique dynasty loop front and centre.

**Pragmatic implementation (near-zero game-code rewrite):** the game logic is already deterministic and
portable (`@fm/shared` runs anywhere; the seasons/pods/cup already play vs AI). So **embed the existing
server + SQLite *inside* the desktop app** (Electron bundles Node): the "server" becomes a local process,
SQLite is the local save file, and **Steam Cloud syncs the save.** We relocate the runtime, not rewrite it.

**Online/PvP becomes an OPTIONAL later layer** — the same client can connect to a hosted server for
real-player leagues when/if we want it; it is NOT required to play or to launch. The async-PvP work already
built is not wasted — it's the seed of that optional online layer. Ship single-player dynasty first.

Trade-offs (mostly upside): no global leaderboards by default (that's the online layer); saves are local +
Steam Cloud; but no server cost, no anti-cheat, no cold-start loneliness.
