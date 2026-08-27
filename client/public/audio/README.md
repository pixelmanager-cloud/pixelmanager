# Music/audio drop folder

Put the licensed music tracks here, named by game context (Vite serves `public/` at the site root, so
`client/public/audio/menu.ogg` loads as `/audio/menu.ogg`). The audio manager (`client/src/audio.ts`) plays
them; a missing file is a silent no-op, so add them one at a time.

Expected files (all `.ogg`, loop-friendly):
- `menu.ogg` — main menu theme (bright, the "Football Royalty" identity)
- `career.ogg` — academy/development ambient (cozy, unobtrusive)
- `match.ogg` — matchday (tension/energy)
- `triumph.ogg` — title win / Trophy Room (celebratory)
- `emotional.ogg` — retirement/succession/legacy (warm, wistful)

Pick these from the licensed pack (cherry-pick tracks that fit — don't dump the whole 8 GB library).
Licensing + attribution: see `/CREDITS.md` and `docs/licenses/`.
