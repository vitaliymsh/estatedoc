import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';
import { resolve } from 'node:path';

try {
  process.loadEnvFile(resolve(import.meta.dirname, '../../../../.env'));
} catch {
  // Ignore if env file already loaded or not present
}

const connectionUri = process.env.DATABASE_URL || (process.env.DB_HOST
  ? `mysql://${process.env.DB_USER || 'estateplanner'}:${process.env.DB_PASSWORD || 'estateplanner_secret'}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'estateplanner'}`
  : 'mysql://estateplanner:estateplanner_secret@localhost:3308/estateplanner');

export const pool = mysql.createPool(connectionUri);
export const db = drizzle(pool, { schema, mode: 'default' });

export async function closeDb(): Promise<void> {
  await pool.end();
}
