# Game upgrade ideas — making Football Royalty more fun (+ token sinks)

Status: **proposal / pick-list**. A menu of ideas to make the game more fun, plus
where token-purchasable consumables could slot into the future web3 layer. Nothing
here is a commitment — the human picks what becomes a backlog task.

**Grounding docs:** [`README.md`](../README.md) (engine + roadmap),
[`docs/economy-and-web3.md`](./economy-and-web3.md) (economy principles),
[`docs/async-pvp-phase1.md`](./async-pvp-phase1.md) (off-chain PvP),
[`docs/web3-implementation.md`](./web3-implementation.md) (on-chain layer).

## Where the game is today (one-paragraph recap)

Deterministic, seeded match engine in `@fm/shared` (8 stats 1–20, formation + 5
tactic sliders, per-player fitness drain). Client renders the sim in Phaser; the
competitive path is **locked/reveal at kickoff, no half-time, no subs** — a match
is a pure function of pre-kickoff inputs. The off-chain async-PvP loop (standing
orders, ranked opponents, season table) is being built *first* to prove it's fun
with **no money on the line**; NFTs + token sinks layer on top later.

## Non-negotiable constraints these ideas respect

- **Determinism.** Anything that affects a match must be applied **pre-kickoff** and
  fold into `simulate(...)` inputs. No `Date.now()` / `Math.random()` / wall clock in
  `shared/`. No in-match consumables (they'd break commit-reveal and the no-subs rule).
- **Economy rules** (from the economy doc): favour **recurring** utility over one-time
  buys; **emissions ≤ sinks**; **base players free / stars are NFTs**; **boosts capped
  at 20**; and **no pay-to-win that matchmaking can't absorb** — squad rating must
  include any boosts so buyers face buyers.
- **Fun-first.** Every consumable must be a *nice-to-have on a fun game*, never the
  reason to play. If it isn't fun on testnet with valueless tokens, it isn't fun.

Effort key: **S** = a slider / CSS / small client change · **M** = engine or server
logic + tests · **L** = a new subsystem.

---

## 1) Gameplay & fun upgrades

Depth and decisions — the manager's craft. These are the highest-leverage for "fun
without money," and they create the *surface* consumables later attach to.

| Idea | What it adds | Rationale | Effort | Touches |
|---|---|---|---|---|
| **Per-player roles** | Assign a role on top of position — target man, playmaker, poacher, ball-winner, sweeper-keeper — that biases that player's in-sim behaviour (e.g. poacher hangs on the last line, playmaker drops to collect). | Turns 11 stat-blocks into 11 *characters*; the single biggest depth-per-effort win and already on the roadmap. | **L** | `shared/src/engine.ts`, `types.ts`, new `roles.ts`; UI in `client/src/main.ts` |
| **Set-piece specialists** | Corners/free-kicks resolve from the assigned taker's passing/shooting vs keeping instead of open-play flow. | Rewards squad-building for a phase the engine currently glosses; visible payoff. | **M** | `shared/src/engine.ts` (add set-piece resolution), `types.ts` |
| **Opponent-reactive tactic presets** | Extend the existing scouting "suggested counter" into 2–3 ranked plans vs the specific opponent shape, each explaining *why*. | Builds on shipped scouting; teaches the sliders instead of hiding them. | **M** | `client/src/main.ts` (scouting report), reads `shared/src/tactics.ts` |
| **Player traits (immutable flavour)** | Small deterministic quirks seeded per player — "big-game player," "slow starter," "wall passer" — that nudge stats by phase/context. | Cheap identity + collectibility; maps cleanly to future NFT metadata. | **M** | `shared/src/teams.ts` (seeded generation), `engine.ts` |
| **Formation depth: fluid shapes** | Let a formation shift between an in-possession and out-of-possession shape (still locked pre-kickoff). | More tactical expression without breaking the no-subs rule. | **M** | `shared/src/formations.ts`, `tactics.ts`, `engine.ts` |
| **Team chemistry / familiarity** | A seeded squad-cohesion factor (same XI played together → small passing/positioning bonus) computed from the lineup, deterministic. | Rewards squad continuity; a natural home for a consumable later (see §4). | **M** | `shared/src/engine.ts`, `teams.ts` |
| **Difficulty / "manager mode" toggles** | Solo-play modifiers (harder CPU, no scouting, ironman season) for the single-player ladder. | Retention for solo players; zero economy risk. | **S** | `client/src/main.ts` |
| **A returning ex-player** | Re-sign a man the club once sold and the game knows it: the listing is marked as a homecoming and the signing narrates as one, instead of as a stranger's first day. | The prose for this was written and then deleted (§97): `transfer_in.established` could never fire, because market ids are minted fresh each season (`mk:season:tier:i`, `hs:season:name`) so a man you sold and re-signed is indistinguishable from a stranger, and the one `transfer_in` emit site passes `seasonsAtClub: 0`. Needs the shop to remember who left. | **M** | `shared/src/transfermarket.ts` (listing identity), `client/src/main.ts` (the `transfer_in` person ctx), a new bank |

---

## 2) Match feel / visual upgrades

Make watching the sim satisfying. All client-only (Phaser/CSS) — **zero engine risk,
zero economy risk** — and they make every other feature feel better. The backlog
already queues several of these (possession bar, GOAL flash, scoreboard pulse).

| Idea | What it adds | Rationale | Effort | Touches |
|---|---|---|---|---|
| **Commentary ticker with context** | Text commentary that names players and reacts to momentum ("keeper scrambles it away," "third shot in five minutes"). | Cheap drama; makes a headless sim feel alive. | **M** | `client/src/main.ts`, reads engine event stream |
| **Player-name + number rendering** | Draw squad numbers / short names on the pixel sprites. | Lets you follow *your stars* on the pitch — essential once NFTs matter. | **S** | `client/src/pixelart.ts`, `main.ts` |
| **Momentum / xG bar** | Live rolling "who's on top" bar derived from chances, next to possession. | Communicates *why* a scoreline is happening; readable skill signal. | **S** | `client/src/main.ts`, `client/index.html` |
| **Camera juice** | Subtle zoom/shake on shots + goals, ball trail, screen flash on goal. | Arcade game-feel; big perceived-quality bump for low effort. | **S** | `client/src/main.ts` (Phaser cameras) |
| **Goal & highlight replay** | Re-tick the seconds around each goal at the end (engine is deterministic, so free to replay). | Shareable moments; leverages the seeded engine at no sim cost. | **M** | `client/src/main.ts` (replay a tick range) |
| **Pitch/kit theming** | Multiple pitch palettes, day/night, weather tint (cosmetic only, no sim effect). | Variety + a clean **cosmetic** token sink later (see §4). | **S** | `client/src/pixelart.ts`, `main.ts` |
| **Post-match summary card** | Stat line (shots, possession, top performer) as a shareable retro card. | Closes the loop emotionally; free marketing when shared. | **S** | `client/src/main.ts`, `client/index.html` |

---

## 3) Progression & retention

Reasons to come back tomorrow. These build the **recurring cadence** the economy
depends on (recurring utility beats one-time buys) and must feel good **before** any
token exists.

| Idea | What it adds | Rationale | Effort | Touches |
|---|---|---|---|---|
| **Seasons with history** | League resets into seasons with a champion, an honours board, and archived tables (roadmap item #1). | The core retention loop; gives leaderboards stakes and a natural reset. | **L** | `server/src/game.ts`, `store*.ts`; hub UI in `client/src/main.ts` |
| **Daily objectives / form streaks** | Light rotating goals ("win with <45% possession," "keep a clean sheet") + a login/play streak. | Habit formation; the hook a **season pass** (see §4) later rewards. | **M** | `server/src/game.ts` (track), `client/src/main.ts` |
| **Divisions / promotion-relegation** | Tie the Elo ladder into named divisions you climb; promotion is a moment. | Clear long-term goal; also the **matchmaking spine** that keeps f2p fair. | **M** | `server/src/game.ts` (rating buckets), `client/src/main.ts` |
| **Club identity & progression** | Persistent club name/crest/colours, level, and lifetime stats. | Ownership feeling long before NFTs; the surface cosmetics attach to. | **M** | `server/src/store*.ts`, `client/src/main.ts` |
| **Manager profile + achievements** | Badges for milestones (first title, 50 wins, upset a top-10 squad). | Cheap dopamine + collectible surface; some become NFT/cosmetic later. | **S** | `client/src/main.ts`, small server counters |
| **Rivalries / challenge notifications** | Surface "you were challenged" + repeat-opponent rivalries in the hub. | Async-PvP already stores this; turning it into a nudge drives return visits. | **S** | `client/src/main.ts` (uses `GET /matches?me=1`) |
| **Onboarding / tutorial round** | A guided first round that teaches sliders and the standing-orders idea. | Reduces churn at the exact point free players bounce. | **M** | `client/src/main.ts` |

---

## 4) Consumables & token sinks

Where the future web3 layer plugs in. **Every consumable is an ERC-1155** (per
`web3-implementation.md`), **bought with the ERC-20 token and burned on use**; burn
revenue **splits burn (deflation) + reward-pool top-up** per the economy doc. All
effects apply **pre-kickoff** (determinism) and any stat effect is **capped at 20**
and **included in squad rating so matchmaking pairs buyers with buyers** (no
pay-to-win the ladder can't absorb).

**Design guardrails for this section (read once):**
- **Restore-not-exceed** items (energy/fitness) can apply to the *whole squad incl.
  base fillers* because they only return a player to their normal baseline — no new
  power, so not pay-to-win. **Boost** items that raise effective stats apply **only to
  NFT stars** (base fillers are never upgradeable, per the web3 doc) and are **capped
  + rating-counted**.
- **Prefer recurring consumption** (refills, per-match, per-season) over permanent
  one-time upgrades — the economy's primary value anchor.
- **Never paywall existing free value** (basic scouting stays free).

### 4a. Recurring utility (the primary anchor — spend repeatedly)

| Consumable | What it does | Purchase / burn | Fit to economy | Effort | Touches |
|---|---|---|---|---|---|
| **Energy / fitness refill** | Restores a club's pre-match fitness pool to full so a fatigued squad starts a round at baseline (never above 1.0). | ERC-1155, **burned per round/refill**; also a natural **testnet faucet** teaching item. | **Recurring** (the economy doc's flagship sink); **restore-not-exceed → not p2w**; framed as energy, not "your NFT stopped working." | **M** | on-chain read in `server/src/game.ts`; engine already models fitness (`shared/src/engine.ts`) |
| **Contract extension / roster-slot upkeep** | Keeps an NFT star active in your usable roster for the next season. | ERC-1155 or direct token **burn per season**. | Recurring sink; deliberately **soft** (energy framing, not lockout) to avoid feeling extractive. | **M** | `server/src/store*.ts`, on-chain read |
| **Season pass** | Unlocks the season's objective track + cosmetic drops + extra daily goals (progression, not power). | Token **burn once per season**. | Recurring by season; **no match power → matchmaking-neutral**; monetises §3 retention. | **M** | `server/src/game.ts`, `client/src/main.ts` |
| **Premium analytics pass** | Advanced scouting only: win-probability sims, optimal-XI solver, deep opponent breakdown. **Basic scouting stays free.** | Token **burn per season or per use**. | Recurring; explicitly listed in the economy doc; guarded so it **never paywalls existing free value**. | **M** | `client/src/main.ts`, `server/src/game.ts` |
| **Higher-league entry** | Access token for an optional prestige division with a bigger reward-pool share. | Token **burn per season for access** (stake-for-*access*, never stake-for-yield). | Recurring, token-gated prestige; keeps base divisions fully free. | **M** | `server/src/game.ts` (division gating) |

### 4b. Per-match / limited-power items (capped, matchmade)

| Consumable | What it does | Purchase / burn | Fit to economy | Effort | Touches |
|---|---|---|---|---|---|
| **Star boost pack (one-round)** | Temporary +1..+2 to one stat on **one NFT star** for the next round only, capped at 20. | ERC-1155, **burned per round**. | Recurring, **capped**, **NFT-stars-only**, and **folded into squad rating** so boosters meet boosters — p2w-neutral. | **M** | `PlayerUpgrades`/effective-stat bridge in `server/src/game.ts`; engine reads stats unchanged |
| **Chemistry catalyst** | One-round boost to the §1 team-chemistry factor for a chosen XI. | ERC-1155, **burned per round**. | Rewards squad-building, small magnitude, rating-counted; recurring. | **M** | depends on §1 chemistry; `server/src/game.ts` |
| **Fresh-legs (targeted energy)** | Full pre-match fitness for a single chosen player (cheaper than a full-squad refill). | ERC-1155, **burned per use**. | Restore-not-exceed → not p2w; a cheap frequent sink. | **S** | as energy refill, per-player |

### 4c. Permanent upgrades (bounded — use sparingly)

| Consumable | What it does | Purchase / burn | Fit to economy | Effort | Touches |
|---|---|---|---|---|---|
| **Training / upgrade token** | Permanently raises one stat on an **NFT star**, recorded in `PlayerUpgrades`, travels with the NFT on resale. | ERC-1155/token **burned once**; boost is **hard-capped at 20** with a per-player boost budget + diminishing returns. | The economy doc's capped permanent sink; **NFT-stars-only**; **rating-counted**. **Cap is non-negotiable** (uncapped boosts break the tuned engine). | **M** | `PlayerUpgrades` contract; effective-stat bridge in `server/src/game.ts` |
| **Trait reroll** | Re-rolls a star's §1 flavour trait (deterministic from a committed seed, not live RNG). | Token **burn per reroll**. | Collectible chase; small/no power delta; recurring for min-maxers. | **M** | trait system in `shared/src/teams.ts`; seed supplied by server |

### 4d. Pure cosmetics (zero match effect — safest sink)

| Consumable | What it does | Purchase / burn | Fit to economy | Effort | Touches |
|---|---|---|---|---|---|
| **Kits / crests / pitch & stadium skins** | Visual only — recolours sprites, pitch palette, crest. | Token/ERC-1155 **burned**; some **token-only limited drops** (prestige). | **Matchmaking-neutral by definition**; diversified buyback revenue; the cleanest sink. | **S–M** | `client/src/pixelart.ts`, `main.ts` (ties to §2 theming) |
| **Goal celebrations / commentary skins** | Cosmetic flair on the §2 goal flash / commentary voice. | Token **burned**; seasonal limited editions. | Recurring cosmetic drops; no power. | **S** | `client/src/main.ts` |
| **Achievement / champion badges (soulbound)** | Non-tradeable proof-of-feat display items. | Earned free or **token-burned to mint**. | Prestige demand, no power, no secondary-market pressure. | **S** | `client/src/main.ts`, optional on-chain mint |

---

## Suggested pick order (opinion, not a plan)

1. **Fun without money first** (roadmap-true): §1 per-player roles, §2 camera juice +
   commentary, §3 seasons. These make the *game* good — the precondition for any token.
2. **Then the recurring-sink surface**: §3 season pass / divisions, which §4a monetises
   cleanly with **no match-power** items (matchmaking-safe by construction).
3. **Then capped power items** (§4a energy, §4b/§4c boosts) once **rating-based
   matchmaking includes boosts** — without that spine, boosts are pay-to-win and must
   not ship.
4. **Cosmetics (§4d) anytime** — safest sink, immediate diversified revenue, no balance
   risk.

## Open questions for the human

- **Squad star-cap:** how many NFT stars allowed in an XI (shape vs "most NFTs wins")?
  Bounds how strong boost consumables can be. (Also open in `web3-implementation.md`.)
- **Energy model:** is fitness a per-round resource that *needs* refilling (creates the
  sink) or purely cosmetic upkeep? Affects whether energy refill is core or optional.
- **Boost magnitude + budget:** exact caps / diminishing-returns curve for §4b–4c so the
  tuned 1–20 ladder (see `shared/ladder_sim.ts`) holds.

---

## Deferred — designed, decided, not built

Features the shipped game has deliberately **stopped advertising**, with the real version
recorded here so it is not lost. A line earns a place here the day the UI stops promising it.

### Off-pitch temptations as a real two-option choice (§100, deferred 2026-09-05)

`computeOffPitch` fires a temptation on ~12% of turns for a clean reputation and ~26% for an
edgy one — 6.5 and ~14 turns a career. The Life tab badged those turns with a 🎲, and the panel
behind it rendered a heading and a blurb and **nothing else**: no `data-act`, no button, no
handler. The blurbs were written as two-branch dilemmas ("Easy money, or a story you don't want
written."), so the badge summoned the player to a moral choice with no branch to take. §100
option (a) shipped instead — no badge, and ten observations in place of ten unanswered prompts.

**The real version, for whoever has the content budget.** Each of the ten kinds (`gamble`,
`bribe`, `nightlife`, `invest`, `old-mates`, `prank`, `secret-tab`, `ghost-post`, `freebie`,
`curfew`) gets two options whose costs are **stated before you pick**: coins and image against
reputation edge, the meters, and the `greed` the summer shop already moves. Resolve the outcome
from the same seeded hash the temptation is drawn with (`hash32(seed, 5300 + turn)`) so it stays
deterministic and replays identically — no wall clock, no rng. Ten dilemmas x two branches x an
outcome line each, plus a `data-act` and a handler on the career facade of the kind the life-event
cards already carry. **Effort: M–L, and most of it is writing.**

Bring the 🎲 and the dilemma wording back the same day the button lands, not before —
`tools/playtest/tempt_panel_copy.ts` guards exactly that gap, and it should be **retired** when
the choice is wired rather than loosened.
</content>
</invoke>
