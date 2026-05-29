import { create } from 'zustand';
import type {
    Notification,
    NotificationCategory,
} from '../types/notifications';

interface AddNotificationInput {
    widgetId: string;
    title: string;
    body: string;
    category: NotificationCategory;
    href?: string;
}

interface NotificationStore {
    notifications: Notification[];
    addNotification: (input: AddNotificationInput) => void;
    clearAll: () => void;
    markWidgetRead: (widgetId: string) => void;
    markRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
    notifications: [],

    addNotification: ({ widgetId, title, body, category, href }) =>
        set((state) => ({
            notifications: [
                {
                    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    widgetId,
                    title,
                    body,
                    category,
                    read: false,
                    timestamp: Date.now(),
                    ...(href !== undefined ? { href } : {}),
                },
                ...state.notifications,
            ],
        })),

    clearAll: () => set({ notifications: [] }),

    markWidgetRead: (widgetId) =>
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.widgetId === widgetId ? { ...n, read: true } : n,
            ),
        })),

    markRead: (id) =>
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n,
            ),
        })),
}));
