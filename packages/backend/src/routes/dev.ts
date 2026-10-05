import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { IIngestRunner } from '../services/ingest-runner.js';

const devIngestBodySchema = z.object({
  portal: z.enum(['sprzedajemy', 'morizon', 'all']).default('all'),
  maxPages: z.coerce.number().min(1).max(5).default(1),
  categoryPath: z.string().optional(),
});

export interface DevRoutesOptions {
  runner: IIngestRunner;
}

export const devRoutes: FastifyPluginAsync<DevRoutesOptions> = async (fastify, opts) => {
  const runner = opts.runner;

  fastify.post('/ingest', async (request, reply) => {
    const parsed = devIngestBodySchema.safeParse(request.body || {});
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid parameters', details: parsed.error.issues });
    }

    const result = await runner.trigger(parsed.data);
    return reply.status(result.status === 'ok' ? 200 : 500).send(result);
  });
};
