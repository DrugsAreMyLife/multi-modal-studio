import { ProviderConfig } from './types';

export const PROVIDER_REGISTRY: Record<string, ProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models, DALL-E, Whisper',
    website: 'https://openai.com',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    supportedModalities: ['text', 'image', 'audio', 'tts'],
    isConfigured: false,
    requiresApiKey: true,
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models',
    website: 'https://anthropic.com',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    supportedModalities: ['text'],
    isConfigured: false,
    requiresApiKey: true,
  },
  stability: {
    id: 'stability',
    name: 'Stability AI',
    description: 'Stable Diffusion, SDXL, Video',
    website: 'https://stability.ai',
    apiKeyEnvVar: 'STABILITY_API_KEY',
    supportedModalities: ['image', 'video'],
    isConfigured: false,
    requiresApiKey: true,
  },
  replicate: {
    id: 'replicate',
    name: 'Replicate',
    description: 'FLUX, various open models',
    website: 'https://replicate.com',
    apiKeyEnvVar: 'REPLICATE_API_TOKEN',
    supportedModalities: ['image', 'video', 'audio'],
    isConfigured: false,
    requiresApiKey: true,
  },
  elevenlabs: {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Premium TTS and voice cloning',
    website: 'https://elevenlabs.io',
    apiKeyEnvVar: 'ELEVENLABS_API_KEY',
    supportedModalities: ['tts', 'audio'],
    isConfigured: false,
    requiresApiKey: true,
  },
  runway: {
    id: 'runway',
    name: 'Runway',
    description: 'Gen-3 Alpha video generation',
    website: 'https://runway.ml',
    apiKeyEnvVar: 'RUNWAY_API_KEY',
    supportedModalities: ['video', 'image'],
    isConfigured: false,
    requiresApiKey: true,
  },
  luma: {
    id: 'luma',
    name: 'Luma AI',
    description: 'Dream Machine video',
    website: 'https://lumalabs.ai',
    apiKeyEnvVar: 'LUMA_API_KEY',
    supportedModalities: ['video'],
    isConfigured: false,
    requiresApiKey: true,
  },
  google: {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini, Imagen',
    website: 'https://ai.google',
    apiKeyEnvVar: 'GOOGLE_AI_API_KEY',
    supportedModalities: ['text', 'image'],
    isConfigured: false,
    requiresApiKey: true,
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast LLM inference',
    website: 'https://groq.com',
    apiKeyEnvVar: 'GROQ_API_KEY',
    supportedModalities: ['text'],
    isConfigured: false,
    requiresApiKey: true,
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek R1 reasoning',
    website: 'https://deepseek.com',
    apiKeyEnvVar: 'DEEPSEEK_API_KEY',
    supportedModalities: ['text'],
    isConfigured: false,
    requiresApiKey: true,
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Self-hosted models',
    website: 'https://ollama.ai',
    apiKeyEnvVar: '',
    supportedModalities: ['text'],
    isConfigured: true,
    requiresApiKey: false,
  },
};

export function getProviderById(id: string): ProviderConfig | undefined {
  return PROVIDER_REGISTRY[id];
}

export function getProvidersByModality(modality: string): ProviderConfig[] {
  return Object.values(PROVIDER_REGISTRY).filter((p) =>
    p.supportedModalities.includes(modality as any),
  );
}
