import { describe, it, expect, vi } from 'vitest';
import { LLMQueryParser } from '../../src/services/query-parser.js';
import type { LLMProvider } from '../../src/services/llm/llm-provider.js';

describe('LLMQueryParser', () => {
  it('returns empty object when prompt is whitespace', async () => {
    const mockProvider: LLMProvider = {
      generate: vi.fn(),
    };
    const parser = new LLMQueryParser(mockProvider);
    const result = await parser.parse('   ');
    expect(result).toEqual({});
    expect(mockProvider.generate).not.toHaveBeenCalled();
  });

  it('delegates to LLMProvider and parses structured JSON output', async () => {
    const mockProvider: LLMProvider = {
      generate: vi.fn().mockResolvedValue(
        JSON.stringify({
          city: 'Kraków',
          district: 'Krowodrza',
          minRooms: 3,
          maxRooms: 3,
          maxPrice: 600000,
          propertyType: 'apartment',
          transactionType: 'sale',
          sortBy: 'price_asc',
          q: 'balkon',
        })
      ),
    };

    const parser = new LLMQueryParser(mockProvider);
    const result = await parser.parse('3-pokojowe mieszkanie na sprzedaż z balkonem do 600k Kraków Krowodrza najtaniej');

    expect(mockProvider.generate).toHaveBeenCalledOnce();
    const [prompt, options] = (mockProvider.generate as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(prompt).toBe('3-pokojowe mieszkanie na sprzedaż z balkonem do 600k Kraków Krowodrza najtaniej');
    expect(options.responseMimeType).toBe('application/json');
    expect(options.systemPrompt).toContain('FIELD SPECIFICATIONS & UNITS');

    expect(result).toEqual({
      city: 'Kraków',
      district: 'Krowodrza',
      minRooms: 3,
      maxRooms: 3,
      maxPrice: 600000,
      propertyType: 'apartment',
      transactionType: 'sale',
      sortBy: 'price_asc',
      q: 'balkon',
    });
  });

  it('falls back to keyword q search when provider returns null or invalid JSON', async () => {
    const mockProvider: LLMProvider = {
      generate: vi.fn().mockResolvedValue(null),
    };

    const parser = new LLMQueryParser(mockProvider);
    const result = await parser.parse('mieszkanie Poznań');

    expect(result).toEqual({ q: 'mieszkanie Poznań' });
  });
});
