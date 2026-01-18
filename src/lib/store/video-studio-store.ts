import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  VideoState,
  VideoClip,
  CameraParams,
  VideoTunes,
  VideoModel,
} from '@/lib/types/video-studio';
import { v4 as uuidv4 } from 'uuid';

export const AVAILABLE_VIDEO_MODELS = [
  // --- OpenAI ---
  {
    id: 'sora-2',
    name: 'Sora 2 (OpenAI)',
    provider: 'cloud',
    tier: 'ultra',
    capabilities: {
      max_duration: 60,
      supports_extensions: true,
      supports_camera: true,
    },
  },
  // --- Runway ---
  {
    id: 'runway-gen-4.5',
    name: 'Runway Gen-4.5',
    provider: 'cloud',
    tier: 'ultra',
    capabilities: {
      max_duration: 10,
      supports_extensions: true,
      supports_camera: true,
    },
  },
  {
    id: 'runway-gen3-alpha',
    name: 'Runway Gen-3 Alpha',
    provider: 'cloud',
    tier: 'ultra',
    capabilities: {
      max_duration: 10,
      supports_extensions: true,
      supports_camera: true,
    },
  },
  // --- Google ---
  {
    id: 'veo-3.1',
    name: 'Google Veo 3.1',
    provider: 'cloud',
    tier: 'ultra',
    capabilities: {
      max_duration: 120,
      supports_extensions: true,
      supports_camera: true,
    },
  },
  // --- Luma Labs ---
  {
    id: 'luma-ray3-hdr',
    name: 'Luma Ray 3 HDR',
    provider: 'cloud',
    tier: 'ultra',
    capabilities: {
      max_duration: 9,
      supports_extensions: true,
      supports_camera: true,
    },
  },
  {
    id: 'luma-ray2',
    name: 'Luma Ray 2',
    provider: 'cloud',
    tier: 'pro',
    capabilities: {
      max_duration: 9,
      supports_extensions: true,
      supports_camera: true,
    },
  },
  // --- Kling (Kuaishou) ---
  {
    id: 'kling-2.5-turbo',
    name: 'Kling 2.5 Turbo',
    provider: 'cloud',
    tier: 'ultra',
    capabilities: {
      max_duration: 10,
      supports_extensions: true,
      supports_camera: true,
    },
  },
  {
    id: 'kling-2.1-master',
    name: 'Kling 2.1 Master',
    provider: 'cloud',
    tier: 'pro',
    capabilities: {
      max_duration: 10,
      supports_extensions: true,
      supports_camera: true,
    },
  },
  {
    id: 'kling-2.0',
    name: 'Kling 2.0',
    provider: 'cloud',
    tier: 'pro',
    capabilities: {
      max_duration: 10,
      supports_extensions: false,
      supports_camera: true,
    },
  },
  // --- Pika Labs ---
  {
    id: 'pika-2.1-turbo',
    name: 'Pika 2.1 Turbo',
    provider: 'cloud',
    tier: 'pro',
    capabilities: {
      max_duration: 10,
      supports_extensions: true,
      supports_camera: true,
    },
  },
  {
    id: 'pika-2.0',
    name: 'Pika 2.0',
    provider: 'cloud',
    tier: 'pro',
    capabilities: {
      max_duration: 10,
      supports_extensions: true,
      supports_camera: true,
    },
  },
  // --- Tencent ---
  {
    id: 'hunyuan-video',
    name: 'Hunyuan Video (13B)',
    provider: 'cloud',
    tier: 'ultra',
    capabilities: {
      max_duration: 10,
      supports_extensions: true,
      supports_camera: true,
    },
  },
  // --- Vidu (Shengshu) ---
  {
    id: 'vidu-2.0',
    name: 'Vidu 2.0',
    provider: 'cloud',
    tier: 'pro',
    capabilities: {
      max_duration: 8,
      supports_extensions: true,
      supports_camera: true,
    },
  },
  // --- MiniMax ---
  {
    id: 'hailuo-t2v-01-director',
    name: 'Hailuo T2V-01 Director',
    provider: 'cloud',
    tier: 'standard',
    capabilities: {
      max_duration: 6,
      supports_extensions: false,
      supports_camera: false,
    },
  },
  // --- Genmo ---
  {
    id: 'genmo-mochi-1',
    name: 'Genmo Mochi 1 (10B)',
    provider: 'cloud',
    tier: 'standard',
    capabilities: {
      max_duration: 8,
      supports_extensions: false,
      supports_camera: false,
    },
  },
  // --- Adobe ---
  {
    id: 'adobe-firefly-video',
    name: 'Adobe Firefly Video',
    provider: 'cloud',
    tier: 'pro',
    capabilities: {
      max_duration: 10,
      supports_extensions: true,
      supports_camera: true,
    },
  },
  // --- Haiper ---
  {
    id: 'haiper-2.0',
    name: 'Haiper 2.0',
    provider: 'cloud',
    tier: 'pro',
    capabilities: {
      max_duration: 8,
      supports_extensions: true,
      supports_camera: true,
    },
  },
  // --- PixVerse ---
  {
    id: 'pixverse-v3',
    name: 'PixVerse V3',
    provider: 'cloud',
    tier: 'standard',
    capabilities: {
      max_duration: 10,
      supports_extensions: false,
      supports_camera: true,
    },
  },
  // --- Stability AI ---
  {
    id: 'svd-xt',
    name: 'Stable Video Diffusion XT',
    provider: 'local',
    tier: 'standard',
    capabilities: {
      max_duration: 4,
      supports_extensions: false,
      supports_camera: false,
    },
  },
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
  updateModels: (models: VideoModel[]) => void;
}

export const useVideoStudioStore = create<VideoStudioStore>()(
  persist(
    (set) => ({
      clips: [],
      models: [...AVAILABLE_VIDEO_MODELS],
      currentTime: 0,
      selectedClipId: null,

      startFrame: null,
      endFrame: null,
      duration: 4, // Default 4s generation
      camera: { pan: { x: 0, y: 0 }, zoom: 0, tilt: 0, roll: 0 },
      tunes: {
        stability: 0,
        amplitude: 0,
        coherence: 0,
      },
      // Advanced Video Settings
      seed: -1,
      loopMode: false,
      interpolate: true,
      selectedModelId: 'runway-gen3-alpha',

      addClip: (partialClip) => {
        const id = uuidv4();
        set((state) => ({
          clips: [...state.clips, { ...partialClip, id }],
        }));
        return id;
      },

      updateClip: (id, updates) =>
        set((state) => ({
          clips: state.clips.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      deleteClip: (id) =>
        set((state) => ({
          clips: state.clips.filter((c) => c.id !== id),
          selectedClipId: state.selectedClipId === id ? null : state.selectedClipId,
        })),

      setCurrentTime: (time) => set({ currentTime: time }),
      setSelectedClip: (id) => set({ selectedClipId: id }),

      setStartFrame: (frame) => set({ startFrame: frame }),
      setEndFrame: (frame) => set({ endFrame: frame }),

      updateCamera: (updates) =>
        set((state) => ({
          camera: { ...state.camera, ...updates },
        })),

      updateTunes: (updates) =>
        set((state) => ({
          tunes: { ...state.tunes, ...updates },
        })),

      setAdvanced: (updates) => set((state) => ({ ...state, ...updates })),

      setSelectedModel: (modelId) => set({ selectedModelId: modelId }),

      updateModels: (newModels) => set({ models: newModels }),
    }),
    {
      name: 'video-studio-storage',
    },
  ),
);
