import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../../../.env') });

const connectionUri = process.env.DATABASE_URL || 'mysql://estateplanner:estateplanner_secret@localhost:3308/estateplanner';

export const pool = mysql.createPool(connectionUri);
export const db = drizzle(pool, { schema, mode: 'default' });
