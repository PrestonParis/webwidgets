'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ApprovalRecord } from '../types/collaboration';
import { cachedJson, clearCachedJson } from '@/lib/api/requestCache';

export function useWorkspaceApprovals(workspaceId: string) {
    const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const approvalsUrl = `/api/collaboration/workspaces/${workspaceId}/approvals`;

    const fetchApprovals = useCallback(async () => {
        if (!workspaceId) {
            setApprovals([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await cachedJson<ApprovalRecord[]>(approvalsUrl, {
                ttlMs: 15_000,
            });
            setApprovals(Array.isArray(data) ? data : []);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [workspaceId, approvalsUrl]);

    useEffect(() => {
        void fetchApprovals();
    }, [fetchApprovals]);

    const createApproval = useCallback(
        async (
            title: string,
            description?: string,
            handoffId?: string,
        ): Promise<void> => {
            const res = await fetch(approvalsUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    ...(description ? { description } : {}),
                    ...(handoffId ? { handoff_id: handoffId } : {}),
                }),
            });
            if (!res.ok) {
                const err = (await res.json().catch(() => ({}))) as {
                    error?: string;
                };
                throw new Error(err.error ?? 'Failed to create approval');
            }
            clearCachedJson(approvalsUrl);
            const approval = (await res.json()) as ApprovalRecord;
            setApprovals((prev) => [approval, ...prev]);
        },
        [approvalsUrl],
    );

    const resolveApproval = useCallback(
        async (
            approvalId: string,
            action: 'approve' | 'reject' | 'withdraw',
        ): Promise<void> => {
            const res = await fetch(`${approvalsUrl}/${approvalId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            if (!res.ok) {
                const err = (await res.json().catch(() => ({}))) as {
                    error?: string;
                };
                throw new Error(err.error ?? 'Failed to resolve approval');
            }
            clearCachedJson(approvalsUrl);
            const updated = (await res.json()) as ApprovalRecord;
            setApprovals((prev) =>
                prev.map((a) => (a.id === approvalId ? updated : a)),
            );
        },
        [approvalsUrl],
    );

    const refresh = useCallback(() => {
        clearCachedJson(approvalsUrl);
        void fetchApprovals();
    }, [fetchApprovals, approvalsUrl]);

    return { approvals, loading, createApproval, resolveApproval, refresh };
}
