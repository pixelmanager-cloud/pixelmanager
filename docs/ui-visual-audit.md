# Football Royalty — UI / Visual Audit & Fix List

## 2026-08-27 overnight visual-agent pass, round 2 — sprite expansion + base component polish

Continuing the same session/lane (client/index.html theme + client/src/sprites.ts only). Verified
every sprite at 4–8× on my own scoped vite (see round-1 note on the shared `:5173` server pointing
at `main` — still true, used `npx vite --config client/vite.config.ts --port 5199 client` instead).
`npm run verify` green after every commit.

### Sprite set: 17 → 27 icons
Added, palette-consistent (extended `PAL` with `u` royal-purple `#8b5cff`, `e` mf-green `#39ff9e`,
`f` fw-orange `#ff7a3c` — the latter two picked to match `--mf`/`--fw` theme tokens *exactly*, not
just approximately, since the whole point is these read as the same role-colour language already
used in the squad table/lineup editor):
- **Royalty family** (the game is called Football Royalty and had zero crown/regal imagery):
  `crown` (round 1), `laurel` (wreath), `banner` (hanging purple/gold dynasty pennant), `seal`
  (red/gold wax seal).
- **Position jerseys**: `role-gk`/`role-df`/`role-mf`/`role-fw` — tinted to `--gk`/`--df`/`--mf`/
  `--fw` exactly, same shape as the existing `kit` sprite recoloured per role.
- **Squad/career props**: `armband` (striped captain's cuff), `contract` (ribboned scroll),
  `briefcase` (agent icon), `star` (5-point rating star), `calendar` (season/matchday marker with a
  highlighted "today" cell).
- Fixed round-1 `training` (dumbbell) sprite: it was letterboxed with 3 empty rows top+bottom,
  reading as a tiny "H" at facility-card size — resized to fill the 16×16 frame like the other icons.

**None of these are wired into `main.ts` call sites yet** — proposals below, with exact locations,
for reconcile to apply quickly:

| sprite | proposed call site | current state |
|---|---|---|
| `coin` | `main.ts:643` `$('me-coins').textContent = \`💰 ${...}\`` (topbar balance); `main.ts:1338` `$('club-coins')`; `main.ts:1859` `$('scout-coins')` | plain 💰 emoji text, 3 call sites |
| `star` | `main.ts:666,687` `.hp-stars` (hub player row); `main.ts:1402` `.pr-stars` (academy prospect row) | plain `★` text character |
| `medal` | `main.ts:1227` `<span class="aw-icon">${m.icon}</span>` (honours feed awards) | dynamic per-award emoji via `m.icon` |
| `card` | ticker commentary `.cm-card.yellow`/`.cm-card.red` (`index.html` ~1131) | pure CSS color on text, no icon glyph at all |
| `crown` | `main.ts:701` `$('hub-legacy-sub')` legend count (`⭐ ${l.legends.length} legend(s)`); or as an alternate/companion to the existing `sprite('trophy')` at `main.ts:639` for `#hub-legacy` specifically since that screen is "Dynasty & Trophy Room" — crown for the dynasty half, trophy for the cabinet half | trophy sprite already used for the whole hub-legacy row; legend count is a bare ⭐ emoji |
| `laurel` | wherever a "legend" milestone/hall-of-fame moment renders (didn't find an exact single call site — search for "legend" in `main.ts` render paths) | none |
| `banner` | succession/bloodline chapter-break moments (`cg-graduation`/retirement flow) | none, currently plain text headers |
| `seal` | contract-signing moments — pairs naturally with the new `contract` sprite at the same call sites (`.pc-extend` flow, contract renewal toasts) | none |
| `briefcase` | the agent-selection screen (Academy → "Sign an agent" — the "Ambitious Agent / Loyal Agent / Super-Agent…" list) | plain 🤝 emoji per row currently |
| `contract` | same agent/contract screens as `seal` above, and the `pc-contract`/`pc-extend` block in the player card overlay | none |
| `armband` | wherever captaincy is picked/shown (didn't locate an exact call site — search `captain` in `main.ts`) | none found |
| `role-gk`/`df`/`mf`/`fw` | `.slot.role-GK` etc. in the lineup editor (`index.html` ~1078), `.mission .m-prospect .m-role` (~1039) — these already colour-code by role via CSS custom classes; the sprites could sit *next to* the existing text/colour coding, not replace it | role already colour-coded via CSS classes, no icon |
| `flag`, `badge`, `whistle` | held in reserve — no call site identified this pass (competition markers / club-badge placeholders / referee flourish) | — |

### Base/shared component polish (C-series), global-only — no feature CSS touched
- **`style(theme): generic input, link, and select hover/disabled base styles`** — real gap found:
  `#sell-price` (the market "list for sale" input, `index.html:1347`) had **zero** styling rule at
  all and was rendering as an unstyled native number input in an otherwise fully-themed screen.
  Added a baseline `input` rule (any input lacking its own dedicated id/class keeps falling back to
  this instead of the browser default), plus `select:hover`/`:disabled`, plus a global `a` rule
  (plain links had no rule and would've rendered browser-default blue/underlined).
- **`style(theme): generic table zebra striping + row hover`** — every table already has its own
  class (`table.squad`, `table.league`, `.lt-table`…) so this only fills gaps they don't already set:
  subtle even-row zebra tint + a hover highlight. Verified with an injected `.lt-table` clone
  (champ/mine/promo/releg row classes all still won on specificity — no regression) and confirmed
  hover fires. Effect is intentionally subtle (`rgba(255,255,255,0.025)`) so it doesn't fight
  existing row-status colouring.
- **`style(theme): themed scrollbars app-wide`** — `::-webkit-scrollbar` + Firefox
  `scrollbar-color`/`scrollbar-width`, themed to `--line`/`--panel`/`--accent`. Affects every
  scrolling container (`#ticker`, `#results-feed`, `#leaders-feed`, the cup bracket, any tall panel
  on a short viewport) without touching any of their component CSS. Could not get a visual capture
  in this sandboxed browser (macOS/Chromium here uses overlay auto-hide scrollbars regardless of
  CSS) — the rule itself is standard and correct; worth a real visual check on Windows/Linux or a
  browser with classic scrollbars before fully trusting it.
- **`style(theme): add reusable .chip and .badge base components`** — new opt-in utility classes
  (`.chip`/`.chip.good/.warn/.bad/.accent`, `.badge`) for any *future* screen that needs a pill/badge
  instead of hand-rolling another one-off class. Nothing currently uses these class names, so this
  is purely additive — zero visual change to existing screens, just a component now available.

### Two bugs found and fixed (both genuine regressions, not style opinions)
- `FOOTBALL ROYALTY` title clipped past the panel edge below 480px width (round 1).
- Trophy Room's back button (`id="trophies-back"`) didn't match the CSS selector that right-aligns
  it (`#academy-back`), so it sat left-aligned next to the title instead of at the far edge like
  every other screen's back button (round 1).

### Still open from round 1 (unchanged, still valid)
- `.cg-tut` flex/text-reflow bug — proposed fix in round-1 section below, not applied (feature CSS).
- M1–M6 match-engine visual items — likely obsolete, confirm before investing (see below).

## 2026-08-27 overnight visual-agent pass — status update

**P0 readability items R1–R4 below are already DONE** (fixed before this session, verified in the
current shipped code at `b57aa88`): buttons/labels/tables now use VT323 not Press Start 2P; base
font is 22px with roomier controls; `--muted:#c8c8e8` clears ~8:1 on `--panel`; the CRT overlay is
already faint (scanline alpha 0.045, vignette 0.15). Left the R1–R4 write-ups below for context/history
— don't re-do them.

**Shipped this pass** (client/index.html theme + client/src/sprites.ts — my lane only):
- `style(theme): global keyboard focus-visible ring` — every button/select/input/link/`[tabindex]`
  now gets a visible cyan `:focus-visible` outline. There was previously *no* global focus ring
  (a couple of inputs even set `outline:none` with no replacement), so keyboard-only nav had no way
  to see where it was. Before: invisible. After: 3px cyan ring, offset 2px, keyboard-only (doesn't
  show on mouse clicks).
- `style(theme): app-wide prefers-reduced-motion support` — added a global
  `@media (prefers-reduced-motion: reduce)` that collapses all animation/transition durations to
  ~0 (via `!important`, deliberately, so it wins over every current and future per-component
  animation without needing to chase each one down). Before: only `.pc-card` respected the OS
  reduced-motion setting; the CRT scanlines aside, dozens of other keyframes (toasts, trophy glows,
  pulses, shimmers, the pixel loader) did not. After: the whole app respects it.
- `style(theme): fix FOOTBALL ROYALTY title overflow on narrow/mobile widths` — **real bug**,
  found by screenshotting at 375px: `#mm-title` was a fixed `40px` Press Start 2P and clipped past
  the right edge of the panel on any phone-width screen ("FOOTBALL" ran off-panel, uncontained).
  Fixed with a `max-width:480px` query dropping it to `7.2vw`. Verify with a mobile-width screenshot
  of the main menu if you touch this again.
- `art(sprites): add medal, card, kit, flag, badge, crown, coin, whistle` (two commits) — expanded
  the pixel-icon set in `sprites.ts` from 9 to 17 icons, all in the existing 16×16 grid + shared
  `PAL` palette so they're visually consistent with the existing set. Rendered and eyeballed all of
  them at 4–8× scale before committing (one first draft — `medal` — read as "mouse ears" on a coin
  and was redrawn as a proper ribbon+disc). **None of these are wired into `main.ts` yet** — that's
  intentionally left to whoever next touches the relevant screen, to avoid a main.ts collision:
  - `crown` — thematic fit for the "Royalty"/bloodline moments (dynasty screen, retirement/legend
    beats, the mode-select ROYALTY branding) — the game's namesake but currently has zero crown
    imagery anywhere in the UI.
  - `medal` — POTM / end-of-season individual awards (`#honours-feed .aw-icon` currently just uses
    an emoji at 26px; swapping in `sprite('medal')` would match the rest of the pixel-icon language).
  - `card` — bookings in match commentary/ticker (`.cm-card.yellow`/`.cm-card.red` currently pure
    color text, no icon).
  - `coin` — the earned-coin economy display (topbar balance, upgrade-cost pills) uses a 💰 emoji
    everywhere; `sprite('coin')` would be more in-keeping once someone's ready to touch those call
    sites.
  - `kit` — kit/identity customizer tab header (screenshotted this pass — currently a plain 🎽 emoji
    next to "KIT").
  - `flag`, `badge`, `whistle` — held in reserve for competition markers, club-badge placeholders,
    and a referee/match-official flourish respectively; no current call site identified yet.

### Bug found, NOT fixed (out of lane — lives in the feature CSS block, not the global theme)
- **`.cg-tut` (career-game tutorial banner, `client/index.html` ~line 844) breaks text reflow.**
  Screenshotted mid-career (Academy → Now tab, first tutorial banner): the sentence "This is a
  moment in his young career. Read what it needs (the tags), then play the card that fits best —
  good fits develop him faster." renders as disjointed fragments on their own lines instead of
  wrapping naturally. Root cause: `.cg-tut { display:flex; ... }` on a container whose direct
  children are a mix of raw text nodes and inline `<b>` tags plus a trailing `<button>` — flex turns
  each text run and each `<b>` into its own flex item (no `flex-wrap` set), so the sentence can't
  reflow as normal text; each fragment breaks independently instead. **Proposed fix (CSS-only, no
  main.ts change needed):** drop `display:flex` from `.cg-tut`, let it flow as a normal block
  (text + inline `<b>`s reflow correctly), and absolutely-position `.cg-tut-x` (the "Got it ✕"
  button) top-right with `padding-right` on the container to reserve space for it instead of using
  flex to lay it out. This is in the feature CSS block at the bottom of the file (career-game
  screens), so left for whoever owns that block / post-reconcile rather than touched directly here.

### Presentation-direction update — M1–M6 below are likely OBSOLETE
`docs/direction.md` (dated today) DECIDED to **drop the live 2D match engine + `pixelart.ts` sprite
sim entirely** in favor of text-driven match commentary (already built) — "text-driven matches +
gorgeous management UI + a stunning dynasty tree." I could not find `pixelart.ts` or any Phaser/2D
match-sprite code in the current tree at all (only `sprites.ts`, the static pixel-icon system, which
is unaffected and is what this pass worked on) — so this removal may already be done, or the M1–M6
items below (kickoff cluster, shot volume, home/away bias, sprite polish, playback speed, movement
interpolation) may simply no longer have a code path to fix. **Whoever picks up P1 match-engine
items should first confirm whether a 2D match sprite view still exists before investing in M1–M6.**
If it's gone, those items should be struck from this list; if some 2D fallback still exists, they
still apply.

A walkthrough of every screen (login, hub, lineup editor, match view, league/cup/honours,
club facilities, scouting, market) plus the match engine, on desktop + mobile. Goal:
**make the game easier to read and look at while keeping the retro-arcade identity**
(Press Start 2P + VT323 + CRT). Ordered by priority. Each item is scoped to be a small,
self-contained PR. Tags: `[readability]` `[layout]` `[color]` `[match]` `[polish]`.

The current theme tokens (client/index.html `:root`):
`--bg#0a0a16 --panel#161637 --panel-2#1f1f4d --line#3b3b82 --text#eaeaff --purple#8b5cff`,
fonts `--display:'Press Start 2P'` and `--body:'VT323'`, body `font-size:19px`.

---

## P0 — Readability (the priority)

### R1. Stop using Press Start 2P for small text `[readability]`
Press Start 2P is a chunky pixel face that's illegible below ~14px, yet it's currently the
font for **every button (10px)**, section headers (`h3` 13px), the login tagline (9px),
`#record`/`#timer` (10px), facility/scout labels, table headers, badges, etc.
**Fix:** reserve Press Start 2P for large display headings only (the `FOOTBALL ROYALTY` title,
maybe screen `<h3>` at ≥16px). Switch buttons, labels, table headers, blurbs, pills, and
badges to **VT323** (very legible, still retro) at a comfortable size. This single change is
the biggest readability win. Keep the arcade feel via color + the CRT overlay, not tiny pixel type.

### R2. Raise base + control font sizes `[readability]`
Body is VT323 19px (ok), but controls and secondary text are small. Bump: buttons to ~15–16px
(VT323), `select`/inputs already ~18–20px (fine), pills/badges from 8–9px to ~11–12px,
blurb/`.muted` copy to ~15px. Add `line-height:1.4–1.6` anywhere Press Start 2P remains, since
pixel glyphs need breathing room.

### R3. Lift low-contrast muted text `[color]` `[readability]`
Muted greys (`#778`, `#8aa`, `#99a`, `#889`) on the near-black navy sit around ~3:1 contrast —
below the ~4.5:1 needed for comfortable reading (blurbs on facility/scouting cards, table sub-text,
"rating 1000", scout descriptions). **Fix:** introduce a `--muted:#b9b9d8` (or similar) token that
clears 4.5:1 on `--panel`, and replace ad-hoc greys with it. Keep genuinely de-emphasized hints one
step lighter than body, not three.

### R4. Soften the CRT overlay for legibility `[readability]` `[polish]`
`body::before/::after` (scanlines + vignette, z-index 9998/9999) sit over everything and reduce
text crispness, especially on small type. **Fix:** reduce scanline opacity / vignette strength (or
gate them behind a `prefers-reduced-motion`-style toggle, or a small "CRT" on/off control). Aim for
"hint of CRT," not a filter over the content.

---

## P1 — Layout & use of space `[layout]`

### L1. Center the app + use the widescreen dead-space
Panels are a fixed `width:880px`. On a 1280px+ desktop the content reads cramped with large empty
areas to the right and below (very visible on Login, Market, and any short panel). **Fix:** ensure
the app column is horizontally centered, and on wide viewports either (a) widen key panels, or
(b) move the hub to a two-column dashboard (fixtures + a side rail with league snippet / coins /
next fixture). Short panels shouldn't leave half the screen black.

### L2. Denser, less-redundant fixture rows `[layout]` `[polish]`
Each fixture row is tall and repeats the club identity: "Rival1's Club **Rival1** · rating 1000".
**Fix:** drop the duplicate handle, tighten row height, make the H/A venue chip clearer (label
"HOME"/"AWAY" or a stronger color), and right-size the PLAY button. More fixtures visible per screen.

### L3. Empty-state polish `[polish]`
Empty states ("Nothing for sale right now", "No finished seasons yet") sit in a big void. Give them
a centered icon + one-line prompt and a subtle bordered card so the screen doesn't look broken.

---

## P1 — Match engine visuals & realism `[match]`

### M1. Fix the kickoff cluster (first frame) `[match]`
At the instant of kickoff every player is bunched into one third of the pitch for a frame before
spreading into shape. **Fix:** initialize player positions at their formation anchors (in each team's
own half) so the opening frame already looks like two lined-up teams. (Steady-state movement is fine —
players do spread into formation shape correctly.)

### M2. Reduce shot volume / tune conversion `[match]` — VERIFY BALANCE
A 0–1 game reported **19 vs 13 "on target"** — roughly 4–5× realistic. Shots-on-target should land
around 3–7 per side. **Fix carefully:** lower shot frequency (or reclassify most as off-target/blocked)
so volume is realistic without changing goals-per-match. **Must keep `npm run verify` green** (fuzz
goals/match in range, anti-spam gate, counter-triangle, shape assertions). Do NOT ship if calibration moves.

### M3. Investigate the home/away bias `[match]` — VERIFY BALANCE
At equal quality the engine favors `teams[1]` (away) ~50% vs `teams[0]` (home) ~35% — a ~15pp
built-in asymmetry (see the fuzz "equal-quality" line). Home should be neutral-to-favored. Find the
source (kickoff possession? attack-direction handling?) and neutralize it. **Keep `verify` green.**

### M4. Player sprite polish `[match]` `[polish]`
Sprites are readable but plain (uniform blobs). **Fix (client render only):** add facing/direction,
a subtle run bob, a clearer ball + shadow/trail, and small event flourishes (goal pop). Client-only,
deterministic — no engine/state changes.

### M5. Slow down 1× playback `[match]` `[polish]`
At 1× the match plays back too fast to follow. The engine ticks (`TICK_SEC=0.5`) are mapped to real
time too aggressively. **Fix (client only):** slow the 1× render pace so a match is comfortable to
watch (2×/12× stay as the fast options). This is purely the client's tick→real-time accumulator /
speed multiplier in the match loop — it does NOT change the deterministic result, only how fast the
replay is shown. Keep the speed buttons working proportionally.

### M6. Smoother, more natural movement `[match]` `[polish]`
Player motion feels robotic — the engine updates positions every 0.5s and the client appears to snap
to each tick, so players move in rigid straight-line jumps. **Fix (client render only):** interpolate
sprite positions smoothly between engine ticks (lerp toward the next tick's position each frame) and
add slight easing/acceleration so players glide rather than teleport. Render-only — never change
engine positions or add `Math.random()` to `shared/`. Pairs well with M4/M5.

---

## P2 — Component polish `[polish]`

- **C1. Cup bracket** — rounds are readable but disconnected; add faint connector lines between a
  tie and its next-round slot so it reads as a bracket, and give a bit more horizontal breathing room.
- **C2. Scouting tryout rows** — the small colored square before each trialist name reads as noise;
  replace with the role chip (GK/DF/MF/FW) used elsewhere for consistency.
- **C3. League table** — promotion/relegation row tints are very subtle; strengthen the green/red
  band and add a thin left-edge marker so the promo/releg zones are obvious at a glance.
- **C4. Buttons** — add a consistent hover/active/disabled treatment (slight lift + brightness) so
  clickable elements feel responsive; ensure disabled state is visually distinct.
- **C5. Facility cards** — solid; consider the "next effect" line in the muted token from R3 and the
  cost pill a touch larger for scannability.

---

## Notes for the implementer
- Keep the retro-arcade identity: the fixes are about **legibility within the aesthetic**, not
  replacing it. Bigger/clearer type + better contrast + a lighter CRT, same palette and vibe.
- `[readability] [layout] [color] [polish]` items are **client-only** (index.html CSS + main.ts /
  pixelart.ts) and safe to ship after a visual check.
- `[match]` items M2/M3 touch `shared/` balance — they MUST keep `npm run verify` green (client build
  + engine tests + fuzz). If calibration/anti-spam/counter/shape assertions move, do not ship.
