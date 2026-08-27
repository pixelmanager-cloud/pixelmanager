# Manager-game depth — brainstorm (current-state, 2026-08)

> ## ✅ SHIPPED (2026-08-27) — for the NEW single-player fixture-by-fixture manager mode
> The manager mode was reworked into a single-player fixture-by-fixture season (see `one-save-fusion.md`),
> so these were built against that (not the old pod-based multiplayer). Board/sack/budgets stay cut.
> - **Form guide** — last-5 W/D/L strip in the season header.
> - **Rivalries & derby days** — one seeded league club is your rival; those fixtures are flagged 🔥 DERBY.
> - **Club records** — biggest win + longest unbeaten run this season.
> - **The Gaffer's take** (season feed / diary) — a seeded season-narrative line from form + position
>   (title race, relegation scrap, unbeaten run, statement win…).
> - **Team talk** — a real pre-kickoff decision (go for the throat / keep shape / play your game), each a
>   small bounded pre-kickoff edge (homeBoost/conditioning) baked into the deterministic snapshot.
> - **Post-match reaction** — a manager/fan line keyed to the result vs expectation.
> - **Star age curve** — the club's league strength peaks in the star's mid-20s and declines toward
>   retirement, so the managed career is a real arc (title window = his prime).
> - **Facilities → matches** — Training Ground (conditioning) + Fan Zone (home edge) now apply to the
>   single-player match snapshot, so the facilities coin sink matters.
> - **Season prize money** — finishing a season banks coins by position (`/sp/season-reward`), closing the
>   loop: play → earn → upgrade facilities → better matches.
>
> **✅ ALSO SHIPPED — the 5 core-four/depth items (2026-08-27, calibration-checked):**
> - **Named player roles** — 5 FM-style roles added to the duties system (ball-playing DF, inverted FB,
>   deep-lying playmaker, pressing forward, false 9), behaviour nudges only; calibration held (goals 2.80).
> - **Per-player training focus** — the managed star develops/declines season to season by a chosen focus
>   (young grow, veterans fade); `POST /players/:id/develop`.
> - **Backroom staff** — hire Fitness/Attacking coach + Assistant Manager with coins for small stacking
>   match edges; `POST /sp/hire-staff` (cost validated server-side).
> - **Mentoring** — a veteran star's years (age 30+) imprint on the heir (composure/leadership head start
>   via the heir's dev bonus); folded into `POST /players/:id/succeed`. A real dynasty tradeoff.
> - **Sponsorship deals** — each season pick a Steady (flat cash) or Performance (top-3 bonus) shirt deal;
>   `POST /sp/sponsor` + the bonus via `/sp/season-reward`.
>
> **✅ Match plan / conditional orders (2026-08-27):** pre-match rules the manager arms in the lineup editor
> (e.g. *losing at half-time → more attacking*, *leading at 75′ → shut up shop*, *2+ up → game management*).
> Each fires once mid-match when its minute + scoreline trigger is met, auto-shifting your tactics via the
> engine's `setTactics` (shifts applied from the kickoff tactics, clamped to the −2..+2 range) with a
> commentary toast. Single-player only (the client is authoritative there); armed set persists per save.
> **Nothing on the manager side is still open** — the remaining ideas below are stretch/flavour.
>
> ### 🌍 ✅ SHIPPED — competitions beyond the league (2026-08-27) — engine in `shared/src/intl.ts`
> All three are deterministic (hash-seeded, no rng/wall-clock), so they replay identically from a save seed.
> Names are deliberately generic to avoid real-competition trademarks.
> - **✅ Continental Cup** — a top-3 league finish books a place in next season's continental knockout
>   (QF → SF → Final, opponents from a stronger continental club pool, escalating strength, final on neutral
>   ground). Ties are **playable** through the same match flow as league games, or sim-able. Winning it banks
>   a continental prize + a trophy that shows in the retirement epilogue. `contOpponent()` + season-view panel.
> - **✅ National-team call-ups** — once the *player-career* star is capped, `careerState.international` carries
>   his fictional home nation (seeded from the surname) + his most recent call-up fixture (opponent, venue,
>   friendly/qualifier, scoreline, whether he scored), surfaced as a career moment. `nationalFixture()`.
> - **✅ The World Finals** — a national-team tournament staged every 4th manager season (8 nations, two groups
>   of four → semis → final; the star's nation strength = his overall). Full seeded bracket with group tables,
>   penalties, and the star's finish → a legacy multiplier + club payoff. `worldCup()` + a full report screen.


> ## ⚠️ Framing correction (2026-08) — OWNER-MANAGER, not employed manager
> The player is the **club owner** and **carries his own star NFTs** (portable assets across
> seasons/divisions). So the classic FM tropes **do not fit** and are **cut**:
> - ❌ **Board expectations / sack risk** — there's no board above an owner; you can't be fired.
> - ❌ **Transfer budgets (board-granted)** — you spend your *own* treasury, not an allowance.
> - ❌ **Transfer requests / forced sales** — you *own* the player NFT; he can't demand to leave.
>
> Reframe the whole side from **"serve a board"** → **"build a dynasty."** What survives:
> - ✅ **Your OWN ambitions** (self-set goals: climb the pyramid, win the Cup, 5-star squad,
>   take a bloodline to gen 5) — purpose without a boss.
> - ✅ **Dynasty narrative / Gaffer's Diary**, **rivalries** (vs other owner-managers),
>   **matchday decisions** (team talk / match plan — coaching *your* players).
> - ✅ **Loyalty/morale → PERFORMANCE and LEGACY, not transfer demands.** A neglected star
>   doesn't threaten to leave — he *declines / underperforms / retires a lesser legend*.
> - 🌟 **The real depth = DYNASTY / squad-as-long-term-assets:** because you carry players over
>   their whole arc, the strategic game is *developing* pros, managing *ageing/decline*, deciding
>   *when to reborn*, squad hierarchy & minutes (which shape each player's legacy), building the
>   *bloodline as a franchise* across generations, and spending *your* earned treasury on the club.
> The sections below predate this note — read Theme 1 & the finance/requests bits through this lens.


The **career (breeder) side is deep** now — story mode, named cast, chapters, epilogues,
life-events, a rich card game. The **manager side is capable but thin on *role*:** you pick
a lineup + tactics and watch a great match, but you don't yet *feel like a manager living a
career at a club*. This doc brainstorms depth that closes that gap.

## What the manager game already has (don't rebuild)
Deep match engine (tactics sliders, formations, per-player duties, fitness, traits, mentals,
**fouls/cards/set-pieces/subs/injuries**, rich commentary + post-match report), seasons +
10-tier division pyramid + pods + promotion/relegation, double round-robin fixtures, a knockout
**Cup**, 7 upgradeable **facilities** (stadium/training/youth/scouting/medical/sponsor/fanzone),
a **transfer market** + contracts/extensions/staking, **scouting** (opponent reveal tiers, trial
academy, scout-network missions, saved per-opponent plans), **morale**, a **prestige** badge,
**individual stats + season awards** (Golden Boot / Playmaker / League Best), NFT stars, and the
whole on-chain lifecycle.

## The constraints every idea must respect
- **Determinism.** Anything that changes a match must be a **pre-kickoff input** baked into the
  seeded snapshot (the engine is pure, `@fm/shared`, no `Date.now`/`Math.random`). No live
  in-match interference on competitive matches.
- **No LLM.** All "board", "press", "diary", "team-talk" text is **seeded template composition**
  — exactly the pattern `shared/src/narrate.ts` already uses for the career game. **Huge reuse:**
  a manager-side narrator is the same machine pointed at match/season data.
- **Off-chain + web3-safe.** All of this is off-chain game state — zero contract impact, add freely.
- **Matchmaking-neutral.** No pay-to-win; anything monetised later must not buy match strength.

---

## Theme 1 — The manager as a character (the biggest missing piece)
Right now "you" are an invisible lineup-picker. Give the manager an identity + a career arc.
- **Manager profile & reputation.** A named manager with a reputation score that grows from
  results/trophies/overperformance (beating higher-rated sides) — extends the existing prestige
  badge into a real stat. *Fits: aggregation over existing results. 🟢*
- **Job security & the sack race.** Each season the **board sets an objective** (e.g. "top half",
  "win promotion", "don't get relegated"); **board confidence** rises/falls with results vs
  expectation; sustained underperformance = **you're sacked** → you take a **new club** (lower/
  similar tier) and rebuild. This is the single highest-impact idea: it makes *every match matter*
  and creates a real career loop. *Fits: pure off-chain state over season results. 🟢*
- **Manager career history.** A CV: clubs managed, seasons, trophies, win%, "sacked/resigned" —
  a manager honours board alongside the club one. *🟢*
- **Manager traits / style.** Pick a managerial identity at start (e.g. "Tactician", "Motivator",
  "Chequebook", "Youth Developer") giving a small, *bounded, pre-kickoff* edge in one area —
  mirrors the career game's personalities. *🟡 (one pre-kickoff modifier)*

## Theme 2 — Matchday as an event (now that subs exist)
The match is great to watch but you make no decisions once it kicks off. Add deterministic,
pre-kickoff decision layers so *your calls* shape it.
- **Team talk (pre-match + half-time).** Choose a tone (calm / fire them up / demand focus) →
  a bounded, deterministic morale/form nudge applied to the snapshot; the *right* talk depends on
  form/opponent/stakes (like the career scenarios). Post-match the report reacts to it. *🟡*
- **Match plan / instructions.** Pre-set conditional orders the deterministic engine executes:
  "if leading after 70', shut up shop (line −1)", "if losing at half, throw on the sub striker",
  "target their slow left-back". Turns tactics from static into *a plan*. *🟡 (engine reads a plan)*
- **Pre-match press conference.** 2–3 seeded questions (about form, a rival, a star's future); your
  answer nudges squad morale + fan mood deterministically. Pure narrate.ts reuse. *🟢/🟡*
- **Post-match reaction & headlines.** A seeded press headline + a board/fan reaction line keyed to
  the result vs expectation — the manager-side twin of the career epilogue. *🟢 (narrate reuse)*

## Theme 3 — Squad as people (pros are static after graduation)
Once a prospect graduates, the pro barely changes. Give the manager living squad management.
- **Training focus + slow development.** Each season assign a training focus; pros gain small,
  **capped** stat drift (tied to the Training facility + age curve — young improve, old decline).
  Makes the Training facility matter and squads evolve. *🟡 (pre-season deterministic step)*
- **Squad roles & hierarchy.** Assign roles (captain, key player, rotation, prospect); mismatches
  (a star made a benchwarmer) drop morale; the captaincy gives a small leadership boost. Reuses
  morale + the leadership mental. *🟢/🟡*
- **Player unhappiness & transfer requests.** Low morale (benched, no new contract, club too small
  for his ambition/greed) → **transfer request** → sell or bring him round with a promise/role.
  Reuses greed/marketability/morale already on the token. *🟢*
- **Player form (rolling).** A visible form arc per player from recent match ratings (derive from
  the stats I just added) that feeds a small pre-kickoff nudge — hot streaks/cold spells. *🟢/🟡*

## Theme 4 — The season as a story
Make a season a narrative, not just a table.
- **The Gaffer's Diary / season feed.** A seeded, chapter-by-chapter narrative of *your* season —
  the good run, the derby loss, the injury crisis, the title run-in — composed from real match
  data. **Direct reuse of the career narrate.ts engine, pointed at the manager season.** *🟢*
- **Rivalries & derby days.** Auto-designate a pod rival (nearest-rated / repeat opponent); those
  fixtures are "big matches" (extra stakes, bigger board/fan swing, a headline). Reuses the stakes
  concept from the career game. *🟢/🟡*
- **Form guide + run-in tension.** A WDWLW form strip, a "X games unbeaten" tracker, and a
  title/promotion/relegation **run-in** callout in the last few fixtures. *🟢*
- **Club records & milestones.** Biggest win, longest unbeaten run, top scorer ever, most apps —
  a records page that grows, plus a beat when one falls. *🟢*

## Theme 5 — Finances & club-building
Finance is currently just coins in/out. Make budgeting a real lever.
- **Wage bill & budget split.** A season budget split between **transfer** and **wage** pots; big
  contracts eat the wage pot; overspend = board pressure / a fine. Reuses contract costs + morale.
  *🟢/🟡*
- **Sponsorship tiers & deals.** Choose a sponsor deal each season (safe flat cash vs
  performance-linked bonuses); links to results. Extends the Commercial facility. *🟢*
- **Ticket pricing.** Set home ticket price: higher = more gate but lower fan mood / attendance if
  you're losing. A small recurring decision. *🟢/🟡*
- **Financial objectives.** The board also judges you on finances (don't run at a loss), a second
  axis of pressure beside results. *🟢*

## Theme 6 — Club identity & world
- **Club customisation.** Name, nickname, colours, stadium name — cosmetic identity you own.
  Colours already flow to the pitch kit. *🟢*
- **Club philosophy.** A club culture (e.g. "attacking", "youth-first", "defensive rock") that sets
  *fan/board expectations of how you play*, not just results — playing against type costs mood even
  when winning. *🟡*
- **Fan mood.** A standalone fan-happiness meter driven by results + style + ticket price + star
  signings, feeding the Fan Zone home edge. *🟢/🟡*

## Theme 7 — Backroom & recruitment depth
- **Backroom staff.** Hire an **assistant manager** (suggests lineups/opposition intel), **coaches**
  (boost training focus areas — mirror the *career* game's coaches on the manager side), a **head
  scout** (auto-shortlist). Reuses the coach concept + facilities. *🟡*
- **Shortlist / watchlist.** Track scouted players/opponents' stars across seasons; get alerted
  when one is available/declining in value. *🟢*
- **Loan system for pros.** Loan a fringe pro out for development/wages, or loan one in — extends
  the existing trial-academy loan concept to owned pros. *🟡*
- **Contract negotiation depth.** Beyond extend/sell: wage vs length vs release-clause levers,
  loyalty vs greed (already on the token) driving the ask. *🟢/🟡*

---

## Build-these-first (opinion)
1. **Board objectives + job security + sack race** (Theme 1). *The* transformer — makes every match
  matter and creates the manager career loop. Pure off-chain aggregation, 🟢.
2. **The Gaffer's Diary + press/board reactions** (Themes 4 & 2). Enormous immersion for low effort
  — it's the career narrate.ts engine repointed at match/season data. 🟢.
3. **Team talk + match plan** (Theme 2). Gives the manager real *decisions* on matchday now that the
  engine has subs — deterministic, pre-kickoff. 🟡.

That trio turns "pick a lineup, watch a match" into "live a manager's career at a club, with
pressure, a voice, and decisions that matter" — reusing systems that already exist.

## Architecture-fit key
- **🟢 little/no plumbing** — aggregation over existing data + seeded text (board, diary, records,
  rivalries, form, reputation, unhappiness, fan mood, club identity).
- **🟡 one pre-kickoff modifier** baked into the seeded snapshot, or a small new decision surface
  (team talk, match plan, training focus, manager/club traits, backroom staff).
- **🔴 bigger subsystems** — none strictly required; the highest-impact wins are 🟢/🟡. A full
  club-level youth-intake pipeline would be 🔴 but the career game already covers "develop players".

---

## Research-informed depth roadmap (2026-08, from the well-known manager games)
Curated from FM (training/roles/scouting/staff/morale/media) + the genre's most-loved loop (dynasty +
youth development), filtered to our frame: **owner-manager dynasty, offline, coin economy, text-driven
matches.** (Web3 is removed — "players", not NFTs — but the owner-manager frame above still holds: no board /
sack / budgets.) This is the **manager agent's roadmap** — judge each by the growth-and-content-strategy
content bar (a new interacting/trade-off decision, not a reskin).

### 🥇 The core four (highest leverage — extend the dynasty/development loop into the manager half)
1. **Per-player training focus** — target specific stats to develop a 25+ pro (the coaching-focus idea).
   Turns manager "care" into concrete choices; deterministic + calibration-safe.
2. **Named player roles** — expand duties into FM-style roles (inverted full-back, pressing forward,
   deep-lying playmaker, ball-playing defender, false 9) that change match behaviour. Re-verify bands.
3. **Backroom staff hired with coins** — assistant (auto-suggestions), fitness coach (fewer injuries),
   scouts (better prospects), analysts (opponent intel), physio (recovery). A new management layer + coin sink.
4. **Mentoring** — pair a veteran with a youngster → transfers a little stat/personality/trait. Deepens the
   squad and the bloodline story.

### ⚙️ Tactics & match depth
5. Team talks (pre-match / half-time) → morale → performance (text-friendly).
6. Set-piece routines (designed corners/free-kicks, beyond just takers).
7. Richer pre-match hub — opponent strengths/weaknesses/form (build on scouting cards).

### 👥 People & morale
8. Player morale/happiness with playing time, form, role — unhappy stars underperform (never demand to leave).
9. Player conversations (praise / challenge) → morale + a development nudge.
10. Leadership core / captaincy effects — surface the impact of captains.

### 📰 Club story & immersion (the "story development" thread)
11. Press conferences / media moments — FM-style choices that sway morale & reputation, mirroring the player
    career's life events. The **Gaffer's Diary** is the seed.
12. Rivalries & milestones — derbies, records, streaks (flavour, no sack risk — fits owner-manager).

### 🏆 Structure & finances
13. Club reputation/prestige growth (`managerPrestige`) → unlocks better prospects/staff.
14. Club finances — gate/sponsor income (facilities already have this) → reinvest coins into facilities/staff/youth.
15. More competitions — super cup, continental, friendlies (fitness).

### 🎮 ✅ SHIPPED (2026-08-27, match-engine/tactics agent) — beyond the core four
- **Seeded opponent tactical profiles** — every single-player opponent (league/continental/World-Finals)
  used to play flat `DEFAULT_TACTICS` 4-4-2 regardless of who they were. Now each opponent's club seed
  deterministically picks one of the already-proven `TACTIC_PRESETS` (Gegenpress/Park the Bus/Tiki-Taka/
  Route One/Counter/Balanced) as its stable identity for the whole save — same club always plays the
  same way, but different clubs genuinely feel different. Zero new tactical math (reuses presets already
  balanced by the anti-spam gate), so calibration is untouched by construction. `seededOpponentTactics()`
  in `shared/src/tactics.ts`; wired into all 3 SP fixture-creation sites in `client/src/main.ts`. Proven
  by a new `strategy_test.ts` assertion: 40 seeded opponents → 6 distinct profiles, fully deterministic.

- **Offside trap** — a new off-by-default INSTRUCTION (`Tactics.offsideTrap`, only live with a high/very-high
  line). The back line steps up together on a through-ball, so a receiver needs a real pace edge to spring
  it clean — a marginal one gets caught. A real toggle in the lineup editor (hints "needs high line" until
  the line slider is raised). Contained entirely to `beatsLastDefender()` in `shared/src/engine.ts`, so it
  can't interact with the counter-attack/foul system; off by default means every existing preset/DEFAULT_TACTICS
  match is bit-for-bit unchanged. Proven in `strategy_test.ts`: against an ordinary-pace direct attack, a high
  line with the trap armed concedes ~34% fewer clear-cut breakaway chances than a plain high line (6579 → 4373
  over the harness). (An earlier "tactical fouling" instruction tied to the counter-attack flag was tried and
  reverted — the existing "committed high → counter" trigger fires far more often than a real fast break, so
  widening the foul chance during it caused a runaway spike in cards and free-kick goals; offside trap avoids
  that system entirely.)

- **Wing-Back duty** — a new named DF duty (`shared/src/duties.ts`) alongside cover/stopper/ball-playing
  defender/inverted full-back: a fullback who bombs forward as an auxiliary winger. Adds a new `hug` field
  to `DutyMods` (stretches the player's lateral anchor offset outward while attacking instead of narrowing
  it) so a duty can genuinely change a player's WIDTH on the pitch, not just push/press/shoot/magnet —
  reusable by any future wide-role duty. Proven in `strategy_test.ts`: vs a narrow back four, wing-back
  fullbacks edge possession above cover-duty fullbacks (45.4% vs 44.8% over the harness) — the extra flank
  presence gives the side a genuine out-ball. (Team *shots* were tried first as the proof metric and didn't
  hold — pushing fullbacks forward pulled some pass-attractiveness away from the strikers who actually
  finish, netting fewer shots despite more presence; possession share is the honest, provable effect here.)

- **New formation: 4-1-4-1** — a holding-mid shield + a lone striker, added to `shared/src/formations.ts`
  (+ `SLOT_ROLES`/`FORMATIONS` in `client/src/main.ts`). A genuine trade-off, not a strict downgrade: one
  fewer forward than a 2-up-top shape costs it head-to-head against orthodox two-striker formations
  (loses to 4-4-2 and 4-5-1 in testing), but 3 of its 5 MF anchors sit centrally (vs 2 of 4 in 4-4-2),
  which wins the central battle against an equally narrow rival — it beats the 4-1-2-1-2 diamond
  head-to-head (28W-25L over the harness), proven as a new `strategy_test.ts` assertion. A "control the
  middle, sacrifice a striker" pick for the formation menu.

- **Two more conditional match-plan orders** — `blowout-lead` ("3+ up after 55′" → total shutdown: mentality/
  tempo/press all −2) and `chase-ht-big` ("2+ down at half-time" → maximum push: mentality/line/tempo +2,
  press +1), added to `MATCH_PLAN_RULES` in `client/src/main.ts`. Pure data alongside the existing 5 rules —
  reuses the already-proven `setTactics`/clamp mechanism, so no engine change and no new calibration risk.
  When both a milder and a more extreme rule's conditions hold at once (e.g. losing by exactly 2 at HT
  matches both `chase-ht` and `chase-ht-big`), the later rule in the array wins since each computes its
  shift from the fixed kickoff tactics — array order was chosen so the more drastic reaction overrides.

### 🎮 ✅ SHIPPED (2026-08-27, batch 2) — more formations/roles/instructions
- **Sweeper DF duty** — a new named DF duty: covers space and steps forward to intercept rather than
  engaging in duels (lowest press of any DF duty, extra `come` to link the build-up as an auxiliary
  passing outlet). Proven in `strategy_test.ts`: concedes fewer goals to a direct attack than both
  stopper (1.30 vs 1.60/match) and the existing cover duty (1.30 vs 2.18/match) — discipline and
  positioning beat both raw aggression and passive sitting-off.
- **Anchor MF duty** — a new named MF duty: pure destroyer who never strays from screening the back four
  (lowest push, highest press of any MF duty, and a negative magnet so play doesn't get funnelled through
  him as an out-ball). Proven in `strategy_test.ts`: concedes fewer goals vs a direct attack than
  ball-winner (1.78 vs 1.82), box-to-box (1.78 vs 2.02).
- **Inverted-Winger FW duty** — a new named FW duty for a wide forward slot (3-4-3/4-3-3's wide FW):
  cuts inside off the touchline (negative `hug`, reusing the width dimension added for wing-back) onto
  a more central role instead of hugging the line. Proven in `strategy_test.ts`: edges team possession
  up vs a wide poacher (52.4% vs 47.7% against a plain back four) — the extra central passing/creation
  presence outweighs losing the out-and-out width. (Team shots/goals were tried first and didn't hold —
  crowding the centre stole space from other central attackers rather than adding net chances;
  possession is the honest, provable effect.)
- **Play Out From The Back instruction** — a new off-by-default toggle, `Tactics.playOutOfDefence`: when
  the keeper has the ball, always pick the safest short option regardless of the tempo slider. Contained
  entirely to the one `pickPassTarget()` decision where `playerIdx === 0` (the keeper), so it can't touch
  anything else. Proven in `strategy_test.ts`: (a) neutrality — `playOutOfDefence: false` reproduces the
  *exact* goal tally of the field being absent entirely (bit-for-bit, not just "close"); (b) effect —
  armed vs a high-press side, concedes fewer goals (0.92 vs 1.03/match) by avoiding risky giveaways right
  off the keeper's distribution. A real toggle in the lineup editor.
- **Attack-Focus instruction (wide/central)** — a new toggle, `Tactics.attackFocus: 'wide' | 'central'`
  (unset = neutral, bit-for-bit unchanged — proven), biasing which teammate the ball gets played to.
  Genuine rock-paper-scissors with the formation underneath it: a WIDE formation (3-4-3) already floods
  the flanks, so doubling down with wing focus overshoots into areas too wide to shoot from — CENTRAL
  focus consolidates it into more shots (23.7 vs 18.8/match, proven in `strategy_test.ts`). A NARROW
  formation (4-1-2-1-2 diamond) has no width of its own, so WIDE focus finds space the shape doesn't
  natively offer (23.5 vs 22.4/match) — the *opposite* correct answer for the *same* instruction,
  depending on the shape it's paired with. Real 3-way selector in the lineup editor.
- **Wide-Playmaker MF duty** — a new named MF duty for a wide midfield slot: hugs the touchline
  (positive `hug`) but dictates play from out there (high magnet, moderate shoot, low press). Proven in
  `strategy_test.ts`: generates more team shots than both box-to-box (38.3 vs 36.1) and ball-winner
  (38.3 vs 36.8) in the same wide slot. (Possession share was tried first vs both rivals and came back
  flat — a wide MF's press setting feeds back into how fast the *team* wins the ball back elsewhere,
  which roughly cancels out any passing-magnet gain; shots is the metric that actually moves.)
- **New formation: 4-2-2-2** — a back four behind a narrow double-pivot + double-ten box midfield and
  two strikers. The tightest MF spread of any formation in the pool, so it loses width battles against
  most shapes (an earlier attempt, 3-4-1-2, was tried and dropped — no formation in the pool could beat
  it net, so it added no real strategic option; 4-2-2-2 at least has one clean edge). Proven in
  `strategy_test.ts`: it beats 4-1-4-1's own narrow, lone-striker shape by fielding two strikers instead
  of one (23W-20L). A situational, not all-purpose, pick.
- **New formation: 5-4-1** — back five + one striker, added to `shared/src/formations.ts` + client
  `FORMATIONS`/`SLOT_ROLES`. Unlike 4-1-4-1/4-5-1 (a repositioned midfielder pretending to be defensive),
  this is a REAL extra defender, so it genuinely concedes fewer goals to a direct attack: proven in
  `strategy_test.ts` — 5-4-1 concedes 1.70/match vs a direct (mentality+1/tempo+2) attacker, vs 1.82 for
  4-4-2 and 2.62 for the lone-midfielder-heavy 4-5-1. Cost: a lone striker up top.

**Guardrails (unchanged):** deterministic (no wall-clock/Math.random in shared/), `npm run verify` green with
every engine-touching change (paste before/after calibration in the commit), one item per commit, fair not
grindy, legible cause→effect. Sources: FM24 (Goal.com, Most Wanted Gamers), Goomba Stomp, gmgames.org.
