'use client';

// Write operations route through /api/tracking/entries so activity events are
// published server-side. Read operations (fetchEntries) retain direct Supabase
// access for widget performance. migrateFromLocalStorage remains direct since
// it's a one-time migration that writes many rows without needing activity events.

import { db } from '@/lib/db/supabase';
import type {
    TrackingEntry,
    BaseTrackingEntry,
    FetchOptions,
    DbTrackingRow,
} from '@/features/tracking/types/trackingEntries';
import type { EntrySource } from '@/features/tracking/types/trackingCategories';
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

// Read path: stays direct for widget performance (no activity event on reads)
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

// Write path: route through server API for activity event publishing
export async function addEntry(
    _userId: string,
    entry: BaseTrackingEntry,
): Promise<TrackingEntry> {
    const res = await fetch('/api/tracking/entries', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            category: entry.category,
            entryDate: entry.entryDate,
            metadata: entry.metadata,
            tags: entry.tags,
            source: entry.source ?? 'manual',
            ...(entry.notes !== undefined ? { notes: entry.notes } : {}),
        }),
    });
    if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(
            err.error ?? `tracking entry create failed: ${res.status}`,
        );
    }
    const row = (await res.json()) as DbTrackingRow;
    return rowToEntry(row);
}

export async function updateEntry(
    _userId: string,
    id: string,
    updates: Partial<BaseTrackingEntry>,
): Promise<TrackingEntry> {
    const res = await fetch(`/api/tracking/entries/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...(updates.category !== undefined
                ? { category: updates.category }
                : {}),
            ...(updates.entryDate !== undefined
                ? { entryDate: updates.entryDate }
                : {}),
            ...(updates.metadata !== undefined
                ? { metadata: updates.metadata }
                : {}),
            ...(updates.tags !== undefined ? { tags: updates.tags } : {}),
            ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
        }),
    });
    if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(
            err.error ?? `tracking entry update failed: ${res.status}`,
        );
    }
    const row = (await res.json()) as DbTrackingRow;
    return rowToEntry(row);
}

export async function deleteEntry(_userId: string, id: string): Promise<void> {
    const res = await fetch(`/api/tracking/entries/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok && res.status !== 204) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(
            err.error ?? `tracking entry delete failed: ${res.status}`,
        );
    }
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

// One-time migration from localStorage — remains direct since it's bulk import
// without meaningful activity signal (historical data, not new user actions)
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
