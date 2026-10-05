import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db, pool } from './index.js';
import { resolve } from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

async function runMigrations() {
  console.log('Running migrations...');
  const migrationsFolder = resolve(import.meta.dirname, '../../drizzle');
  try {
    // Ensure __drizzle_migrations table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`__drizzle_migrations\` (
        id serial primary key,
        hash text not null,
        created_at bigint
      );
    `);

    // Check if table offers exists and if migration 0000 is recorded
    const [tables] = await pool.query(`SHOW TABLES LIKE 'offers'`) as unknown as [unknown[]];
    const [migEntries] = await pool.query(`SELECT id FROM \`__drizzle_migrations\` WHERE created_at = 1791200867917`) as unknown as [unknown[]];

    if (tables.length > 0 && migEntries.length === 0) {
      const sql0 = fs.readFileSync(resolve(migrationsFolder, '0000_messy_klaw.sql'), 'utf-8');
      const hash0 = crypto.createHash('sha256').update(sql0).digest('hex');
      await pool.query(`INSERT INTO \`__drizzle_migrations\` (hash, created_at) VALUES (?, ?)`, [hash0, 1791200867917]);
      console.log('Baseline migration 0000 recorded.');
    }

    await migrate(db, { migrationsFolder });
    console.log('Migrations applied successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
