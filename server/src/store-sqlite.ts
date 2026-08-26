// Local-dev backend on Node's built-in SQLite (no native deps).
import { DatabaseSync } from 'node:sqlite';
import type { Club } from '@fm/shared';
import { TOKEN_COLS, type Store, type Account, type AuthRow, type StandingOrders, type StoredMatch, type OpponentRow, type LeaderRow, type MatchRow, type ResultRow, type Season, type HonourRow, type PodRef, type Listing, type MissionRow } from './store.js';

export function makeSqliteStore(file: string): Store {
  const db = new DatabaseSync(file);
  return {
    async init() {
      db.exec(`
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY, handle TEXT UNIQUE NOT NULL, token TEXT NOT NULL,
          rating INTEGER NOT NULL DEFAULT 1000, created_at INTEGER NOT NULL, password_hash TEXT);
        CREATE TABLE IF NOT EXISTS clubs (
          account_id TEXT PRIMARY KEY, club TEXT NOT NULL,
          so_formation TEXT NOT NULL, so_player_ids TEXT NOT NULL, so_tactics TEXT NOT NULL, so_duties TEXT);
        CREATE TABLE IF NOT EXISTS matches (
          id TEXT PRIMARY KEY, home_id TEXT NOT NULL, away_id TEXT NOT NULL,
          home_team TEXT NOT NULL, away_team TEXT NOT NULL,
          home_tactics TEXT NOT NULL, away_tactics TEXT NOT NULL,
          seed INTEGER NOT NULL, home_score INTEGER NOT NULL, away_score INTEGER NOT NULL,
          created_at INTEGER NOT NULL, season_id TEXT, initiator_id TEXT);
        CREATE TABLE IF NOT EXISTS seasons (
          id TEXT PRIMARY KEY, number INTEGER NOT NULL, starts_at INTEGER NOT NULL,
          ends_at INTEGER NOT NULL, status TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS honours (
          account_id TEXT NOT NULL, season_id TEXT NOT NULL, season_number INTEGER NOT NULL,
          tier TEXT NOT NULL, final_pos INTEGER NOT NULL, title INTEGER NOT NULL, ended_at INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS pod_members (
          season_id TEXT NOT NULL, account_id TEXT NOT NULL, tier TEXT NOT NULL, pod INTEGER NOT NULL,
          PRIMARY KEY (season_id, account_id));
        CREATE TABLE IF NOT EXISTS plans (
          owner_id TEXT NOT NULL, opponent_id TEXT NOT NULL,
          formation TEXT NOT NULL, player_ids TEXT NOT NULL, tactics TEXT NOT NULL, duties TEXT,
          PRIMARY KEY (owner_id, opponent_id));
        CREATE TABLE IF NOT EXISTS loanees (
          owner_id TEXT NOT NULL, season_id TEXT NOT NULL, player_id TEXT NOT NULL,
          PRIMARY KEY (owner_id, player_id));
        CREATE TABLE IF NOT EXISTS listings (
          id TEXT PRIMARY KEY, seller_id TEXT NOT NULL, player_id TEXT NOT NULL,
          player_json TEXT NOT NULL, price INTEGER NOT NULL, status TEXT NOT NULL,
          created_at INTEGER NOT NULL, buyer_id TEXT, sold_at INTEGER);
        CREATE TABLE IF NOT EXISTS scout_missions (
          id TEXT PRIMARY KEY, account_id TEXT NOT NULL, season_id TEXT NOT NULL,
          destination TEXT NOT NULL, dispatched_at INTEGER NOT NULL, ready_at INTEGER NOT NULL,
          found INTEGER NOT NULL, player_json TEXT, band TEXT, status TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS facilities (
          account_id TEXT PRIMARY KEY, stadium INTEGER NOT NULL DEFAULT 1, training INTEGER NOT NULL DEFAULT 1,
          youth INTEGER NOT NULL DEFAULT 1, scouting INTEGER NOT NULL DEFAULT 1);
      `);
      for (const c of ['medical', 'sponsor', 'fanzone']) {
        try { db.exec(`ALTER TABLE facilities ADD COLUMN ${c} INTEGER NOT NULL DEFAULT 1`); } catch { /* already added */ }
      }
      db.exec(`CREATE TABLE IF NOT EXISTS injuries (
        account_id TEXT NOT NULL, player_id TEXT NOT NULL, matches_remaining INTEGER NOT NULL,
        PRIMARY KEY (account_id, player_id));`);
      // CONTRACTS: off-chain terms gating selection of an owned NFT player (extend or sell).
      db.exec(`CREATE TABLE IF NOT EXISTS contracts (
        owner_id TEXT NOT NULL, player_id TEXT NOT NULL, signed_season INTEGER NOT NULL,
        length_seasons INTEGER NOT NULL, staked_since INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (owner_id, player_id));`);
      // PLAYER LIFECYCLE: owner-independent, so age can't be reset by selling+rebuying. prime_season =
      // the global season the player turned 25 (age = 25 + currentSeason - prime_season, capped at 40).
      db.exec(`CREATE TABLE IF NOT EXISTS player_lifecycle (
        player_id TEXT PRIMARY KEY, prime_season INTEGER NOT NULL, retired INTEGER NOT NULL DEFAULT 0, peak_overall INTEGER NOT NULL DEFAULT 0);`);
      try { db.exec('ALTER TABLE player_lifecycle ADD COLUMN peak_overall INTEGER NOT NULL DEFAULT 0'); } catch { /* already added */ }
      // ACHIEVEMENTS: owner-independent TEAM record that follows the NFT (position-neutral) — feeds the
      // retirement legacy card + the reborn pedigree.
      db.exec(`CREATE TABLE IF NOT EXISTS player_achievements (
        player_id TEXT PRIMARY KEY, seasons INTEGER NOT NULL DEFAULT 0, apps INTEGER NOT NULL DEFAULT 0,
        league_titles INTEGER NOT NULL DEFAULT 0, cup_titles INTEGER NOT NULL DEFAULT 0,
        promotions INTEGER NOT NULL DEFAULT 0, highest_tier_idx INTEGER NOT NULL DEFAULT 0);`);
      // LEGACIES: the keepsake card generated when a player retires (kept by the owner at that time).
      db.exec(`CREATE TABLE IF NOT EXISTS legacies (
        player_id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, card_json TEXT NOT NULL,
        retired_season INTEGER NOT NULL, reborn_id TEXT);`);
      // TOKENS: the UNIFIED, fixed-supply NFT. One persistent id flows through the whole lifecycle —
      // prospect (develop 10→25) → pro (play 25→40) → retired → reborn (→ prospect, generation++) — the
      // SAME token, state flips, never minted anew. Replaces the old prospects/contracts/lifecycle/
      // achievements split so a token's entire multi-generation history lives in one row.
      db.exec(`CREATE TABLE IF NOT EXISTS tokens (
        id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, generation INTEGER NOT NULL DEFAULT 0,
        state TEXT NOT NULL DEFAULT 'prospect', name TEXT NOT NULL,
        genes_json TEXT NOT NULL, pedigree REAL NOT NULL DEFAULT 0, dev_bonus_json TEXT NOT NULL DEFAULT '{}', parent_gen_of TEXT,
        career_seed INTEGER, agent_id TEXT, track TEXT, career_actions TEXT,
        attrs_json TEXT, role TEXT, traits_json TEXT, personality TEXT,
        greed INTEGER, marketability INTEGER, earnings INTEGER, prime_season INTEGER, peak_overall INTEGER NOT NULL DEFAULT 0,
        signed_season INTEGER, length_seasons INTEGER, staked_since INTEGER,
        ach_seasons INTEGER NOT NULL DEFAULT 0, ach_apps INTEGER NOT NULL DEFAULT 0, ach_league INTEGER NOT NULL DEFAULT 0,
        ach_cup INTEGER NOT NULL DEFAULT 0, ach_promotions INTEGER NOT NULL DEFAULT 0, ach_tier INTEGER NOT NULL DEFAULT 0);`);
      db.exec('CREATE INDEX IF NOT EXISTS idx_tokens_owner ON tokens(owner_id)');

      // PROSPECTS: a reborn is a 10-year-old to DEVELOP in the Career sim (Layer 1), inheriting the
      // parent's genes + pedigree — not a ready-made prime player. Held here until the breeder graduates it.
      db.exec(`CREATE TABLE IF NOT EXISTS prospects (
        id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, parent_id TEXT, role_hint TEXT NOT NULL,
        genes_json TEXT NOT NULL, pedigree REAL NOT NULL, dev_bonus_json TEXT NOT NULL, born_season INTEGER NOT NULL,
        developed INTEGER NOT NULL DEFAULT 0, career_seed INTEGER, agent_id TEXT, track TEXT, career_actions TEXT, developed_player_id TEXT);`);
      for (const c of ['career_seed INTEGER', 'agent_id TEXT', 'track TEXT', 'career_actions TEXT', 'developed_player_id TEXT'])
        try { db.exec(`ALTER TABLE prospects ADD COLUMN ${c}`); } catch { /* already added */ }
      // migrate pre-existing tables (adds columns; throws-and-ignored if already present)
      try { db.exec('ALTER TABLE matches ADD COLUMN season_id TEXT'); } catch { /* already added */ }
      try { db.exec('ALTER TABLE matches ADD COLUMN initiator_id TEXT'); } catch { /* already added */ }
      try { db.exec('ALTER TABLE clubs ADD COLUMN so_duties TEXT'); } catch { /* already added */ }
      try { db.exec('ALTER TABLE accounts ADD COLUMN tier TEXT'); } catch { /* already added */ }
      try { db.exec('ALTER TABLE accounts ADD COLUMN password_hash TEXT'); } catch { /* already added */ }
      try { db.exec('ALTER TABLE accounts ADD COLUMN coins INTEGER NOT NULL DEFAULT 500'); } catch { /* already added */ }
      try { db.exec('ALTER TABLE honours ADD COLUMN coin_reward INTEGER NOT NULL DEFAULT 0'); } catch { /* already added */ }
      try { db.exec("ALTER TABLE honours ADD COLUMN kind TEXT NOT NULL DEFAULT 'league'"); } catch { /* already added */ }
      try { db.exec('ALTER TABLE accounts ADD COLUMN wallet_address TEXT'); } catch { /* already added */ }
      try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_wallet ON accounts(wallet_address) WHERE wallet_address IS NOT NULL'); } catch { /* already added */ }
    },
    async createAccount(id, handle, token, createdAt, passwordHash) {
      db.prepare('INSERT INTO accounts (id, handle, token, rating, created_at, password_hash) VALUES (?,?,?,1000,?,?)').run(id, handle, token, createdAt, passwordHash);
    },
    async accountByToken(token) {
      const r = db.prepare('SELECT id, handle, rating, created_at FROM accounts WHERE token=?').get(token) as any;
      return r && { id: r.id, handle: r.handle, rating: r.rating, createdAt: r.created_at } as Account;
    },
    async accountAuthByHandle(handle) {
      const r = db.prepare('SELECT id, handle, rating, token, password_hash FROM accounts WHERE handle=?').get(handle) as any;
      return r && { id: r.id, handle: r.handle, rating: r.rating, token: r.token, passwordHash: r.password_hash ?? null } as AuthRow;
    },
    async setPassword(accountId, passwordHash) { db.prepare('UPDATE accounts SET password_hash=? WHERE id=?').run(passwordHash, accountId); },
    async walletAccount(address) {
      const r = db.prepare('SELECT id, handle, rating, token FROM accounts WHERE wallet_address=?').get(address.toLowerCase()) as any;
      return r && { id: r.id, handle: r.handle, rating: r.rating, token: r.token };
    },
    async linkWallet(accountId, address) { db.prepare('UPDATE accounts SET wallet_address=? WHERE id=?').run(address.toLowerCase(), accountId); },
    async walletOf(accountId) { const r = db.prepare('SELECT wallet_address FROM accounts WHERE id=?').get(accountId) as any; return r ? (r.wallet_address ?? null) : null; },
    async accountById(id) {
      const r = db.prepare('SELECT id, handle, rating, created_at FROM accounts WHERE id=?').get(id) as any;
      return r && { id: r.id, handle: r.handle, rating: r.rating, createdAt: r.created_at } as Account;
    },
    async handleTaken(handle) { return !!db.prepare('SELECT 1 FROM accounts WHERE handle=?').get(handle); },
    async setRating(id, rating) { db.prepare('UPDATE accounts SET rating=? WHERE id=?').run(rating, id); },
    async getCoins(id) { const r = db.prepare('SELECT coins FROM accounts WHERE id=?').get(id) as any; return r ? r.coins : 0; },
    async addCoins(id, delta) { db.prepare('UPDATE accounts SET coins = coins + ? WHERE id=?').run(delta, id); },
    async createListing(l) {
      db.prepare('INSERT INTO listings (id, seller_id, player_id, player_json, price, status, created_at, buyer_id, sold_at) VALUES (?,?,?,?,?,?,?,?,?)')
        .run(l.id, l.seller_id, l.player_id, l.player_json, l.price, l.status, l.created_at, l.buyer_id, l.sold_at);
    },
    async activeListings(limit = 100) {
      return db.prepare(`SELECT l.*, a.handle AS seller_handle FROM listings l JOIN accounts a ON a.id=l.seller_id
        WHERE l.status='active' ORDER BY l.created_at DESC LIMIT ?`).all(limit) as any as Listing[];
    },
    async listingsBySeller(sellerId) {
      return db.prepare(`SELECT l.*, a.handle AS seller_handle FROM listings l JOIN accounts a ON a.id=l.seller_id
        WHERE l.seller_id=? AND l.status='active' ORDER BY l.created_at DESC`).all(sellerId) as any as Listing[];
    },
    async listingById(id) {
      return db.prepare(`SELECT l.*, a.handle AS seller_handle FROM listings l JOIN accounts a ON a.id=l.seller_id WHERE l.id=?`).get(id) as any as Listing | undefined;
    },
    async activeListingForPlayer(playerId) {
      return db.prepare(`SELECT l.*, a.handle AS seller_handle FROM listings l JOIN accounts a ON a.id=l.seller_id
        WHERE l.player_id=? AND l.status='active'`).get(playerId) as any as Listing | undefined;
    },
    async setListingStatus(id, status, buyerId, soldAt) {
      db.prepare('UPDATE listings SET status=?, buyer_id=?, sold_at=? WHERE id=?').run(status, buyerId, soldAt, id);
    },
    async opponents(exceptId, myRating, limit = 20) {
      return (db.prepare(
        `SELECT a.id, a.handle, a.rating, c.club FROM accounts a JOIN clubs c ON c.account_id=a.id
         WHERE a.id != ? ORDER BY ABS(a.rating - ?) ASC LIMIT ?`,
      ).all(exceptId, myRating, limit) as any[]).map((r) => ({ id: r.id, handle: r.handle, rating: r.rating, clubName: JSON.parse(r.club).name } as OpponentRow));
    },
    async leaderboard(limit = 50) {
      return db.prepare('SELECT id, handle, rating FROM accounts ORDER BY rating DESC LIMIT ?').all(limit) as LeaderRow[];
    },
    async saveClub(accountId, club: Club, so: StandingOrders) {
      const persisted = { ...club, players: club.players.filter((p) => !p.id.startsWith('nft:')) }; // tokens live in the tokens table, never in club JSON
      db.prepare(
        `INSERT INTO clubs (account_id, club, so_formation, so_player_ids, so_tactics, so_duties) VALUES (?,?,?,?,?,?)
         ON CONFLICT(account_id) DO UPDATE SET club=excluded.club, so_formation=excluded.so_formation,
           so_player_ids=excluded.so_player_ids, so_tactics=excluded.so_tactics, so_duties=excluded.so_duties`,
      ).run(accountId, JSON.stringify(persisted), so.formation, JSON.stringify(so.playerIds), JSON.stringify(so.tactics), so.duties ? JSON.stringify(so.duties) : null);
    },
    async saveStandingOrders(accountId, so: StandingOrders) {
      db.prepare('UPDATE clubs SET so_formation=?, so_player_ids=?, so_tactics=?, so_duties=? WHERE account_id=?')
        .run(so.formation, JSON.stringify(so.playerIds), JSON.stringify(so.tactics), so.duties ? JSON.stringify(so.duties) : null, accountId);
    },
    async getClub(accountId) {
      const r = db.prepare('SELECT club, so_formation, so_player_ids, so_tactics, so_duties FROM clubs WHERE account_id=?').get(accountId) as any;
      if (!r) return undefined;
      return { club: JSON.parse(r.club), standingOrders: { formation: r.so_formation, playerIds: JSON.parse(r.so_player_ids), tactics: JSON.parse(r.so_tactics), duties: r.so_duties ? JSON.parse(r.so_duties) : undefined } };
    },
    async savePlan(ownerId, opponentId, plan) {
      db.prepare(
        `INSERT INTO plans (owner_id, opponent_id, formation, player_ids, tactics, duties) VALUES (?,?,?,?,?,?)
         ON CONFLICT(owner_id, opponent_id) DO UPDATE SET formation=excluded.formation, player_ids=excluded.player_ids, tactics=excluded.tactics, duties=excluded.duties`,
      ).run(ownerId, opponentId, plan.formation, JSON.stringify(plan.playerIds), JSON.stringify(plan.tactics), plan.duties ? JSON.stringify(plan.duties) : null);
    },
    async getPlan(ownerId, opponentId) {
      const r = db.prepare('SELECT formation, player_ids, tactics, duties FROM plans WHERE owner_id=? AND opponent_id=?').get(ownerId, opponentId) as any;
      return r && { formation: r.formation, playerIds: JSON.parse(r.player_ids), tactics: JSON.parse(r.tactics), duties: r.duties ? JSON.parse(r.duties) : undefined };
    },
    async getFacilities(accountId) {
      const r = db.prepare('SELECT stadium, training, youth, scouting, medical, sponsor, fanzone FROM facilities WHERE account_id=?').get(accountId) as any;
      return r ?? { stadium: 1, training: 1, youth: 1, scouting: 1, medical: 1, sponsor: 1, fanzone: 1 };
    },
    async setFacilityLevel(accountId, key, level) {
      const cols = { stadium: 1, training: 1, youth: 1, scouting: 1, medical: 1, sponsor: 1, fanzone: 1 } as Record<string, number>;
      if (!(key in cols)) throw new Error('bad facility');
      db.prepare('INSERT INTO facilities (account_id) VALUES (?) ON CONFLICT(account_id) DO NOTHING').run(accountId);
      db.prepare(`UPDATE facilities SET ${key}=? WHERE account_id=?`).run(level, accountId); // key validated above
    },
    async getInjuries(accountId) {
      return db.prepare('SELECT player_id, matches_remaining FROM injuries WHERE account_id=?').all(accountId) as Array<{ player_id: string; matches_remaining: number }>;
    },
    async addInjury(accountId, playerId, matches) {
      db.prepare('INSERT OR REPLACE INTO injuries (account_id, player_id, matches_remaining) VALUES (?,?,?)').run(accountId, playerId, matches);
    },
    async decrementInjuries(accountId) {
      db.prepare('UPDATE injuries SET matches_remaining = matches_remaining - 1 WHERE account_id=?').run(accountId);
      db.prepare('DELETE FROM injuries WHERE account_id=? AND matches_remaining <= 0').run(accountId);
    },
    async getContracts(ownerId) {
      return db.prepare('SELECT player_id, signed_season, length_seasons, staked_since FROM contracts WHERE owner_id=?').all(ownerId) as Array<{ player_id: string; signed_season: number; length_seasons: number; staked_since: number }>;
    },
    async setContract(ownerId, playerId, signedSeason, lengthSeasons, stakedSince) {
      db.prepare('INSERT INTO contracts (owner_id, player_id, signed_season, length_seasons, staked_since) VALUES (?,?,?,?,?) ON CONFLICT(owner_id, player_id) DO UPDATE SET signed_season=excluded.signed_season, length_seasons=excluded.length_seasons').run(ownerId, playerId, signedSeason, lengthSeasons, stakedSince);
    },
    async deleteContract(ownerId, playerId) {
      db.prepare('DELETE FROM contracts WHERE owner_id=? AND player_id=?').run(ownerId, playerId);
    },
    async getPrimeSeason(playerId) {
      const r = db.prepare('SELECT prime_season FROM player_lifecycle WHERE player_id=?').get(playerId) as any;
      return r ? r.prime_season as number : undefined;
    },
    async ensurePrimeSeason(playerId, season) {
      db.prepare('INSERT OR IGNORE INTO player_lifecycle (player_id, prime_season) VALUES (?,?)').run(playerId, season);
      return (db.prepare('SELECT prime_season FROM player_lifecycle WHERE player_id=?').get(playerId) as any).prime_season as number;
    },
    async getLifecycle(playerId) {
      return db.prepare('SELECT prime_season, retired, peak_overall FROM player_lifecycle WHERE player_id=?').get(playerId) as any;
    },
    async setPeakOverall(playerId, overall) {
      db.prepare('UPDATE player_lifecycle SET peak_overall=? WHERE player_id=? AND peak_overall < ?').run(overall, playerId, overall);
    },
    async retirePlayer(playerId) {
      db.prepare('UPDATE player_lifecycle SET retired=1 WHERE player_id=?').run(playerId);
    },
    async getAchievements(playerId) {
      const r = db.prepare('SELECT seasons, apps, league_titles, cup_titles, promotions, highest_tier_idx FROM player_achievements WHERE player_id=?').get(playerId) as any;
      return r ?? { seasons: 0, apps: 0, league_titles: 0, cup_titles: 0, promotions: 0, highest_tier_idx: 0 };
    },
    async addApps(playerId, n) {
      db.prepare('INSERT INTO player_achievements (player_id, apps) VALUES (?,?) ON CONFLICT(player_id) DO UPDATE SET apps = apps + ?').run(playerId, n, n);
    },
    async recordPlayerSeason(playerId, a) {
      db.prepare(`INSERT INTO player_achievements (player_id, seasons, league_titles, cup_titles, promotions, highest_tier_idx)
        VALUES (?,1,?,?,?,?) ON CONFLICT(player_id) DO UPDATE SET seasons = seasons + 1,
        league_titles = league_titles + ?, cup_titles = cup_titles + ?, promotions = promotions + ?,
        highest_tier_idx = MAX(highest_tier_idx, ?)`).run(playerId, a.league, a.cup, a.promotion, a.tierIdx, a.league, a.cup, a.promotion, a.tierIdx);
    },
    async setAchievements(playerId, a) {
      db.prepare(`INSERT INTO player_achievements (player_id, seasons, apps, league_titles, cup_titles, promotions, highest_tier_idx)
        VALUES (?,?,?,?,?,?,?) ON CONFLICT(player_id) DO UPDATE SET seasons=?, apps=?, league_titles=?, cup_titles=?, promotions=?, highest_tier_idx=?`)
        .run(playerId, a.seasons, a.apps, a.league_titles, a.cup_titles, a.promotions, a.highest_tier_idx, a.seasons, a.apps, a.league_titles, a.cup_titles, a.promotions, a.highest_tier_idx);
    },
    async saveLegacy(playerId, ownerId, name, cardJson, retiredSeason) {
      db.prepare('INSERT OR REPLACE INTO legacies (player_id, owner_id, name, card_json, retired_season, reborn_id) VALUES (?,?,?,?,?, (SELECT reborn_id FROM legacies WHERE player_id=?))').run(playerId, ownerId, name, cardJson, retiredSeason, playerId);
    },
    async getLegacy(playerId) {
      return db.prepare('SELECT player_id, owner_id, name, card_json, retired_season, reborn_id FROM legacies WHERE player_id=?').get(playerId) as any;
    },
    async legaciesFor(ownerId) {
      return db.prepare('SELECT player_id, name, card_json, retired_season, reborn_id FROM legacies WHERE owner_id=? ORDER BY retired_season DESC').all(ownerId) as any[];
    },
    async setReborn(playerId, rebornId) {
      db.prepare('UPDATE legacies SET reborn_id=? WHERE player_id=?').run(rebornId, playerId);
    },
    async createProspect(p) {
      db.prepare('INSERT INTO prospects (id, owner_id, name, parent_id, role_hint, genes_json, pedigree, dev_bonus_json, born_season) VALUES (?,?,?,?,?,?,?,?,?)')
        .run(p.id, p.owner_id, p.name, p.parent_id, p.role_hint, p.genes_json, p.pedigree, p.dev_bonus_json, p.born_season);
    },
    async prospectsFor(ownerId) {
      return db.prepare('SELECT id, name, parent_id, role_hint, genes_json, pedigree, dev_bonus_json, born_season, developed, career_seed, agent_id, track, career_actions, developed_player_id FROM prospects WHERE owner_id=? ORDER BY born_season DESC').all(ownerId) as any[];
    },
    async getProspect(id) {
      return db.prepare('SELECT id, owner_id, name, parent_id, role_hint, genes_json, pedigree, dev_bonus_json, born_season, developed, career_seed, agent_id, track, career_actions, developed_player_id FROM prospects WHERE id=?').get(id) as any;
    },
    async startProspectCareer(id, seed, agentId, track) {
      db.prepare("UPDATE prospects SET career_seed=?, agent_id=?, track=?, career_actions='[]' WHERE id=?").run(seed, agentId, track, id);
    },
    async saveProspectActions(id, actionsJson) {
      db.prepare('UPDATE prospects SET career_actions=? WHERE id=?').run(actionsJson, id);
    },
    async setProspectDeveloped(id, playerId) {
      db.prepare('UPDATE prospects SET developed=1, developed_player_id=? WHERE id=?').run(playerId, id);
    },
    // ── UNIFIED TOKENS ──
    async createToken(t) {
      db.prepare('INSERT INTO tokens (id, owner_id, generation, state, name, genes_json, pedigree, dev_bonus_json) VALUES (?,?,?,?,?,?,?,?)')
        .run(t.id, t.owner_id, t.generation, t.state, t.name, t.genes_json, t.pedigree, t.dev_bonus_json);
    },
    async getToken(id) { return db.prepare('SELECT * FROM tokens WHERE id=?').get(id) as any; },
    async tokensOwnedBy(ownerId) { return db.prepare('SELECT * FROM tokens WHERE owner_id=? ORDER BY id').all(ownerId) as any[]; },
    async countTokens() { return (db.prepare('SELECT COUNT(*) AS n FROM tokens').get() as any).n as number; },
    async updateToken(id, fields) {
      const cols = Object.keys(fields).filter((k) => TOKEN_COLS.has(k));
      if (!cols.length) return;
      db.prepare(`UPDATE tokens SET ${cols.map((c) => `${c}=?`).join(', ')} WHERE id=?`).run(...cols.map((c) => (fields as any)[c]), id);
    },
    async createMission(m) {
      db.prepare('INSERT INTO scout_missions (id, account_id, season_id, destination, dispatched_at, ready_at, found, player_json, band, status) VALUES (?,?,?,?,?,?,?,?,?,?)')
        .run(m.id, m.account_id, m.season_id, m.destination, m.dispatched_at, m.ready_at, m.found, m.player_json, m.band, m.status);
    },
    async missionsInSeason(accountId, seasonId) {
      return db.prepare('SELECT * FROM scout_missions WHERE account_id=? AND season_id=? ORDER BY dispatched_at DESC').all(accountId, seasonId) as MissionRow[];
    },
    async missionById(id) {
      return db.prepare('SELECT * FROM scout_missions WHERE id=?').get(id) as MissionRow | undefined;
    },
    async setMissionSigned(id) { db.prepare("UPDATE scout_missions SET status='signed' WHERE id=?").run(id); },
    async countMissionsInSeason(accountId, seasonId) {
      const r = db.prepare('SELECT COUNT(*) AS c FROM scout_missions WHERE account_id=? AND season_id=?').get(accountId, seasonId) as any;
      return r ? r.c : 0;
    },
    async addLoanee(ownerId, seasonId, playerId) {
      db.prepare('INSERT OR IGNORE INTO loanees (owner_id, season_id, player_id) VALUES (?,?,?)').run(ownerId, seasonId, playerId);
    },
    async countLoanees(ownerId, seasonId) {
      const r = db.prepare('SELECT COUNT(*) AS c FROM loanees WHERE owner_id=? AND season_id=?').get(ownerId, seasonId) as any;
      return r ? r.c : 0;
    },
    async loaneeIds(ownerId, seasonId) {
      return (db.prepare('SELECT player_id FROM loanees WHERE owner_id=? AND season_id=?').all(ownerId, seasonId) as any[]).map((r) => r.player_id);
    },
    async loaneesInSeason(seasonId) {
      return db.prepare('SELECT owner_id, player_id FROM loanees WHERE season_id=?').all(seasonId) as Array<{ owner_id: string; player_id: string }>;
    },
    async deleteLoaneesInSeason(seasonId) { db.prepare('DELETE FROM loanees WHERE season_id=?').run(seasonId); },
    async saveMatch(m: StoredMatch) {
      db.prepare(
        `INSERT INTO matches (id, home_id, away_id, home_team, away_team, home_tactics, away_tactics, seed, home_score, away_score, created_at, season_id, initiator_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).run(m.id, m.homeId, m.awayId, JSON.stringify(m.homeTeam), JSON.stringify(m.awayTeam),
        JSON.stringify(m.homeTactics), JSON.stringify(m.awayTactics), m.seed, m.homeScore, m.awayScore, m.createdAt, m.seasonId ?? null, m.initiatorId ?? null);
    },
    async getMatch(id) {
      const r = db.prepare('SELECT * FROM matches WHERE id=?').get(id) as any;
      return r && {
        id: r.id, homeId: r.home_id, awayId: r.away_id,
        homeTeam: JSON.parse(r.home_team), awayTeam: JSON.parse(r.away_team),
        homeTactics: JSON.parse(r.home_tactics), awayTactics: JSON.parse(r.away_tactics),
        seed: r.seed, homeScore: r.home_score, awayScore: r.away_score, createdAt: r.created_at,
      } as StoredMatch;
    },
    async matchesFor(accountId, limit = 30) {
      return db.prepare(
        'SELECT id, home_id, away_id, home_score, away_score, created_at FROM matches WHERE home_id=? OR away_id=? ORDER BY created_at DESC LIMIT ?',
      ).all(accountId, accountId, limit) as MatchRow[];
    },
    async recentResults(limit = 40, seasonId) {
      const base = `SELECT m.id, m.home_id, m.away_id, m.home_score, m.away_score, m.created_at,
                ha.handle AS home_handle, aa.handle AS away_handle
         FROM matches m JOIN accounts ha ON ha.id=m.home_id JOIN accounts aa ON aa.id=m.away_id`;
      return seasonId
        ? db.prepare(base + ' WHERE m.season_id=? ORDER BY m.created_at DESC LIMIT ?').all(seasonId, limit) as ResultRow[]
        : db.prepare(base + ' ORDER BY m.created_at DESC LIMIT ?').all(limit) as ResultRow[];
    },
    async allAccounts() { return db.prepare('SELECT id, handle, rating FROM accounts').all() as LeaderRow[]; },
    async allResults() { return db.prepare('SELECT home_id, away_id, home_score, away_score FROM matches').all() as any[]; },
    async currentSeason() {
      const r = db.prepare("SELECT id, number, starts_at, ends_at, status FROM seasons WHERE status='active' ORDER BY number DESC LIMIT 1").get() as any;
      return r && { id: r.id, number: r.number, startsAt: r.starts_at, endsAt: r.ends_at, status: r.status } as Season;
    },
    async createSeason(id, number, startsAt, endsAt) {
      db.prepare("INSERT INTO seasons (id, number, starts_at, ends_at, status) VALUES (?,?,?,?,'active')").run(id, number, startsAt, endsAt);
      return { id, number, startsAt, endsAt, status: 'active' } as Season;
    },
    async closeSeason(id) { db.prepare("UPDATE seasons SET status='closed' WHERE id=?").run(id); },
    async seasonResults(seasonId) {
      return db.prepare('SELECT home_id, away_id, home_score, away_score FROM matches WHERE season_id=?').all(seasonId) as any[];
    },
    async matchesToday(accountId, seasonId, sinceMs) {
      const r = db.prepare('SELECT COUNT(*) AS c FROM matches WHERE initiator_id=? AND season_id=? AND created_at>=?').get(accountId, seasonId, sinceMs) as any;
      return r ? r.c : 0;
    },
    async addHonour(accountId, seasonId, seasonNumber, tier, finalPos, title, endedAt, coinReward, kind) {
      db.prepare('INSERT INTO honours (account_id, season_id, season_number, tier, final_pos, title, ended_at, coin_reward, kind) VALUES (?,?,?,?,?,?,?,?,?)')
        .run(accountId, seasonId, seasonNumber, tier, finalPos, title, endedAt, coinReward, kind);
    },
    async honoursFor(accountId, limit = 30) {
      return db.prepare('SELECT season_number, tier, final_pos, title, ended_at, coin_reward, kind FROM honours WHERE account_id=? ORDER BY season_number DESC LIMIT ?').all(accountId, limit) as HonourRow[];
    },
    async accountTier(accountId) {
      const r = db.prepare('SELECT tier FROM accounts WHERE id=?').get(accountId) as any;
      return (r && r.tier) || 'SUNDAY LEAGUE';
    },
    async setTier(accountId, tier) { db.prepare('UPDATE accounts SET tier=? WHERE id=?').run(tier, accountId); },
    async podOf(seasonId, accountId) {
      const r = db.prepare('SELECT tier, pod FROM pod_members WHERE season_id=? AND account_id=?').get(seasonId, accountId) as any;
      return r && { tier: r.tier, pod: r.pod } as PodRef;
    },
    async assignPod(seasonId, accountId, tier, pod) {
      db.prepare('INSERT OR REPLACE INTO pod_members (season_id, account_id, tier, pod) VALUES (?,?,?,?)').run(seasonId, accountId, tier, pod);
    },
    async tierPodCounts(seasonId, tier) {
      return db.prepare('SELECT pod, COUNT(*) AS count FROM pod_members WHERE season_id=? AND tier=? GROUP BY pod ORDER BY pod').all(seasonId, tier) as Array<{ pod: number; count: number }>;
    },
    async podMembers(seasonId, tier, pod) {
      return db.prepare('SELECT a.id, a.handle, a.rating FROM pod_members pm JOIN accounts a ON a.id=pm.account_id WHERE pm.season_id=? AND pm.tier=? AND pm.pod=?').all(seasonId, tier, pod) as LeaderRow[];
    },
    async seasonPods(seasonId) {
      return db.prepare('SELECT DISTINCT tier, pod FROM pod_members WHERE season_id=? ORDER BY tier, pod').all(seasonId) as PodRef[];
    },
    async reset() { db.exec('DELETE FROM matches; DELETE FROM clubs; DELETE FROM accounts; DELETE FROM seasons; DELETE FROM honours; DELETE FROM pod_members; DELETE FROM plans; DELETE FROM loanees; DELETE FROM listings; DELETE FROM scout_missions; DELETE FROM facilities; DELETE FROM injuries; DELETE FROM contracts; DELETE FROM player_lifecycle; DELETE FROM player_achievements; DELETE FROM legacies; DELETE FROM prospects; DELETE FROM tokens;'); },
  };
}
