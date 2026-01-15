import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { VideoState, VideoClip, CameraParams, VideoTunes } from '@/lib/types/video-studio';
import { v4 as uuidv4 } from 'uuid';

export const AVAILABLE_VIDEO_MODELS = [
    {
        id: 'runway-gen3-alpha',
        name: 'Runway Gen-3 Alpha',
        provider: 'cloud',
        tier: 'ultra',
        capabilities: {
            max_duration: 10,
            supports_extensions: true,
            supports_camera: true
        }
    },
    {
        id: 'luma-dream-machine',
        name: 'Luma Dream Machine',
        provider: 'cloud',
        tier: 'pro',
        capabilities: {
            max_duration: 5,
            supports_extensions: true,
            supports_camera: true
        }
    },
    {
        id: 'kling-pro',
        name: 'Kling 1.0 (Pro)',
        provider: 'cloud',
        tier: 'pro',
        capabilities: {
            max_duration: 10,
            supports_extensions: false,
            supports_camera: true
        }
    },
    {
        id: 'hailuo-minimax',
        name: 'Hailuo (MiniMax)',
        provider: 'cloud',
        tier: 'standard',
        capabilities: {
            max_duration: 6,
            supports_extensions: false,
            supports_camera: false
        }
    },
    {
        id: 'sora-preview',
        name: 'Sora (Preview)',
        provider: 'cloud',
        tier: 'experimental',
        capabilities: {
            max_duration: 60,
            supports_extensions: true,
            supports_camera: true
        }
    },
    {
        id: 'svd-xt',
        name: 'Stable Video Diffusion XT',
        provider: 'local',
        tier: 'standard',
        capabilities: {
            max_duration: 4,
            supports_extensions: false,
            supports_camera: false
        }
    }
];

interface VideoStudioStore extends VideoState {
    addClip: (clip: Omit<VideoClip, 'id'>) => string;
    updateClip: (id: string, updates: Partial<VideoClip>) => void;
    deleteClip: (id: string) => void;

    setCurrentTime: (time: number) => void;
    setSelectedClip: (id: string | null) => void;

    setStartFrame: (frame: string | null) => void;
    setEndFrame: (frame: string | null) => void;
    updateCamera: (updates: Partial<CameraParams>) => void;
    updateTunes: (updates: Partial<VideoTunes>) => void;
    setAdvanced: (updates: Partial<Pick<VideoState, 'seed' | 'loopMode' | 'interpolate'>>) => void;
    setSelectedModel: (modelId: string) => void;
}

export const useVideoStudioStore = create<VideoStudioStore>()(
    persist(
        (set) => ({
            clips: [],
            currentTime: 0,
            selectedClipId: null,

            startFrame: null,
            endFrame: null,
            duration: 4, // Default 4s generation
            camera: { pan: { x: 0, y: 0 }, zoom: 0, tilt: 0, roll: 0 },
            tunes: {
                stability: 0,
                amplitude: 0,
                coherence: 0
            },
            // Advanced Video Settings
            seed: -1,
            loopMode: false,
            interpolate: true,
            selectedModelId: 'runway-gen3-alpha',

            addClip: (partialClip) => {
                const id = uuidv4();
                set((state) => ({
                    clips: [...state.clips, { ...partialClip, id }]
                }));
                return id;
            },

            updateClip: (id, updates) => set((state) => ({
                clips: state.clips.map(c => c.id === id ? { ...c, ...updates } : c)
            })),

            deleteClip: (id) => set((state) => ({
                clips: state.clips.filter(c => c.id !== id),
                selectedClipId: state.selectedClipId === id ? null : state.selectedClipId
            })),

            setCurrentTime: (time) => set({ currentTime: time }),
            setSelectedClip: (id) => set({ selectedClipId: id }),

            setStartFrame: (frame) => set({ startFrame: frame }),
            setEndFrame: (frame) => set({ endFrame: frame }),

            updateCamera: (updates) => set((state) => ({
                camera: { ...state.camera, ...updates }
            })),

            updateTunes: (updates) => set((state) => ({
                tunes: { ...state.tunes, ...updates }
            })),

            setAdvanced: (updates) => set((state) => ({ ...state, ...updates })),

            setSelectedModel: (modelId) => set({ selectedModelId: modelId }),
        }),
        {
            name: 'video-studio-storage',
        }
    )
);
