# Findings ledger

The audit factory's spine. Append-only: entries are closed, never deleted, so a later wave can be told what
is already known and does not spend its budget rediscovering it.

**Status:** `open` (confirmed, not yet fixed) · `fixed` (merged, with the probe that guards it) ·
`decision` (in `decisions-for-ck.md`, waiting on CK) · `refuted` (an agent claimed it, verification killed
it — kept so it is not re-raised).

**IDs** are `F-###`, assigned in order and never reused.

| id | status | cell | title | where |
|---|---|---|---|---|
| F-001 | fixed | dynasty/dead-wiring | The Family Record omitted every ancestor of the played line — `bloodline()` built from tokens, but `succeed()` reworks the played token in place | `client/src/api.ts` |
| F-002 | fixed | ui/accessibility | Reduce Motion deleted every toast in the game and the goal announcement, rather than calming them | `client/index.html` |
| F-003 | fixed | match/correctness | Conceding was celebrated exactly as hard as scoring — `mySide` was never consulted | `client/src/main.ts` |
| F-004 | fixed | ui/dead-wiring | Four `transition: width` rules had never once fired; the nodes are rebuilt by innerHTML each render | `client/src/main.ts` |
| F-005 | fixed | dynasty/visual | The heir card was hard-coded `tier-bronze`, the one tier that never turns the sheen layer on | `client/src/main.ts` |
| F-006 | fixed | ui/dead-wiring | `scorepulse` was declared twice and overridden by `scorepop` — unreachable | `client/index.html` |
| F-007 | fixed | ui/visual | Portraits hashed `name + band`, so a player changes identity when he crosses an age band. Fix written; blocked on the parallel 800-per-band pools landing | `client/src/portrait.ts` |
| F-008 | fixed | ui/visual | Portraits now shown in the squad stats table; lineup/market still pending (lineup, squad table, transfer market) — the Living Squad players are characters rendered as text rows | `client/src/main.ts` |
| F-009 | fixed | ui/accessibility | The game loads its two typefaces from Google Fonts; an offline Steam build falls back to Courier New (§78) | `client/index.html:9` |
| F-010 | closed (§82) | manager/correctness | Width, formation and duty choices barely register in outcomes — the ×12 breakaway is the engine's only real scoring channel (§68) | `shared/src/engine.ts` |
| F-011 | closed (§83) | ui/visual | Steam capsule art is AI-generated and publicly disclosed on the store page (§80) | `store/steam/` |
| F-012 | fixed | content/content | The existing 64 portraits contain 5 genuine near-duplicate pairs (colour distance < 12 on a face crop) | `client/public/portraits/` |
| F-013 | fixed | ui/dead-wiring | The IN-GAME "Reduce motion" switch still deleted every toast and the goal announcement — F-002 patched only the OS media query, not the `body.reduced-motion` twin | `client/index.html:283` |
| F-014 | fixed | content/dead-wiring | 92 authored commentary lines printed a literal `{opp}` — 23 of 24 draw sites never supplied it, and `fillCm` leaves unknown tokens intact | `client/src/main.ts:5317` |
| F-015 | decision (§84) | career/dead-wiring | The whole `Establishing` summer bank is unreachable — `rollFocus` only ever sees the chapter that just ENDED, and Establishing never ends before the career does. 8 authored options never reach a player | `shared/src/career.ts:1490` |
| F-016 | fixed | manager/dead-wiring | Every season-rollover feed line is stamped with the closing season, so none is ever rendered — promotion, relegation, the title, the near-miss | `client/src/main.ts:2658` |
| F-017 | open (mechanism corrected) | dynasty/correctness | Renown falls — but NOT where the audit said. Measured directly: successions RAISE it (260→805, 801→1733, 1967→2250); it falls at **graduation** (gen 2: 556→514). The audit's explanation (membersOf drops ancestors) is refuted. Prime suspect is `lineageRenown`, which is quadratic in the count of DISTINCT LIVE generations — so renown tracks which tokens presently exist rather than what the family did. Mechanism not yet pinned down | `shared/src/renown.ts:135` |
| F-018 | fixed | dynasty/dead-wiring | The played heir's genes are computed by `mintHeirs` and discarded, so the pre-selected son does not carry the family traits | `client/src/api.ts:704` |
| F-019 | fixed | economy/dead-wiring | `evaluateContractOffer` computes `moraleDelta` and no caller applies it — lowballing the star is free, and 'Generous' is identical to 'Meet it' | `shared/src/contracts.ts:106` |
| F-020 | fixed | audio/dead-wiring | `audio.unlock()` is bound to `pointerdown` only, so a keyboard or controller player gets no music and no chimes for the whole session | `client/src/main.ts:449` |
| F-021 | fixed | career/dead-wiring | Summer tiles label the authority meter "🧑‍🏫 Coach" on the three senior screens where the dashboard calls it "👔 Gaffer"; the legend then lists it twice | `client/src/main.ts:4083` |
| F-022 | decision (§85) | match/dead-wiring | `resolveShot`'s `clear` parameter is `false` at every call site, so the clear-chance bonus and its miss-logging branch are unreachable | `shared/src/engine.ts:881` |
| F-023 | fixed | save/dead-wiring | `IndexedDBBackend.open()` caches a rejected promise forever, so the retry its own comment describes cannot succeed | `client/src/save.ts:488` |
| F-024 | part fixed, rest §86 | content/dead-wiring | Three of five MILESTONE flourish banks are unreachable; the backroom-staff quip corpus and the ~305-line international call-up corpus have no production caller | `shared/src/tokens.ts:174` |
| F-025 | fixed | save/dead-wiring | `recoverOrphanedSaves` restores only the save index, so a recovered dynasty returns in the bottom division at manager season 1 | `client/src/main.ts:474` |
| F-026 | fixed | manager/dead-wiring | `PICKABLE_FORMATIONS` is a stale eight-formation list with no consumers; the editor offers all eleven from `FORMATION_SHAPES` | `shared/src/game.ts:80` |
