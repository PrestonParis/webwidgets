import type { EventCategory } from '@/features/news/schemas/eventEnumSchemas';
import type {
    RankedFeedItem,
    TimelineEvent,
} from '@/features/news/schemas/eventTypes';

export type NewsTimeFilter = 'latest' | 'today' | 'week';

export interface NewsFeedFilters {
    category: EventCategory | 'all';
    source: string;
    time: NewsTimeFilter;
    query: string;
}

export interface NewsFeedResponse {
    items: RankedFeedItem[];
    timelines: TimelineEvent[];
    generatedAt: string;
    sourceCount: number;
}
