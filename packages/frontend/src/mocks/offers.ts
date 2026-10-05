import type { Offer } from '../types/offer'

export const SAMPLE_OFFERS: Offer[] = [
  {
    id: 1,
    portal: 'sprzedajemy',
    externalId: 'sp-68219412',
    url: 'https://sprzedajemy.pl/oferta-1',
    title: 'Nowoczesne 2-pokojowe mieszkanie po remoncie',
    price: '650000.00',
    areaSqm: '48.50',
    roomsCount: 2,
    city: 'Warszawa',
    description: 'Jasne mieszkanie w centrum z widokiem na park.',
    metadata: {
      buildingType: 'Kamienica',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    portal: 'sprzedajemy',
    externalId: 'sp-9418241',
    url: 'https://sprzedajemy.pl/oferta-2',
    title: 'Dom wolnostojący z dużym ogrodem',
    price: '1150000.00',
    areaSqm: '142.00',
    roomsCount: 5,
    city: 'Kraków',
    description: 'Przestronny dom z garażem.',
    metadata: {
      plotSqm: 520,
      buildingType: 'Dom wolnostojący',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]
