import { describe, it, expect } from 'vitest';
import { parseListPage } from '../parse-list-page.js';

const sampleHtml = `
<ul class="list normal">
  <li id="offer-73849568" class="odd li-highlighted">
    <article class="element">
      <ul>
        <li class="has photo">
          <a href="/lokal-134m2-warszawa-4-1b8e55-6fpbc4-nr73849568" class="picture offerLink">
            <span class="listImgWrp">
              <img src="https://thumbs.img-sprzedajemy.pl/350x250c/b4/38/78/lokal-134m2-warszawa-605845591.jpg" />
            </span>
          </a>
        </li>
        <li class="details">
          <div class="flex-grow">
            <h2 class="title">
              <a href="/lokal-134m2-warszawa-4-1b8e55-6fpbc4-nr73849568" class="offerLink">Lokal 134m2 Warszawa</a>
            </h2>
            <div class="pricing">
              <span class="price">10 700 zł</span>
            </div>
            <p class="attributes g1">
              <span class="attribute first"><span>Pow.: </span>134 m²</span>
            </p>
            <div class="seller-type-info seller-type-info--company">
              <span class="seller-type-info__label">FIRMA</span>
            </div>
          </div>
          <div class="offer-list-item-footer">
            <time class="time" datetime="2026-10-05 13:03:54">Dzisiaj 13:03</time>
            <div class="right-bottom">
              <div class="address">
                <a class="location" href="/warszawa/wola">
                  <strong class="city">Warszawa</strong>
                  <span class="precinct">Wola</span>
                </a>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </article>
  </li>
  <li id="offer-73975918" class="odd">
    <article class="element">
      <ul>
        <li class="details">
          <div class="flex-grow">
            <h2 class="title">
              <a href="/mieszkanie-sprzedam-marki-grazyny-nr73975918" class="offerLink">Mieszkanie 130m2</a>
            </h2>
            <div class="pricing">
              <span class="price">799 000 zł</span>
            </div>
            <p class="attributes g1">
              <span class="attribute"><span>Pow.: </span>130 m²</span>
              <span class="attribute"><span>Pokoje: </span>6</span>
            </p>
            <div class="seller-type-info seller-type-info--verified">
              <span class="seller-type-info__label">ZWERYFIKOWANA</span>
            </div>
          </div>
          <div class="offer-list-item-footer">
            <div class="address">
              <strong class="city">Marki</strong>
            </div>
          </div>
        </li>
      </ul>
    </article>
  </li>
  <li class="fk-offer-container">Ad banner</li>
</ul>
`;

describe('parseListPage', () => {
  it('extracts listings and skips ad containers', () => {
    const listings = parseListPage(sampleHtml);
    expect(listings).toHaveLength(2);

    expect(listings[0]).toEqual({
      portal: 'sprzedajemy',
      externalId: '73849568',
      url: 'https://sprzedajemy.pl/lokal-134m2-warszawa-4-1b8e55-6fpbc4-nr73849568',
      title: 'Lokal 134m2 Warszawa',
      price: 10700,
      areaSqm: 134,
      roomsCount: null,
      city: 'Warszawa',
      district: 'Wola',
      sellerType: 'company',
      imageUrl: 'https://thumbs.img-sprzedajemy.pl/350x250c/b4/38/78/lokal-134m2-warszawa-605845591.jpg',
      postedAt: '2026-10-05 13:03:54',
      metadata: {},
    });

    expect(listings[1].externalId).toBe('73975918');
    expect(listings[1].roomsCount).toBe(6);
    expect(listings[1].city).toBe('Marki');
    expect(listings[1].sellerType).toBe('verified');
  });

  it('returns empty array on empty or invalid html', () => {
    expect(parseListPage('')).toEqual([]);
    expect(parseListPage('<div>No listings</div>')).toEqual([]);
  });
});
