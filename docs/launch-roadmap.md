# Launch roadmap — the last mile to Steam

**Status:** the core game is built (deep gameplay, dynasty loop, deterministic engine, fully offline/
in-process, all tests green). What remains is polish, onboarding, and packaging — not new core systems.
Companion to `direction.md` (Steam target) and `offline-shell-design.md` (the shell/onboarding blueprint).

Legend: ☐ todo · ◐ in progress · ☑ done.

## 1. Audio
- ☑ Music system (12 contexts, rotation, crossfade, mute) + soundtrack finalized (18 licensed tracks wired)
- ☐ **SFX (scaled down)** — football foley (whistle/crowd/net) **CUT for launch** (couldn't source samples good enough; generated ones were poor, and cheap SFX reads worse than silence in a menu/card life-sim). Ship only a small chiptune **reward** set generated in-code — a soft confirm tone on the big commitment beats (sign prospect, graduate, title win); NO routine click sounds. Add a separate SFX volume + off toggle. A great CC0 whistle can drop into audio.ts later in one line if ever found.

## 2. Onboarding & first 15 minutes  ← highest leverage (make-or-break on Steam)
- ☑ Polish the new-game flow + the "first prospect" moment — new game now opens a **scouting board**: 3 seeded ten-year-olds, each shown a position hint + one glimpsed physical trait + a hedged scout note and **no potential stars** (deliberate mystery/anticipation); you pick on a hunch, and the true ceiling only reveals once he's signed. Sign → academy welcome → develop.
- ◐ New-game → guided first career (scout ✓ → develop → graduate → play a match → tease the dynasty) — contextual tutorial hints already lead gen-0; remaining: make sure the graduate→field→match beat is clearly signposted
- ☐ Light, skippable tutorial that teaches the development loop by *playing* it
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
