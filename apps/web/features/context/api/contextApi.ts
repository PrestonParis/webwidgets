import type {
    ContextEntry,
    UpsertEntryPayload,
} from '@/features/context/types/context';
import type { ContextGraph } from '@/features/context/types/context';
import { cachedJson, clearCachedJson } from '@/lib/api/requestCache';

export async function fetchEntries(): Promise<ContextEntry[]> {
    const json = await cachedJson<{ entries: ContextEntry[] }>(
        '/api/context/entries',
        { ttlMs: 10_000 },
    );
    return json.entries;
}

export async function upsertEntry(
    payload: UpsertEntryPayload,
): Promise<ContextEntry> {
    const res = await fetch('/api/context/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to upsert context entry');
    clearCachedJson('/api/context/entries');
    const json = (await res.json()) as { entry: ContextEntry };
    return json.entry;
}

export async function batchUpsertEntries(
    payloads: UpsertEntryPayload[],
): Promise<void> {
    const res = await fetch('/api/context/entries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: payloads }),
    });
    if (!res.ok) throw new Error('Failed to batch upsert context entries');
    clearCachedJson('/api/context/entries');
}

export async function deleteEntry(entityId: string): Promise<void> {
    const res = await fetch(
        `/api/context/entries/${encodeURIComponent(entityId)}`,
        {
            method: 'DELETE',
        },
    );
    if (!res.ok) throw new Error('Failed to delete context entry');
    clearCachedJson('/api/context/entries');
}

export async function fetchGraph(): Promise<ContextGraph> {
    const res = await fetch('/api/context/graph');
    if (!res.ok) throw new Error('Failed to fetch context graph');
    return res.json() as Promise<ContextGraph>;
}
