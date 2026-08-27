# UI / UX research — how indie games do menus, settings & feel

Researched 2026-08-27 (see Sources). Goal: a premium-feeling, Steam-ready shell for a **pixel-art narrative
life-sim** (menus + cards + moments, not twitch action). Recommendations are ordered by leverage. Items marked
✅ are already done in Football Royalty; ☐ are actionable backlog.

## 1. First impression / main menu (make-or-break)
- ✅ **Continue is the top, biggest action.** Most-used button → most prominent (we lead with "▶ Continue — <save>").
- ✅ **Minimal, on-theme menu.** Clean pixel identity, tagline, no clutter. Simplicity reinforces the narrative tone.
- ☐ **Selected-by-default focus.** On menu/pause open, put keyboard/controller focus on Continue so Enter just works.
- ☐ **Tighten the tagline + emblem** into a single confident hero; avoid competing focal points.
- **Trap to avoid:** over-designing menus before the loop is fun. We're past that (loop is built) — polish is now fair game.

## 2. Pause / in-game menu
- ✅ **Settings reachable mid-game** (top-bar ⚙), not just from the main menu — research calls this out explicitly.
- ☐ **A real pause/quit flow.** "≡ Menu" currently quits straight to the menu. Consider a small pause overlay:
  Resume (default focus, top) · Settings · Quit to menu (with confirm if mid-match/mid-career-turn) — mirrors the
  expected pause-menu order (Resume always first and pre-selected).
- ☐ **Confirm before losing progress** (quit mid-match / mid-turn) — reuse the new `openConfirm()` dialog.

## 3. Settings menu specifics
- ✅ **Toggles for instant reversible things** (mute, reduce-motion); **sliders for fine-tune** (volume). Correct per
  toggle-vs-slider UX guidance.
- ✅ **Apply live + remember.** Volume/mute/motion apply immediately and persist. Slider auto-unmutes.
- ✅ **Accessibility present** (reduce-motion honouring OS default; switch roles, aria labels, keyboard toggle).
- ☐ **Tabs once it grows.** When settings pass ~6 rows, split into tabs/sections (Audio · Display · Accessibility ·
  Game) with consistent row height + alignment. Not needed yet (3 rows).
- ☐ **Separate SFX channel** (music vs SFX volume) — ships with the SFX reward set.
- ☐ **Display/accessibility candidates:** UI scale / text size (biggest a11y win for pixel text), high-contrast or
  colour-blind-safe palette check, toggle the CRT scanline/vignette (some find it straining — pairs with reduce-motion),
  subtitles/commentary-density (we already have a commentary toggle — surface it in Settings too).
- ☐ **Difficulty** (if we add it) lives here; expose economy/pacing knobs rather than hard-coding.

## 4. Feel / feedback (the "premium" layer)
- ☐ **Micro-feedback on interactive elements:** hover lift + subtle scale on buttons (we do this on cards/options —
  extend consistently to all primary buttons), fade/slide transitions between screens. Keep all of it behind
  `reduce-motion`.
- ☐ **A confirm/reward chime** on the big commitment beats (sign prospect, graduate, title) — the planned chiptune
  SFX. Research: "audio clicks on navigation" — but for us, restraint (no routine click sounds; reward moments only).
- ☐ **Progress indicators** — bars/milestones/badges motivate continued play. We have career age 10→25, honours,
  prestige; make sure each screen shows a clear "where am I / what's next" signal.
- ☐ **Consistent control styling** — unify button/toggle/select/slider heights + alignment across every screen for
  visual coherence (a full-pass item for the visual audit).

## 5. Accessibility (expands audience ~15–20%)
- ✅ Reduce-motion. ☐ UI/text scaling · ☐ colour-contrast pass · ☐ remappable keys (later) · ☐ CRT-effect off toggle.
- Principle: every effect that could strain (motion, scanlines, flashing) needs an off switch.

## Backlog extracted (feed into polish passes)
1. Default keyboard focus (Continue / Resume) on menu + pause open.
2. Proper pause overlay with Resume-first ordering + quit-confirm mid-progress.
3. Surface commentary-density + a CRT-effects toggle in Settings.
4. UI/text-scale accessibility option.
5. Consistent hover/press micro-feedback on all primary buttons (behind reduce-motion).
6. Tab the Settings dialog once it exceeds ~6 rows; add the SFX volume row with the SFX feature.
7. Colour-contrast / colour-blind-safe review of the palette.

## Sources
- [Create better game settings options (checklist) — Game Developer](https://www.gamedeveloper.com/design/create-better-game-settings-options-handy-checklist-)
- [UX/UI in Video Games — The Pause Menu (Medium)](https://medium.com/design-bootcamp/ux-ui-in-video-games-the-pause-menu-6f07e113e21e)
- [The Indie Game UX Playbook — iABDI](https://www.iabdi.com/designblog/2026/1/22/the-indie-game-ux-playbook-10-essential-questions-answered)
- [Game UI and UX Guide: Menus, HUDs, Feedback — Outlook Respawn](https://respawn.outlookindia.com/gaming/gaming-guides/ui-and-ux-in-games-building-menus-huds-and-feedback-systems)
- [Toggle UX: Tips on Getting it Right — Eleken](https://www.eleken.co/blog-posts/toggle-ux)
- [Game UX Design: A Complete Guide — UXPin](https://www.uxpin.com/studio/blog/game-ux/)
- [Creating an intuitive in-game menu — indieklem](https://indieklem.com/9-creating-an-intuitive-in-game-menu/)
