import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedPrompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  usageCount: number;
  createdAt: number;
  updatedAt: number;
}

interface PromptLibraryState {
  prompts: SavedPrompt[];
  categories: string[];

  // Actions
  addPrompt: (prompt: Omit<SavedPrompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => string;
  updatePrompt: (id: string, updates: Partial<SavedPrompt>) => void;
  deletePrompt: (id: string) => void;
  toggleFavorite: (id: string) => void;
  incrementUsage: (id: string) => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  searchPrompts: (query: string) => SavedPrompt[];
  getPromptsByCategory: (category: string) => SavedPrompt[];
  getFavorites: () => SavedPrompt[];
}

const DEFAULT_CATEGORIES = ['General', 'Coding', 'Writing', 'Analysis', 'Creative'];

export const usePromptLibraryStore = create<PromptLibraryState>()(
  persist(
    (set, get) => ({
      prompts: [],
      categories: DEFAULT_CATEGORIES,

      addPrompt: (promptData) => {
        const id = crypto.randomUUID();
        const now = Date.now();
        const newPrompt: SavedPrompt = {
          ...promptData,
          id,
          usageCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          prompts: [newPrompt, ...state.prompts],
        }));
        return id;
      },

      updatePrompt: (id, updates) => {
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p,
          ),
        }));
      },

      deletePrompt: (id) => {
        set((state) => ({
          prompts: state.prompts.filter((p) => p.id !== id),
        }));
      },

      toggleFavorite: (id) => {
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite } : p,
          ),
        }));
      },

      incrementUsage: (id) => {
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id ? { ...p, usageCount: p.usageCount + 1 } : p,
          ),
        }));
      },

      addCategory: (category) => {
        set((state) => ({
          categories: state.categories.includes(category)
            ? state.categories
            : [...state.categories, category],
        }));
      },

      removeCategory: (category) => {
        set((state) => ({
          categories: state.categories.filter((c) => c !== category),
        }));
      },

      searchPrompts: (query) => {
        const lower = query.toLowerCase();
        return get().prompts.filter(
          (p) =>
            p.title.toLowerCase().includes(lower) ||
            p.content.toLowerCase().includes(lower) ||
            p.tags.some((t) => t.toLowerCase().includes(lower)),
        );
      },

      getPromptsByCategory: (category) => {
        return get().prompts.filter((p) => p.category === category);
      },

      getFavorites: () => {
        return get().prompts.filter((p) => p.isFavorite);
      },
    }),
    {
      name: 'prompt-library-storage',
      version: 1,
    },
  ),
);
