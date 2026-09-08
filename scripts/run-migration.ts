/**
 * Jalankan SQL migration file ke database.
 * Usage: npx ts-node scripts/run-migration.ts
 */
import 'dotenv/config';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';
import { setDefaultResultOrder } from 'node:dns';

setDefaultResultOrder('ipv4first');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }

  const isSupabase = databaseUrl.includes('supabase');
  const client = new Client({
    connectionString: databaseUrl,
    ssl: isSupabase ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Tracking migration yang sudah diterapkan — tiap run hanya mengeksekusi
    // file yang belum tercatat, supaya aman dijalankan ulang.
    await client.query(`
      CREATE TABLE IF NOT EXISTS _bagdja_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows: appliedRows } = await client.query<{ filename: string }>(
      'SELECT filename FROM _bagdja_migrations',
    );
    const applied = new Set(appliedRows.map((r) => r.filename));

    const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      if (applied.has(file)) {
        console.log(`⏭️  Skip (sudah diterapkan): ${file}`);
        continue;
      }
      console.log(`⏳ Running migration: ${file}`);
      const sql = readFileSync(join(migrationsDir, file), 'utf-8');
      await client.query(sql);
      await client.query('INSERT INTO _bagdja_migrations (filename) VALUES ($1)', [file]);
      console.log(`✅ ${file} completed`);
    }

    console.log('🎉 All migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

void main();
