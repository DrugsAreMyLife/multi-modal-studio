import { create } from 'zustand';

export type StemType = 'vocals' | 'drums' | 'bass' | 'other';

export interface AudioStem {
  id: string;
  type: StemType;
  url: string;
  volume: number;
  isMuted: boolean;
  isSoloed: boolean;
}

interface StemStudioState {
  sourceAudioUrl: string | null;
  stems: AudioStem[];
  isProcessing: boolean;
  progress: number;

  // Actions
  setSourceAudio: (url: string | null) => void;
  setStems: (stems: AudioStem[]) => void;
  updateStem: (id: string, updates: Partial<AudioStem>) => void;
  setProcessing: (processing: boolean) => void;
  setProgress: (progress: number) => void;
  reset: () => void;
}

export const useStemStudioStore = create<StemStudioState>((set) => ({
  sourceAudioUrl: null,
  stems: [],
  isProcessing: false,
  progress: 0,

  setSourceAudio: (url) => set({ sourceAudioUrl: url }),
  setStems: (stems) => set({ stems }),
  updateStem: (id, updates) =>
    set((state) => ({
      stems: state.stems.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
  setProcessing: (processing) => set({ isProcessing: processing }),
  setProgress: (progress) => set({ progress }),
  reset: () => set({ sourceAudioUrl: null, stems: [], isProcessing: false, progress: 0 }),
}));
