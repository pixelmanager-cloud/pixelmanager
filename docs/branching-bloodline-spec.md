# The Branching Bloodline — build spec

Settled with the user 2026-08-30. This is the contract; if the build disagrees with this file, the file wins
until it is deliberately changed.

## The shape of it

A dynasty is a FOREST, not a chain. Each generation produces 1–3 heirs. The player plays ONE of them as a
card career; the others are real people in the world. At the next succession the player may continue from
ANY living branch — his son, or a nephew from the brother he passed over.

    G1  Kai ─┬── G2  Ross      (played)  ─┬── G3  Milo   (played)
             ├──     Dane      (brother)  └──     Arlo   (brother)
             └──     Tomas     (brother)  ── G3  Nia's boy … also selectable

## 1. How many heirs — VARIES, 1 to 3, seeded

`heirCount(parentSeed, generation)` → 1 | 2 | 3, a pure hash. Weighting: **1 → 20%, 2 → 40%, 3 → 40%.**

A generation with a single son is deliberate: it is lifelike, and it makes the generations that DO offer a
choice feel like an event. It must never feel like a bug, so a one-heir succession says so in words ("one
son, and the name goes with him").

## 2. Branch switching — BUILT (2026-08-30)

At succession the player is offered the sons of the line he just played AND the sons of the branches he
passed over a generation ago — his nephews. The screen groups them: his own boys, then a rule, then "or,
from the brother you passed over". Taking one is what moves the trunk: every candidate is minted as
`branch: 'sibling'` and `startCareer` promotes the chosen one to `'played'`.

**A brother is never selectable himself.** He is the retiring star's age — a man in his thirties, not a boy
to take on. What carries a passed-over branch forward is his SON, which is also what the succession copy
had already promised ("you may come back for a nephew one day").

### Bounding the forest — the part that needed measuring

The first cut let every passed-over branch father sons at a probability chosen by eye. That is wrong, and
`shared/qa_branching.ts` caught it: every *unchosen candidate* is itself a branch that can carry on, so the
population feeds back on itself. With sons averaging 2.2 and each branch fathering 0.75, the steady state
is ~5 live branches with a long tail — over 300 ten-generation dynasties, one succession offered **21
candidates**. That is not a choice, it is a phone book.

Two rules fix it by construction rather than by hoping the distribution behaves:

- `BRANCHES_KEPT = 2` — at most two passed-over branches are swept, nearest the trunk first (sons before
  cousins). The family keeps in touch with two branches and loses the rest.
- `nephewCount` weighted **70/25/5** — most branches leave the game entirely. A line quietly ending is what
  makes the tree read as a family rather than a bracket.

Measured over 300 dynasties × 10 generations: **2.69 candidates per succession, max 6**; 12% of successions
offer a single heir and no choice; 97% of dynasties are offered a cousin at some point.

Every branch of the retiring generation is then RETIRED, swept or not — those men are the star's age. Before
this, siblings were minted as prospects and left there, so a fifth-generation save was quietly offering a
great-great-uncle in the prospect pool as a boy to take on.

Implication: the save holds a forest. `Token` gains `parent_id`, `branch_seed` (a branch's own heir seed —
it cannot be recomputed later, because the played line reuses its token id and overwrites `career_seed`
each generation) and `father_name`. Nothing may assume the previous generation's played heir is the next
one's father.

## 3. The brothers are FULL PLAYERS — not summary rows

> **STATUS 2026-09-05: NOT IMPLEMENTED, apart from the third bullet.** A passed-over brother ships as a
> Token with no `attrs_json`; `fieldablePlayers` (client/src/api.ts) deliberately keeps him out of the
> squad, so he is neither signable nor in an opponent's XI and `advanceSquad` never touches him. What IS
> shipped is the career record: a derived `branchCareer` row (shared/src/renown.ts) on the Family Record and
> in the renown scorer. `heirAsPlayer` (shared/src/bloodline.ts) is the unbuilt half and only
> `shared/qa_bloodline.ts` calls it. Annotated rather than rewritten, because this file is the contract and
> not a status report — building it is §106 of the CK queue.

**The user was explicit: "they become full players, the same as other generated players with their own
stats, mentalities, characteristics, etc."** So an unplayed brother is minted through `mintSquadPlayer`
(15 stats + personality + earned traits + age + durability + morale) from HIS OWN genes — the same path
every rich squad player already takes. He is not a card career and not a stat line.

He must then be consequential in three ways, all chosen by the user:

- **Signable into your squad.** He appears in the transfer market as a real listing, flagged as family. Given
  the stated goal that squad players feel personal, a brother in the XI is the strongest form of that.
- **Turns up at rival clubs.** He can be in an opponent's side, score against you, knock you out of a cup.
- **A career record on the tree** — peak overall, division reached, honours — via the existing
  `career_honours_json` (added for PT-955) so the tree can show what he actually did.

He ages and develops across the manager seasons on the SAME lifecycle as squad players (`advanceSquad`), so
he is never frozen while the played line moves.

## 4. What the player knows when choosing — SCOUTED, WITH UNCERTAINTY

Per heir: his name, his temperament (the personality already rolled), the family attribute he inherited, and
a **star-rated scouted ceiling** — never raw genes or exact numbers. Reuse the existing "scouted ceiling"
language and the ★ rating already on the player card. The choice should have weight without being solvable
by picking the biggest number.

## 5. Genetics — BUILT AND MEASURED (`shared/src/bloodline.ts`)

Correlated but distinct, per the user: *"inherit the father but be different in parts, like how siblings are
different from each other."* Three layers — a family attribute rolled ONCE per bloodline and shared; the
other attributes regressed harder and re-rolled per child; temperament rolled per child and never inherited.

Verified in `shared/qa_bloodline.ts` (in `npm run verify`) over 400 bloodlines:
brothers differ 0.49 pts on the family trait and 2.21 pts on everything else; 98% of sibling sets have
different temperaments; 0 identical brothers.

## 6. Save model

- `Token.parent_id: string | null` — the forest edge. DONE, with `SAVE_VERSION` 1 → 2 (`migrate()` in
  save.ts, covered by `client/qa_migrate.ts`). The migration recovers the chain from the GENERATION counter
  rather than `legacies.rebornId`: before branching there was exactly one heir per generation, so each
  token's father is simply the one generation above it. Without it an existing multi-generation save
  rendered as a row of orphan trunks on the Family Record.
- `Token.branch_state` — whether this person was played, is an unplayed brother, or is a dead branch.
- The existing `tokens` array is already a list, and `main.ts:1084` already picks the active prospect from
  several, so the storage layer needs less work than expected.

## 7. Pacing — the tension to watch

The user previously wanted generations SHORTER (~50–70 min) so a dynasty accumulates. Branching adds a
choice screen and more world state, which pulls the other way. The choice is the interesting part, so the
extra time must go there and NOT into more card turns. If a generation grows past ~70 minutes, cut turns
before cutting the choice.

## 8. Out of scope for the first build

Mothers/partners as tree nodes; marriages between bloodlines; more than one PLAYED career per generation;
branches older than the grandfather being selectable.
