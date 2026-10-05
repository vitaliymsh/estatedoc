import { buildApp } from './app.js';

try {
  process.loadEnvFile('../../.env');
} catch {
  // Ignore if already loaded or missing
}

const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST || '0.0.0.0';

const app = await buildApp({ logger: true });

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
