# Backlog & timeline

This is the agent's to-do list **and** your steering wheel. The on-server agent
picks the **first unchecked `- [ ]` task** that doesn't already have an open PR,
implements it on a branch, and opens a PR for you to review.

## How to use it
- Add tasks as `- [ ] <clear, self-contained task>`. One deliverable each.
- Order matters: the agent works top-down. Put what you want next at the top.
- Be specific. "Add an Apply-counter button to the scouting report that sets the
  recommended tactics" beats "improve scouting". Vague tasks get a "blocked, please
  clarify" instead of code.
- The agent checks a box (`- [x]`) on its PR branch; merging the PR records it done.
- To pause the agent entirely, create an empty file `agent/STOP` on the server.

## Tasks (top = next)

> **CAREER-GAME CONTENT EXPANSION (priority).** The Career sim (breeder card game) must feel like living
> a real person's life and NEVER feel repetitive. These tasks add breadth. HARD RULES for every one:
> (1) it's a small, self-contained, ADDITIVE PR (add content, don't restructure); (2) fully DETERMINISTIC
> — no `Date.now`/`Math.random` anywhere in `shared/` (seed everything); (3) `npm run verify` MUST pass
> (client build + engine + fuzz) — the mental/engine calibration must stay green; (4) run
> `npx tsx shared/career_sim.ts` and confirm the diversity/role-balance/determinism checks still hold;
> (5) match the existing code style/format in the file you edit. Files: cards/coaches/agents/traits/
> personalities/scenarios in `shared/src/career.ts`; narration vocab in `shared/src/narrate.ts`. When you
> finish one, LEAVE the others unchecked for the next run.

- [x] **[career] +8 outfield cards.** Add 8 new cards to `DECK` in `shared/src/career.ts` — a mix of
  single-tag and dual-tag, with 1–2 rare/epic signature cards. Cover under-served tags; give each an
  evocative name (e.g. "Trivela", "Recovery Sprint", "Backs-to-the-Wall", "Nutmeg"). Do NOT add them to
  the STARTER lists (they enter via the draft pool automatically). Verify green + career_sim checks hold.
- [ ] **[career] +4 goalkeeper cards.** Add 4 new cards to `GK_DECK` (keeping-flavoured, 1 rare). Verify.
- [x] **[career] richer PLAY narration.** In `shared/src/narrate.ts`, add ≥6 fresh phrasings to EACH of
  `RESULTS.triumph/good/mixed/poor/dismal` and `REACTIONS.*`, and ≥3 new `SETTINGS` per chapter + more
  `BIG_SETTINGS`/`HUGE_SETTINGS`. Keep the seeded-pick structure; no repetition of existing lines. Verify.
- [x] **[career] narrate coach/draft/offer choices.** Extend the narrator so appointing a coach, drafting
  a card, and resolving a financial offer ALSO produce a short immersive beat (new functions in
  `narrate.ts`; wire them in `server/src/tokens.ts` `actWithNarration` for those action types). Verify.
- [x] **[career] chapter-transition narration.** When a career crosses an age-chapter boundary, produce a
  short paragraph summarising the chapter (how he fared, the season event) — a "life so far" beat. Seeded,
  in `narrate.ts`; surfaced in the career state. Verify.
- [x] **[career] graduation narration.** At age 25 graduation, produce an evocative career-summary passage
  (his journey, standout traits, what kind of pro he became). Seeded from the career. Verify.
- [ ] **[career] +3 coaches / +2 mentors.** Add new staff to `COACHES` with fresh specialties/flavour. Verify.
- [ ] **[career] +2 sports agents.** Add 2 new agents to `AGENTS` (distinct exposure/greed/valueMod
  trade-offs — e.g. a "Streetwise Fixer", a "Boutique Agency"). Verify.
- [ ] **[career] +3 earned traits.** Add 3 new traits to `TRAITS` (clear eligibility from stats/log; small
  or no stat nudge). Verify + confirm trait distribution stays sane in career_sim.
- [ ] **[career] +2 personalities.** Add 2 new temperaments to `PERSONALITIES` (e.g. "Late Bloomer",
  "Hot-Head") with variance/bigGame/resilience + optional signature stat. Verify + personality-spread check.
- [ ] **[career] more big/huge moments.** Add more entries to `BIG_MOMENTS`/`HUGE_MOMENTS` scenario labels
  (evocative one-liners like "Relegation Six-Pointer", "Trophy on the Line"). Verify.
- [ ] **[career] more season events.** Add 2–3 new between-chapter `seasonEvent`s in `advanceSeasonEvent`
  (each with a bounded, deterministic mechanical effect + flavour text). Keep effects small; verify.

> **CAREER STORY-MODE DEPTH.** Story mode (shared/src/narrate.ts `scenarioStory` + play narration, and
> `CARD_DESC` in career.ts) makes each turn a described *situation* he lives through, with each card a
> clear *action*. Deepen it so it reads like a novel, never repetitive. Same HARD RULES as above
> (additive, deterministic/seeded, `npm run verify` green, `npx tsx shared/career_sim.ts` checks hold).
> The scenario story + card descs are surfaced via `server/src/tokens.ts` `careerState` — if you add
> new fields, thread them there and render in `client/src/main.ts` `renderCareer`/`cardHtml`.

- [x] **[story] richer scenario situations.** In `narrate.ts`, expand `KIND_SETUP` (≥6 phrasings per
  kind) and `DEMAND` (rewrite each to be more vivid + add 1–2 alt phrasings per tag, seed-picked). Verify.
- [x] **[story] age-aware scenario framing.** Make `scenarioStory` take the age/chapter and weave it in
  (a 12-year-old on a park pitch reads differently from a 23-year-old in a title run-in). Thread `chapter`
  through `careerState` → `scenarioStory`. Keep seeded + deterministic. Verify.
- [x] **[story] season-event colouring in scenarios.** When a `seasonEvent` is active (slump, hot streak,
  new gaffer, injury), tint the scenario story to reflect it ("Fighting to win back the new gaffer's
  trust, …"). Pass the event id into `scenarioStory`. Verify.
- [x] **[story] named characters.** Introduce a small seeded pool of recurring names (a coach, a rival, a
  mentor, a captain) and reference them in scenario stories + narration ("The gaffer, Hargreaves, wanted
  more…"). Deterministic from the career seed so they're consistent across a career. Verify.
- [x] **[story] richer play narration by tag.** In `narrate.ts`, give each card TAG its own flavour so the
  action reads specifically (a `flair` card narrates differently from a `keeping` card beyond the verb).
  Expand `VERBS` (≥6 per tag) + add per-tag result colour. Verify.
- [x] **[story] milestone beats.** Add special narration for milestone moments — first goal, first big
  win, a debut, delivering in a cup final — detected from the log/stakes. Seeded. Verify.
- [x] **[story] chapter-recap screen.** At each age-chapter boundary, show a short "the story so far"
  recap (2–3 sentences on how the chapter went + what's next) before the next chapter's first scenario.
  Build the text in `narrate.ts`, surface via `careerState`, render in the Academy. Verify.
- [x] **[story] graduation epilogue.** At 25, before the pro reveal, show an evocative epilogue passage
  summarising the whole journey (where he started, standout traits, the kind of player he became). Seeded
  from the career. Verify.
- [x] **[story] personality voice.** Let the player's temperament colour the narration voice throughout
  (a Maverick's beats read cocky, a Fragile one's anxious). Expand the `PERSONALITY` flavour usage in
  `narratePlay` beyond the current single clause. Verify.
- [x] **[story] rare life-event scenarios.** Add a few rare, high-flavour non-match scenarios (a contract
  standoff, a loan-move decision, a public mistake to bounce back from) with their own stories + demands.
  Keep them deterministic + rare; verify.


> **UI/VISUAL FIX SWEEP** — the tasks below come from `docs/ui-visual-audit.md` (read it
> first for full context). Priority is **readability**: the game must be easier to read and
> look at while KEEPING the retro-arcade identity (Press Start 2P + VT323 + CRT palette).
> These are all **client-only** (`client/index.html` CSS + `client/src/main.ts`/`pixelart.ts`),
> deterministic, no `shared/` changes. Each is ONE small PR. Always run `npm run verify` (must
> pass) and take a before/after look at the affected screen. Do them top-down, one at a time.

> **MATCH PIVOT — 2D pitch → TEXT COMMENTARY.** The game is moving from the 2D pixel pitch to a
> text-based match experience where the user follows the play through commentary (who passes to
> whom, who tackles, who scores). The 2D pitch is being **PARKED, not deleted** — keep the code,
> just make text the default. These two tasks come first; the readability sweep below still applies
> to all the UI chrome. Do NOT delete the Phaser pitch scene.

- [x] **[pivot] Text-commentary match view (client-only).** DONE by human (commit). Build a live, scrolling **commentary
  feed** as the PRIMARY match view, replacing the 2D pitch as the default (keep the pitch reachable
  behind an optional "2D view" toggle — do NOT delete it). As the deterministic engine ticks, render
  each event from the EXISTING event stream (`goal`, `shot_saved`, `shot_missed`, `chance`, `corner`,
  `free_kick`, `penalty`) as a line of natural commentary naming the player(s) involved — e.g.
  "📣 CHANCE! Silva slips in behind…", "🧤 Vidal's effort is beaten away!", "⚽ GOAL! Silva makes no
  mistake — Gaffer 1-0". Use DETERMINISTIC seeded template selection: keep a small pool of phrasings
  per event type and pick one by a seed derived from the match seed + event index (NEVER `Math.random`;
  keep it seed-derived so a replay reads identically). Keep the score/clock/possession HUD, the speed
  controls (1×/4×/12× should pace how fast lines appear — 1× must be readable, not an instant wall of
  text), skip-to-fulltime, and the full-time card. Client-only (`client/src/main.ts` + `client/index.html`
  CSS); NO `shared/` changes in this task. Screenshot the feed. `npm run verify` passes.

- [x] **[readability] Reserve the pixel font for headings; make small text legible.** Per audit R1:
  Press Start 2P (`--display`) is currently used for buttons (10px), section `h3` (13px), the login
  tagline (9px), `#record`/`#timer` (10px), table headers, pills and badges — pixel type is illegible
  that small. In `client/index.html` CSS, switch **buttons, labels, table headers, blurbs, pills, and
  badges to `--body` (VT323)** at comfortable sizes (buttons ~15–16px, pills/badges ~11–12px), and keep
  Press Start 2P ONLY for large display headings (the `PIXEL MANAGER` title; screen `<h3>` may stay pixel
  but at ≥16px with `line-height:1.5`). Do not change the palette or layout. Verify every screen still
  reads correctly (login, hub, lineup, match HUD, league, club, scouting, market). `npm run verify` passes.

- [x] **[readability][color] Fix low-contrast muted text.** Per audit R3: ad-hoc greys (`#778`, `#8aa`,
  `#99a`, `#889`) on the dark navy are ~3:1 — below readable. Add a `--muted` token (~`#b9b9d8`) to `:root`
  that clears ~4.5:1 on `--panel`, and replace those hard-coded greys (facility/scouting blurbs, table
  sub-text, "rating 1000", `.muted`, scout descriptions, empty-state copy) with it. Keep hints one step
  lighter than body text, not three. Client-only CSS. `npm run verify` passes.

- [x] **[readability] Soften the CRT overlay.** Per audit R4: `body::before`/`body::after` (scanlines +
  vignette, z-index 9998/9999) reduce text crispness over small type. Lower the scanline opacity and
  vignette strength so it's a subtle hint, not a filter over the content — OR add a small "CRT" on/off
  toggle in the top bar that persists in localStorage (default on, softer). Keep the retro vibe. Client-only.
  `npm run verify` passes.

- [x] **[layout] Center the app and use the widescreen dead-space.** Per audit L1: panels are a fixed
  `width:880px` and on a wide desktop the content reads cramped with large empty areas right + below (very
  visible on Login and Market). Ensure the app column is horizontally centered, and on wide viewports let
  the main panels use more of the width (raise the max-width, or add responsive breakpoints) so short
  screens don't leave half the viewport black. Don't break the mobile layout (test at 375px — it's currently
  good). Client-only CSS. `npm run verify` passes.

- [x] **[layout][polish] Tidy the fixture rows.** Per audit L2: each hub fixture row is tall and repeats the
  club identity ("Rival1's Club **Rival1** · rating 1000"). Drop the duplicate handle, reduce row height so
  more fixtures fit, make the H/A venue chip clearer (label HOME/AWAY or stronger colour), and right-size the
  PLAY button. `client/src/main.ts` (the fixtures render) + CSS. `npm run verify` passes.

- [x] **[polish] Make the league promotion/relegation zones obvious.** Per audit C3: the green/red row tints
  in the league table are almost invisible. Strengthen the promo (green) and releg (red) row backgrounds and
  add a thin coloured left-edge marker on those rows so the zones read at a glance. Keep it within the palette.
  `client/src/main.ts` (renderLeagueTable) + CSS. `npm run verify` passes.

- [x] **[polish] Consistent scouting tryout row chips.** Per audit C2: the small coloured square before each
  Local-Tryout trialist name reads as noise. Replace it with the same role chip (GK/DF/MF/FW, role-coloured)
  used in the lineup editor and scout card, for consistency. `client/src/main.ts` (renderTrialPool) + CSS.
  `npm run verify` passes.

- [x] **[polish] Button interaction states.** Per audit C4: add a consistent hover / active / disabled
  treatment to buttons (slight lift + brightness on hover, pressed offset on active, clearly dimmed +
  not-allowed cursor on disabled) so controls feel responsive and disabled ones are obvious. Global CSS in
  `client/index.html`. Don't change button colours/identity. `npm run verify` passes.

- [x] **[pivot][engine] Emit richer per-player events for commentary.** To make the text commentary
  vivid ("Silva finds Vidal", "crunching tackle by Okafor", "Mensah skins his man"), the engine needs
  more granular events. In `shared/src` add new `MatchEventType`s (e.g. `pass`, `pass_intercepted`,
  `tackle_won`, `tackle_lost`, `dribble`, `header`, `clearance`, `block`, `loose_ball`) emitted at the
  EXISTING decision points, each carrying the player name(s) involved — for a pass, BOTH passer and
  receiver — plus a cheap zone hint (defensive third / midfield / final third) so commentary can say
  WHERE it happened. **Do NOT change match outcomes or balance** — only ADD events describing what
  already happens (same goals, same result for a given seed).
  Keep it deterministic (no `Math.random`/`Date.now` in `shared/`). Don't flood the feed — emit at a
  sensible cadence, not every micro-tick. Update the fuzz test's event-type assertions to accept the new
  types. `npm run verify` MUST stay green with calibration/anti-spam/counter-triangle/shape assertions
  UNCHANGED (outcomes identical). Then extend the text-commentary view to render the new events. This is
  the richer half of the text pivot — take extra care that balance does not move.

- [x] **[pivot] Deep, detailed commentary layer.** Make the feed read like real radio commentary, not a
  list of isolated events (the user specifically wants this VERY detailed). Building on the richer engine
  events: (1) **Passages of play** — string consecutive same-team events into one flowing move with
  connectives instead of one line per event ("Silva to Vidal… back inside to Mensah… and Vidal again —
  lovely one-two, and he SHOOTS!"). (2) **Deep vocabulary variety** — many phrasings per event type so it
  rarely repeats within a match, chosen deterministically by a seed (match seed + event index; NEVER
  `Math.random`). (3) **Stat-flavoured player descriptors** — colour players by their standout stats,
  deterministically from the player's own attrs: high composure → "ice-cool" / "unflappable", high
  aggression → "combative" / "no-nonsense", high creativity → "inventive", high pace → "lightning-quick"
  (works today off the physical stats; will get richer once the mental stats from the Career Sim exist).
  (4) **Zone / build-up context** — use the events' zone hint ("works it out from the back", "in the final
  third"). (5) **Match-phase & momentum lines** — occasional context ("a wave of pressure from the home
  side", "against the run of play", "end-to-end now"), plus a half-time and a full-time summary line, and
  bigger language for late/decisive moments (a 90th-minute winner reads huge). All DETERMINISTIC (seed-
  derived selection so a replay reads identically; no `Math.random` in `shared/`, and keep client-side
  selection seed-derived too). Rendering/templating is client-side; relies on the richer engine events.
  Keep the feed readable at 1× (paced, not a wall of text). Screenshot a full match. `npm run verify` passes.

- [x] **Match view: richer pitch markings** (ONE focused task — keep it small so it finishes fast). CLIENT-ONLY, DETERMINISTIC: only touch the pitch-drawing code in `client/src` (the Phaser match scene in `main.ts` and/or `pixelart.ts`); make NO changes to `shared/` and do not touch player/ball logic. First read how the pitch is currently drawn (grep for the pitch texture / background in `pixelart.ts` + `main.ts`). Add, in the existing retro palette: a centre circle + centre spot + halfway line, both penalty boxes + 6-yard boxes + penalty spots, the goal mouths, corner arcs, and subtle mown-grass stripes. Match the current pitch dimensions/scale exactly (positions come from engine coordinates — do not change the coordinate mapping). Keep it crisp at the current resolution. Open a PR; `npm run verify` must pass. This is JUST the pitch — do not also do players/ball/camera (those are separate queued tasks).

- [x] **Match view: better players + ball** (CLIENT-ONLY, DETERMINISTIC; do this AFTER the pitch task). In `client/src` only: make each player sprite face the direction it's moving, add a subtle bob/run cadence while moving, and clearly highlight the ball-carrier (a glow or outline). Give the ball a drop shadow and a smoother short fading trail. Positions still come from the engine each tick — render polish only, no `shared/` changes, no balance changes. Keep it 60fps. Open a PR; `npm run verify` must pass.

- [x] Write a design document `docs/immersion-ideas.md` brainstorming ways to make Pixel Manager feel far more **immersive** — so the player feels like the manager of a real football club, not just a lineup-picker. FIRST read `README.md`, `docs/async-pvp-phase1.md`, `docs/seasons-and-divisions.md`, `docs/economy-and-web3.md`, and `docs/game-upgrade-ideas.md` to ground yourself in the current game: a deterministic seeded match engine; async PvP with standing orders; seasons + a 10-tier division pyramid with ~20-club pods, promotion/relegation and an honours board; per-player duties; handle+password accounts; and **NO LLM — pure deterministic TypeScript**. Propose immersion features grouped into clear themes, for example: (1) **Club identity & world** — crest/kit/stadium, club history & lore, home city, persistent rivalries; (2) **The manager's world** — a board with season expectations + a confidence/job-security meter, pre/post-match press conferences and media as *deterministic template/seeded text*, per-season objectives; (3) **Squad as people** — player personalities, morale & form, dressing-room relationships, backroom staff, ageing/development across seasons, injuries/suspensions (respecting the no-in-match-consumable + pre-kickoff-only rules); (4) **Matchday atmosphere** — crowd, deeper commentary, narrative moments, rising tension; (5) **Narrative & continuity** — storylines, milestones, an inbox/news feed, rivalries that carry across seasons; (6) **Finances & club-building** — budget, wages, sponsors, facilities, framed to fit the future token economy WITHOUT pay-to-win. For EACH idea give: what it adds, **why it increases immersion** (the "real manager" feeling), a rough effort estimate (S/M/L), which files/systems it would touch, and how it respects the hard constraints (determinism — no `Date.now()`/`Math.random()` in `shared/`, matches stay a pure function of pre-kickoff inputs; NO LLM; any generated text must be deterministic template/seeded). Note which ideas fit the current architecture (async PvP, seasons/pods, duties) with little friction vs which need new subsystems. End with an opinionated "if you build three things first" shortlist. This is a DOCUMENTATION-ONLY task: create the markdown file, make NO code changes, and keep it a skimmable pick-list the human can choose from.

- [x] Build a seeded **simulation fuzz-test harness** that hunts for engine/game bugs, then fix every bug it finds. Create `shared/fuzz_test.ts` (add an `npm run fuzz` script AND include it in `npm run verify`): generate many diverse squads with `generateTeam`/`generateClub` across a wide quality range (3–20), seeded-random formations, tactics (all 5 sliders across their full range), and per-player duties, then play a large batch of full matches (2000+ across varied seeds) on `MatchEngine`. For every match, assert engine INVARIANTS and log any violation with the reproducing seed/inputs: no exception thrown; the clock advances monotonically and the match terminates within the expected tick budget (no infinite loop / hang); `score` values are non-negative integers; every player position stays on the pitch (0≤x≤105, 0≤y≤68) and is finite (no NaN/Infinity); the ball stays in bounds and finite; `fitness` stays within [0,1]; `possession` counts are non-negative; `carrier` (when set) indexes a real player; every event's `teamIdx` is 0/1 with a valid type; the count of `goal` events matches the final `score`. Also sanity-check batch aggregates (goals/match in a sane range; at equal quality neither side wins ~100%/0%; not every match ends 0-0). For EVERY violation, find the ROOT CAUSE in `shared/src` and fix it — keep the engine deterministic (no `Date.now()`/`Math.random()` in `shared/`; a match stays a pure function of its inputs) — then re-run the fuzzer; repeat until it runs clean. Commit the harness plus all fixes as a permanent regression guard. If the turn budget runs out with bugs still open, commit what's fixed and LIST every remaining bug (with repro seed) in the PR body. **Do NOT change game balance / tactics magnitudes** — this is about correctness & robustness, not tuning.

## Done (recent)
- [x] Design doc `docs/game-upgrade-ideas.md` (fun + consumables pick-list).
- [x] "Apply suggested counter" button on the scouting report.
- [x] Retro "GOAL!" celebration flash in the match view.
- [x] Chunky retro pixel possession bar.
- [x] Sortable full-squad-stats table in the lineup editor.
- [x] Reusable "Team saved ✓" toast.
- [x] Retro pixel loading spinner in the hub.
- [x] Scoreboard pulse on a goal.
- [x] W/D/L pill badges on the hub recent-matches rows.
- [x] Login screen polish (tagline + input glow).
- [x] Subtle ball trail in the match view.
- [x] Subtle camera shake on goals.
- [x] CRT vignette overlay.
- [x] In-match fitness bar (green→amber→red).
- [x] Post-match summary card.

## Roadmap (context for the agent — not tasks yet)
1. ~~Seasons: league resets into seasons with a champion/history.~~ **DONE** (Phase A).
2. ~~Per-player roles/duties (target man, playmaker, poacher).~~ **DONE** (duties, manager-assignable).
3. ~~Divisions/pods + promotion/relegation.~~ **DONE** (Phase B, 10-tier pyramid).
4. Phase C: per-season fixtures/schedule (a daily reason to log in) — being built by the human now.
5. Immersion layer (see `docs/immersion-ideas.md` once written).
6. Consumables + token economy on testnet (see `docs/economy-and-web3.md`).
7. Onchain phase: player NFTs, commit-reveal match settlement, token/wages (XLayer testnet first).
