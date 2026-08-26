# One save, one story — fusing career + manager (DECIDED 2026-08-27)

**Status:** DECIDED. Supersedes the "two games, one world / pick-a-mode" framing.

## The decision
Pixel Manager is **one continuous dynasty save**, not two games you switch between. You are a manager
who is *also living a bloodline player's career*, at the club you run. Scout a kid → live his career →
he plays for your club → he retires → his heir (same family name) joins the youth ranks → repeat, with
silverware and bloodlines accreting in one trophy room. The old **mode-select wall is removed.**

## Why
- The engines already **share one account** — a career player "graduates into a pro for your squad," and a
  single save already holds both the club and the prospects. The split was a leftover from building the two
  loops as separate prototypes; the plumbing to fuse them already exists.
- It's the stronger product: New Star Soccer's *personal* career + Football Manager's *club* season, bound
  by a dynasty spine. That through-line is the game's identity and its replay hook.
- Fits everything already decided: premium single-player, offline-first, one continue-story save.

## The flow is LINEAR, not parallel (DECIDED 2026-08-27)
You do not toggle between "player" and "manager" menus, and they are never presented side by side. The game
is **one linear life**: you live the bloodline player's career, chapter by chapter. Running the club is a
**later stage of that same timeline** (you grow into the dugout — e.g. as the player matures into a senior
squad, or after he retires and you take over the bloodline's club), not an always-open parallel surface.

Concretely, right now: the home shows only **YOUR PLAYER** (the current career thread) and the **DYNASTY &
Trophy Room**. The manager screens (season fixtures, standings, club, transfer market, scouting) still exist
in the code but are **unlinked from the home** until the linear progression unlocks them in Phase 2. There is
no "play a league match" task sitting next to a 10-year-old in the academy.

## The target — a fully fused timeline
The club season is the clock. Your bloodline player is a member of the squad you manage. A **matchday** is
one event on one timeline:
1. Set the XI & tactics (manager side).
2. Kick off.
3. Live your player's key **career moments inside that same match** (the card beats become his star-player
   moments in the fixture).
4. The result feeds the **league table** *and* his personal stats/growth.

Between matches: develop him (the career card game), run the club (transfers, facilities, scouting), and
watch the dynasty grow. When he retires, his heir continues — one uninterrupted save.

## Phased build (keep `npm run verify` + `career_sim` green at every step)
- **Phase 1 — Unified, linear home (no mode wall). ✅ done.** Continue/New Game land in one **Club & Dynasty
  hub**: club identity, a **YOUR PLAYER / bloodline** section (develop / continue his story), and the
  **Dynasty & Trophy Room**. The "pick a mode" screen is deleted and the parallel manager surface is unlinked
  (see the linear-flow note above). *Presentation of a save model that was already unified.*
- **Phase 2 — Fused season timeline.** The manager season drives both sides; the bloodline player sits in the
  squad; his career moments are scheduled against the season's matchdays rather than a separate 112-turn track.
- **Phase 3 — Fused match.** Career moments resolve *inside* the manager match engine — one match, one clock,
  both outcomes (league result + personal growth) from the same simulation.

North star: by Phase 3 there is no seam a player can point to between "the career game" and "the manager
game" — there is only their club and their bloodline.

---

## Phase 2 — technical design (the fused season timeline)

**Goal:** the club season and the player's career are one timeline. Right now the career already renders
matchday moments with a scoreboard (opponent, score, minute) invented per-turn by `matchContext` in
`server/src/tokens.ts` (deterministic from seed+turn, purely presentational). The manager side, meanwhile,
has a *real* league season (`server/src/seasons.ts`, fixtures, standings). Fusion = make those the **same
matches**, and make managing a **stage the linear life grows into**, not a parallel menu.

### The unlock model (the one design decision)
The life is linear, so managing must enter *in sequence*. Proposed trigger, in order of how much it changes:
- **A — Player-manager at the peak (recommended).** While the bloodline player is a senior pro (roughly the
  `First Team` / `Establishing` stages, ~age 18+), his club matches become manageable: before his matchday
  you set the XI/tactics, then play his moment inside that fixture. Managing and playing are the same event.
- **B — Gaffer after retirement.** You only take the dugout once the player retires; the career stage is
  "playing", the manager stage is "management", strictly sequential. Simpler, but the two never overlap.
- **C — Hybrid.** B by default, with A available in the final playing stage as a "learning the trade" taster.

This choice sets *when* `showHub` re-links the club surface and how the two engines share a clock. **Pending
the user's pick** — do not build the timeline until it's chosen.

### Data/engine plan (keeps determinism + `career_sim`/`verify` green)
1. **One club identity, already shared.** A save = one account with a club and the bloodline token; no schema
   change needed to *link* them — only to decide which fixtures are "his".
2. **Career match moments ← real fixtures.** Replace `matchContext`'s invented opponent/scoreline with the
   club's actual league fixture for that week: same opponent, same competition. Deterministic already (fixtures
   are seeded per season); the career turn maps to a fixture index. The moment's *demand/cards* stay engine-
   identical, so replay + the sim are untouched — only the surrounding context changes (as `matchContext` is
   today: presentational).
3. **His performance ← the moment's `success`.** The `Choice.success` we now surface (Phase-1 outcome) becomes
   his contribution to that fixture's result — a soft nudge on the club match, not a rewrite of the match
   engine (that's Phase 3).
4. **One clock.** The season's matchday cadence drives career turns during the playing stages; between
   matches, the off-pitch career moments (training/life) fill the gaps.
5. **Unlock wiring.** `showHub` re-links the club/season surface only once the linear stage from the unlock
   model is reached; before that it stays player-only (today's state).

### Build order (each a green, shippable step)
1. Pick the unlock model (A/B/C) — **user decision, blocks the rest.**
2. Map career match-turns → the season's fixture list (context only; no engine change). Verify replay + sim.
3. Re-link the club/season surface at the unlock stage; gate it behind the linear progression.
4. Feed `success` into the fixture result as a nudge; show his line in the club result.
5. (Phase 3) collapse the two matches into one simulation.

Guardrails unchanged: no `Date.now`/`Math.random` in `shared/`; `npm run verify` **and**
`npx tsx shared/career_sim.ts` green after every step; one shippable step per commit.
