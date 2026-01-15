import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    isFocused: boolean;
    isGlobalChatOpen: boolean;
    activeTheme: string;
    setFocused: (focused: boolean) => void;
    toggleFocused: () => void;
    toggleGlobalChat: () => void;
    setTheme: (theme: string) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            isFocused: false,
            isGlobalChatOpen: false,
            activeTheme: 'default',
            setFocused: (isFocused) => set({ isFocused }),
            toggleFocused: () => set((state) => ({ isFocused: !state.isFocused })),
            toggleGlobalChat: () => set((state) => ({ isGlobalChatOpen: !state.isGlobalChatOpen })),
            setTheme: (activeTheme) => set({ activeTheme }),
        }),
        {
            name: 'ui-storage',
        }
    )
);
