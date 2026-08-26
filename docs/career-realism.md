# Career realism & the fused club season (roadmap)

How the personal career and the club season fit together, and the realism layers on top. Guardrails as
ever: deterministic (no `Date.now`/`Math.random` in `shared/`), `npm run verify` + `npx tsx
shared/career_sim.ts` green, replay-safe. The club-season layer lives **server-side** (presentational), so
the deterministic engine and replay are untouched unless a change explicitly reworks the engine.

## The core reconciliation (why the numbers differ)
The **player career is a highlight reel** — the engine surfaces only ~5 pivotal match *moments* a season
(~65 across the whole 10→25 career). His **club plays a full, smaller league season** around them. He never
plays 38 as moments; the club plays a campaign, and his moments are the highlights within it.

## Shipped (this session)
1. **Career matches = club matches.** The matchday scoreboard names *your club* vs the opponent (drawn from
   the league, minus your own club). `matchContext` + `careerState`. ✅
2. **Small simulated league + table.** `server/src/clubseason.ts`: a 10-club league → an 18-fixture double
   round-robin, fully simulated by strength → a real table Marlow climbs. A `🏆 League` tab in the career. ✅
3. **Appearances scale with status.** `squadRole()` — Breaking in → Squad rotation → Regular starter → Key
   player, set by stage + overall; apps out of 18. And the club's strength BLENDS a squad baseline with his
   quality *weighted by how much he plays*, so game-time drives the club's finish. ✅
4. **Variable break-in.** `firstTeamReady(bandIdx, overall, clubLevel)` — he gets a senior season once his
   overall clears a threshold (from ~age 17), not at a fixed age: a prodigy early, a late developer later.
   A higher-level club is harder to break into (`clubLevel`, wired but 0 until divisions are live). ✅

## Pending — smaller
- **League position on the matchday header** ("Marlow · 5th") so it's visible while playing, not just in the
  tab. Quick, presentational.
- **Multi-season club history** — persist the table/finishes across seasons and *generations* so the club has
  an all-time climb (the real dynasty arc). Needs storage; currently the table is per-season and recomputed.

## Pending — bigger (need design/decision)

### A. Flexible career length (user: "don't let the 112 be a hard cap")
Today the career is exactly **112 turns, 7 bands, graduates at 25**, then a separate pro/manager phase. The
ask: make length organic, not a fixed script. Options:
- **Light** — variable *retirement age*: extend the track past 25 into senior seasons and retire at a variable
  age (decline-driven). Medium engine change.
- **Full** — one continuous flexible timeline age 10→retirement (~30–38): youth → break-in → senior seasons
  (each a club campaign with his highlight moments) → variable retirement → heir. Collapses the "graduate at
  25 then pro" split into the fused career. Big engine rework — touches graduation, the reborn/dynasty loop,
  `career_sim`, replay. **Must stay deterministic + replay-safe** (length as a deterministic function of
  seed + actions; external inputs like club level must be stored/stable).
- **Decision pending** — confirm the vision + scope before reworking the deterministic engine.

### B. Heir stress-events from a legendary father (user)
A next-generation player whose **father was a club legend** (above a prestige tier — see `legacy.ts`
LEGEND_TIERS) carries the **weight of the name**: when he's performing badly, the fanbase's high expectations
trigger **stress events** (a hostile crowd, media pressure, "living in his shadow" moments) — resolved by the
same card play, with meter/form consequences. A self-contained narrative system:
- Detect: heir's `generation > 0` AND father's legend tier ≥ threshold AND recent form poor.
- Present: a re-skinned life/pressure moment (like the existing rare life events in `careerState`).
- Consequence: form/confidence/fans meter swings; handling it well can flip the pressure into motivation.
- Deterministic, presentational (fits the existing life-event re-skin pattern). Buildable without an engine
  rework.
