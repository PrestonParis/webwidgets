'use client';

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
            title="News Intel"
            badge={
                <span className="text-[10px] font-bold text-emerald-500">
                    {isFetching ? 'LIVE' : `${topItems.length}`}
                </span>
            }
            widgetId={widgetId}
            widgetType="news"
            footerHref="/news"
            footerLabel="Open event feed ->"
            footerSlot={
                <button
                    onClick={() => void refetch()}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                    <RefreshCw
                        size={13}
                        className={isFetching ? 'animate-spin' : ''}
                    />
                    Refresh
                </button>
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
