import { apiRouteFetch } from '@/lib/api/client';
import { timelineFeedResponseSchema } from '@/features/news/schemas/timelineFeedSchemas';
import type {
    TimelineFeedResponse,
    TimelineFilters,
} from '@/features/news/types/timelineFeed';

export class TimelineFeedError extends Error {
    constructor(public readonly status: number) {
        super(
            status === 401 || status === 403
                ? 'Timeline access requires a signed-in session.'
                : 'Timeline Intelligence could not be loaded.',
        );
    }
}

function timelineUrl(filters: TimelineFilters, cursor: string | null) {
    const params = new URLSearchParams({ limit: '25' });
    if (filters.sourceTypes.length)
        params.set('sources', filters.sourceTypes.join(','));
    if (filters.eventTypes.length)
        params.set('events', filters.eventTypes.join(','));
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (cursor) params.set('cursor', cursor);
    return `/api/news/feed?${params.toString()}` as `/api/${string}`;
}

export async function fetchTimelineFeed(
    filters: TimelineFilters,
    cursor: string | null,
): Promise<TimelineFeedResponse> {
    const response = await apiRouteFetch(timelineUrl(filters, cursor));
    if (!response.ok) throw new TimelineFeedError(response.status);
    return timelineFeedResponseSchema.parse(await response.json());
}
