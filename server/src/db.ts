// Pick the storage backend: Postgres in production (DATABASE_URL set), else
// local SQLite. Both implement the same async Store interface.
import type { Store } from './store.js';
import { makeSqliteStore } from './store-sqlite.js';
import { makePostgresStore } from './store-postgres.js';

export * from './store.js';

export const db: Store = process.env.DATABASE_URL
  ? makePostgresStore(process.env.DATABASE_URL)
  : makeSqliteStore(process.env.FM_DB ?? 'fm.db');
