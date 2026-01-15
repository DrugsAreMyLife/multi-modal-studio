export type ModelProvider = 'local' | 'cloud';

export interface ModelCapabilities {
    supports_inpainting: boolean;
    supports_outpainting: boolean;
    supports_cfg: boolean;
    supports_steps: boolean;
    supports_negative_prompt: boolean;
    supports_streaming: boolean;
}

export interface GenerationModel {
    id: string;
    name: string;
    provider: ModelProvider;
    capabilities: ModelCapabilities;
}

export interface GenerationSettings {
    prompt: string;
    negativePrompt?: string;
    cfgScale?: number;
    steps?: number;
    width: number;
    height: number;
    stylePreset?: string;
    seed: number;
    scheduler: string;
    outputFormat: 'png' | 'webp' | 'jpg';
    refImage: string | null;
}

export interface ImageTunes {
    lighting: number; // -5 to 5 (Dark <-> Bright)
    contrast: number; // -5 to 5 (Soft <-> Hard)
    warmth: number;   // -5 to 5 (Cool <-> Warm)
    vibrance: number; // -5 to 5 (Muted <-> Vivid)
}

export interface ImageStudioState {
    selectedModelId: string;
    settings: GenerationSettings;
    tunes: ImageTunes;
    activeImageId: string | null;
    canvasTransform: { x: number; y: number; scale: number };
}
