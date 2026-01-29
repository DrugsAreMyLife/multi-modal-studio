import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Actor {
  id: string;
  name: string;
  thumbnailUrl: string;
  sourceType: 'enrollment' | 'casting'; // enrollment (image-based) vs casting (description-based)
  faceIdUrl?: string; // Reference image for enrollment
  description?: string; // Base prompt for casting
  persona?: string; // Emotional/behavioral mapping (UAT style)
  tags: string[];
  createdAt: number;
  metadata: {
    ethnicity?: string;
    gender?: string;
    age?: number;
    traits?: string[];
  };
}

interface ActorStore {
  actors: Actor[];
  activeActorId: string | null;
  addActor: (actor: Actor) => void;
  removeActor: (id: string) => void;
  updateActor: (id: string, updates: Partial<Actor>) => void;
  setActiveActor: (id: string | null) => void;
}

export const useActorStore = create<ActorStore>()(
  persist(
    (set) => ({
      actors: [],
      activeActorId: null,

      addActor: (actor) =>
        set((state) => ({
          actors: [actor, ...state.actors],
        })),

      removeActor: (id) =>
        set((state) => ({
          actors: state.actors.filter((a) => a.id !== id),
          activeActorId: state.activeActorId === id ? null : state.activeActorId,
        })),

      updateActor: (id, updates) =>
        set((state) => ({
          actors: state.actors.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),

      setActiveActor: (id) => set({ activeActorId: id }),
    }),
    {
      name: 'actor-storage',
    },
  ),
);
