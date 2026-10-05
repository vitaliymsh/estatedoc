import dotenv from 'dotenv';
import { resolve } from 'path';
import { buildApp } from './app.js';

dotenv.config({ path: resolve(process.cwd(), '../../.env') });

const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST || '0.0.0.0';

const app = await buildApp({ logger: true });

try {
  await app.listen({ port, host });
  console.log(`Server listening on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export default app;
