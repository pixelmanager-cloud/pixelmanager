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
- ◐ Settings screen — DONE: music volume + mute, reduce-motion (honours OS default), CRT screen-effect toggle, UI scale (80–130% live zoom). TODO: SFX volume (with the SFX set), difficulty (design decision).
- ◐ Save-slot UX — multiple saves + switch + delete-with-confirmation DONE. TODO: rename, autosave indicator.
- ☑ Pause/quit-to-menu flows — pause overlay (Resume/Settings/Quit), quit-mid-match confirms first.
- ☑ Accessibility baseline — reduce-motion, CRT off, UI scale, switch a11y roles + keyboard toggles, default focus on primary action. TODO (see docs/feature-gap-analysis.md): text-contrast pass, full controller nav for Steam Deck.

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
- ◐ More content depth — big overnight push landed (see below). Player-career content now judged **saturated**;
  manager content near-saturated (board/press/staff/rivalry systems built). · ☐ localization (not needed pre-launch,
  see the chat decision) · ☐ marketing

## Overnight autonomous push (2026-08-27 → 28) — landed on main, all green (verify + `npm run qa` 18 harnesses)
- **Player career content** (batches 1–4): more big/huge moments, LIFE_KINDS 12→18 (incl. new_money/move_abroad/
  serious-injury etc.), recurring rival/mentor callback payoff across setup→resolution→epilogue, early-chapter
  tag/GK focus, SeasonEvent flavours + a new `international-honour` event, tone-register sweeps. **Lane saturated** —
  next step is a read-through playtest, not more breadth (docs/overnight/player-content-audit.md).
- **Manager career content** (batches 1–3): Gaffer's Diary rebuilt into a 22-category storyline picker; new
  `board.ts` (mood/verdict + deriveExpectation), `press.ts` (conference lines + staff cross-pollination),
  `staff.ts` (seeded backroom cast); continental rivalry + tournament drama; misgendered-staff bug fixed.
- **QA** (batches 1–5): 18 fuzz harnesses + `npm run qa` auto-globbing runner (so harnesses can't silently
  bit-rot); zero engine bugs across 15k+ dynasty generations; zero calibration drift; a cross-lane text linter.
- **Shell/UX** (research-driven): onboarding scout board, Settings (volume/mute/reduce-motion/CRT/UI-scale),
  pause menu, delete-confirm, default focus. Research docs: feature-gap-analysis, competitive-deep-dive, ui-ux.
- **Manager narrative → client wiring (in progress):** ☑ backroom staff on the club screen · ☑ board season
  verdict on the season screen · ☐ press-conference line post-match · ☐ intl rivalry/drama blurbs in cup screens.
- **Design questions flagged for you:** (1) should board mood ever drive real *sacking* risk? (2) static art
  assets — the #1 feature-gap finding (all "pixel art" is currently procedural SVG). (3) staff: flavour-only or hireable?

## Suggested sequence
Audio SFX → **Onboarding** → Settings/Saves + UI polish → Balance/playtest → Steam wrapper + store.
The first stretch makes it a complete, polished single-player game; the last makes it a shippable Steam product.
