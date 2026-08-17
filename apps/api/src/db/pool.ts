import pg from 'pg';
import { config } from '../config';

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({ connectionString: config.DATABASE_URL, max: 10 });
  }
  return pool;
}

export async function pingDb(): Promise<void> {
  await getPool().query('SELECT 1');
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
