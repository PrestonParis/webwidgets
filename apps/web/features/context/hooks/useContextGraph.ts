'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
    CONTEXT_GRAPH_MUTATED_EVENT,
    fetchGraph,
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
    const [graph, setGraph] = useState<ContextGraph>({
        nodes: [],
        edges: [],
    });
    const [dataLoading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const refreshingRef = useRef(false);
    const suppressNextMutationRef = useRef(false);

    const refresh = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }
        if (refreshingRef.current) return;
        refreshingRef.current = true;
        try {
            setError(null);
            const remoteGraph = await fetchGraph();
            if (remoteGraph.nodes.length > 0) {
                setGraph(normalizeGraph(remoteGraph));
                return;
            }

            // DB is empty, try adapter endpoint as fallback
            console.log('Context tables empty, trying adapter endpoint...');
            try {
                const adapterRes = await apiRouteFetch(
                    '/api/context/graph/from-adapters',
                );
                if (adapterRes.ok) {
                    const adapterData = await adapterRes.json();
                    if (
                        adapterData.graph &&
                        adapterData.graph.nodes.length > 0
                    ) {
                        console.log(
                            `Loaded ${adapterData.graph.nodes.length} nodes from adapters`,
                            adapterData.summary,
                        );
                        setGraph(normalizeGraph(adapterData.graph));
                        return;
                    }
                }
            } catch (adapterError) {
                console.error('Adapter endpoint failed:', adapterError);
            }

            const seeded = await buildSeedEntries(userId);
            if (seeded.length > 0) {
                setGraph(buildContextGraph(seeded));
                suppressNextMutationRef.current = true;
                void batchUpsertEntries(seeded.map(entryToPayload)).catch(
                    () => undefined,
                );
                return;
            }

            setGraph({ nodes: [], edges: [] });
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to load context',
            );
            const seeded = userId ? await buildSeedEntries(userId) : [];
            if (seeded.length > 0) {
                setGraph(buildContextGraph(seeded));
                setError(null);
            }
        } finally {
            setLoading(false);
            refreshingRef.current = false;
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
        setGraph((prevGraph) => {
            const prev = prevGraph.nodes;
            const idx = prev.findIndex((e) => e.entityId === updated.entityId);
            const nodes =
                idx >= 0
                    ? prev.map((e, i) => (i === idx ? updated : e))
                    : [...prev, updated];
            return buildContextGraph(nodes, prevGraph.edges);
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
        setGraph((prev) => ({
            nodes: prev.nodes.filter((e) => e.entityId !== entityId),
            edges: prev.edges.filter(
                (edge) => edge.from !== entityId && edge.to !== entityId,
            ),
        }));
    }, []);

    useEffect(() => {
        if (status !== 'authenticated') return;
        const intervalId = window.setInterval(() => void refresh(), 30_000);
        return () => window.clearInterval(intervalId);
    }, [status, refresh]);

    useEffect(() => {
        if (status !== 'authenticated') return;
        const onMutation = () => {
            if (suppressNextMutationRef.current) {
                suppressNextMutationRef.current = false;
                return;
            }
            void refresh();
        };
        window.addEventListener(CONTEXT_GRAPH_MUTATED_EVENT, onMutation);
        return () =>
            window.removeEventListener(CONTEXT_GRAPH_MUTATED_EVENT, onMutation);
    }, [status, refresh]);

    return {
        graph,
        entries: graph.nodes,
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

function normalizeGraph(graph: ContextGraph): ContextGraph {
    const hasInvalidNode = graph.nodes.some(
        (node) => !Number.isFinite(node.x) || !Number.isFinite(node.y),
    );
    const seen = new Set<string>();
    const hasDuplicateNode = graph.nodes.some((node) => {
        if (seen.has(node.entityId)) return true;
        seen.add(node.entityId);
        return false;
    });

    return hasInvalidNode || hasDuplicateNode
        ? buildContextGraph(graph.nodes, graph.edges)
        : graph;
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
