import type { Offer, NewOffer } from '../db/schema.js';
import type { ListOffersQuery } from '../schemas/offer.js';

export interface ListOffersResult {
  items: Offer[];
  total: number;
}

export interface IOfferRepository {
  findAll(query: ListOffersQuery): Promise<ListOffersResult>;
  findById(id: number): Promise<Offer | null>;
  upsertBatch(offers: NewOffer[]): Promise<{ inserted: number; updated: number }>;
}
