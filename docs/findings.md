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
| F-007 | open  | ui/visual | Portraits still hash `name + band`, so a player changes identity when he crosses an age band. Fix written; blocked on the parallel 800-per-band pools landing | `client/src/portrait.ts` |
| F-008 | open  | ui/visual | Portraits are not shown in manager mode (lineup, squad table, transfer market) — the Living Squad players are characters rendered as text rows | `client/src/main.ts` |
| F-009 | decision | ui/accessibility | The game loads its two typefaces from Google Fonts; an offline Steam build falls back to Courier New (§78) | `client/index.html:9` |
| F-010 | decision | manager/correctness | Width, formation and duty choices barely register in outcomes — the ×12 breakaway is the engine's only real scoring channel (§68) | `shared/src/engine.ts` |
| F-011 | decision | ui/visual | Steam capsule art is AI-generated and publicly disclosed on the store page (§80) | `store/steam/` |
| F-012 | open  | content/content | The existing 64 portraits contain 5 genuine near-duplicate pairs (colour distance < 12 on a face crop) | `client/public/portraits/` |
