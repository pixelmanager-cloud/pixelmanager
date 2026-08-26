# Immersion ideas — making Football Royalty feel like a *real club*

Status: **proposal / pick-list**. A menu of ways to close the gap between "I pick a
lineup and watch a sim" and "I *manage a football club*." Nothing here is a
commitment — the human picks what becomes a backlog task. Skim the tables, read the
"why it's immersive" column, then jump to the [shortlist](#if-you-build-three-things-first).

**Grounding docs:** [`README.md`](../README.md) (engine + roadmap),
[`async-pvp-phase1.md`](./async-pvp-phase1.md) (async-PvP loop, standing orders, Elo),
[`seasons-and-divisions.md`](./seasons-and-divisions.md) (seasons, 10-tier pyramid,
~20-club pods, promotion/relegation, honours), [`economy-and-web3.md`](./economy-and-web3.md)
(token economy principles), [`game-upgrade-ideas.md`](./game-upgrade-ideas.md)
(fun + consumables pick-list; this doc is the *immersion* companion to it).

## Where the game is today (one-paragraph recap)

Deterministic, seeded match engine in `@fm/shared` (8 stats 1–20, formation + 5
tactic sliders, per-player **fitness** drain, per-player **duties**). The competitive
path is **locked/reveal at kickoff, no half-time, no subs** — a match is a pure
function of pre-kickoff inputs. Async PvP resolves absent opponents via **standing
orders**. Live: **seasons** (7-day), a **10-tier division pyramid** with **~20-club
pods**, promotion/relegation, an **honours** board, per-season **fixtures**, and
**handle+password** accounts. The engine ships `generateClub`/`generateTeam` (seeded),
`makeRng(seed)`, `duties.ts`, `teams.ts`. **There is no LLM anywhere and there won't
be** — every word of "generated" text is deterministic template + seeded selection.

## The non-negotiable constraints every idea here respects

- **Determinism.** Anything that touches a match result must be an input to
  `simulate(...)` fixed **pre-kickoff**. No `Date.now()`, `Math.random()`, wall clock,
  or network in `shared/`. Matches stay a pure function of `{teams, tactics, duties, seed}`.
  Non-match flavour (news, morale text) may live server/client-side, but if it's in
  `shared/` it must be seeded.
- **NO LLM.** All "press conference", "commentary", "news" text is built from **fixed
  templates** with slot-fills chosen by a **seeded** index (`makeRng`) from match/season
  facts. Deterministic, reproducible, auditable, cheap. This is a feature, not a
  limitation: the same match always tells the same story.
- **No in-match consumables / no subs / no half-time.** Morale, form, injuries,
  suspensions, staff — all resolve **before kickoff** and fold into the snapshot the
  engine reads. Nothing changes a match once it's running.
- **No pay-to-win.** Anything the economy later monetises must be **matchmaking-neutral**
  (cosmetic/narrative) or **capped + folded into squad rating** so buyers meet buyers
  (per `economy-and-web3.md`). Immersion features are overwhelmingly the *safe* kind:
  they add feeling, not power.

Effort key: **S** = client/CSS/copy or a small server field · **M** = server logic +
schema + tests, or a seeded `shared/` helper · **L** = a new subsystem.

Architecture-fit key: **🟢 fits today** (rides async-PvP / seasons / pods / duties with
little friction) · **🟡 light new plumbing** · **🔴 new subsystem**.

---

## 1) Club identity & world

Give the club a face and a place. Almost all of this is persistent server state +
client rendering — **zero match-engine risk**, and it's the surface everything else
(honours, rivalries, cosmetics) hangs off.

| Idea | What it adds | Why it's immersive | Effort | Fit | Touches / constraints |
|---|---|---|---|---|---|
| **Crest + kit customiser** | Pick crest shape/emblem/colours and home/away kit from a seeded palette; rendered on sprites, hub, and match view. | Your club stops being a name string and becomes *yours* — the single cheapest "this is my club" win. | **S–M** | 🟢 | `client/src/pixelart.ts`, `main.ts`; store `colors`/crest on Club (already have `colors`). Cosmetic → matchmaking-neutral. |
| **Home city + club identity** | Assign a home city/region + founding year at creation; show "Est. 1982 · Northgate" on the club page. | A club from *somewhere* with a history feels real; seeds derby/rivalry logic later. | **S** | 🟢 | `store*.ts` (extra columns), `client/main.ts`. Pure flavour; no engine. |
| **Club history & lore ledger** | Auto-written, append-only club timeline: "Founded S1 · Promoted to COUNTY S3 · Champions of Pod 2 S7." Built from existing `honours` rows. | Turns the honours board into a *story you lived*; scrolling your own history is pure manager pride. | **S–M** | 🟢 | Reads `honours`/`pod_members` already in `seasons-and-divisions.md` model; render in `client/main.ts`. Deterministic (facts → template). |
| **Stadium (named, growing)** | A named ground with a capacity that ticks up with league tier; shown on the club page and as the match backdrop. | "Welcome to *Ironworks Park*, capacity 12,400" — a home worth defending. Capacity feeds crowd/finance later. | **M** | 🟡 | `store*.ts` (stadium name/capacity), `client/main.ts` + match backdrop. Capacity is a pre-kickoff input if it ever affects atmosphere; keep it cosmetic until then. |
| **Persistent rivalries** | Flag repeat opponents + same-city clubs as rivals; a "🔥 DERBY" banner on those fixtures, tracked head-to-head record. | The fixture list gets *stakes* — you don't want to lose to *them*. Async-PvP already stores every pairing. | **M** | 🟢 | `server/game.ts` (derive from match history + city), `client/main.ts`. Data-only; no engine change. |
| **Club motto / anthem line** | A short seeded club tagline shown on load ("They never quit at the Park"). | Micro-flavour that makes the club feel authored. | **S** | 🟢 | `client/main.ts`, seeded from club id. |

---

## 2) The manager's world

Make *you* a character with a job to keep. This is the biggest lever for the "real
manager" feeling and it plugs straight into seasons/pods. Text is **template + seeded**,
never LLM.

| Idea | What it adds | Why it's immersive | Effort | Fit | Touches / constraints |
|---|---|---|---|---|---|
| **The board + season expectations** | At season start the board sets a target from your tier/pod ("finish top 8, don't get relegated"). Shown on the hub. | A boss with expectations reframes every match as *your job*, not a sandbox. | **M** | 🟢 | `server/seasons.ts`/`game.ts` (derive target from tier + rating), `client/main.ts`. Pure bookkeeping around existing standings. |
| **Confidence / job-security meter** | A board-confidence bar that moves with results vs expectation; hitting zero triggers a "final warning" / "sacked" narrative (soft — you keep playing, but it's a stakes beat). | Job security is *the* football-manager tension. Cheap to compute from data you already have (results vs target). | **M** | 🟢 | `server/game.ts` (deterministic function of results + expectation), `client/main.ts`. No engine, no RNG needed. |
| **Pre/post-match press conferences** | 2–3 canned questions with a few tone choices (calm / bullish / defensive); your pick nudges **morale** (see §3), and the presser text is template-filled from match facts. | Being *asked about* the derby and answering makes you the gaffer, not a spectator. | **M** | 🟡 | `client/main.ts` UI + `server/game.ts` (store choice → morale delta pre-kickoff). Text = fixed templates + seeded slot-fill (NO LLM). Morale applies **before** next kickoff. |
| **Media narrative / match previews** | Auto "big match preview" and "reaction" blurbs on the fixture and result — "Bottom side host runaway leaders." | Frames fixtures with drama the bare scoreline can't. | **M** | 🟢 | `server/game.ts` + `client/main.ts`; template chosen by a **seed derived from match id** so it's stable on replay. |
| **Per-season objectives (manager track)** | A handful of concrete goals for the season ("beat a top-3 side," "unbeaten home run") with progress + a season-end grade. | A checklist of *manager* achievements gives every match a second reason to care. | **M** | 🟢 | `server/game.ts` (track), `client/main.ts`. Extends the daily-objectives idea in `game-upgrade-ideas.md §3`. |
| **Manager profile & reputation** | Persistent career record (titles, promotions, win%, "reputation" tier) that carries across seasons and shows on your club page + leaderboard. | Long-term identity — you're building a *career*, not a save file. | **S–M** | 🟢 | small server counters + `honours`; `client/main.ts`. |

---

## 3) Squad as people

Eleven stat-blocks → eleven characters. The rule that keeps this legal: **every
person-effect is a pre-kickoff input** (morale/form/injury/staff bonus fold into the
snapshot `simulate` reads), and any seeded randomness lives outside `shared/` or uses
`makeRng` with a stored seed. **No in-match effects, ever.**

| Idea | What it adds | Why it's immersive | Effort | Fit | Touches / constraints |
|---|---|---|---|---|---|
| **Morale & form** | Per-player morale (dressing-room mood) and form (recent-match rolling rating) that apply a **small, capped** pre-kickoff modifier to effective stats. | Players who feel like they have *good and bad spells* read as human, and reward man-management. | **M** | 🟡 | `server/game.ts` computes morale/form from match history → stat delta baked into the pre-kickoff snapshot. Engine reads stats unchanged. **Cap it** so it never becomes p2w; **fold into squad rating** for matchmaking. |
| **Player personalities** | An immutable seeded personality per player ("leader," "hothead," "big-game player," "loyal") shown on the squad screen; influences morale reactions and press outcomes. | Names + numbers + *temperaments* = a squad you know, not a spreadsheet. Maps cleanly to future NFT metadata. | **M** | 🟢 | seeded in `shared/src/teams.ts` (`makeRng` at generation) — deterministic, no live RNG. Reactions computed server-side. Ties to §1 traits idea in `game-upgrade-ideas.md`. |
| **Dressing-room relationships** | Seeded friendships/tensions between squad members; selling a leader or benching a clique member dents morale; a "harmony" readout. | The squad becomes a *social system* you steward — the heart of the manager fantasy. | **L** | 🟡 | seeded graph in `teams.ts`; morale resolution in `server/game.ts` (pre-kickoff). Deterministic; no engine change. |
| **Backroom staff** | Hire an assistant / coaches / physio / scout that give **capped, pre-kickoff** bonuses (faster fitness recovery between rounds, better morale management, sharper scouting reports). | Building a *team behind the team* is core manager depth; a clean recurring token sink later (staff wages). | **L** | 🟡 | `server/store*.ts` (staff), `server/game.ts` (apply bonuses pre-kickoff). Recovery/scouting only — nothing that touches a live match. Cap + rating-count any that affect strength. |
| **Ageing & development across seasons** | Players gain/lose stats slowly between seasons (youth rise, veterans decline) via a **seeded** per-season progression at rollover; a youth intake each season. | Watching a wonderkid you developed become a star across seasons is deep, long-arc immersion. | **L** | 🔴 | rollover job in `server/seasons.ts` mutates roster; progression uses `makeRng(seasonSeed)` — deterministic + auditable. Respects "base players free / NFT stats immutable-base" by only moving the mutable game-layer. |
| **Injuries & suspensions (pre-kickoff only)** | Seeded chance of a knock or a suspension (from bookings) that rules a player **out of an upcoming fixture** — decided *before* kickoff, never mid-match. Forces squad rotation. | Selecting around who's *available* is a real weekly management problem; adds depth to the ~20-man roster. | **M** | 🟡 | resolved in `server/game.ts` at fixture-generation time (before lineup lock) using a stored seed; the match snapshot simply lacks that player. **Never** an in-match consumable — respects no-subs/no-half-time and commit-reveal (availability is a pre-kickoff input). |
| **Captaincy** | Name a captain (nudged by leadership personality); small pre-kickoff morale/leadership effect + narrative ("the skipper leads them out"). | A named leader you chose personalises the XI. | **S–M** | 🟢 | store captain id; pre-kickoff modifier + press/commentary hook. |

---

## 4) Matchday atmosphere

Make the 90 minutes *feel* like a match. **All client-side** on top of the deterministic
event stream — **zero engine risk, zero economy risk** — so it's pure upside. Deeper
commentary overlaps `game-upgrade-ideas.md §2`; this section is its immersion lens.

| Idea | What it adds | Why it's immersive | Effort | Fit | Touches / constraints |
|---|---|---|---|---|---|
| **Living crowd** | Pixel crowd whose size/colour reflects stadium capacity + tier, reacts to goals/chances (roar, groan), and swells for derbies. | A full, reactive stand is the difference between "a sim" and "a match." | **M** | 🟡 | `client/pixelart.ts`, `main.ts`; reads capacity (§1) + event stream. Purely visual — capacity is a cosmetic input unless it ever feeds the sim (then pre-kickoff only). |
| **Contextual commentary** | Commentary that names players, tracks momentum and story ("third shot in five minutes," "the skipper drags them back into it"), and knows the stakes (title race, relegation six-pointer). | Narration that *understands the game* makes a headless sim gripping. | **M** | 🟢 | `client/main.ts` reads the deterministic event log; template + seeded phrasing (NO LLM). Same match → same commentary. |
| **Rising tension / late-game drama** | Music/vignette/zoom intensify late in a tight game; "nervy final minutes" beat; injury-time flag. | Manufactures the knot-in-the-stomach of a close finish — the emotional core of matchday. | **S–M** | 🟢 | `client/main.ts` (Phaser cameras/audio) from score + clock. Cosmetic. |
| **Narrative moments** | Detect and caption story beats from the event stream — hat-trick, comeback from 2 down, last-minute winner, clean sheet by a shaky defence. | The match *tells you its story* as it happens; these become shareable highlights. | **M** | 🟢 | `client/main.ts` (pattern-match the event log); feeds §5 news feed + post-match card. Deterministic. |
| **Manager touchline presence** | A tiny manager sprite in the technical area reacting to events (arms up on a goal, head in hands on a miss). | Puts *you* in the frame — you're at the match, not above it. | **S** | 🟢 | `client/pixelart.ts`, `main.ts`. Cosmetic. |
| **Teamtalk / body language readout** | Pre-kickoff, a one-line seeded "mood of the squad" from morale (§3); post-match, a reaction line. | Bookends the match with the *human* state of your team. | **S** | 🟡 | needs §3 morale; `client/main.ts` template text. |

---

## 5) Narrative & continuity

Stitch isolated matches into a *season you remember*. This is mostly a data/aggregation
layer over things the game already stores — high immersion-per-effort.

| Idea | What it adds | Why it's immersive | Effort | Fit | Touches / constraints |
|---|---|---|---|---|---|
| **Inbox / news feed** | A hub inbox aggregating board messages, press, results, milestones, rivalry taunts, injury news, transfer/youth notes — the daily "what's happening at my club." | The single strongest "I run a living club" surface; a real reason to log in daily. | **M** | 🟢 | `server/game.ts` (compose items from existing events), `client/main.ts`. All items = templates over stored facts (NO LLM). |
| **Season storylines** | Track and surface arcs: a title race, a relegation battle, an unbeaten run, a bogey team, a nemesis chasing you up the pyramid. | Ongoing threads make the season a *narrative*, not 19 disconnected fixtures. | **M** | 🟢 | `server/game.ts` derives arcs from pod standings + results (both already pod-scoped). Deterministic. |
| **Milestones & career moments** | Mark firsts and landmarks — first win, first promotion, 50th goal, 100th match, first derby win — with a dated card in club history + inbox. | Personal landmarks you *earned* are sticky and pride-inducing. | **S–M** | 🟢 | small server counters + `honours`; `client/main.ts`. Extends `game-upgrade-ideas.md §3` achievements. |
| **Cross-season rivalries** | Rivalries (§1) that persist and evolve across seasons — a promotion race that became a grudge, a club that always beats you. | Continuity across seasons is what turns a game into *your club's story*. | **M** | 🟡 | persist rivalry state in `store*.ts`; surface in inbox + fixtures. Data-only. |
| **End-of-season review** | A wrap card: final table, board grade vs expectation (§2), player of the season, top scorer, best win, the season's story in three beats. | A satisfying full-stop that makes the *next* season feel like a fresh chapter. | **M** | 🟢 | `server/seasons.ts` rollover already runs; add a review payload; `client/main.ts`. Template over final facts. |
| **Hall of fame / legends** | Retire long-serving players (via §3 ageing) into a club legends list. | Long-arc attachment — "he gave us ten years." | **S–M** | 🔴 | depends on §3 ageing; `store*.ts` + `client/main.ts`. |

---

## 6) Finances & club-building

The manager's ledger. Framed to slot into the **future** token economy *without*
pay-to-win: money is an **in-game currency** earned by performance and spent on
**narrative/soft** upgrades; anything touching match strength stays **capped + rating-
counted** per `economy-and-web3.md`. Build the fun loop first with valueless in-game
coins; the token layers on later.

| Idea | What it adds | Why it's immersive | Effort | Fit | Touches / constraints |
|---|---|---|---|---|---|
| **Club budget & finances** | An in-game money balance: prize money by finish, gate receipts from crowd/capacity, running costs. A simple balance sheet on the club page. | Balancing the books is a core manager job and gives every result a second (financial) consequence. | **M** | 🟡 | `server/store*.ts` (balance), `server/game.ts` (credit/debit at match/rollover). In-game currency only until the token layer; no real value on testnet. |
| **Wages & squad cost** | Players carry wages; a wage bill you must keep under a budget; overspending has (soft) consequences. | Squad-building becomes a *trade-off*, not "collect the best" — the essence of management. | **M** | 🟡 | `store*.ts` (wage field, seeded from stats), `server/game.ts`. Deterministic; matchmaking unaffected (money ≠ power). |
| **Sponsors** | Seeded sponsor offers (shirt/stadium) that pay in-game money for meeting targets; shown on the kit (ties to §1). | A grown-up club has backers; targets add goals; sponsor logos personalise the kit. | **M** | 🟡 | `server/game.ts` (seeded offers from tier/reputation), `client/pixelart.ts` for logo. Cosmetic + currency; no engine. |
| **Facilities / infrastructure** | Spend money to upgrade **training** (faster fitness recovery / youth development), **stadium** (capacity → gate + crowd), **medical** (fewer injuries). All effects **pre-kickoff/between-round**. | Investing in the club's future is deeply satisfying and creates the recurring-spend loop the economy wants. | **L** | 🔴 | `store*.ts` + `server/game.ts`; every effect applies **between rounds**, never in-match. Any strength effect **capped + rating-counted**; most are recovery/development (restore-not-exceed → not p2w). |
| **Transfers / free-agent market** | A simple market to sign released/youth players with your budget (no live opponents' squads needed for MVP). | Reshaping *your own* squad is the headline management activity most other features feed. | **L** | 🔴 | new subsystem: `store*.ts` (ownership moves), `server/game.ts`; seeded valuations. Big — sequence after morale/finances exist. |

---

## Fit summary — what rides today vs what needs new plumbing

- **🟢 Fits the current architecture with little friction** (data/aggregation over
  seasons/pods/async-PvP + client rendering; no engine change): crest/kit, home city,
  history ledger, rivalries, the board + expectations + confidence meter, media previews,
  per-season objectives, manager profile, personalities (seeded at generation),
  captaincy, contextual commentary, tension/narrative moments, touchline sprite, **inbox/
  news feed**, storylines, milestones, end-of-season review.
- **🟡 Light new plumbing** (a pre-kickoff modifier baked into the match snapshot, or a
  small schema addition): stadium/capacity, press conferences, morale & form, dressing-
  room relationships, backroom staff, injuries/suspensions, living crowd, budget/wages/
  sponsors, cross-season rivalries.
- **🔴 New subsystem** (real design + build): ageing/development + youth intake, hall of
  fame, facilities/infrastructure, transfer market.

Everywhere text is "generated" it is **template + seeded slot-fill** — reproducible, no
LLM. Everywhere a person-state (morale/form/injury/staff/facility) touches strength, it
is applied **pre-kickoff**, **capped**, and **folded into squad rating** so the match
stays a pure, matchmaking-fair function of its inputs.

---

## If you build three things first

Opinionated shortlist — the highest immersion-per-effort that rides what already exists
and compounds into everything else:

1. **The board: season expectations + confidence/job-security meter** (§2, **M**, 🟢).
   This is *the* manager-fantasy switch. It's pure bookkeeping over standings you already
   compute (target from tier/pod, confidence from results-vs-target), needs no engine
   change and no RNG, and instantly reframes every fixture as "my job on the line." Best
   feeling-per-line-of-code in the doc.

2. **Inbox / news feed with season storylines + narrative match moments** (§5 + §4, **M**,
   🟢). One hub surface that aggregates board messages, results, milestones, rivalry beats
   and auto-detected story moments (comebacks, last-minute winners) into "what's happening
   at my club." It's a daily return hook *and* the home for everything else you add later —
   all template-over-stored-facts, no LLM, deterministic on replay.

3. **Club identity: crest/kit customiser + home city + history ledger** (§1, **S–M**, 🟢).
   Cheap, zero engine risk, and it's the emotional foundation — the club becomes *yours*,
   with a place and a past, before you add people and money. The honours board you already
   store becomes a story you scroll.

Then, as the natural follow-ups: **morale & form** (§3, makes press conferences and
teamtalks mean something) and **club budget + wages** (§6, opens the whole club-building
arc). **Personalities** (§3) is a strong bonus pick — seeded at squad generation, it costs
little and makes the news feed and dressing-room ideas land harder.
