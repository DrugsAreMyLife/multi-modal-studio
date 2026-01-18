import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KeyboardShortcut {
  id: string;
  label: string;
  keys: string;
  description: string;
}

interface ShortcutsState {
  shortcuts: KeyboardShortcut[];
  setShortcut: (id: string, keys: string) => void;
  resetToDefaults: () => void;
}

const defaultShortcuts: KeyboardShortcut[] = [
  {
    id: 'new-conversation',
    label: 'New Conversation',
    keys: 'Cmd+N',
    description: 'Start a new chat conversation',
  },
  {
    id: 'command-palette',
    label: 'Command Palette',
    keys: '/',
    description: 'Open the command palette',
  },
  {
    id: 'toggle-sidebar',
    label: 'Toggle Sidebar',
    keys: 'Cmd+B',
    description: 'Show or hide the sidebar',
  },
  {
    id: 'search',
    label: 'Search',
    keys: 'Cmd+F',
    description: 'Focus the search input',
  },
  {
    id: 'global-chat',
    label: 'Global Chat',
    keys: 'Cmd+K',
    description: 'Toggle global chat overlay',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    keys: 'Cmd+Shift+A',
    description: 'Open analytics dashboard',
  },
  {
    id: 'toggle-shortcuts',
    label: 'Keyboard Shortcuts',
    keys: 'Cmd+/',
    description: 'Show all keyboard shortcuts',
  },
  {
    id: 'save-project',
    label: 'Save Project',
    keys: 'Cmd+S',
    description: 'Save current project state',
  },
  {
    id: 'export',
    label: 'Export',
    keys: 'Cmd+E',
    description: 'Export current work',
  },
  {
    id: 'undo',
    label: 'Undo',
    keys: 'Cmd+Z',
    description: 'Undo last action',
  },
  {
    id: 'redo',
    label: 'Redo',
    keys: 'Cmd+Shift+Z',
    description: 'Redo last undone action',
  },
];

export const useShortcutsStore = create<ShortcutsState>()(
  persist(
    (set) => ({
      shortcuts: defaultShortcuts,
      setShortcut: (id, keys) =>
        set((state) => ({
          shortcuts: state.shortcuts.map((s) => (s.id === id ? { ...s, keys } : s)),
        })),
      resetToDefaults: () => set({ shortcuts: defaultShortcuts }),
    }),
    {
      name: 'keyboard-shortcuts-storage',
    },
  ),
);
