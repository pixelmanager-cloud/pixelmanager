// Production backend on Postgres (e.g. Neon/Supabase). JSON stored as text and
// (de)serialised in code, identical semantics to the SQLite backend.
import pg from 'pg';
import type { Club } from '@fm/shared';
import { TOKEN_COLS, type Store, type Account, type AuthRow, type StandingOrders, type StoredMatch, type OpponentRow, type LeaderRow, type MatchRow, type ResultRow, type Season, type HonourRow, type PodRef, type Listing, type MissionRow } from './store.js';

export function makePostgresStore(connectionString: string): Store {
  // Railway's internal DB (postgres.railway.internal) and localhost don't use SSL;
  // managed providers (Neon/Supabase, public URLs) do. Auto-detect, override with PGSSL.
  const ssl = process.env.PGSSL === 'require' ? { rejectUnauthorized: false }
    : process.env.PGSSL === 'false' ? false
    : /\.railway\.internal|localhost|127\.0\.0\.1/.test(connectionString) ? false
    : { rejectUnauthorized: false };
  const pool = new pg.Pool({ connectionString, ssl });
  const q = (text: string, params: any[] = []) => pool.query(text, params);
  return {
    async init() {
      await q(`
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY, handle TEXT UNIQUE NOT NULL, token TEXT NOT NULL,
          rating INTEGER NOT NULL DEFAULT 1000, created_at BIGINT NOT NULL, password_hash TEXT);
        CREATE TABLE IF NOT EXISTS clubs (
          account_id TEXT PRIMARY KEY, club TEXT NOT NULL,
          so_formation TEXT NOT NULL, so_player_ids TEXT NOT NULL, so_tactics TEXT NOT NULL, so_duties TEXT);
        CREATE TABLE IF NOT EXISTS matches (
          id TEXT PRIMARY KEY, home_id TEXT NOT NULL, away_id TEXT NOT NULL,
          home_team TEXT NOT NULL, away_team TEXT NOT NULL,
          home_tactics TEXT NOT NULL, away_tactics TEXT NOT NULL,
          seed BIGINT NOT NULL, home_score INTEGER NOT NULL, away_score INTEGER NOT NULL,
          created_at BIGINT NOT NULL, season_id TEXT, initiator_id TEXT);
        CREATE TABLE IF NOT EXISTS seasons (
          id TEXT PRIMARY KEY, number INTEGER NOT NULL, starts_at BIGINT NOT NULL,
          ends_at BIGINT NOT NULL, status TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS honours (
          account_id TEXT NOT NULL, season_id TEXT NOT NULL, season_number INTEGER NOT NULL,
          tier TEXT NOT NULL, final_pos INTEGER NOT NULL, title INTEGER NOT NULL, ended_at BIGINT NOT NULL);
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
        ALTER TABLE matches ADD COLUMN IF NOT EXISTS season_id TEXT;
        ALTER TABLE matches ADD COLUMN IF NOT EXISTS initiator_id TEXT;
        ALTER TABLE clubs ADD COLUMN IF NOT EXISTS so_duties TEXT;
        CREATE TABLE IF NOT EXISTS listings (
          id TEXT PRIMARY KEY, seller_id TEXT NOT NULL, player_id TEXT NOT NULL,
          player_json TEXT NOT NULL, price INTEGER NOT NULL, status TEXT NOT NULL,
          created_at BIGINT NOT NULL, buyer_id TEXT, sold_at BIGINT);
        CREATE TABLE IF NOT EXISTS scout_missions (
          id TEXT PRIMARY KEY, account_id TEXT NOT NULL, season_id TEXT NOT NULL,
          destination TEXT NOT NULL, dispatched_at BIGINT NOT NULL, ready_at BIGINT NOT NULL,
          found INTEGER NOT NULL, player_json TEXT, band TEXT, status TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS facilities (
          account_id TEXT PRIMARY KEY, stadium INTEGER NOT NULL DEFAULT 1, training INTEGER NOT NULL DEFAULT 1,
          youth INTEGER NOT NULL DEFAULT 1, scouting INTEGER NOT NULL DEFAULT 1);
        ALTER TABLE facilities ADD COLUMN IF NOT EXISTS medical INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE facilities ADD COLUMN IF NOT EXISTS sponsor INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE facilities ADD COLUMN IF NOT EXISTS fanzone INTEGER NOT NULL DEFAULT 1;
        CREATE TABLE IF NOT EXISTS injuries (
          account_id TEXT NOT NULL, player_id TEXT NOT NULL, matches_remaining INTEGER NOT NULL,
          PRIMARY KEY (account_id, player_id));
        CREATE TABLE IF NOT EXISTS contracts (
          owner_id TEXT NOT NULL, player_id TEXT NOT NULL, signed_season INTEGER NOT NULL,
          length_seasons INTEGER NOT NULL, staked_since INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (owner_id, player_id));
        CREATE TABLE IF NOT EXISTS player_lifecycle (
          player_id TEXT PRIMARY KEY, prime_season INTEGER NOT NULL, retired INTEGER NOT NULL DEFAULT 0, peak_overall INTEGER NOT NULL DEFAULT 0);
        ALTER TABLE player_lifecycle ADD COLUMN IF NOT EXISTS peak_overall INTEGER NOT NULL DEFAULT 0;
        CREATE TABLE IF NOT EXISTS player_achievements (
          player_id TEXT PRIMARY KEY, seasons INTEGER NOT NULL DEFAULT 0, apps INTEGER NOT NULL DEFAULT 0,
          league_titles INTEGER NOT NULL DEFAULT 0, cup_titles INTEGER NOT NULL DEFAULT 0,
          promotions INTEGER NOT NULL DEFAULT 0, highest_tier_idx INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS legacies (
          player_id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, card_json TEXT NOT NULL,
          retired_season INTEGER NOT NULL, reborn_id TEXT);
        CREATE TABLE IF NOT EXISTS prospects (
          id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, parent_id TEXT, role_hint TEXT NOT NULL,
          genes_json TEXT NOT NULL, pedigree REAL NOT NULL, dev_bonus_json TEXT NOT NULL, born_season INTEGER NOT NULL,
          developed INTEGER NOT NULL DEFAULT 0);
        ALTER TABLE prospects ADD COLUMN IF NOT EXISTS career_seed BIGINT;
        ALTER TABLE prospects ADD COLUMN IF NOT EXISTS agent_id TEXT;
        ALTER TABLE prospects ADD COLUMN IF NOT EXISTS track TEXT;
        ALTER TABLE prospects ADD COLUMN IF NOT EXISTS career_actions TEXT;
        ALTER TABLE prospects ADD COLUMN IF NOT EXISTS developed_player_id TEXT;
        CREATE TABLE IF NOT EXISTS tokens (
          id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, generation INTEGER NOT NULL DEFAULT 0,
          state TEXT NOT NULL DEFAULT 'prospect', name TEXT NOT NULL,
          genes_json TEXT NOT NULL, pedigree REAL NOT NULL DEFAULT 0, dev_bonus_json TEXT NOT NULL DEFAULT '{}', parent_gen_of TEXT,
          career_seed BIGINT, agent_id TEXT, track TEXT, career_actions TEXT,
          attrs_json TEXT, role TEXT, traits_json TEXT, personality TEXT,
          greed INTEGER, marketability INTEGER, earnings INTEGER, prime_season INTEGER, peak_overall INTEGER NOT NULL DEFAULT 0,
          signed_season INTEGER, length_seasons INTEGER, staked_since INTEGER,
          ach_seasons INTEGER NOT NULL DEFAULT 0, ach_apps INTEGER NOT NULL DEFAULT 0, ach_league INTEGER NOT NULL DEFAULT 0,
          ach_cup INTEGER NOT NULL DEFAULT 0, ach_promotions INTEGER NOT NULL DEFAULT 0, ach_tier INTEGER NOT NULL DEFAULT 0, morale INTEGER NOT NULL DEFAULT 65);
        CREATE INDEX IF NOT EXISTS idx_tokens_owner ON tokens(owner_id);
        ALTER TABLE tokens ADD COLUMN IF NOT EXISTS morale INTEGER NOT NULL DEFAULT 65;
        ALTER TABLE tokens ADD COLUMN IF NOT EXISTS ach_goals INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE tokens ADD COLUMN IF NOT EXISTS ach_assists INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE tokens ADD COLUMN IF NOT EXISTS ach_potm INTEGER NOT NULL DEFAULT 0;
        CREATE TABLE IF NOT EXISTS player_stats (
          season_id TEXT NOT NULL, account_id TEXT NOT NULL, player_id TEXT NOT NULL, player_name TEXT NOT NULL,
          goals INTEGER NOT NULL DEFAULT 0, assists INTEGER NOT NULL DEFAULT 0, apps INTEGER NOT NULL DEFAULT 0, potm INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (season_id, account_id, player_id));
        ALTER TABLE matches ADD COLUMN IF NOT EXISTS season_id TEXT;
        ALTER TABLE matches ADD COLUMN IF NOT EXISTS initiator_id TEXT;
        ALTER TABLE clubs ADD COLUMN IF NOT EXISTS so_duties TEXT;
        ALTER TABLE accounts ADD COLUMN IF NOT EXISTS tier TEXT;
        ALTER TABLE accounts ADD COLUMN IF NOT EXISTS password_hash TEXT;
        ALTER TABLE accounts ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 500;
        ALTER TABLE honours ADD COLUMN IF NOT EXISTS coin_reward INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE honours ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'league';
        ALTER TABLE accounts ADD COLUMN IF NOT EXISTS wallet_address TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_wallet ON accounts(wallet_address) WHERE wallet_address IS NOT NULL;
      `);
    },
    async createAccount(id, handle, token, createdAt, passwordHash) {
      await q('INSERT INTO accounts (id, handle, token, rating, created_at, password_hash) VALUES ($1,$2,$3,1000,$4,$5)', [id, handle, token, createdAt, passwordHash]);
    },
    async accountByToken(token) {
      const r = (await q('SELECT id, handle, rating, created_at FROM accounts WHERE token=$1', [token])).rows[0];
      return r && { id: r.id, handle: r.handle, rating: r.rating, createdAt: Number(r.created_at) } as Account;
    },
    async accountAuthByHandle(handle) {
      const r = (await q('SELECT id, handle, rating, token, password_hash FROM accounts WHERE handle=$1', [handle])).rows[0];
      return r && { id: r.id, handle: r.handle, rating: r.rating, token: r.token, passwordHash: r.password_hash ?? null } as AuthRow;
    },
    async setPassword(accountId, passwordHash) { await q('UPDATE accounts SET password_hash=$1 WHERE id=$2', [passwordHash, accountId]); },
    async walletAccount(address) {
      const r = (await q('SELECT id, handle, rating, token FROM accounts WHERE wallet_address=$1', [address.toLowerCase()])).rows[0];
      return r && { id: r.id, handle: r.handle, rating: r.rating, token: r.token };
    },
    async linkWallet(accountId, address) { await q('UPDATE accounts SET wallet_address=$1 WHERE id=$2', [address.toLowerCase(), accountId]); },
    async walletOf(accountId) { const r = (await q('SELECT wallet_address FROM accounts WHERE id=$1', [accountId])).rows[0]; return r ? (r.wallet_address ?? null) : null; },
    async accountById(id) {
      const r = (await q('SELECT id, handle, rating, created_at FROM accounts WHERE id=$1', [id])).rows[0];
      return r && { id: r.id, handle: r.handle, rating: r.rating, createdAt: Number(r.created_at) } as Account;
    },
    async handleTaken(handle) { return (await q('SELECT 1 FROM accounts WHERE handle=$1', [handle])).rowCount! > 0; },
    async setRating(id, rating) { await q('UPDATE accounts SET rating=$1 WHERE id=$2', [rating, id]); },
    async getCoins(id) { const r = (await q('SELECT coins FROM accounts WHERE id=$1', [id])).rows[0]; return r ? r.coins : 0; },
    async addCoins(id, delta) { await q('UPDATE accounts SET coins = coins + $1 WHERE id=$2', [delta, id]); },
    async createListing(l) {
      await q('INSERT INTO listings (id, seller_id, player_id, player_json, price, status, created_at, buyer_id, sold_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [l.id, l.seller_id, l.player_id, l.player_json, l.price, l.status, l.created_at, l.buyer_id, l.sold_at]);
    },
    async activeListings(limit = 100) {
      return (await q(`SELECT l.*, a.handle AS seller_handle FROM listings l JOIN accounts a ON a.id=l.seller_id
        WHERE l.status='active' ORDER BY l.created_at DESC LIMIT $1`, [limit])).rows as Listing[];
    },
    async listingsBySeller(sellerId) {
      return (await q(`SELECT l.*, a.handle AS seller_handle FROM listings l JOIN accounts a ON a.id=l.seller_id
        WHERE l.seller_id=$1 AND l.status='active' ORDER BY l.created_at DESC`, [sellerId])).rows as Listing[];
    },
    async listingById(id) {
      return (await q(`SELECT l.*, a.handle AS seller_handle FROM listings l JOIN accounts a ON a.id=l.seller_id WHERE l.id=$1`, [id])).rows[0] as Listing | undefined;
    },
    async activeListingForPlayer(playerId) {
      return (await q(`SELECT l.*, a.handle AS seller_handle FROM listings l JOIN accounts a ON a.id=l.seller_id
        WHERE l.player_id=$1 AND l.status='active'`, [playerId])).rows[0] as Listing | undefined;
    },
    async setListingStatus(id, status, buyerId, soldAt) {
      await q('UPDATE listings SET status=$1, buyer_id=$2, sold_at=$3 WHERE id=$4', [status, buyerId, soldAt, id]);
    },
    async opponents(exceptId, myRating, limit = 20) {
      const rows = (await q(
        `SELECT a.id, a.handle, a.rating, c.club FROM accounts a JOIN clubs c ON c.account_id=a.id
         WHERE a.id <> $1 ORDER BY ABS(a.rating - $2) ASC LIMIT $3`, [exceptId, myRating, limit],
      )).rows;
      return rows.map((r) => ({ id: r.id, handle: r.handle, rating: r.rating, clubName: JSON.parse(r.club).name } as OpponentRow));
    },
    async leaderboard(limit = 50) {
      return (await q('SELECT id, handle, rating FROM accounts ORDER BY rating DESC LIMIT $1', [limit])).rows as LeaderRow[];
    },
    async saveClub(accountId, club: Club, so: StandingOrders) {
      const persisted = { ...club, players: club.players.filter((p) => !p.id.startsWith('nft:')) }; // tokens live in the tokens table, never in club JSON
      await q(
        `INSERT INTO clubs (account_id, club, so_formation, so_player_ids, so_tactics, so_duties) VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT(account_id) DO UPDATE SET club=EXCLUDED.club, so_formation=EXCLUDED.so_formation,
           so_player_ids=EXCLUDED.so_player_ids, so_tactics=EXCLUDED.so_tactics, so_duties=EXCLUDED.so_duties`,
        [accountId, JSON.stringify(persisted), so.formation, JSON.stringify(so.playerIds), JSON.stringify(so.tactics), so.duties ? JSON.stringify(so.duties) : null],
      );
    },
    async saveStandingOrders(accountId, so: StandingOrders) {
      await q('UPDATE clubs SET so_formation=$1, so_player_ids=$2, so_tactics=$3, so_duties=$4 WHERE account_id=$5',
        [so.formation, JSON.stringify(so.playerIds), JSON.stringify(so.tactics), so.duties ? JSON.stringify(so.duties) : null, accountId]);
    },
    async getClub(accountId) {
      const r = (await q('SELECT club, so_formation, so_player_ids, so_tactics, so_duties FROM clubs WHERE account_id=$1', [accountId])).rows[0];
      if (!r) return undefined;
      return { club: JSON.parse(r.club), standingOrders: { formation: r.so_formation, playerIds: JSON.parse(r.so_player_ids), tactics: JSON.parse(r.so_tactics), duties: r.so_duties ? JSON.parse(r.so_duties) : undefined } };
    },
    async savePlan(ownerId, opponentId, plan) {
      await q(
        `INSERT INTO plans (owner_id, opponent_id, formation, player_ids, tactics, duties) VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT(owner_id, opponent_id) DO UPDATE SET formation=EXCLUDED.formation, player_ids=EXCLUDED.player_ids, tactics=EXCLUDED.tactics, duties=EXCLUDED.duties`,
        [ownerId, opponentId, plan.formation, JSON.stringify(plan.playerIds), JSON.stringify(plan.tactics), plan.duties ? JSON.stringify(plan.duties) : null],
      );
    },
    async getPlan(ownerId, opponentId) {
      const r = (await q('SELECT formation, player_ids, tactics, duties FROM plans WHERE owner_id=$1 AND opponent_id=$2', [ownerId, opponentId])).rows[0];
      return r && { formation: r.formation, playerIds: JSON.parse(r.player_ids), tactics: JSON.parse(r.tactics), duties: r.duties ? JSON.parse(r.duties) : undefined };
    },
    async getFacilities(accountId) {
      const r = (await q('SELECT stadium, training, youth, scouting, medical, sponsor, fanzone FROM facilities WHERE account_id=$1', [accountId])).rows[0];
      return r ?? { stadium: 1, training: 1, youth: 1, scouting: 1, medical: 1, sponsor: 1, fanzone: 1 };
    },
    async setFacilityLevel(accountId, key, level) {
      if (!['stadium', 'training', 'youth', 'scouting', 'medical', 'sponsor', 'fanzone'].includes(key)) throw new Error('bad facility');
      await q(`INSERT INTO facilities (account_id, ${key}) VALUES ($1,$2) ON CONFLICT (account_id) DO UPDATE SET ${key}=$2`, [accountId, level]); // key validated above
    },
    async getInjuries(accountId) {
      return (await q('SELECT player_id, matches_remaining FROM injuries WHERE account_id=$1', [accountId])).rows as Array<{ player_id: string; matches_remaining: number }>;
    },
    async addInjury(accountId, playerId, matches) {
      await q('INSERT INTO injuries (account_id, player_id, matches_remaining) VALUES ($1,$2,$3) ON CONFLICT (account_id, player_id) DO UPDATE SET matches_remaining=$3', [accountId, playerId, matches]);
    },
    async getContracts(ownerId) {
      return (await q('SELECT player_id, signed_season, length_seasons, staked_since FROM contracts WHERE owner_id=$1', [ownerId])).rows as Array<{ player_id: string; signed_season: number; length_seasons: number; staked_since: number }>;
    },
    async setContract(ownerId, playerId, signedSeason, lengthSeasons, stakedSince) {
      await q('INSERT INTO contracts (owner_id, player_id, signed_season, length_seasons, staked_since) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (owner_id, player_id) DO UPDATE SET signed_season=$3, length_seasons=$4', [ownerId, playerId, signedSeason, lengthSeasons, stakedSince]);
    },
    async deleteContract(ownerId, playerId) {
      await q('DELETE FROM contracts WHERE owner_id=$1 AND player_id=$2', [ownerId, playerId]);
    },
    async getPrimeSeason(playerId) {
      const r = (await q('SELECT prime_season FROM player_lifecycle WHERE player_id=$1', [playerId])).rows[0] as any;
      return r ? r.prime_season as number : undefined;
    },
    async ensurePrimeSeason(playerId, season) {
      await q('INSERT INTO player_lifecycle (player_id, prime_season) VALUES ($1,$2) ON CONFLICT (player_id) DO NOTHING', [playerId, season]);
      return ((await q('SELECT prime_season FROM player_lifecycle WHERE player_id=$1', [playerId])).rows[0] as any).prime_season as number;
    },
    async getLifecycle(playerId) {
      return (await q('SELECT prime_season, retired, peak_overall FROM player_lifecycle WHERE player_id=$1', [playerId])).rows[0] as any;
    },
    async setPeakOverall(playerId, overall) {
      await q('UPDATE player_lifecycle SET peak_overall=$2 WHERE player_id=$1 AND peak_overall < $2', [playerId, overall]);
    },
    async retirePlayer(playerId) {
      await q('UPDATE player_lifecycle SET retired=1 WHERE player_id=$1', [playerId]);
    },
    async getAchievements(playerId) {
      const r = (await q('SELECT seasons, apps, league_titles, cup_titles, promotions, highest_tier_idx FROM player_achievements WHERE player_id=$1', [playerId])).rows[0] as any;
      return r ?? { seasons: 0, apps: 0, league_titles: 0, cup_titles: 0, promotions: 0, highest_tier_idx: 0 };
    },
    async addApps(playerId, n) {
      await q('INSERT INTO player_achievements (player_id, apps) VALUES ($1,$2) ON CONFLICT(player_id) DO UPDATE SET apps = player_achievements.apps + $2', [playerId, n]);
    },
    async recordPlayerSeason(playerId, a) {
      await q(`INSERT INTO player_achievements (player_id, seasons, league_titles, cup_titles, promotions, highest_tier_idx)
        VALUES ($1,1,$2,$3,$4,$5) ON CONFLICT(player_id) DO UPDATE SET seasons = player_achievements.seasons + 1,
        league_titles = player_achievements.league_titles + $2, cup_titles = player_achievements.cup_titles + $3,
        promotions = player_achievements.promotions + $4, highest_tier_idx = GREATEST(player_achievements.highest_tier_idx, $5)`,
        [playerId, a.league, a.cup, a.promotion, a.tierIdx]);
    },
    async setAchievements(playerId, a) {
      await q(`INSERT INTO player_achievements (player_id, seasons, apps, league_titles, cup_titles, promotions, highest_tier_idx)
        VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(player_id) DO UPDATE SET seasons=$2, apps=$3, league_titles=$4, cup_titles=$5, promotions=$6, highest_tier_idx=$7`,
        [playerId, a.seasons, a.apps, a.league_titles, a.cup_titles, a.promotions, a.highest_tier_idx]);
    },
    async saveLegacy(playerId, ownerId, name, cardJson, retiredSeason) {
      await q('INSERT INTO legacies (player_id, owner_id, name, card_json, retired_season) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (player_id) DO UPDATE SET owner_id=$2, name=$3, card_json=$4, retired_season=$5', [playerId, ownerId, name, cardJson, retiredSeason]);
    },
    async getLegacy(playerId) {
      return (await q('SELECT player_id, owner_id, name, card_json, retired_season, reborn_id FROM legacies WHERE player_id=$1', [playerId])).rows[0] as any;
    },
    async legaciesFor(ownerId) {
      return (await q('SELECT player_id, name, card_json, retired_season, reborn_id FROM legacies WHERE owner_id=$1 ORDER BY retired_season DESC', [ownerId])).rows as any[];
    },
    async setReborn(playerId, rebornId) {
      await q('UPDATE legacies SET reborn_id=$2 WHERE player_id=$1', [playerId, rebornId]);
    },
    async createProspect(p) {
      await q('INSERT INTO prospects (id, owner_id, name, parent_id, role_hint, genes_json, pedigree, dev_bonus_json, born_season) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [p.id, p.owner_id, p.name, p.parent_id, p.role_hint, p.genes_json, p.pedigree, p.dev_bonus_json, p.born_season]);
    },
    async prospectsFor(ownerId) {
      return (await q('SELECT id, name, parent_id, role_hint, genes_json, pedigree, dev_bonus_json, born_season, developed, career_seed, agent_id, track, career_actions, developed_player_id FROM prospects WHERE owner_id=$1 ORDER BY born_season DESC', [ownerId])).rows as any[];
    },
    async getProspect(id) {
      return (await q('SELECT id, owner_id, name, parent_id, role_hint, genes_json, pedigree, dev_bonus_json, born_season, developed, career_seed, agent_id, track, career_actions, developed_player_id FROM prospects WHERE id=$1', [id])).rows[0] as any;
    },
    async startProspectCareer(id, seed, agentId, track) {
      await q("UPDATE prospects SET career_seed=$2, agent_id=$3, track=$4, career_actions='[]' WHERE id=$1", [id, seed, agentId, track]);
    },
    async saveProspectActions(id, actionsJson) {
      await q('UPDATE prospects SET career_actions=$2 WHERE id=$1', [id, actionsJson]);
    },
    async setProspectDeveloped(id, playerId) {
      await q('UPDATE prospects SET developed=1, developed_player_id=$2 WHERE id=$1', [id, playerId]);
    },
    async createToken(t) {
      await q('INSERT INTO tokens (id, owner_id, generation, state, name, genes_json, pedigree, dev_bonus_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [t.id, t.owner_id, t.generation, t.state, t.name, t.genes_json, t.pedigree, t.dev_bonus_json]);
    },
    async getToken(id) { return (await q('SELECT * FROM tokens WHERE id=$1', [id])).rows[0] as any; },
    async tokensOwnedBy(ownerId) { return (await q('SELECT * FROM tokens WHERE owner_id=$1 ORDER BY id', [ownerId])).rows as any[]; },
    async countTokens() { return Number(((await q('SELECT COUNT(*) AS n FROM tokens')).rows[0] as any).n); },
    async updateToken(id, fields) {
      const cols = Object.keys(fields).filter((k) => TOKEN_COLS.has(k));
      if (!cols.length) return;
      await q(`UPDATE tokens SET ${cols.map((c, i) => `${c}=$${i + 2}`).join(', ')} WHERE id=$1`, [id, ...cols.map((c) => (fields as any)[c])]);
    },
    async bumpPlayerStats(seasonId, accountId, playerId, playerName, d) {
      await q(`INSERT INTO player_stats (season_id, account_id, player_id, player_name, goals, assists, apps, potm)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (season_id, account_id, player_id) DO UPDATE SET
          player_name=EXCLUDED.player_name, goals=player_stats.goals+EXCLUDED.goals, assists=player_stats.assists+EXCLUDED.assists,
          apps=player_stats.apps+EXCLUDED.apps, potm=player_stats.potm+EXCLUDED.potm`,
        [seasonId, accountId, playerId, playerName, d.goals ?? 0, d.assists ?? 0, d.apps ?? 0, d.potm ?? 0]);
    },
    async seasonPlayerStats(seasonId, accountIds) {
      if (!accountIds.length) return [];
      const ph = accountIds.map((_, i) => `$${i + 2}`).join(',');
      return (await q(`SELECT * FROM player_stats WHERE season_id=$1 AND account_id IN (${ph})`, [seasonId, ...accountIds])).rows as any[];
    },
    async decrementInjuries(accountId) {
      await q('UPDATE injuries SET matches_remaining = matches_remaining - 1 WHERE account_id=$1', [accountId]);
      await q('DELETE FROM injuries WHERE account_id=$1 AND matches_remaining <= 0', [accountId]);
    },
    async createMission(m) {
      await q('INSERT INTO scout_missions (id, account_id, season_id, destination, dispatched_at, ready_at, found, player_json, band, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        [m.id, m.account_id, m.season_id, m.destination, m.dispatched_at, m.ready_at, m.found, m.player_json, m.band, m.status]);
    },
    async missionsInSeason(accountId, seasonId) {
      return (await q('SELECT * FROM scout_missions WHERE account_id=$1 AND season_id=$2 ORDER BY dispatched_at DESC', [accountId, seasonId]))
        .rows.map((r) => ({ ...r, dispatched_at: Number(r.dispatched_at), ready_at: Number(r.ready_at) })) as MissionRow[];
    },
    async missionById(id) {
      const r = (await q('SELECT * FROM scout_missions WHERE id=$1', [id])).rows[0];
      return r ? { ...r, dispatched_at: Number(r.dispatched_at), ready_at: Number(r.ready_at) } as MissionRow : undefined;
    },
    async setMissionSigned(id) { await q("UPDATE scout_missions SET status='signed' WHERE id=$1", [id]); },
    async countMissionsInSeason(accountId, seasonId) {
      return (await q('SELECT COUNT(*)::int AS c FROM scout_missions WHERE account_id=$1 AND season_id=$2', [accountId, seasonId])).rows[0].c as number;
    },
    async addLoanee(ownerId, seasonId, playerId) {
      await q('INSERT INTO loanees (owner_id, season_id, player_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [ownerId, seasonId, playerId]);
    },
    async countLoanees(ownerId, seasonId) {
      const r = (await q('SELECT COUNT(*)::int AS c FROM loanees WHERE owner_id=$1 AND season_id=$2', [ownerId, seasonId])).rows[0];
      return r ? r.c : 0;
    },
    async loaneeIds(ownerId, seasonId) {
      return (await q('SELECT player_id FROM loanees WHERE owner_id=$1 AND season_id=$2', [ownerId, seasonId])).rows.map((r) => r.player_id);
    },
    async loaneesInSeason(seasonId) {
      return (await q('SELECT owner_id, player_id FROM loanees WHERE season_id=$1', [seasonId])).rows as Array<{ owner_id: string; player_id: string }>;
    },
    async deleteLoaneesInSeason(seasonId) { await q('DELETE FROM loanees WHERE season_id=$1', [seasonId]); },
    async saveMatch(m: StoredMatch) {
      await q(
        `INSERT INTO matches (id, home_id, away_id, home_team, away_team, home_tactics, away_tactics, seed, home_score, away_score, created_at, season_id, initiator_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [m.id, m.homeId, m.awayId, JSON.stringify(m.homeTeam), JSON.stringify(m.awayTeam),
          JSON.stringify(m.homeTactics), JSON.stringify(m.awayTactics), m.seed, m.homeScore, m.awayScore, m.createdAt, m.seasonId ?? null, m.initiatorId ?? null],
      );
    },
    async getMatch(id) {
      const r = (await q('SELECT * FROM matches WHERE id=$1', [id])).rows[0];
      return r && {
        id: r.id, homeId: r.home_id, awayId: r.away_id,
        homeTeam: JSON.parse(r.home_team), awayTeam: JSON.parse(r.away_team),
        homeTactics: JSON.parse(r.home_tactics), awayTactics: JSON.parse(r.away_tactics),
        seed: Number(r.seed), homeScore: r.home_score, awayScore: r.away_score, createdAt: Number(r.created_at),
      } as StoredMatch;
    },
    async matchesFor(accountId, limit = 30) {
      return (await q(
        'SELECT id, home_id, away_id, home_score, away_score, created_at FROM matches WHERE home_id=$1 OR away_id=$1 ORDER BY created_at DESC LIMIT $2',
        [accountId, limit],
      )).rows.map((r) => ({ ...r, created_at: Number(r.created_at) })) as MatchRow[];
    },
    async recentResults(limit = 40, seasonId) {
      const base = `SELECT m.id, m.home_id, m.away_id, m.home_score, m.away_score, m.created_at,
                ha.handle AS home_handle, aa.handle AS away_handle
         FROM matches m JOIN accounts ha ON ha.id=m.home_id JOIN accounts aa ON aa.id=m.away_id`;
      const rows = seasonId
        ? (await q(base + ' WHERE m.season_id=$1 ORDER BY m.created_at DESC LIMIT $2', [seasonId, limit])).rows
        : (await q(base + ' ORDER BY m.created_at DESC LIMIT $1', [limit])).rows;
      return rows.map((r) => ({ ...r, created_at: Number(r.created_at) })) as ResultRow[];
    },
    async allAccounts() { return (await q('SELECT id, handle, rating FROM accounts')).rows as LeaderRow[]; },
    async allResults() { return (await q('SELECT home_id, away_id, home_score, away_score FROM matches')).rows as any[]; },
    async currentSeason() {
      const r = (await q("SELECT id, number, starts_at, ends_at, status FROM seasons WHERE status='active' ORDER BY number DESC LIMIT 1")).rows[0];
      return r && { id: r.id, number: r.number, startsAt: Number(r.starts_at), endsAt: Number(r.ends_at), status: r.status } as Season;
    },
    async createSeason(id, number, startsAt, endsAt) {
      await q("INSERT INTO seasons (id, number, starts_at, ends_at, status) VALUES ($1,$2,$3,$4,'active')", [id, number, startsAt, endsAt]);
      return { id, number, startsAt, endsAt, status: 'active' } as Season;
    },
    async closeSeason(id) { await q("UPDATE seasons SET status='closed' WHERE id=$1", [id]); },
    async seasonResults(seasonId) {
      return (await q('SELECT home_id, away_id, home_score, away_score FROM matches WHERE season_id=$1', [seasonId])).rows as any[];
    },
    async matchesToday(accountId, seasonId, sinceMs) {
      const r = (await q('SELECT COUNT(*)::int AS c FROM matches WHERE initiator_id=$1 AND season_id=$2 AND created_at>=$3', [accountId, seasonId, sinceMs])).rows[0];
      return r ? r.c : 0;
    },
    async addHonour(accountId, seasonId, seasonNumber, tier, finalPos, title, endedAt, coinReward, kind) {
      await q('INSERT INTO honours (account_id, season_id, season_number, tier, final_pos, title, ended_at, coin_reward, kind) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [accountId, seasonId, seasonNumber, tier, finalPos, title, endedAt, coinReward, kind]);
    },
    async honoursFor(accountId, limit = 30) {
      return (await q('SELECT season_number, tier, final_pos, title, ended_at, coin_reward, kind FROM honours WHERE account_id=$1 ORDER BY season_number DESC LIMIT $2', [accountId, limit]))
        .rows.map((r) => ({ ...r, ended_at: Number(r.ended_at) })) as HonourRow[];
    },
    async accountTier(accountId) {
      const r = (await q('SELECT tier FROM accounts WHERE id=$1', [accountId])).rows[0];
      return (r && r.tier) || 'SUNDAY LEAGUE';
    },
    async setTier(accountId, tier) { await q('UPDATE accounts SET tier=$1 WHERE id=$2', [tier, accountId]); },
    async podOf(seasonId, accountId) {
      const r = (await q('SELECT tier, pod FROM pod_members WHERE season_id=$1 AND account_id=$2', [seasonId, accountId])).rows[0];
      return r && { tier: r.tier, pod: r.pod } as PodRef;
    },
    async assignPod(seasonId, accountId, tier, pod) {
      await q(`INSERT INTO pod_members (season_id, account_id, tier, pod) VALUES ($1,$2,$3,$4)
               ON CONFLICT (season_id, account_id) DO UPDATE SET tier=EXCLUDED.tier, pod=EXCLUDED.pod`, [seasonId, accountId, tier, pod]);
    },
    async tierPodCounts(seasonId, tier) {
      return (await q('SELECT pod, COUNT(*)::int AS count FROM pod_members WHERE season_id=$1 AND tier=$2 GROUP BY pod ORDER BY pod', [seasonId, tier]))
        .rows as Array<{ pod: number; count: number }>;
    },
    async podMembers(seasonId, tier, pod) {
      return (await q('SELECT a.id, a.handle, a.rating FROM pod_members pm JOIN accounts a ON a.id=pm.account_id WHERE pm.season_id=$1 AND pm.tier=$2 AND pm.pod=$3', [seasonId, tier, pod]))
        .rows as LeaderRow[];
    },
    async seasonPods(seasonId) {
      return (await q('SELECT DISTINCT tier, pod FROM pod_members WHERE season_id=$1 ORDER BY tier, pod', [seasonId])).rows as PodRef[];
    },
    async reset() { await q('TRUNCATE accounts, clubs, matches, seasons, honours, pod_members, plans, loanees, listings, scout_missions, facilities, injuries, contracts, player_lifecycle, player_achievements, legacies, prospects, tokens'); },
  };
}
