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
