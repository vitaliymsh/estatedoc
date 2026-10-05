import { describe, it, expect, vi } from 'vitest';
import { fetchListingsPage, fetchAllListings } from '../fetch-listings.js';

const mockHtmlPage1 = `
<ul class="list normal">
  <li id="offer-101"><article><h2 class="title"><a href="/item-101" class="offerLink">Mieszkanie 1</a></h2><span class="price">100 000 zł</span><strong class="city">Kraków</strong></article></li>
</ul>
`;

const mockHtmlPage2 = `
<ul class="list normal">
  <li id="offer-102"><article><h2 class="title"><a href="/item-102" class="offerLink">Mieszkanie 2</a></h2><span class="price">200 000 zł</span><strong class="city">Warszawa</strong></article></li>
</ul>
`;

describe('fetchListings', () => {
  it('fetches single page and parses listings', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockHtmlPage1,
    } as Response);

    const listings = await fetchListingsPage({ offset: 0, fetchFn: mockFetch });
    expect(listings).toHaveLength(1);
    expect(listings[0].externalId).toBe('101');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://sprzedajemy.pl/nieruchomosci?offset=0',
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it('paginates across multiple pages and stops when empty or maxPages reached', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, text: async () => mockHtmlPage1 } as Response)
      .mockResolvedValueOnce({ ok: true, text: async () => mockHtmlPage2 } as Response)
      .mockResolvedValueOnce({ ok: true, text: async () => '<div>empty</div>' } as Response);

    const listings = await fetchAllListings({
      maxPages: 3,
      delayMs: 0,
      fetchFn: mockFetch,
    });

    expect(listings).toHaveLength(2);
    expect(listings.map((l) => l.externalId)).toEqual(['101', '102']);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
