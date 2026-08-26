# Manager-game depth — brainstorm (current-state, 2026-08)

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
