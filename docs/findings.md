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
| F-017 | fixed (F-030/F-031) | dynasty/correctness | Renown falls, against an in-game promise that it never can. The lineageRenown suspicion recorded here is **refuted**: the generation count does not move at the graduation drop. Two real mechanisms, both in F-030/F-031 | `client/src/api.ts:331` |
| F-018 | fixed | dynasty/dead-wiring | The played heir's genes are computed by `mintHeirs` and discarded, so the pre-selected son does not carry the family traits | `client/src/api.ts:704` |
| F-019 | fixed | economy/dead-wiring | `evaluateContractOffer` computes `moraleDelta` and no caller applies it — lowballing the star is free, and 'Generous' is identical to 'Meet it' | `shared/src/contracts.ts:106` |
| F-020 | fixed | audio/dead-wiring | `audio.unlock()` is bound to `pointerdown` only, so a keyboard or controller player gets no music and no chimes for the whole session | `client/src/main.ts:449` |
| F-021 | fixed | career/dead-wiring | Summer tiles label the authority meter "🧑‍🏫 Coach" on the three senior screens where the dashboard calls it "👔 Gaffer"; the legend then lists it twice | `client/src/main.ts:4083` |
| F-022 | decision (§85) | match/dead-wiring | `resolveShot`'s `clear` parameter is `false` at every call site, so the clear-chance bonus and its miss-logging branch are unreachable | `shared/src/engine.ts:881` |
| F-023 | fixed | save/dead-wiring | `IndexedDBBackend.open()` caches a rejected promise forever, so the retry its own comment describes cannot succeed | `client/src/save.ts:488` |
| F-024 | part fixed, rest §86 | content/dead-wiring | Three of five MILESTONE flourish banks are unreachable; the backroom-staff quip corpus and the ~305-line international call-up corpus have no production caller | `shared/src/tokens.ts:174` |
| F-025 | fixed | save/dead-wiring | `recoverOrphanedSaves` restores only the save index, so a recovered dynasty returns in the bottom division at manager season 1 | `client/src/main.ts:474` |
| F-026 | fixed | manager/dead-wiring | `PICKABLE_FORMATIONS` is a stale eight-formation list with no consumers; the editor offers all eleven from `FORMATION_SHAPES` | `shared/src/game.ts:80` |
| F-027 | fixed | manager/correctness | `maybeOfferArc` paces on `results.length` but the rollover never reset `arcLastMd`, so from season 2 the gate demanded matchday 21 of a possible 18 and no arc could be offered again | `client/src/main.ts:3601` |
| F-028 | fixed | manager/correctness | The prestige rank-up line is stamped with the CLOSING season, so the 423-line bank is still never displayed; `lastRankIdx` banks immediately so it cannot re-fire | `client/src/main.ts:2619` |
| F-029 | fixed | economy/correctness | The transfer market quotes a sale without `moraleEffects().sellMult` and credits a different number — wrong even at the default morale | `client/src/main.ts:1697` |
| F-030 | fixed | dynasty/correctness | `membersOf` scored only live tokens, and the played line is one token reused — so `rebornFields` zeroing `ach_*` took the retiring man's silverware out of the house at every succession | `client/src/api.ts:331` |
| F-031 | fixed | dynasty/correctness | `rebornFields` did not clear `career_honours_json`, so an heir was scored on his father's frozen record until he graduated — **the real mechanism behind F-017's graduation drop** | `shared/src/tokens.ts:577` |
| F-032 | fixed | dynasty/correctness | `membersOf` preferred the graduation-frozen peak over the live one, so a decade of development scored nothing and the `??` fallback was unreachable | `client/src/api.ts:344` |
| F-033 | fixed | dynasty/correctness | `succeed()` minted heirs from the father's BIRTH genes and omitted `ceilingLift`, leaving `legacyBoost().ceilingLift` with no production consumer — **a regression introduced by the F-013 family-resemblance fix** | `client/src/api.ts:748` |
| F-034 | decision §88 | match/correctness | `beatsLastDefender` tests the NEAREST defender, not the deepest: 95.7% of the clear chances it grants have ~3.7 defenders still goal-side. Comments and UI copy corrected; the geometry change is a balance call | `shared/src/engine.ts:840` |
| F-035 | decision §89 | match/correctness | The counter-attack window arms on any loose-ball pickup, including by the side that lost it — 32.9% of all armings involve no turnover at all | `shared/src/engine.ts:299` |
| F-036 | fixed | career/correctness | The career tutorial set its done-flag one turn before chapter 1 ended, so the focus / draft / coach hints written for the summer break could never render | `client/src/main.ts:3432` |
| F-037 | fixed | save/correctness | `rebuiltMgrState`'s tier restore reads the newest honour, but cup honours carry an empty tier and share the league honour's season — so an evicted save rebuilt in the bottom division | `client/src/main.ts:1443` |
| F-038 | fixed | ui/correctness | The Transfer Market wage-bill header billed the bloodline star and loan trialists, neither of whom is ever charged | `client/src/main.ts:1699` |
| F-039 | fixed | ui/correctness | The player card's Re-sign/Extend button ignored clicks landing on its sprite icon — the handler read the raw event target with no `closest()` | `client/src/main.ts:1045` |
| F-040 | fixed | content/correctness | `contract_renewed` passed the literal 'another spell' into an `{n}` duration slot, producing 'signs on for another another spell' across ~20 lines | `client/src/main.ts:1830` |
| F-041 | fixed | content/correctness | `personCtx` computed `seasonsAtClub` by subtracting MgrState.season from a profile-season stamp, so from generation 2 every squad player narrated as a newcomer | `client/src/main.ts:3552` |
| F-042 | fixed | economy/correctness | `facilityToDowngrade` picked the highest-LEVEL facility while its docstring promised the most expensive to run — the club shed the wrong department and recovered less | `shared/src/facilities.ts:255` |
| F-043 | fixed | manager/correctness | The four season-rollover climb events passed `person: undefined`, so 30 person-tiered promotion/relegation/title lines were unreachable — plus a fifth site, `scout_dispatched` | `client/src/main.ts:2735` |
| F-044 | fixed | economy/correctness | Facility cards priced every level at weight 1 while the club is billed with UPKEEP_WEIGHT — a L10 women's team advertised 567c and was billed 255c | `client/src/api.ts:1600` |
| F-045 | fixed | content/correctness | The Gaffer's Diary hard-coded a blank opponent, so its two highest-weighted storylines (13 lines) could never be selected | `client/src/main.ts:1288` |
| F-046 | fixed | save/correctness | `handoffKey` resolved the same key for the founder and the first heir, so deferring one offer suppressed the other | `client/src/main.ts:3947` |
| F-047 | fixed | ui/correctness | The Continental Cup toasted a hard-coded +1,800c while crediting at least 2,280c | `client/src/main.ts:2255` |
| F-048 | fixed | content/correctness | Three `near_miss` lines described play-offs and a runners-up finish in a pyramid that has neither, on a branch that can only be 3rd or 4th | `shared/src/manager/pack_1.ts` |
| F-049 | fixed | ui/correctness | `.tac-toggle` was emitted as a styling hook and defined nowhere, so both instruction checkboxes inherited a caption-above-a-select column layout | `client/index.html:1398` |
| F-050 | fixed | economy/correctness | The loyalty discount existed in three copies; the two that ran were inlined, while `staking.ts`'s version sat unimported naming the exact call sites ignoring it | `shared/src/contracts.ts:65` |
| F-051 | fixed | dynasty/ux-friction | Taking the reins while already managing silently wiped the live season, sponsor and cup run and swapped the bloodline star — no confirm, and the on-screen note pushed toward the button | `client/src/main.ts:4006` |
| F-052 | fixed | manager/ux-friction | The squad report's ✕ destroyed the only UI that can renew expiring contracts, with no confirm and no way back | `client/src/main.ts:2094` |
| F-053 | fixed | economy/ux-friction | Players force-sold at 60% to cover an unpayable wage bill were reported as contract expiries — "their deals ran out and weren't renewed" | `client/src/api.ts:1166` |
| F-054 | fixed | match/ux-friction | The pause menu's "▶ Resume" restored the prior state, so it did not resume a match paused with the spacebar | `client/src/main.ts:747` |
| F-055 | fixed | match/ux-friction | The full-time card auto-dismissed after 9s while instructing "▶ Tap to continue"; the match report exists nowhere else | `client/src/main.ts:5336` |
| F-056 | fixed | ui/ux-friction | Settings neither paused the match nor blocked the match shortcuts, and Pause → Settings actively un-paused | `client/src/main.ts:578` |
| F-057 | fixed | ui/ux-friction | The season prize money was the first of five toasts into a single 2.2s slot with no queue, and had no feed fallback | `client/src/main.ts:2617` |
| F-058 | fixed | save/ux-friction | `refreshHubPlayer`'s early return fired on any truthy starId, so the eviction-recovery block behind `!mgr.starId` could never run | `client/src/main.ts:1361` |
| F-059 | fixed | audio/ux-friction | The trophy fanfare sat on the MUSIC bus, so "Mute sound effects" left it playing and "Mute music" silenced it — both switches did the opposite of their label | `client/src/audio.ts:116` |
| F-060 | fixed | audio/ux-friction | Winning a division below the top tier fired the triumph sting and chime TWICE in one synchronous tick — both branches match, with no return between them | `client/src/main.ts:2795` |
| F-061 | fixed | audio/ux-friction | The career screen keyed its music on `momentKind === 'life'`, true for EVERY social turn, so the crisis pool played over routine turns — and over nothing else for the first 28 | `client/src/main.ts:4057` |
| F-062 | fixed | ui/accessibility | Settings and How To Play were the only overlays never converted to `dialogify`: no focus move, no Tab trap, the page behind them reachable | `client/src/main.ts:578` |
| F-063 | fixed | career/ux-friction | The financial-offer tile printed a negative branch for greed and form but not marketability, so the develop option's only cost was invisible | `client/src/main.ts:4134` |
| F-064 | fixed | ui/ux-friction | The hire-a-coach confirmation printed "He stays with the club for good." twice in the same dialog | `client/src/main.ts:2107` |
| F-065 | fixed | ui/ux-friction | Three persistent coin readouts printed raw integers beside copy that formats the same value with thousands separators | `client/src/main.ts:1314` |
| F-066 | fixed | career/ux-friction | The summer focus tile said choosing it "ends pre-season" with four-plus pre-season screens still to come | `client/src/main.ts:4184` |
| F-067 | fixed | dynasty/visual | The heir-choice cards had NO typography: all five `.cg-cname` and three `.cg-cdescr` rules are scoped to parents the heir card does not have | `client/index.html:1014` |
| F-068 | fixed | career/visual | `.cg-rival-news` is a div inside a `display:flex` row, so the news sentence became a chip on the header line | `client/index.html:685` |
| F-069 | fixed | match/ux-friction | The commentary feed hard-snapped to the bottom on every line, so the player could never read back — ~700 lines into a nine-line window | `client/src/main.ts:5634` |
| F-070 | fixed | manager/ux-friction | The shirt-sponsor deadline existed only in a code comment; a 450c deal vanished the moment matchday 1 was played, with nothing connecting the two | `client/src/main.ts:2206` |
| F-071 | fixed | dynasty/ux-friction | A cousin heir carries his own father's inheritance, not the one just chosen, and neither screen said so | `client/src/main.ts:3824` |
| F-072 | fixed | dynasty/ux-friction | The Family Record promised every pale forebear's line "can still be taken up" when only the current generation's brothers can | `client/src/main.ts:4017` |
| F-073 | fixed | career/ux-friction | `openCareer` discarded the `replayIssue` the API computes so the UI can explain a truncated career; the player saw a reset star and was told nothing | `client/src/main.ts:3489` |
| F-074 | decision §90 | ui/visual | Four standalone containers render unstyled (`.scout-board`, `.sf-leaders`, `.li-tip`, `.ach-txt`); giving them a look is a design pass | `tools/playtest/css_hooks.ts` |
