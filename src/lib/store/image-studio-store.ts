import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ImageStudioState,
  GenerationSettings,
  ImageTunes,
  GenerationModel,
} from '@/lib/types/image-studio';

// Mock Models Registry (This would likely live in a separate config or API)
export const AVAILABLE_MODELS = [
  {
    id: 'flux-1.1-pro',
    name: 'Flux 1.1 Pro (SOTA)',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: true,
      supports_outpainting: true,
      supports_cfg: true,
      supports_steps: true,
      supports_negative_prompt: false,
      supports_streaming: true,
    },
  },
  {
    id: 'midjourney-v6.1',
    name: 'Midjourney v6.1',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: true,
      supports_outpainting: true,
      supports_cfg: false, // Stylize instead
      supports_steps: false,
      supports_negative_prompt: true, // --no parameter
      supports_streaming: true,
    },
  },
  {
    id: 'sd-3.5-large',
    name: 'Stable Diffusion 3.5 Large',
    provider: 'local', // Hybrid
    capabilities: {
      supports_inpainting: true,
      supports_outpainting: true,
      supports_cfg: true,
      supports_steps: true,
      supports_negative_prompt: true,
      supports_streaming: true,
    },
  },
  {
    id: 'ideogram-2.0',
    name: 'Ideogram 2.0 (Text Expert)',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: false,
      supports_outpainting: false,
      supports_cfg: false,
      supports_steps: false,
      supports_negative_prompt: true,
      supports_streaming: false,
    },
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: true, // Via edit
      supports_outpainting: true,
      supports_cfg: false,
      supports_steps: false,
      supports_negative_prompt: false,
      supports_streaming: false,
    },
  },
  {
    id: 'sdxl-turbo',
    name: 'SDXL Turbo (Real-time)',
    provider: 'local',
    capabilities: {
      supports_inpainting: true,
      supports_outpainting: false,
      supports_cfg: false,
      supports_steps: true,
      supports_negative_prompt: false,
      supports_streaming: true,
    },
  },
  {
    id: 'stability-sdxl',
    name: 'Stability AI SDXL',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: true,
      supports_outpainting: true,
      supports_cfg: true,
      supports_steps: true,
      supports_negative_prompt: true,
      supports_streaming: true,
    },
  },
  {
    id: 'leonardo-phoenix',
    name: 'Leonardo.ai Phoenix',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: true,
      supports_outpainting: true,
      supports_cfg: true,
      supports_steps: true,
      supports_negative_prompt: true,
      supports_streaming: false,
    },
  },
  {
    id: 'replicate-flux',
    name: 'Replicate FLUX',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: false,
      supports_outpainting: false,
      supports_cfg: true,
      supports_steps: true,
      supports_negative_prompt: true,
      supports_streaming: true,
    },
  },
  {
    id: 'ideogram-v2',
    name: 'Ideogram v2',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: false,
      supports_outpainting: false,
      supports_cfg: false,
      supports_steps: false,
      supports_negative_prompt: true,
      supports_streaming: false,
    },
  },
  {
    id: 'recraft-v3',
    name: 'Recraft V3',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: true,
      supports_outpainting: true,
      supports_cfg: true,
      supports_steps: true,
      supports_negative_prompt: true,
      supports_streaming: false,
    },
  },
  {
    id: 'playground-v2.5',
    name: 'Playground AI v2.5',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: true,
      supports_outpainting: false,
      supports_cfg: true,
      supports_steps: true,
      supports_negative_prompt: true,
      supports_streaming: true,
    },
  },
  {
    id: 'sam-2',
    name: 'SAM 2 (Segment Anything)',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: true,
      supports_outpainting: true,
      supports_cfg: false,
      supports_steps: false,
      supports_negative_prompt: false,
      supports_streaming: false,
    },
  },
  {
    id: 'qwen-image',
    name: 'Qwen-Image-2512',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: true,
      supports_outpainting: true,
      supports_cfg: true,
      supports_steps: true,
      supports_negative_prompt: true,
      supports_streaming: true,
    },
  },
  {
    id: 'hunyuan-image',
    name: 'Hunyuan Image 3.0 (80B)',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: true,
      supports_outpainting: true,
      supports_cfg: true,
      supports_steps: true,
      supports_negative_prompt: true,
      supports_streaming: true,
    },
  },
  {
    id: 'deepseek-janus-pro-7b',
    name: 'DeepSeek Janus-Pro-7B',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: true,
      supports_outpainting: false,
      supports_cfg: true,
      supports_steps: true,
      supports_negative_prompt: true,
      supports_streaming: true,
    },
  },
  {
    id: 'gpt-image-1.5',
    name: 'GPT Image 1.5 (OpenAI)',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: true,
      supports_outpainting: true,
      supports_cfg: false,
      supports_steps: false,
      supports_negative_prompt: true,
      supports_streaming: false,
    },
  },
  {
    id: 'midjourney-7',
    name: 'Midjourney v7',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: true,
      supports_outpainting: true,
      supports_cfg: false,
      supports_steps: false,
      supports_negative_prompt: true,
      supports_streaming: true,
    },
  },
  {
    id: 'flux-2-max',
    name: 'FLUX 2 Max',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: true,
      supports_outpainting: true,
      supports_cfg: true,
      supports_steps: true,
      supports_negative_prompt: true,
      supports_streaming: true,
    },
  },
  {
    id: 'flux-2-flex',
    name: 'FLUX 2 Flex',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: true,
      supports_outpainting: true,
      supports_cfg: true,
      supports_steps: true,
      supports_negative_prompt: true,
      supports_streaming: true,
    },
  },
  {
    id: 'ideogram-3',
    name: 'Ideogram 3.0 (Text Master)',
    provider: 'cloud',
    capabilities: {
      supports_inpainting: false,
      supports_outpainting: false,
      supports_cfg: false,
      supports_steps: false,
      supports_negative_prompt: true,
      supports_streaming: false,
    },
  },
] as const;

interface ImageStudioStore extends ImageStudioState {
  setModel: (modelId: string) => void;
  updateSettings: (settings: Partial<GenerationSettings>) => void;
  updateTunes: (tunes: Partial<ImageTunes>) => void;
  setCanvasTransform: (transform: { x: number; y: number; scale: number }) => void;
  setActiveImage: (id: string | null) => void;
  updateModels: (models: GenerationModel[]) => void;
  // Dynamic model parameters
  modelParams: Record<string, any>;
  setModelParam: (key: string, value: any) => void;
  setModelParams: (params: Record<string, any>) => void;
}

export const useImageStudioStore = create<ImageStudioStore>()(
  persist(
    (set) => ({
      models: [...AVAILABLE_MODELS],
      selectedModelId: 'flux-1.1-pro',
      settings: {
        prompt: '',
        width: 1024,
        height: 1024,
        steps: 4,
        cfgScale: 7.0,
        seed: -1, // -1 = Random
        scheduler: 'euler_a',
        outputFormat: 'png',
        refImage: null,
      },
      tunes: {
        lighting: 0,
        contrast: 0,
        warmth: 0,
        vibrance: 0,
      },
      activeImageId: null,
      canvasTransform: { x: 0, y: 0, scale: 1 },
      modelParams: {},

      setModel: (modelId) => set({ selectedModelId: modelId }),
      setModelParam: (key, value) =>
        set((state) => ({
          modelParams: { ...state.modelParams, [key]: value },
        })),
      setModelParams: (params) => set({ modelParams: params }),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      updateTunes: (newTunes) =>
        set((state) => ({
          tunes: { ...state.tunes, ...newTunes },
        })),

      setCanvasTransform: (transform) => set({ canvasTransform: transform }),

      setActiveImage: (id) => set({ activeImageId: id }),

      updateModels: (newModels) => set({ models: newModels }),
    }),
    {
      name: 'image-studio-storage',
    },
  ),
);
