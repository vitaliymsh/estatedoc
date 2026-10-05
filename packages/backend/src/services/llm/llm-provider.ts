export interface GenerateOptions {
  systemPrompt?: string;
  responseMimeType?: 'application/json' | 'text/plain';
}

export interface LLMProvider {
  generate(prompt: string, options?: GenerateOptions): Promise<string | null>;
}
