export type GenerationModality = 'text' | 'image' | 'video' | 'audio' | 'tts';

export interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  website: string;
  apiKeyEnvVar: string;
  supportedModalities: GenerationModality[];
  isConfigured: boolean;
  requiresApiKey: boolean;
}

export interface ProviderStatus {
  providerId: string;
  isConnected: boolean;
  lastChecked: number;
  error?: string;
}
