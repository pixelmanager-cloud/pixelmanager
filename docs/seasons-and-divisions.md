# Seasons & divisions — design spec

Status: **draft / design**. How Football Royalty's league scales from a handful of
players to thousands while staying engaging: time-boxed **seasons**, a **division
pyramid**, and small **pods** so every player always sees a ~20-row table they can
actually win. Nothing here is built yet — this is the plan the build follows.

**Grounding docs:** [`async-pvp-phase1.md`](./async-pvp-phase1.md) (the async-PvP
loop, standing orders, Elo), [`game-upgrade-ideas.md`](./game-upgrade-ideas.md)
(§3 progression — this is roadmap item #1), [`economy-and-web3.md`](./economy-and-web3.md)
(where season prizes plug in later).

**Grounding code:** `server/src/game.ts` (`buildTable`, `elo`, `TableRow`),
`server/src/store.ts` (+ sqlite/postgres impls), the `/table` and `/results`
routes in `server/src/index.ts`, and the **League & Results** page in
`client/src/main.ts` (`showStandings`, `renderLeagueTable`, `renderResults`).

---

## 1) Why not one big table

`buildTable` today ranks **every registered club** in a single list — fine now,
and its own comment says "materialise it later if the match count grows large."
But the *engagement* problem hits long before the *performance* one: in a league
of 5,000, you are rank #4,213, you can never catch #1, and every match feels
pointless. **A single global leaderboard is demotivating at scale.** The fix is to
never show anyone the whole population.

## 2) The model: seasons → divisions → pods

```
   WORLD CLASS    [pod]                              ← 1 pod, the very best
   CONTINENTAL    [pod] [pod]
   PREMIER        [pod] [pod]
   CHAMPIONSHIP   [pod] [pod] [pod]
   LEAGUE ONE     [pod] [pod] [pod]
   LEAGUE TWO     [pod] [pod] [pod] [pod]
   NATIONAL       [pod] [pod] [pod] [pod]
   REGIONAL       [pod][pod][pod][pod][pod]
   COUNTY         [pod][pod][pod][pod][pod][pod]
   SUNDAY LEAGUE  [pod][pod][pod][pod][pod][pod] …   ← everyone starts here
```

- **Season** — a fixed-length cycle (default **7 days**). Standings, points and
  fixtures all belong to a season; at the end it rolls over (§7).
- **Division (tier)** — a named rung on a **10-tier football pyramid**:
  `SUNDAY LEAGUE → COUNTY → REGIONAL → NATIONAL → LEAGUE TWO → LEAGUE ONE →
  CHAMPIONSHIP → PREMIER → CONTINENTAL → WORLD CLASS`. Tiers are ordered; you climb
  by winning, you drop by losing. A long ladder is deliberate — it's a multi-month
  prestige journey ("promoted to the Championship!" beats "reached Gold") and it
  keeps matchmaking bands tight at scale. Upper tiers simply sit empty until players
  climb into them, so a long ladder costs nothing at low population.
- **Pod** — a **~20-club** group *within* a tier and season. **A player only ever
  sees and competes in their own pod's table.** This is the whole trick: the table
  is always a legible 20-row title-race-plus-relegation-scrap regardless of whether
  the game has 50 players or 50,000.

### Invariants (recommended defaults, all configurable)

| Knob | Default | Notes |
|---|---|---|
| `POD_SIZE` | 20 | target clubs per pod → **38 fixtures/season** (double round-robin: home + away vs each of 19); last pod may be short |
| `SEASON_DAYS` | 7 | weekly cadence; short enough to feel fresh, long enough to fill fixtures |
| `MATCHES_PER_DAY` | 6 | soft cap on actively-started matches per UTC day (6×7 = 42 ≥ 38, so a diligent manager still finishes) |
| `PROMOTE` | top 3 | promoted to the tier above at rollover |
| `RELEGATE` | bottom 3 | relegated to the tier below (none from `SUNDAY LEAGUE`) |
| `TIERS` | `['SUNDAY LEAGUE','COUNTY','REGIONAL','NATIONAL','LEAGUE TWO','LEAGUE ONE','CHAMPIONSHIP','PREMIER','CONTINENTAL','WORLD CLASS']` | index 0 = bottom; a pure config array, resize freely |
| `INACTIVE_DAYS` | 14 | no matches → parked/relegated, frees pod slots |

## 3) Data model

Additive to the current `Store` interface — no existing column changes. Two
backends (`store-sqlite.ts`, `store-postgres.ts`) implement the same methods, as
today.

```
seasons        ( id, number, starts_at, ends_at, status )        -- status: 'active' | 'closed'
pod_members    ( season_id, account_id, tier, pod, PRIMARY KEY (season_id, account_id) )
honours        ( account_id, season_id, tier, pod, final_pos, title INTEGER )  -- title=1 if champion
matches        + season_id  (nullable; matches before Phase A stay null / "preseason")
```

- **Pod identity** is `(season_id, tier, pod)` where `pod` is a small integer
  index within the tier (`0,1,2,…`).
- **Standings are never global.** A pod table is
  `buildTable(podAccounts, podResults)` where both inputs are already filtered to
  the pod's ~20 members and to that season's matches — so `buildTable` stays
  untouched and every query is **bounded to ~20 rows / their matches**, the key to
  scaling. Indexes: `pod_members(season_id, tier, pod)` and `matches(season_id)`.
- **Elo persists underneath** (`accounts.rating`) for cross-pod fairness, initial
  placement, and an optional global "all-time" leaderboard — but it is *plumbing*,
  not the engagement surface.

### New `Store` methods (names indicative)

```ts
currentSeason(): Promise<Season | undefined>;
createSeason(number, startsAt, endsAt): Promise<Season>;
closeSeason(id): Promise<void>;
assignPod(seasonId, accountId, tier, pod): Promise<void>;
podOf(seasonId, accountId): Promise<{ tier, pod } | undefined>;
podMembers(seasonId, tier, pod): Promise<LeaderRow[]>;          // ~20 rows
podResults(seasonId, tier, pod): Promise<ResultRow[]>;          // matches among those members this season
tierPods(seasonId, tier): Promise<Array<{ pod, count }>>;       // for placement + rollover
addHonour(accountId, seasonId, tier, pod, finalPos, title): Promise<void>;
honoursFor(accountId): Promise<HonourRow[]>;
```

## 4) New-player placement

On register (or first login of a season) with no pod for the active season:

1. Enter the **lowest tier** (`SUNDAY LEAGUE`).
2. Drop into the **first pod with < POD_SIZE members**; if all full, **open a new
   pod** in that tier. (Fill-then-open keeps pods dense.)
3. Seed `accounts.rating` at 1000 as today; a few **placement matches** can nudge
   it before the next season sorts tiers by rating.

Mid-season joiners play a partial season in their pod — fine; they get a full one
next rollover.

## 5) Rollover job (end of season)

A single idempotent job triggered when `now >= season.ends_at` (cron, or lazily on
the first request after expiry — same guard pattern as the agent's daily cap):

1. **Freeze** the active season (`status='closed'`).
2. For each pod, compute the final `buildTable`; **record honours** (champion =
   `final_pos 1, title=1`; everyone gets their `final_pos`).
3. **Promotion/relegation**: top `PROMOTE` move up a tier, bottom `RELEGATE` move
   down (clamped at `SUNDAY LEAGUE` / `WORLD CLASS`). Everyone else stays put.
4. **Re-pod**: within each tier, sort members by rating and **re-shuffle into fresh
   pods of ~POD_SIZE** so pods stay balanced and you meet new rivals.
5. **Park inactives** (no match in `INACTIVE_DAYS`) — skip re-podding them until
   they return, freeing slots.
6. **Open the next season** (`number+1`, new `starts_at/ends_at`), write
   `pod_members` for it, reset — points/fixtures are per-season so nothing to wipe.

Determinism/audit: the job only reads finished matches and writes standings/pods —
no match is re-simulated, so it never disturbs commit-reveal results.

## 6) Fixtures / scheduling (Phase C, optional)

Phase A/B keep **on-demand** play (choose an opponent from your pod, capped games
per day). Phase C adds a **fixture list**: a double round-robin against your ~19
pod-mates (**38 games / season, ~5–6 a day**) resolved against their standing
orders. Fixtures give a concrete "matches to play today," the strongest daily
return hook — and async means an absent opponent still plays via standing orders.

## 7) API additions

| Route | Returns |
|---|---|
| `GET /season` | active season (number, ends_at, your tier + pod) |
| `GET /standings` | **your pod's** table + promotion/relegation zones (replaces the global `/table` on the hub surface) |
| `GET /results` | scoped to your pod + season (extends the feed we already ship) |
| `GET /honours` | your history: past seasons, tiers, finishes, titles |
| `GET /fixtures` | *(Phase C)* your remaining season fixtures |

`/table` can remain as an optional global "all-time Elo" leaderboard.

## 8) Standings page changes (client)

The **League & Results** page we already built is the natural home:

- Header: **`CHAMPIONSHIP · Pod 3 · Season 4 — ends in 2d`**.
- **Your pod table** (reuse `renderLeagueTable`) with a green **promotion zone**
  (top 3) and red **relegation zone** (bottom 3) tint.
- **Results feed** scoped to your pod (reuse `renderResults`).
- A **Honours** tab: past-season badges (champion, promotions) — ties into §3
  progression "achievements" and later cosmetic/soulbound badges.

## 9) Determinism & economy alignment

- **Determinism intact.** Seasons/pods are *bookkeeping around* matches; the match
  is still a pure function of pre-kickoff inputs. No `Date.now()`/RNG in `shared/`.
- **Matchmaking spine.** Tiers/pods are rating-bucketed, so this *is* the
  "matchmaking must absorb power" mechanism the economy relies on — capped boosts
  (economy doc §4) meet other boosted squads within a tier.
- **Prize hooks, later.** Season/pod finishes are the clean surface for the
  economy's *reward pool* (top-3 payouts, promotion bonuses) and a **season pass**
  (game-upgrade-ideas §4a) — added only after fun is proven with valueless tokens.

## 10) Phased rollout

**Phase A — Seasons** ✅ **SHIPPED** *(works at any size)*
`seasons` + `matches.season_id`; season-scoped standings over the *whole*
population (one pod = everyone); lazy rollover on request (no cron) closes an
expired season, crowns the champion, archives every participant's finish to
`honours`, and opens the next; standings page shows the season banner + a
Results/Honours tab. Config: `SEASON_DAYS` (default 7); ops trigger
`POST /admin/rollover` (ADMIN_SECRET-gated). Tier label is fixed at `SUNDAY LEAGUE`
until Phase B. Routes: `/season`, `/standings`, `/results` (season-scoped),
`/honours`.

**Phase B — Divisions/pods** ✅ **SHIPPED** *(most visible past ~40 players)*
Persistent per-account `tier` (promotion/relegation progress) + per-season
`pod_members`; lazy placement (`ensurePod`) drops each player into their tier's
first pod with room (`POD_SIZE`, default 20), else opens a new one. `/standings`,
`/results`, and `/opponents` are all **pod-scoped**; the standings page shows
`TIER · Pod N · Season M` with green promotion / red relegation zones. The rollover
ranks each pod, records honours with the real tier, and moves top `PROMOTE` up /
bottom `RELEGATE` down (relegation only in pods larger than `PROMOTE+RELEGATE`).
Re-podding is lazy the next season. A pre-Phase-B season with no pods falls back to
one bottom-tier league. Verified end-to-end (placement, pod-scoped tables/opponents,
promotion to COUNTY, honours).

**Phase C — Fixtures** ✅ **SHIPPED** *(retention hook)*
Each pod is a **double round-robin**: you play every pod-mate **home and away** — a
home leg (you host) and an away leg (they host). `POST /matches` takes a `venue`
(`home`/`away`), runs the sim with the correct team ordering, records `initiator_id`
(so the daily cap counts *your* triggers even when you're away), and rejects a repeat
of that exact directed leg (409). The match view flips for away games (opponent is
the home side; "your squad fitness" tracks whichever side you are). `GET /fixtures`
returns two legs per pod-mate (H/A) marked played-with-result or pending; the hub's
"SEASON FIXTURES" list badges each H/A and shows a `played/total · today/cap` counter.
**Cadence:** pod 20 → **38 fixtures/season** (the real 38-game season), soft cap
**`MATCHES_PER_DAY` (6) per UTC day** (Play buttons disable at the cap, /matches → 429).
**Fair completion:** at rollover, any legs never played **auto-resolve from both
clubs' standing orders** — every directed leg among *active* pod members — so every
table completes as a full home-and-away double round-robin regardless of who logged
in. (Optional home-advantage bonus in the engine is a future tweak.)

## 11) Open questions (with a recommended default to start)

| Question | Recommendation | Why |
|---|---|---|
| Season length? | **7 days** | weekly rhythm; revisit to 3–5d if engagement wants faster climbs |
| Promote / relegate count? | **3 up / 3 down of 20** | meaningful movement without churn whiplash. With a 10-tier ladder, ~1 tier/season means a dominant player tops out in ~10 seasons — a real long-term goal; raise to 4–5 if the climb feels too slow in playtest |
| Pod size? | **20** | classic league feel; big enough for a real table, small enough to matter |
| Placement? | bottom tier + rating-seed | simple, fair; placement matches can refine |
| Tie-breakers? | Pts → GD → GF → head-to-head | `buildTable` already does the first three |
| Inactivity? | park after **14d**, relegate on return | keeps pods live without punishing short breaks |
| Cross-pod play allowed? | **friendlies only** (unranked) | pod integrity for standings; social play stays open |
</content>
