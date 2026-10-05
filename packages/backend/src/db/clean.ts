import { sql } from 'drizzle-orm';
import { db, closeDb } from './index.js';
import { offers } from './schema.js';

async function main() {
  const isAll = process.argv.includes('--all');
  const minImages = process.argv.includes('--only-multi') ? 2 : 1;

  try {
    const condition = isAll
      ? undefined
      : minImages === 1
        ? sql`images IS NULL OR JSON_LENGTH(images) = 0`
        : sql`images IS NULL OR JSON_LENGTH(images) < 2`;

    const query = condition ? db.delete(offers).where(condition) : db.delete(offers);
    const [result] = await query;
    const affected = (result as { affectedRows?: number })?.affectedRows ?? 0;
    console.log(`[DB Clean] Removed ${affected} offer(s) from database.`);
  } finally {
    await closeDb();
  }
}

main().catch((err) => {
  console.error('[DB Clean] Failed:', err);
  process.exit(1);
});
