import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface NotificationItem {
    id: string;
    title: string;
    description?: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'loading';
    timestamp: number;
    read: boolean;
    actionLabel?: string;
    actionUrl?: string;
}

interface NotificationState {
    notifications: NotificationItem[];
    unreadCount: number;

    addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => string;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            notifications: [],
            unreadCount: 0,

            addNotification: (item) => {
                const id = uuidv4();
                const newNotification: NotificationItem = {
                    ...item,
                    id,
                    timestamp: Date.now(),
                    read: false
                };

                set(state => {
                    const updated = [newNotification, ...state.notifications];
                    return {
                        notifications: updated,
                        unreadCount: state.unreadCount + 1
                    };
                });
                return id;
            },

            markAsRead: (id) => set(state => {
                const updated = state.notifications.map(n =>
                    n.id === id ? { ...n, read: true } : n
                );
                return {
                    notifications: updated,
                    unreadCount: updated.filter(n => !n.read).length
                };
            }),

            markAllAsRead: () => set(state => ({
                notifications: state.notifications.map(n => ({ ...n, read: true })),
                unreadCount: 0
            })),

            clearAll: () => set({ notifications: [], unreadCount: 0 }),

            removeNotification: (id) => set(state => {
                const updated = state.notifications.filter(n => n.id !== id);
                return {
                    notifications: updated,
                    unreadCount: updated.filter(n => !n.read).length
                };
            })
        }),
        {
            name: 'notification-storage',
        }
    )
);
