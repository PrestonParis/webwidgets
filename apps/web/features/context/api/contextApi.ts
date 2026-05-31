import type {
    ContextEdge,
    ContextEntry,
    ContextPermissions,
    UpsertEntryPayload,
} from '@/features/context/types/context';
import type { ContextGraph } from '@/features/context/types/context';
import type { ContextSavedView, ContextSavedViewInput } from '../types/schemas';

export interface ContextBackfillSourceSummary {
    source: string;
    permissionCategory: string;
    recordsFound: number;
    nodesAttempted: number;
    nodesCreated: number;
    nodesUpdated: number;
    nodesSkipped: number;
    edgesAttempted: number;
    edgesCreated: number;
    edgesUpdated: number;
    edgesSkipped: number;
    errors: string[];
    skippedReason?: string;
}

export interface ContextBackfillSummary {
    startedAt: string;
    completedAt: string;
    sources: ContextBackfillSourceSummary[];
    totals: {
        sourcesAttempted: number;
        sourcesSkipped: number;
        recordsFound: number;
        nodesAttempted: number;
        nodesCreated: number;
        nodesUpdated: number;
        nodesSkipped: number;
        edgesAttempted: number;
        edgesCreated: number;
        edgesUpdated: number;
        edgesSkipped: number;
        errors: number;
    };
}

export interface ContextCoverageReport {
    summary: {
        total: number;
        totalNodes: number;
        totalEdges: number;
        nodeCountsByType: Record<string, number>;
        sourceCountsBySourceType: Record<string, number>;
        edgeCountsByKind: Record<string, number>;
        lastObservedAt: string | null;
    };
    features: Array<{
        id: string;
        name: string;
        actualNodeCount: number;
        actualEdgeCount: number;
        lastObservedAt: string | null;
        backfillSupported: boolean;
        adapterStatus: string;
        producerStatus: string;
        consumerStatus: string;
        status: string;
    }>;
}

export const CONTEXT_GRAPH_MUTATED_EVENT = 'webwidgets:context-graph-mutated';

function notifyContextGraphMutated() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(CONTEXT_GRAPH_MUTATED_EVENT));
}
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
    notifyContextGraphMutated();
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
    notifyContextGraphMutated();
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
    notifyContextGraphMutated();
}

export async function fetchGraph(): Promise<ContextGraph> {
    const res = await fetch('/api/context/graph');
    if (!res.ok) throw new Error('Failed to fetch context graph');
    return res.json() as Promise<ContextGraph>;
}

export async function runContextBackfill(): Promise<ContextBackfillSummary> {
    const res = await fetch('/api/context/backfill', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to sync context');
    clearCachedJson('/api/context/entries');
    notifyContextGraphMutated();
    const json = (await res.json()) as { summary: ContextBackfillSummary };
    return json.summary;
}

export async function fetchContextCoverage(): Promise<ContextCoverageReport> {
    const res = await fetch('/api/context/coverage');
    if (!res.ok) throw new Error('Failed to fetch context coverage');
    return res.json() as Promise<ContextCoverageReport>;
}

export async function createEdge(payload: {
    fromEntityId: string;
    toEntityId: string;
    kind: string;
    label?: string;
    metadata?: Record<string, unknown>;
}): Promise<ContextEdge | null> {
    const res = await fetch('/api/context/edges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create context edge');
    clearCachedJson('/api/context/entries');
    notifyContextGraphMutated();
    const json = (await res.json()) as { edge: ContextEdge | null };
    return json.edge;
}

export async function deleteEdge(id: string): Promise<void> {
    const res = await fetch(`/api/context/edges/${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete context edge');
    clearCachedJson('/api/context/entries');
    notifyContextGraphMutated();
}

export async function fetchPermissions(): Promise<ContextPermissions> {
    const res = await fetch('/api/context/permissions');
    if (!res.ok) throw new Error('Failed to fetch context permissions');
    const json = (await res.json()) as { permissions: ContextPermissions };
    return json.permissions;
}

export async function updatePermissions(
    permissions: Partial<ContextPermissions>,
): Promise<ContextPermissions> {
    const res = await fetch('/api/context/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissions),
    });
    if (!res.ok) throw new Error('Failed to update context permissions');
    notifyContextGraphMutated();
    const json = (await res.json()) as { permissions: ContextPermissions };
    return json.permissions;
}

export async function fetchSavedViews(): Promise<ContextSavedView[]> {
    const res = await fetch('/api/context/views');
    if (!res.ok) throw new Error('Failed to fetch context views');
    const json = (await res.json()) as { views: ContextSavedView[] };
    return json.views;
}

export async function saveContextView(
    view: ContextSavedViewInput & { id?: string },
): Promise<ContextSavedView> {
    const res = await fetch('/api/context/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(view),
    });
    if (!res.ok) throw new Error('Failed to save context view');
    const json = (await res.json()) as { view: ContextSavedView };
    return json.view;
}

export async function deleteContextView(id: string): Promise<void> {
    const res = await fetch(`/api/context/views/${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete context view');
}
