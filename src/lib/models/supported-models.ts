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
  | 'huggingface'
  | 'litelm'
  | 'lmstudio'
  | 'llamacpp'
  | 'kobold'
  | 'text-gen-webui';

export const LOCAL_PROVIDER_PRESETS = {
  ollama: { label: 'Ollama', baseUrl: 'http://localhost:11434', defaultPort: 11434 },
  lmstudio: { label: 'LM Studio', baseUrl: 'http://localhost:1234/v1', defaultPort: 1234 },
  litelm: { label: 'LiteLM', baseUrl: 'http://localhost:4000', defaultPort: 4000 },
  llamacpp: { label: 'llama.cpp', baseUrl: 'http://localhost:8080/v1', defaultPort: 8080 },
  kobold: { label: 'KoboldCpp', baseUrl: 'http://localhost:5001/v1', defaultPort: 5001 },
  'text-gen-webui': {
    label: 'TextGenWebUI',
    baseUrl: 'http://localhost:5000/v1',
    defaultPort: 5000,
  },
} as const;

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

export type ModelCategory = 'cloud' | 'local' | 'aggregator';

export interface ModelConfig {
  providerId: ModelProviderId;
  modelId: string;
  name: string;
  category: ModelCategory; // [NEW] Cloud vs Local vs Aggregator
  contextWindow: number;
  maxOutputTokens: number;
  pricing: ModelPricing;
  capabilities: ModelCapabilities;

  // [NEW] Advanced Metadata for Power Users
  tips?: string[];
  pullString?: string; // For Ollama (e.g., 'ollama pull deepseek-r1:70b')
  vramRequirement?: string; // VRAM requirement (e.g., '8GB', '16GB', '24GB')
  quantizations?: string[]; // Available quantization variants (e.g., ['Q2_K', 'Q4_K_M', 'Q6_K'])
  paramRanges?: {
    temperature?: [number, number]; // [min, max]
    topK?: [number, number];
  };
}

export const SUPPORTED_MODELS: ModelConfig[] = [
  // --- FRONTIER MODELS (2025/2026) ---
  // OpenAI
  {
    providerId: 'openai',
    modelId: 'gpt-5',
    name: 'GPT-5',
    category: 'cloud',
    contextWindow: 256000,
    maxOutputTokens: 32768,
    pricing: { inputPer1kTokens: 0.03, outputPer1kTokens: 0.06, currency: 'USD' },
    capabilities: { vision: true, functionCalling: true, jsonMode: true, streaming: true },
    tips: ['Best for complex reasoning', 'Use structured outputs for reliability'],
  },
  {
    providerId: 'openai',
    modelId: 'o3',
    name: 'o3 (Reasoning)',
    category: 'cloud',
    contextWindow: 200000,
    maxOutputTokens: 100000,
    pricing: { inputPer1kTokens: 0.15, outputPer1kTokens: 0.6, currency: 'USD' },
    capabilities: { vision: false, functionCalling: true, jsonMode: true, streaming: true },
    tips: ['Extremely expensive', 'Use only for verifiable math/code logic'],
  },
  {
    providerId: 'openai',
    modelId: 'gpt-4.5-turbo',
    name: 'GPT-4.5 Turbo',
    category: 'cloud',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    pricing: { inputPer1kTokens: 0.01, outputPer1kTokens: 0.03, currency: 'USD' },
    capabilities: { vision: true, functionCalling: true, jsonMode: true, streaming: true },
  },

  // Anthropic
  {
    providerId: 'anthropic',
    modelId: 'claude-opus-4.5',
    name: 'Claude 4.5 Opus',
    category: 'cloud',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    pricing: { inputPer1kTokens: 0.015, outputPer1kTokens: 0.075, currency: 'USD' },
    capabilities: { vision: true, functionCalling: true, jsonMode: true, streaming: true },
    tips: ['Highest nuance in creative writing', 'Avoid for simple classification tasks'],
  },
  {
    providerId: 'anthropic',
    modelId: 'claude-sonnet-4.5',
    name: 'Claude 4.5 Sonnet',
    category: 'cloud',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    pricing: { inputPer1kTokens: 0.003, outputPer1kTokens: 0.015, currency: 'USD' },
    capabilities: { vision: true, functionCalling: true, jsonMode: true, streaming: true },
    tips: ['Best daily driver', 'Excellent at code generation'],
  },

  // Google
  {
    providerId: 'google',
    modelId: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    category: 'cloud',
    contextWindow: 2000000,
    maxOutputTokens: 8192,
    pricing: { inputPer1kTokens: 0.00125, outputPer1kTokens: 0.005, currency: 'USD' },
    capabilities: { vision: true, functionCalling: true, jsonMode: true, streaming: true },
    tips: ['Massive context window (2M)', 'Great for analyzing full books/repos'],
  },
  {
    providerId: 'google',
    modelId: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    category: 'cloud',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    pricing: { inputPer1kTokens: 0.00015, outputPer1kTokens: 0.0006, currency: 'USD' },
    capabilities: { vision: true, functionCalling: true, jsonMode: true, streaming: true },
  },

  // DeepSeek
  {
    providerId: 'deepseek',
    modelId: 'deepseek-reasoner',
    name: 'DeepSeek R1',
    category: 'cloud',
    contextWindow: 64000,
    maxOutputTokens: 8000,
    pricing: { inputPer1kTokens: 0.00055, outputPer1kTokens: 0.0022, currency: 'USD' },
    capabilities: { vision: false, functionCalling: true, jsonMode: true, streaming: true },
    tips: ['Competitive with o3 at fraction of cost', 'Best "Thinker" model'],
  },
  {
    providerId: 'deepseek',
    modelId: 'deepseek-chat',
    name: 'DeepSeek V3.2',
    category: 'cloud',
    contextWindow: 64000,
    maxOutputTokens: 8000,
    pricing: { inputPer1kTokens: 0.00055, outputPer1kTokens: 0.0022, currency: 'USD' },
    capabilities: { vision: false, functionCalling: true, jsonMode: true, streaming: true },
  },

  // Meta & Mistral
  {
    providerId: 'meta',
    modelId: 'llama-4-scout',
    name: 'Llama 4 Scout',
    category: 'cloud',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    pricing: { inputPer1kTokens: 0.001, outputPer1kTokens: 0.003, currency: 'USD' },
    capabilities: { vision: false, functionCalling: true, jsonMode: true, streaming: true },
  },
  {
    providerId: 'mistral',
    modelId: 'mistral-large-latest',
    name: 'Mistral Large',
    category: 'cloud',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    pricing: { inputPer1kTokens: 0.002, outputPer1kTokens: 0.006, currency: 'USD' },
    capabilities: { vision: false, functionCalling: true, jsonMode: true, streaming: true },
  },

  // --- HIGH PERFORMANCE / SPEED ---
  {
    providerId: 'groq',
    modelId: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B (Groq)',
    category: 'aggregator',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    pricing: { inputPer1kTokens: 0.0, outputPer1kTokens: 0.0, currency: 'USD' },
    capabilities: { vision: false, functionCalling: true, jsonMode: true, streaming: true },
    tips: ['Extremely fast (300 t/s)', 'Good for real-time applications'],
  },
  {
    providerId: 'groq',
    modelId: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 70B (Groq)',
    category: 'aggregator',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    pricing: { inputPer1kTokens: 0.0, outputPer1kTokens: 0.0, currency: 'USD' },
    capabilities: { vision: false, functionCalling: true, jsonMode: true, streaming: true },
  },

  // --- LOCAL / SELF-HOSTED ---
  {
    providerId: 'ollama',
    modelId: 'deepseek-r1:70b',
    name: 'DeepSeek R1 70B (Local)',
    category: 'local',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    pricing: { inputPer1kTokens: 0.0, outputPer1kTokens: 0.0, currency: 'USD' },
    capabilities: { vision: false, functionCalling: true, jsonMode: true, streaming: true },
    pullString: 'deepseek-r1:70b',
    tips: ['Requires 48GB+ VRAM', 'Running on local GPU'],
  },
  {
    providerId: 'ollama',
    modelId: 'llama3.3:70b',
    name: 'Llama 3.3 70B (Local)',
    category: 'local',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    pricing: { inputPer1kTokens: 0.0, outputPer1kTokens: 0.0, currency: 'USD' },
    capabilities: { vision: false, functionCalling: true, jsonMode: true, streaming: true },
    pullString: 'llama3.3:70b',
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
    c.pricing !== null &&
    typeof c.pricing === 'object' &&
    c.capabilities !== null &&
    typeof c.capabilities === 'object'
  );
}

export function getModelById(modelId: string): ModelConfig | undefined {
  return SUPPORTED_MODELS.find((m) => m.modelId === modelId);
}
