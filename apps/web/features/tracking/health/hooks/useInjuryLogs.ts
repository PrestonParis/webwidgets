'use client';

import { useCallback, useMemo } from 'react';
import {
    applyInjuryStatus,
    buildNewInjuryLog,
    computeBodyMapAnalytics,
    findInjuryEntryId,
    injuryLogToMetadata,
    normalizeInjuryLogs,
} from '@/features/tracking/health/lib/analytics';
import type {
    InjuryLog,
    InjuryLogDraft,
    InjuryStatus,
} from '@/features/tracking/health/lib/types';
import type {
    BaseTrackingEntry,
    TrackingEntry,
} from '@/features/tracking/types/trackingEntryTypes';

interface UseInjuryLogsArgs {
    entries: TrackingEntry[];
    onAdd: (entry: BaseTrackingEntry) => Promise<void>;
    onUpdate: (
        id: string,
        updates: Partial<BaseTrackingEntry>,
    ) => Promise<void>;
}

interface UseInjuryLogsResult {
    injuryLogs: InjuryLog[];
    analytics: ReturnType<typeof computeBodyMapAnalytics>;
    saveLog: (draft: InjuryLogDraft) => Promise<void>;
    updateStatus: (logId: string, status: InjuryStatus) => Promise<void>;
}

/**
 * Shared injury-log read/write logic for the body map. Each new log is stored as
 * its own health TrackingEntry so status edits can target the owning entry.
 */
export function useInjuryLogs({
    entries,
    onAdd,
    onUpdate,
}: UseInjuryLogsArgs): UseInjuryLogsResult {
    const injuryLogs = useMemo(() => normalizeInjuryLogs(entries), [entries]);
    const analytics = useMemo(
        () => computeBodyMapAnalytics(injuryLogs),
        [injuryLogs],
    );

    const saveLog = useCallback(
        async (draft: InjuryLogDraft) => {
            const log = buildNewInjuryLog(draft);
            await onAdd({
                category: 'health',
                entryDate: log.createdAt.slice(0, 10),
                metadata: injuryLogToMetadata(log),
                tags: ['injury-log', log.bodyRegionId],
                source: 'manual',
            });
        },
        [onAdd],
    );

    const updateStatus = useCallback(
        async (logId: string, status: InjuryStatus) => {
            const log = injuryLogs.find((candidate) => candidate.id === logId);
            const entryId = findInjuryEntryId(entries, logId);
            if (!log || !entryId) return;
            await onUpdate(entryId, {
                metadata: applyInjuryStatus(log, status),
            });
        },
        [entries, injuryLogs, onUpdate],
    );

    return { injuryLogs, analytics, saveLog, updateStatus };
}
