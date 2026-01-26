/**
 * Generation Models Registry
 *
 * Complete metadata for all image, video, audio, and icon generation models.
 * Used by UI components to dynamically render appropriate parameter controls.
 *
 * Sources: See /docs/API_SOURCES_LOG.md for documentation links
 */

export type GenerationType = 'image' | 'video' | 'audio' | 'icon';
export type ProviderType = 'cloud' | 'local';

export interface ParameterDefinition {
  type: 'number' | 'string' | 'boolean' | 'select' | 'slider' | 'image' | 'images';
  label: string;
  description?: string;
  required?: boolean;
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  maxItems?: number; // For image arrays
}

export interface GenerationModel {
  id: string;
  name: string;
  provider: string;
  type: GenerationType;
  providerType: ProviderType;
  description: string;
  docsUrl?: string;

  // Legacy ID aliases for backward compatibility
  aliases?: string[];

  // Capabilities
  capabilities: {
    textToMedia: boolean;
    imageToMedia?: boolean;
    videoToVideo?: boolean;
    remix?: boolean;
    upscale?: boolean;
    audio?: boolean;
    characterReference?: boolean;
    styleReference?: boolean;
    // Audio-specific capabilities
    voiceCloning?: boolean;
    realTimeStreaming?: boolean;
    fullDuplex?: boolean;
  };

  // Parameters the UI should expose
  parameters: Record<string, ParameterDefinition>;

  // Constraints
  constraints?: {
    maxPromptLength?: number;
    supportedFormats?: string[];
    maxFileSize?: string;
  };

  // Pricing (per generation or per second)
  pricing?: {
    perGeneration?: number;
    perSecond?: number;
    currency: 'USD';
  };

  // Hardware requirements for local models
  hardware?: {
    vramRequired: string;
    port: number;
  };
}

// ============================================================================
// VIDEO GENERATION MODELS
// ============================================================================

export const VIDEO_MODELS: GenerationModel[] = [
  {
    id: 'sora-2',
    name: 'Sora 2',
    provider: 'openai',
    type: 'video',
    providerType: 'cloud',
    description: 'OpenAI flagship video model with native audio generation',
    docsUrl: 'https://platform.openai.com/docs/api-reference/videos',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
      remix: true,
      audio: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        description: 'Describe the video you want to generate',
        required: true,
      },
      duration: {
        type: 'select',
        label: 'Duration',
        description: 'Video length in seconds (up to 25s for Pro)',
        default: '15',
        options: [
          { value: '15', label: '15 seconds' },
          { value: '25', label: '25 seconds (Pro Studio)' },
        ],
      },
      resolution: {
        type: 'select',
        label: 'Resolution',
        default: '1280x720',
        options: [
          { value: '1280x720', label: '1280x720 (Landscape)' },
          { value: '720x1280', label: '720x1280 (Portrait)' },
          { value: '1024x1024', label: '1024x1024 (Square)' },
          { value: '1920x1080', label: '1920x1080 (Full HD)' },
        ],
      },
      audio_sync: {
        type: 'boolean',
        label: 'Audio Sync',
        description: 'Generate synchronized dialogue and sound effects',
        default: true,
      },
      storyboard_mode: {
        type: 'boolean',
        label: 'Storyboard Mode',
        description: 'Generate second-by-second sketches first',
        default: false,
      },
      video_style: {
        type: 'select',
        label: 'Video Style',
        default: 'cinematic',
        options: [
          { value: 'cinematic', label: 'Cinematic' },
          { value: 'vintage', label: 'Vintage' },
          { value: 'comic', label: 'Comic' },
          { value: 'news', label: 'News' },
          { value: 'musical', label: 'Musical' },
          { value: 'selfie', label: 'Selfie' },
        ],
      },
      character_cameos: {
        type: 'images',
        label: 'Character Cameos',
        description: 'Insert and reuse specific characters',
        maxItems: 5,
      },
    },
    constraints: {
      maxPromptLength: 4000,
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    },
  },
  {
    id: 'veo-3.1',
    name: 'Veo 3.1 Pro',
    provider: 'google',
    type: 'video',
    providerType: 'cloud',
    description: 'Google flagship with 4K output and multi-image ingredients',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
      audio: true,
      upscale: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      ingredients: {
        type: 'images',
        label: 'Ingredients (Reference Images)',
        description: 'Use up to 3 images to guide composition or maintain subject',
        maxItems: 3,
      },
      duration: {
        type: 'select',
        label: 'Duration',
        default: '8',
        options: [
          { value: '4', label: '4 seconds' },
          { value: '6', label: '6 seconds' },
          { value: '8', label: '8 seconds' },
        ],
      },
      aspectRatio: {
        type: 'select',
        label: 'Aspect Ratio',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9 (Landscape)' },
          { value: '9:16', label: '9:16 (Portrait)' },
          { value: '1:1', label: '1:1 (Square)' },
        ],
      },
      upscale: {
        type: 'select',
        label: 'Quality / Upscale',
        default: '1080p',
        options: [
          { value: '1080p', label: '1080p (Standard)' },
          { value: '4k', label: '4K (Hyper-Real)' },
        ],
      },
      rich_audio: {
        type: 'boolean',
        label: 'Rich Audio',
        description: 'Generate ambient noise and contextual dialogue',
        default: true,
      },
    },
  },
  {
    id: 'kling-2.6',
    name: 'Kling 2.6 Pro',
    provider: 'kling',
    type: 'video',
    providerType: 'cloud',
    description: 'Kuaishou video model with native audio and camera controls',
    docsUrl: 'https://klingai.com/global/dev/model/video',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
      audio: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negative_prompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      duration: {
        type: 'select',
        label: 'Duration',
        default: '5',
        options: [
          { value: '5', label: '5 seconds' },
          { value: '10', label: '10 seconds' },
        ],
      },
      cfg_scale: {
        type: 'slider',
        label: 'CFG Scale',
        min: 0,
        max: 1,
        step: 0.1,
        default: 0.5,
      },
      resolution: {
        type: 'select',
        label: 'Resolution',
        default: '1920x1080',
        options: [
          { value: '1920x1080', label: '1920x1080 (1080p)' },
          { value: '1080x1920', label: '1080x1920 (Portrait 1080p)' },
          { value: '1080x1080', label: '1080x1080 (Square 1080p)' },
        ],
      },
      enable_audio: {
        type: 'boolean',
        label: 'Enable Audio',
        description: 'Generate native audio (2x price)',
        default: false,
      },
      camera_horizontal: {
        type: 'slider',
        label: 'Camera Horizontal',
        min: -1,
        max: 1,
        step: 0.1,
        default: 0,
      },
      camera_vertical: {
        type: 'slider',
        label: 'Camera Vertical',
        min: -1,
        max: 1,
        step: 0.1,
        default: 0,
      },
      camera_zoom: {
        type: 'slider',
        label: 'Camera Zoom',
        min: -1,
        max: 1,
        step: 0.1,
        default: 0,
      },
    },
    constraints: {
      maxPromptLength: 2500,
    },
  },
  {
    id: 'pika-2.2',
    name: 'Pika 2.2',
    provider: 'pika',
    type: 'video',
    providerType: 'cloud',
    description: 'Pika Labs video with keyframe interpolation',
    docsUrl: 'https://fal.ai/models/fal-ai/pika/v2.2/text-to-video',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negativePrompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      resolution: {
        type: 'select',
        label: 'Resolution',
        default: '720p',
        options: [
          { value: '720p', label: '720p ($0.20/5s)' },
          { value: '1080p', label: '1080p ($0.45/5s)' },
        ],
      },
      length: {
        type: 'slider',
        label: 'Duration (seconds)',
        min: 5,
        max: 10,
        step: 1,
        default: 5,
      },
      aspectRatio: {
        type: 'select',
        label: 'Aspect Ratio',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '1:1', label: '1:1' },
        ],
      },
      guidanceScale: {
        type: 'slider',
        label: 'Guidance Scale',
        min: 1,
        max: 20,
        step: 0.5,
        default: 7.5,
      },
      motion: {
        type: 'slider',
        label: 'Motion Amount',
        min: 0,
        max: 1,
        step: 0.1,
        default: 0.5,
      },
      seed: {
        type: 'number',
        label: 'Seed',
      },
    },
    pricing: {
      perGeneration: 0.2,
      currency: 'USD',
    },
  },
  {
    id: 'runway-gen4',
    name: 'Runway Gen-4 Turbo',
    provider: 'runway',
    type: 'video',
    providerType: 'cloud',
    description: 'Runway video with character/location consistency',
    docsUrl: 'https://docs.dev.runwayml.com/',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
      videoToVideo: true,
      upscale: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      resolution: {
        type: 'select',
        label: 'Resolution',
        default: '1280:720',
        options: [
          { value: '1280:720', label: '1280x720' },
          { value: '720:1280', label: '720x1280' },
          { value: '960:960', label: '960x960' },
          { value: '1104:832', label: '1104x832' },
          { value: '832:1104', label: '832x1104' },
        ],
      },
    },
    pricing: {
      perGeneration: 0.05,
      currency: 'USD',
    },
  },
  {
    id: 'luma-ray3',
    name: 'Luma Ray3',
    provider: 'luma',
    type: 'video',
    providerType: 'cloud',
    description: 'State-of-the-art realism with physics simulation',
    docsUrl: 'https://docs.lumalabs.ai/docs/api',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
      upscale: true,
      audio: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      aspect_ratio: {
        type: 'select',
        label: 'Aspect Ratio',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '1:1', label: '1:1' },
          { value: '4:3', label: '4:3' },
          { value: '3:4', label: '3:4' },
        ],
      },
      resolution: {
        type: 'select',
        label: 'Resolution',
        default: '1080p',
        options: [
          { value: '720p', label: '720p' },
          { value: '1080p', label: '1080p' },
          { value: '4k', label: '4K (upscaled)' },
        ],
      },
    },
  },
  {
    id: 'haiper-2.5',
    name: 'Haiper 2.5',
    provider: 'haiper',
    type: 'video',
    providerType: 'cloud',
    description: 'Flexible video with multiple generation modes',
    docsUrl: 'https://docs.haiper.ai/',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negative_prompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      duration: {
        type: 'select',
        label: 'Duration',
        default: '6',
        options: [
          { value: '4', label: '4 seconds' },
          { value: '6', label: '6 seconds' },
        ],
      },
      aspect_ratio: {
        type: 'select',
        label: 'Aspect Ratio',
        default: '16:9',
        options: [
          { value: '21:9', label: '21:9 (Cinematic)' },
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '4:3', label: '4:3' },
          { value: '3:4', label: '3:4' },
          { value: '1:1', label: '1:1' },
        ],
      },
      gen_mode: {
        type: 'select',
        label: 'Generation Mode',
        default: 'enhanced',
        options: [
          { value: 'standard', label: 'Standard (High Fidelity)' },
          { value: 'smooth', label: 'Smooth (Extensive Motion)' },
          { value: 'enhanced', label: 'Enhanced (Both)' },
        ],
      },
      is_enable_prompt_enhancer: {
        type: 'boolean',
        label: 'AI Prompt Enhancement',
        default: true,
      },
      seed: {
        type: 'number',
        label: 'Seed',
        default: -1,
      },
    },
    pricing: {
      perSecond: 0.05,
      currency: 'USD',
    },
  },
  {
    id: 'hunyuan-video',
    name: 'Hunyuan Video',
    provider: 'local',
    type: 'video',
    providerType: 'local',
    description: 'Tencent flagship local video model',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negative_prompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      num_frames: {
        type: 'slider',
        label: 'Frames',
        min: 16,
        max: 64,
        step: 8,
        default: 32,
      },
      guidance_scale: {
        type: 'slider',
        label: 'Guidance Scale',
        min: 1,
        max: 15,
        step: 0.5,
        default: 7.5,
      },
    },
    hardware: {
      vramRequired: '24GB',
      port: 8007,
    },
  },
  // Additional Video Models
  {
    id: 'runway-gen3-alpha',
    name: 'Runway Gen-3 Alpha',
    provider: 'runway',
    type: 'video',
    providerType: 'cloud',
    description: 'Runway earlier generation model',
    aliases: ['runway-gen-3-alpha'],
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      duration: {
        type: 'select',
        label: 'Duration',
        default: '5',
        options: [
          { value: '5', label: '5 seconds' },
          { value: '10', label: '10 seconds' },
        ],
      },
      resolution: {
        type: 'select',
        label: 'Resolution',
        default: '1280:720',
        options: [
          { value: '1280:720', label: '1280x720' },
          { value: '720:1280', label: '720x1280' },
          { value: '960:960', label: '960x960' },
        ],
      },
    },
  },
  {
    id: 'luma-ray2',
    name: 'Luma Ray2',
    provider: 'luma',
    type: 'video',
    providerType: 'cloud',
    description: 'Luma Labs earlier video model',
    aliases: ['luma-ray-2'],
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      aspect_ratio: {
        type: 'select',
        label: 'Aspect Ratio',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '1:1', label: '1:1' },
        ],
      },
      resolution: {
        type: 'select',
        label: 'Resolution',
        default: '720p',
        options: [
          { value: '720p', label: '720p' },
          { value: '1080p', label: '1080p' },
        ],
      },
    },
  },
  {
    id: 'kling-2.5',
    name: 'Kling 2.5 Turbo',
    provider: 'kling',
    type: 'video',
    providerType: 'cloud',
    description: 'Kuaishou fast video generation',
    aliases: ['kling-2.5-turbo'],
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negative_prompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      duration: {
        type: 'select',
        label: 'Duration',
        default: '5',
        options: [
          { value: '5', label: '5 seconds' },
          { value: '10', label: '10 seconds' },
        ],
      },
      cfg_scale: {
        type: 'slider',
        label: 'CFG Scale',
        min: 0,
        max: 1,
        step: 0.1,
        default: 0.5,
      },
      camera_horizontal: {
        type: 'slider',
        label: 'Camera Horizontal',
        min: -1,
        max: 1,
        step: 0.1,
        default: 0,
      },
      camera_vertical: {
        type: 'slider',
        label: 'Camera Vertical',
        min: -1,
        max: 1,
        step: 0.1,
        default: 0,
      },
      camera_zoom: {
        type: 'slider',
        label: 'Camera Zoom',
        min: -1,
        max: 1,
        step: 0.1,
        default: 0,
      },
    },
  },
  {
    id: 'kling-2.1',
    name: 'Kling 2.1 Master',
    provider: 'kling',
    type: 'video',
    providerType: 'cloud',
    description: 'Kuaishou video with enhanced quality',
    aliases: ['kling-2.1-master'],
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negative_prompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      duration: {
        type: 'select',
        label: 'Duration',
        default: '5',
        options: [
          { value: '5', label: '5 seconds' },
          { value: '10', label: '10 seconds' },
        ],
      },
      cfg_scale: {
        type: 'slider',
        label: 'CFG Scale',
        min: 0,
        max: 1,
        step: 0.1,
        default: 0.5,
      },
    },
  },
  {
    id: 'kling-2.0',
    name: 'Kling 2.0',
    provider: 'kling',
    type: 'video',
    providerType: 'cloud',
    description: 'Kuaishou base video model',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negative_prompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      duration: {
        type: 'select',
        label: 'Duration',
        default: '5',
        options: [
          { value: '5', label: '5 seconds' },
          { value: '10', label: '10 seconds' },
        ],
      },
    },
  },
  {
    id: 'pika-2.1',
    name: 'Pika 2.1 Turbo',
    provider: 'pika',
    type: 'video',
    providerType: 'cloud',
    description: 'Pika Labs fast video generation',
    aliases: ['pika-2.1-turbo'],
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negativePrompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      resolution: {
        type: 'select',
        label: 'Resolution',
        default: '720p',
        options: [
          { value: '720p', label: '720p' },
          { value: '1080p', label: '1080p' },
        ],
      },
      length: {
        type: 'slider',
        label: 'Duration (seconds)',
        min: 5,
        max: 10,
        step: 1,
        default: 5,
      },
      aspectRatio: {
        type: 'select',
        label: 'Aspect Ratio',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '1:1', label: '1:1' },
        ],
      },
      guidanceScale: {
        type: 'slider',
        label: 'Guidance Scale',
        min: 1,
        max: 20,
        step: 0.5,
        default: 7.5,
      },
    },
  },
  {
    id: 'pika-2.0',
    name: 'Pika 2.0',
    provider: 'pika',
    type: 'video',
    providerType: 'cloud',
    description: 'Pika Labs base video model',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negativePrompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      resolution: {
        type: 'select',
        label: 'Resolution',
        default: '720p',
        options: [
          { value: '720p', label: '720p' },
          { value: '1080p', label: '1080p' },
        ],
      },
      length: {
        type: 'slider',
        label: 'Duration (seconds)',
        min: 5,
        max: 10,
        step: 1,
        default: 5,
      },
    },
  },
  {
    id: 'vidu-2.0',
    name: 'Vidu 2.0',
    provider: 'vidu',
    type: 'video',
    providerType: 'cloud',
    description: 'Shengshu video generation',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      duration: {
        type: 'select',
        label: 'Duration',
        default: '4',
        options: [
          { value: '4', label: '4 seconds' },
          { value: '8', label: '8 seconds' },
        ],
      },
      resolution: {
        type: 'select',
        label: 'Resolution',
        default: '720p',
        options: [
          { value: '720p', label: '720p' },
          { value: '1080p', label: '1080p' },
        ],
      },
      movement_amplitude: {
        type: 'select',
        label: 'Movement Amplitude',
        default: 'auto',
        options: [
          { value: 'auto', label: 'Auto' },
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
        ],
      },
      seed: {
        type: 'number',
        label: 'Seed',
      },
    },
  },
  {
    id: 'hailuo-t2v-01',
    name: 'Hailuo T2V-01 Director',
    provider: 'minimax',
    type: 'video',
    providerType: 'cloud',
    description: 'MiniMax video generation',
    aliases: ['hailuo-t2v-01-director'],
    capabilities: {
      textToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      duration: {
        type: 'select',
        label: 'Duration',
        default: '6',
        options: [{ value: '6', label: '6 seconds' }],
      },
    },
  },
  {
    id: 'genmo-mochi-1',
    name: 'Genmo Mochi 1 (10B)',
    provider: 'genmo',
    type: 'video',
    providerType: 'cloud',
    description: 'Genmo open video model',
    capabilities: {
      textToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negative_prompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      num_frames: {
        type: 'slider',
        label: 'Number of Frames',
        min: 16,
        max: 31,
        step: 1,
        default: 24,
      },
      num_inference_steps: {
        type: 'slider',
        label: 'Inference Steps',
        min: 20,
        max: 100,
        step: 5,
        default: 50,
      },
    },
  },
  {
    id: 'adobe-firefly-video',
    name: 'Adobe Firefly Video',
    provider: 'adobe',
    type: 'video',
    providerType: 'cloud',
    description: 'Adobe video generation',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      duration: {
        type: 'select',
        label: 'Duration',
        default: '5',
        options: [
          { value: '5', label: '5 seconds' },
          { value: '8', label: '8 seconds' },
          { value: '10', label: '10 seconds' },
        ],
      },
      resolution: {
        type: 'select',
        label: 'Resolution',
        default: '720p',
        options: [
          { value: '720p', label: '720p' },
          { value: '1080p', label: '1080p' },
        ],
      },
      frame_rate: {
        type: 'select',
        label: 'Frame Rate',
        default: '30',
        options: [
          { value: '24', label: '24 fps' },
          { value: '25', label: '25 fps' },
          { value: '30', label: '30 fps' },
          { value: '60', label: '60 fps' },
        ],
      },
    },
  },
  {
    id: 'haiper-2.0',
    name: 'Haiper 2.0',
    provider: 'haiper',
    type: 'video',
    providerType: 'cloud',
    description: 'Haiper earlier video model',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      duration: {
        type: 'select',
        label: 'Duration',
        default: '4',
        options: [
          { value: '4', label: '4 seconds' },
          { value: '6', label: '6 seconds' },
        ],
      },
      aspect_ratio: {
        type: 'select',
        label: 'Aspect Ratio',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '1:1', label: '1:1' },
        ],
      },
    },
  },
  {
    id: 'pixverse-v3',
    name: 'PixVerse V3',
    provider: 'pixverse',
    type: 'video',
    providerType: 'cloud',
    description: 'PixVerse video generation',
    capabilities: {
      textToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      duration: {
        type: 'select',
        label: 'Duration',
        default: '10',
        options: [
          { value: '5', label: '5 seconds' },
          { value: '10', label: '10 seconds' },
        ],
      },
      aspect_ratio: {
        type: 'select',
        label: 'Aspect Ratio',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '1:1', label: '1:1' },
        ],
      },
    },
  },
  {
    id: 'svd-xt',
    name: 'Stable Video Diffusion XT',
    provider: 'stability',
    type: 'video',
    providerType: 'local',
    description: 'Stability AI local video model',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negative_prompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      motion_bucket: {
        type: 'slider',
        label: 'Motion Bucket',
        description: 'Amount of motion in the video',
        min: 1,
        max: 255,
        step: 1,
        default: 127,
      },
      seed: {
        type: 'number',
        label: 'Seed',
        default: -1,
      },
    },
    hardware: {
      vramRequired: '16GB',
      port: 8009,
    },
  },
];

// ============================================================================
// IMAGE GENERATION MODELS
// ============================================================================

export const IMAGE_MODELS: GenerationModel[] = [
  {
    id: 'flux-2-max',
    name: 'FLUX.2 Max',
    provider: 'bfl',
    type: 'image',
    providerType: 'cloud',
    description: 'Black Forest Labs flagship with exceptional editing consistency',
    docsUrl: 'https://docs.bfl.ml/quick_start/introduction',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
      styleReference: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      size: {
        type: 'select',
        label: 'Size',
        default: '1024x1024',
        options: [
          { value: '512x512', label: '512x512' },
          { value: '768x768', label: '768x768' },
          { value: '1024x1024', label: '1024x1024' },
          { value: '1024x1792', label: '1024x1792' },
          { value: '1792x1024', label: '1792x1024' },
        ],
      },
      n: {
        type: 'slider',
        label: 'Number of Images',
        min: 1,
        max: 4,
        step: 1,
        default: 1,
      },
      reference_images: {
        type: 'images',
        label: 'Reference Images',
        description: 'Up to 10 reference images for consistency',
        maxItems: 10,
      },
    },
    pricing: {
      perGeneration: 0.07,
      currency: 'USD',
    },
  },
  {
    id: 'midjourney-7',
    name: 'Midjourney v7',
    provider: 'midjourney',
    type: 'image',
    providerType: 'cloud',
    description: 'Advanced artistic quality with personalization and Photoshop-like layer editing',
    capabilities: {
      textToMedia: true,
      characterReference: true,
      styleReference: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      ar: {
        type: 'select',
        label: 'Aspect Ratio (--ar)',
        default: '1:1',
        options: [
          { value: '1:1', label: '1:1 (Square)' },
          { value: '16:9', label: '16:9 (Landscape)' },
          { value: '9:16', label: '9:16 (Portrait)' },
          { value: '4:3', label: '4:3' },
          { value: '3:2', label: '3:2' },
        ],
      },
      draft: {
        type: 'boolean',
        label: 'Draft Mode (--draft)',
        description: '10x faster iteration',
        default: false,
      },
      personalization: {
        type: 'boolean',
        label: 'Personalization (--p)',
        description: 'Use your learned aesthetic profile',
        default: true,
      },
      cref: {
        type: 'image',
        label: 'Character Reference (--cref)',
      },
      sref: {
        type: 'image',
        label: 'Style Reference (--sref)',
      },
      omni_reference: {
        type: 'image',
        label: 'Omni Reference',
        description: 'Maintain object consistency across scenes',
      },
      model_type: {
        type: 'select',
        label: 'Model Variant',
        default: 'v7',
        options: [
          { value: 'v7', label: 'MJ v7 (Artistic)' },
          { value: 'niji7', label: 'Niji 7 (Anime)' },
        ],
      },
    },
  },
  {
    id: 'gpt-image-1.5',
    name: 'GPT-Image 1.5',
    provider: 'openai',
    type: 'image',
    providerType: 'cloud',
    description: 'Exceptional text rendering and controlled design adherence',
    capabilities: {
      textToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      controlled_design: {
        type: 'select',
        label: 'Design Mode',
        default: 'standard',
        options: [
          { value: 'standard', label: 'Standard' },
          { value: 'commercial', label: 'Commercial Mockup' },
          { value: 'social_media', label: 'Social Media (Branded)' },
          { value: 'infographic', label: 'Infographic (Text Max)' },
        ],
      },
      text_precision: {
        type: 'slider',
        label: 'Text Precision',
        min: 0,
        max: 1,
        step: 0.1,
        default: 0.9,
      },
    },
  },
  {
    id: 'ideogram-3',
    name: 'Ideogram 3.0',
    provider: 'ideogram',
    type: 'image',
    providerType: 'cloud',
    description: 'Industry-leading text rendering in images',
    docsUrl: 'https://developer.ideogram.ai/',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
      styleReference: true,
      characterReference: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negative_prompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      aspect_ratio: {
        type: 'select',
        label: 'Aspect Ratio',
        default: '1:1',
        options: [
          { value: '1:1', label: '1:1' },
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '4:3', label: '4:3' },
          { value: '3:4', label: '3:4' },
        ],
      },
      magic_prompt: {
        type: 'boolean',
        label: 'Magic Prompt',
        description: 'AI enhancement of your prompt',
        default: true,
      },
      style_preset: {
        type: 'select',
        label: 'Style Preset',
        options: [
          { value: 'auto', label: 'Auto' },
          { value: 'realistic', label: 'Realistic' },
          { value: 'design', label: 'Design' },
          { value: 'render_3d', label: '3D Render' },
          { value: 'anime', label: 'Anime' },
        ],
      },
      style_reference_images: {
        type: 'images',
        label: 'Style References',
        description: 'Up to 3 images (max 10MB total)',
        maxItems: 3,
      },
      character_reference: {
        type: 'image',
        label: 'Character Reference',
        description: '1 image (max 10MB)',
      },
      seed: {
        type: 'number',
        label: 'Seed',
      },
    },
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'openai',
    type: 'image',
    providerType: 'cloud',
    description: 'OpenAI image generation',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      size: {
        type: 'select',
        label: 'Size',
        default: '1024x1024',
        options: [
          { value: '1024x1024', label: '1024x1024' },
          { value: '1024x1792', label: '1024x1792' },
          { value: '1792x1024', label: '1792x1024' },
        ],
      },
      quality: {
        type: 'select',
        label: 'Quality',
        default: 'hd',
        options: [
          { value: 'standard', label: 'Standard' },
          { value: 'hd', label: 'HD' },
        ],
      },
      n: {
        type: 'slider',
        label: 'Number of Images',
        min: 1,
        max: 4,
        step: 1,
        default: 1,
      },
    },
    pricing: {
      perGeneration: 0.04,
      currency: 'USD',
    },
  },
  // Additional Image Models
  {
    id: 'flux-1.1-pro',
    name: 'FLUX 1.1 Pro',
    provider: 'bfl',
    type: 'image',
    providerType: 'cloud',
    description: 'Black Forest Labs professional image generation',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      size: {
        type: 'select',
        label: 'Size',
        default: '1024x1024',
        options: [
          { value: '512x512', label: '512x512' },
          { value: '768x768', label: '768x768' },
          { value: '1024x1024', label: '1024x1024' },
          { value: '1024x1792', label: '1024x1792' },
          { value: '1792x1024', label: '1792x1024' },
        ],
      },
      n: {
        type: 'slider',
        label: 'Number of Images',
        min: 1,
        max: 4,
        step: 1,
        default: 1,
      },
    },
    pricing: {
      perGeneration: 0.04,
      currency: 'USD',
    },
  },
  {
    id: 'flux-2-flex',
    name: 'FLUX.2 Flex',
    provider: 'bfl',
    type: 'image',
    providerType: 'cloud',
    description: 'Black Forest Labs flexible image generation',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
      styleReference: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      size: {
        type: 'select',
        label: 'Size',
        default: '1024x1024',
        options: [
          { value: '512x512', label: '512x512' },
          { value: '768x768', label: '768x768' },
          { value: '1024x1024', label: '1024x1024' },
          { value: '1024x1792', label: '1024x1792' },
          { value: '1792x1024', label: '1792x1024' },
        ],
      },
      n: {
        type: 'slider',
        label: 'Number of Images',
        min: 1,
        max: 4,
        step: 1,
        default: 1,
      },
      reference_images: {
        type: 'images',
        label: 'Reference Images',
        maxItems: 10,
      },
    },
    pricing: {
      perGeneration: 0.05,
      currency: 'USD',
    },
  },
  {
    id: 'midjourney-6.1',
    name: 'Midjourney v6.1',
    provider: 'midjourney',
    type: 'image',
    providerType: 'cloud',
    description: 'Midjourney earlier model',
    aliases: ['midjourney-v6.1'],
    capabilities: {
      textToMedia: true,
      characterReference: true,
      styleReference: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      ar: {
        type: 'select',
        label: 'Aspect Ratio (--ar)',
        default: '1:1',
        options: [
          { value: '1:1', label: '1:1 (Square)' },
          { value: '16:9', label: '16:9 (Landscape)' },
          { value: '9:16', label: '9:16 (Portrait)' },
          { value: '4:3', label: '4:3' },
        ],
      },
      stylize: {
        type: 'slider',
        label: 'Stylize (--s)',
        min: 0,
        max: 1000,
        step: 50,
        default: 100,
      },
    },
  },
  {
    id: 'sd-3.5-large',
    name: 'Stable Diffusion 3.5 Large',
    provider: 'stability',
    type: 'image',
    providerType: 'local',
    description: 'Stability AI large local model',
    capabilities: {
      textToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negative_prompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      size: {
        type: 'select',
        label: 'Size',
        default: '1024x1024',
        options: [
          { value: '512x512', label: '512x512' },
          { value: '768x768', label: '768x768' },
          { value: '1024x1024', label: '1024x1024' },
        ],
      },
      steps: {
        type: 'slider',
        label: 'Steps',
        min: 1,
        max: 50,
        step: 1,
        default: 20,
      },
      cfg_scale: {
        type: 'slider',
        label: 'CFG Scale',
        min: 1,
        max: 20,
        step: 0.5,
        default: 7.5,
      },
      seed: {
        type: 'number',
        label: 'Seed',
        default: -1,
      },
    },
    hardware: {
      vramRequired: '16GB',
      port: 8010,
    },
  },
  {
    id: 'ideogram-2.0',
    name: 'Ideogram 2.0',
    provider: 'ideogram',
    type: 'image',
    providerType: 'cloud',
    description: 'Ideogram earlier model with text rendering',
    aliases: ['ideogram-v2'],
    capabilities: {
      textToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      aspect_ratio: {
        type: 'select',
        label: 'Aspect Ratio',
        default: '1:1',
        options: [
          { value: '1:1', label: '1:1' },
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
        ],
      },
      style_type: {
        type: 'select',
        label: 'Style Type',
        default: 'auto',
        options: [
          { value: 'auto', label: 'Auto' },
          { value: 'realistic', label: 'Realistic' },
          { value: 'design', label: 'Design' },
        ],
      },
    },
  },
  {
    id: 'sdxl-turbo',
    name: 'SDXL Turbo (Real-time)',
    provider: 'stability',
    type: 'image',
    providerType: 'local',
    description: 'Fast local image generation',
    capabilities: {
      textToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      size: {
        type: 'select',
        label: 'Size',
        default: '512x512',
        options: [
          { value: '512x512', label: '512x512' },
          { value: '768x768', label: '768x768' },
          { value: '1024x1024', label: '1024x1024' },
        ],
      },
      steps: {
        type: 'slider',
        label: 'Steps',
        min: 1,
        max: 8,
        step: 1,
        default: 4,
      },
    },
    hardware: {
      vramRequired: '8GB',
      port: 8011,
    },
  },
  {
    id: 'stability-sdxl',
    name: 'Stability AI SDXL',
    provider: 'stability',
    type: 'image',
    providerType: 'cloud',
    description: 'Stability AI cloud SDXL',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negative_prompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      size: {
        type: 'select',
        label: 'Size',
        default: '1024x1024',
        options: [
          { value: '512x512', label: '512x512' },
          { value: '768x768', label: '768x768' },
          { value: '1024x1024', label: '1024x1024' },
        ],
      },
      cfg_scale: {
        type: 'slider',
        label: 'CFG Scale',
        min: 1,
        max: 20,
        step: 0.5,
        default: 7.5,
      },
    },
    pricing: {
      perGeneration: 0.03,
      currency: 'USD',
    },
  },
  {
    id: 'leonardo-phoenix',
    name: 'Leonardo.ai Phoenix',
    provider: 'leonardo',
    type: 'image',
    providerType: 'cloud',
    description: 'Leonardo AI creative image generation',
    capabilities: {
      textToMedia: true,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negative_prompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      guidance_scale: {
        type: 'slider',
        label: 'Guidance Scale',
        min: 1,
        max: 20,
        step: 0.5,
        default: 7.0,
      },
    },
  },
  {
    id: 'replicate-flux',
    name: 'Replicate FLUX',
    provider: 'replicate',
    type: 'image',
    providerType: 'cloud',
    description: 'FLUX on Replicate infrastructure',
    capabilities: {
      textToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      size: {
        type: 'select',
        label: 'Size',
        default: '1024x1024',
        options: [
          { value: '512x512', label: '512x512' },
          { value: '1024x1024', label: '1024x1024' },
        ],
      },
      num_outputs: {
        type: 'slider',
        label: 'Number of Outputs',
        min: 1,
        max: 4,
        step: 1,
        default: 1,
      },
    },
  },
  {
    id: 'playground-v2.5',
    name: 'Playground AI v2.5',
    provider: 'playground',
    type: 'image',
    providerType: 'cloud',
    description: 'Playground AI image generation',
    capabilities: {
      textToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negative_prompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      guidance_scale: {
        type: 'slider',
        label: 'Guidance Scale',
        min: 1,
        max: 15,
        step: 0.5,
        default: 7.0,
      },
    },
  },
  {
    id: 'sam-2',
    name: 'SAM 2 (Segment Anything)',
    provider: 'meta',
    type: 'image',
    providerType: 'cloud',
    description: 'Meta segmentation model',
    capabilities: {
      textToMedia: false,
      imageToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Segmentation Prompt',
        description: 'Describe what to segment',
        required: true,
      },
      input_image: {
        type: 'image',
        label: 'Input Image',
        required: true,
      },
    },
  },
  {
    id: 'qwen-image',
    name: 'Qwen-Image-2512',
    provider: 'qwen',
    type: 'image',
    providerType: 'local',
    description: 'Alibaba Qwen image generation',
    aliases: ['qwen-image-2512'],
    capabilities: {
      textToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negative_prompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      steps: {
        type: 'slider',
        label: 'Steps',
        min: 10,
        max: 50,
        step: 5,
        default: 25,
      },
      cfg_scale: {
        type: 'slider',
        label: 'CFG Scale',
        min: 1,
        max: 15,
        step: 0.5,
        default: 7.5,
      },
    },
    hardware: {
      vramRequired: '16GB',
      port: 8012,
    },
  },
  {
    id: 'hunyuan-image',
    name: 'Hunyuan Image 3.0 (80B)',
    provider: 'hunyuan',
    type: 'image',
    providerType: 'local',
    description: 'Tencent Hunyuan image generation',
    aliases: ['hunyuan-image-3.0'],
    capabilities: {
      textToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negative_prompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      size: {
        type: 'select',
        label: 'Size',
        default: '1024x1024',
        options: [
          { value: '512x512', label: '512x512' },
          { value: '768x768', label: '768x768' },
          { value: '1024x1024', label: '1024x1024' },
        ],
      },
      guidance_scale: {
        type: 'slider',
        label: 'Guidance Scale',
        min: 1,
        max: 15,
        step: 0.5,
        default: 7.5,
      },
    },
    hardware: {
      vramRequired: '24GB',
      port: 8013,
    },
  },
  {
    id: 'deepseek-janus-pro-7b',
    name: 'DeepSeek Janus-Pro-7B',
    provider: 'deepseek',
    type: 'image',
    providerType: 'local',
    description: 'DeepSeek multimodal image generation',
    capabilities: {
      textToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      negative_prompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
      steps: {
        type: 'slider',
        label: 'Steps',
        min: 10,
        max: 50,
        step: 5,
        default: 25,
      },
      cfg_scale: {
        type: 'slider',
        label: 'CFG Scale',
        min: 1,
        max: 15,
        step: 0.5,
        default: 7.5,
      },
    },
    hardware: {
      vramRequired: '16GB',
      port: 8014,
    },
  },
];

// ============================================================================
// ICON/VECTOR GENERATION MODELS
// ============================================================================

export const ICON_MODELS: GenerationModel[] = [
  {
    id: 'recraft-v3',
    name: 'Recraft v3',
    provider: 'recraft',
    type: 'icon',
    providerType: 'cloud',
    description: 'Superior text rendering with native SVG output',
    docsUrl: 'https://www.recraft.ai/docs/api-reference/getting-started',
    capabilities: {
      textToMedia: true,
      styleReference: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      style: {
        type: 'select',
        label: 'Style',
        default: 'icon',
        options: [
          { value: 'icon', label: 'Icon' },
          { value: 'vector_illustration', label: 'Vector Illustration' },
          { value: 'digital_illustration', label: 'Digital Illustration' },
          { value: 'realistic_image', label: 'Realistic Image' },
        ],
      },
      substyle: {
        type: 'select',
        label: 'Substyle',
        options: [
          { value: 'engraving', label: 'Engraving' },
          { value: 'line_art', label: 'Line Art' },
          { value: 'line_circuit', label: 'Line Circuit' },
          { value: 'linocut', label: 'Linocut' },
        ],
      },
      image_size: {
        type: 'select',
        label: 'Size',
        default: 'square',
        options: [
          { value: 'square', label: 'Square' },
          { value: 'square_hd', label: 'Square HD' },
          { value: 'portrait_4_3', label: 'Portrait 4:3' },
          { value: 'portrait_16_9', label: 'Portrait 16:9' },
          { value: 'landscape_4_3', label: 'Landscape 4:3' },
          { value: 'landscape_16_9', label: 'Landscape 16:9' },
        ],
      },
      output_format: {
        type: 'select',
        label: 'Output Format',
        default: 'svg',
        options: [
          { value: 'svg', label: 'SVG (Vector)' },
          { value: 'png', label: 'PNG' },
          { value: 'jpg', label: 'JPG' },
          { value: 'webp', label: 'WebP' },
        ],
      },
    },
    constraints: {
      maxPromptLength: 4000,
    },
    pricing: {
      perGeneration: 0.08,
      currency: 'USD',
    },
  },
  {
    id: 'firefly-vector',
    name: 'Firefly Vector',
    provider: 'adobe',
    type: 'icon',
    providerType: 'cloud',
    description: 'Adobe vector generation with Creative Cloud integration',
    docsUrl: 'https://developer.adobe.com/firefly-services/docs/firefly-api/',
    capabilities: {
      textToMedia: true,
      styleReference: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      n: {
        type: 'slider',
        label: 'Variations',
        min: 1,
        max: 4,
        step: 1,
        default: 1,
      },
      size: {
        type: 'select',
        label: 'Size',
        default: '1024x1024',
        options: [
          { value: '512x512', label: '512x512' },
          { value: '1024x1024', label: '1024x1024' },
          { value: '2048x2048', label: '2048x2048' },
        ],
      },
      style: {
        type: 'select',
        label: 'Style Preset',
        options: [
          { value: 'cinematic', label: 'Cinematic' },
          { value: 'dramatic_lighting', label: 'Dramatic Lighting' },
          { value: 'golden_hour', label: 'Golden Hour' },
          { value: 'long_exposure', label: 'Long Exposure' },
        ],
      },
      negative_prompt: {
        type: 'string',
        label: 'Negative Prompt',
      },
    },
    pricing: {
      perGeneration: 0.02,
      currency: 'USD',
    },
  },
  {
    id: 'svg-turbo',
    name: 'SVG Turbo',
    provider: 'local',
    type: 'icon',
    providerType: 'local',
    description: 'Fast local SVG generation',
    capabilities: {
      textToMedia: true,
    },
    parameters: {
      prompt: {
        type: 'string',
        label: 'Prompt',
        required: true,
      },
      style: {
        type: 'select',
        label: 'Style',
        default: 'minimal',
        options: [
          { value: 'minimal', label: 'Minimal' },
          { value: 'detailed', label: 'Detailed' },
          { value: 'flat', label: 'Flat' },
          { value: 'gradient', label: 'Gradient' },
        ],
      },
    },
    hardware: {
      vramRequired: '2GB',
      port: 8008,
    },
  },
];

// ============================================================================
// AUDIO GENERATION MODELS
// ============================================================================

export const AUDIO_MODELS: GenerationModel[] = [
  {
    id: 'elevenlabs-v3',
    name: 'ElevenLabs Multilingual v3',
    provider: 'elevenlabs',
    type: 'audio',
    providerType: 'cloud',
    description: 'Premium TTS with voice cloning',
    docsUrl: 'https://elevenlabs.io/docs/api-reference',
    capabilities: {
      textToMedia: true,
    },
    parameters: {
      text: {
        type: 'string',
        label: 'Text',
        required: true,
      },
      voice_id: {
        type: 'select',
        label: 'Voice',
        default: '21m00Tcm4TlvDq8ikWAM',
        options: [
          { value: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel (Female)' },
          { value: 'AZnzlk1XvdvUeBnXmlld', label: 'Domi (Female)' },
          { value: 'EXAVITQu4vr4xnSDxMaL', label: 'Bella (Female)' },
          { value: 'ErXwobaYiN019PkySvjV', label: 'Antoni (Male)' },
          { value: 'TxGEqnHWrfWFTfGW9XjX', label: 'Josh (Male)' },
        ],
      },
      stability: {
        type: 'slider',
        label: 'Stability',
        description: 'Higher = more consistent, lower = more expressive',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.35,
      },
      similarity_boost: {
        type: 'slider',
        label: 'Similarity Boost',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.8,
      },
      style: {
        type: 'slider',
        label: 'Style',
        description: 'Style exaggeration (v3 feature)',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.2,
      },
      use_speaker_boost: {
        type: 'boolean',
        label: 'Speaker Boost',
        default: true,
      },
    },
  },
  {
    id: 'openai-tts-hd',
    name: 'OpenAI TTS 2 HD',
    provider: 'openai',
    type: 'audio',
    providerType: 'cloud',
    description: 'OpenAI text-to-speech',
    capabilities: {
      textToMedia: true,
    },
    parameters: {
      input: {
        type: 'string',
        label: 'Text',
        required: true,
      },
      voice: {
        type: 'select',
        label: 'Voice',
        default: 'alloy',
        options: [
          { value: 'alloy', label: 'Alloy (Neutral)' },
          { value: 'echo', label: 'Echo (Male)' },
          { value: 'fable', label: 'Fable (Male)' },
          { value: 'onyx', label: 'Onyx (Male)' },
          { value: 'nova', label: 'Nova (Female)' },
          { value: 'shimmer', label: 'Shimmer (Female)' },
        ],
      },
      response_format: {
        type: 'select',
        label: 'Output Format',
        default: 'mp3',
        options: [
          { value: 'mp3', label: 'MP3' },
          { value: 'opus', label: 'Opus' },
          { value: 'aac', label: 'AAC' },
          { value: 'flac', label: 'FLAC' },
        ],
      },
    },
  },
  {
    id: 'nvidia-personaplex',
    name: 'NVIDIA PersonaPlex',
    provider: 'nvidia',
    type: 'audio',
    providerType: 'local',
    description: '7B parameter full-duplex conversational voice AI with persona control',
    docsUrl: 'https://research.nvidia.com/labs/adlr/personaplex/',
    capabilities: {
      textToMedia: true,
      voiceCloning: true,
      realTimeStreaming: true,
      fullDuplex: true,
    },
    parameters: {
      text: {
        type: 'string',
        label: 'Text / Conversation Input',
        description: 'Text to synthesize or conversation context',
        required: true,
      },
      voice_prompt: {
        type: 'image', // Audio file - reuses upload component
        label: 'Voice Reference Audio',
        description: 'Audio sample capturing vocal characteristics and prosody',
      },
      persona_description: {
        type: 'string',
        label: 'Persona Description',
        description: 'Natural language description of role, background, and conversation style',
      },
      enable_backchannels: {
        type: 'boolean',
        label: 'Natural Backchannels',
        description: 'Enable "uh-huh", "oh", and other conversational cues',
        default: true,
      },
      enable_interruptions: {
        type: 'boolean',
        label: 'Handle Interruptions',
        description: 'Allow natural turn-taking and interruption handling',
        default: true,
      },
      emotional_expression: {
        type: 'slider',
        label: 'Emotional Expression',
        description: 'Intensity of emotional cues and non-verbal expression',
        min: 0,
        max: 1,
        step: 0.1,
        default: 0.5,
      },
      sample_rate: {
        type: 'select',
        label: 'Sample Rate',
        default: '24000',
        options: [
          { value: '16000', label: '16 kHz' },
          { value: '24000', label: '24 kHz (Recommended)' },
          { value: '48000', label: '48 kHz' },
        ],
      },
      streaming_mode: {
        type: 'boolean',
        label: 'Real-Time Streaming',
        description: 'Enable low-latency streaming output',
        default: true,
      },
    },
    constraints: {
      maxPromptLength: 4000,
      supportedFormats: ['audio/wav', 'audio/mp3', 'audio/ogg'],
    },
    hardware: {
      vramRequired: '16GB',
      port: 8015,
    },
  },
];

// ============================================================================
// HELPERS
// ============================================================================

export const ALL_GENERATION_MODELS = [
  ...VIDEO_MODELS,
  ...IMAGE_MODELS,
  ...ICON_MODELS,
  ...AUDIO_MODELS,
];

export function getGenerationModelById(id: string): GenerationModel | undefined {
  return ALL_GENERATION_MODELS.find((m) => m.id === id);
}

export function getModelsByType(type: GenerationType): GenerationModel[] {
  return ALL_GENERATION_MODELS.filter((m) => m.type === type);
}

export function getModelsByProvider(provider: string): GenerationModel[] {
  return ALL_GENERATION_MODELS.filter((m) => m.provider === provider);
}
