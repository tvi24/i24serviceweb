import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeDb, getPool } from './pool';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

async function ensureMigrationsTable() {
  await getPool().query(`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
}

export async function migrate() {
  await ensureMigrationsTable();
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql') && !f.endsWith('.down.sql'))
    .sort();

  for (const file of files) {
    const { rowCount } = await getPool().query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
    if (rowCount && rowCount > 0) continue;
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`Applied migration: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
  console.log('Migrations up to date.');
}

// Run directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('migrate.ts')) {
  migrate()
    .then(() => closeDb())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
