# Pixel Manager — 2D Football Manager (web)

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

## Engine design notes

- Tick-based (`TICK_SEC = 0.5` game-seconds/tick). One 90-minute match = 10800 ticks.
- Coordinate system is real metres (105 × 68 pitch); the renderer scales by 8 px/m.
- Team 0 attacks left→right, team 1 right→left (anchors mirrored).
- On-ball model: tackle / shoot / pass / dribble decisions weighted by player
  attributes (pace, pass, shoot, defend, keeping).
- Calibrated to ~2.6 goals & ~26 shots per match (see `shared/calibrate.ts`).

## Multiplayer plan (why the split exists)

The match engine lives in `@fm/shared` precisely so it can run on the **server**
as the source of truth. The server picks a seed and sends `{seed, teams}` to each
client; every client replays the identical deterministic sim locally just for
rendering. No per-frame netcode needed for spectating a simulated match.

## Roadmap

1. **[done]** Walking skeleton: watchable 2D match, seeded engine, HUD + ticker.
2. Manager layer: squad screen, formation/tactics selection feeding the engine.
3. Season loop: league table, fixtures, results simulation.
4. Transfer engine: player valuations, offers, budgets.
5. Server-authoritative matches + accounts + persistence.
6. (optional) web3: on-chain club/player ownership via viem; deploy target could
   be XLayer (OKX toolchain already set up on this machine).
