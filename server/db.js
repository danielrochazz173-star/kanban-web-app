import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

export async function runMigrations() {
  const path = join(__dirname, 'migrations', '001_initial.sql');
  const sql = readFileSync(path, 'utf8');
  await pool.query(sql);
}

export default pool;
