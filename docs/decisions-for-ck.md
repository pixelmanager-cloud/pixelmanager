# Open items that need YOUR call — not bugs

Everything here is either a product decision I should not make alone, or a job too large to do without
knowing what you want. Bugs I could fix and verify are already fixed; this is only what is left.

Last updated: 2026-08-30, end of the overnight session.

---

## 1. The match engine rebuild — the big one

**Branch:** `engine/shot-geometry` (3 commits, deliberately NOT merged; every mechanism defaults OFF)

The engine's shot geometry is broken and I found out exactly why. Two calibration defects upstream of
everything: **pass completion 59.2%** (real football ~80%) and **1,508 tackles a match** (real ~40). Each
nearby defender rolled a ~19% tackle chance EVERY tick, so the median possession spell was **two ticks —
one second**. Nothing that takes time could happen: the box measured empty at 0.02 attackers, and the only
chance creation in the game was a through-ball fired from a median of **45.8 metres**.

Fixed on the branch, it measures like football for the first time: 26.1 shots and 2.77 goals a match,
median shot distance 7.5m.

**Why it is not merged:** 8 of `strategy_test`'s assertions fail. The tactical layer was calibrated
against the broken model, so it inverts when the model is corrected. The flanks are understood down to the
line of code — a hard `gain > -6` veto killed 80% of all wide passes — but width still does not PAY, and
the last piece needs an overlapping run, which is a behaviour to design rather than a constant to tune.

**Your call:** this is a multi-day project. Do you want it before launch, or does the game ship on the
current engine? Everything is behind named constants with env overrides so the next session sweeps rather
than re-derives, and `tools/playtest/shot_geometry.ts` + `width_diagnosis.ts` reproduce every number above.

---

## 2. 1,505 arc tags that gate nothing — an authoring job, not a bug

`gate_content.ts` reports this every playtest run.

Both tag systems are fully built and correct: `arcFits` honours `requiresTag`/`forbidsTag`, and the player
career filters choices by `requires`. **1,505 arc choices set `effect.tag`, and not one arc in 1,233
declares any of them.** Every "consequence that persists across a career" lands in a set nothing queries.
The same is true of `when.facility` — 0 of 819 manager arcs use it, so upgrading a facility unlocks no
content, despite `facilities.ts` selling facilities as content sources.

**Your call:** this is writing, not code. Authoring arcs that require or forbid tags is how consequences
start persisting across a career. Worth doing, but it is a content project with a real scope.

---

## 3. Pre-fix saves lost their history — accept, or attempt a backfill?

Successions used to call `clearMgr()`, a blanket `removeItem`, so every generation destroyed the club's
titles, continental/World-Finals wins, hired staff, `arcPrestige`, `arcFired`, `arcTags` and `clubLegacy`.
Fixed in `55a3abf`; the dynasty carries from now on.

**What cannot be recovered:** the key was REMOVED rather than overwritten, so for a save already several
generations deep that history is simply gone. There is nothing on disk to read back.

**What recovers on its own:** the club TIER. `fm_tier_` lives in its own key and was never wiped — it was
being overwritten by the founding path, which no longer runs at a handover.

**Your call:** accept the loss for pre-fix saves, or have me attempt a partial backfill from the honours
table and legend snapshots. My recommendation is ACCEPT. A migration that credits a save with titles it
cannot prove it won is exactly the fabricated-parentage mistake `migrate()` already made once (it invented
father/son links from generation adjacency, and had to be torn out). The game has not shipped; the only
affected saves are yours and the test ones.

---

## 4. Steam

Blocked on tax/banking approval, which you submitted but has not come back. When it clears, **capsule art
and the trailer are the critical path** — the store copy is the easy half.

---

## 5. Smaller things I chose not to do alone

- **`youth_joy.ts` stays 64% costless on purpose.** The shirt with his name on the back, commentating his
  own goals in the garden. If you want those priced, say so — I think pricing them would make the game
  worse, and `arc_stakes.ts` warns rather than fails for exactly this reason.
- ~~`Token.father_name` write-only~~ — DONE: now read in the Family Record as each medallion's tooltip
  and screen-reader label ("Kai Vance — Dane's boy").
- ~~13 stale `worktree-agent-*` branches~~ — DONE: deleted.
- ~~Should wages force disrepair too?~~ — you said yes; in progress. Deliberately sequenced AFTER the
  visibility fixes, because a critic found that every disrepair warning was being deleted before the player
  could read it (the season-rollover feed clobber, fixed in 55a3abf). Making wages destroy facilities while
  the failure was invisible would have turned a hard game into an unexplained one.

---

# ROUND 2 — four critic agents, 2026-08-31

Four agents measured the shipped game rather than reading it. Everything below is a number from a run.
I have **fixed** the items marked FIXED. The rest are design calls that are yours, not mine.

## 6. Fixed without asking (they were defects, not choices)

- **The manager arc library ran dry and stayed dry.** `arcFired` — the list of arcs *this career* has seen,
  which `pickManagerArc` filters on — was carried across successions as if it were dynasty property. It
  spent the 819-arc library ONCE across the whole bloodline: 50 arcs a generation until generation 12, 19 by
  generation 13, and from **generation 19 onward, zero manager arcs, permanently**. My own probe asserted
  the carry as an invariant, and `generations.ts 12` stops one generation short of the cliff, which is why
  nothing caught it. Now reset per generation, and the probe now asserts the opposite.
- **Every heir lost his first youth-intake line.** `feedFired` keys are `intake:${season}`, and the season
  resets to 1 at handover. Same fix.
- **Old saves were still being re-baselined to the bottom of the pyramid.** `fm_starttier_` was added on
  2026-08-30, so no save written before it has the key — and those reach their next succession with a
  climbed tier and no start tier, are read as *founding*, and get sent from tier 1 back to tier 8.
  Reproduced. `fm_tier_` existing at all now counts as evidence of a founding that already happened.
- **A club at level 1 could run an unlimited wage bill forever.** `facilityToDowngrade` returns null when
  nothing is above level 1, so the disrepair penalty switched itself off at exactly the point it was needed:
  40 seasons billed 320,000 coins of wages, paid zero, and lost nothing. A club that cannot pay its wages
  now sells players — cheapest first, at a forced price, never below the minimum squad.
- **Thirty facility-gated arcs could not fire on the first season screen** after any page load: `facLevels`
  is filled by a promise and `maybeOfferArc()` ran synchronously in the same call, so every gate read
  level 1. The offer is now re-run when the levels land.
- **`clearMgr()`** — dead since the succession fix. Deleted.

## 7. Fixed, and it changes the balance — tell me if you disagree

**The pyramid was three different games.** The calibration gate measures goals/match at ONE squad quality
and asserts it lands in [1.6, 3.6]. It passed for months. Across the strengths the game actually generates:

| tier | strength | goals/match BEFORE | AFTER |
|---|---|---|---|
| 8 | 6.4 | **0.19** | 1.9 |
| 3 | 12.9 | 2.81 | 2.75 |
| 1 | 15.5 | **6.22** | 2.7 |

A 33-fold spread. The bottom of the pyramid — where every career starts and where the player spends his
first hours — was close to goalless, and the top flight was a shootout. Details are in the engine commits;
the short version is that the pass read only the attacker's ability and never the defender's, and **nobody
in the engine marked anybody**: against a *maximum* press, pressure on the receiver in the passing side's
own defensive third measured 0.062. A high press did not press high.

**Division merit payment, +600 per division climbed per season.** Facility levels 9 and 10 cost 10,000 and
14,000; the highest treasury a club ever held across 130 seasons of top-flight dominance while also buying
players was **8,668**, and level 9 was never reached in any seed under any policy. Of the three fixes
measured — cut top-end costs, flatten upkeep, scale income with the climb — only the third worked: cutting
costs empties the ladder by season 91, and flattening upkeep does nothing at all, because upkeep was never
the constraint (a summit club earns 10,428 against 6,804 of upkeep; the 14,000 capital cost is what it
cannot do). **If you want the top of the ladder to stay out of reach as a deliberate choice, say so and I
will revert this one** — it is the only balance change here I would call arguable.

**Park the Bus and Counter were traps.** Both measured LAST at every quality gap; as an 11-v-15 underdog
Park the Bus took 0.03 points a game where Balanced took 0.17. The cause was not their defending but their
attack: `mentality: -2` sets the attacking push to exactly zero, so the side never came out, never relieved
pressure, and conceded *more* than anyone. Retuned. Sitting deep is an identity; refusing to leave the box
is not a tactic.

## 8. YOUR CALL — the card career's core progression

This is the biggest finding of the four and I have deliberately not touched it.

`deriveStats` normalises every tag by the **most frequent** tag: `norm[t] = freq[t] / maxFreq`. Composure is
already the most frequent tag in essentially every career, so **awarding composure shrinks every other
stat.** Measured on 300 real career logs:

| added to a finished career | Δ overall |
|---|---|
| +2 composure | **−0.130** |
| +5 composure | **−0.333** |
| +10 composure | **−0.643** |
| +5 creativity | +0.423 |

Composure appears in **841 of the 1,541** story-arc choices that carry an attribute effect, for a summed
+1,095 against creativity's +166. So the most common reward in the game makes the player worse, and an arc
policy that deliberately picks the *mechanically worst* branch graduates a **better** player (13.69 vs
13.22) and a far more varied one.

The same normaliser is why builds do not steer: a career spent entirely on a midfielder build produces a
midfielder **7% of the time** (baseline: 1 in 250). Every build produces the same composure-18 forward.

**Why I stopped:** fixing it means changing how every graduated player's stats are computed, which changes
what the manager phase inherits and re-balances the whole game. It is a day of work and a design decision
about what "development" means, not a bug with an obvious right answer. Options, roughly:
1. Normalise by the mean rather than the max, and re-tune `BASELINE`/`SPREAD` (biggest change, cleanest).
2. Leave the normaliser and rebalance the arc library away from composure (safer, doesn't fix steering).
3. Both.

## 9. Also true, also yours

- **Choosing goalkeeper at creation is worth +2.23 overall** — four times the entire best-vs-decent
  card-play skill gap (0.57–0.64). The largest lever in a 197-screen career is a coin flip on the first screen.
- **Three of the four choice screens are within noise of doing nothing.** Coach: 0.042 overall across six
  screens a career (the *worse* coach won by 0.016). Focus: every variant scored at or below "always press
  Rest". Draft: 0.385 across 19.5 screens. That is 9% of the career's clicks spent on nothing.
- **Lifestyle spending does nothing, and hoarding is punished** — 16 purchases, ~8,300 coins, Δ overall
  0.000; meanwhile unspent earnings raise the dynasty's wages 31% via `contractCost`.
- **Six of eight meter downside branches never fire** under competent play, and `sponsors` is a dead meter
  whose only consumer is a branch that fires 0.3% of the time.
- **7 of the 8 deck synergies are structurally impossible** on whichever track you are on; a perfect
  omniscient synergy-hunting drafter activates one in 29.8% of careers.
- **Nine of twelve facilities produce bit-identical seasons** at every level — 2,000 seasons each, zero
  difference. Only training, fanzone and data change a result. And **Fan Zone returns exactly zero while
  the Stadium is at level 1**, because it multiplies a gate that is zero.
- **`analyze_manager_career.ts` measures a model the game does not have** — it reports a 31% title rate
  where the real one is 57–74%.

---

# OVERNIGHT LOG — 2026-08-31, second half

## 10. THE ONE YOU SHOULD READ FIRST — the game did not run in a browser

I merged the engine rebuild to `main` with a fully green gate, and then opened the game. Black screen, one
console line:

    ReferenceError: process is not defined   at shared/src/engine.ts:13

The rebuild made forty tuning constants overridable from the environment (`Number(process.env.TS ?? 0.15)`),
which is genuinely how the calibration defects in that file were found. They are evaluated at **module
scope**, and `process` does not exist in a browser, so importing the engine threw before a single frame
rendered. The pre-rebuild engine had zero references to `process`. **This was mine.**

It shipped green because **nothing in the gate runs the page**:

- `npm run verify` builds the client with `tsc --noEmit && vite build` — a type-check and a bundle. Neither
  executes a line of the output.
- all sixty-six harnesses across verify, playtest and qa run under `tsx` in **Node**, where `process` exists
  and every constant resolves perfectly.

Sixty-six passing checks and a black rectangle. **FIXED** (constants now read through a `typeof`-guarded
accessor), and confirmed by playing it: new save → family name → academy trial → agent → card career, five
screens, no errors; then a full 90-minute match driven in the browser console — 10,800 ticks, 0-3, 32 shot
attempts, 842 events.

**`tools/playtest/browser_safe.ts` is the gate that would have caught it**, now in `verify`. Proved by
reintroducing the exact line that shipped the bug and watching it fail. It is the cheap half; the expensive
half is a real headless page load, and it says so rather than implying coverage it does not have.

**Worth your attention as a process point, not just a bug:** the reason this survived is the same reason
everything else this week survived — a check that cannot fail. I would suggest a real browser smoke test in
CI before launch. That is a decision for you: it means adding Playwright or similar as a dev dependency.

## 11. The anchor duty does not do what its card says, and now we know for certain

"Pure destroyer — sits, screens the back four, and never strays from his zone." At n=900 paired matches:

| claim | measured | 95% CI |
|---|---|---|
| anchor concedes less than ball-winner | **+0.021** | [-0.092, 0.134] |
| anchor concedes less than box-to-box | **+0.038** | [-0.074, 0.149] |

Not "unresolved" — at this sample the effect is genuinely zero. I gave the duty a real `mark` field tonight
(marking and pressing were one number, so the screener had to be given a low press to make him sit, which
also made him the loosest marker in the game) and it moved the sweeper (-0.176 [-0.287, -0.064], now a
confirmed effect) but not the anchor. I have a specific suspicion about why and am working it: marks are
assigned in player-index order, so the back four claim the nearest attackers first and a deep-sitting
midfielder is left marking whoever remains — possibly dragging him AWAY from the space he is meant to screen.

## 12. Content items — authoring projects, not bugs. Your call on whether they are worth the days.

- **614 near-duplicate line pairs** at similarity >= 0.6. A reader notices "this again" long before an
  exact-match probe fires.
- **27 player story beats ask for a decision and charge nothing for it** — a choice with no cost is a prompt,
  not a decision.
- **`when.maxSeason`** — a late-window gate that is implemented, correct, and used by **zero** of the 819
  manager arcs. Built and unreachable.

## 13. Small UI things I saw with my own eyes, which no source-reading agent would find

- A **long family name wraps mid-word** in the academy cards ("Sam Wolstenholme-" / "Bak"). The game
  generates names this long itself.
- The **succession toast renders over the app header** and is clipped by it.
- At a short viewport (800x450) the menu's primary buttons **scroll out of view**, leaving what looks like an
  empty screen.
- The agent-selection screen says **"No wrong pick here"** while the agent demonstrably changes draft luck,
  wages and transfer fees. Either the choice is fake or the copy is wrong — that is a design call, not a bug.
