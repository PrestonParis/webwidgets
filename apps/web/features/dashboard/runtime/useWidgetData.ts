'use client';

// useWidgetData: TanStack Query-based hook that resolves a widget's data requirements.
// - Deduplicates: multiple widgets with the same sourceType share one query.
// - Batches: all requirements start in parallel via useQueries.
// - Routes: import/export adapter sources go through /api/import-export/exports,
//           direct API sources go through their own routes.
// - Integrates with the existing widgetFetchRegistry for TTL, cooldowns, and concurrency.
//
// useAdapterFetch: exported helper for parameterized adapter calls with dynamic
// params (e.g. date ranges for calendar). Each unique set of params gets its
// own TanStack Query cache entry, preventing stale data across different ranges.

import {
    useQuery,
    useQueries,
    type UseQueryOptions,
} from '@tanstack/react-query';
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

// Optional params passed alongside an adapter request.
// These are included in the cache key so different param sets get separate entries.
export interface AdapterParams {
    startDate?: string;
    endDate?: string;
    deckId?: string;
    [key: string]: string | undefined;
}

// Builds a stable TanStack Query key from a requirement (and optional params).
// Shared sourceTypes produce identical keys, so React Query deduplicates them.
// When params are provided, they are appended so different param sets don't collide.
function queryKey(
    req: WidgetDataRequirement,
    params?: AdapterParams,
): unknown[] {
    if (req.sourceType === 'api')
        return ['widget-api', req.apiRoute, req.scope];
    if (params && Object.keys(params).length > 0) {
        return ['widget-adapter', req.sourceType, req.scope, params];
    }
    return ['widget-adapter', req.sourceType, req.scope];
}

async function fetchAdapterSource(
    sourceType: string,
    params?: AdapterParams,
): Promise<unknown> {
    const body: Record<string, unknown> = {
        source_type: sourceType,
        format: 'json',
        title: `runtime:${sourceType}`,
        inline: true,
    };
    if (params?.startDate) body['start_date'] = params.startDate;
    if (params?.endDate) body['end_date'] = params.endDate;

    const res = await fetch('/api/import-export/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
    });
    if (res.status === 401) throw new Error('Unauthorized');
    if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
            error?: string;
        };
        throw new Error(err.error ?? `Adapter ${sourceType} failed`);
    }
    const responseBody = (await res.json()) as {
        data?: unknown;
        records?: unknown[];
    };
    return responseBody.data ?? responseBody.records ?? null;
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
        return fetchAdapterSource(req.sourceType);
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

// ── Parameterized adapter fetch ───────────────────────────────────────────────

export interface UseAdapterFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

// Hook for widgets that need to call an adapter with dynamic params
// (e.g. calendar date ranges that change as the user navigates months).
// Each unique (sourceType, params) combination gets its own cache entry,
// preventing stale data from bleeding across different ranges or deck IDs.
export function useAdapterFetch<T>(
    sourceType: string,
    params: AdapterParams,
    options?: { cacheTtlMs?: number; enabled?: boolean },
): UseAdapterFetchResult<T> {
    const req: WidgetDataRequirement = {
        sourceType: sourceType as WidgetDataRequirement['sourceType'],
        scope: 'current_user',
        required: true,
        cacheTtlMs: options?.cacheTtlMs ?? 60_000,
    };
    const result = useQuery<unknown, Error>({
        queryKey: queryKey(req, params),
        queryFn: () => fetchAdapterSource(sourceType, params),
        staleTime: options?.cacheTtlMs ?? 60_000,
        gcTime: (options?.cacheTtlMs ?? 60_000) * 2,
        enabled: options?.enabled !== false,
        retry: (failureCount, error) => {
            if (error.message === 'Unauthorized') return false;
            return failureCount < 2;
        },
        refetchOnWindowFocus: false,
    });

    return {
        data: (result.data as T | undefined) ?? null,
        loading: result.isLoading,
        error: result.error?.message ?? null,
        refetch: () => {
            void result.refetch();
        },
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
