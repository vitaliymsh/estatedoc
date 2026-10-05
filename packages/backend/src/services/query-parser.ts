import type { ListOffersQuery } from '../schemas/offer.js';
import type { LLMProvider } from './llm/llm-provider.js';

export interface IQueryParser {
  parse(prompt: string): Promise<Partial<ListOffersQuery>>;
}

export const SYSTEM_PROMPT = `You are a real estate query understanding engine for a Polish property portal.
Your task is to parse unstructured user search prompts (in Polish, English, or mixed) into a precise JSON filter object.

### FIELD SPECIFICATIONS & UNITS:
- "q": null
  CRITICAL: Almost ALWAYS set "q" to null.
  - DO NOT extract words like "turnkey", "relokacja", "relocating", "work", "summer", "office", "comfortable", "fresh air", "access".
  - DO NOT extract any English translation words into "q".
  - ONLY set "q" if user specifically typed an exact street name or landmark name (e.g. "ul. Marszałkowska", "obok Portu Praskiego"). Otherwise ALWAYS output "q": null.
- "city": string | null
  City name normalized to official Polish nominative case (e.g. "Warsaw" -> "Warszawa", "w Krakowie" -> "Kraków", "Wrocławiu" -> "Wrocław").
- "district": string | null
  Sub-city neighborhood or administrative district (e.g. "Mokotów", "Śródmieście", "Jeżyce", "Przymorze").
- "propertyType": "apartment" | "house" | "land" | "commercial" | "garage" | "other" | null
  - "apartment": flats, apartments, studios, kawalerki, lofts, penthouses, mieszkania, lokale mieszkalne.
  - "house": detached houses, semi-detached (bliźniak), terraced (szeregowiec), villas, domy, segmenty.
  - "land": building plots, agricultural land, działki budowlane/rekreacyjne/grunty.
  - "commercial": offices, retail spaces, warehouses, lokale użytkowe/handlowe/biura.
  - "garage": parking spaces, underground spots, garaże, miejsca postojowe.
- "transactionType": "sale" | "rent" | null
  - "sale": purchase, for sale, na sprzedaż, kupno, kupię.
  - "rent": rental, to let, wynajem, najem, do wynajęcia, wynajmę.
- "minPrice" / "maxPrice": number (integer in PLN) | null
  Total property transaction price in Polish Złoty.
  - Multipliers: "k" / "tys" = 1,000; "mln" / "milion" = 1,000,000 (e.g. "800k" -> 800000, "1.5 mln" -> 1500000).
  - Upper limit ("do 600k", "under 600k", "max 600000", "do 2 mln") -> set maxPrice.
  - Lower limit ("od 300k", "at least 300k", "min 300000") -> set minPrice.
  - Price ranges ("400k - 600k") -> set minPrice=400000, maxPrice=600000.
- "minArea" / "maxArea": number (float/int in m²) | null
  Usable floor living area in square meters (m², m2, sqm, metrów, metry, or size notation like "40m").
  - Exact/limits: "od 50m2" -> minArea=50; "do 70m" -> maxArea=70.
  - Area ranges ("40-60m", "40 do 60 m2") -> minArea=40, maxArea=60.
  - Approximate size ("around 40m", "ok. 50 m2", "blisko 60m", "~45m"): set tolerance range ±10-15% (e.g. "around 40m" -> minArea=35, maxArea=45).
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
  - "cheap", "tani", "najtańsze", "niedrogie", "affordable", "low price" -> "price_asc".
  - "expensive", "drogie", "najdroższe", "luxury" -> "price_desc".
  - "largest", "największe", "duże" -> "area_desc".
  - "smallest", "najmniejsze" -> "area_asc".
  - "cheapest per sqm", "najtaniej za metr" -> "price_sqm_asc".

### DISAMBIGUATION & EXTRACTION RULES:
1. Metric "m" Disambiguation: "m" when referring to area or property size ("40m", "mieszkanie 50m", "ok. 45m") represents square meters (minArea/maxArea). Only treat "m" as million when accompanied by price/currency context (e.g. "1.5m PLN", "do 2m zł").
2. Priority Implied / Lifestyle Intent Mapping:
   - "my car" / "vehicle" / "driving" / "parking" -> hasParking=true.
   - "lots of stuff" / "lots of gear" / "sports gear" / "store bikes" / "extra storage" / "tenant locker" -> hasBasement=true.
   - "direct owner deal" / "no agent" / "no agency fee" / "directly" / "bez prowizji" -> sellerType="private".
   - "hot summer" / "warm days" / "cooling" / "climate control" -> hasAirConditioning=true.
   - "scared of heights / high floors" / "low floor" / "ground floor" -> maxFloor=3.
   - "living alone" / "single" -> minRooms=1 (or do not restrict if propertyType=apartment is set).
   - "work from home" / "home office" -> if no rooms specified, suggest minRooms=2 (or do not filter if strict rooms given).
   - "ready to move in" / "turnkey" -> isFurnished=true.
   - "sit outside" / "fresh air" / "outdoor space" -> hasBalcony=true.
   - "money not problem" / "luxury" / "no budget limit" -> sortBy="price_desc".
   - "budget" / "cheap" / "affordable" -> sortBy="price_asc".
3. Strict "q" Keyword Policy:
   - Never put generic conversational reasons ("work from home", "living alone", "fast internet", "summer", "alone", "car", "stuff", "gear", "sports gear", "direct deal", "fresh air") into "q".
   - Never use "q" for amenities or features already handled by boolean filters (balcony, ac, elevator, parking, basement).
   - "q" must ONLY contain specific named entities (e.g. street names, specific landmarks like "Port Praski", building materials like "kamienica", "cegła", "loft") when explicitly mentioned.
   - If in doubt, set "q": null to prevent over-filtering.
4. Filter Out Subjective & Filler Words: Drop generic conversational greetings/requests ("I want", "szukam", "proszę") and subjective quality descriptors ("nice", "ładne", "dobre", "super", "piękne"). Do not put them in "q".
5. Relative Price Terms: Map "cheap" / "tani" to sortBy="price_asc" and "expensive" to sortBy="price_desc" rather than putting them in "q".
6. Floor vs Rooms: "na 3 piętrze" / "3rd floor" -> floor=3 / maxFloor=3 (do NOT set minRooms=3).
7. Price per sqm: "12k/m2" -> set sortBy="price_sqm_asc" or keep in "q" (do NOT set maxPrice=12000).
8. Missing Fields: Output null for unmentioned criteria. Never fabricate values.`;

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

      for (const k of ['q', 'city', 'district'] as const) {
        if (typeof parsed[k] === 'string' && (parsed[k] as string).trim()) result[k] = (parsed[k] as string).trim();
      }
      for (const k of ['minPrice', 'maxPrice', 'minArea', 'maxArea', 'minRooms', 'maxRooms', 'minFloor', 'maxFloor'] as const) {
        if (typeof parsed[k] === 'number' && !Number.isNaN(parsed[k])) result[k] = parsed[k] as number;
      }
      for (const k of ['hasElevator', 'hasBalcony', 'hasParking', 'hasAirConditioning', 'isFurnished', 'hasBasement'] as const) {
        if (typeof parsed[k] === 'boolean') result[k] = parsed[k] as boolean;
      }

      const enums = {
        propertyType: ['apartment', 'house', 'land', 'commercial', 'garage', 'other'],
        transactionType: ['sale', 'rent'],
        sellerType: ['private', 'company', 'agency', 'developer', 'verified'],
        marketType: ['primary', 'secondary'],
        sortBy: ['newest', 'price_asc', 'price_desc', 'area_asc', 'area_desc', 'price_sqm_asc', 'price_sqm_desc'],
      } as const;

      for (const [k, valid] of Object.entries(enums)) {
        if (typeof parsed[k] === 'string' && (valid as readonly string[]).includes(parsed[k] as string)) {
          (result as Record<string, unknown>)[k] = parsed[k];
        }
      }

      return Object.keys(result).length > 0 ? result : { q: trimmed };
    } catch {
      // ponytail: graceful degradation on parse or provider error to keyword search
      return { q: trimmed };
    }
  }
}
