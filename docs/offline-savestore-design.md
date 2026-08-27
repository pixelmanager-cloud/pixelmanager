# Phase 2 design — the local SaveStore

**Status:** design, ready to execute once Phase 1 (pure logic → `@fm/shared`) lands. Companion to the
migration plan (`.claude/plans/jazzy-wobbling-peacock.md`), `direction.md`, `offline-shell-design.md`.

## Goal
Replace the Fastify + SQLite/Postgres persistence with a **local, in-process save** for the single-player
game. The whole game state lives in one `SaveModel` held in memory, mutated directly, and persisted
(debounced) to a pluggable backend — IndexedDB for the web/dev build, a JSON save file in the future desktop
wrapper (Steam-Cloud-synced).

## The elegant core: `LocalStore implements <A-subset of Store>`
The server's endpoint logic is `async (req) => { …db.X()… }` against the `Store` interface. If our local
layer **implements that same interface** (the single-player A-subset), then in Phase 3 we can **lift the
endpoint bodies almost verbatim** into the `api.ts` facade, pointing `db` at a `LocalStore` singleton —
instead of rewriting each one. So Phase 2 = build `LocalStore` satisfying the A-subset of `Store`.

- Move a **`GameStore` interface** (the A-subset methods below) into `@fm/shared` (or a shared types file).
  The moved server logic depends on `GameStore`, not the full `Store`. The real server `Store` still
  satisfies it during transition; `LocalStore` satisfies it after.
- Methods keep their async signatures (return `Promise.resolve(...)`) so lifted logic is unchanged.

## The SaveModel (what persists)
```ts
interface SaveModel {
  version: number;                 // save-format version (for future migrations)
  profile: { name: string; coins: number; createdAt: number; season: number }; // season = local counter (replaces the synced clock)
  club: Club;                      // squad (club.players) — @fm/shared type
  standingOrders: StandingOrders;  // formation/tactics/duties/captain/takers (move type to @fm/shared)
  tokens: Token[];                 // THE HEART — unified lifecycle records (prospect/pro/retired), @fm/shared Token type (moved in Phase 1)
  facilities: { stadium; training; youth; scouting; medical; sponsor; fanzone }; // levels
  injuries: { playerId: string; matchesRemaining: number }[];
  legacies: { playerId; name; cardJson; retiredSeason; rebornId: string|null }[]; // retirement legacy cards
  honours: HonourRow[];            // local honours board (from local seasons, not pods)
  awards: Award[];                 // individual season awards
  missions: MissionRow[];          // scouting-network trips
  loanees: { seasonId: string; playerId: string }[];
  retiredNumbers?: { n: number; name: string }[]; // (today fm_retired_<handle> localStorage — fold in)
}
```

### Collapse (redundancy in the server's normalized schema)
The unified `Token` row already stores these, so we DON'T keep separate collections:
- **contracts** → use `Token.signed_season / length_seasons / staked_since` directly (drop the `contracts` table).
- **lifecycle** (prime/retired/peak) → `Token.prime_season / state==='retired' / peak_overall`.
- **achievements** → `Token.ach_seasons/apps/league/cup/promotions/tier/goals/assists/potm`.
- **prospects** vs **tokens**: a `Token` with `state==='prospect'` already carries `career_seed/agent_id/track/career_actions/genes_json/pedigree/dev_bonus_json` — i.e. everything `ProspectRow` holds. **Unify: prospects ARE tokens in prospect state.** During execution, verify the `/prospects` + `/genesis` + `startProspectCareer` paths and drop the parallel `prospects` table in favour of `tokens.filter(state==='prospect')`. (Resolve this explicitly — it's the one real schema simplification.)

### Drop entirely (PvP / infra — die with the server)
`listings` (transfer market), `matches`/`StoredMatch`, `seasons` synchronized clock, `pod_members`/tiers,
`opponents`/`leaderboard`/`allAccounts`/`allResults`, per-opponent `plans`, wallet/auth rows, `rating`.

### Season → local counter
Replace the wall-clock synchronized season (`ensureSeason`/`currentSeason`/pods) with `profile.season` (an
integer the manager advances). Honours/awards/stats key off this local counter. `seasonId` becomes
`String(profile.season)`.

## `GameStore` — the A-subset interface `LocalStore` implements
Grouped (from `server/src/store.ts`); keep these, drop all PvP/wallet/pod/season-clock methods:
- **Economy:** `getCoins`, `addCoins`.
- **Club:** `saveClub`, `saveStandingOrders`, `getClub`.
- **Facilities:** `getFacilities`, `setFacilityLevel`.
- **Injuries:** `getInjuries`, `addInjury`, `decrementInjuries`.
- **Tokens (central):** `createToken`, `getToken`, `tokensOwnedBy`, `countTokens`, `updateToken`.
- **Prospects (or fold into tokens):** `prospectsFor`, `getProspect`, `startProspectCareer`, `saveProspectActions`, `setProspectDeveloped`, `createProspect`.
- **Contracts (thin wrappers over Token fields):** `getContracts`, `setContract`, `deleteContract`, `getPrimeSeason`, `ensurePrimeSeason`.
- **Lifecycle/achievements/legacy:** `getLifecycle`, `setPeakOverall`, `retirePlayer`, `getAchievements`, `addApps`, `recordPlayerSeason`, `setAchievements`, `saveLegacy`, `getLegacy`, `legaciesFor`, `setReborn`.
- **Stats/awards:** `bumpPlayerStats`, `seasonPlayerStats` (single-account form), `addAward`, `awardsFor`.
- **Scouting missions/loanees:** `createMission`, `missionsInSeason`, `missionById`, `setMissionSigned`, `countMissionsInSeason`, `addLoanee`, `countLoanees`, `loaneeIds`, `loaneesInSeason`, `deleteLoaneesInSeason`.
- **Honours:** `addHonour`, `honoursFor`.
- `init`, `reset`.

`tokensOwnedBy`/`prospectsFor`/etc. no longer need an `ownerId` (single owner) — keep the param for
signature-compatibility with lifted server logic but ignore it (all tokens belong to the one profile).

## `client/src/save.ts` — what to build
```ts
// 1. SaveModel + a fresh-save factory (empty new game).
// 2. class LocalStore implements GameStore  — all methods operate SYNCHRONOUSLY on an in-memory SaveModel,
//    return Promise.resolve(...), and call schedulePersist() after any mutation.
// 3. Persistence backend (pluggable):
interface SaveBackend { list(): Promise<SaveMeta[]>; load(id): Promise<SaveModel|null>; save(id, m: SaveModel): Promise<void>; remove(id): Promise<void>; }
//    - IndexedDBBackend now (async, headroom); FileBackend later (desktop wrapper, one JSON per slot → Steam Cloud).
// 4. Save-slot manager: replaces fm_saves. A slot = { id, name, lastPlayed } + its SaveModel blob.
//    The active save is loaded into memory at Continue; New Game creates a fresh one.
// 5. schedulePersist(): debounced (~500ms) write of the whole in-memory SaveModel to the backend.
```
Keep the active `SaveModel` as a module singleton; `LocalStore` reads/writes it; the facade (Phase 3) holds
one `LocalStore` instance. localStorage still holds the small, already-local bits (`fm_mgr_<id>`,
`fm_plan_<id>`, tutorial flag) — or fold `fm_mgr`/`fm_retired` into the SaveModel for a single unified save
(recommended, so one blob = one Steam-Cloud save).

## Versioning & dev saves
- `version` field + a `migrate(old): SaveModel` switch (no migrations needed yet — start at v1).
- Existing server-backed dev saves do NOT carry over (server was ephemeral SQLite). New Game creates a fresh
  local save; document a one-time reset. No production users exist, so no data-migration burden.

## Execution checklist (Phase 2)
1. Move `StandingOrders` type + `GameStore` interface (A-subset) into `@fm/shared` (Phase 1 already moved `Token`).
2. Write `client/src/save.ts`: `SaveModel`, `freshSave()`, `LocalStore implements GameStore`, `IndexedDBBackend`, slot manager, debounced persist.
3. Resolve the prospect/token unification (drop parallel prospects, use `tokens[state==='prospect']`).
4. Unit-test `LocalStore` in isolation (a `shared/qa_savestore.ts`-style harness): create token → update → read back; coins add/spend; save→persist→reload round-trip is byte-identical; a full token lifecycle (prospect→pro→retired→reborn) survives a serialize/deserialize.
5. Do NOT wire it into the game yet — that's Phase 3 (the facade). Phase 2 ends with `LocalStore` built + tested standalone; `npm run verify` green (it's additive to the client).

## Verification
- `LocalStore` round-trip test green (create/update/read, coins, full-lifecycle serialize/deserialize).
- `npm run build --workspace=client` green (save.ts compiles, unused for now).
- Phase 3 then swaps `api.ts` bodies to call a `LocalStore` singleton + lifted server logic; end-to-end offline play verifies it.

## Why this shape
Implementing the existing `Store` contract locally means Phase 3 is mostly *lifting* endpoint bodies, not
rewriting logic — lowest risk, least churn, and the game's rules stay in one place (`@fm/shared`) exercised
identically by tests and the app. The single-owner + unified-Token simplifications shrink the surface
without changing behaviour.
