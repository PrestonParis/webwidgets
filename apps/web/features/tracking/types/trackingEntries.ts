import type { EntrySource, TrackingCategory } from './trackingCategories';

export type TrackingMetadata = Record<string, unknown>;

export interface TrackingEntry {
    id: string;
    userId: string;
    category: TrackingCategory;
    entryDate: string;
    loggedAt: string;
    metadata: TrackingMetadata;
    tags: string[];
    notes?: string;
    source: EntrySource;
    createdAt: string;
}

export type BaseTrackingEntry = Omit<
    TrackingEntry,
    'id' | 'userId' | 'loggedAt' | 'createdAt'
>;

export interface FetchOptions {
    category?: TrackingCategory;
    from?: string;
    to?: string;
    limit?: number;
}

export interface DbTrackingRow {
    id: string;
    user_id: string;
    category: string;
    entry_date: string;
    logged_at: string;
    metadata: Record<string, unknown>;
    tags: string[];
    notes: string | null;
    source: string;
    created_at: string;
}
