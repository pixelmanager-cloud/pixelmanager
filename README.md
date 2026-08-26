# Football Royalty — 2D Football Manager (web)

A browser-based 2D pixel-art football manager game with a deterministic match
engine, designed from day one for future online multiplayer and optional web3
integration.

## Stack

- **Client:** Phaser 3 + Vite + TypeScript. Pixel art is generated at runtime
  (no asset files yet) in `client/src/pixelart.ts`.
- **Shared engine:** framework-free TypeScript in `shared/src/` — the match
  simulation. Deterministic and seeded, so the same seed produces the identical
  match on client and server.
- **Server:** stub in `server/src/index.ts`. Will become the authoritative host
  (owns seeds, squads, transfers, results) so players can't cheat.

## Layout

```
football-manager/
  shared/   @fm/shared  — engine, RNG, team generation, types  (the game rules)
  client/   @fm/client  — Phaser renderer + HUD                 (what players see)
  server/   @fm/server  — authoritative host (stub)             (multiplayer later)
```

## Run

```bash
npm install
npm run dev            # client at http://localhost:5173
```

## Strategy engine

The core of the game. Everything is deterministic + seeded and lives in `@fm/shared`.

**Player stats** — lean 8-stat model, 1-20 scale (`types.ts`): pace, strength,
passing, shooting, tackling, positioning, workrate, keeping. Each maps to a
concrete in-match mechanic.

**Team tactics** (`tactics.ts`) — a formation plus five sliders (-2..+2):
mentality, defensive line, pressing, tempo, width. Six presets ship (Gegenpress,
Park the Bus, Tiki-Taka, Route One, Counter, Balanced). `deriveMods()` turns
tactics into the numeric modifiers the engine reads.

**How stats × tactics × stamina interact** (`engine.ts`):
- Every player carries a `fitness` (1.0 → lower) that drains with effort; high
  press / direct / attacking tactics drain faster, and low fitness scales down a
  player's effective stats. So a high press dominates early and can fade late.
- Pressing commits the nearest N outfielders (N grows with press intensity) to
  close down the carrier; tackles resolve from tackling+workrate+fitness vs the
  carrier's strength+pace.
- A high defensive line pushes defenders up (compact, but exploitable): a direct
  through-ball to a fast forward in behind becomes a clear-cut chance.
- Passing weighs directness (tempo): patient favours short safe passes and
  rewards passing/vision; direct favours forward balls and transitions.

**Validated** by `shared/strategy_test.ts` (60-match batches): ~2.2 goals/match
with realistic scorelines; stronger squads win ~77%; high press ≈77% possession
but ends at ~0.54 fitness vs ~0.69; a high line concedes ~2× a deep line vs a
direct attack. Run with `npx tsx strategy_test.ts` from `shared/`.

- Tick-based (`TICK_SEC = 0.5` game-seconds/tick). One 90-minute match = 10800 ticks.
- Coordinate system is real metres (105 × 68 pitch); the renderer scales by 8 px/m.
- Team 0 attacks left→right, team 1 right→left (anchors mirrored).

## Multiplayer plan (why the split exists)

The match engine lives in `@fm/shared` precisely so it can run on the **server**
as the source of truth. The server picks a seed and sends `{seed, teams}` to each
client; every client replays the identical deterministic sim locally just for
rendering. No per-frame netcode needed for spectating a simulated match.

## Roadmap

1. **[done]** Walking skeleton: watchable 2D match, seeded engine, HUD + ticker.
2. **[done]** Strategy engine: 8-stat players, team tactics (formation + 5 sliders +
   presets) with stamina, wired to a live tactics panel in the client.
3. **[done]** Squad screen: colour-coded stat table + tactical insights.
4. **[done]** Round loop (Phase A, off-chain): ~20-player rosters with a picked
   starting XI per fixture, an hourly gauntlet of 5 CPU opponents, tactics that
   lock at kickoff, a half-time pause with one round of changes + manual resume,
   and locked results with standings. State persists in localStorage.
5. Season/league loop or per-player roles.
6. Persistence + accounts (server).
7. Onchain (Phase C): player NFTs (stats as metadata), commit-reveal match
   settlement (the deterministic engine makes results re-verifiable by anyone),
   ERC-20 token + wage/prize escrow — on XLayer testnet first.
4. Transfer engine: player valuations, offers, budgets.
5. Server-authoritative matches + accounts + persistence.
6. (optional) web3: on-chain club/player ownership via viem; deploy target could
   be XLayer (OKX toolchain already set up on this machine).
