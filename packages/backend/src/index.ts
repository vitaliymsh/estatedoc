import 'dotenv/config';
import { buildApp } from './app.js';

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
