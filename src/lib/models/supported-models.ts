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
  | 'heart'
  | 'text-gen-webui'
  | 'qwen-tts';

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
  'qwen-tts': {
    label: 'Qwen3-TTS',
    baseUrl: 'http://localhost:8003',
    defaultPort: 8003,
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
  supportedFeatures?: string[]; // [NEW] List of UI features (e.g., 'draft_mode', 'audio_sync', 'storyboard')
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
    modelId: 'gpt-image-1.5',
    name: 'GPT-Image 1.5 (Design)',
    category: 'cloud',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    pricing: { inputPer1kTokens: 0.04, outputPer1kTokens: 0.08, currency: 'USD' },
    capabilities: { vision: true, functionCalling: true, jsonMode: true, streaming: true },
    supportedFeatures: ['controlled_design', 'text_precision', 'high_adherence'],
    tips: ['Unbeatable prompt adherence', 'Best for text-heavy graphics'],
  },
  {
    providerId: 'openai',
    modelId: 'sora-2',
    name: 'Sora 2 (Realism)',
    category: 'cloud',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    pricing: { inputPer1kTokens: 0.5, outputPer1kTokens: 1.0, currency: 'USD' },
    capabilities: { vision: true, functionCalling: false, jsonMode: false, streaming: false },
    supportedFeatures: [
      'audio_sync',
      '25s_duration',
      'storyboard',
      'character_cameos',
      'video_styles',
    ],
    tips: ['Gold standard for realism', 'Supports native synchronized audio'],
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
    modelId: 'claude-4.5-sonnet-20251215',
    name: 'Claude 4.5 Sonnet',
    category: 'cloud',
    contextWindow: 200000,
    maxOutputTokens: 16384,
    pricing: { inputPer1kTokens: 0.003, outputPer1kTokens: 0.015, currency: 'USD' },
    capabilities: { vision: true, functionCalling: true, jsonMode: true, streaming: true },
    tips: ['Best balanced model', 'Excellent at complex code generation'],
  },
  {
    providerId: 'anthropic',
    modelId: 'claude-4-5-haiku-20251015',
    name: 'Claude 4.5 Haiku',
    category: 'cloud',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    pricing: { inputPer1kTokens: 0.00025, outputPer1kTokens: 0.00125, currency: 'USD' },
    capabilities: { vision: true, functionCalling: true, jsonMode: true, streaming: true },
  },

  // Google
  {
    providerId: 'google',
    modelId: 'gemini-3-pro',
    name: 'Gemini 3 Pro',
    category: 'cloud',
    contextWindow: 2000000,
    maxOutputTokens: 16384,
    pricing: { inputPer1kTokens: 0.001, outputPer1kTokens: 0.003, currency: 'USD' },
    capabilities: { vision: true, functionCalling: true, jsonMode: true, streaming: true },
    tips: ['Massive context window (2M)', 'Great for analyzing full books/repos'],
  },
  {
    providerId: 'google',
    modelId: 'gemini-3-flash',
    name: 'Gemini 3 Flash',
    category: 'cloud',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    pricing: { inputPer1kTokens: 0.0001, outputPer1kTokens: 0.0004, currency: 'USD' },
    capabilities: { vision: true, functionCalling: true, jsonMode: true, streaming: true },
  },
  {
    providerId: 'google',
    modelId: 'veo-3.1',
    name: 'Veo 3.1 (Cinematic)',
    category: 'cloud',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    pricing: { inputPer1kTokens: 0.2, outputPer1kTokens: 0.4, currency: 'USD' },
    capabilities: { vision: true, functionCalling: false, jsonMode: false, streaming: false },
    supportedFeatures: ['ingredients_to_video', 'native_vertical', '4k_upscale', 'rich_audio'],
    tips: ['Best for cinematic dialogue', 'Supports up to 3 reference images'],
  },
  {
    providerId: 'google',
    modelId: 'gemini-3-pro-image',
    name: 'Gemini 3 Pro Image (Nano Banana)',
    category: 'cloud',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    pricing: { inputPer1kTokens: 0.005, outputPer1kTokens: 0.01, currency: 'USD' },
    capabilities: { vision: true, functionCalling: false, jsonMode: false, streaming: false },
    supportedFeatures: ['object_consistency', 'branding_precision'],
    tips: ['Extreme realism and object consistency'],
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
  {
    providerId: 'openai', // Using Midjourney via proxy in registry for completeness
    modelId: 'midjourney-7',
    name: 'Midjourney 7.0',
    category: 'cloud',
    contextWindow: 1,
    maxOutputTokens: 1,
    pricing: { inputPer1kTokens: 0, outputPer1kTokens: 0, currency: 'USD' },
    capabilities: { vision: true, functionCalling: false, jsonMode: false, streaming: false },
    supportedFeatures: [
      'draft_mode',
      'personalization',
      'omni_reference',
      'layer_editing',
      'niji_7_mode',
    ],
    tips: ['Unbeatable artistic quality', 'Draft mode is 10x faster'],
  },

  // Meta & Mistral
  {
    providerId: 'meta',
    modelId: 'llama-4.1-scout',
    name: 'Llama 4.1 Scout',
    category: 'cloud',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    pricing: { inputPer1kTokens: 0.0008, outputPer1kTokens: 0.0024, currency: 'USD' },
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
  {
    providerId: 'heart',
    modelId: 'heartmula-v3-pro',
    name: 'HeartMuLa v3 Pro (Local)',
    category: 'local',
    contextWindow: 1,
    maxOutputTokens: 1,
    pricing: { inputPer1kTokens: 0.0, outputPer1kTokens: 0.0, currency: 'USD' },
    capabilities: { vision: false, functionCalling: false, jsonMode: false, streaming: false },
    vramRequirement: '16GB',
    tips: ['Artist-style music generation', 'Requires local Heart Worker'],
  },

  // --- QWEN3-TTS (Voice Cloning, Custom Voice, Voice Design) ---
  {
    providerId: 'qwen-tts',
    modelId: 'qwen3-tts-1.7b-voice-clone',
    name: 'Qwen3-TTS Voice Clone (1.7B)',
    category: 'local',
    contextWindow: 1,
    maxOutputTokens: 1,
    pricing: { inputPer1kTokens: 0.0, outputPer1kTokens: 0.0, currency: 'USD' },
    capabilities: { vision: false, functionCalling: false, jsonMode: false, streaming: true },
    vramRequirement: '8GB',
    tips: [
      '3-second voice cloning from any audio sample',
      'Supports fine-tuning for custom voice training',
      '10 languages: EN, CN, JP, KO, DE, FR, RU, PT, ES, IT',
      '97ms first-packet latency (beats ElevenLabs)',
    ],
  },
  {
    providerId: 'qwen-tts',
    modelId: 'qwen3-tts-0.6b-voice-clone',
    name: 'Qwen3-TTS Voice Clone (0.6B)',
    category: 'local',
    contextWindow: 1,
    maxOutputTokens: 1,
    pricing: { inputPer1kTokens: 0.0, outputPer1kTokens: 0.0, currency: 'USD' },
    capabilities: { vision: false, functionCalling: false, jsonMode: false, streaming: true },
    vramRequirement: '4GB',
    tips: [
      'Lightweight voice cloning (reduced VRAM)',
      'Fast inference for prototyping',
      'Same 10 language support as 1.7B',
    ],
  },
  {
    providerId: 'qwen-tts',
    modelId: 'qwen3-tts-1.7b-custom-voice',
    name: 'Qwen3-TTS Custom Voice (1.7B)',
    category: 'local',
    contextWindow: 1,
    maxOutputTokens: 1,
    pricing: { inputPer1kTokens: 0.0, outputPer1kTokens: 0.0, currency: 'USD' },
    capabilities: { vision: false, functionCalling: false, jsonMode: false, streaming: true },
    vramRequirement: '8GB',
    tips: [
      '9 premium voice timbres with style control',
      'Instruction-based emotion/tone adjustment',
      'Voices: Vivian, Serena, Uncle Fu, Dylan, Eric, Ryan, Aiden, Ono Anna, Sohee',
    ],
  },
  {
    providerId: 'qwen-tts',
    modelId: 'qwen3-tts-0.6b-custom-voice',
    name: 'Qwen3-TTS Custom Voice (0.6B)',
    category: 'local',
    contextWindow: 1,
    maxOutputTokens: 1,
    pricing: { inputPer1kTokens: 0.0, outputPer1kTokens: 0.0, currency: 'USD' },
    capabilities: { vision: false, functionCalling: false, jsonMode: false, streaming: true },
    vramRequirement: '4GB',
    tips: [
      'Lightweight custom voices (reduced VRAM)',
      'Same 9 premium timbres as 1.7B',
      'Good for real-time applications',
    ],
  },
  {
    providerId: 'qwen-tts',
    modelId: 'qwen3-tts-1.7b-voice-design',
    name: 'Qwen3-TTS Voice Design (1.7B)',
    category: 'local',
    contextWindow: 1,
    maxOutputTokens: 1,
    pricing: { inputPer1kTokens: 0.0, outputPer1kTokens: 0.0, currency: 'USD' },
    capabilities: { vision: false, functionCalling: false, jsonMode: false, streaming: true },
    vramRequirement: '8GB',
    tips: [
      'Create entirely new voices from text descriptions',
      'Describe age, gender, accent, emotion, speaking style',
      'Example: "Male, 17 years old, tenor range, gaining confidence"',
    ],
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
