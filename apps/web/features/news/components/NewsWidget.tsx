'use client';

import Link from 'next/link';
import { Activity, RefreshCw } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { TimelineFeedList } from '@/features/news/components/TimelineFeedList';
import { useTimelineFeed } from '@/features/news/hooks/useTimelineFeed';

export default function NewsWidget({
    widgetId = 'news',
}: {
    widgetId?: string;
}) {
    const timeline = useTimelineFeed();
    const topItems = timeline.items.slice(0, 3);

    return (
        <WidgetShell
            icon={<Activity size={16} />}
            title="Timeline Intelligence"
            badge={
                <span className="text-[10px] font-bold text-emerald-500">
                    {timeline.isFetching ? 'SYNC' : `${topItems.length}`}
                </span>
            }
            widgetId={widgetId}
            widgetType="news"
            footerSlot={
                <div className="mt-3 flex items-center gap-3">
                    <Link
                        className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        href="/news"
                    >
                        Open timeline →
                    </Link>
                    <button
                        aria-label="Refresh Timeline Intelligence"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 disabled:opacity-50 dark:hover:text-zinc-100"
                        disabled={!timeline.isOnline || timeline.isFetching}
                        onClick={() => void timeline.refetch()}
                        type="button"
                    >
                        <RefreshCw
                            aria-hidden
                            className={
                                timeline.isFetching ? 'animate-spin' : ''
                            }
                            size={13}
                        />
                        Refresh
                    </button>
                </div>
            }
        >
            {timeline.isLoading ? (
                <p className="py-8 text-sm text-zinc-500" role="status">
                    Loading timeline…
                </p>
            ) : null}
            {timeline.isError ? (
                <p className="py-8 text-sm text-red-500" role="alert">
                    Timeline unavailable.
                </p>
            ) : null}
            {!timeline.isLoading && !timeline.isError && !topItems.length ? (
                <p className="py-8 text-sm text-zinc-500">
                    No timeline events yet.
                </p>
            ) : null}
            <TimelineFeedList compact items={topItems} />
        </WidgetShell>
    );
}
