import { describe, it, expect } from 'vitest';
import {
  normalizePropertyType,
  normalizeTransactionType,
  normalizeSellerType,
  normalizeSearchItem,
  enrichListingFromDetail,
} from '../normalizers.js';
import type { OtodomSearchItem, OtodomDetailAd } from '../types.js';

describe('otodom normalizers', () => {
  describe('normalizePropertyType', () => {
    it('maps flat/apartment types', () => {
      expect(normalizePropertyType('FLAT')).toBe('apartment');
      expect(normalizePropertyType('flat')).toBe('apartment');
      expect(normalizePropertyType('MIESZKANIE')).toBe('apartment');
    });

    it('maps house types', () => {
      expect(normalizePropertyType('HOUSE')).toBe('house');
      expect(normalizePropertyType('DOM')).toBe('house');
    });

    it('maps land types', () => {
      expect(normalizePropertyType('TERRAIN')).toBe('land');
      expect(normalizePropertyType('DZIALKA')).toBe('land');
    });

    it('maps commercial and garage', () => {
      expect(normalizePropertyType('COMMERCIAL')).toBe('commercial');
      expect(normalizePropertyType('GARAGE')).toBe('garage');
    });

    it('defaults to apartment when unknown or undefined', () => {
      expect(normalizePropertyType(undefined)).toBe('apartment');
      expect(normalizePropertyType('UNKNOWN')).toBe('apartment');
    });
  });

  describe('normalizeTransactionType', () => {
    it('maps SELL to sale and RENT to rent', () => {
      expect(normalizeTransactionType('SELL')).toBe('sale');
      expect(normalizeTransactionType('SPRZEDAZ')).toBe('sale');
      expect(normalizeTransactionType('RENT')).toBe('rent');
      expect(normalizeTransactionType('WYNAJEM')).toBe('rent');
    });

    it('defaults to sale for unknown or undefined', () => {
      expect(normalizeTransactionType(undefined)).toBe('sale');
    });
  });

  describe('normalizeSellerType', () => {
    it('returns private when isPrivateOwner is true', () => {
      expect(normalizeSellerType(true, undefined)).toBe('private');
    });

    it('returns agency when agency object is present', () => {
      expect(normalizeSellerType(false, { name: 'Metrohouse' })).toBe('agency');
    });

    it('defaults to company when not private and no agency', () => {
      expect(normalizeSellerType(false, undefined)).toBe('company');
    });
  });

  describe('normalizeSearchItem', () => {
    it('maps raw OtodomSearchItem to StandardListing', () => {
      const raw: OtodomSearchItem = {
        id: 68440183,
        title: 'Przestronne mieszkanie w nowym budownictwie!',
        slug: 'przestronne-mieszkanie-ID4DapW',
        estate: 'FLAT',
        transaction: 'SELL',
        totalPrice: { value: 674000, currency: 'PLN' },
        pricePerSquareMeter: { value: 11920.76, currency: 'PLN' },
        areaInSquareMeters: 56.54,
        roomsNumber: 'THREE',
        floorNumber: 'floor_2',
        isPrivateOwner: false,
        agency: { name: 'Freedom Nieruchomosci' },
        location: {
          address: {
            city: { name: 'Lublin' },
            street: { name: 'ul. Obrońców Lublina' },
            province: { name: 'lubelskie' },
          },
          reverseGeocoding: {
            locations: [
              { id: 'lubelskie', name: 'lubelskie', locationLevel: 'voivodeship' },
              { id: 'lublin', name: 'Lublin', locationLevel: 'city_or_village' },
              { id: 'kosminek', name: 'Kośminek', locationLevel: 'district' },
            ],
          },
        },
        images: [
          { large: 'https://img.cdn/img1.jpg', medium: 'https://img.cdn/med1.jpg' },
          { large: 'https://img.cdn/img2.jpg' },
        ],
        shortDescription: 'Świetna lokalizacja',
        createdAtFirst: '2026-09-01T10:00:00Z',
      };

      const listing = normalizeSearchItem(raw);

      expect(listing).toEqual({
        portal: 'otodom',
        externalId: '68440183',
        url: 'https://www.otodom.pl/pl/oferta/przestronne-mieszkanie-ID4DapW',
        title: 'Przestronne mieszkanie w nowym budownictwie!',
        price: 674000,
        pricePerSqm: 11920.76,
        areaSqm: 56.54,
        roomsCount: 3,
        floor: 2,
        totalFloors: null,
        transactionType: 'sale',
        propertyType: 'apartment',
        city: 'Lublin',
        district: 'Kośminek',
        street: 'ul. Obrońców Lublina',
        sellerType: 'agency',
        description: 'Świetna lokalizacja',
        images: ['https://img.cdn/img1.jpg', 'https://img.cdn/img2.jpg'],
        postedAt: '2026-09-01T10:00:00Z',
        metadata: {
          agencyName: 'Freedom Nieruchomosci',
          province: 'lubelskie',
          currency: 'PLN',
        },
      });
    });

    it('handles fallback defaults gracefully for missing fields', () => {
      const minimal: OtodomSearchItem = {
        id: 123,
        title: 'Simple flat',
        slug: 'simple-flat-123',
      };

      const listing = normalizeSearchItem(minimal);

      expect(listing.externalId).toBe('123');
      expect(listing.city).toBe('Polska');
      expect(listing.price).toBeNull();
      expect(listing.images).toEqual([]);
      expect(listing.propertyType).toBe('apartment');
      expect(listing.transactionType).toBe('sale');
    });
  });

  describe('enrichListingFromDetail', () => {
    it('enriches existing listing with details, coordinates, full description and extra metadata', () => {
      const initial = normalizeSearchItem({
        id: 68482096,
        title: 'Mieszkanie Pruszkow',
        slug: 'mieszkanie-pruszkow-ID4DljV',
      });

      const detail: OtodomDetailAd = {
        id: 68482096,
        title: 'Mieszkanie Pruszkow',
        description: '<p>Pełny opis lokalu z balkonem i windą.</p>',
        location: {
          coordinates: { latitude: 52.159, longitude: 20.794 },
        },
        characteristics: [
          { key: 'rent', value: '1450', localizedValue: '1450 zł' },
          { key: 'building_type', value: 'block' },
          { key: 'building_material', value: 'concrete_plate' },
          { key: 'heating', value: 'urban' },
        ],
        target: {
          Build_year: '1990',
          Building_floors_num: '8',
          Equipment_types: ['furniture', 'fridge'],
          Extras_types: ['garage', 'lift', 'balcony'],
        },
        images: [
          { large: 'https://img.cdn/detail1.jpg' },
          { large: 'https://img.cdn/detail2.jpg' },
        ],
      };

      const enriched = enrichListingFromDetail(initial, detail);

      expect(enriched.description).toBe('<p>Pełny opis lokalu z balkonem i windą.</p>');
      expect(enriched.totalFloors).toBe(8);
      expect(enriched.images).toEqual([
        'https://img.cdn/detail1.jpg',
        'https://img.cdn/detail2.jpg',
      ]);
      expect(enriched.metadata?.yearBuilt).toBe(1990);
      expect(enriched.metadata?.buildingType).toBe('block');
      expect(enriched.metadata?.buildingMaterial).toBe('concrete_plate');
      expect(enriched.metadata?.heating).toBe('urban');
      expect(enriched.metadata?.rentExtra).toBe(1450);
      expect(enriched.metadata?.hasElevator).toBe(true);
      expect(enriched.metadata?.hasBalcony).toBe(true);
      expect(enriched.metadata?.hasParking).toBe(true);
      expect(enriched.metadata?.latitude).toBe(52.159);
      expect(enriched.metadata?.longitude).toBe(20.794);
    });
  });
});
