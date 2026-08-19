export type SourceHealthState =
    | 'connected'
    | 'syncing'
    | 'healthy'
    | 'stale'
    | 'failing'
    | 'disabled'
    | 'reconnect_required';

export interface TimelineRelatedEvent {
    id: string;
    title: string;
}

export interface TimelineFeedItem {
    id: string;
    eventType: string;
    sourceType: string;
    title: string;
    summary: string | null;
    occurredAt: string;
    ingestedAt: string;
    updatedAt: string;
    state: string;
    revision: number;
    sourceLabel: string;
    sourceUrl: string | null;
    sourceRecordTable: string | null;
    sourceRecordId: string | null;
    relatedStoryKey: string | null;
    relatedEvents: TimelineRelatedEvent[];
}

export interface TimelineSourceHealth {
    id: string;
    providerId: string;
    label: string;
    health: SourceHealthState;
    lastCheckedAt: string | null;
    lastSucceededAt: string | null;
    nextSyncAt: string | null;
    failureCount: number;
    issueCode: string | null;
}

export interface TimelineFeedResponse {
    items: TimelineFeedItem[];
    sources: TimelineSourceHealth[];
    availableSourceTypes: string[];
    availableEventTypes: string[];
    generatedAt: string;
    nextCursor: string | null;
    hasMore: boolean;
    sourceHealthUnavailable: boolean;
}

export interface TimelineFilters {
    sourceTypes: string[];
    eventTypes: string[];
    from: string | null;
    to: string | null;
}
