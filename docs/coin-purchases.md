# Coin purchases — buying in-game coins with real money

**Status:** design / to build. **Decision:** no ERC-20 token — coins are a simple, **closed, one-way**
in-game currency, bought with **fiat via Stripe**. This is the standard, lowest-risk game-monetization model
(V-Bucks / Robux / gems).

---

## 1. The four rails that keep it low-risk (non-negotiable)

Closed in-game currency is safe *only* while all four hold. These are the design guardrails:

1. **One-way only.** Money → coins → spent in-game. **No cash-out, no withdrawal, no conversion back to
   money, ever.** (The moment coins can become money again, it's money-transmission / stored-value territory.)
2. **No trading / no secondary market.** Coins are non-transferable between players and have no external
   market or exchange listing.
3. **No gacha.** Coins buy **known** things only (cosmetics, kit, facility upgrades, reborn, specific items).
   Never a random reward with tradeable value. (Consistent with the non-random mint — see
   `mint-and-dynasty-design.md`.)
4. **No wagering.** Coins are spend-only — never staked on a match outcome for a chance to win more.

Keep these four and coins are effectively "prepaid arcade tokens": very low regulatory risk.

---

## 2. Payment flow (Stripe Checkout)

Fiat via Stripe — Stripe handles the card entry and PCI; we never touch card data.

```
Client                         Server (Fastify)                Stripe
  │  pick a coin pack             │                               │
  ├──POST /coins/checkout────────►│                               │
  │                               ├──create Checkout Session─────►│
  │◄──session url─────────────────┤◄──session id──────────────────┤
  ├──redirect to Stripe Checkout ─────────────────────────────────►│  (card entry, PCI = Stripe)
  │                               │                               │
  │                               │◄──webhook: checkout.session.completed (SIGNED)
  │                               ├─ verify signature             │
  │                               ├─ idempotency check            │
  │                               ├─ addCoins(userId, pack.coins) │
  │◄──success page (poll balance)─┤                               │
```

### Endpoints
- `POST /coins/checkout` (auth) → validates the requested pack, creates a Stripe Checkout Session with the
  pack's price + `client_reference_id = accountId` (and `metadata.packId`), returns the session URL.
- `POST /coins/webhook` (**no auth; Stripe-signed**) → the ONLY place coins are credited. Verify the Stripe
  signature, handle `checkout.session.completed`, then credit.

### Crediting rules
- **Credit ONLY from the verified webhook.** Never from a client "I paid" call or the success redirect
  (the redirect is just UX — the user could close the tab; the webhook is the source of truth).
- **Verify the Stripe webhook signature** (`stripe.webhooks.constructEvent` with the signing secret) before
  trusting anything.

---

## 3. Idempotency (prevent double-credit)

Stripe can deliver a webhook more than once. Credit each payment **exactly once**:
- New table `processed_payments(session_id TEXT PRIMARY KEY, account_id, pack_id, coins, created_at)` on
  **both** sqlite + postgres (follow the existing additive-migration pattern).
- In the webhook: `INSERT ... ON CONFLICT(session_id) DO NOTHING` (or check-then-insert in a txn). If the row
  already existed, **skip** — do not credit again. Only credit on a fresh insert.
- Crediting itself is the existing `addCoins(accountId, pack.coins)`.

---

## 4. Coin packs config
A simple server-side price table (never trust a client-sent price/amount):
```
COIN_PACKS = [
  { id: 'small',  coins: 100,   priceUsdCents: 99   },
  { id: 'medium', coins: 1200,  priceUsdCents: 999  },   // slight bonus for bigger packs
  { id: 'large',  coins: 6500,  priceUsdCents: 4999 },
]
```
(Numbers illustrative — tune later.)

---

## 5. Housekeeping (not blockers, but needed before charging)
- **Stripe account** + a business entity.
- **Terms of Service** + a **refund policy** (state coins are non-refundable virtual goods where allowed).
- **Sales tax / VAT** on digital goods — enable **Stripe Tax** to automate.
- **Minor-spending protections** where required (spend confirmations / limits).
- A lawyer's quick pass on prepaid-balance/virtual-currency rules in target markets (usually routine for
  closed-loop, goods-only, no-cash-out currency).

---

## 6. Where it hooks into existing code
- Crediting: `addCoins(accountId, amount)` already exists (used by Reborn's coin spend) — reuse it.
- New: `POST /coins/checkout` + `POST /coins/webhook` routes, the `COIN_PACKS` config, the
  `processed_payments` table + a `hasProcessed/markProcessed` store method on both backends, and the Stripe
  SDK + webhook signing secret in env.
- Fiat only — do NOT accept crypto for coins (keeps the on-ramp/AML surface off the coin economy; crypto is
  reserved for the NFT mint, where the on-chain token is the actual product).

---

## 7. To decide before building
- [ ] Final coin-pack tiers + prices (and any first-purchase bonus).
- [ ] Refund stance + ToS copy.
- [ ] Which markets at launch (drives the tax/consumer-protection setup).

*(Not legal advice — validate the housekeeping items with counsel.)*
