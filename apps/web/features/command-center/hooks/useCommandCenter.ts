'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cachedJson, clearCachedJson } from '@/lib/api/requestCache';
import type {
    CommandDomain,
    CommandFilters,
    CommandPriority,
    CommandStatus,
    CommandWorkstream,
} from '../types';

const priorityWeight: Record<CommandPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
};

const statusWeight: Record<CommandStatus, number> = {
    blocked: 4,
    attention: 3,
    queued: 2,
    healthy: 1,
};

const defaultFilters: CommandFilters = {
    query: '',
    status: 'all',
    domain: 'all',
    priority: 'all',
    sort: 'priority',
};

function matchesFilter(workstream: CommandWorkstream, filters: CommandFilters) {
    const haystack = [
        workstream.title,
        workstream.domain,
        workstream.owner,
        workstream.nextStep,
        workstream.status,
        workstream.priority,
    ]
        .join(' ')
        .toLowerCase();
    const queryMatch =
        filters.query.trim().length === 0 ||
        haystack.includes(filters.query.trim().toLowerCase());
    const statusMatch =
        filters.status === 'all' || workstream.status === filters.status;
    const domainMatch =
        filters.domain === 'all' || workstream.domain === filters.domain;
    const priorityMatch =
        filters.priority === 'all' || workstream.priority === filters.priority;
    return queryMatch && statusMatch && domainMatch && priorityMatch;
}

function sortWorkstreams(
    a: CommandWorkstream,
    b: CommandWorkstream,
    sort: CommandFilters['sort'],
) {
    if (sort === 'confidence') return b.confidence - a.confidence;
    if (sort === 'progress') return b.progress - a.progress;
    if (sort === 'due') return (a.due ?? '').localeCompare(b.due ?? '');
    return (
        priorityWeight[b.priority] - priorityWeight[a.priority] ||
        statusWeight[b.status] - statusWeight[a.status]
    );
}

export interface WorkstreamRecord {
    id: string;
    user_id: string;
    title: string;
    domain: string;
    owner: string | null;
    status: CommandStatus;
    priority: CommandPriority;
    progress: number;
    next_step: string | null;
    due: string | null;
    blockers: number;
    automations: number;
    confidence: number;
    created_at: string;
}

function recordToWorkstream(r: WorkstreamRecord): CommandWorkstream {
    return {
        id: r.id,
        title: r.title,
        domain: r.domain as CommandDomain,
        owner: r.owner ?? '',
        status: r.status,
        priority: r.priority,
        progress: r.progress,
        nextStep: r.next_step ?? '',
        due: r.due ?? '',
        blockers: r.blockers,
        automations: r.automations,
        confidence: r.confidence,
    };
}

export function useCommandCenter() {
    const [workstreams, setWorkstreams] = useState<CommandWorkstream[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<CommandFilters>(defaultFilters);
    const [selectedWorkstreamId, setSelectedWorkstreamId] = useState('');

    const fetchWorkstreams = useCallback(async () => {
        setLoading(true);
        try {
            const data = await cachedJson<WorkstreamRecord[]>(
                '/api/command/workstreams',
                { ttlMs: 10_000 },
            );
            const mapped = data.map(recordToWorkstream);
            setWorkstreams(mapped);
            if (mapped.length > 0 && !selectedWorkstreamId) {
                setSelectedWorkstreamId(mapped[0]!.id);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [selectedWorkstreamId]);

    useEffect(() => {
        void fetchWorkstreams();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const createWorkstream = useCallback(async (data: Partial<WorkstreamRecord> & { title: string }) => {
        const res = await fetch('/api/command/workstreams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create workstream');
        clearCachedJson('/api/command/workstreams');
        const record = await res.json() as WorkstreamRecord;
        const mapped = recordToWorkstream(record);
        setWorkstreams((prev) => [mapped, ...prev]);
        setSelectedWorkstreamId(mapped.id);
        return mapped;
    }, []);

    const updateWorkstream = useCallback(async (id: string, updates: Record<string, unknown>) => {
        const res = await fetch(`/api/command/workstreams/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!res.ok) return;
        clearCachedJson('/api/command/workstreams');
        const record = await res.json() as WorkstreamRecord;
        const mapped = recordToWorkstream(record);
        setWorkstreams((prev) => prev.map((w) => w.id === id ? mapped : w));
    }, []);

    const deleteWorkstream = useCallback(async (id: string) => {
        await fetch(`/api/command/workstreams/${id}`, { method: 'DELETE' });
        clearCachedJson('/api/command/workstreams');
        setWorkstreams((prev) => prev.filter((w) => w.id !== id));
    }, []);

    const filteredWorkstreams = useMemo(
        () =>
            workstreams
                .filter((workstream) => matchesFilter(workstream, filters))
                .toSorted((a, b) => sortWorkstreams(a, b, filters.sort)),
        [filters, workstreams],
    );

    const selectedWorkstream =
        workstreams.find((w) => w.id === selectedWorkstreamId) ??
        filteredWorkstreams[0] ??
        null;

    const domains = useMemo(
        () => Array.from(new Set(workstreams.map((w) => w.domain))),
        [workstreams],
    );

    const updateFilter = <Key extends keyof CommandFilters>(
        key: Key,
        value: CommandFilters[Key],
    ) => setFilters((current) => ({ ...current, [key]: value }));

    const resetFilters = () => setFilters(defaultFilters);

    // Empty arrays — signals, actions, scenarios are future work driven by real data
    const commandSignals: never[] = [];
    const commandActions: never[] = [];
    const commandScenarios: never[] = [];
    const commandMetrics: never[] = [];

    return {
        metrics: commandMetrics,
        signals: commandSignals,
        actions: commandActions,
        scenarios: commandScenarios,
        filters,
        updateFilter,
        resetFilters,
        workstreams,
        filteredWorkstreams,
        selectedWorkstream,
        selectedWorkstreamId,
        setSelectedWorkstreamId,
        domains: domains as CommandDomain[],
        loading,
        createWorkstream,
        updateWorkstream,
        deleteWorkstream,
    };
}
