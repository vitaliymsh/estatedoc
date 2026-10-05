import { describe, it, expect, vi } from 'vitest';
import { GeminiLLMProvider } from '../../src/services/llm/gemini-llm-provider.js';

describe('GeminiLLMProvider', () => {
  it('returns null when API key is missing', async () => {
    const provider = new GeminiLLMProvider({ apiKey: '' });
    const result = await provider.generate('hello');
    expect(result).toBeNull();
  });

  it('calls Gemini API with gemini-3.5-flash-lite by default and returns text', async () => {
    const mockApiResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: '{"city":"Warszawa"}' }],
          },
        },
      ],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const provider = new GeminiLLMProvider({
      apiKey: 'test-key',
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const result = await provider.generate('prompt', {
      systemPrompt: 'system instructions',
      responseMimeType: 'application/json',
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('gemini-3.5-flash-lite');
    expect(url).toContain('key=test-key');

    const body = JSON.parse(init.body);
    expect(body.systemInstruction.parts[0].text).toBe('system instructions');
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(result).toBe('{"city":"Warszawa"}');
  });

  it('returns null on API failure', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const provider = new GeminiLLMProvider({
      apiKey: 'test-key',
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const result = await provider.generate('prompt');
    expect(result).toBeNull();
  });
});
