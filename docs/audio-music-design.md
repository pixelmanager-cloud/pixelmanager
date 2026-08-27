# Audio & music — design + sourcing guide

**Status:** decided (2026-08-27). Style = **chiptune with warmth** (retro pixel identity + warmer pads for the
emotional dynasty beats). Source = **licensed royalty-free pack** (clean commercial rights for a paid Steam
release). Presentational only — no impact on the deterministic engine.

## The audio system (source-agnostic) — `client/src/audio.ts`
One small `AudioManager` singleton so any source drops in behind it:
- **Context loops**, crossfaded: `menu`, `career` (academy/development ambient), `match` (tension/energy),
  `triumph` (title/trophy room), `emotional` (retirement/succession). `play(context)` crossfades to that loop.
- **Settings persisted** to `localStorage` (`fm_audio`): `masterVolume` (0–1) + `muted`. Respected on load.
  Default to a modest volume; always give the player a mute toggle (many play muted).
- **Autoplay-safe:** browsers block audio until a user gesture — music starts on the first interaction
  (New Game / Continue click). The manager exposes `unlock()` for that first gesture.
- **Graceful when a track is missing:** a context with no file is a silent no-op, so the game runs fine
  before the licensed files are added (and on the web demo if we ship it music-less).
- **SFX (later, same system):** short one-shots for UI (card play, button, goal, whistle) — separate low
  volume bus; music and SFX mute independently.

## Bundling / files (offline + Steam)
- Drop tracks in `client/public/audio/` named by context: `menu.ogg`, `career.ogg`, `match.ogg`,
  `triumph.ogg`, `emotional.ogg` (a `manifest` in `audio.ts` maps context → url). `.ogg` (small, looping) with
  an `.mp3` fallback for Safari if needed. Vite serves `public/` at the root; the Steam desktop wrapper
  bundles the same files. Keep the web-demo total lean (a few looping tracks, not an album).
- **Loop-friendly** tracks matter (seamless loop points) — prefer packs that provide loopable versions.

## Music contexts the game needs (buy/select against this list)
1. **Menu theme** — the "Football Royalty" identity; the one track players hear first.
2. **Career / academy** — calm, hopeful, unobtrusive (you sit in it for hours developing a kid).
3. **Matchday** — tension/energy, drives the fixture moments.
4. **Triumph** — title win / Trophy Room; celebratory.
5. **Emotional / legacy** — retirement, succession, the bloodline beats; warmer, wistful. (This is where the
   "warmth" half of the style earns its place.)
A menu + career + match + one triumph/emotional pair is a solid first set; expand later.

## ✅ Source secured (2026-08-27): Bit By Bit Sound
Purchased the **Bit By Bit Sound** library (Ultimate Retro RPG Music Pack — 400+ human-composed tracks,
16-bit/JRPG/chiptune with Emotional Story Themes + Positive/Town moods covering all five contexts). Royalty-
free, commercial, perpetual **Synchronisation + Master Use** license — EULA + full compliance list in
`docs/licenses/`. Cherry-pick a handful of fitting tracks into `client/public/audio/` (OGG); don't bundle the
whole library. **Compliance (see `docs/licenses/README.md` + `/CREDITS.md`):** credit the composer (required,
not an endorsement) · never Content-ID / PRO-register the tracks · no standalone soundtrack (OST) product
without a separate agreement · embed in the game only, don't offer the raw files as an audio pack. Football-
specific SFX (whistle/crowd/kick/net) are NOT in this RPG pack — source those separately later (free CC0 via
freesound.org, or the companion Bit By Bit SFX pack for UI sounds).

## Sourcing guide (reference — how the pack was chosen)
Look for **chiptune / 8–16-bit game music with warmth** (some packs blend chip leads with real pads/piano),
sold with a **commercial game license**. Reputable places to look (vet each pack's own license):
- **itch.io** game-music assets (many chiptune/JRPG-style packs with clear game licenses).
- **Envato / AudioJungle**, **Pond5** (royalty-free, "chiptune"/"retro game" category, Music Standard License).
- **GameDev Market**, **Humble** game-audio bundles.
- **Free/attribution options** if budget-first: **incompetech (Kevin MacLeod)** CC-BY, **OpenGameArt** (CC0/
  CC-BY chiptune) — free but require attribution and can sound generic; fine to start, upgrade later.
- (Later, for a bespoke identity: **commission a chiptune composer** — best uniqueness, higher cost/time.)

### License checklist — confirm BEFORE buying (rights vary per pack, always read the actual license)
- ✅ **Commercial use** allowed (not "personal/non-commercial only").
- ✅ **Royalty-free** — one-time fee, no per-copy/per-sale royalties.
- ✅ **Sync/embed in software/game** permitted (embedding the audio *in* the shipped game, not just streaming).
- ✅ Survives a **paid** release and **Steam** distribution; no cap on units sold.
- ✅ **Attribution** requirement is acceptable to you (some require a credits-screen line — easy; some are
  attribution-free).
- ❌ Avoid: "no redistribution", "no use in games/apps", "single project only" (unless it covers this one),
  YouTube-only / content-ID music, and anything AI-generated with unclear ownership (legal risk for a paid title).
- Keep the **license file/receipt** in the repo (e.g. `docs/licenses/`) as proof of rights.

## Why not AI-generated music
Flagged for the record: fast/cheap, but ownership/licensing is legally murky for **commercial** sale, output
trends generic, and platform/legal scrutiny is evolving — not advisable as the primary source for a paid Steam
game. Acceptable only as throwaway prototype placeholder, never shipped.

## Build order
1. ✅ `client/src/audio.ts` — the source-agnostic AudioManager (this commit).
2. ⏳ Wire it in (after the in-flight content agents merge, to avoid `main.ts`/`index.html` conflicts):
   start `menu` on the first click; switch context on screen changes (career/match/hub/trophy/retirement);
   add a **mute/volume control** in a settings/menu corner.
3. ⏳ Drop the licensed tracks into `client/public/audio/` (your files) → it just plays.
4. ⏳ (Later) SFX one-shots on the same system.
