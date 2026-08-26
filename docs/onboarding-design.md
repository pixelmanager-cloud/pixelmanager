# Onboarding design — the first 15 minutes

**Status:** design spec. The highest-leverage thing for Steam conversion — the first 15 minutes decide
wishlist vs refund. Companion to `offline-shell-design.md`.

## Key insight: the tutorial IS the first real career
Do NOT build a throwaway tutorial. **Teach by playing the player's genuine first career**, with light
contextual coaching in chapter 1 that fades as they get it. The first player they develop is **kept
forever** — so they're emotionally invested from minute one, learning on *their* player, not a dummy. The
best onboarding is indistinguishable from just playing.

## Beat-by-beat (≈10–15 min to the open game)

**Beat 0 — Cold open (30s).** Evocative one-liner ("Every legend starts somewhere — find yours"). New Game →
name your club (fast; offer suggestions). Start at the bottom tier.

**Beat 1 — Scout your first prospect (1–2 min).** The scouting board: 2–3 *revealed* 10-year-olds. Teach
reading a frame (the stat bars, a trait or two) and the core promise: *"Every prospect can become great —
it's up to how you develop them."* They pick one → **ownership begins.**

**Beat 2 — The first career, chapter 1 (the HOOK, 4–6 min).** Drop straight in; teach *one concept per
moment*, contextually:
- First moment → the core choice (read scenario → play a card → see the outcome narrated).
- Next → a meter lights up ("Your coach noticed that" = authority).
- Then energy, then the summer **focus** choice, then a small **consequence**.
- A stat ticks up: *"He's improving — because of your choices."* ← the emotional core of the whole game,
  felt in minute three.
- Coaching tooltips fade after chapter 1; they play the rest of the career normally.

**Beat 3 — Graduation → your squad (1–2 min).** The graduation epilogue (already built), framed emotionally:
*"From a 10-year-old you scouted to a pro."* → "He's in your squad now." Show the pro card.

**Beat 4 — First match (2–3 min).** Play one match (pixel + commentary), light manager touch (set XI, watch,
result). Payoff: the commentary references *your* developed player.

**Beat 5 — Widen + dynasty tease (1 min).** Reveal the academy, the season/table, facilities. Then the hook
that sells the long game: *"One day he'll retire — and his child will carry your bloodline forward."* Hand
off to the open Club Hub; coaching tooltips are done.

## Design principles
- **Skippable** (a clear skip for returning players).
- **One concept at a time, inline** — no text walls, no modal lectures. Teach in the flow.
- **Gentle but real first career** — the starter prospect has a solid frame and slightly softer early
  scenarios so the player feels *competent* and their first player turns out decent. Difficulty ramps *after*
  onboarding — never sour the first run with early regression/failure.
- **The first player is kept** — attachment, not a dummy tutorial player.
- **Show, don't tell, that choices mattered** — the "grow with care → flourish" thesis, made *felt*.

## The conversion goal
By minute 15 the player should:
1. **Understand the loop** (develop → graduate → manage → dynasty),
2. **Be attached to a player they made**, and
3. **See the decades-long dynasty ahead.**

That combination — **unique mechanic + emotional hook + long horizon** — is what turns a Steam demo into a
wishlist and a wishlist into a sale.

## Build notes
- Implement as **contextual coach-marks / tooltips gated to the first career's chapter 1**, plus a scripted
  New-Game flow (name → scouting board → first career → first match → hub reveal). Store a "tutorial done"
  flag in the save.
- Reuses everything (scouting, career, graduation epilogue, match, hub) — the new work is the *scripted
  sequencing + the coach-marks + the dynasty-tease copy*, not new systems.
- A short, optional **playable demo build** of exactly Beats 0–4 is an ideal Steam-page wishlist driver.
