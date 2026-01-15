import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ModelDefinition, ModelType } from '@/lib/types/registry';

// Initial Seed Data (Replacing the hardcoded lists in other files)
const INITIAL_MODELS: ModelDefinition[] = [
    // Image Models
    { id: 'sdxl-turbo', name: 'SDXL Turbo', type: 'image', provider: 'local', capabilities: ['txt2img', 'fast'], tags: ['Fast', 'Local'], enabled: true },
    { id: 'dalle-3', name: 'DALL-E 3', type: 'image', provider: 'cloud', capabilities: ['txt2img', 'hq'], tags: ['High Quality'], enabled: true },
    { id: 'midjourney-v6', name: 'Midjourney v6', type: 'image', provider: 'cloud', capabilities: ['txt2img', 'artistic'], tags: ['Artistic'], enabled: true },

    // Audio Models
    { id: 'eleven-adam', name: 'ElevenLabs: Adam', type: 'audio', provider: 'cloud', capabilities: ['tts', 'emotion'], tags: ['Male', 'Deep', 'NARRATION'], enabled: true },
    { id: 'eleven-rachel', name: 'ElevenLabs: Rachel', type: 'audio', provider: 'cloud', capabilities: ['tts', 'emotion'], tags: ['Female', 'Soft', 'NARRATION'], enabled: true },
    { id: 'coqui-xtts', name: 'Coqui: XTTS v2', type: 'audio', provider: 'local', capabilities: ['tts', 'cloning', 'multilingual'], tags: ['Expressive', 'Multilingual'], enabled: true },
    { id: 'bark-s4', name: 'Bark: Speaker 4', type: 'audio', provider: 'local', capabilities: ['tts', 'sfx', 'emotion'], tags: ['Emotional', 'SFX'], enabled: true },

    // Video Models
    { id: 'svd-xt', name: 'Stable Video Diffusion XT', type: 'video', provider: 'local', capabilities: ['img2vid'], tags: ['Motion'], enabled: true },
    { id: 'runway-gen2', name: 'Runway Gen-2', type: 'video', provider: 'cloud', capabilities: ['txt2vid', 'img2vid'], tags: ['Cinematic'], enabled: true },
];

interface RegistryStore {
    models: ModelDefinition[];
    lastUpdated: number;
    isFetching: boolean;

    // Actions
    getModelsByType: (type: ModelType) => ModelDefinition[];
    refreshModels: () => Promise<void>;
    toggleModel: (id: string) => void;
}

export const useRegistryStore = create<RegistryStore>()(
    persist(
        (set, get) => ({
            models: INITIAL_MODELS,
            lastUpdated: Date.now(),
            isFetching: false,

            getModelsByType: (type) => {
                return get().models.filter(m => m.type === type && m.enabled);
            },

            refreshModels: async () => {
                set({ isFetching: true });
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Simulate discovering a new model
                const newModel: ModelDefinition = {
                    id: `flux-pro-${Date.now()}`,
                    name: 'Flux Pro (New)',
                    type: 'image',
                    provider: 'cloud',
                    capabilities: ['txt2img', 'controlnet'],
                    tags: ['New', 'Ultra'],
                    enabled: true
                };

                set(state => ({
                    models: [...state.models, newModel],
                    lastUpdated: Date.now(),
                    isFetching: false
                }));
            },

            toggleModel: (id) => set(state => ({
                models: state.models.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m)
            }))
        }),
        {
            name: 'registry-storage',
        }
    )
);
