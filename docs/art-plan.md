# Art plan — generative-first, minimal external sources

**Status:** decided direction. Companion to `direction.md` (text-driven matches, keep the pixel aesthetic).

## Where we are
The game currently uses **zero external art** — all visuals are **procedurally generated in code**
(`pixelart.ts` draws players/ball/pitch/shadows at runtime) plus CSS for the UI. No image files, no licensing
baggage. Keep this strength. (The match sprites go away with the 2D engine removal; the generative *approach*
stays for portraits/kits/badges.)

## Sourcing strategy (priority order)
1. **Generative / procedural (default).** Draw portraits, kits, badges/crests, trophy icons *in code* — like
   FM's newgen faces and the existing `pixelart.ts`. Free, no licensing, infinitely scalable, deterministic,
   and a distinctive look that IS the game's identity. Claude can write these generators (code, not files).
2. **Free CC0 packs (as needed).** Generic UI icons: **Kenney.nl** (CC0, no attribution), itch.io free packs,
   OpenGameArt. Commercial-safe, zero cost.
3. **Commission/buy (marketing only).** Reserve real budget for **Steam capsule art + trailer + screenshots**
   — the assets that actually sell the game. A distinctive commissioned pixel capsule is worth it; in-game
   art stays generative.

## What needs art (Steam-polished)
- **In-game (generative):** player portraits, kits, club badges/crests, trophy/cup icons, UI icons, the
  **bloodline tree** visuals (the standout — make it beautiful; it's capsule-art material).
- **Marketing (commission/careful):** capsule/header art, screenshots, trailer.

## Housekeeping watch-items (real external-source risks)
- **Fonts — check commercial licensing.** The CSS uses display/body pixel fonts; ensure each is licensed for
  commercial use (Google Fonts OFL = fine; many web pixel fonts are NOT free commercially). Sort this early.
- **Audio (when added).** No music/SFX yet. When wanted: free-CC (Kenney audio, incompetech) or commission.

## Bottom line
The *game* needs **no external art** — generative-first (+ CC0 icons if handy). Spend art budget only on
**marketing**. Fix **font commercial licensing** as a quick housekeeping task.
