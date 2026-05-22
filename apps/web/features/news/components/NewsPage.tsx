'use client';

import { Activity, Database, ListFilter, Newspaper } from 'lucide-react';
import { useNewsFeed } from '@/features/news/hooks/useNewsFeed';
import { NewsControls } from '@/features/news/components/NewsControls';
import { NewsFeedList } from '@/features/news/components/NewsFeedList';

export function NewsPage() {
    const {
        filters,
        setFilters,
        sources,
        filteredItems,
        timelines,
        isLoading,
        isFetching,
    } = useNewsFeed();

    return (
        <main className="mx-auto max-w-6xl px-5 py-8 lg:px-10">
            <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        <Newspaper size={18} />
                        Universal event ingestion
                    </div>
                    <h1 className="text-3xl font-bold tracking-normal text-zinc-950 dark:text-zinc-50">
                        News + Event Intelligence
                    </h1>
                </div>
                <div className="grid grid-cols-3 gap-3 text-right text-xs text-zinc-500">
                    <div>
                        <p className="font-bold text-zinc-950 dark:text-zinc-50">
                            {filteredItems.length}
                        </p>
                        <p>visible</p>
                    </div>
                    <div>
                        <p className="font-bold text-zinc-950 dark:text-zinc-50">
                            {sources.length - 1}
                        </p>
                        <p>sources</p>
                    </div>
                    <div>
                        <p className="font-bold text-zinc-950 dark:text-zinc-50">
                            {isFetching ? 'sync' : 'idle'}
                        </p>
                        <p>query</p>
                    </div>
                </div>
            </header>

            <section className="mb-7 border-y border-zinc-200 py-5 dark:border-zinc-800">
                <NewsControls
                    filters={filters}
                    sources={sources}
                    onChange={setFilters}
                />
            </section>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
                <section>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                        <ListFilter size={16} />
                        Ranked feed
                    </div>
                    {isLoading ? (
                        <p className="py-8 text-sm text-zinc-500">
                            Loading feed...
                        </p>
                    ) : (
                        <NewsFeedList items={filteredItems} />
                    )}
                </section>
                <aside className="space-y-6">
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                            <Activity size={16} />
                            Timeline groups
                        </div>
                        <div className="space-y-2">
                            {timelines.map((timeline) => (
                                <div
                                    key={timeline.id}
                                    className="rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                                >
                                    <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                                        {timeline.label}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        {timeline.density} events in window
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                            <Database size={16} />
                            Pipeline state
                        </div>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt>Zod validation</dt>
                                <dd>active</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt>BullMQ jobs</dt>
                                <dd>ready</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt>AI enrichment</dt>
                                <dd>queued</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt>Vector search</dt>
                                <dd>planned</dd>
                            </div>
                        </dl>
                    </div>
                </aside>
            </div>
        </main>
    );
}
