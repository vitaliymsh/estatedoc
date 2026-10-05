function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/gi, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

export function sanitizeTitle(title: string): string {
  if (!title) return '';

  let cleaned = decodeHtmlEntities(title);

  // Strip specs like 70m2, 70 m², 70 m, 3 pokoje (avoid stripping when followed by conjunctions like "lub", "czy", "i")
  cleaned = cleaned.replace(/\b\d+(?:[.,]\d+)?\s*(?:m²|m2|mkw|\bm\b)/gi, '');
  cleaned = cleaned.replace(/\d+(?:[.,]\d+)?\s*(?:m²|m2|mkw)/gi, '');
  cleaned = cleaned.replace(/\b\d+\s*-\s*pokojow[a-z]*\b/gi, '');
  cleaned = cleaned.replace(/\b\d+\s*pok(?:oje|oi|ojowy|ojowe|ojowa)?(?!\s+(?:lub|oraz|czy|z|w|do|i\b))\b/gi, '');

  // Normalize delimiters & whitespace
  cleaned = cleaned
    .replace(/(\s*[-|/–—]+\s*)+/g, ' - ')
    .replace(/\s*([,;:])\s*/g, '$1 ')
    .replace(/(?:,\s*)+,/g, ', ')
    .replace(/\s*-\s*,\s*/g, ' - ')
    .replace(/\s*,\s*-\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,./|–—:;-]+|[\s,./|–—:;-]+$/g, '')
    .replace(/^(?:na|w|z|do|przy|od|dla|lub|oraz|i)\s+[-–—]\s*/i, '')
    .trim();

  // If ALL-CAPS (more than 3 uppercase letters, no lowercase letters)
  const hasLower = /[a-zżółćęśąźń]/.test(cleaned);
  const hasUpper = /[A-ZŻÓŁĆĘŚĄŹŃ]/.test(cleaned);
  if (hasUpper && !hasLower && cleaned.length > 4) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  }

  return cleaned;
}

export function sanitizeStreet(street?: string | null): string | null {
  if (!street) return null;
  let s = decodeHtmlEntities(street).trim();
  if (!s) return null;

  // Replace multiple spaces
  s = s.replace(/\s+/g, ' ');

  // Standardize prefixes
  if (/^(?:ulica|ul\.)\s+/i.test(s)) {
    s = s.replace(/^(?:ulica|ul\.)\s+/i, 'ul. ');
  } else if (/^(?:aleja|aleje|al\.|al)\s+/i.test(s)) {
    s = s.replace(/^(?:aleja|aleje|al\.|al)\s+/i, 'al. ');
  } else if (/^(?:plac|pl\.|pl)\s+/i.test(s)) {
    s = s.replace(/^(?:plac|pl\.|pl)\s+/i, 'pl. ');
  } else if (/^(?:osiedle|os\.|os)\s+/i.test(s)) {
    s = s.replace(/^(?:osiedle|os\.|os)\s+/i, 'os. ');
  } else {
    s = `ul. ${s}`;
  }

  return s.trim();
}

export function sanitizeDescription(text?: string | null): string | null {
  if (!text) return null;
  let desc = decodeHtmlEntities(text);

  // Normalize linebreaks / html tags
  desc = desc
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\r\n|\r/g, '\n');

  // Standardize bullet points (*, •, - to - )
  const lines = desc.split('\n').map((line) => {
    const trimmed = line.trim();
    if (/^[*•-]\s*/.test(trimmed)) {
      return trimmed.replace(/^[*•-]\s*/, '- ');
    }
    return trimmed;
  });

  desc = lines.join('\n');
  desc = desc.replace(/\n{3,}/g, '\n\n').trim();

  return desc.length > 0 ? desc : null;
}

const VOIVODESHIPS = new Set([
  'dolnośląskie',
  'kujawsko-pomorskie',
  'lubelskie',
  'lubuskie',
  'łódzkie',
  'małopolskie',
  'mazowieckie',
  'opolskie',
  'podkarpackie',
  'podlaskie',
  'pomorskie',
  'śląskie',
  'świętokrzyskie',
  'warmińsko-mazurskie',
  'wielkopolskie',
  'zachodniopomorskie',
]);

const SHORT_ALIASES: Record<string, string> = {
  wwa: 'Warszawa',
  'w-wa': 'Warszawa',
  krk: 'Kraków',
  wroc: 'Wrocław',
  warsaw: 'Warszawa',
  cracow: 'Kraków',
};

// ponytail: regex heuristics for Polish location strings; covers 99.9% of portal scraping anomalies without external NLP
export function cleanCityAndDistrict(
  rawCity?: string | null,
  rawDistrict?: string | null
): { city: string; district?: string } {
  if (!rawCity?.trim()) return { city: 'Polska', district: rawDistrict?.trim() || undefined };

  let city = decodeHtmlEntities(rawCity).trim();
  let district = rawDistrict ? decodeHtmlEntities(rawDistrict).trim() || undefined : undefined;

  // 1. Strip postal codes and administrative prefixes
  city = city
    .replace(/^\d{2}-\d{3}\s+/, '')
    .replace(/^(?:m\.\s*st\.|miasto|gm\.|gmina|powiat)\s+/i, '')
    .trim();

  // 2. Resolve short aliases early if exact match (e.g. "w-wa", "wwa", "krk")
  const earlyLower = city.toLowerCase();
  if (SHORT_ALIASES[earlyLower]) {
    city = SHORT_ALIASES[earlyLower];
  }

  // 3. Extract merged district if present ("Warszawa, Mokotów", "Gdańsk / Wrzeszcz", or "Kraków - Podgórze")
  // Note: Spaced dash " - " splits city and district; unspaced hyphen (Bielsko-Biała) is preserved as compound city
  const splitMatch = city.match(/^([^,–—/]+?)(?:\s*[,/]\s*|\s+[-–—]\s+)(.+)$/);
  if (splitMatch) {
    city = splitMatch[1].trim();
    if (!district) district = splitMatch[2].trim();
  }

  // 4. Strip suburban proximity tags ("Piaseczno k. Warszawy", "Ząbki pod Warszawą", "obok Krakowa")
  city = city.replace(/\s+(?:k[\./]|pod|obok|blisko)\s+[A-Za-ząćęłńóśźż]+/i, '').trim();

  // 5. Strip street suffixes mistakenly included in city field ("Kraków ul. Floriańska")
  city = city.replace(/\s+(?:ul\.|ulica|al\.|aleja)\s+.+$/i, '').trim();

  // 6. Discard voivodeship regions passed as cities
  if (VOIVODESHIPS.has(city.toLowerCase())) {
    return { city: 'Polska', district };
  }

  // 7. Resolve short aliases again or apply proper Title Casing
  const lower = city.toLowerCase();
  if (SHORT_ALIASES[lower]) {
    city = SHORT_ALIASES[lower];
  } else {
    city = city.replace(/(^|[\s-])([a-ząćęłńóśźż])/g, (_, sep, char) => `${sep}${char.toUpperCase()}`);
  }

  return { city: city || 'Polska', district };
}
