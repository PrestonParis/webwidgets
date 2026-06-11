'use client';

import Link from 'next/link';
import { useWidgetSnapshot } from '@/features/dashboard/lib/DashboardSnapshotContext';
import type {
    ActivityWidgetData,
    ActivityEvent,
} from '@/features/activity/types/activity';

const SOURCE_ICONS: Record<string, string> = {
    artifact: '🤖',
    file: '📄',
    email: '✉️',
    calendar: '📅',
    tracking: '📊',
    automation: '⚙️',
    finance: '💰',
    integrations: '🔗',
    onboarding: '🚀',
    system: '🖥️',
    news: '📰',
    todo: '✅',
    document: '📝',
    memory: '🧠',
    reading: '📖',
    collaboration: '🤝',
};

const SEVERITY_COLORS: Record<string, string> = {
    info: 'bg-blue-400',
    success: 'bg-green-400',
    warning: 'bg-amber-400',
    critical: 'bg-red-500',
};

function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return 'now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
}

function EventContent({ event }: { event: ActivityEvent }) {
    const isRead = !!event.readAt;
    const icon = SOURCE_ICONS[event.source] ?? '📌';
    const dot = SEVERITY_COLORS[event.severity] ?? 'bg-blue-400';

    return (
        <>
            <div className="mt-1.5 shrink-0 w-1.5 h-1.5">
                {!isRead && (
                    <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                )}
            </div>
            <span className="shrink-0 text-sm leading-none mt-0.5">{icon}</span>
            <div className="flex-1 min-w-0">
                <p
                    className={[
                        'text-xs truncate leading-snug',
                        isRead
                            ? 'text-gray-500 dark:text-zinc-400'
                            : 'text-gray-800 dark:text-zinc-100 font-medium',
                    ].join(' ')}
                >
                    {event.title}
                </p>
                {event.body && (
                    <p className="text-xs text-gray-400 dark:text-zinc-500 truncate mt-0.5">
                        {event.body}
                    </p>
                )}
            </div>
            <span className="shrink-0 text-xs text-gray-400 dark:text-zinc-500 tabular-nums mt-0.5">
                {relativeTime(event.occurredAt)}
            </span>
        </>
    );
}

interface ActivityWidgetProps {
    widgetId?: string;
}

export function ActivityWidget({
    widgetId = 'widget-activity',
}: ActivityWidgetProps) {
    const snapshot = useWidgetSnapshot<ActivityWidgetData>(widgetId);
    const isLoading = !snapshot || snapshot.status === 'loading';
    const data =
        snapshot?.status === 'ready'
            ? (snapshot.data as ActivityWidgetData | undefined)
            : undefined;

    const events = data?.events ?? [];
    const unreadCount = data?.unreadCount ?? 0;

    if (isLoading) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
                        Activity
                    </span>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                        Loading…
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
                        Activity
                    </span>
                    {unreadCount > 0 && (
                        <span
                            aria-label={`${unreadCount} unread activity events`}
                            className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-indigo-500 text-white text-xs font-semibold"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </div>
                <Link
                    href="/activity"
                    className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                    View all →
                </Link>
            </div>

            {/* Event list */}
            <div className="flex-1 overflow-y-auto">
                {events.length === 0 ? (
                    <div className="flex items-center justify-center h-full py-8">
                        <p className="text-xs text-gray-400 dark:text-zinc-500">
                            No recent activity
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-50 dark:divide-zinc-800/60">
                        {events.map((event) => (
                            <li key={event.id}>
                                {event.actionUrl ? (
                                    <Link
                                        href={event.actionUrl}
                                        className={[
                                            'flex items-start gap-2.5 px-4 py-2.5',
                                            'hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors',
                                        ].join(' ')}
                                    >
                                        <EventContent event={event} />
                                    </Link>
                                ) : (
                                    <div className="flex items-start gap-2.5 px-4 py-2.5">
                                        <EventContent event={event} />
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default ActivityWidget;
