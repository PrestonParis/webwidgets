'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
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

const SCHEDULED_TRIGGERS = new Set([
    'scheduled',
    'recurring_digest',
    'deadline_approaching',
]);

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
        ]).then(([nextInstances, nextRuns, nextApprovals, nextDeliverables, nextSuggestions]) => {
            if (!active) return;
            setInstances(nextInstances);
            setRuns(nextRuns);
            setApprovals(nextApprovals);
            setDeliverables(nextDeliverables);
            setSuggestions(nextSuggestions);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [userId]);

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
                (a.nextGeneratedAt ?? '').localeCompare(b.nextGeneratedAt ?? ''),
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
    };
}

export type AutomationCenterController = ReturnType<typeof useAutomationCenter>;
