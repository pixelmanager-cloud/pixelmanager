# Football Royalty — UI / Visual Audit & Fix List

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
