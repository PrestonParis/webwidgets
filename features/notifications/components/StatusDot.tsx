'use client';

import { useNotificationStore } from '../store/useNotificationStore';
import { cn } from '@/lib/utils/utils';
import type { NotificationCategory } from '../types/notifications';

const CATEGORY_COLOR: Record<NotificationCategory, string> = {
    alert: 'bg-red-400',
    warning: 'bg-orange-400',
    info: 'bg-[#4f6ef7]',
    success: 'bg-emerald-400',
};

interface StatusDotProps {
    widgetId: string;
    active?: boolean;
    reserveSpace?: boolean;
    className?: string;
}

export function StatusDot({
    widgetId,
    active = false,
    reserveSpace = false,
    className,
}: StatusDotProps) {
    const notifications = useNotificationStore((s) => s.notifications);
    const unread = notifications.filter(
        (n) => n.widgetId === widgetId && !n.read,
    );
    const hasUnread = unread.length > 0;

    if (!hasUnread && !active) {
        if (reserveSpace) {
            return (
                <span
                    className={cn('inline-flex w-2 h-2 shrink-0', className)}
                />
            );
        }
        return null;
    }

    if (active && !hasUnread) {
        return (
            <span className={cn('relative flex h-2 w-2 shrink-0', className)}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
        );
    }

    const topNotification = unread[0];
    const topCategory: NotificationCategory =
        topNotification?.category ?? 'info';
    const color = CATEGORY_COLOR[topCategory];

    return (
        <span
            className={cn(
                'inline-flex rounded-full h-2 w-2 shrink-0',
                color,
                className,
            )}
        />
    );
}
