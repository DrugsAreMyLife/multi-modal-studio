
export type ModelProviderId =
    | 'openai'
    | 'anthropic'
    | 'google'
    | 'xai'
    | 'deepseek'
    | 'groq'
    | 'openrouter'
    | 'ollama'
    | 'anthropic-vertex'
    | 'meta'
    | 'mistral'
    | 'together'
    | 'huggingface';

export interface ModelCapabilities {
    vision: boolean;
    functionCalling: boolean;
    jsonMode: boolean;
    streaming: boolean;
}

export interface ModelPricing {
    inputPer1kTokens: number;
    outputPer1kTokens: number;
    currency: 'USD';
}

export interface ModelConfig {
    providerId: ModelProviderId;
    modelId: string;
    name: string;
    contextWindow: number;
    maxOutputTokens: number;
    pricing: ModelPricing;
    capabilities: ModelCapabilities;
}

export const SUPPORTED_MODELS: ModelConfig[] = [
    // --- FRONTIER MODELS (2025/2026) ---
    // OpenAI
    {
        providerId: 'openai',
        modelId: 'gpt-5',
        name: 'GPT-5',
        contextWindow: 256000,
        maxOutputTokens: 32768,
        pricing: { inputPer1kTokens: 0.03, outputPer1kTokens: 0.06, currency: 'USD' },
        capabilities: { vision: true, functionCalling: true, jsonMode: true, streaming: true }
    },
    {
        providerId: 'openai',
        modelId: 'o3',
        name: 'o3 (Reasoning)',
        contextWindow: 200000,
        maxOutputTokens: 100000,
        pricing: { inputPer1kTokens: 0.15, outputPer1kTokens: 0.60, currency: 'USD' },
        capabilities: { vision: false, functionCalling: true, jsonMode: true, streaming: true }
    },
    {
        providerId: 'openai',
        modelId: 'gpt-4.5-turbo',
        name: 'GPT-4.5 Turbo',
        contextWindow: 128000,
        maxOutputTokens: 16384,
        pricing: { inputPer1kTokens: 0.01, outputPer1kTokens: 0.03, currency: 'USD' },
        capabilities: { vision: true, functionCalling: true, jsonMode: true, streaming: true }
    },

    // Anthropic
    {
        providerId: 'anthropic',
        modelId: 'claude-opus-4.5',
        name: 'Claude 4.5 Opus',
        contextWindow: 200000,
        maxOutputTokens: 4096,
        pricing: { inputPer1kTokens: 0.015, outputPer1kTokens: 0.075, currency: 'USD' },
        capabilities: { vision: true, functionCalling: true, jsonMode: true, streaming: true }
    },
    {
        providerId: 'anthropic',
        modelId: 'claude-sonnet-4.5',
        name: 'Claude 4.5 Sonnet',
        contextWindow: 200000,
        maxOutputTokens: 4096,
        pricing: { inputPer1kTokens: 0.003, outputPer1kTokens: 0.015, currency: 'USD' },
        capabilities: { vision: true, functionCalling: true, jsonMode: true, streaming: true }
    },

    // Google
    {
        providerId: 'google',
        modelId: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        contextWindow: 1000000,
        maxOutputTokens: 8192,
        pricing: { inputPer1kTokens: 0.00125, outputPer1kTokens: 0.005, currency: 'USD' },
        capabilities: { vision: true, functionCalling: true, jsonMode: true, streaming: true }
    },
    {
        providerId: 'google',
        modelId: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        contextWindow: 1000000,
        maxOutputTokens: 8192,
        pricing: { inputPer1kTokens: 0.00015, outputPer1kTokens: 0.0006, currency: 'USD' },
        capabilities: { vision: true, functionCalling: true, jsonMode: true, streaming: true }
    },

    // DeepSeek
    {
        providerId: 'deepseek',
        modelId: 'deepseek-reasoner',
        name: 'DeepSeek R1 (Reasoning)',
        contextWindow: 64000,
        maxOutputTokens: 8000,
        pricing: { inputPer1kTokens: 0.00055, outputPer1kTokens: 0.0022, currency: 'USD' },
        capabilities: { vision: false, functionCalling: true, jsonMode: true, streaming: true }
    },
    {
        providerId: 'deepseek',
        modelId: 'deepseek-chat',
        name: 'DeepSeek V3.2',
        contextWindow: 64000,
        maxOutputTokens: 8000,
        pricing: { inputPer1kTokens: 0.00055, outputPer1kTokens: 0.0022, currency: 'USD' },
        capabilities: { vision: false, functionCalling: true, jsonMode: true, streaming: true }
    },

    // Meta & Mistral
    {
        providerId: 'meta',
        modelId: 'llama-4-scout',
        name: 'Llama 4 Scout',
        contextWindow: 128000,
        maxOutputTokens: 4096,
        pricing: { inputPer1kTokens: 0.001, outputPer1kTokens: 0.003, currency: 'USD' },
        capabilities: { vision: false, functionCalling: true, jsonMode: true, streaming: true }
    },
    {
        providerId: 'mistral',
        modelId: 'mistral-large-latest',
        name: 'Mistral Large',
        contextWindow: 128000,
        maxOutputTokens: 8192,
        pricing: { inputPer1kTokens: 0.002, outputPer1kTokens: 0.006, currency: 'USD' },
        capabilities: { vision: false, functionCalling: true, jsonMode: true, streaming: true }
    },

    // --- HIGH PERFORMANCE / SPEED ---
    {
        providerId: 'groq',
        modelId: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B (Groq)',
        contextWindow: 128000,
        maxOutputTokens: 8192,
        pricing: { inputPer1kTokens: 0.0, outputPer1kTokens: 0.0, currency: 'USD' },
        capabilities: { vision: false, functionCalling: true, jsonMode: true, streaming: true }
    },
    {
        providerId: 'groq',
        modelId: 'deepseek-r1-distill-llama-70b',
        name: 'DeepSeek R1 70B (Groq)',
        contextWindow: 128000,
        maxOutputTokens: 8192,
        pricing: { inputPer1kTokens: 0.0, outputPer1kTokens: 0.0, currency: 'USD' },
        capabilities: { vision: false, functionCalling: true, jsonMode: true, streaming: true }
    },

    // --- LOCAL / SELF-HOSTED ---
    {
        providerId: 'ollama',
        modelId: 'deepseek-r1:70b',
        name: 'DeepSeek R1 70B (Local)',
        contextWindow: 128000,
        maxOutputTokens: 8192,
        pricing: { inputPer1kTokens: 0.0, outputPer1kTokens: 0.0, currency: 'USD' },
        capabilities: { vision: false, functionCalling: true, jsonMode: true, streaming: true }
    },
    {
        providerId: 'ollama',
        modelId: 'llama3.3:70b',
        name: 'Llama 3.3 70B (Local)',
        contextWindow: 128000,
        maxOutputTokens: 8192,
        pricing: { inputPer1kTokens: 0.0, outputPer1kTokens: 0.0, currency: 'USD' },
        capabilities: { vision: false, functionCalling: true, jsonMode: true, streaming: true }
    },
];

export function validateModelConfig(config: unknown): config is ModelConfig {
    if (!config || typeof config !== 'object') return false;
    const c = config as Record<string, unknown>;
    return (
        typeof c.providerId === 'string' &&
        typeof c.modelId === 'string' &&
        typeof c.name === 'string' &&
        typeof c.contextWindow === 'number' &&
        typeof c.maxOutputTokens === 'number' &&
        c.pricing !== null && typeof c.pricing === 'object' &&
        c.capabilities !== null && typeof c.capabilities === 'object'
    );
}

export function getModelById(modelId: string): ModelConfig | undefined {
    return SUPPORTED_MODELS.find(m => m.modelId === modelId);
}
