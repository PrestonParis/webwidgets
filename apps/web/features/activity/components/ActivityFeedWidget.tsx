'use client';

import { AlertCircle, CheckCircle2, Info, Loader2, Radio } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useActivityEvents } from '@/features/activity/hooks/useActivityEvents';
import type { ActivityEventSeverity } from '@/features/activity/types/activity';

const icons: Record<ActivityEventSeverity, React.ReactNode> = {
    info: <Info size={14} />,
    success: <CheckCircle2 size={14} />,
    warning: <AlertCircle size={14} />,
    critical: <AlertCircle size={14} />,
};

export function ActivityFeedWidget({
    widgetId = 'activity',
}: {
    widgetId?: string;
}) {
    const query = useActivityEvents();
    const events = query.data ?? [];

    return (
        <WidgetShell
            icon={<Radio size={16} />}
            title="Activity Feed"
            badge={query.isLoading ? 'loading' : `${events.length} events`}
            widgetId={widgetId}
            widgetType="activity"
            footerHref="/activity"
            footerLabel="Open feed ->"
        >
            {query.isLoading && (
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Loader2 className="animate-spin" size={16} />
                    Loading activity
                </div>
            )}
            {query.isError && (
                <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    Activity events are unavailable.
                </div>
            )}
            {!query.isLoading && !query.isError && events.length === 0 && (
                <div className="rounded border border-dashed border-zinc-300 p-3 text-xs text-zinc-500 dark:border-zinc-700">
                    No real activity events have been recorded yet.
                </div>
            )}
            {events.length > 0 && (
                <div className="space-y-2">
                    {events.slice(0, 5).map((event) => (
                        <div
                            key={event.id}
                            className="rounded-lg border border-zinc-100 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900"
                        >
                            <div className="flex items-start gap-2">
                                <span className="mt-0.5 text-zinc-500">
                                    {icons[event.severity]}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                                        {event.title}
                                    </p>
                                    <p className="text-[10px] text-zinc-500">
                                        {event.source} ·{' '}
                                        {new Date(
                                            event.createdAt,
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </WidgetShell>
    );
}
