'use client';

import Link from 'next/link';
import { Newspaper, RefreshCw } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useNewsFeed } from '@/features/news/hooks/useNewsFeed';
import { NewsFeedList } from '@/features/news/components/NewsFeedList';

export default function NewsWidget({
    widgetId = 'news',
}: {
    widgetId?: string;
}) {
    const { filteredItems, isLoading, isError, refetch, isFetching } =
        useNewsFeed();
    const topItems = filteredItems.slice(0, 3);

    return (
        <WidgetShell
            icon={<Newspaper size={16} />}
            title="News"
            badge={
                <span className="text-[10px] font-bold text-emerald-500">
                    {isFetching ? 'LIVE' : `${topItems.length}`}
                </span>
            }
            widgetId={widgetId}
            widgetType="news"
            footerSlot={
                <div className="mt-3 flex items-center gap-3">
                    <Link
                        href="/news"
                        className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                        View all →
                    </Link>
                    <button
                        onClick={() => void refetch()}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                        <RefreshCw
                            size={13}
                            className={isFetching ? 'animate-spin' : ''}
                        />
                        Refresh
                    </button>
                </div>
            }
        >
            {isLoading && (
                <div className="py-8 text-sm text-zinc-500">
                    Loading intelligence stream...
                </div>
            )}
            {isError && (
                <div className="py-8 text-sm text-red-500">
                    Feed state failed to load.
                </div>
            )}
            {!isLoading && !isError && (
                <NewsFeedList items={topItems} compact />
            )}
        </WidgetShell>
    );
}
