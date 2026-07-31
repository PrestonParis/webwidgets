'use client';

import { Newspaper, RefreshCw, TrendingUp, Clock } from 'lucide-react';
import { useNewsFeed } from '@/features/news/hooks/useNewsFeed';
import { NewsControls } from '@/features/news/components/NewsControls';
import { NewsFeedList } from '@/features/news/components/NewsFeedList';
import { CoverageHealthPanel } from '@/features/news/components/CoverageHealth';
import { NewsSetupPrompt } from '@/features/news/components/NewsSetupPrompt';
import type { CoverageHealth } from '@/features/news/types/news';

function deriveCoverageHealth(
    sourceCount: number,
    itemCount: number,
    developingCount: number,
): CoverageHealth {
    return {
        sourcesChecked: sourceCount,
        storiesClustered: Math.floor(itemCount * 0.6),
        developingStories: developingCount,
        updatedLastHour: itemCount,
        conflictingReports: 0,
        lowConfidenceHidden: 0,
    };
}

export function NewsPage() {
    const {
        filters,
        setFilters,
        sources,
        items,
        filteredItems,
        timelines,
        isLoading,
        isFetching,
        refetch,
    } = useNewsFeed();

    const topStories = items.slice(0, 5);
    const developingCount = items.filter(
        (i) => i.urgency === 'breaking' || i.urgency === 'high',
    ).length;
    const health = deriveCoverageHealth(
        sources.length - 1,
        items.length,
        developingCount,
    );
    const hasItems = items.length > 0;

    return (
        <main className="mx-auto max-w-6xl px-5 py-8 lg:px-10">
            <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Newspaper
                        size={20}
                        className="text-zinc-400 dark:text-zinc-500"
                    />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                            News
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Your intelligence briefing
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => void refetch()}
                        disabled={isFetching}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    >
                        <RefreshCw
                            size={13}
                            className={isFetching ? 'animate-spin' : ''}
                        />
                        {isFetching ? 'Refreshing…' : 'Refresh'}
                    </button>
                </div>
            </header>

            <section className="mb-6 border-y border-zinc-200 py-4 dark:border-zinc-800">
                <NewsControls
                    filters={filters}
                    sources={sources}
                    onChange={setFilters}
                />
            </section>

            {isLoading ? (
                <div className="py-20 text-center text-sm text-zinc-500">
                    Loading your briefing…
                </div>
            ) : !hasItems ? (
                <NewsSetupPrompt />
            ) : (
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <section>
                        {topStories.length > 0 && (
                            <div className="mb-6">
                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                                    <TrendingUp size={15} />
                                    Top Stories
                                </div>
                                <NewsFeedList items={topStories} />
                            </div>
                        )}

                        {filteredItems.length > topStories.length && (
                            <div>
                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                                    <Clock size={15} />
                                    Latest
                                </div>
                                <NewsFeedList
                                    items={filteredItems.slice(
                                        topStories.length,
                                    )}
                                />
                            </div>
                        )}
                    </section>

                    <aside className="space-y-6">
                        <div>
                            <h2 className="mb-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                                Coverage Health
                            </h2>
                            <CoverageHealthPanel health={health} />
                        </div>

                        {timelines.length > 0 && (
                            <div className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
                                <h2 className="mb-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                                    Developing Stories
                                </h2>
                                <div className="space-y-2">
                                    {timelines.map((timeline) => (
                                        <div
                                            key={timeline.id}
                                            className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                                        >
                                            <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                                {timeline.label}
                                            </p>
                                            <p className="mt-0.5 text-xs text-zinc-500">
                                                {timeline.density}{' '}
                                                {timeline.density === 1
                                                    ? 'update'
                                                    : 'updates'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
                            <h2 className="mb-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                                Saved
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Stories you save will appear here.
                            </p>
                        </div>
                    </aside>
                </div>
            )}
        </main>
    );
}
