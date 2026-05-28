import type { SupabaseClient } from '@supabase/supabase-js';
import { rowToItem, rowToReading } from '@/features/finance/types/watchlist';
import type {
    WatchlistItem,
    WatchlistItemWithLatest,
    WatchlistReading,
    AssetType,
    DbWatchlistItemRow,
    DbWatchlistReadingRow,
} from '@/features/finance/types/watchlist';

export async function listWatchlistItems(
    supabase: SupabaseClient,
    userId: string,
): Promise<WatchlistItemWithLatest[]> {
    const { data: items, error } = await supabase
        .from('watchlist_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    if (!items || items.length === 0) return [];

    const ids = (items as DbWatchlistItemRow[]).map((i) => i.id);
    const { data: readings } = await supabase
        .from('watchlist_readings')
        .select('*')
        .in('item_id', ids)
        .order('fetched_at', { ascending: false });

    const readingsByItem = new Map<string, WatchlistReading[]>();
    for (const r of (readings ?? []) as DbWatchlistReadingRow[]) {
        const list = readingsByItem.get(r.item_id) ?? [];
        list.push(rowToReading(r));
        readingsByItem.set(r.item_id, list);
    }

    return (items as DbWatchlistItemRow[]).map((i): WatchlistItemWithLatest => {
        const rs = readingsByItem.get(i.id) ?? [];
        const base = rowToItem(i);
        const result: WatchlistItemWithLatest = { ...base };
        if (rs[0]) result.latest = rs[0];
        if (rs[1]) result.prev = rs[1];
        return result;
    });
}

export async function addWatchlistItem(
    supabase: SupabaseClient,
    userId: string,
    input: {
        assetType: AssetType;
        symbol: string;
        displayName: string;
        currency?: string;
        config?: Record<string, unknown>;
    },
): Promise<WatchlistItem> {
    const response = await supabase
        .from('watchlist_items')
        .insert({
            user_id: userId,
            asset_type: input.assetType,
            symbol: input.symbol,
            display_name: input.displayName,
            currency: input.currency ?? 'USD',
            config: input.config ?? {},
        })
        .select()
        .single();
    const { error } = response;
    const data = response.data as unknown as DbWatchlistItemRow;
    if (error) throw error;
    return rowToItem(data);
}

export async function deleteWatchlistItem(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<void> {
    const { error } = await supabase
        .from('watchlist_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    if (error) throw error;
}

export async function updateWatchlistItem(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    input: Partial<{
        assetType: AssetType;
        symbol: string;
        displayName: string;
        currency: string;
        config: Record<string, unknown>;
    }>,
): Promise<WatchlistItem> {
    const payload: Record<string, unknown> = {};
    if (input.assetType !== undefined) payload.asset_type = input.assetType;
    if (input.symbol !== undefined) payload.symbol = input.symbol;
    if (input.displayName !== undefined)
        payload.display_name = input.displayName;
    if (input.currency !== undefined) payload.currency = input.currency;
    if (input.config !== undefined) payload.config = input.config;
    const response = await supabase
        .from('watchlist_items')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
    const { error } = response;
    const data = response.data as unknown as DbWatchlistItemRow;
    if (error) throw error;
    return rowToItem(data);
}

export async function addWatchlistReading(
    supabase: SupabaseClient,
    userId: string,
    itemId: string,
    value: number,
    source: string,
    metadata: Record<string, unknown> = {},
): Promise<WatchlistReading> {
    const response = await supabase
        .from('watchlist_readings')
        .insert({
            item_id: itemId,
            user_id: userId,
            value,
            source,
            metadata,
        })
        .select()
        .single();
    const { error } = response;
    const data = response.data as unknown as DbWatchlistReadingRow;
    if (error) throw error;
    return rowToReading(data);
}

export async function listWatchlistReadings(
    supabase: SupabaseClient,
    userId: string,
    itemId: string,
    limit = 90,
): Promise<WatchlistReading[]> {
    const { data, error } = await supabase
        .from('watchlist_readings')
        .select('*')
        .eq('item_id', itemId)
        .eq('user_id', userId)
        .order('fetched_at', { ascending: false })
        .limit(limit);
    if (error) throw error;
    return (data ?? []).map((r) => rowToReading(r as DbWatchlistReadingRow));
}
