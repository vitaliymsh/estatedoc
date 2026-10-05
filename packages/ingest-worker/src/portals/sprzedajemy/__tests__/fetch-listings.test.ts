import { describe, it, expect, vi } from 'vitest';
import { fetchListingsPage, fetchAllListings, fetchListingDetails } from '../fetch-listings.js';

const mockHtmlPage1 = `
<ul class="list normal">
  <li id="offer-101">
    <article>
      <h2 class="title"><a href="/item-101" class="offerLink">Mieszkanie 1</a></h2>
      <span class="price">100 000 zł</span>
      <strong class="city">Kraków</strong>
    </article>
  </li>
</ul>
`;

const mockHtmlPage2 = `
<ul class="list normal">
  <li id="offer-102">
    <article>
      <h2 class="title"><a href="/item-102" class="offerLink">Mieszkanie 2</a></h2>
      <span class="price">200 000 zł</span>
      <strong class="city">Warszawa</strong>
    </article>
  </li>
</ul>
`;

const mockDetailHtml = `
<div id="detailedInformations">
  <div class="attributes-box">
    <ul class="attribute-list">
      <li class="item"><span>Piętro</span><strong>2/4</strong></li>
    </ul>
  </div>
  <div class="offerDescription">
    <span>Pełny opis mieszkania na sprzedaż</span>
  </div>
  <img src="https://thumbs.img-sprzedajemy.pl/photo1.jpg" />
  <img src="https://thumbs.img-sprzedajemy.pl/photo2.jpg" />
</div>
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

  it('fetches listing details and enriches listing when enrichDetails is true', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, text: async () => mockHtmlPage1 } as Response)
      .mockResolvedValueOnce({ ok: true, text: async () => mockDetailHtml } as Response);

    const listings = await fetchAllListings({
      maxPages: 1,
      enrichDetails: true,
      delayMs: 0,
      fetchFn: mockFetch,
    });

    expect(listings).toHaveLength(1);
    expect(listings[0].description).toBe('Pełny opis mieszkania na sprzedaż');
    expect(listings[0].floor).toBe(2);
    expect(listings[0].totalFloors).toBe(4);
    expect(listings[0].images).toEqual([
      'https://thumbs.img-sprzedajemy.pl/photo1.jpg',
      'https://thumbs.img-sprzedajemy.pl/photo2.jpg',
    ]);
  });
});
