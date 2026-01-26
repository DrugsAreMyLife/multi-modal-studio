import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StyleDNA, STYLE_PRESETS, mixDNA } from '@/lib/style/style-dna';

interface StyleDNAStore {
  activeDNA: StyleDNA | null;
  savedDNAs: StyleDNA[];

  // Mixing State
  dnaA: StyleDNA | null;
  dnaB: StyleDNA | null;
  mixRatio: number; // 0 to 1

  // Actions
  setActiveDNA: (dna: StyleDNA | null) => void;
  saveDNA: (dna: StyleDNA) => void;
  deleteDNA: (id: string) => void;
  setMixDNAA: (dna: StyleDNA | null) => void;
  setMixDNAB: (dna: StyleDNA | null) => void;
  setMixRatio: (ratio: number) => void;

  // Operations
  createMixedDNA: () => void;
}

export const useStyleDNAStore = create<StyleDNAStore>()(
  persist(
    (set, get) => ({
      activeDNA: STYLE_PRESETS[0],
      savedDNAs: [...STYLE_PRESETS],

      dnaA: STYLE_PRESETS[0],
      dnaB: STYLE_PRESETS[1],
      mixRatio: 0.5,

      setActiveDNA: (dna) => set({ activeDNA: dna }),

      saveDNA: (dna) =>
        set((state) => ({
          savedDNAs: [...state.savedDNAs.filter((d) => d.id !== dna.id), dna],
        })),

      deleteDNA: (id) =>
        set((state) => ({
          savedDNAs: state.savedDNAs.filter((d) => d.id !== id),
          activeDNA: state.activeDNA?.id === id ? null : state.activeDNA,
        })),

      setMixDNAA: (dna) => set({ dnaA: dna }),
      setMixDNAB: (dna) => set({ dnaB: dna }),
      setMixRatio: (ratio) => set({ mixRatio: ratio }),

      createMixedDNA: () => {
        const { dnaA, dnaB, mixRatio } = get();
        if (!dnaA || !dnaB) return;

        const mixed = mixDNA(dnaA, dnaB, mixRatio);
        set({ activeDNA: mixed });
      },
    }),
    {
      name: 'style-dna-storage',
    },
  ),
);
