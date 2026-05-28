'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CollaborationFilters } from '../types';
import { cachedJson, clearCachedJson } from '@/lib/api/requestCache';

export interface WorkspaceRecord {
    id: string;
    user_id: string;
    name: string;
    scope: string;
    description: string | null;
    status: 'live' | 'idle' | 'blocked';
    created_at: string;
}

export interface HandoffRecord {
    id: string;
    user_id: string;
    workspace_id: string | null;
    title: string;
    owner: string | null;
    scope: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    due: string | null;
    complete: boolean;
    created_at: string;
}

const defaultFilters: CollaborationFilters = {
    query: '',
    scope: 'all',
    status: 'all',
};

export function useCollaborationWorkspace() {
    const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
    const [handoffs, setHandoffs] = useState<HandoffRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] =
        useState<CollaborationFilters>(defaultFilters);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');

    const fetchAll = useCallback(async () => {
        try {
            const [workspacesData, handoffsData] = await Promise.all([
                cachedJson<WorkspaceRecord[]>('/api/collaboration/workspaces', {
                    ttlMs: 10_000,
                }),
                cachedJson<HandoffRecord[]>('/api/collaboration/handoffs', {
                    ttlMs: 10_000,
                }),
            ]);
            setWorkspaces(workspacesData);
            setSelectedWorkspaceId(
                (prev) => (prev || workspacesData[0]?.id) ?? '',
            );
            setHandoffs(handoffsData);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchAll();
    }, [fetchAll]);

    const createWorkspace = useCallback(
        async (data: {
            name: string;
            scope?: string;
            description?: string;
        }) => {
            const res = await fetch('/api/collaboration/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create workspace');
            clearCachedJson('/api/collaboration/workspaces');
            const workspace = (await res.json()) as WorkspaceRecord;
            setWorkspaces((prev) => [workspace, ...prev]);
            setSelectedWorkspaceId(workspace.id);
            return workspace;
        },
        [],
    );

    const deleteWorkspace = useCallback(async (id: string) => {
        await fetch(`/api/collaboration/workspaces/${id}`, {
            method: 'DELETE',
        });
        clearCachedJson('/api/collaboration/workspaces');
        setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    }, []);

    const createHandoff = useCallback(
        async (data: {
            title: string;
            owner?: string;
            scope?: string;
            priority?: string;
            due?: string;
            workspace_id?: string;
        }) => {
            const res = await fetch('/api/collaboration/handoffs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create handoff');
            clearCachedJson('/api/collaboration/handoffs');
            const handoff = (await res.json()) as HandoffRecord;
            setHandoffs((prev) => [handoff, ...prev]);
            return handoff;
        },
        [],
    );

    const toggleHandoff = useCallback(
        async (id: string) => {
            const handoff = handoffs.find((h) => h.id === id);
            if (!handoff) return;
            const res = await fetch(`/api/collaboration/handoffs/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ complete: !handoff.complete }),
            });
            if (!res.ok) return;
            clearCachedJson('/api/collaboration/handoffs');
            const updated = (await res.json()) as HandoffRecord;
            setHandoffs((prev) => prev.map((h) => (h.id === id ? updated : h)));
        },
        [handoffs],
    );

    const deleteHandoff = useCallback(async (id: string) => {
        await fetch(`/api/collaboration/handoffs/${id}`, { method: 'DELETE' });
        clearCachedJson('/api/collaboration/handoffs');
        setHandoffs((prev) => prev.filter((h) => h.id !== id));
    }, []);

    const visibleWorkspaces = useMemo(
        () =>
            workspaces.filter((ws) => {
                const query = filters.query.trim().toLowerCase();
                const haystack = [
                    ws.name,
                    ws.scope,
                    ws.status,
                    ws.description ?? '',
                ]
                    .join(' ')
                    .toLowerCase();
                return (
                    (!query || haystack.includes(query)) &&
                    (filters.scope === 'all' || ws.scope === filters.scope) &&
                    (filters.status === 'all' || ws.status === filters.status)
                );
            }),
        [workspaces, filters],
    );

    const scopes = useMemo(
        () => Array.from(new Set(workspaces.map((ws) => ws.scope))),
        [workspaces],
    );

    const completedHandoffs = handoffs.filter((h) => h.complete).length;
    const handoffCompletion =
        handoffs.length > 0
            ? Math.round((completedHandoffs / handoffs.length) * 100)
            : 0;

    const updateFilter = <Key extends keyof CollaborationFilters>(
        key: Key,
        value: CollaborationFilters[Key],
    ) => setFilters((current) => ({ ...current, [key]: value }));

    const resetFilters = () => setFilters(defaultFilters);

    // Empty arrays — collaborators and events are real-time features, future work
    const collaborators: never[] = [];
    const events: never[] = [];

    return {
        workspaces,
        visibleWorkspaces,
        selectedWorkspaceId,
        setSelectedWorkspaceId,
        handoffs,
        loading,
        createWorkspace,
        deleteWorkspace,
        createHandoff,
        toggleHandoff,
        deleteHandoff,
        filters,
        updateFilter,
        resetFilters,
        scopes,
        handoffCompletion,
        collaborators,
        events,
    };
}
