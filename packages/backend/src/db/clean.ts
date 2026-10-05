import { sql } from 'drizzle-orm';
import { db, closeDb } from './index.js';
import { offers } from './schema.js';

async function main() {
  const isAll = process.argv.includes('--all');
  const minImages = process.argv.includes('--only-multi') ? 2 : 1;

  if (isAll) {
    console.log('[DB Clean] Dropping all offers from database...');
    const [result] = await db.delete(offers);
    const affected = (result as { affectedRows?: number })?.affectedRows ?? 0;
    console.log(`[DB Clean] Successfully deleted all ${affected} offer(s) from database.`);
    await closeDb();
    return;
  }

  console.log(`[DB Clean] Removing offers with fewer than ${minImages} image(s)...`);

  const condition =
    minImages === 1
      ? sql`images IS NULL OR JSON_LENGTH(images) = 0`
      : sql`images IS NULL OR JSON_LENGTH(images) < 2`;

  const [result] = await db.delete(offers).where(condition);
  const affected = (result as { affectedRows?: number })?.affectedRows ?? 0;

  console.log(`[DB Clean] Cleaned up ${affected} offer(s) from database.`);
  await closeDb();
}

main().catch(async (err) => {
  console.error('[DB Clean] Failed:', err);
  await closeDb();
  process.exit(1);
});
