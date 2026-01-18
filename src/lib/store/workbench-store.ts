import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GenerationRun, WorkbenchState } from '@/lib/types/workbench';
import { v4 as uuidv4 } from 'uuid';

interface WorkbenchStore extends WorkbenchState {
  addRun: (run: Omit<GenerationRun, 'id' | 'timestamp'>) => string;
  batchAddRuns: (runs: Omit<GenerationRun, 'id' | 'timestamp'>[]) => void;
  togglePin: (runId: string) => void;
  deleteRun: (runId: string) => void;
  setFilter: (query: string) => void;
}

export const useWorkbenchStore = create<WorkbenchStore>()(
  persist(
    (set) => ({
      runs: {},
      pinnedIds: [],
      filter: { query: '' },

      addRun: (partialRun) => {
        const id = uuidv4();
        const newRun: GenerationRun = {
          ...partialRun,
          id,
          timestamp: Date.now(),
        };

        set((state) => ({
          runs: { [id]: newRun, ...state.runs }, // Add to top
        }));
        return id;
      },

      batchAddRuns: (partialRuns) => {
        set((state) => {
          const newRuns: Record<string, GenerationRun> = {};
          partialRuns.forEach((r) => {
            const id = uuidv4();
            newRuns[id] = {
              ...r,
              id,
              timestamp: Date.now(),
            };
          });
          return { runs: { ...newRuns, ...state.runs } };
        });
      },

      togglePin: (runId) =>
        set((state) => {
          const isPinned = state.pinnedIds.includes(runId);
          return {
            pinnedIds: isPinned
              ? state.pinnedIds.filter((id) => id !== runId)
              : [...state.pinnedIds, runId],
            runs: {
              ...state.runs,
              [runId]: { ...state.runs[runId], isPinned: !isPinned },
            },
          };
        }),

      deleteRun: (runId) =>
        set((state) => {
          const { [runId]: _, ...remaining } = state.runs;
          return {
            runs: remaining,
            pinnedIds: state.pinnedIds.filter((id) => id !== runId),
          };
        }),

      setFilter: (query) =>
        set((state) => ({
          filter: { ...state.filter, query },
        })),
    }),
    {
      name: 'workbench-storage',
    },
  ),
);
