import { z } from 'zod';

export const listOffersQuerySchema = z.object({
  q: z.string().trim().optional(),
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  portal: z.string().trim().optional(),
  propertyType: z.enum(['apartment', 'house', 'land', 'commercial', 'garage', 'other']).optional(),
  transactionType: z.enum(['sale', 'rent']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRooms: z.coerce.number().int().min(1).optional(),
  maxRooms: z.coerce.number().int().min(1).optional(),
  sortBy: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
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
  floor: z.coerce.number().int().nullable().optional(),
  totalFloors: z.coerce.number().int().nullable().optional(),
  propertyType: z.enum(['apartment', 'house', 'land', 'commercial', 'garage', 'other']).nullable().optional(),
  transactionType: z.enum(['sale', 'rent']).nullable().optional(),
  city: z.string().min(1).max(64),
  district: z.string().max(64).nullable().optional(),
  street: z.string().max(128).nullable().optional(),
  sellerType: z.enum(['private', 'company', 'agency', 'developer', 'verified']).nullable().optional(),
  images: z.array(z.string().url().or(z.string().min(1))).nullable().optional(),
  description: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const batchIngestOffersSchema = z.array(batchOfferItemSchema).min(1).max(500);

export const checkExistingOffersSchema = z.object({
  portal: z.string().min(1).max(32),
  externalIds: z.array(z.string().min(1).max(128)).max(1000),
});

export type ListOffersQuery = z.infer<typeof listOffersQuerySchema>;
export type GetOfferParams = z.infer<typeof getOfferParamsSchema>;
export type BatchOfferItem = z.infer<typeof batchOfferItemSchema>;
export type BatchIngestOffersInput = z.infer<typeof batchIngestOffersSchema>;
export type CheckExistingOffersInput = z.infer<typeof checkExistingOffersSchema>;
