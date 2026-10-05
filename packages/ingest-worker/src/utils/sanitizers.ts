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
