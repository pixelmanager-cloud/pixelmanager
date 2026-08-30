# The manager layer: measured, not guessed

A critic pass drove the REAL season loop (`client/src/api.ts` + the fixture/table code copied line-for-line
from `main.ts`) for **130 seasons × 3 policies** and **40 seasons × 10 policies × 8 club seeds**, and
measured tactics directly against `MatchEngine`. Everything below is a number from a run, not a reading of
the source. Reproductions were in `/tmp/pt29/`.

Its verdict, which I think is right: *"Not a sequence of screens — but a very short game wearing a long
one's clothes."*

---

## The shape of the problem

**The game is solved by about season 20 and stops offering decisions around season 65.**

```
seasons 70-129 (60 consecutive seasons, best available play):
  purchases made: 0        facility total: frozen
  income ~3,650   upkeep 1,407   wages ~2,500
  league position: a random draw from 1st-5th
```

For the back half of every dynasty — in a game that advertises itself as multi-generational — there is
nothing left to buy and nothing left to decide.

---

## 1. Half the facility ladder is unbuyable

Levels 7-10 cost 4,800 / 7,000 / 10,000 / 14,000. **Peak coins ever held across 130 seasons of unbroken
top-flight dominance: 3,148 / 3,266 / 3,734** depending on policy. The steady-state surplus is eaten by the
upkeep each new level adds.

The module comment calls levels 6-10 "a dynasty-scale project… inherited". Measured, they are content
nobody can reach. **This is my miscalibration**: I refitted `UPKEEP_COEFF` to 7 today against an income
figure of 10,449/season, but that is a MAXED champion — the club can never get there to earn it.

**Decision:** lower the top-end costs, flatten the upkeep curve above L6, or add an income source that
scales with the climb. My instinct is the last one, but it is a real balance project.

## 2. Sponsor is strictly dominant; 8 of 12 facilities have no coin return

Marginal per-season net (Δincome − Δupkeep), mid-tier, 20 trophies:

| L→L+1 | cost | sponsor | stadium | shop | the other nine |
|---|---|---|---|---|---|
| 1→2 | 250 | **+589** | +45 | +79 | −7 each |
| 9→10 | 14,000 | **+477** | −42 | −33 | −119 each |

`sponsorIncome` is linear in `(level-1)` in **both** terms, so its trophy term alone returns +500/level/
season. Sponsor L1→L2 pays back in under half a season, forever. Above L5 every other facility runs a
permanent per-season loss.

## 3. Eleven facilities are worth zero competitive advantage

40 seasons, 8 club seeds, average finishing tier (lower is better):

```
trainingOnly  5.19      ← the only one that beats
cheapest-all  6.15
do-nothing    8.11      ← baseline
sponsorOnly   8.09   youthOnly 8.17   communityOnly 8.17   medicalOnly 8.19
```

`medicalOnly`, `youthOnly` and `communityOnly` are indistinguishable from buying nothing. `trainingOnly`
beats buying everything, because every coin spent elsewhere is a coin not spent on Training.

**Community Trust has no effect of any kind** — `communityStanding` and `womensStanding` have zero
references outside their own module.

## 4. The tactical layer is not balanced, and the defaults are the best options

**Presets**, full round-robin, 2,000 games each — and the underdog case that is the entire justification
for the defensive ones:

| preset | round-robin PPG | as 11-v-15 underdog |
|---|---|---|
| Tiki-Taka | 1.730 | 0.275 |
| Gegenpress | 1.730 | 0.220 |
| **Balanced** | 1.619 | **0.370** |
| Counter | 1.119 | 0.063 |
| **Park the Bus** | **0.878** | **0.113** |

Park the Bus and Counter are the two WORST options when you are the underdog — the exact situation they
are named for. Spread is 0.85 PPG ≈ 15 league points a season, larger than every facility and squad
decision combined.

**Formations**: `4-4-2` is the strongest shape in the pool (1.815 PPG) and it is `DEFAULT_TACTICS`. The
formation screen is ten ways to make your team worse.

**Duties**: `defaultDuty()` assigns stopper/cover to defenders (ranks 5 and 6 of 6) and poacher/target-man
to forwards (ranks 4 and 5 of 5). Setting all three optimally is worth ~+7 points a season and nothing
signposts it.

**Sliders**: width is noise (non-monotone, and the neutral default is the worst value); mentality is a
switch not a slider (+1 is worse than 0, only +2 does anything); press and line both peak at neutral;
tempo is monotone, so max it once and never revisit.

## 5. Two mechanisms are inert

- **`sweeper-keeper` is a bit-for-bit no-op.** 300 matches with the high line it is written for: 0 differ
  in score or in the keeper's final position. `gkStep: 7` feeds a clamp the keeper's own target equation
  can never reach. It is one of only two GK duties.
- **`OPP_REVEAL`** — the whole opposition-scouting ladder — has zero consumers, and `api.ts` hardcodes
  `const TIER = 'base'`, so the bronze/silver/gold scout tiers are unreachable. Both are web3-era leftovers.

## 6. The board cannot do anything

`board.ts` says so outright: "no sacking, no forced game-overs, no persisted state". `boardStanding().score`
is consumed once, to pick a **string**. A manager cannot be fired, given a budget, or constrained.

## 7. The manager-career QA gate measures a fictional model

`tools/playtest/analyze_manager_career.ts` hardcodes a strength curve instead of simulating a club. It
reports "title rate while IN the top flight: 31% — a real but hard prize", and passes. Measured through the
real facade: **57%** on one policy, **74%** on another. The gate is green on a number the game does not
produce — the same defect class as the dead probes fixed earlier today, in the tool that is supposed to
catch exactly this.

---

## What I would do, in order

1. **#7 first** — a QA gate reporting a fictional number is why 1-4 survived this long. Cheap to fix.
2. **#5** — `sweeper-keeper` and the scout tiers are dead code with live UI; either wire or remove.
3. **#4** — rebalancing presets/formations/duties is bounded work with a clear target, and it is the
   largest single lever in the game (15 points a season).
4. **#1-3** — the facility economy needs redesign, not tuning. This is the big one and it is yours to
   direct: what should a facility BE, if eleven of twelve currently do nothing you can feel?
