# The manager half — content investigation

Commissioned 2026-08-30. Read-only audit of every manager-side system, ranked for development.

## The headline

    PLAYER career    ~24,100 authored lines   (arcs, prompts, narration, off-pitch)
    MANAGER career      ~926 authored lines   (everything below)

**26x less text, for roughly the same playtime.** And it is the half the DYNASTY lives in — the club is
what survives the heirs. Some of that gap is recent: this session poured content into the player career and
widened it.

## The structural finding, which matters more than any single bank

**The manager side has no narrative surface at all.** Its biggest moments are rendered as one-line toasts
with a number in them:

    ⬆️ PROMOTED to League Two!                 ← the achievement of an entire season
    ⬇️ Relegated to the County Premier.
    💸 Sold · +420c                            ← a player you may have had for a decade
    🤕 Kofi Moreau injured — out 3 matches      ← the most dramatic thing in a footballer's year
    🎽 #9 retired forever in his honour

Compare the player career, where a single ordinary card turn gets a composed prompt, an outcome narration,
and sometimes a branching story arc. On the manager side a promotion gets less text than a throw-in.

This is not a "write more lines" problem. There is nowhere to put the lines. **The manager side needs a
narration layer before it needs a corpus** — the equivalent of `narrate.ts` for the events a manager lives
through.

## Section-by-section

Ranked by (how often a player meets it) x (how thin it is).

### 1. Injuries — 0 authored lines. START HERE.
`injuries.ts` is 47 lines of pure availability arithmetic and has never been touched since it was written.
A player gets hurt, a toast appears, he is unpickable for N matches. There is no moment, no diagnosis, no
setback, no comeback, no worry about whether he is the same player after. In a game about attachment to a
squad, an injury to someone you have had for eight seasons should be a beat. It is currently a number.
**Also carries a stale web3 comment** ("never a stat edit — so on-chain NFT stats are untouched").

### 2. Transfers, contracts and selling — 4 lines between them.
`💸 Sold · +420c` for a player who may have been at the club a decade, who has a personality, traits, a
morale history and a storyline. Renewals, rejections, bids for the bloodline star, a player agitating to
leave — all silent. `contracts.ts` (3 prose lines) still describes wallets and on-chain assets.

### 3. Promotion and relegation — 2 toasts.
The climb IS the manager game. Going up and going down are the two most emotional things that happen in a
season and they are single lines. No run-in tension, no final-day, no dressing room after, no town.

### 4. Scouting — 0 authored lines, and a DEAD progression.
`scouting.ts` and `missions.ts` build a genuinely nice risk/reward dial: send a scout somewhere far and
unlikely, wait real time, maybe get someone special. The journey is silent, the destinations have 18 lines
between them, and the reveal is a toast. Worse, **the upgrade path is gated behind a removed paywall** —
the code says *"'base' (no NFT) gets nothing; Gold is a real edge"*, and since web3 was cut every player is
permanently on the tier that gets nothing. The dial does not turn.

### 5. Backroom staff — decorative by design.
`staff.ts` states it outright: *"no mechanics, no effect on results or tactics."* You spend 350 coins on an
Attacking Coach and nothing changes. It is a shop that sells nothing. 86 flavour lines exist; they are
attached to no consequence.

### 6. The season's end — 253 lines carrying the whole verdict.
Board verdict 65, diary 188. Once a season, judging everything you did. The board bank is ~5 lines per mood.

### 7. Cups and internationals — 131 lines across ~20 keys.
The PEAK moments — a final, a shootout, a first cap — have about six lines each. Currently being widened by
an author.

### 8. Squad lifecycle — 65 lines.
Ageing, development, decline, retirement, contract expiry, morale, youth intake. The Living Squad work gave
these real mechanics this session; they have almost no voice. A veteran retiring after ten years gets a row
in a table.

### 9. Facilities — 35 lines, static.
Four facilities x 5 levels = 20 upgrade moments across a career, each a fixed blurb. No sense of the club
physically changing around you.

### 10. Prestige — 36 lines across 9 ranks.
Two lines per rank-up. Currently being widened by an author.

### 11. Tactics and duties — 55 lines, and this one is FINE.
Explanatory rather than narrative. Recently improved (PT-502). Not a priority.

## Two gameplay problems that authoring cannot fix

1. **Staff do nothing.** They need real effects, or the shop should go.
2. **Scouting's tiers are inert** — the risk/reward progression is gated behind a monetisation model that no
   longer exists. It needs a live progression (coins? facility level? scouting reputation?) or it is a
   system playing at being a system.

Also: **73 web3 leftovers** across the codebase — `contracts.ts` still talks about wallets and on-chain
ownership. Mostly comments and naming, but it is where "stake/unstake" came from, and it misleads anyone
reading the code.

## Recommended order

**Phase 1 — build the surface.** A manager-side narration module, so events have somewhere to be told.
Without it, authored lines have nowhere to go.

**Phase 2 — the silent dramatic beats**, in this order: injuries, transfers/contracts/selling, promotion
and relegation, retirement. These are the moments a player already meets and currently reads as chrome.

**Phase 3 — the journeys**: scouting trips, youth intake, a season run-in.

**Phase 4 — fix the two inert systems** (staff effects, scouting progression) and clear the web3 leftovers.

**Phase 5 — mass authoring** against the new surface, the same way the prompt corpus was done: pack files,
merge, dedupe, register guard.

## One thing to fix first (found today, unrelated)
Authored commentary for `tackle_won` merges into BOTH branches — the attacking-third press (⚡) and the
ordinary tackle (🦵) — so a press line can fire for a defensive tackle. Same for `red_card` (straight vs
second yellow) and `chance` (counter vs open play). Needs branch-specific keys. My bug, introduced when
wiring the commentary packs; an author caught it and wrote zone-neutral lines to work around it.

---

# DECISIONS (user, 2026-08-30, before going to sleep)

1. **Manager events become a full ARC LIBRARY** — not just narration, not just choices on existing beats.
   The player career's 414 branching arcs are the best content in the game; the manager side gets the
   equivalent. A squad revolt, a board ultimatum, a wonderkid's agent, a fixture pile-up. This is what makes
   manager mode playable rather than watchable.
2. **A running SEASON FEED** — events accumulate down the season screen as they happen, and can be scrolled
   back through. Not toasts, not a separate diary page nobody visits.
3. **Backroom staff get REAL EFFECTS** — a Fitness Coach genuinely reduces fatigue drain, an Attacking Coach
   genuinely sharpens finishing. They already cost 350–500 coins; the shop starts selling something.
4. **Scouting is driven by the SCOUTING HQ FACILITY** — the dead NFT tiers are replaced by the facility the
   player already levels 1→5 with coins. Better HQ, better odds and better finds. Gives facility upgrades a
   real payoff and uses a system that already exists.

Build order follows: arcs (the biggest), then the feed to show them, then the two mechanical fixes.
