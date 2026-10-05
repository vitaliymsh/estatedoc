import type { ListOffersQuery } from '../schemas/offer.js';
import type { LLMProvider } from './llm/llm-provider.js';

export interface IQueryParser {
  parse(prompt: string): Promise<Partial<ListOffersQuery>>;
}

const SYSTEM_PROMPT = `You extract structured real estate search filters from user queries in Polish or English.
Return JSON with this schema:
{
  "q": "keywords for description/title search or null",
  "city": "city name or null",
  "district": "district name or null",
  "propertyType": "apartment" | "house" | "land" | "commercial" | "garage" | "other" | null,
  "transactionType": "sale" | "rent" | null,
  "minPrice": number (in PLN) or null,
  "maxPrice": number (in PLN) or null,
  "minRooms": integer or null,
  "maxRooms": integer or null,
  "sortBy": "newest" | "price_asc" | "price_desc" | null
}
Rules:
- Do not invent criteria not requested.
- For prices, convert 'k' or 'tys' to thousands (e.g. 500k -> 500000, 1.2m -> 1200000).
- If exact room count requested (e.g. "3 pokoje"), set minRooms=3 and maxRooms=3.
- If keywords cannot be mapped to specific fields (e.g. "balkon", "klimatyzacja", "blisko metra"), put them in 'q'.
- Set null for fields not mentioned.`;

export class LLMQueryParser implements IQueryParser {
  constructor(private readonly provider: LLMProvider) {}

  async parse(prompt: string): Promise<Partial<ListOffersQuery>> {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return {};
    }

    try {
      const rawText = await this.provider.generate(trimmed, {
        systemPrompt: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      });

      if (!rawText) {
        return { q: trimmed };
      }

      const parsed = JSON.parse(rawText) as Record<string, unknown>;
      const result: Partial<ListOffersQuery> = {};

      if (typeof parsed.q === 'string' && parsed.q.trim()) result.q = parsed.q.trim();
      if (typeof parsed.city === 'string' && parsed.city.trim()) result.city = parsed.city.trim();
      if (typeof parsed.district === 'string' && parsed.district.trim()) result.district = parsed.district.trim();
      if (typeof parsed.minPrice === 'number' && !isNaN(parsed.minPrice)) result.minPrice = parsed.minPrice;
      if (typeof parsed.maxPrice === 'number' && !isNaN(parsed.maxPrice)) result.maxPrice = parsed.maxPrice;
      if (typeof parsed.minRooms === 'number' && !isNaN(parsed.minRooms)) result.minRooms = parsed.minRooms;
      if (typeof parsed.maxRooms === 'number' && !isNaN(parsed.maxRooms)) result.maxRooms = parsed.maxRooms;

      const validPropertyTypes = ['apartment', 'house', 'land', 'commercial', 'garage', 'other'] as const;
      if (typeof parsed.propertyType === 'string' && (validPropertyTypes as readonly string[]).includes(parsed.propertyType)) {
        result.propertyType = parsed.propertyType as ListOffersQuery['propertyType'];
      }

      const validTransactionTypes = ['sale', 'rent'] as const;
      if (typeof parsed.transactionType === 'string' && (validTransactionTypes as readonly string[]).includes(parsed.transactionType)) {
        result.transactionType = parsed.transactionType as ListOffersQuery['transactionType'];
      }

      const validSort = ['newest', 'price_asc', 'price_desc'] as const;
      if (typeof parsed.sortBy === 'string' && (validSort as readonly string[]).includes(parsed.sortBy)) {
        result.sortBy = parsed.sortBy as ListOffersQuery['sortBy'];
      }

      return Object.keys(result).length > 0 ? result : { q: trimmed };
    } catch {
      // ponytail: graceful degradation on parse or provider error to keyword search
      return { q: trimmed };
    }
  }
}
