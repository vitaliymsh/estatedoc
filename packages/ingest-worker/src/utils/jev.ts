import type { StandardListingMetadata } from '../types.js';

const JEV_URL = 'https://openrouter.ai/api/alpha/decisions';

export interface JevOptions {
  apiKey?: string;
  fetchFn?: typeof fetch;
}

export async function enrichWithJev(
  state: { title: string; description: string },
  options: JevOptions = {}
): Promise<Partial<StandardListingMetadata> | null> {
  const { apiKey = process.env.OPENROUTER_API_KEY, fetchFn = fetch } = options;
  if (!apiKey || !state.description?.trim()) return null;

  try {
    const res = await fetchFn(JEV_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'typesafe/jev-1.13',
        state,
        questions: {
          building_type: {
            type: 'choice',
            instructions: 'Jaki to typ budynku?',
            criteria: {
              kamienica: 'Przedwojenna kamienica',
              blok: 'Blok z wielkiej płyty lub nowszy',
              apartamentowiec: 'Nowoczesny apartamentowiec',
              dom: 'Dom wolnostojący lub segment',
              other: 'Inny lub brak informacji',
            },
          },
          market_type: {
            type: 'choice',
            instructions: 'Jaki to rynek?',
            criteria: {
              secondary: 'Rynek wtórny',
              primary: 'Rynek pierwotny / od dewelopera',
            },
          },
          has_elevator: {
            type: 'noul',
            instructions: 'Czy w budynku jest winda?',
            criteria: { true: 'Winda w budynku', false: 'Brak windy lub brak informacji' },
          },
          has_balcony: {
            type: 'noul',
            instructions: 'Czy mieszkanie ma balkon, taras lub loggię?',
            criteria: { true: 'Balkon, taras lub loggia', false: 'Brak balkonu' },
          },
          has_parking: {
            type: 'noul',
            instructions: 'Czy oferta zawiera miejsce postojowe lub garaż?',
            criteria: { true: 'Garaż lub miejsce postojowe', false: 'Brak parkingu' },
          },
          is_furnished: {
            type: 'noul',
            instructions: 'Czy mieszkanie jest umeblowane?',
            criteria: { true: 'Umeblowane', false: 'Nieumeblowane lub brak informacji' },
          },
        },
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      answers?: {
        building_type?: { choice?: string };
        market_type?: { choice?: string };
        has_elevator?: { noul?: number };
        has_balcony?: { noul?: number };
        has_parking?: { noul?: number };
        is_furnished?: { noul?: number };
      };
    };

    const answers = data.answers || {};
    return {
      buildingType:
        answers.building_type?.choice && answers.building_type.choice !== 'other'
          ? answers.building_type.choice
          : undefined,
      marketType: answers.market_type?.choice,
      hasElevator: (answers.has_elevator?.noul ?? 0) >= 0.6,
      hasBalcony: (answers.has_balcony?.noul ?? 0) >= 0.6,
      hasParking: (answers.has_parking?.noul ?? 0) >= 0.6,
      isFurnished: (answers.is_furnished?.noul ?? 0) >= 0.6,
    };
  } catch {
    // ponytail: silent fallback on network/API failure; return null
    return null;
  }
}
