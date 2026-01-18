import { create } from 'zustand';

export interface Artifact {
  id: string;
  title: string;
  type: 'code' | 'markdown' | 'html';
  content: string;
  language?: string;
}

interface ArtifactState {
  isOpen: boolean;
  currentArtifact: Artifact | null;
  history: Artifact[];

  openArtifact: (artifact: Artifact) => void;
  closeArtifact: () => void;
  detectArtifactsInMessage: (content: string) => void;
}

export const useArtifactStore = create<ArtifactState>((set, get) => ({
  isOpen: false,
  currentArtifact: null,
  history: [],

  openArtifact: (artifact) => set({ isOpen: true, currentArtifact: artifact }),

  closeArtifact: () => set({ isOpen: false }),

  detectArtifactsInMessage: (content: string) => {
    // Simple regex to find <artifact> tags
    // Format: <artifact title="Foo" type="code" language="typescript">...</artifact>
    const regex =
      /<artifact\s+(?:title="([^"]*)")?\s*(?:type="([^"]*)")?\s*(?:language="([^"]*)")?>([\s\S]*?)<\/artifact>/g;

    // For MVP, we just find the last one and open it?
    // Or we just parse it.
    // Let's just store the extraction logic here or in the component.
    // Actually, real-time message streaming makes this tricky.
    // We'll trust the Orchestrator to call openArtifact when a finished message has one.
  },
}));
