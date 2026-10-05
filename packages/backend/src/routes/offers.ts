import type { FastifyPluginAsync } from 'fastify';
import type { IOfferRepository } from '../repositories/offer.repository.js';
import {
  listOffersQuerySchema,
  getOfferParamsSchema,
  batchIngestOffersSchema,
} from '../schemas/offer.js';

export interface OffersRoutesOptions {
  repository: IOfferRepository;
}

export const offersRoutes: FastifyPluginAsync<OffersRoutesOptions> = async (fastify, opts) => {
  const repo = opts.repository;

  fastify.get('/', async (request, reply) => {
    const parsed = listOffersQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid query parameters', details: parsed.error.issues });
    }
    const result = await repo.findAll(parsed.data);
    return {
      items: result.items,
      total: result.total,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    };
  });

  fastify.get('/:id', async (request, reply) => {
    const parsed = getOfferParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid ID parameter', details: parsed.error.issues });
    }
    const offer = await repo.findById(parsed.data.id);
    if (!offer) {
      return reply.status(404).send({ error: 'Offer not found' });
    }
    return offer;
  });

  fastify.post('/batch', async (request, reply) => {
    const parsed = batchIngestOffersSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid batch payload', details: parsed.error.issues });
    }
    const normalizedOffers = parsed.data.map((item) => ({
      portal: item.portal,
      externalId: item.externalId,
      url: item.url,
      title: item.title,
      price: item.price !== undefined && item.price !== null ? String(item.price) : null,
      areaSqm: item.areaSqm !== undefined && item.areaSqm !== null ? String(item.areaSqm) : null,
      roomsCount: item.roomsCount ?? null,
      city: item.city,
      description: item.description ?? null,
      metadata: item.metadata ?? null,
    }));
    const result = await repo.upsertBatch(normalizedOffers);
    return reply.status(201).send(result);
  });
};
