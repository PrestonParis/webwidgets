'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
    fetchEntries,
    upsertEntry,
    batchUpsertEntries,
    deleteEntry,
} from '@/features/context/api/contextApi';
import { buildContextGraph } from '@/features/context/lib/graphBuilder';
import type {
    ContextEntry,
    ContextGraph,
    UpsertEntryPayload,
} from '@/features/context/types/context';

interface UseContextGraphReturn {
    graph: ContextGraph;
    entries: ContextEntry[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    upsert: (payload: UpsertEntryPayload) => Promise<void>;
    batchUpsert: (payloads: UpsertEntryPayload[]) => Promise<void>;
    remove: (entityId: string) => Promise<void>;
}

export function useContextGraph(): UseContextGraphReturn {
    const { userId, status } = useAuth();
    const [entries, setEntries] = useState<ContextEntry[]>([]);
    const [dataLoading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!userId) return;
        try {
            setError(null);
            const data = await fetchEntries();
            setEntries(data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to load context',
            );
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (status !== 'authenticated') return;
        const timeoutId = window.setTimeout(() => {
            void refresh();
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [status, refresh]);

    const upsert = useCallback(async (payload: UpsertEntryPayload) => {
        const updated = await upsertEntry(payload);
        setEntries((prev) => {
            const idx = prev.findIndex((e) => e.entityId === updated.entityId);
            return idx >= 0
                ? prev.map((e, i) => (i === idx ? updated : e))
                : [...prev, updated];
        });
    }, []);

    const batchUpsert = useCallback(
        async (payloads: UpsertEntryPayload[]) => {
            await batchUpsertEntries(payloads);
            await refresh();
        },
        [refresh],
    );

    const remove = useCallback(async (entityId: string) => {
        await deleteEntry(entityId);
        setEntries((prev) => prev.filter((e) => e.entityId !== entityId));
    }, []);

    const graph = useMemo(() => buildContextGraph(entries), [entries]);

    return {
        graph,
        entries,
        loading: status === 'authenticated' ? dataLoading : false,
        error,
        refresh,
        upsert,
        batchUpsert,
        remove,
    };
}
