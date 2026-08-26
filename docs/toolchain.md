# Toolchain — what we build with

**No game engine (Unity/Godot/Unreal) needed.** The game is our own **TypeScript** code — a complete, valid
way to build a 2D/text management sim. The "engine" is `@fm/shared` (our deterministic code).

## ✅ Have already (the build toolchain — everything needed to keep building)
- **TypeScript** — the language the whole game is written in.
- **Node.js + npm** — runs the code, manages packages.
- **Vite** — client dev server + bundler (runs it in the browser).
- **The browser** — how we run/test locally today.
- **Git + GitHub** — version control (repo is up).
- **Claude Code** — does the coding.
- *(Optional, recommended)* **VS Code** (free) — to see/navigate/run the code while Claude edits.

**For building the game itself, that's the whole list — no new installs required.**

## 🔧 Add later (Steam-launch only — Phase 3)
- **Electron** — npm package that wraps the web app into a desktop app (makes it a Steam-distributable PC game).
- **steamworks.js** — Steam achievements / cloud saves / overlay.
- **GitHub Actions** — free CI to build Windows/Mac/Linux binaries in the cloud (no Windows PC needed).
- **Free Windows VM (UTM)** or a cheap mini-PC — to *test* the Windows build near launch.
- **Steam partner account** — web-based, one-time **$100** Steam Direct fee.
- *(Optional)* **Aseprite** (~$20) / free **Piskel** — only if hand-drawing pixel art. We go generative
  (art in code), so probably unnecessary.

## ❌ Do NOT need (save money/time)
- A game engine (we have our own), a cloud server/DB for the offline game (runs locally; Netlify optional),
  expensive art/audio software (generative + CC0), or any paid tooling to *make* the game (stack is free/OSS).

## Workflow (start → finish)
1. Write TypeScript (you direct · Claude codes · overnight agents add content).
2. Run locally in the browser to test (already doing this).
3. Commit to GitHub (already doing this).
4. When ready: Electron wraps it → GitHub Actions builds the Steam binaries → upload via Steamworks → launch.

**Status: ~90% of the tooling is already set up.** The only genuinely new tools are the Steam-packaging
bits, and they don't arrive until the game is good and polished.
