'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
    useAutomationCenterActions,
    useAutomationCenterData,
    useAutomationCenterSummary,
    useDeliverableActions,
} from './useAutomationCenterData';
import type {
    AutomationInstance,
    AutomationRunStatus,
} from '@/features/automation/types/automation';

export type AutomationTab =
    | 'overview'
    | 'automations'
    | 'actions'
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

const SCHEDULED_TRIGGERS = new Set([
    'scheduled',
    'recurring_digest',
    'deadline_approaching',
]);

function matchesFilter(instance: AutomationInstance, filter: AutomationFilter) {
    if (filter === 'all') return true;
    if (filter === 'active') return instance.status === 'enabled';
    if (filter === 'paused') return instance.status === 'paused';
    if (filter === 'needs_approval')
        return (
            instance.status === 'needs_approval' || instance.approvalRequired
        );
    if (filter === 'needs_setup')
        return ['needs_setup', 'provider_missing'].includes(instance.status);
    if (filter === 'scheduled')
        return SCHEDULED_TRIGGERS.has(instance.definition.trigger.type);
    return instance.status === 'error';
}

export function useAutomationCenter() {
    const { userId } = useAuth();
    const data = useAutomationCenterData(userId);
    const actions = useAutomationCenterActions(data);
    const deliverableActions = useDeliverableActions(data, userId);
    const summary = useAutomationCenterSummary(data);
    const [activeTab, setActiveTab] = useState<AutomationTab>('overview');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<AutomationFilter>('all');
    const [historyStatus, setHistoryStatus] = useState<
        AutomationRunStatus | 'all'
    >('all');
    const stats = useMemo(
        () => ({
            active: data.instances.filter((item) => item.status === 'enabled')
                .length,
            paused: data.instances.filter((item) => item.status === 'paused')
                .length,
            approvalRequired: data.approvals.length,
            errors: data.instances.filter((item) => item.status === 'error')
                .length,
            scheduled: data.instances.filter((item) =>
                SCHEDULED_TRIGGERS.has(item.definition.trigger.type),
            ).length,
            total: data.instances.length,
        }),
        [data.approvals.length, data.instances],
    );
    const filteredInstances = useMemo(() => {
        const query = search.trim().toLowerCase();
        return data.instances.filter(
            (instance) =>
                matchesFilter(instance, filter) &&
                (!query ||
                    [
                        instance.definition.name,
                        instance.definition.widgetName,
                        instance.definition.category,
                    ].some((value) => value.toLowerCase().includes(query))),
        );
    }, [data.instances, filter, search]);
    const filteredRuns = useMemo(
        () =>
            historyStatus === 'all'
                ? data.runs
                : data.runs.filter((run) => run.status === historyStatus),
        [data.runs, historyStatus],
    );
    return {
        loading: data.loading,
        instances: data.instances,
        filteredInstances,
        runs: data.runs,
        filteredRuns,
        approvals: data.approvals,
        deliverables: data.deliverables,
        suggestions: data.suggestions,
        globalEnabled: data.globalEnabled,
        stats,
        ...summary,
        ...actions,
        ...deliverableActions,
        activeTab,
        setActiveTab,
        search,
        setSearch,
        filter,
        setFilter,
        historyStatus,
        setHistoryStatus,
    };
}

export type AutomationCenterController = ReturnType<typeof useAutomationCenter>;
