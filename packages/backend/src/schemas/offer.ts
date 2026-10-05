import { z } from 'zod';

export const listOffersQuerySchema = z.object({
  city: z.string().optional(),
  portal: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const getOfferParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const batchOfferItemSchema = z.object({
  portal: z.string().min(1).max(32),
  externalId: z.string().min(1).max(128),
  url: z.string().url(),
  title: z.string().min(1).max(255),
  price: z.coerce.number().nullable().optional(),
  areaSqm: z.coerce.number().nullable().optional(),
  roomsCount: z.coerce.number().int().nullable().optional(),
  city: z.string().min(1).max(64),
  description: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const batchIngestOffersSchema = z.array(batchOfferItemSchema).min(1).max(500);

export type ListOffersQuery = z.infer<typeof listOffersQuerySchema>;
export type GetOfferParams = z.infer<typeof getOfferParamsSchema>;
export type BatchOfferItem = z.infer<typeof batchOfferItemSchema>;
export type BatchIngestOffersInput = z.infer<typeof batchIngestOffersSchema>;
