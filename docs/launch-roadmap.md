# Launch roadmap — the last mile to Steam

**Status:** the core game is built (deep gameplay, dynasty loop, deterministic engine, fully offline/
in-process, all tests green). What remains is polish, onboarding, and packaging — not new core systems.
Companion to `direction.md` (Steam target) and `offline-shell-design.md` (the shell/onboarding blueprint).

Legend: ☐ todo · ◐ in progress · ☑ done.

## 1. Audio
- ☑ Music system (12 contexts, rotation, crossfade, mute) + soundtrack finalized (18 licensed tracks wired)
- ☐ **SFX** — generate the chiptune UI/economy set in code; wire real CC0 football samples (whistle/crowd/net) once sourced; separate SFX volume + off toggle; sparing use (routine clicks silent)

## 2. Onboarding & first 15 minutes  ← highest leverage (make-or-break on Steam)
- ☐ New-game → guided first career (scout a kid → develop → graduate → play a match → tease the dynasty)
- ☐ Light, skippable tutorial that teaches the development loop by *playing* it
- ☐ Polish the new-game flow + the "first prospect" moment
- (see `offline-shell-design.md` §2)

## 3. Settings, saves & UX
- ☐ Settings screen (music/SFX volume, reduced-motion, difficulty?)
- ☐ Save-slot UX — multiple saves, autosave, delete/rename, "are you sure" flows (LocalStore exists; UX doesn't)
- ☐ Pause/quit-to-menu flows

## 4. UI/UX polish pass
- ☐ Full visual audit for a premium feel; wire remaining sprites; fix flagged `.cg-tut` reflow bug
- ☐ Component polish (buttons/tables/chips/toasts); mobile + desktop layout
- ☐ Apply the visual agent's remaining backlog (docs/ui-visual-audit.md)

## 5. Balance & playtest
- ☐ Full multi-generation dynasty playthrough for *feel*; tune difficulty/economy/pacing
- ☐ Apply deferred QA hardening (M1/M2 NaN clamps, etc. — docs/qa-bug-report.md) where still open
- ☐ Edge-case + long-run stability pass

## 6. Steam desktop wrapper (packaging)
- ☐ Wrap the static client in Tauri/Electron
- ☐ Swap `SaveBackend` (client/src/save.ts) IndexedDB → file backend + Steam Cloud
- ☐ Steamworks: achievements, cloud, overlay
- ☐ Build/pack pipeline, app icon, window chrome

## 7. Steam store & launch (mostly non-code / your side)
- ☐ Store page, capsule art, screenshots, trailer
- ☐ Pricing, tags, wishlist campaign
- ☐ Achievements design; age rating (IARC); business/payments setup
- ☐ Ship the CREDITS screen (music attribution is a licensing requirement — see /CREDITS.md)

## 8. Ongoing / optional
- ☐ More content depth (cards, events, competitions) · ☐ localization · ☐ marketing

## Suggested sequence
Audio SFX → **Onboarding** → Settings/Saves + UI polish → Balance/playtest → Steam wrapper + store.
The first stretch makes it a complete, polished single-player game; the last makes it a shippable Steam product.
