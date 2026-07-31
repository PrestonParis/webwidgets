import type { EventCategory } from '@/features/news/schemas/eventEnumSchemas';
import type {
    RankedFeedItem,
    TimelineEvent,
} from '@/features/news/types/events';

export type NewsTimeFilter = 'latest' | 'today' | 'week';

export type NewsCategory =
    | 'all'
    | 'politics'
    | 'government'
    | 'courts'
    | 'elections'
    | 'economy'
    | 'markets'
    | 'technology'
    | 'ai'
    | 'world'
    | 'war'
    | 'culture'
    | 'religion'
    | 'local';

export type NewsTab = 'top' | 'for-you' | 'saved' | NewsCategory;

export type NewsMode =
    | 'briefing'
    | 'comparison'
    | 'market'
    | 'civic'
    | 'research';

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

export interface CoverageHealth {
    sourcesChecked: number;
    storiesClustered: number;
    developingStories: number;
    updatedLastHour: number;
    conflictingReports: number;
    lowConfidenceHidden: number;
}

export interface UserNewsPreferences {
    topics: NewsCategory[];
    sources: string[];
    mode: NewsMode;
}
