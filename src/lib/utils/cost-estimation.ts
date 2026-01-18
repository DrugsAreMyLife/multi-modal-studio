// Token estimation (rough - use tiktoken for accuracy)
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token for English
  return Math.ceil(text.length / 4);
}

// Cost per 1K tokens in cents
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4-turbo': { input: 1, output: 3 },
  'gpt-4o': { input: 0.5, output: 1.5 },
  'gpt-4o-mini': { input: 0.015, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.05, output: 0.15 },
  'claude-3-opus': { input: 1.5, output: 7.5 },
  'claude-3-sonnet': { input: 0.3, output: 1.5 },
  'claude-3-haiku': { input: 0.025, output: 0.125 },
  'gemini-pro': { input: 0.05, output: 0.15 },
  'gemini-1.5-pro': { input: 0.125, output: 0.375 },
  // Image models (per image)
  'dall-e-3': { input: 4, output: 0 }, // $0.04 per image
  'dall-e-2': { input: 2, output: 0 },
  'stable-diffusion-xl': { input: 0.2, output: 0 },
  // Video models (per second)
  'runway-gen3': { input: 5, output: 0 }, // $0.05 per second
  'luma-dream-machine': { input: 3, output: 0 },
  // Audio (per 1K chars)
  elevenlabs: { input: 3, output: 0 },
  'openai-tts': { input: 1.5, output: 0 },
};

export function calculateCost(modelId: string, tokensIn: number, tokensOut: number): number {
  const pricing = MODEL_PRICING[modelId] || { input: 0.1, output: 0.1 };
  return Math.round((tokensIn / 1000) * pricing.input + (tokensOut / 1000) * pricing.output);
}

export function formatCost(cents: number): string {
  if (cents < 1) return `<$0.01`;
  if (cents < 100) return `$${(cents / 100).toFixed(2)}`;
  return `$${(cents / 100).toFixed(2)}`;
}
