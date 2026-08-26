# Text match engine v2 — commentary + depth overhaul

The text feed is the primary match experience. This pass (Aug 2026) rebuilt it for
immersion, depth, visuals and UI. Everything is **deterministic** (seeded; a client
re-run reproduces the server-recorded score exactly) — verified across 120 matches.

## Event vocabulary (shared/src/types.ts `MatchEventType`)

Base: `kickoff goal shot_saved shot_missed chance halftime fulltime`
Commentary flow (add-only, no rng, no outcome change): `pass tackle_won loose_ball`
Cosmetic depth (read state, no rng): `fatigue woodwork`, plus a `counter?` flag on chances
Real mechanics (resolve with rng, affect outcomes): `foul yellow_card red_card
corner free_kick penalty penalty_missed sub injury`

## Real-match rates (per match, from 120 seeded matches)

goals 2.63 · fouls 16 · yellows 2.5 · reds 0.39 · penalties 0.24 · free kicks 1.8 ·
corners 3.4 · subs 6.0 · injuries 0.32. Corners come only from saves (deliberately
conservative — real ~10; kept low so goals stay in band).

## Balance (npm run verify — all gated)

goals/match 2.80 · strong(15)-vs-weak(11) win 72% · press possession 72% ·
anti-spam top tactic 46% (<60% gate) · fuzz home 41%/away 46%. Set pieces make
quality a bit more decisive (was 65%) but weak sides keep a puncher's chance.

## How the mechanics emerge (shared/src/engine.ts)

- **Fouls** come from the existing 1v1 tackle duel: a win landing in the top slice of
  the success band (widened by `aggression`) is a foul instead — REUSES the tackle roll,
  so the decision adds no rng. Only actual fouls then draw rng (card + set-piece).
- **Cards**: yellows ~`0.10+aggr*0.14` of fouls; rare straight reds + second yellows.
  A red removes the player — every player loop skips `sentOff`, parked at the touchline.
- **Restart**: penalty (given ~22% of box fouls; `setPiece`/`composure` vs keeper),
  dangerous central free kick (direct effort), else possession back.
- **Corners**: a save is pushed behind ~14% → aerial duel (`setPiece` delivery + best
  `strength`+`positioning` header vs keeper).
- **Rebounds**: a save spills ~5% to a lurking attacker for a rushed follow-up (one only).
- **Woodwork**: deterministic relabel of a slice of high-quality misses (no rng).
- **Subs/injuries**: deterministic, bench-driven, NO rng — so bench-less test/CPU squads
  are untouched (calibration identical). `buildXI` attaches a 7-man bench; the engine
  swaps the most-gassed outfielder from ~67' (≤3/side) and forces the odd injury sub.
  The engine works on its own copy of each XI so subs never mutate the caller's team.
- **Cosmetic surfacing**: counter-attack flag on through-ball chances, late fatigue beats,
  high-press wins (att-third turnovers), the pressure-sensitive `flow()` throttle.

Tuning knobs live inline in engine.ts: `foulBand`, card thresholds, the pen/FK/corner/
rebound conversion clamps, and the corner-from-save (0.14) / rebound (0.05) rates.

## Client (client/src/main.ts)

- Contextual goal narration: running score, scorer tally (His second! / HAT-TRICK!!),
  game-state framing (deadlock broken / level / back in front / consolation / winner),
  anti-repeat phrasing. Passages of play buffer consecutive passes; 7+ touches escalate.
- Momentum lines + a live **pressure bar** (home share of attacking beats / last 12').
- **Density toggle** (🎙️ Full / Key): Key drops the running texture, keeps big moments.
- **Post-match report** on the full-time card: result narrative, scorers, Player of the
  Match, plus Corners/Fouls stat rows.
- 2D↔commentary sync (goal/chance flashes the attacked goalmouth), keyboard shortcuts
  (1/2/3 speed, space pause, s skip, c cycle detail).
