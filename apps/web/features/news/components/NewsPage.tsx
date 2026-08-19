'use client';

import { Activity, CalendarClock, RefreshCw } from 'lucide-react';
import { TimelineFeedError } from '@/features/news/api/timelineFeedClient';
import { SourceHealthPanel } from '@/features/news/components/SourceHealthPanel';
import { TimelineControls } from '@/features/news/components/TimelineControls';
import { TimelineFeedList } from '@/features/news/components/TimelineFeedList';
import { useTimelineFeed } from '@/features/news/hooks/useTimelineFeed';

type TimelineView = ReturnType<typeof useTimelineFeed>;

function TimelineNotice({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
            role="status"
        >
            {children}
        </div>
    );
}

export function NewsPage() {
    const timeline = useTimelineFeed();
    return (
        <main className="mx-auto max-w-6xl px-5 py-8 lg:px-10">
            <TimelineHeader timeline={timeline} />
            <TimelineAlerts timeline={timeline} />
            <section
                aria-label="Timeline filters"
                className="mb-7 border-y border-zinc-200 py-5 dark:border-zinc-800"
            >
                <TimelineControls
                    eventTypes={timeline.availableEventTypes}
                    filters={timeline.filters}
                    onChange={timeline.setFilters}
                    sourceTypes={timeline.availableSourceTypes}
                />
            </section>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
                <TimelineEventSection timeline={timeline} />
                <aside>
                    <SourceHealthPanel
                        sources={timeline.sources}
                        unavailable={timeline.sourceHealthUnavailable}
                    />
                </aside>
            </div>
        </main>
    );
}

function TimelineHeader({ timeline }: { timeline: TimelineView }) {
    return (
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    <Activity aria-hidden size={18} /> Personal and selected
                    external events
                </div>
                <h1 className="text-3xl font-bold tracking-normal text-zinc-950 dark:text-zinc-50">
                    Timeline Intelligence
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
                    A chronological record of the signals WebWidgets is allowed
                    to collect for you.
                </p>
            </div>
            <button
                aria-label="Refresh timeline"
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 dark:border-zinc-700 dark:hover:bg-zinc-900"
                disabled={timeline.isFetching || !timeline.isOnline}
                onClick={() => void timeline.refetch()}
                type="button"
            >
                <RefreshCw
                    aria-hidden
                    className={timeline.isFetching ? 'animate-spin' : ''}
                    size={15}
                />{' '}
                Refresh
            </button>
        </header>
    );
}

function TimelineAlerts({ timeline }: { timeline: TimelineView }) {
    const impaired = timeline.sources.filter((source) =>
        ['stale', 'failing', 'reconnect_required'].includes(source.health),
    );
    return (
        <>
            {!timeline.isOnline ? (
                <div className="mb-5">
                    <TimelineNotice>
                        You are offline. Previously loaded events remain
                        visible, but the timeline cannot refresh.
                    </TimelineNotice>
                </div>
            ) : null}
            {impaired.length ? (
                <div className="mb-5">
                    <TimelineNotice>
                        {impaired.length}{' '}
                        {impaired.length === 1
                            ? 'source needs'
                            : 'sources need'}{' '}
                        attention. Healthy-source events remain available.
                    </TimelineNotice>
                </div>
            ) : null}
        </>
    );
}

function TimelineEventSection({ timeline }: { timeline: TimelineView }) {
    const hasFilters = Boolean(
        timeline.filters.sourceTypes.length ||
        timeline.filters.eventTypes.length ||
        timeline.filters.from ||
        timeline.filters.to,
    );
    const permissionError =
        timeline.error instanceof TimelineFeedError &&
        [401, 403].includes(timeline.error.status);

    return (
        <section aria-labelledby="timeline-events-heading">
            <h2
                className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300"
                id="timeline-events-heading"
            >
                <CalendarClock aria-hidden size={16} />
                Events
            </h2>
            {timeline.isLoading ? (
                <p className="py-10 text-sm text-zinc-500" role="status">
                    Loading your timeline…
                </p>
            ) : null}
            {permissionError ? (
                <p className="py-10 text-sm text-red-600" role="alert">
                    Sign in again to view your private timeline.
                </p>
            ) : null}
            {timeline.isError && !permissionError ? (
                <p className="py-10 text-sm text-red-600" role="alert">
                    Timeline Intelligence could not be loaded. Your source data
                    was not changed.
                </p>
            ) : null}
            {!timeline.isLoading &&
            !timeline.isError &&
            !timeline.items.length &&
            !hasFilters ? (
                <div className="rounded-md border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
                    <h3 className="font-semibold">
                        Your timeline is ready for its first event
                    </h3>
                    <p className="mt-2 text-sm text-zinc-500">
                        Connect a source or create a task, note, or document.
                        Events will appear after they are collected.
                    </p>
                </div>
            ) : null}
            {!timeline.isLoading &&
            !timeline.isError &&
            !timeline.items.length &&
            hasFilters ? (
                <p className="rounded-md bg-zinc-100 p-6 text-center text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                    No events match these filters.
                </p>
            ) : null}
            <TimelineFeedList items={timeline.items} />
            {timeline.hasNextPage ? (
                <button
                    className="mt-5 w-full rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                    disabled={timeline.isFetchingNextPage}
                    onClick={() => void timeline.fetchNextPage()}
                    type="button"
                >
                    {timeline.isFetchingNextPage
                        ? 'Loading…'
                        : 'Load earlier events'}
                </button>
            ) : null}
        </section>
    );
}
