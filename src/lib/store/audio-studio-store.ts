import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AudioStudioState,
  AudioClip,
  AudioGenerationMode,
  VoiceProfile,
  QwenTTSMode,
  VoiceCloneRef,
  VoiceTrainingJob,
  TrainingSample,
} from '@/lib/types/audio-studio';
import { v4 as uuidv4 } from 'uuid';

// Audio Processing Models (Separation, Enhancement, Voice AI)
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
  {
    id: 'nvidia-personaplex',
    name: 'NVIDIA PersonaPlex',
    provider: 'local',
    type: 'voice-ai',
    tags: ['Voice AI', 'Full-Duplex', 'Conversational', 'Persona', 'Real-Time', '7B'],
    description:
      '7B parameter full-duplex conversational voice AI with persona control, backchannels, and interruption handling',
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

// Qwen3-TTS CustomVoice Speakers (9 premium timbres)
export const QWEN3_VOICES: VoiceProfile[] = [
  {
    id: 'qwen-vivian',
    name: 'Qwen3: Vivian',
    provider: 'local',
    tags: ['Female', 'Bright', 'Edgy', 'Chinese'],
  },
  {
    id: 'qwen-serena',
    name: 'Qwen3: Serena',
    provider: 'local',
    tags: ['Female', 'Warm', 'Gentle', 'Chinese'],
  },
  {
    id: 'qwen-uncle-fu',
    name: 'Qwen3: Uncle Fu',
    provider: 'local',
    tags: ['Male', 'Deep', 'Mellow', 'Chinese'],
  },
  {
    id: 'qwen-dylan',
    name: 'Qwen3: Dylan',
    provider: 'local',
    tags: ['Male', 'Clear', 'Beijing', 'Chinese'],
  },
  {
    id: 'qwen-eric',
    name: 'Qwen3: Eric',
    provider: 'local',
    tags: ['Male', 'Lively', 'Sichuan', 'Chinese'],
  },
  {
    id: 'qwen-ryan',
    name: 'Qwen3: Ryan',
    provider: 'local',
    tags: ['Male', 'Dynamic', 'Rhythmic', 'English'],
  },
  {
    id: 'qwen-aiden',
    name: 'Qwen3: Aiden',
    provider: 'local',
    tags: ['Male', 'Sunny', 'American', 'English'],
  },
  {
    id: 'qwen-ono-anna',
    name: 'Qwen3: Ono Anna',
    provider: 'local',
    tags: ['Female', 'Playful', 'Nimble', 'Japanese'],
  },
  {
    id: 'qwen-sohee',
    name: 'Qwen3: Sohee',
    provider: 'local',
    tags: ['Female', 'Warm', 'Emotional', 'Korean'],
  },
];

// NVIDIA PersonaPlex Voice Profiles (Full-Duplex Conversational AI)
export const PERSONAPLEX_VOICES: VoiceProfile[] = [
  {
    id: 'personaplex-default',
    name: 'PersonaPlex: Conversational',
    provider: 'local',
    tags: ['Full-Duplex', 'Conversational', 'Natural'],
  },
  {
    id: 'personaplex-assistant',
    name: 'PersonaPlex: Assistant',
    provider: 'local',
    tags: ['Full-Duplex', 'Professional', 'Helpful'],
  },
  {
    id: 'personaplex-narrator',
    name: 'PersonaPlex: Narrator',
    provider: 'local',
    tags: ['Full-Duplex', 'Storytelling', 'Expressive'],
  },
  {
    id: 'personaplex-interviewer',
    name: 'PersonaPlex: Interviewer',
    provider: 'local',
    tags: ['Full-Duplex', 'Engaging', 'Curious'],
  },
];

// Supported languages for Qwen3-TTS
export const QWEN_TTS_LANGUAGES = [
  'English',
  'Chinese',
  'Japanese',
  'Korean',
  'German',
  'French',
  'Russian',
  'Portuguese',
  'Spanish',
  'Italian',
] as const;

interface AudioStudioStore extends AudioStudioState {
  clips: Record<string, AudioClip>;

  // Voice tuning parameters (ElevenLabs)
  voiceStyle: number;
  useSpeakerBoost: boolean;

  // Dynamic model parameters
  modelParams: Record<string, any>;
  setModelParam: (key: string, value: any) => void;
  setModelParams: (params: Record<string, any>) => void;

  // Basic actions
  setMode: (mode: AudioGenerationMode) => void;
  setVoice: (voiceId: string) => void;
  setPrompt: (prompt: string) => void;
  setParams: (updates: {
    stability?: number;
    similarity?: number;
    voiceStyle?: number;
    useSpeakerBoost?: boolean;
  }) => void;

  addClip: (clip: Omit<AudioClip, 'id' | 'createdAt'>) => void;
  setActiveClip: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  updateVoices: (voices: VoiceProfile[]) => void;
  fetchVoices: () => Promise<void>;

  // Qwen3-TTS actions
  setQwenMode: (mode: QwenTTSMode) => void;
  setSelectedLanguage: (language: string) => void;

  // Voice Clone actions
  setCloneRef: (ref: VoiceCloneRef | null) => void;
  setXVectorOnlyMode: (enabled: boolean) => void;

  // Voice Design actions
  setVoiceDescription: (description: string) => void;

  // Custom Voice actions
  setStyleInstruction: (instruction: string) => void;

  // Training actions
  addTrainingSample: (sample: Omit<TrainingSample, 'id'>) => void;
  removeTrainingSample: (id: string) => void;
  updateTrainingSample: (id: string, updates: Partial<TrainingSample>) => void;
  clearTrainingSamples: () => void;
  setActiveTrainingJob: (job: VoiceTrainingJob | null) => void;
  updateTrainingJobProgress: (progress: number, status?: VoiceTrainingJob['status']) => void;
  addTrainedVoice: (voice: VoiceProfile) => void;
}

export const useAudioStudioStore = create<AudioStudioStore>()(
  persist(
    (set) => ({
      // Basic state
      mode: 'speech',
      activeClipId: null,
      voices: [...MOCK_VOICES, ...QWEN3_VOICES, ...PERSONAPLEX_VOICES],
      selectedVoiceId: 'qwen-aiden', // Default to Qwen3 English voice
      prompt: '',
      stability: 0.35,
      similarity: 0.8,
      voiceStyle: 0.2,
      useSpeakerBoost: true,
      isPlaying: false,
      clips: {},
      modelParams: {},

      // Qwen3-TTS state
      qwenMode: 'custom',
      cloneRef: null,
      xVectorOnlyMode: false,
      voiceDescription: '',
      styleInstruction: '',
      selectedLanguage: 'English',
      trainingSamples: [],
      activeTrainingJob: null,
      trainedVoices: [],

      // Basic actions
      setMode: (mode) => set({ mode }),
      setVoice: (voiceId) => set({ selectedVoiceId: voiceId }),
      setPrompt: (prompt) => set({ prompt }),
      setParams: (updates) => set((state) => ({ ...state, ...updates })),
      setModelParam: (key, value) =>
        set((state) => ({
          modelParams: { ...state.modelParams, [key]: value },
        })),
      setModelParams: (params) => set({ modelParams: params }),

      addClip: (partialClip) => {
        const id = uuidv4();
        const newClip: AudioClip = {
          ...partialClip,
          id,
          createdAt: Date.now(),
        };
        set((state) => ({
          clips: { [id]: newClip, ...state.clips },
          activeClipId: id,
        }));
      },

      setActiveClip: (id) => set({ activeClipId: id }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      updateVoices: (newVoices) => set({ voices: newVoices }),

      fetchVoices: async () => {
        try {
          const response = await fetch('/api/audio/voices');
          const data = await response.json();
          if (data.voices) {
            const mappedVoices: VoiceProfile[] = data.voices.map((v: any) => ({
              id: v.id,
              name: `ElevenLabs: ${v.name}`,
              provider: 'cloud' as const,
              tags: [
                v.labels?.gender || 'Voice',
                v.category || 'Professional',
                v.labels?.accent || v.description || 'NARRATION',
              ].filter(Boolean),
              previewUrl: v.preview_url,
            }));
            // Merge with Qwen3 voices, PersonaPlex voices, and trained voices
            set((state) => ({
              voices: [
                ...mappedVoices,
                ...QWEN3_VOICES,
                ...PERSONAPLEX_VOICES,
                ...state.trainedVoices,
              ],
            }));
          }
        } catch (error) {
          console.error('[AudioStore] Failed to fetch voices:', error);
          // Keep current voices as fallback
        }
      },

      // Qwen3-TTS actions
      setQwenMode: (qwenMode) => set({ qwenMode }),
      setSelectedLanguage: (selectedLanguage) => set({ selectedLanguage }),

      // Voice Clone actions
      setCloneRef: (cloneRef) => set({ cloneRef }),
      setXVectorOnlyMode: (xVectorOnlyMode) => set({ xVectorOnlyMode }),

      // Voice Design actions
      setVoiceDescription: (voiceDescription) => set({ voiceDescription }),

      // Custom Voice actions
      setStyleInstruction: (styleInstruction) => set({ styleInstruction }),

      // Training actions
      addTrainingSample: (sample) => {
        const id = uuidv4();
        set((state) => ({
          trainingSamples: [...state.trainingSamples, { ...sample, id }],
        }));
      },

      removeTrainingSample: (id) => {
        set((state) => ({
          trainingSamples: state.trainingSamples.filter((s) => s.id !== id),
        }));
      },

      updateTrainingSample: (id, updates) => {
        set((state) => ({
          trainingSamples: state.trainingSamples.map((s) =>
            s.id === id ? { ...s, ...updates } : s,
          ),
        }));
      },

      clearTrainingSamples: () => set({ trainingSamples: [] }),

      setActiveTrainingJob: (activeTrainingJob) => set({ activeTrainingJob }),

      updateTrainingJobProgress: (progress, status) => {
        set((state) => ({
          activeTrainingJob: state.activeTrainingJob
            ? {
                ...state.activeTrainingJob,
                progress,
                ...(status && { status }),
              }
            : null,
        }));
      },

      addTrainedVoice: (voice) => {
        set((state) => ({
          trainedVoices: [...state.trainedVoices, voice],
          voices: [...state.voices, voice],
        }));
      },
    }),
    {
      name: 'audio-studio-storage',
      partialize: (state) => ({
        // Only persist these fields (exclude File objects and blob URLs)
        selectedVoiceId: state.selectedVoiceId,
        qwenMode: state.qwenMode,
        selectedLanguage: state.selectedLanguage,
        styleInstruction: state.styleInstruction,
        voiceDescription: state.voiceDescription,
        trainedVoices: state.trainedVoices,
        stability: state.stability,
        similarity: state.similarity,
        voiceStyle: state.voiceStyle,
        useSpeakerBoost: state.useSpeakerBoost,
      }),
    },
  ),
);
