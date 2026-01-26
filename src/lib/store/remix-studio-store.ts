import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RemixPacket } from '@/lib/orchestration/remix-orchestrator';

interface RemixStudioState {
  activePackets: RemixPacket[];
  isProcessing: boolean;
  history: RemixPacket[];
  activeStep: number;
}

interface RemixStudioActions {
  addPacket: (packet: RemixPacket) => void;
  updatePacket: (id: string, updates: Partial<RemixPacket>) => void;
  clearPackets: () => void;
  setProcessing: (processing: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
}

export const useRemixStudioStore = create<RemixStudioState & RemixStudioActions>()(
  persist(
    (set) => ({
      activePackets: [],
      isProcessing: false,
      history: [],
      activeStep: 0,

      addPacket: (packet) =>
        set((state) => ({
          activePackets: [...state.activePackets, packet],
          history: [packet, ...state.history],
        })),

      updatePacket: (id, updates) =>
        set((state) => ({
          activePackets: state.activePackets.map((p) => (p.id === id ? { ...p, ...updates } : p)),
          history: state.history.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      clearPackets: () => set({ activePackets: [], activeStep: 0 }),

      setProcessing: (processing) => set({ isProcessing: processing }),

      nextStep: () => set((state) => ({ activeStep: state.activeStep + 1 })),
      prevStep: () => set((state) => ({ activeStep: Math.max(0, state.activeStep - 1) })),
      setStep: (step) => set({ activeStep: step }),
    }),
    {
      name: 'remix-studio-storage',
    },
  ),
);
