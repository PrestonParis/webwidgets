'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../hooks/useNotificationStore';
import { cn } from '@/lib/utils/utils';
import type {
    Notification,
    NotificationCategory,
} from '../types/notifications';

const CATEGORY_COLOR: Record<NotificationCategory, string> = {
    alert: 'bg-red-400',
    warning: 'bg-orange-400',
    info: 'bg-[#4f6ef7]',
    success: 'bg-emerald-400',
};

function timeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 48) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function NotificationItem({
    n,
    onRead,
}: {
    n: Notification;
    onRead: (id: string) => void;
}) {
    return (
        <button
            onClick={() => onRead(n.id)}
            className={cn(
                'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                'hover:bg-zinc-50 dark:hover:bg-zinc-900/60',
                n.read && 'opacity-45',
            )}
        >
            <span
                className={cn(
                    'mt-1 shrink-0 w-2 h-2 rounded-full',
                    CATEGORY_COLOR[n.category],
                )}
            />
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                    {n.title}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {n.body}
                </p>
            </div>
            <span className="shrink-0 text-[10px] text-zinc-400 mt-0.5 tabular-nums">
                {timeAgo(n.timestamp)}
            </span>
        </button>
    );
}

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const notifications = useNotificationStore((s) => s.notifications);
    const clearAll = useNotificationStore((s) => s.clearAll);
    const markRead = useNotificationStore((s) => s.markRead);

    const unreadCount = notifications.filter((n) => !n.read).length;
    const hasUnread = unreadCount > 0;

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((prev) => !prev)}
                aria-label="Notifications"
                className={cn(
                    'relative w-8 h-8 flex items-center justify-center rounded-xl transition-colors',
                    'text-zinc-500 dark:text-zinc-400',
                    'hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200',
                    open &&
                        'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200',
                )}
            >
                <Bell className="w-4 h-4" />
                {hasUnread && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#4f6ef7]" />
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -6 }}
                        transition={{ duration: 0.13, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-2 w-80 z-50 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                                    Notifications
                                </span>
                                {hasUnread && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#4f6ef7]/10 text-[#4f6ef7]">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <button
                                    onClick={() => clearAll()}
                                    className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
                                    <Bell className="w-6 h-6 mb-2 opacity-25" />
                                    <p className="text-xs">No notifications</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <NotificationItem
                                        key={n.id}
                                        n={n}
                                        onRead={markRead}
                                    />
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
