import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ImageStudioState, GenerationSettings, ImageTunes } from '@/lib/types/image-studio';

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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
    }
] as const;

interface ImageStudioStore extends ImageStudioState {
    setModel: (modelId: string) => void;
    updateSettings: (settings: Partial<GenerationSettings>) => void;
    updateTunes: (tunes: Partial<ImageTunes>) => void;
    setCanvasTransform: (transform: { x: number; y: number; scale: number }) => void;
    setActiveImage: (id: string | null) => void;
}

export const useImageStudioStore = create<ImageStudioStore>()(
    persist(
        (set) => ({
            selectedModelId: 'sdxl-turbo-local',
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

            setModel: (modelId) => set({ selectedModelId: modelId }),

            updateSettings: (newSettings) => set((state) => ({
                settings: { ...state.settings, ...newSettings }
            })),

            updateTunes: (newTunes) => set((state) => ({
                tunes: { ...state.tunes, ...newTunes }
            })),

            setCanvasTransform: (transform) => set({ canvasTransform: transform }),

            setActiveImage: (id) => set({ activeImageId: id }),
        }),
        {
            name: 'image-studio-storage',
        }
    )
);
