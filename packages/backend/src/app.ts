import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { db } from './db/index.js';
import { DrizzleOfferRepository } from './repositories/drizzle-offer.repository.js';
import { offersRoutes } from './routes/offers.js';
import type { IOfferRepository } from './repositories/offer.repository.js';

export interface BuildAppOptions {
  repository?: IOfferRepository;
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false });
  await app.register(cors);

  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  const repository = options.repository ?? new DrizzleOfferRepository(db);
  await app.register(offersRoutes, { prefix: '/api/offers', repository });

  return app;
}
