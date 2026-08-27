# One save, one story — fusing career + manager (DECIDED 2026-08-27)

**Status:** DECIDED. Supersedes the "two games, one world / pick-a-mode" framing.

## The decision
Football Royalty is **one continuous dynasty save**, not two games you switch between. You are a manager
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

## THE HANDOFF MODEL (DECIDED 2026-08-27) — both modes are played, in sequence
Not one collapsed track. Both the **player card-career** and the **manager mode** are played, and the game
**switches between them at a milestone**:

1. **Player mode** — you play the bloodline player's card-career (youth → breaking in), as today.
2. **THE SWITCH** — once he becomes a **regular in the first team** (squad status reaches Regular starter),
   the game **switches to manager mode**: he graduates into your squad and you take the reins as manager.
3. **Manager mode** — you run the club season with him as your star: XI, tactics, matches, the league table,
   transfers, facilities. He plays out his prime under your management until he retires.
4. **The loop** — his **heir** comes through the youth ranks → the game switches **back to player mode** for
   the heir's card-career → and switches to manager again when *he* becomes a regular. One club, generations
   deep, alternating player-mode and manager-mode.

This supersedes the "one continuous flexible-length career" idea: the player career does NOT run to age ~35;
it hands off to manager mode at the **regular** milestone. So there is no need to make the 112-turn career
open-ended — instead the switch is the natural end of each generation's *player* phase.

**The crux:** manager mode is built entirely around **pod-mates** (other real accounts, `ensurePod` /
`computeFixtures` in `index.ts` + `seasons.ts`), so single-player has no opponents. Making manager mode
playable requires a **single-player league**: fixtures vs the seeded fictional clubs (the `clubseason.ts`
league), matches played via the existing match engine + the rest simulated, a real table and rollover. That
league is the thing the handoff hands off *into*.

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

### The model — ONE CLUB, controlled throughout (DECIDED 2026-08-27)
The user's model, confirmed: you own **one club, forever** — it is your constant across the whole dynasty.
Your bloodline player is the **star you also live** inside that club. There is no "player mode vs manager
mode": there is one club you steer and a bloodline you live through it.

What keeps it *linear, not parallel* is that the **depth of control ramps with the linear life**, it is not a
second menu:
- **Youth stages (player is a kid, ~age 10–17):** "your club" is your home/identity/dynasty; the live
  gameplay is his youth career. You are not picking a senior XI yet.
- **Senior stages (~age 18+, First Team / Establishing):** the club's matches go live — a matchday is
  *set the XI/tactics → play his moment inside that same fixture*. Managing and playing are one event.
- **After he retires:** you keep managing the **same club**; his heir comes through its youth ranks and the
  loop continues. One club, generations deep.

**Club as the currency sink (user, 2026-08-27):** because the club is a single persistent entity you hold
throughout, **club upgrades** (facilities, youth setup, stadium, medical/coaching) are the natural home for
in-game currency — a progression sink, not pay-to-win. This is the intended coin/IAP-currency spend and a key
reason the one-club model matters. (See `docs/coin-purchases.md` / monetization; keep it cosmetic/progression,
never a fairness-breaking edge — trivial in offline single-player, but hold the line for any future online.)

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
1. ~~Pick the unlock model~~ **DECIDED: one club throughout (above).**
2. Map career match-turns → the club's season fixture list (context only; no engine change). Verify replay + sim.
3. Re-link the club/season surface at the senior stage; gate it behind the linear progression (kept player-only
   during the youth stages).
4. Feed `success` into the fixture result as a nudge; show his line in the club result.
5. **Club upgrades** — facilities/youth/stadium as the coin sink (the reason for one persistent club).
6. (Phase 3) collapse the two matches into one simulation.

Guardrails unchanged: no `Date.now`/`Math.random` in `shared/`; `npm run verify` **and**
`npx tsx shared/career_sim.ts` green after every step; one shippable step per commit.
