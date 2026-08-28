# Pre-launch checklist — what we still lack

**Purpose:** a living, tick-as-you-go list of what stands between the current build and a Steam launch.
Companion to `feature-gap-analysis.md` (the *why* + competitive research) — this is the *what's-left* tracker.
Check items off (`[ ]` → `[x]`) as they ship. Last reviewed: **2026-08-28**.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done · `(design)` = design choice, revisit not required.

---

## A. Launch-blockers — must be done to ship on Steam

### Platform / plumbing
- [ ] **Desktop wrapper (Tauri)** — game is still a web client; needs a Tauri shell. Tauri over Electron (keeps download ~70 MB, not ~150 MB). *Phase 3 in `direction.md`.*
- [ ] **Steamworks achievements wiring** — 20 achievements already exist in-game (`shared/src/achievements.ts`) with stable ids; map each id → a Steam achievement via the SDK.
- [ ] **Steam Cloud save round-trip** — saves are local IndexedDB (`client/src/save.ts`); wire the save file to Steam Cloud and verify sync across two machines (ship-blocking QA item).
- [ ] **Controller support** — none in code; needed for a "Full Controller Support" tag + Deck.
- [ ] **Steam Deck compatibility pass** — not evaluated; verify input, resolution, text legibility, performance.
- [ ] **Steamworks application approved** — [~] submitted 2026-08-28, awaiting approval.
- [ ] **Store page** — planned week of ~2026-08-31 after approval (see §D).

### Presentation / assets
- [~] **Club badges** — generating original crests via Retro Diffusion (120-set, unique-motif pass in progress). `client/public/badges/` + `badge-manifest.ts`.
- [ ] **Nation flags** — fictional-country flags (via Retro Diffusion, confirm count/cost first).
- [ ] **Replace generic SVG icons** — `sprites.ts` inline SVG icon set → RD pixel art.
- [ ] **Player / manager portraits** — none exist; procedural only. Cheap in MB (~4 KB each).
- [ ] **Kits / trophies / stadium art** — none; optional but raises store-page appeal.
- [ ] **Capsule / header / library art** — Steam store visuals (RD-generatable; needed for store page).
- [ ] **Screenshots + short trailer/GIF** — text match view, Trophy Room, bloodline tree, scouting board all show well.

### Integration / QA (the highest-risk item)
- [ ] **Career ↔ manager seam playtest** — validate the hand-off ("take the reins") feels like ONE game, not two bolted together. *Hybrid games are graded on their weakest integrated system (Soccer Story lesson) — this is the single most important pre-launch validation.*
- [ ] **Full offline dynasty playthrough** — New Game → career → graduate → manage seasons across the 10-tier pyramid → retire → inheritance → heir, confirming persistence across reloads.
- [x] **Deterministic engine + save/facade QA harnesses green** — `npm run verify` (6 suites) + `npm run qa` (~21 harnesses) passing; transfer-market QA added this session.

### Store framing (copy-only, but launch-critical)
- [ ] **Frame the deliberate cuts** — store copy must present the owner-manager choice (no board/sack pressure) and text-only matches as *intentional design*, or reviewers read them as "thin."
- [ ] **Store copy** — short + long description, feature bullets, tags (incl. accessibility tags Steam surfaces on the page).

---

## B. Depth gaps — raise perceived completeness / differentiation (not strictly blocking)

- [~] **Transfer market** — built this session (`shared/src/transfermarket.ts`): tier-scaled fictional listings, buy/sell, incoming bids. *Still lacks:* AI bidding wars, multi-lever haggling.
- [~] **Contract negotiation** — built this session (`shared/src/contracts.ts`): wage × length with personality-driven premiums, accept/counter/reject. *Still lacks:* release clauses, loyalty/playing-time levers (FM-style).
- [ ] **Scouting rivalry** — rival clubs competing for the same prospects (currently tier-gated reveal only).
- [ ] **Relationships/family as persistent characters** — spouse/kids you see & interact with over time (currently folded into career life-events + gene inheritance; BitLife shows the richer model).
- [ ] **Club finances as a real lever** — wage-bill / budget-split tension (facilities are a coin sink today).
- [ ] **"Manage the nation" mode** — international is a spectator-style tournament path; no squad selection.
- [ ] **Difficulty options** — none. Deferred by design, but Steam now surfaces "Adjustable Difficulty" as a store tag — worth revisiting.

### Accessibility (Steam surfaces these as store-page tags)
- [x] Volume / mute controls · reduce-motion · CRT toggle · **UI scale 80–130%** · keyboard toggles.
- [ ] Colorblind / contrast options.
- [ ] Key rebinding.

---

## C. Done since the original gap analysis (2026-08-27→28) — for reference
- [x] Achievements (20 milestones, unlock toasts + chimes, X/20 screen).
- [x] Bloodline Tree visual (family tree in the Trophy Room — the screenshotable centrepiece).
- [x] Records / Hall of Fame (Trophy Room + Hall of Legends).
- [x] SFX reward chimes (chiptune Web-Audio, separate SFX volume/mute).
- [x] Inheritance/will decision (Craft/Name/Fortune at hand-off, real deterministic effects).
- [x] 10-tier promotion/relegation pyramid (`shared/src/clubseason.ts`), validated + calibrated.
- [x] Fully-offline migration (server/PvP removed; in-process facade + IndexedDB saves).

---

## D. Suggested sequence
1. **Finish the art pass** (badges → flags → icons → portraits) — underway, cheap, most store-visible.
2. **Playtest the career→manager seam** — highest risk, cheapest to test now.
3. **Platform plumbing** — Tauri wrapper → Steamworks achievements → Steam Cloud → controller/Deck pass.
4. **Store page** — copy (frame the deliberate cuts) + capsule art + screenshots/trailer.
5. **Depth fillers** as time allows — bidding wars, finances, scouting rivalry.
