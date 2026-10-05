import { z } from 'zod';

const booleanQueryParam = z.preprocess((val) => {
  if (val === 'true' || val === true || val === '1' || val === 1) return true;
  if (val === 'false' || val === false || val === '0' || val === 0) return false;
  return undefined;
}, z.boolean().optional());

export const listOffersQuerySchema = z.object({
  q: z.string().trim().optional(),
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  portal: z.string().trim().optional(),
  propertyType: z.enum(['apartment', 'house', 'land', 'commercial', 'garage', 'other']).optional(),
  transactionType: z.enum(['sale', 'rent']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minArea: z.coerce.number().min(0).optional(),
  maxArea: z.coerce.number().min(0).optional(),
  minRooms: z.coerce.number().int().min(1).optional(),
  maxRooms: z.coerce.number().int().min(1).optional(),
  minFloor: z.coerce.number().int().optional(),
  maxFloor: z.coerce.number().int().optional(),
  sellerType: z.enum(['private', 'company', 'agency', 'developer', 'verified']).optional(),
  marketType: z.enum(['primary', 'secondary']).optional(),
  hasElevator: booleanQueryParam,
  hasBalcony: booleanQueryParam,
  hasParking: booleanQueryParam,
  hasAirConditioning: booleanQueryParam,
  isFurnished: booleanQueryParam,
  hasBasement: booleanQueryParam,
  sortBy: z
    .enum(['newest', 'price_asc', 'price_desc', 'area_asc', 'area_desc', 'price_sqm_asc', 'price_sqm_desc'])
    .default('newest'),
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
  price: z.coerce.number().nullish(),
  areaSqm: z.coerce.number().nullish(),
  roomsCount: z.coerce.number().int().nullish(),
  floor: z.coerce.number().int().nullish(),
  totalFloors: z.coerce.number().int().nullish(),
  propertyType: z.enum(['apartment', 'house', 'land', 'commercial', 'garage', 'other']).nullish(),
  transactionType: z.enum(['sale', 'rent']).nullish(),
  city: z.string().min(1).max(64),
  district: z.string().max(64).nullable().optional(),
  street: z.string().max(128).nullable().optional(),
  sellerType: z.enum(['private', 'company', 'agency', 'developer', 'verified']).nullable().optional(),
  pricePerSqm: z.coerce.number().int().nullish(),
  images: z.array(z.string().url()).nullish(),
  description: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const batchIngestOffersSchema = z.array(batchOfferItemSchema).min(1).max(500);

export const checkExistingOffersSchema = z.object({
  portal: z.string().min(1).max(32),
  externalIds: z.array(z.string().min(1).max(128)).max(1000),
});

export const aiSearchSchema = z.object({
  prompt: z.string().trim().min(1).max(500),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type ListOffersQuery = z.infer<typeof listOffersQuerySchema>;
export type GetOfferParams = z.infer<typeof getOfferParamsSchema>;
export type BatchOfferItem = z.infer<typeof batchOfferItemSchema>;
export type BatchIngestOffersInput = z.infer<typeof batchIngestOffersSchema>;
export type CheckExistingOffersInput = z.infer<typeof checkExistingOffersSchema>;
export type AiSearchInput = z.infer<typeof aiSearchSchema>;
