# Two-Layer Architecture: Career Sim (breed) + Manager (play)

> ⚠️ **Partially superseded (2026-08-27) — see `docs/direction.md`.** Web3 removed: any on-chain "breed/mint"
> framing here is dead. The **two-layer game design (career-sim development + manager play) still stands** —
> it was always off-chain game logic.

Two interconnected games sharing **one Player NFT asset**:

- **Layer 1 — Career Sim** (turn-based card game): *develop* a player through seeded
  scenarios; card choices compress into stats at career's end → mints a Player NFT.
- **Layer 2 — Manager** (the existing football-manager game): *use* Player NFTs to build
  squads and play matches.

Two roles on one marketplace: **breeders** develop + sell finished players; **managers** buy
+ field them. Splitting production from consumption removes the "one user must grind many
deep NFTs" tension. See the design chat for the full economic rationale (and the Axie
parallel: the model can work, but is growth-dependent — sustainable *manager demand* is the
make-or-break, and the token economy is the audit/legal/econ-modeling gate).

---

## 1. Project structure — one monorepo, shared everything, two clients

The **PlayerNFT stat schema is the API between the two games** (producer ↔ consumer). Keep it
in one shared package so it can never drift. Extend the existing npm-workspaces monorepo:

```
pixelmanager/                    ← same GitHub repo, same push-to-main
├── shared/   @fm/shared         ← SHARED: Player type + stat schema, overall(), seeded RNG,
│                                   tiers  + NEW: card/scenario engine + stat-derivation
├── contracts/ Foundry           ← SHARED: PlayerNFT (v2), token, marketplace — one source of truth
├── server/   Fastify + Postgres ← SHARED: one backend, one DB, one account/auth, on-chain reads;
│                                   serves BOTH games' APIs
├── client/   Manager (Phaser)   → Netlify site #1  (manage.*)
└── career/   Career Sim (cards) → Netlify site #2  (develop.*)   ← NEW workspace
```

**Deploy topology — almost entirely reused:**

| Layer | Change |
|---|---|
| GitHub | unchanged — one repo, push-to-main |
| Railway (server + Postgres) | unchanged — add career endpoints to the same server + DB |
| thirdweb / Base / contracts | unchanged — both clients use the same addresses |
| Netlify | **+1 site**: two sites from one repo (per-site base dir + build cmd) |

One account/wallet works across both sites (shared auth + DB). Two apps (not one) because
breeders never watch matches and Phaser is a heavy bundle — keep each client lean.

---

## 2. The shared interface (`@fm/shared`) — nail this first

Everything hangs off the Player schema. Proposed **PlayerAttrs v2** = the existing physical/
technical stats (what the engine already uses) **+ a mental/personality layer** the Career Sim
primarily shapes and the engine reads for diversity. Every stat must have BOTH a card-play
source and an engine effect — no decorative stats.

```ts
interface PlayerAttrs {
  // ── Physical / technical (engine core; today's 10, lightly renamed) ──
  pace; strength; stamina;
  passing; shooting; tackling; heading; positioning; keeping; setPiece;
  // ── Mental / personality (NEW — shaped by career card-play) ──
  composure;   // finishing/decisions under pressure
  aggression;  // tackling intensity + foul risk (double-edged)
  creativity;  // through-balls, chance creation
  teamwork;    // link-up passing, off-ball movement
  leadership;  // small team-wide steadiness boost when on the pitch
  // decisions/discipline can be added later — start lean
}
overall(p): number         // unchanged philosophy; mental stats add flavor, not raw power
nftTier(overall): Tier     // unchanged
```

> **Scope note (solo dev):** 15 stats is already a lot to derive + balance. Ship the mental
> layer **3 at a time** (start: composure, aggression, creativity) and add teamwork/leadership
> once those feel good. Don't mint the "final" schema until the derivation feels right — the
> schema is forever once players are on-chain, so prototype it **off-chain** first.

---

## 3. Career Sim — data model & loop (the thing to prototype)

Deterministic (seeded scenarios + transparent derivation), no LLM — consistent with the
engine ethos and makes derived stats verifiable on-chain.

```ts
type Tag = 'composure'|'aggression'|'creativity'|'teamwork'|'leadership'|'stamina'|'flair';
interface Card     { id; name; tags: Tag[]; power: number }          // your "hand"
interface Scenario { id; kind: 'match'|'social'|'training';
                     demand: Partial<Record<Tag, number>>; seed }     // what this moment rewards
interface Choice   { scenarioId; cardId; outcome:'success'|'partial'|'fail'; score }
type CareerLog = Choice[];                                            // accumulates across seasons
deriveStats(log: CareerLog, seed: number): PlayerAttrs;              // the "compression"
```

**Loop:** each turn a seeded **Scenario** appears with a demand profile → you play a **Card**
from your hand → tag-match vs demand yields an **outcome + score** → logged. Over a career:

- **Choice *pattern* → stat SHAPE.** Tag frequencies normalize into which stats are emphasized
  (lots of creativity/flair → a dribbler; strength/heading → a target man). Shape = playstyle.
- **Choice *success rate* → stat MAGNITUDE.** How well you played → how high those stats go.
- **+ regression-to-mean + seeded noise**, so identical play never yields identical players
  (keeps the gene pool diverse and the meta un-solvable).

**Core design principle — you can't be great at everything.** Scenarios must force trade-offs
(a card strong for composure events is weak for aggression events). Breeders then *specialize*,
producing *shaped* players managers actually want to shop for. If there's a solvable optimal
sequence, every player converges and the marketplace dies. Diversity must be structural.

---

## 3b. A human life — age lifecycle (IMPLEMENTED in the prototype)

An NFT player isn't a stat block, it's a *life*. Age is the through-line connecting the two games.

- **Development (breeder), age 10 → 25** = the Career Sim. Rendered as **5 age chapters** — Grassroots
  (10-13) → Academy (14-16) → Youth Team (17-19) → Breakthrough (20-22) → Establishing (23-25) — ~54
  turns, *not* 300. Scenarios + stakes are **age-gated**: a 12-year-old plays park football; cup finals
  only unlock as you break into the first team. A draft + an age-milestone event fires each chapter.
  **Graduation at 25 = the player's PRIME.**
- **Playing (manager), age 25 → 40** = the NFT's 15 pro seasons. The minted stats are the age-25 prime
  prime. The Manager game ages him **per season** — `developAttrs` (lifecycle.ts) raises the ten
  physical/technical stats while he is young and `ageSquadAttrs` (transfermarket.ts) declines them as he
  gets old — so ability and value still *arc*: buy a young star, he peaks, then declines. The MENTAL layer
  does not move: temperament is career-forged and stays as the career made it.
  (A read-time age curve was described here and removed on 2026-09-01: it never had a production caller,
  and projecting from an immutable prime does not fit a manager phase that rewrites the stats every
  season. See the note where it used to live in career.ts.)
- **Retirement at 40** → lineage: the physical genes pass to a **son** who begins development at 10.

This makes genes even more meaningful: the innate physical band is your *prime ceiling*, realised by 25
and then eroded by age — exactly like a real athlete.

### NFT graduation at 25 — "burn & swap" options

At graduation the in-development thing becomes the playable Player NFT. Three ways to realise it on-chain
(a **P3+ / mint-bridge decision**, not needed for the off-chain prototype):

1. **Mint-at-graduation (recommended for v1).** Development runs OFF-CHAIN (app/DB); only at 25 do you
   **mint the Player NFT** with the prime stats. No Prospect token, no burn tx, one mint. The "burn" is
   conceptual — the dev record is consumed into the mint. Cheapest, simplest; the finished pro is the
   tradable asset (matches the breeder→manager economy).
2. **Prospect NFT → burn → Player NFT.** Mint a *Prospect* NFT at 10 (on-chain-anchored development,
   tradable youngsters), then **burn it and mint a Player NFT** at 25 (two collections). What "burn &
   swap" literally describes. Enables a *prospect market* but costs a burn+mint (gas) and two contracts.
3. **Evolve in place.** One token whose metadata/stats **flip from Prospect→Player** at 25 (same tokenId).
   Cheaper than burn+remint, preserves provenance, still allows a prospect market.

**Recommendation:** ship **#1** for v1 (mint finished players only), and add a prospect market later via
#2 or #3 if trading in-progress youngsters proves desirable. All three keep the age-25 prime as the
graduation stats as the starting point, aged per season by `developAttrs`/`ageSquadAttrs`
for the playing phase.

---

## 3c. Player finances & contracts — "extend or sell" (model DONE, wiring TODO)

A footballer's financial life, layered onto the shared NFT. All the **rules are already built and
verified** in `@fm/shared` (`contracts.ts`, re-exported through the barrel; career-side inputs in
`career.ts`). What's left is server persistence + client UI — no new game-design decisions.

**Career-side inputs (done, `career.ts`).** A career yields, alongside stats: `greed` (financial
temperament, set by the **agent** you sign + nature + money chased in-career), `marketability` (brand/
fame), and running `earnings`. A mid-career **financial-offer** phase (`type:'offer'`) forks money vs
development. All deterministic + snapshot/resume-safe.

**Contract brain (done, `contracts.ts`).** The NFT is **always** an owned wallet asset; a contract only
gates **selection**.
- `signContract(season, greed, personality) → { signedSeason, lengthSeasons }` — length from
  `contractLength` (loyal 5 seasons, mercenary 2).
- `contractView(overall, age, greed, marketability, personality, contract|null, season)` →
  `{ available, seasonsLeft, lengthSeasons, extendCost, sellValue }`. A lapsed contract (or an unsigned,
  just-acquired NFT) → `available:false` (**benched, not gone**) with `extendCost` (`contractCost`) and
  `sellValue` (`releaseClause`) both surfaced.
- Manager payoff already wired: `sponsorIncome` scales with squad `marketability` (fame helps pay wages).

**Server wiring (TODO — needs the running DB; do at PC).**
1. **Table** `contracts(owner_id, player_id, signed_season, length_seasons)` in both stores
   (`store-sqlite.ts` + `store-postgres.ts`); `Store` methods `getContract/setContract/contractsFor`.
2. **Acquire → sign.** When an NFT first joins a club (mint at graduation, or a market purchase), call
   `signContract(currentSeason, greed, personality)` and persist. `currentSeason()` already exists.
3. **Selection gate.** In lineup building (where injuries are already filtered — `injuries.ts` / the
   `healthy` filter in `seasons.ts`), also drop NFT players whose `contractActive(...)` is false. Base
   academy players have no contract and are always available.
4. **Extend endpoint** `POST /players/:id/extend`: charge `extendCost` coins (reuse `addCoins`), then
   `setContract(signContract(currentSeason, …))`. Reject if coins short.
5. **Sell** reuses the existing **market** (`market.ts` listings) — list at ≥ `releaseClause` as guidance.

**Client UI (TODO — at PC).** In the squad view, render each owned player's `contractView`: a
"contract expires in N" badge; when `available:false`, grey the row out of selection and show two buttons
— **Extend (–extendCost coins)** and **Sell (list on market, ~sellValue)**.

---

## 4. Match-engine upgrade — read the mental layer for diversity

The engine already reads physical/technical stats. Add small, bounded hooks so the new mental
stats visibly change how a player behaves (this is what makes career-developed players *feel*
distinct). All deterministic; all must keep `npm run verify` green (calibration, anti-spam,
counter-triangle, fuzz):

| Stat | Engine hook |
|---|---|
| composure | finishing conversion when under pressure / in the box |
| aggression | tackle success ↑ **and** foul/turnover risk ↑ (double-edged) |
| creativity | through-ball frequency + chance quality |
| teamwork | pass-completion in link-up, off-ball support positioning |
| leadership | tiny team-wide fitness/steadiness bonus while on the pitch |

Keep each effect small and independently toggleable so balancing stays tractable.

---

## 5. Phasing — how a solo dev actually ships this

Each phase is playable/valuable on its own; stop-and-reassess between them.

- **P0 — Schema + interface.** Lock PlayerAttrs v2 (physical + first 3 mental) in `@fm/shared`;
  extend `rollAttrs`/`overall`/tiers; backfill helper. No new game yet.
- **P1 — Career Sim, off-chain, single-player.** New `career/` workspace: hand of cards, seeded
  scenarios, the loop, `deriveStats`. **Goal: prove it's fun and produces diverse players.**
  No NFT, no economy. This is the make-or-break — do not skip validating fun.
- **P2 — Engine reads mental stats.** Add the §4 hooks behind flags; keep verify green.
- **P3 — Mint bridge.** A completed career mints a PlayerNFT (v2 contract) with derived stats;
  the Manager game already consumes NFT stars, so this "just works" once the schema matches.
- **P4 — Two-sided marketplace.** Breeders list finished players; managers buy. Reuse the
  existing thirdweb marketplace + coins/token seam. Testnet, valueless.
- **P5 — Economy modeling.** Throughput (breeder output vs manager churn), price equilibrium,
  fees. Only after there's real liquidity to observe.
- **P6 (later) — Lifecycle & lineage.** 20-season lifespan, burn playable asset + mint soulbound
  "legend card", son = inherited **bias on a randomized roll** (not deterministic copy).
  Deliberately last — forced obsolescence in a thin market accelerates a death spiral.

---

## 6. Solo-dev feasibility — honest read

**Doable, because it's incremental on infra you already own** (engine, seasons, web3, marketplace,
account system) and you have force multipliers most solo devs don't (the autonomous agent + bot
harness). The two failure modes to actively manage:

- **Scope creep.** Every "+more stats / +more engine" multiplies balancing surface. Add mental
  stats 3 at a time; keep each with a card source + one engine effect; cut anything decorative.
- **The economy.** The games are the *easy* part. Sustainable manager demand + tokenomics is the
  hard, risky part — keep it deferred (P5+), testnet, and modeled before any value. This is also
  the legal/compliance gate.

Realistic cadence: P0–P2 is a few focused weekends (it's mostly a new client + shared code you
understand). P3–P4 reuses existing rails. P5–P6 is the long, careful tail. Ship P1 and see if the
card game is fun before committing to the rest — that single question de-risks the whole vision.

---

## 7. Open questions (unchanged from brainstorm)

- Exact stat-inheritance formula/% (P6). Lean: inherited bias on a randomized roll, ~50–70%.
- Burn parent vs "Hall of Fame" — recommend: burn playable asset + mint a soulbound legend card.
- Marketplace mechanics (auction vs fixed vs royalties) + fee structure (the lever that sets how
  many breeders exist). Model in P5.
- Cross-game pacing sync (one career "season" ≈ one manager season?).
