import { describe, it, expect, vi } from 'vitest';
import { enrichWithJev } from '../jev.js';

describe('enrichWithJev', () => {
  it('returns null when description is empty or missing', async () => {
    const result = await enrichWithJev({ title: 'Mieszkanie', description: '' });
    expect(result).toBeNull();
  });

  it('calls OpenRouter Jev decisions API and maps answers', async () => {
    const mockResponse = {
      answers: {
        building_type: { type: 'choice', choice: 'kamienica', confidence: 0.95 },
        market_type: { type: 'choice', choice: 'secondary', confidence: 0.9 },
        has_elevator: { type: 'noul', noul: 0.85 },
        has_balcony: { type: 'noul', noul: 0.1 },
        has_parking: { type: 'noul', noul: 0.9 },
        is_furnished: { type: 'noul', noul: 0.75 },
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await enrichWithJev(
      {
        title: 'Mieszkanie na Woli z windą i parkingiem',
        description: 'Piękna kamienica, winda, miejsce postojowe w cenie.',
      },
      { apiKey: 'sk-test-key', fetchFn: mockFetch as unknown as typeof fetch }
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/alpha/decisions');
    expect(init.headers.Authorization).toBe('Bearer sk-test-key');

    expect(result).toEqual({
      buildingType: 'kamienica',
      marketType: 'secondary',
      hasElevator: true,
      hasBalcony: false,
      hasParking: true,
      isFurnished: true,
    });
  });

  it('handles HTTP error gracefully without throwing', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await enrichWithJev(
      { title: 'Test', description: 'Opis' },
      { apiKey: 'sk-test-key', fetchFn: mockFetch as unknown as typeof fetch }
    );

    expect(result).toBeNull();
  });

  it('handles network throw gracefully without crashing', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const result = await enrichWithJev(
      { title: 'Test', description: 'Opis' },
      { apiKey: 'sk-test-key', fetchFn: mockFetch as unknown as typeof fetch }
    );

    expect(result).toBeNull();
  });
});
