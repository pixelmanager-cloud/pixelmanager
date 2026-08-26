# Offline single-player shell — the game's frame

**Status:** design blueprint. Companion to `docs/direction.md` (offline-first, Steam) and
`docs/growth-and-content-strategy.md` (the depth that fills this shell).

The core game is **fully offline single-player**. This doc defines the *frame* around the systems you've
already built: the fantasy, the first-15-minutes onboarding, the core loop, the navigation shell, the
long-term goals, and what's new-to-build vs reuse.

---

## 1. The fantasy (the spine)
**You are the owner-manager of a club. You develop kids into stars, build bloodlines across generations, and
chase glory season after season.** The **dynasty** is the through-line — every system feeds it.

## 2. First 15 minutes (make-or-break on Steam — lead with the unique hook)
Do NOT open with management complexity. Open with the thing nobody else has — developing *your* player:
1. **New Game** → name your club (~10s), start at the bottom tier (or pick).
2. **Your first prospect** — a quick scouting board: 2–3 *revealed* 10-year-olds; pick the one you like (free).
3. **Straight into the career** — play a handful of moments. Immediately feel the loop: choices, energy, the
   relationship meters, the kid visibly growing. *This is the fun — show it in minute two.*
4. **Graduate → "he's in your squad now"** → play **one match** (pixel match + commentary) for the payoff.
5. **Widen out** — reveal the academy (more prospects), the season/table ahead, facilities.
6. **Tease the dynasty** — "years from now, when he retires, his child carries the bloodline." The hook that
   makes a player commit to the long haul.

Principle: front-load the **unique + emotional** (develop *my* player), then expand into management. Anyone
who plays 15 minutes should *get it* and want more.

## 3. The core loop (every session)
**Scout/acquire prospects → develop them (career) → graduate into your squad → manage & win seasons (vs AI)
→ players age & retire → reborn into next-gen prospects (the dynasty compounds) → repeat, climbing tiers.**

Every part already exists — this is about *framing* it as a single-player journey.

## 4. The shell / navigation (mostly reuse)
A **Club Hub** with tabs, reusing existing screens:
- **Squad** (your players) · **Academy** (prospects + careers) · **Manager** (fixtures / table / tactics /
  match) · **Scouting** · **Facilities** · **Trophy Room / Records** (new-ish) · **Cosmetics** (later).
- **Main Menu**: New Game / Continue (save slots) / Settings.

## 5. Long-term goals (what makes it a 50-hour game)
- **Climb the tier pyramid** (Sunday League → World Class — already built).
- **Build a legendary bloodline** — a dynasty you nurtured into greatness.
- **Records & legacy** — trophies, Ballon d'Or-type awards, legend cards, a hall of fame of the players *you*
  made. (This is the emotional long-tail — surface it prominently.)

## 6. New-to-build vs reuse (so it's actionable)

**Reuse — already built (the whole game engine):**
- Career mode (NSS-style development, cards, meters, focus, lifestyle, kit, matchday moments)
- Deterministic match engine + text commentary + pixel match view
- Seasons / pods / cup **vs AI**, the 10-tier pyramid, promotion/relegation
- Scouting, facilities, transfer market, reborn/dynasty + inheritance, awards/leaderboards

**New-ish — the offline shell (this doc's build list):**
- [ ] **Main Menu** + **New Game** onboarding flow (club name → first scouting board → guided first career).
- [ ] **Save slots + Steam Cloud** — replace the account/login framing with **local profiles / save files**
      (the current auth/accounts model becomes a local save; SQLite file = the save, synced by Steam Cloud).
- [ ] **Guided first-career tutorial** (light, skippable — teaches the development loop by *playing* it).
- [ ] **Trophy Room / Records / Hall of Fame** screen (surfaces the dynasty legacy).
- [ ] Reframe navigation into the **Club Hub** (tabs above) — mostly wiring existing screens together.
- [ ] Remove multiplayer-only framing from the default flow (leagues run vs AI locally).

**Later (Steam-readiness — `direction.md` Phase 3):**
- Desktop wrapper (Electron) embedding the local server + SQLite; Steamworks (achievements/cloud/overlay).

## 7. Guiding principle
The offline game is **~80% reframing + a shell + onboarding** over systems that already exist — not a new
game. The heavy lifting is now **content depth** (the growth-and-content strategy / the agents) and
**onboarding + polish** (making the first 15 minutes sing). Build the shell thin; pour the effort into depth.
