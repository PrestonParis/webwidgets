'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
    ActivityEvent,
    ActivityQueryOptions,
} from '@/features/activity/types/activity';

type ActivityResponse = { events: ActivityEvent[] };

function buildQueryString(opts: ActivityQueryOptions): string {
    const params = new URLSearchParams();
    if (opts.limit) params.set('limit', String(opts.limit));
    if (opts.offset) params.set('offset', String(opts.offset));
    if (opts.source) params.set('source', opts.source);
    if (opts.category) params.set('category', opts.category);
    if (opts.priority) params.set('priority', opts.priority);
    if (opts.eventType) params.set('event_type', opts.eventType);
    if (opts.since) params.set('since', opts.since);
    if (opts.until) params.set('until', opts.until);
    if (opts.sourceId) params.set('source_id', opts.sourceId);
    if (opts.sourceTable) params.set('source_table', opts.sourceTable);
    if (opts.archived !== undefined)
        params.set('archived', String(opts.archived));
    if (opts.search?.trim()) params.set('search', opts.search.trim());
    if (opts.unreadOnly) params.set('unread_only', 'true');
    const qs = params.toString();
    return qs ? `?${qs}` : '';
}

export function useActivityEvents(opts: ActivityQueryOptions = {}) {
    const queryKey = ['activity-events', opts] as const;

    return useQuery({
        queryKey,
        queryFn: async () => {
            const qs = buildQueryString(opts);
            const response = await fetch(`/api/activity${qs}`, {
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error(`Activity feed failed: ${response.status}`);
            }
            const json = (await response.json()) as ActivityResponse;
            return json.events;
        },
        refetchInterval: 60_000,
        staleTime: 30_000,
    });
}

// Bulk mutation: mark-all-read, mark-read/unread/archive selected ids
export function useActivityBulkMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            payload:
                | { action: 'read-all' }
                | {
                      action:
                          | 'mark-read'
                          | 'mark-unread'
                          | 'archive'
                          | 'unarchive';
                      ids: string[];
                  },
        ) => {
            const response = await fetch('/api/activity/bulk', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok)
                throw new Error(`Bulk activity failed: ${response.status}`);
            return response.json() as Promise<{
                ok: boolean;
                affected?: number;
            }>;
        },
        onSuccess() {
            void queryClient.invalidateQueries({
                queryKey: ['activity-events'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['activity-unread-count'],
            });
        },
    });
}

// Mutation: mark one event as read/unread/archived/unarchived
export function useActivityEventMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            action,
        }: {
            id: string;
            action: 'read' | 'unread' | 'archive' | 'unarchive';
        }) => {
            const response = await fetch(`/api/activity/${id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            if (!response.ok) {
                throw new Error(`Activity mutation failed: ${response.status}`);
            }
            const json = (await response.json()) as { event: ActivityEvent };
            return json.event;
        },
        onSuccess() {
            void queryClient.invalidateQueries({
                queryKey: ['activity-events'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['activity-unread-count'],
            });
        },
    });
}
