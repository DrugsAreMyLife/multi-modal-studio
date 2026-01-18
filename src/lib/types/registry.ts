export type ModelType = 'image' | 'video' | 'audio' | 'text';
export type ModelProvider = 'local' | 'cloud' | 'custom';

export interface ModelCapability {
  name: string; // e.g., "in-painting", "streaming", "emotion-control"
  value?: any;
}

export interface ModelDefinition {
  id: string;
  name: string;
  type: ModelType;
  provider: ModelProvider;
  description?: string;
  version?: string;
  capabilities: string[]; // List of capability keys like 'txt2img', 'inpainting'
  tags: string[]; // UI badges
  enabled: boolean;
}
