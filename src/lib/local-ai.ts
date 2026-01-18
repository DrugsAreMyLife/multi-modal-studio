import { ModelConfig, ModelProviderId } from './models/supported-models';

export interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  // Some providers allow extra metadata
  permission?: any[];
  root?: string;
  parent?: string;
}

export interface OpenAIModelListResponse {
  object: 'list';
  data: OpenAIModel[];
}

/**
 * Universal client for fetching models from any OpenAI-compatible local server
 * (LM Studio, LiteLM, llama.cpp, etc.)
 */
export class LocalAIClient {
  constructor(private baseUrl: string) {}

  /**
   * Fetch models from GET /v1/models
   */
  async getModels(providerId: ModelProviderId): Promise<ModelConfig[]> {
    try {
      // Handle trailing slashes or missing /v1
      const url = this.normalizeUrl(this.baseUrl);

      const res = await fetch(`${url}/models`);
      if (!res.ok) {
        throw new Error(`Failed to fetch models: ${res.statusText}`);
      }

      const data: OpenAIModelListResponse = await res.json();

      return data.data.map((m) => this.normalizeModel(m, providerId));
    } catch (error) {
      console.warn(`[LocalAI] Failed to fetch from ${this.baseUrl}:`, error);
      return [];
    }
  }

  private normalizeUrl(url: string): string {
    // Ensure it ends with /v1 or strictly follows the provider's spec
    // But most use /v1/models
    let normalized = url.replace(/\/$/, '');
    if (!normalized.endsWith('/v1')) {
      // Heuristic: If user typed 'localhost:1234', append /v1
      // If user typed 'localhost:1234/v1', keep it.
      // But some (LiteLM) might be at root.
      // Safe default for standard OpenAI compat is usually /v1.
      // However, the preset defines base URL fully. We trust the input mostly.
      // Let's assume the input IS the base API url (including /v1 if needed).
    }
    return normalized;
  }

  private normalizeModel(raw: OpenAIModel, providerId: ModelProviderId): ModelConfig {
    return {
      providerId,
      modelId: raw.id,
      name: raw.id.split('/').pop() || raw.id, // clean up paths if present
      category: 'local',
      contextWindow: 4096, // Conservative default
      maxOutputTokens: 2048,
      pricing: { inputPer1kTokens: 0, outputPer1kTokens: 0, currency: 'USD' },
      capabilities: {
        vision: raw.id.toLowerCase().includes('vision') || raw.id.toLowerCase().includes('llava'),
        functionCalling: false, // Hard to know dynamically
        jsonMode: true, // Most modern local models support this
        streaming: true,
      },
      tips: [`Loaded via ${providerId}`],
    };
  }
}
