'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cachedJson, clearCachedJson } from '@/lib/api/requestCache';
import {
    approveAutomationRun,
    dismissSuggestion as dismissSuggestionService,
    listAutomationRuns,
    listPendingApprovals,
    listScheduledDeliverables,
    listSuggestions,
    listUserAutomations,
    rejectAutomationRun,
    toggleAutomation as toggleAutomationService,
} from '@/features/automation/services/automationService';
import type {
    AutomationApproval,
    AutomationDeliverable,
    AutomationInstance,
    AutomationRunRecord,
    AutomationRunStatus,
    AutomationSuggestion,
} from '@/features/automation/types/automation';

export type AutomationTab =
    | 'overview'
    | 'automations'
    | 'workstreams'
    | 'suggestions'
    | 'deliverables'
    | 'history'
    | 'approvals';

export type AutomationFilter =
    | 'all'
    | 'active'
    | 'paused'
    | 'needs_approval'
    | 'needs_setup'
    | 'scheduled'
    | 'errors';

export interface AutomationStats {
    active: number;
    paused: number;
    approvalRequired: number;
    errors: number;
    scheduled: number;
    total: number;
}

// Workstream types from command center
export type CommandDomain = string;
export type CommandPriority = 'critical' | 'high' | 'medium' | 'low';
export type CommandStatus = 'healthy' | 'attention' | 'blocked' | 'queued';

export interface CommandWorkstream {
    id: string;
    title: string;
    domain: CommandDomain;
    owner: string;
    status: CommandStatus;
    priority: CommandPriority;
    progress: number;
    nextStep: string;
    due: string;
    blockers: number;
    automations: number;
    confidence: number;
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

export interface CommandFilters {
    query: string;
    status: CommandStatus | 'all';
    domain: string;
    priority: CommandPriority | 'all';
    sort: 'priority' | 'due' | 'confidence' | 'progress';
}

const SCHEDULED_TRIGGERS = new Set([
    'scheduled',
    'recurring_digest',
    'deadline_approaching',
]);

// Workstream filtering and sorting logic
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

const defaultCommandFilters: CommandFilters = {
    query: '',
    status: 'all',
    domain: 'all',
    priority: 'all',
    sort: 'priority',
};

function matchesCommandFilter(
    workstream: CommandWorkstream,
    filters: CommandFilters,
) {
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

function recordToWorkstream(r: WorkstreamRecord): CommandWorkstream {
    return {
        id: r.id,
        title: r.title,
        domain: r.domain,
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

function matchesFilter(
    instance: AutomationInstance,
    filter: AutomationFilter,
): boolean {
    switch (filter) {
        case 'all':
            return true;
        case 'active':
            return instance.status === 'enabled';
        case 'paused':
            return instance.status === 'paused';
        case 'needs_approval':
            return (
                instance.status === 'needs_approval' ||
                instance.approvalRequired
            );
        case 'needs_setup':
            return (
                instance.status === 'needs_setup' ||
                instance.status === 'provider_missing'
            );
        case 'scheduled':
            return SCHEDULED_TRIGGERS.has(instance.definition.trigger.type);
        case 'errors':
            return instance.status === 'error';
        default:
            return true;
    }
}

export function useAutomationCenter() {
    const { userId } = useAuth();

    const [instances, setInstances] = useState<AutomationInstance[]>([]);
    const [runs, setRuns] = useState<AutomationRunRecord[]>([]);
    const [approvals, setApprovals] = useState<AutomationApproval[]>([]);
    const [deliverables, setDeliverables] = useState<AutomationDeliverable[]>(
        [],
    );
    const [suggestions, setSuggestions] = useState<AutomationSuggestion[]>([]);
    const [loading, setLoading] = useState(true);

    // Workstream state
    const [workstreams, setWorkstreams] = useState<CommandWorkstream[]>([]);
    const [commandFilters, setCommandFilters] = useState<CommandFilters>(
        defaultCommandFilters,
    );
    const [selectedWorkstreamId, setSelectedWorkstreamId] = useState('');

    const [globalEnabled, setGlobalEnabled] = useState(true);
    const [activeTab, setActiveTab] = useState<AutomationTab>('overview');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<AutomationFilter>('all');
    const [historyStatus, setHistoryStatus] = useState<
        AutomationRunStatus | 'all'
    >('all');

    useEffect(() => {
        const uid = userId ?? 'mock-user';
        let active = true;
        void Promise.all([
            listUserAutomations(uid),
            listAutomationRuns(uid),
            listPendingApprovals(uid),
            listScheduledDeliverables(uid),
            listSuggestions(uid),
            cachedJson<WorkstreamRecord[]>('/api/command/workstreams', {
                ttlMs: 10_000,
            }),
        ])
            .then(
                ([
                    nextInstances,
                    nextRuns,
                    nextApprovals,
                    nextDeliverables,
                    nextSuggestions,
                    workstreamData,
                ]) => {
                    if (!active) return;
                    setInstances(nextInstances);
                    setRuns(nextRuns);
                    setApprovals(nextApprovals);
                    setDeliverables(nextDeliverables);
                    setSuggestions(nextSuggestions);
                    const mappedWorkstreams =
                        workstreamData.map(recordToWorkstream);
                    setWorkstreams(mappedWorkstreams);
                    if (mappedWorkstreams.length > 0 && !selectedWorkstreamId) {
                        setSelectedWorkstreamId(mappedWorkstreams[0]!.id);
                    }
                    setLoading(false);
                },
            )
            .catch(() => {
                if (!active) return;
                setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [userId, selectedWorkstreamId]);

    const stats = useMemo<AutomationStats>(() => {
        return {
            active: instances.filter((i) => i.status === 'enabled').length,
            paused: instances.filter((i) => i.status === 'paused').length,
            approvalRequired: instances.filter(
                (i) => i.status === 'needs_approval' || i.approvalRequired,
            ).length,
            errors: instances.filter((i) => i.status === 'error').length,
            scheduled: instances.filter((i) =>
                SCHEDULED_TRIGGERS.has(i.definition.trigger.type),
            ).length,
            total: instances.length,
        };
    }, [instances]);

    const filteredInstances = useMemo(() => {
        const query = search.trim().toLowerCase();
        return instances.filter((instance) => {
            if (!matchesFilter(instance, filter)) return false;
            if (!query) return true;
            return (
                instance.definition.name.toLowerCase().includes(query) ||
                instance.definition.widgetName.toLowerCase().includes(query) ||
                instance.definition.category.toLowerCase().includes(query)
            );
        });
    }, [instances, filter, search]);

    const filteredRuns = useMemo(() => {
        if (historyStatus === 'all') return runs;
        return runs.filter((run) => run.status === historyStatus);
    }, [runs, historyStatus]);

    const nextDeliverable = useMemo(() => {
        return deliverables
            .filter((d) => d.enabled && d.nextGeneratedAt)
            .sort((a, b) =>
                (a.nextGeneratedAt ?? '').localeCompare(
                    b.nextGeneratedAt ?? '',
                ),
            )[0];
    }, [deliverables]);

    const latestFailed = useMemo(() => {
        return instances.find((i) => i.status === 'error');
    }, [instances]);

    const toggleAutomation = useCallback(
        (id: string) => {
            setInstances((current) =>
                current.map((instance) => {
                    if (instance.id !== id) return instance;
                    if (
                        instance.status === 'needs_setup' ||
                        instance.status === 'provider_missing'
                    ) {
                        return instance;
                    }
                    const enabled = !instance.enabled;
                    return {
                        ...instance,
                        enabled,
                        status: enabled ? 'enabled' : 'paused',
                        updatedAt: new Date().toISOString(),
                    };
                }),
            );
            const target = instances.find((i) => i.id === id);
            if (target) {
                void toggleAutomationService(id, !target.enabled);
            }
        },
        [instances],
    );

    const toggleDeliverable = useCallback((id: string) => {
        setDeliverables((current) =>
            current.map((d) =>
                d.id === id ? { ...d, enabled: !d.enabled } : d,
            ),
        );
    }, []);

    const approveRun = useCallback((approvalId: string) => {
        setApprovals((current) => current.filter((a) => a.id !== approvalId));
        void approveAutomationRun(approvalId);
    }, []);

    const rejectRun = useCallback((approvalId: string) => {
        setApprovals((current) => current.filter((a) => a.id !== approvalId));
        void rejectAutomationRun(approvalId);
    }, []);

    const dismissSuggestion = useCallback((id: string) => {
        setSuggestions((current) => current.filter((s) => s.id !== id));
        void dismissSuggestionService(id);
    }, []);

    const toggleGlobal = useCallback(() => {
        setGlobalEnabled((value) => !value);
    }, []);

    // Workstream CRUD operations
    const createWorkstream = useCallback(
        async (data: Partial<WorkstreamRecord> & { title: string }) => {
            const res = await fetch('/api/command/workstreams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create workstream');
            clearCachedJson('/api/command/workstreams');
            const record = (await res.json()) as WorkstreamRecord;
            const mapped = recordToWorkstream(record);
            setWorkstreams((prev) => [mapped, ...prev]);
            setSelectedWorkstreamId(mapped.id);
            return mapped;
        },
        [],
    );

    const updateWorkstream = useCallback(
        async (id: string, updates: Record<string, unknown>) => {
            const res = await fetch(`/api/command/workstreams/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) return;
            clearCachedJson('/api/command/workstreams');
            const record = (await res.json()) as WorkstreamRecord;
            const mapped = recordToWorkstream(record);
            setWorkstreams((prev) =>
                prev.map((w) => (w.id === id ? mapped : w)),
            );
        },
        [],
    );

    const deleteWorkstream = useCallback(async (id: string) => {
        await fetch(`/api/command/workstreams/${id}`, { method: 'DELETE' });
        clearCachedJson('/api/command/workstreams');
        setWorkstreams((prev) => prev.filter((w) => w.id !== id));
    }, []);

    const filteredWorkstreams = useMemo(
        () =>
            workstreams
                .filter((workstream) =>
                    matchesCommandFilter(workstream, commandFilters),
                )
                .toSorted((a, b) => sortWorkstreams(a, b, commandFilters.sort)),
        [commandFilters, workstreams],
    );

    const selectedWorkstream =
        workstreams.find((w) => w.id === selectedWorkstreamId) ??
        filteredWorkstreams[0] ??
        null;

    const domains = useMemo(
        () => Array.from(new Set(workstreams.map((w) => w.domain))),
        [workstreams],
    );

    const updateCommandFilter = <Key extends keyof CommandFilters>(
        key: Key,
        value: CommandFilters[Key],
    ) => setCommandFilters((current) => ({ ...current, [key]: value }));

    const resetCommandFilters = () => setCommandFilters(defaultCommandFilters);

    return {
        loading,
        instances,
        filteredInstances,
        runs,
        filteredRuns,
        approvals,
        deliverables,
        suggestions,
        stats,
        nextDeliverable,
        latestFailed,
        globalEnabled,
        toggleGlobal,
        activeTab,
        setActiveTab,
        search,
        setSearch,
        filter,
        setFilter,
        historyStatus,
        setHistoryStatus,
        toggleAutomation,
        toggleDeliverable,
        approveRun,
        rejectRun,
        dismissSuggestion,
        // Workstream data and functions
        workstreams,
        filteredWorkstreams,
        selectedWorkstream,
        selectedWorkstreamId,
        setSelectedWorkstreamId,
        domains,
        commandFilters,
        updateCommandFilter,
        resetCommandFilters,
        createWorkstream,
        updateWorkstream,
        deleteWorkstream,
    };
}

export type AutomationCenterController = ReturnType<typeof useAutomationCenter>;
