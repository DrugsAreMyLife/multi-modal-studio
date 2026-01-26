// Token estimation (rough - use tiktoken for accuracy)
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token for English
  return Math.ceil(text.length / 4);
}

export interface ModelPricingInfo {
  input: number; // cents per 1K tokens or units
  output: number; // cents per 1K tokens or units
  quality: number; // 1-100 score
  category: 'text' | 'image' | 'video' | 'audio' | 'reasoning';
  description?: string;
}

// Cost per 1K tokens (or per unit) in cents
export const MODEL_PRICING: Record<string, ModelPricingInfo> = {
  // Text Models
  'gpt-4o': { input: 0.5, output: 1.5, quality: 95, category: 'text' },
  'gpt-4o-mini': {
    input: 0.015,
    output: 0.06,
    quality: 85,
    category: 'text',
    description: '85% quality for 3% of the cost',
  },
  'claude-3-5-sonnet': { input: 0.3, output: 1.5, quality: 96, category: 'text' },
  'claude-3-haiku': { input: 0.025, output: 0.125, quality: 80, category: 'text' },
  'gemini-1.5-pro': { input: 0.125, output: 0.375, quality: 92, category: 'text' },
  'gemini-1.5-flash': { input: 0.0075, output: 0.03, quality: 82, category: 'text' },
  'llama-3.1-70b': { input: 0.05, output: 0.05, quality: 88, category: 'text' },

  // Reasoning Models
  'o1-preview': { input: 1.5, output: 6.0, quality: 98, category: 'reasoning' },
  'deepseek-v3': { input: 0.2, output: 0.6, quality: 94, category: 'reasoning' },

  // Image Models (per image)
  'dall-e-3': { input: 4, output: 0, quality: 90, category: 'image' },
  'stable-diffusion-3': { input: 1, output: 0, quality: 88, category: 'image' },
  'flux-1-schnell': { input: 0.1, output: 0, quality: 85, category: 'image' },

  // Video Models (per second)
  'runway-gen3': { input: 5, output: 0, quality: 95, category: 'video' },
  'luma-dream-machine': { input: 3, output: 0, quality: 90, category: 'video' },
  'kling-video': { input: 1.5, output: 0, quality: 88, category: 'video' },

  // Audio (per 1K chars/secs)
  elevenlabs: { input: 3, output: 0, quality: 96, category: 'audio' },
  'openai-tts': { input: 1.5, output: 0, quality: 90, category: 'audio' },
};

export interface OptimizationResult {
  recommendedModelId: string;
  savingsPercent: number;
  qualityDrop: number;
  message: string;
}

/**
 * Finds a more cost-effective model in the same category
 */
export function findCostOptimization(currentModelId: string): OptimizationResult | null {
  const current = MODEL_PRICING[currentModelId];
  if (!current) return null;

  const currentAvgCost = (current.input + current.output) / 2;

  // Find models in same category that are cheaper but maintain decent quality
  const alternatives = Object.entries(MODEL_PRICING)
    .filter(([id, info]) => {
      if (id === currentModelId) return false;
      if (info.category !== current.category) return false;

      const altAvgCost = (info.input + info.output) / 2;
      return altAvgCost < currentAvgCost;
    })
    .sort((a, b) => b[1].quality - a[1].quality); // Best quality first

  if (alternatives.length === 0) return null;

  const [bestAltId, bestAltInfo] = alternatives[0];
  const altAvgCost = (bestAltInfo.input + bestAltInfo.output) / 2;
  const savingsPercent = Math.round((1 - altAvgCost / currentAvgCost) * 100);
  const qualityDrop = current.quality - bestAltInfo.quality;

  // Only recommend if savings are significant (>20%) or quality drop is small (<10 pts)
  if (savingsPercent > 20 || qualityDrop < 5) {
    return {
      recommendedModelId: bestAltId,
      savingsPercent,
      qualityDrop,
      message: `Switching to ${bestAltId} can save you ${savingsPercent}% with a minimal ${qualityDrop}% quality trade-off.`,
    };
  }

  return null;
}

export function calculateCost(modelId: string, tokensIn: number, tokensOut: number): number {
  const pricing = MODEL_PRICING[modelId] || { input: 0.1, output: 0.1 };
  return Math.round((tokensIn / 1000) * pricing.input + (tokensOut / 1000) * pricing.output);
}

export function formatCost(cents: number): string {
  if (cents < 1) return `<$0.01`;
  if (cents < 100) return `$${(cents / 100).toFixed(2)}`;
  return `$${(cents / 100).toFixed(2)}`;
}
