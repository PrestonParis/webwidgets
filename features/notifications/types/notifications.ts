export type NotificationCategory = 'info' | 'alert' | 'success' | 'warning';

export interface Notification {
    id: string;
    widgetId: string;
    title: string;
    body: string;
    category: NotificationCategory;
    read: boolean;
    timestamp: number;
}
