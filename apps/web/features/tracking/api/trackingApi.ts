'use client';

import { db } from '@/lib/db/supabase';
import type {
    TrackingEntry,
    BaseTrackingEntry,
    FetchOptions,
    DbTrackingRow,
} from '@/features/tracking/types/trackingEntryTypes';
import type { EntrySource } from '@/features/tracking/types/trackingCategoryTypes';
import { OLD_STORAGE_KEY } from '@/features/tracking/constants';

function rowToEntry(row: DbTrackingRow): TrackingEntry {
    return {
        id: row.id,
        userId: row.user_id,
        category: row.category,
        entryDate: row.entry_date,
        loggedAt: row.logged_at,
        metadata: row.metadata,
        tags: row.tags,
        ...(row.notes !== null && { notes: row.notes }),
        source: row.source as EntrySource,
        createdAt: row.created_at,
    };
}

export async function fetchEntries(
    userId: string,
    opts: FetchOptions = {},
): Promise<TrackingEntry[]> {
    let query = db
        .from('tracking_entries')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false });

    if (opts.category) query = query.eq('category', opts.category);
    if (opts.from) query = query.gte('entry_date', opts.from);
    if (opts.to) query = query.lte('entry_date', opts.to);
    if (opts.limit) query = query.limit(opts.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as DbTrackingRow[]).map(rowToEntry);
}

export async function addEntry(
    userId: string,
    entry: BaseTrackingEntry,
): Promise<TrackingEntry> {
    const row = {
        user_id: userId,
        category: entry.category,
        entry_date: entry.entryDate,
        metadata: entry.metadata,
        tags: entry.tags,
        source: entry.source,
        ...(entry.notes !== undefined && { notes: entry.notes }),
    };

    const result = await db
        .from('tracking_entries')
        .insert(row)
        .select()
        .single();

    if (result.error) throw result.error;
    return rowToEntry(result.data as unknown as DbTrackingRow);
}

export async function updateEntry(
    userId: string,
    id: string,
    updates: Partial<BaseTrackingEntry>,
): Promise<TrackingEntry> {
    const patch: Record<string, unknown> = {};
    if (updates.category !== undefined) patch['category'] = updates.category;
    if (updates.entryDate !== undefined)
        patch['entry_date'] = updates.entryDate;
    if (updates.metadata !== undefined) patch['metadata'] = updates.metadata;
    if (updates.tags !== undefined) patch['tags'] = updates.tags;
    if (updates.source !== undefined) patch['source'] = updates.source;
    if (updates.notes !== undefined) patch['notes'] = updates.notes;

    const result = await db
        .from('tracking_entries')
        .update(patch)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

    if (result.error) throw result.error;
    return rowToEntry(result.data as DbTrackingRow);
}

export async function deleteEntry(userId: string, id: string): Promise<void> {
    const { error } = await db
        .from('tracking_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) throw error;
}

type OldEntry = Record<string, unknown> & {
    type: string;
    date: string;
    timestamp: string;
};

function buildMetadataFromOld(entry: OldEntry): Record<string, unknown> {
    const skip = new Set(['type', 'date', 'id', 'userId', 'timestamp']);
    return Object.fromEntries(
        Object.entries(entry).filter(([k]) => !skip.has(k)),
    );
}

export async function migrateFromLocalStorage(userId: string): Promise<number> {
    const raw = localStorage.getItem(OLD_STORAGE_KEY);
    if (!raw) return 0;

    let old: OldEntry[];
    try {
        old = JSON.parse(raw) as OldEntry[];
    } catch {
        return 0;
    }

    const mine = old.filter((e) => e['userId'] === userId);
    if (mine.length === 0) return 0;

    const rows = mine.map((e) => ({
        user_id: userId,
        category: e.type,
        entry_date: e.date,
        logged_at: e.timestamp,
        metadata: buildMetadataFromOld(e),
        tags: [] as string[],
        source: 'manual',
    }));

    const { error } = await db.from('tracking_entries').insert(rows);
    if (error) throw error;

    const remaining = old.filter((e) => e['userId'] !== userId);
    if (remaining.length === 0) {
        localStorage.removeItem(OLD_STORAGE_KEY);
    } else {
        localStorage.setItem(OLD_STORAGE_KEY, JSON.stringify(remaining));
    }

    return rows.length;
}
