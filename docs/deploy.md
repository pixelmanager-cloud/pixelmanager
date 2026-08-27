# Deploy — offline single-player (no backend)

**Status:** current (2026-08-27). Supersedes the old Railway+Postgres server-deploy guide (removed when the
multiplayer server was deleted — see `direction.md` and the offline migration).

Football Royalty is a **fully offline, single-player** app: one static Vite client (`client/`) with all game
logic in `@fm/shared`, saving to the browser's **IndexedDB** (a local save file in the future desktop
wrapper). **There is no server and no database** — nothing to host but the static site.

- ❌ **Railway** — no longer used. It hosted the old Fastify + Postgres backend, which has been deleted. The
  `Dockerfile` and the `server/` workspace are gone. Decommission the Railway project.
- ✅ **Netlify** — hosts the static client. `netlify.toml` builds `client/dist` and serves `index.html` for
  all paths (SPA). **No `VITE_API_URL` needed** anymore (there's no API) — remove it from the Netlify
  dashboard env if it's still set. Any static host works equally well (Vercel, Cloudflare Pages, GitHub Pages).

## Web deploy (a playable browser demo)
1. Point Netlify at the repo (root). Build command `npm run build --workspace=client`, publish `client/dist`
   — already set in `netlify.toml`.
2. That's it. Saves live in the visitor's browser (IndexedDB); nothing server-side.

## The real target — Steam (desktop)
The client is packaged into a desktop app (Electron/Tauri wrapping the same static build), with local save
**files** synced by **Steam Cloud** (the `SaveBackend` abstraction in `client/src/save.ts` swaps IndexedDB
for a file backend). Steamworks provides achievements/cloud/overlay. See `direction.md` (Steam-readiness).

## Local dev
`npm run dev` (Vite client only — no server to start anymore). `npm run verify` runs the full gate
(client build + engine tests + fuzz + career_sim + the offline save/facade harnesses).
