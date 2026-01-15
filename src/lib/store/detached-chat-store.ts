import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { MessageNode } from '@/lib/types';

interface DetachedChat {
    id: string;
    context: string;
    messages: any[]; // UIMessage equivalent
    position: { x: number; y: number };
}

interface DetachedChatState {
    popups: DetachedChat[];
    addPopup: (context: string, position: { x: number; y: number }) => void;
    removePopup: (id: string) => void;
    updatePopupMessages: (id: string, messages: any[]) => void;
    updatePopupPosition: (id: string, position: { x: number; y: number }) => void;
}

export const useDetachedChatStore = create<DetachedChatState>((set) => ({
    popups: [],
    addPopup: (context, position) => {
        const id = uuidv4();
        set((state) => ({
            popups: [
                ...state.popups,
                { id, context, messages: [], position }
            ]
        }));
    },
    removePopup: (id) => {
        set((state) => ({
            popups: state.popups.filter((p) => p.id !== id)
        }));
    },
    updatePopupMessages: (id, messages) => {
        set((state) => ({
            popups: state.popups.map((p) =>
                p.id === id ? { ...p, messages } : p
            )
        }));
    },
    updatePopupPosition: (id, position) => {
        set((state) => ({
            popups: state.popups.map((p) =>
                p.id === id ? { ...p, position } : p
            )
        }));
    }
}));
