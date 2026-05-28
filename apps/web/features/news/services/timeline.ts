import type {
    RankedFeedItem,
    TimelineEvent,
} from '@/features/news/types/events';

export function groupTimelineEvents(items: RankedFeedItem[]): TimelineEvent[] {
    const buckets = new Map<string, RankedFeedItem[]>();

    for (const item of items) {
        const published = new Date(item.publishedAt);
        const key = new Date(
            published.getFullYear(),
            published.getMonth(),
            published.getDate(),
            published.getHours(),
        ).toISOString();
        buckets.set(key, [...(buckets.get(key) ?? []), item]);
    }

    return [...buckets.entries()].map(([windowStart, bucket]) => ({
        id: `timeline-${windowStart}`,
        eventIds: bucket.map((item) => item.id),
        label: new Intl.DateTimeFormat('en', {
            hour: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(windowStart)),
        windowStart,
        windowEnd: new Date(
            new Date(windowStart).getTime() + 60 * 60 * 1000,
        ).toISOString(),
        density: bucket.length,
    }));
}
