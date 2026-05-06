import { Pool } from 'pg';

// Standalone pg Pool for direct file queries (documents table).
// Uses the config-object form — NOT a connection string URL — so special
// characters in the password are never URL-encoded and never misinterpreted.
//
// Build-time safety: if the POSTGRES_* vars are absent (e.g. Vercel static
// analysis pass) the Pool is constructed but never connected, so the build
// does not crash.  Runtime calls will fail fast with a clear DB error rather
// than a cryptic module-init error.

const globalForPool = globalThis as unknown as { _pgPool: Pool | undefined };

function createPool(): Pool {
  return new Pool({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD, // pg handles special chars natively
    ssl: { rejectUnauthorized: false },       // required for Azure Database for PostgreSQL
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

// Reuse the pool across hot-reloads in development.
const pool = globalForPool._pgPool ?? createPool();
if (process.env.NODE_ENV !== 'production') globalForPool._pgPool = pool;

export default pool;
