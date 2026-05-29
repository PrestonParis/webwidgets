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
import { readOnboardingProfile } from '@/features/onboarding/lib/profileStorage';
import { buildOnboardingContextPayloads } from '@/features/onboarding/lib/workspaceGeneration';
import { fetchOnboardingProfile } from '@/features/onboarding/services/onboardingService';
import type {
    ContextEntry,
    ContextGraph,
    UpsertEntryPayload,
} from '@/features/context/types/context';
import type { OnboardingProfile } from '@/features/onboarding/types/profile';

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
        if (!userId) {
            setLoading(false);
            return;
        }
        try {
            setError(null);
            const data = await fetchEntries();
            if (data.length > 0) {
                setEntries(data);
                return;
            }

            const seeded = await buildSeedEntries(userId);
            if (seeded.length > 0) {
                setEntries(seeded);
                void batchUpsertEntries(seeded.map(entryToPayload)).catch(
                    () => undefined,
                );
                return;
            }

            setEntries([]);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to load context',
            );
            const seeded = userId ? await buildSeedEntries(userId) : [];
            if (seeded.length > 0) {
                setEntries(seeded);
                setError(null);
            }
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            setLoading(false);
            return;
        }
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

async function buildSeedEntries(userId: string): Promise<ContextEntry[]> {
    const localProfile = readOnboardingProfile(userId);
    if (hasContextSeedData(localProfile))
        return profileToSeedEntries(userId, localProfile);

    try {
        const remoteProfile = await fetchOnboardingProfile(userId);
        if (remoteProfile && hasContextSeedData(remoteProfile)) {
            return profileToSeedEntries(userId, remoteProfile);
        }
    } catch {
        return [];
    }

    return [];
}

function hasContextSeedData(profile: OnboardingProfile) {
    return (
        profile.completed ||
        profile.goals.length > 0 ||
        profile.selectedWidgetTypes.length > 0 ||
        profile.enabledIntegrationIds.length > 0
    );
}

function profileToSeedEntries(
    userId: string,
    profile: OnboardingProfile,
): ContextEntry[] {
    if (
        !profile.completed &&
        profile.goals.length === 0 &&
        profile.selectedWidgetTypes.length === 0 &&
        profile.enabledIntegrationIds.length === 0
    ) {
        return [];
    }

    return buildOnboardingContextPayloads(
        '',
        profile.goals,
        profile.selectedWidgetTypes,
        profile.enabledIntegrationIds,
        profile.intent,
    ).map((payload) => ({
        id: `seed-${payload.entityId}`,
        userId,
        entryType: payload.entryType,
        entityId: payload.entityId,
        label: payload.label,
        data: payload.data ?? {},
        linkedTo: payload.linkedTo ?? [],
        createdAt: profile.updatedAt,
        updatedAt: profile.updatedAt,
    }));
}

function entryToPayload(entry: ContextEntry): UpsertEntryPayload {
    return {
        entityId: entry.entityId,
        entryType: entry.entryType,
        label: entry.label,
        data: entry.data,
        linkedTo: entry.linkedTo,
    };
}
