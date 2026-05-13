import { Pool } from 'pg';

// Reads connection from PG* env vars (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD).
// Falls back to local pg defaults in dev.
const pool = new Pool();

export default pool;
