# Deploying the async-PvP game

Two pieces go live: the **server** (Fastify + Postgres) on a host, and the
**client** (already on Netlify) pointed at the server's URL. Recommended host is
**Railway** because it provides both the server and a Postgres database in one
project. (Fly.io + Neon also works — same Dockerfile.)

The server code is on the `async-pvp-client` branch. Deploy from that branch,
verify, then merge to `main` to flip the live Netlify client to PvP.

---

## 1. Server + database on Railway

1. Create a **Railway** account ([railway.app](https://railway.app)) and a **New Project**.
2. **Deploy from GitHub repo** → pick `pixelmanager-cloud/pixelmanager`, branch
   `async-pvp-client`. Railway builds the root **Dockerfile** automatically.
3. In the project, **+ New → Database → Postgres**. Railway provisions it and
   exposes a `DATABASE_URL`.
4. On the **server service → Variables**, add a reference to the database URL:
   set `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (Railway's variable-reference
   syntax; pick the Postgres service). The server auto-creates its tables on boot.
5. **Networking → Generate Domain** on the server service → you get a public URL
   like `https://pixelmanager-production.up.railway.app`.
6. Check it: open `<that URL>/health` — you should see `{"ok":true,...}`.

**Cost:** Railway's trial/hobby tier covers a small app + Postgres; watch usage.

## 2. Point the client at the server (Netlify)

1. In **Netlify → Site settings → Environment variables**, add
   `VITE_API_URL` = your Railway server URL (no trailing slash).
2. This is read at **build time**, so a rebuild is needed — the merge in step 3
   triggers it.

## 3. Flip the live site to PvP

Merge `async-pvp-client` → `main`:
- Open a PR from `async-pvp-client` to `main` on GitHub, let CI pass, and merge; **or**
- locally: `git checkout main && git merge async-pvp-client && git push`.

Netlify rebuilds `main` with `VITE_API_URL` set, and the live site becomes the
async-PvP game.

## 4. Smoke-test in production

- Open the live site, register a handle, set your team.
- Open a second browser / incognito, register another handle.
- From the first, play the second (who is offline) — you should see the match,
  a result, and both ratings + the leaderboard update.

---

## Notes

- **CORS** is open (`origin: true`) so the Netlify origin can call the server. Lock
  this down to your Netlify domain later.
- **Auth** is still the prototype handle+token (no recovery). Swap to wallet
  sign-in with the web3 phase.
- **Storage**: local dev uses Node's `node:sqlite`; production uses Postgres via
  `DATABASE_URL` — same `Store` interface, chosen in `server/src/db.ts`.
- **Fly.io alternative**: `fly launch` (uses the Dockerfile) + a Neon Postgres
  `DATABASE_URL` secret (`fly secrets set DATABASE_URL=...`). Everything else is
  identical.
