import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '../../.env') });

const app = Fastify({ logger: true });
await app.register(cors);

app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST || '0.0.0.0';

if (process.env.NODE_ENV !== 'test') {
  try {
    await app.listen({ port, host });
    console.log(`Server listening on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

export default app;
