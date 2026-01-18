import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isFocused: boolean;
  isGlobalChatOpen: boolean;
  isSidebarOpen: boolean;
  isCommandPaletteOpen: boolean;
  isAnalyticsOpen: boolean;
  isShortcutsDialogOpen: boolean;
  activeTheme: string;
  setFocused: (focused: boolean) => void;
  toggleFocused: () => void;
  setGlobalChatOpen: (open: boolean) => void;
  toggleGlobalChat: () => void;
  setSidebarOpen: (open?: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setAnalyticsOpen: (open: boolean) => void;
  setShortcutsDialogOpen: (open: boolean) => void;
  setTheme: (theme: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isFocused: false,
      isGlobalChatOpen: false,
      isSidebarOpen: true,
      isCommandPaletteOpen: false,
      isAnalyticsOpen: false,
      isShortcutsDialogOpen: false,
      activeTheme: 'default',
      setFocused: (isFocused) => set({ isFocused }),
      toggleFocused: () => set((state) => ({ isFocused: !state.isFocused })),
      setGlobalChatOpen: (isGlobalChatOpen) => set({ isGlobalChatOpen }),
      toggleGlobalChat: () => set((state) => ({ isGlobalChatOpen: !state.isGlobalChatOpen })),
      setSidebarOpen: (open) =>
        set((state) => ({ isSidebarOpen: open !== undefined ? open : !state.isSidebarOpen })),
      setCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
      setAnalyticsOpen: (isAnalyticsOpen) => set({ isAnalyticsOpen }),
      setShortcutsDialogOpen: (isShortcutsDialogOpen) => set({ isShortcutsDialogOpen }),
      setTheme: (activeTheme) => set({ activeTheme }),
    }),
    {
      name: 'ui-storage',
    },
  ),
);
