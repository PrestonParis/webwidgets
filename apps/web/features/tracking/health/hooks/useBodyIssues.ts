'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuthContext } from '@/features/auth/components/AuthContext';
import {
    type BodyIssue,
    type BodyIssueHistory,
    type BodyIssueDraft,
    type IssueStatus,
    packIssueNotes,
    rowToIssue,
    rowToHistory,
} from '@/features/tracking/health/lib/bodyIssues';

export interface UseBodyIssuesResult {
    issues: BodyIssue[];
    history: Map<string, BodyIssueHistory[]>;
    loading: boolean;
    refetch: () => Promise<void>;
    createIssue: (draft: BodyIssueDraft) => Promise<BodyIssue>;
    updateIssue: (
        id: string,
        updates: Partial<Omit<BodyIssue, 'id' | 'userId' | 'createdAt'>>,
    ) => Promise<void>;
    resolveIssue: (id: string) => Promise<void>;
    resolveAllForRegion: (regionId: string) => Promise<void>;
    deleteIssue: (id: string) => Promise<void>;
}

export function useBodyIssues(): UseBodyIssuesResult {
    const { user } = useAuthContext();
    const userId = user?.id ?? null;
    // body_issues / body_issue_history are not yet in the generated Supabase types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const [issues, setIssues] = useState<BodyIssue[]>([]);
    const [history, setHistory] = useState<Map<string, BodyIssueHistory[]>>(
        new Map(),
    );
    const [loading, setLoading] = useState(true);

    const refetch = useCallback(async () => {
        if (!userId) {
            setIssues([]);
            setHistory(new Map());
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [{ data: issueRows }, { data: histRows }] = await Promise.all(
                [
                    supabase
                        .from('body_issues')
                        .select('*')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('body_issue_history')
                        .select('*')
                        .order('recorded_at', { ascending: true }),
                ],
            );
            const parsed = (issueRows ?? []).map(rowToIssue);
            setIssues(parsed);
            const histMap = new Map<string, BodyIssueHistory[]>();
            for (const row of histRows ?? []) {
                const h = rowToHistory(row);
                const arr = histMap.get(h.issueId) ?? [];
                arr.push(h);
                histMap.set(h.issueId, arr);
            }
            setHistory(histMap);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void refetch();
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [refetch]);

    const createIssue = useCallback(
        async (draft: BodyIssueDraft): Promise<BodyIssue> => {
            if (!userId) throw new Error('Not authenticated');
            const { data, error } = await supabase
                .from('body_issues')
                .insert({
                    user_id: userId,
                    region_id: draft.regionId,
                    region_type: draft.regionType,
                    issue_type: draft.issueType,
                    severity: draft.severity,
                    onset_date: draft.onsetDate,
                    duration_type: draft.durationType,
                    status: draft.status,
                    notes: packIssueNotes(draft.notes, draft.skinDrawing),
                    triggers: draft.triggers,
                    skin_x: draft.skinX ?? null,
                    skin_y: draft.skinY ?? null,
                    tooth_number: draft.toothNumber ?? null,
                })
                .select()
                .single();
            if (error) throw error;
            const issue = rowToIssue(data);
            setIssues((prev) => [issue, ...prev]);
            return issue;
        },
        [userId],
    );

    const updateIssue = useCallback(
        async (
            id: string,
            updates: Partial<Omit<BodyIssue, 'id' | 'userId' | 'createdAt'>>,
        ) => {
            const prev = issues.find((i) => i.id === id);
            if (!prev) return;
            // Snapshot to history before update
            await db.from('body_issue_history').insert({
                issue_id: id,
                severity: prev.severity,
                status: prev.status,
                notes: prev.notes ?? null,
            });
            await supabase
                .from('body_issues')
                .update({
                    ...(updates.issueType !== undefined && {
                        issue_type: updates.issueType,
                    }),
                    ...(updates.severity !== undefined && {
                        severity: updates.severity,
                    }),
                    ...(updates.status !== undefined && {
                        status: updates.status,
                    }),
                    ...((updates.notes !== undefined ||
                        updates.skinDrawing !== undefined) && {
                        notes: packIssueNotes(
                            updates.notes ?? prev.notes,
                            updates.skinDrawing ?? prev.skinDrawing,
                        ),
                    }),
                    ...(updates.triggers !== undefined && {
                        triggers: updates.triggers,
                    }),
                    ...(updates.durationType !== undefined && {
                        duration_type: updates.durationType,
                    }),
                })
                .eq('id', id);
            await refetch();
        },
        [issues, refetch],
    );

    const resolveIssue = useCallback(
        async (id: string) => {
            await updateIssue(id, { status: 'resolved' as IssueStatus });
        },
        [updateIssue],
    );

    const resolveAllForRegion = useCallback(
        async (regionId: string) => {
            const active = issues.filter(
                (i) => i.regionId === regionId && i.status !== 'resolved',
            );
            await Promise.all(active.map((i) => resolveIssue(i.id)));
        },
        [issues, resolveIssue],
    );

    const deleteIssue = useCallback(async (id: string) => {
        await db.from('body_issues').delete().eq('id', id);
        setIssues((prev) => prev.filter((i) => i.id !== id));
    }, []);

    return {
        issues,
        history,
        loading,
        refetch,
        createIssue,
        updateIssue,
        resolveIssue,
        resolveAllForRegion,
        deleteIssue,
    };
}
