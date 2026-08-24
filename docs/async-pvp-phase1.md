# Async PvP — Phase 1 architecture sketch (off-chain)

Status: **draft for discussion**. Off-chain foundation for async player-vs-player,
built so the web3 layer (NFT players, token stakes, onchain settlement) drops on
top without rework.

## Core rules (locked for the competitive path)

- **A match = a pure function**: `simulate(teamA, tacticsA, teamB, tacticsB, seed)`
  → deterministic result. Same inputs always produce the same match.
- **No half-time pause, no substitutions** in PvP/ranked matches. Tactics + lineup
  are locked at kickoff and the sim runs straight to full-time. This keeps the match
  fully determined by pre-kickoff inputs — ideal for onchain commit-reveal later.
  (Half-time + subs may survive only as an optional solo "practice" mode, or be
  removed entirely — decision pending.)
- **The server is authoritative**: it owns the seed and runs the sim. The client
  only *replays* the deterministic result for the 2D view — it never decides anything.

## The big reuse win

`@fm/shared` is framework-free TypeScript, so the **server imports the exact same
engine** the client uses: `MatchEngine`, `generateClub`, `buildXI`, `autoPickXI`,
etc. No duplicated match logic — the server runs the authoritative sim, the client
re-runs the identical one to render. This is why the engine was built deterministic
and dependency-free from day one.

## Data model

- **Account** — `id`, `handle`, auth identity (email/passwordless now; wallet address
  later), `rating` (Elo, default 1000), `createdAt`.
- **Club** — belongs to Account; `name`, `colors`, and a **roster** of PlayerCards
  (stored explicitly so future transfers/NFT ownership can mutate it).
- **PlayerCard** — `id`, `name`, `role`, the 8 stats; later `nftTokenId`.
- **StandingOrders** — belongs to Club; the **default lineup (formation + 11 player
  ids) + tactics** used when this club is challenged while its owner is offline.
  *This is the mechanism that makes matches async — your team plays your orders.*
- **Match** — `id`, `homeAccountId`, `awayAccountId`, **snapshots** of both teams +
  both tactics (stored, not referenced, so the match stays reproducible even after
  squads change), `seed`, `result [home, away]`, `createdAt`, `status`. The full
  event log is *not* stored — it regenerates from the seed on replay.
- Leaderboard is derived from Account rating + W/D/L.

## API (REST, server = `server/` package)

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/login` | passwordless/email session now; wallet sign-in later |
| GET | `/me` | my account + club + standing orders |
| PUT | `/club/standing-orders` | set my defensive lineup + tactics |
| GET | `/opponents?mode=ranked` | matchmaking: candidates near my rating |
| POST | `/matches` | `{opponentId, myLineup, myTactics}` → run sim, store, return replay payload |
| GET | `/matches/:id` | fetch one match (seed + snapshots) for replay |
| GET | `/matches?me=1` | my history / "you were challenged" notifications |
| GET | `/leaderboard` | rankings |

## Match execution flow (server, on `POST /matches`)

1. Authenticate the caller; load my club.
2. **Validate my lineup** server-side: exactly 11 players I own, one GK, valid formation.
3. Load the opponent's club + **standing orders** (their offline lineup + tactics).
4. Generate a **seed** (server random now; a committed seed later for onchain).
5. `buildXI` both teams; `new MatchEngine([teamA, teamB], seed, [tacticsA, tacticsB])`
   and tick to `state.finished` — **no half-time pause**.
6. Persist the Match (team snapshots + tactics + seed + result). Update both Elo ratings.
7. Return `{ matchId, seed, teams, tactics, result }`.

## Client changes

- Replace the `localStorage` round with server calls (a thin `api.ts` fetch layer).
- The **gauntlet becomes real opponents**: the 5 CPU clubs per round become 5 other
  players' clubs (or ranked matchmaking).
- Match view is largely unchanged — it already renders by running the engine locally;
  it just gets `{seed, teams, tactics}` from the server instead of generating them,
  and **ticks straight through with no half-time pause**.
- Remove the half-time/subs UI from the competitive match path.

## Recommended stack

- **Server**: Fastify + TypeScript in `server/`, importing `@fm/shared`.
- **DB**: Postgres on a managed free tier (Neon/Supabase) for durability with no ops —
  or SQLite (`better-sqlite3`) on the existing Vultr box for the simplest MVP.
- **Auth v1**: passwordless email (magic link) or a simple handle+token; swap to
  **wallet sign-in** (sign a nonce) when NFTs arrive.
- **Hosting**: server on the existing Vultr box or a managed host (Fly/Railway);
  the client stays static on Netlify and calls the server API (CORS configured).

## MVP slice (smallest first)

Accounts + club persistence + set standing orders + "play a stored opponent" (ranked
list) + result + leaderboard. Keep **generated** squads (no transfers yet). This alone
proves the async-PvP loop is fun and builds the exact foundation NFTs plug into.

## How web3 layers on later (no rework)

- Before `POST /matches`: optional **token stake** into escrow.
- PlayerCards ← the **NFTs the wallet owns** (step 5 reads NFT stats).
- After the sim: because the result is reproducible from `{snapshots, seed}`, settle it
  **onchain via commit-reveal** — anyone re-runs the sim to verify; winner takes the
  stake; wages flow to NFT holders. XLayer testnet, valueless tokens first.
