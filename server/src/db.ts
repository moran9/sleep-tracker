import { Pool } from 'pg';

const pool = new Pool({
  database: 'sleep_tracker',
});

export default pool;
