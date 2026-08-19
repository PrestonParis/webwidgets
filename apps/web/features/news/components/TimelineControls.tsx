'use client';

import type { TimelineFilters } from '@/features/news/types/timelineFeed';

type Period = 'all' | 'today' | 'week';

function periodStart(period: Period): string | null {
    if (period === 'all') return null;
    const date = new Date();
    if (period === 'today') date.setHours(0, 0, 0, 0);
    else date.setDate(date.getDate() - 7);
    return date.toISOString();
}

function selectedPeriod(from: string | null): Period {
    if (!from) return 'all';
    return new Date(from).toDateString() === new Date().toDateString()
        ? 'today'
        : 'week';
}

export function TimelineControls({
    filters,
    sourceTypes,
    eventTypes,
    onChange,
}: {
    filters: TimelineFilters;
    sourceTypes: string[];
    eventTypes: string[];
    onChange: (filters: TimelineFilters) => void;
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Source
                <select
                    aria-label="Filter timeline by source"
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                    onChange={(event) =>
                        onChange({
                            ...filters,
                            sourceTypes: event.target.value
                                ? [event.target.value]
                                : [],
                        })
                    }
                    value={filters.sourceTypes[0] ?? ''}
                >
                    <option value="">All sources</option>
                    {sourceTypes.map((source) => (
                        <option key={source} value={source}>
                            {source.replaceAll('_', ' ')}
                        </option>
                    ))}
                </select>
            </label>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Event type
                <select
                    aria-label="Filter timeline by event type"
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                    onChange={(event) =>
                        onChange({
                            ...filters,
                            eventTypes: event.target.value
                                ? [event.target.value]
                                : [],
                        })
                    }
                    value={filters.eventTypes[0] ?? ''}
                >
                    <option value="">All event types</option>
                    {eventTypes.map((eventType) => (
                        <option key={eventType} value={eventType}>
                            {eventType.replaceAll('.', ' ')}
                        </option>
                    ))}
                </select>
            </label>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Time range
                <select
                    aria-label="Filter timeline by time range"
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                    onChange={(event) =>
                        onChange({
                            ...filters,
                            from: periodStart(event.target.value as Period),
                            to: null,
                        })
                    }
                    value={selectedPeriod(filters.from)}
                >
                    <option value="all">All time</option>
                    <option value="today">Today</option>
                    <option value="week">Past 7 days</option>
                </select>
            </label>
        </div>
    );
}
