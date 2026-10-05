import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { buildApp } from './app.js';

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(process.cwd(), '../../.env') });

const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST || '0.0.0.0';

const app = await buildApp({ logger: true });

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
