import type { LLMProvider, GenerateOptions } from './llm-provider.js';

export interface GeminiLLMProviderOptions {
  apiKey?: string;
  model?: string;
  fetchFn?: typeof fetch;
}

export class GeminiLLMProvider implements LLMProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly fetch: typeof fetch;

  constructor(options: GeminiLLMProviderOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.GEMINI_API_KEY ?? '';
    this.model = options.model ?? process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';
    this.fetch = options.fetchFn ?? globalThis.fetch;
  }

  async generate(prompt: string, options: GenerateOptions = {}): Promise<string | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const payload: Record<string, unknown> = {
        contents: [{ parts: [{ text: prompt }] }],
      };

      if (options.systemPrompt) {
        payload.systemInstruction = { parts: [{ text: options.systemPrompt }] };
      }

      if (options.responseMimeType) {
        payload.generationConfig = { responseMimeType: options.responseMimeType };
      }

      const response = await this.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    } catch {
      // ponytail: graceful error handling on API network failure
      return null;
    }
  }
}
