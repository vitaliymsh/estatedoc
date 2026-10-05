import type { ListOffersQuery } from '../schemas/offer.js';
import type { LLMProvider } from './llm/llm-provider.js';

export interface IQueryParser {
  parse(prompt: string): Promise<Partial<ListOffersQuery>>;
}

export const SYSTEM_PROMPT = `You are a real estate query understanding engine for a Polish property portal.
Your task is to parse unstructured user search prompts (in Polish, English, or mixed) into a precise JSON filter object.

### FIELD SPECIFICATIONS & UNITS:
- "q": string | null
  Keywords, points of interest, qualitative descriptors (e.g. "blisko metra", "ciche", "view on park", "kamienica", "renovated"). Do NOT extract terms already captured in structured fields.
- "city": string | null
  City name normalized to official Polish nominative case (e.g. "Warsaw" -> "Warszawa", "w Krakowie" -> "Kraków", "Wrocławiu" -> "Wrocław").
- "district": string | null
  Sub-city neighborhood or administrative district (e.g. "Mokotów", "Śródmieście", "Jeżyce", "Przymorze").
- "propertyType": "apartment" | "house" | "land" | "commercial" | "garage" | "other" | null
  - "apartment": flats, apartments, studios, kawalerki, lofts, penthouses.
  - "house": detached houses, semi-detached (bliźniak), terraced (szeregowiec), villas.
  - "land": building plots, agricultural land, działki budowlane/rekreacyjne.
  - "commercial": offices, retail spaces, warehouses, lokale użytkowe/handlowe.
  - "garage": parking spaces, underground spots, garaże, miejsca postojowe.
- "transactionType": "sale" | "rent" | null
  - "sale": purchase, for sale, na sprzedaż, kupno.
  - "rent": rental, to let, wynajem, najem, do wynajęcia.
- "minPrice" / "maxPrice": number (integer in PLN) | null
  Total property transaction price in Polish Złoty.
  - Multipliers: "k" / "tys" = 1,000; "m" / "mln" = 1,000,000 (e.g. "800k" -> 800000, "1.5 mln" -> 1500000).
  - Upper limit phrases ("do 600k", "under 600k", "max 600000") -> set maxPrice.
  - Lower limit phrases ("od 300k", "at least 300k", "min 300000") -> set minPrice.
  - Price ranges ("400k - 600k") -> set minPrice=400000, maxPrice=600000.
- "minArea" / "maxArea": number (float/int in m²) | null
  Usable floor living area in square meters (m² / sqm / metrów kwadratowych).
  - "od 50 m2", "przynajmniej 50m2", "at least 50 sqm" -> minArea=50.
  - "do 70 m2", "poniżej 70m2", "under 70 sqm" -> maxArea=70.
  - Do NOT invent area numbers for qualitative words like "duże" or "small" (put those in "q").
- "minRooms" / "maxRooms": integer | null
  Total room count (pokoje).
  - Exact count ("2 pokoje", "2 rooms", "dwupokojowe") -> minRooms=2, maxRooms=2.
  - Studio / kawalerka -> minRooms=1, maxRooms=1, propertyType="apartment".
  - "przynajmniej 3 pokoje", "min 3 rooms" -> minRooms=3, maxRooms=null.
- "sellerType": "private" | "agency" | "developer" | null
  - "private": bez pośredników, bezpośrednio, private owner.
  - "agency": agencja, biuro nieruchomości, broker.
  - "developer": od dewelopera, rynek deweloperski.
- "marketType": "primary" | "secondary" | null
  - "primary": stan deweloperski, rynek pierwotny, new development.
  - "secondary": rynek wtórny, kamienica, previously owned.
- Boolean Amenities (true | false | null):
  - "hasElevator": winda / elevator / lift.
  - "hasBalcony": balkon / taras / loggia / balcony / terrace.
  - "hasParking": garaż / miejsce garażowe / parking space.
  - "hasAirConditioning": klimatyzacja / AC.
  - "isFurnished": umeblowane / furnished.
  - "hasBasement": piwnica / komórka lokatorska / storage room / basement.
- "sortBy": "newest" | "price_asc" | "price_desc" | "area_asc" | "area_desc" | "price_sqm_asc" | "price_sqm_desc" | null

### DISAMBIGUATION RULES:
1. Floor vs Rooms: "na 3 piętrze" / "3rd floor" -> floor=3 (do NOT set minRooms=3).
2. Price per sqm: "12k/m2" -> set sortBy="price_sqm_asc" or keep in "q" (do NOT set maxPrice=12000).
3. Missing Fields: Output null for unmentioned criteria. Never fabricate values.`;

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
      if (typeof parsed.minArea === 'number' && !isNaN(parsed.minArea)) result.minArea = parsed.minArea;
      if (typeof parsed.maxArea === 'number' && !isNaN(parsed.maxArea)) result.maxArea = parsed.maxArea;
      if (typeof parsed.minRooms === 'number' && !isNaN(parsed.minRooms)) result.minRooms = parsed.minRooms;
      if (typeof parsed.maxRooms === 'number' && !isNaN(parsed.maxRooms)) result.maxRooms = parsed.maxRooms;

      if (typeof parsed.hasElevator === 'boolean') result.hasElevator = parsed.hasElevator;
      if (typeof parsed.hasBalcony === 'boolean') result.hasBalcony = parsed.hasBalcony;
      if (typeof parsed.hasParking === 'boolean') result.hasParking = parsed.hasParking;
      if (typeof parsed.hasAirConditioning === 'boolean') result.hasAirConditioning = parsed.hasAirConditioning;
      if (typeof parsed.isFurnished === 'boolean') result.isFurnished = parsed.isFurnished;
      if (typeof parsed.hasBasement === 'boolean') result.hasBasement = parsed.hasBasement;

      const validPropertyTypes = ['apartment', 'house', 'land', 'commercial', 'garage', 'other'] as const;
      if (typeof parsed.propertyType === 'string' && (validPropertyTypes as readonly string[]).includes(parsed.propertyType)) {
        result.propertyType = parsed.propertyType as ListOffersQuery['propertyType'];
      }

      const validTransactionTypes = ['sale', 'rent'] as const;
      if (typeof parsed.transactionType === 'string' && (validTransactionTypes as readonly string[]).includes(parsed.transactionType)) {
        result.transactionType = parsed.transactionType as ListOffersQuery['transactionType'];
      }

      const validSellerTypes = ['private', 'company', 'agency', 'developer', 'verified'] as const;
      if (typeof parsed.sellerType === 'string' && (validSellerTypes as readonly string[]).includes(parsed.sellerType)) {
        result.sellerType = parsed.sellerType as ListOffersQuery['sellerType'];
      }

      const validMarketTypes = ['primary', 'secondary'] as const;
      if (typeof parsed.marketType === 'string' && (validMarketTypes as readonly string[]).includes(parsed.marketType)) {
        result.marketType = parsed.marketType as ListOffersQuery['marketType'];
      }

      const validSort = ['newest', 'price_asc', 'price_desc', 'area_asc', 'area_desc', 'price_sqm_asc', 'price_sqm_desc'] as const;
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
