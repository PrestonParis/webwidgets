'use client';

import Header from '@/features/ui/components/Header';
import { useActivityEvents } from '@/features/activity/hooks/useActivityEvents';
import { useActivityFoundation } from '@/features/activity/hooks/useActivityFoundation';
import { ActivityFeedWidget } from '@/features/activity/components/ActivityFeedWidget';

export function ActivityPage() {
    const { sources } = useActivityFoundation();
    const query = useActivityEvents();
    const events = query.data ?? [];

    return (
        <>
            <Header />
            <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 md:px-6">
                <div className="mx-auto max-w-6xl space-y-5">
                    <div>
                        <p className="text-xs font-semibold uppercase text-zinc-500">
                            Event infrastructure
                        </p>
                        <h1 className="text-2xl font-semibold">
                            Activity Feed
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">
                            Real product events from Supabase-backed activity
                            sources. Empty states mean no events exist, not
                            that the UI invented sample activity.
                        </p>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
                        <ActivityFeedWidget />
                        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-sm font-semibold">
                                    Event Stream
                                </h2>
                                <span className="text-xs text-zinc-500">
                                    {events.length} events
                                </span>
                            </div>
                            {query.isLoading && (
                                <p className="text-sm text-zinc-500">
                                    Loading events.
                                </p>
                            )}
                            {query.isError && (
                                <p className="text-sm text-amber-600">
                                    Activity API is unavailable.
                                </p>
                            )}
                            {!query.isLoading &&
                                !query.isError &&
                                events.length === 0 && (
                                    <p className="rounded border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">
                                        No real activity events have been
                                        recorded for this user.
                                    </p>
                                )}
                            <div className="space-y-3">
                                {events.map((event) => (
                                    <article
                                        key={event.id}
                                        className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h3 className="text-sm font-medium">
                                                {event.title}
                                            </h3>
                                            <span className="text-xs text-zinc-500">
                                                {new Date(
                                                    event.createdAt,
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                        {event.body && (
                                            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                                                {event.body}
                                            </p>
                                        )}
                                        <p className="mt-2 text-xs uppercase text-zinc-500">
                                            {event.source} · {event.severity}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        </section>
                    </div>
                    <section className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                        <h2 className="mb-2 font-semibold">
                            Registered Sources
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {sources.map((source) => (
                                <span
                                    key={source}
                                    className="rounded border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-800"
                                >
                                    {source}
                                </span>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
