import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';
import { resolve } from 'node:path';

try {
  process.loadEnvFile(resolve(import.meta.dirname, '../../../../.env'));
} catch {
  // Ignore if env file already loaded or not present
}

const connectionUri = process.env.DATABASE_URL || 'mysql://estateplanner:estateplanner_secret@localhost:3308/estateplanner';

export const pool = mysql.createPool(connectionUri);
export const db = drizzle(pool, { schema, mode: 'default' });

export async function closeDb(): Promise<void> {
  await pool.end();
}
