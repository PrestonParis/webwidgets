export type AssetType =
    | 'stock'
    | 'crypto'
    | 'etf'
    | 'index'
    | 'other'
    | 'real_estate'
    | 'custom';

export interface WatchlistItem {
    id: string;
    userId: string;
    assetType: AssetType;
    symbol: string;
    displayName: string;
    currency: string;
    config: Record<string, unknown>; // {coinId?, zpid?, address?, notes?}
    createdAt: string;
}

export interface WatchlistReading {
    id: string;
    itemId: string;
    userId: string;
    value: number;
    source: string;
    fetchedAt: string;
    metadata: Record<string, unknown>;
}

export interface WatchlistItemWithLatest extends WatchlistItem {
    latest?: WatchlistReading;
    prev?: WatchlistReading;
}

export interface FetchResult {
    value: number | null;
    source: string;
    metadata: Record<string, unknown>;
    needsManual?: boolean;
}

export interface DbWatchlistItemRow {
    id: string;
    user_id: string;
    asset_type: string;
    symbol: string;
    display_name: string;
    currency: string;
    config: Record<string, unknown>;
    created_at: string;
}

export interface DbWatchlistReadingRow {
    id: string;
    item_id: string;
    user_id: string;
    value: number;
    source: string;
    fetched_at: string;
    metadata: Record<string, unknown>;
}

export function rowToItem(r: DbWatchlistItemRow): WatchlistItem {
    return {
        id: r.id,
        userId: r.user_id,
        assetType: r.asset_type as AssetType,
        symbol: r.symbol,
        displayName: r.display_name,
        currency: r.currency,
        config: r.config,
        createdAt: r.created_at,
    };
}

export function rowToReading(r: DbWatchlistReadingRow): WatchlistReading {
    return {
        id: r.id,
        itemId: r.item_id,
        userId: r.user_id,
        value: Number(r.value),
        source: r.source,
        fetchedAt: r.fetched_at,
        metadata: r.metadata,
    };
}
