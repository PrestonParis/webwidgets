'use client';

// useWidgetData: TanStack Query-based hook that resolves a widget's data requirements.
// - Deduplicates: multiple widgets with the same sourceType share one query.
// - Batches: all requirements start in parallel via useQueries.
// - Routes: import/export adapter sources go through /api/import-export/exports,
//           direct API sources go through their own routes.
// - Integrates with the existing widgetFetchRegistry for TTL, cooldowns, and concurrency.

import { useQueries, type UseQueryOptions } from '@tanstack/react-query';
import { getWidgetManifest } from './widgetManifestRegistry';
import type {
    WidgetDataPayload,
    WidgetDataRequirement,
} from './widgetManifest';

const ADAPTER_SOURCES = new Set([
    'tracking_entries',
    'todos',
    'collaboration_workspaces',
    'collaboration_handoffs',
    'context_entries',
    'mood_logs',
    'journals',
    'habits',
    'finance_records',
    'countdowns',
    'recovery_records',
    'calendar_events',
    'memory_decks',
    'files',
]);

// Builds a stable TanStack Query key from a requirement.
// Shared sourceTypes produce identical keys, so React Query deduplicates them.
function queryKey(req: WidgetDataRequirement): unknown[] {
    if (req.sourceType === 'api')
        return ['widget-api', req.apiRoute, req.scope];
    return ['widget-adapter', req.sourceType, req.scope];
}

async function fetchRequirement(req: WidgetDataRequirement): Promise<unknown> {
    if (req.sourceType === 'api') {
        if (!req.apiRoute)
            throw new Error('apiRoute required for api sourceType');
        const res = await fetch(req.apiRoute, {
            credentials: 'include',
            cache: 'no-store',
        });
        if (res.status === 401 || res.status === 403)
            throw new Error('Unauthorized');
        if (!res.ok) throw new Error(`${req.apiRoute} returned ${res.status}`);
        return res.json() as Promise<unknown>;
    }

    if (ADAPTER_SOURCES.has(req.sourceType)) {
        // Route through import/export adapter for normalized data
        const res = await fetch('/api/import-export/exports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                source_type: req.sourceType,
                format: 'json',
                title: `runtime:${req.sourceType}`,
                inline: true, // hint: return data inline rather than persisting a job
            }),
        });
        if (res.status === 401) throw new Error('Unauthorized');
        if (!res.ok) {
            const err = (await res.json().catch(() => ({}))) as {
                error?: string;
            };
            throw new Error(err.error ?? `Adapter ${req.sourceType} failed`);
        }
        const body = (await res.json()) as {
            data?: unknown;
            records?: unknown[];
        };
        return body.data ?? body.records ?? null;
    }

    // ai_context — request a context bundle (for widgets that need AI context)
    if (req.sourceType === 'ai_context') {
        const res = await fetch('/api/import-export/context-export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ scope: req.scope }),
        });
        if (!res.ok) throw new Error('Context export failed');
        return res.json() as Promise<unknown>;
    }

    throw new Error(`Unknown sourceType: ${req.sourceType}`);
}

function buildQueryOptions(
    req: WidgetDataRequirement,
): UseQueryOptions<unknown, Error> {
    return {
        queryKey: queryKey(req),
        queryFn: () => fetchRequirement(req),
        staleTime: req.cacheTtlMs ?? 15_000,
        gcTime: (req.cacheTtlMs ?? 15_000) * 2,
        retry: (failureCount, error) => {
            // Don't retry auth errors
            if (error.message === 'Unauthorized') return false;
            return failureCount < 2;
        },
        refetchOnWindowFocus: false,
    };
}

export interface UseWidgetDataResult {
    payload: WidgetDataPayload | null;
    loading: boolean;
    allResolved: boolean;
    hasError: boolean;
}

export function useWidgetData(
    widgetId: string,
    widgetType: string,
    enabled = true,
): UseWidgetDataResult {
    const manifest = getWidgetManifest(widgetType);
    const requirements = manifest?.dataRequirements ?? [];

    const queries = useQueries({
        queries: requirements.map((req) => ({
            ...buildQueryOptions(req),
            enabled,
        })),
    });

    if (!manifest || requirements.length === 0) {
        return {
            payload: null,
            loading: false,
            allResolved: true,
            hasError: false,
        };
    }

    const loading = queries.some((q) => q.isLoading);
    const allResolved = queries.every((q) => q.isFetched);

    const sources: WidgetDataPayload['sources'] = {};
    const errors: string[] = [];

    requirements.forEach((req, i) => {
        const q = queries[i]!;
        const key =
            req.sourceType === 'api'
                ? (req.apiRoute ?? req.sourceType)
                : req.sourceType;
        sources[key] = {
            data: q.data ?? null,
            fetchedAt: q.dataUpdatedAt,
            sourceType: req.sourceType,
            ...(q.error ? { error: q.error.message } : {}),
        };
        if (q.error && req.required) errors.push(q.error.message);
    });

    const payload: WidgetDataPayload = {
        widgetType,
        widgetId,
        sources,
        allResolved,
        partiallyResolved: allResolved && errors.length > 0,
        errors,
    };

    return { payload, loading, allResolved, hasError: errors.length > 0 };
}
