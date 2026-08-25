# Two-Layer Architecture: Career Sim (breed) + Manager (play)

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
