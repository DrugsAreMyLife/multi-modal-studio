import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AudioStudioState,
  AudioClip,
  AudioGenerationMode,
  VoiceProfile,
} from '@/lib/types/audio-studio';
import { v4 as uuidv4 } from 'uuid';

// Audio Processing Models (Separation, Enhancement)
export const AUDIO_MODELS = [
  {
    id: 'sam-audio',
    name: 'Meta SAM Audio',
    provider: 'cloud',
    type: 'separation',
    tags: ['Audio Separation', 'Multimodal', 'SOTA', 'Instrument', 'Speech', 'Sound'],
    description:
      'First unified multimodal model for audio separation with text, visual, and temporal prompts',
  },
] as const;

// Mock Voices
export const MOCK_VOICES: VoiceProfile[] = [
  { id: 'v1', name: 'ElevenLabs: Adam', provider: 'cloud', tags: ['Male', 'Deep', 'NARRATION'] },
  {
    id: 'v2',
    name: 'ElevenLabs: Rachel',
    provider: 'cloud',
    tags: ['Female', 'Soft', 'NARRATION'],
  },
  { id: 'v3', name: 'Coqui: XTTS v2', provider: 'local', tags: ['Expressive', 'Multilingual'] },
  { id: 'v4', name: 'Bark: Speaker 4', provider: 'local', tags: ['Emotional', 'SFX'] },
  { id: 'playht-2.0', name: 'PlayHT 2.0', provider: 'cloud', tags: ['High-Quality', 'Realistic'] },
  {
    id: 'resemble-v3',
    name: 'Resemble.ai V3',
    provider: 'cloud',
    tags: ['Voice Cloning', 'Natural'],
  },
  {
    id: 'murf-studio',
    name: 'Murf Studio',
    provider: 'cloud',
    tags: ['Expressive', 'Multi-Language'],
  },
  {
    id: 'wellsaid-labs',
    name: 'WellSaid Labs',
    provider: 'cloud',
    tags: ['Professional', 'Podcast'],
  },
  {
    id: 'speechify-api',
    name: 'Speechify API',
    provider: 'cloud',
    tags: ['Accessibility', 'Mobile-Friendly'],
  },
];

interface AudioStudioStore extends AudioStudioState {
  clips: Record<string, AudioClip>;

  setMode: (mode: AudioGenerationMode) => void;
  setVoice: (voiceId: string) => void;
  setPrompt: (prompt: string) => void;
  setParams: (updates: { stability?: number; similarity?: number }) => void;

  addClip: (clip: Omit<AudioClip, 'id' | 'createdAt'>) => void;
  setActiveClip: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
}

export const useAudioStudioStore = create<AudioStudioStore>()(
  persist(
    (set) => ({
      mode: 'speech',
      activeClipId: null,
      selectedVoiceId: 'v1',
      prompt: '',
      stability: 0.5,
      similarity: 0.75,
      isPlaying: false,
      clips: {},

      setMode: (mode) => set({ mode }),
      setVoice: (voiceId) => set({ selectedVoiceId: voiceId }),
      setPrompt: (prompt) => set({ prompt }),
      setParams: (updates) => set((state) => ({ ...state, ...updates })),

      addClip: (partialClip) => {
        const id = uuidv4();
        const newClip: AudioClip = {
          ...partialClip,
          id,
          createdAt: Date.now(),
        };
        set((state) => ({
          clips: { [id]: newClip, ...state.clips }, // Prepend
          activeClipId: id, // Auto-select
        }));
      },

      setActiveClip: (id) => set({ activeClipId: id }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
    }),
    {
      name: 'audio-studio-storage',
    },
  ),
);
