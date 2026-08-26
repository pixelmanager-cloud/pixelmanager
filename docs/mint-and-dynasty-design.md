# Mint & Dynasty Design — the player-as-product model

> ⚠️ **WEB3 REMOVED (2026-08-27) — see `docs/direction.md`.** The game is going mainstream/Steam with NO
> blockchain. The **on-chain framing here is obsolete** (no NFT, no token, no marketplace, no paid-per-player
> cash mint). What SURVIVES and is still canonical: the **dynasty/reborn model, regressed inheritance, the
> three tuning knobs, keeping=nurture, positions across generations, and the "known-frame, earned-greatness"
> philosophy** — now as an **in-game prospect acquisition** (scout & develop), not a purchase. Read this doc
> for those mechanics; ignore the token/mint/marketplace sections.

**Status:** superseded framing (web3 removed); dynasty mechanics still canonical.
**One line:** you *buy a known player* (a numbered token) whose greatness is *earned through how you
develop them*, and whose *retirement shapes the next generation* — no blind random draw at any point.

This model was chosen deliberately to (a) avoid the loot-box / gacha and securities risk of a paid blind
mint, and (b) make the game itself — not a slot machine — the source of a player's value.

---

## 1. Core principles

1. **A token is a pure ownership receipt.** The NFT holds only a token id (+ ownership, and — optionally —
   generation/lineage). ALL stats, potential, career and inheritance data live off-chain, keyed by token id.
   This is the existing "minimal on-chain" model; this design leans into it fully.
2. **You buy a *known* player.** No hidden roll. Every prospect's starting potential, strengths and
   weaknesses are **revealed on a scouting board** before purchase. Buying is a product purchase, not a pull.
3. **Greatness is earned, not minted.** Two identical prospects become very different pros depending on how
   the owner develops them through the career. A superstar is *made*.
4. **The bloodline is built.** When a genesis player finishes their lifecycle and retires, their **sustained
   career quality and stat shape** bias the *next* generation's potential — regressed toward the mean so a
   dynasty *climbs gradually*, never spirals. Value compounds through skill, across generations.
5. **Rarity = achievement.** Prestige comes from what a player *did* (trophies, awards, Ballon d'Or-type
   honours, a decorated bloodline), all of which are already tracked — not from a lucky mint.

---

## 2. Player experience

### Buying (the Scouting Board)
Instead of a blind "Mint" button, the Academy shows a rotating shortlist of prospects, each fully revealed:

- Name, age 10, appearance, edition number (e.g. `#4,271 · 4 of 10,000`).
- **Frame** — physical potential ceilings (pace / strength / stamina) shown as bars, drawn from a **narrow,
  high-floor band** so nobody is a dud and nobody is a pre-minted superstar. Differences are *archetype*
  (a pacey frame vs a strong frame), not power tiers.
- **A couple of visible innate traits** (flavour: "Quick Learner", "Strong Frame", "Natural Leader").
- **A "leans keeper / leans outfield" hint** — a suggestion only; the GK/outfield path is chosen at career
  start and is fully interchangeable (see the interchangeable-position design).
- **A clear price** — flat per prospect (all viable → fair), or *mild* visible tiering by frame (a higher
  frame costs a little more, like a deluxe edition). Never "pay more for a *chance* at better."

You read the board, evaluate the fit for your system and bloodline, and **buy the specific player you want.**

### Developing (where value is created)
You take the prospect through the 7-stage career. Your choices decide whether they reach their potential or
fall short. Identical frames diverge wildly here — this is the skill layer and the real source of value.

### Retiring → the next generation
When the player retires, their **sustained-prime quality and stat distribution** shape the reborn (next-gen)
prospect's potential envelope — biased toward the parent but regressed toward baseline (§4). A well-managed
bloodline slowly climbs; a neglected one drifts back toward baseline. A dynasty is built, never bought.

---

## 3. Why this is regulatorily safer (the rationale)

The gacha/securities shape is **pay → blind → jackpot → tradeable-for-value**. This model breaks every link:

- **Not blind** — full reveal before payment; you buy a known product.
- **No jackpot** — narrow starting band; no rare-superstar lottery.
- **Value from play, not the draw** — a star is developed, not pulled; the generational step is driven by
  *how well you managed*, i.e. skill, not chance.
- **Reborn is not a paid blind re-roll** — its outcome is mostly determined by the parent's achieved stats +
  regression (earned/known), with only small seeded variance.

Keep the surrounding rails too (they matter more than storage location): **no earn/investment marketing, no
project cut of any secondary market, closed in-game coins, everything fictional.** See
`docs/regulatory-risks.md` (to be written) for the full picture. *(Not legal advice — validate with counsel.)*

---

## 4. The dynasty inheritance model — and its three tuning knobs

This is the heart of the design, and three knobs decide whether it ages well.

### Knob 1 — Regression strength (prevents runaway power creep, protects the downside)
Next-gen potential is biased toward the parent's achieved level but **pulled partway back toward baseline**.
- Too little regression → dynasties spiral to god-tier and break competitive balance (whales own every elite
  bloodline).
- Regression also protects the **downside**: a badly-developed generation's child regresses *up* toward
  baseline, so one bad career can't brick a bloodline.
- The existing `inheritGenes(parentGenes, seed, 0.6, ceilingLift)` already does biased-but-regressed
  inheritance — keep that shape. Improvement should feel like *gradual climbing*.

### Knob 2 — Which stats inherit, and how strongly
Weight by realism so the nurture loop stays meaningful:
- **Physical** (pace / strength / stamina) inherits **more** — genetics.
- **Technical / mental** (composure, creativity, passing, etc.) inherits **less** — those are learned fresh
  each career.
- **Shape / position bias** carries as a **soft nudge** to the potential distribution (a striker bloodline
  *leans* attacking) — never a lock, to stay consistent with interchangeable GK/outfield and earned position.

### Knob 3 — "Career-best" vs "sustained prime"
Base inheritance on **sustained-prime quality** (how good they actually *were* across their peak years), not
a single career-best spike. Career-best over-rewards a one-season wonder and is easier to game.

### Illustrative bloodline over time
> Gen 1: buy a known frame (PAC 16 / STR 13 / balanced), ★★★★☆ ceiling → you develop them into a prime-OVR-80
> winger. → Gen 2 potential is nudged: physical ceilings biased toward that peak but ~half-regressed, a
> slight attacking shape, ceiling ≈ parent's prime ± regression. Manage well again → Gen 3 climbs a touch
> more. Neglect one → it drifts back to baseline.

---

## 4b. Positions & the keeping stat across generations (DECIDED)

**Keeping is a pure *nurture* stat, not a heritable gene.** Only physical attributes
(pace/strength/stamina) inherit as genes; keeping — like passing/shooting/composure — is developed by
playing the GK track that career. A keeper's high keeping is a *graduation outcome*, not a birthright (a
genesis keeper doesn't start with high keeping at age 10 — they develop it).

Consequences (this is the intended, clean behaviour):
- **A keeper's descendant can pivot to outfield with zero friction.** They inherit the physical *frame*
  (position-agnostic — a tall/strong keeper's frame makes a great commanding centre-back), start keeping at
  baseline (they don't train it), and develop outfield skills instead. There's no "keeper gene" to waste.
- **Optional flavour — a soft "keeper bloodline" nudge:** if we want goalkeeping dynasties, a keeper parent
  can give a *small* keeping-potential bias (a nudge, never a lock). And if the lineage then keeps
  developing outfield, **that bias regresses toward baseline over the generations** — an untended trait
  fades (regression-to-mean applied to an unreinforced skill). Use it and it compounds into a keeper
  dynasty; ignore it and the bloodline "becomes" an outfield family.

Recommendation kept: keeping = nurture (no keeper gene). Add the soft bloodline nudge only if we want
dynasty flavour; its regress-when-unused behaviour is the correct, self-correcting design.

## 5. Competitive-balance note (newcomers)
Good management concentrating elite bloodlines among veterans is meritocratic, but a **fresh baseline genesis
must be strong enough to compete**, and divisions / matchmaking should account for bloodline strength — or
new players bounce off. Design the baseline band and the ceiling curve so a well-played gen-1 can beat a
poorly-played gen-5.

---

## 6. Technical mapping (how it lands in the codebase)

- **Token = numbered ownership receipt.** Genes/potential/inheritance fully off-chain, keyed by token id.
  On-chain `mint()` stops using `block.prevrandao`; the "purchase" is an app transaction for a known,
  pre-generated prospect. (Reveal-before-pay is impossible with a `prevrandao` roll, so that must go.)
- **Scouting board = pre-generated, deterministic prospects.** Server generates the board (seed = `drop:slot`
  or similar), shows full stats, and you buy a *specific* one. Its genes were known before purchase.
- **`rollGenes`** → a genesis variant drawing from a **tight, high-floor band** (no jackpot spread). Reborn
  keeps the wider, parent-biased inheritance.
- **Reborn/inheritance** → extend the current physical-gene inheritance toward the full "sustained-prime
  shape" model of §4, keeping regression (Knob 1), physical>technical weighting (Knob 2), prime-based (Knob 3).
- **UI** → an Academy **Scouting Board** screen (revealed prospect cards + price + Sign), replacing one-click
  mint. GK/outfield chosen at career start.
- **Payments** → the "purchase" runs through the app (fiat via a processor, or crypto), crediting ownership —
  a product sale, not a speculative mint. See `docs/coin-purchases.md` (to be written).

This is web3/contract + mint-flow territory — **out of the overnight agents' lanes**; we build it together.

---

## 6b. What the token is (and isn't) + minting & marketplace

**The token is a numbered title deed, not the data.** On-chain lives only ownership of `tokenId`. The actual
player — stats, career, dynasty — is a server-side record keyed by that id. A trade moves the *number*; the
server re-associates the player with the new owner (`syncOnchainTokens` already reconciles off-chain state
from on-chain ownership). So people are trading **numbered receipts**, and the server resolves what each
number *means*.

Accept the tradeoff clearly: the token is only as valuable as our continued operation of the service (data
is off-chain). It is a **portable, ownable, resellable title**, not the value itself — the game is the value.
This does NOT reduce securities risk (it leans into the "value from the operator's efforts" prong); the
mint-shape + no-earn-framing + no-resale-cut mitigations do that. The NFT layer is a *deliberate choice* for
three benefits — true wallet ownership, permissionless peer-to-peer resale (no marketplace for us to run),
and future portability — not a technical necessity (the whole game could run fully off-chain with less
regulatory surface).

**Minting & marketplace decision:**
- **Primary mint (selling new prospects) → our own site.** The reveal-before-pay scouting board is a custom
  flow marketplaces can't do; we control pricing/reveal/framing (also the safer shape) and dodge mint bots.
  Tooling: thirdweb (mint/claim + embedded fiat-or-crypto checkout) or roll our own with viem + Stripe.
- **Secondary resale → passive, on OpenSea/Blur/etc.** Standard ERC-721 auto-lists there; we don't build or
  run a marketplace (lower securities/MSB exposure, and royalties are unreliable anyway). Off-chain stats are
  no barrier — `tokenURI` points at our metadata endpoint.
- **Solve dynamic-metadata staleness by keeping the on-chain-referenced metadata to STABLE facts only**
  (edition #, generation, portrait, maybe position) and keeping all live/changing stats **in-app**. Avoids
  marketplace cache fighting and reinforces "the real player lives in Football Royalty."

## 7. To decide before building
- [ ] Baseline band width + ceiling curve (Knob 1 + §5 balance).
- [ ] Exact physical-vs-technical inheritance weights (Knob 2).
- [ ] "Sustained prime" definition — which seasons/stats, how averaged (Knob 3).
- [ ] Board size, refresh cadence, and pricing (flat vs mild tiering; scarcity via numbered/themed drops).
- [ ] Whether reborn costs coins/fiat, and how small its seeded variance is.
- [ ] Fiat vs crypto for the purchase rail.
