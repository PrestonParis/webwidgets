'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    approveAutomationRun,
    dismissSuggestion as dismissSuggestionService,
    getAutomationCenterSnapshot,
    rejectAutomationRun,
    setAutomationPauseAll,
    toggleAutomation,
    upsertScheduledDeliverable,
} from '@/features/automation/services/automationCenterService';
import type {
    AutomationApproval,
    AutomationDeliverable,
    AutomationInstance,
    AutomationRunRecord,
    AutomationSuggestion,
} from '@/features/automation/types/automation';

export function useAutomationCenterData(userId?: string | null) {
    const [instances, setInstances] = useState<AutomationInstance[]>([]);
    const [runs, setRuns] = useState<AutomationRunRecord[]>([]);
    const [approvals, setApprovals] = useState<AutomationApproval[]>([]);
    const [deliverables, setDeliverables] = useState<AutomationDeliverable[]>(
        [],
    );
    const [suggestions, setSuggestions] = useState<AutomationSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalEnabled, setGlobalEnabled] = useState(true);
    useEffect(() => {
        if (!userId) return;
        let active = true;
        void getAutomationCenterSnapshot().then((snapshot) => {
            if (!active) return;
            setInstances(snapshot.instances);
            setRuns(snapshot.runs);
            setApprovals(snapshot.approvals);
            setDeliverables(snapshot.deliverables);
            setSuggestions(snapshot.suggestions);
            setGlobalEnabled(snapshot.globalEnabled);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [userId]);
    return {
        instances,
        setInstances,
        runs,
        approvals,
        setApprovals,
        deliverables,
        setDeliverables,
        suggestions,
        setSuggestions,
        loading,
        globalEnabled,
        setGlobalEnabled,
    };
}

export type AutomationCenterData = ReturnType<typeof useAutomationCenterData>;

export function useAutomationCenterActions(data: AutomationCenterData) {
    const toggleOne = useCallback(
        (id: string) => {
            const target = data.instances.find((item) => item.id === id);
            if (!target) return;
            const enabled = !target.enabled;
            void toggleAutomation(id, enabled).then(() =>
                data.setInstances((current) =>
                    current.map((item) =>
                        item.id === id
                            ? {
                                  ...item,
                                  enabled,
                                  status: enabled ? 'enabled' : 'paused',
                              }
                            : item,
                    ),
                ),
            );
        },
        [data],
    );
    const decide = useCallback(
        (id: string, decision: 'approved' | 'denied') => {
            const approval = data.approvals.find((item) => item.id === id);
            if (!approval) return;
            const command =
                decision === 'approved'
                    ? approveAutomationRun
                    : rejectAutomationRun;
            void command(approval).then(() =>
                data.setApprovals((current) =>
                    current.filter((item) => item.id !== id),
                ),
            );
        },
        [data],
    );
    const dismissSuggestion = useCallback(
        (id: string) => {
            void dismissSuggestionService(id).then(() =>
                data.setSuggestions((current) =>
                    current.filter((item) => item.id !== id),
                ),
            );
        },
        [data],
    );
    const toggleGlobal = useCallback(() => {
        const enabled = !data.globalEnabled;
        void setAutomationPauseAll(enabled).then(() =>
            data.setGlobalEnabled(enabled),
        );
    }, [data]);
    return {
        toggleAutomation: toggleOne,
        approveRun: (id: string) => decide(id, 'approved'),
        rejectRun: (id: string) => decide(id, 'denied'),
        dismissSuggestion,
        toggleGlobal,
    };
}

export function useDeliverableActions(
    data: AutomationCenterData,
    userId?: string | null,
) {
    const toggleDeliverable = useCallback(
        (id: string) => {
            const target = data.deliverables.find((item) => item.id === id);
            if (!target) return;
            void upsertScheduledDeliverable({
                ...target,
                enabled: !target.enabled,
            }).then(() =>
                data.setDeliverables((current) =>
                    current.map((item) =>
                        item.id === id
                            ? { ...item, enabled: !item.enabled }
                            : item,
                    ),
                ),
            );
        },
        [data],
    );
    const createDeliverable = useCallback(
        (
            name: string,
            outputType: AutomationDeliverable['outputType'],
            deliveryDestination: AutomationDeliverable['deliveryDestination'],
        ) => {
            if (!userId) return Promise.reject(new Error('Unauthorized'));
            return upsertScheduledDeliverable({
                userId,
                name,
                sourceWidgets: ['Tasks'],
                outputType,
                schedule: { type: 'daily', time: '09:00', timezone: 'UTC' },
                deliveryDestination,
                approvalMode: 'review',
                enabled: false,
            }).then((created) => {
                data.setDeliverables((current) => [created, ...current]);
                return created;
            });
        },
        [data, userId],
    );
    return { toggleDeliverable, createDeliverable };
}

export function useAutomationCenterSummary(data: AutomationCenterData) {
    const nextDeliverable = useMemo(
        () =>
            data.deliverables
                .filter((item) => item.enabled && item.nextGeneratedAt)
                .toSorted((a, b) =>
                    (a.nextGeneratedAt ?? '').localeCompare(
                        b.nextGeneratedAt ?? '',
                    ),
                )[0],
        [data.deliverables],
    );
    const latestFailed = useMemo(
        () => data.instances.find((item) => item.status === 'error'),
        [data.instances],
    );
    return { nextDeliverable, latestFailed };
}
