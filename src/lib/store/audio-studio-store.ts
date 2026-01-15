import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AudioStudioState, AudioClip, AudioGenerationMode, VoiceProfile } from '@/lib/types/audio-studio';
import { v4 as uuidv4 } from 'uuid';

// Mock Voices
export const MOCK_VOICES: VoiceProfile[] = [
    { id: 'v1', name: 'ElevenLabs: Adam', provider: 'cloud', tags: ['Male', 'Deep', 'NARRATION'] },
    { id: 'v2', name: 'ElevenLabs: Rachel', provider: 'cloud', tags: ['Female', 'Soft', 'NARRATION'] },
    { id: 'v3', name: 'Coqui: XTTS v2', provider: 'local', tags: ['Expressive', 'Multilingual'] },
    { id: 'v4', name: 'Bark: Speaker 4', provider: 'local', tags: ['Emotional', 'SFX'] },
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
                    activeClipId: id // Auto-select
                }));
            },

            setActiveClip: (id) => set({ activeClipId: id }),
            setIsPlaying: (playing) => set({ isPlaying: playing }),
        }),
        {
            name: 'audio-studio-storage',
        }
    )
);
