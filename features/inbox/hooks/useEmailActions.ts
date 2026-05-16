'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { Email, EmailAction } from '@/features/inbox/types/inbox';
import { useNotificationStore } from '@/features/notifications/hooks/useNotificationStore';
import {
    fetchExtractedActions,
    confirmActions,
    rejectAction as rejectActionApi,
} from '@/features/inbox/lib/inboxApiService';

const NOTIFIED_KEY = 'notified_action_ids';

function getNotifiedSet(): Set<string> {
    try {
        const raw = localStorage.getItem(NOTIFIED_KEY);
        return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
        return new Set();
    }
}

function markNotified(id: string): void {
    try {
        const set = getNotifiedSet();
        set.add(id);
        localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...set]));
    } catch {
        /* localStorage unavailable */
    }
}

export function useEmailActions(emails: Email[], allEmails?: Email[]) {
    const [actions, setActions] = useState<EmailAction[]>([]);
    const [loading, setLoading] = useState(false);
    const [extractingId, setExtractingId] = useState<string | null>(null);
    const [extractingAll, setExtractingAll] = useState(false);
    const processedKey = useRef<string>('');
    const addNotification = useNotificationStore((s) => s.addNotification);

    const applyActions = useCallback(
        (newActions: EmailAction[]) => {
            setActions(newActions);
            const notified = getNotifiedSet();
            for (const action of newActions) {
                if (action.completed || notified.has(action.id)) continue;
                if (action.type === 'action' || action.type === 'deadline') {
                    addNotification({
                        widgetId: 'inbox',
                        title: action.title,
                        body: action.description ?? action.type,
                        category: action.type === 'deadline' ? 'alert' : 'info',
                    });
                    markNotified(action.id);
                }
            }
        },
        [addNotification],
    );

    const fetchActions = useCallback(
        async (batch: Email[]) => {
            if (batch.length === 0) return;
            setLoading(true);
            try {
                const newActions = await fetchExtractedActions(batch);
                applyActions(newActions);
            } catch (err) {
                console.error('useEmailActions fetch error:', err);
            } finally {
                setLoading(false);
            }
        },
        [applyActions],
    );

    useEffect(() => {
        if (emails.length === 0) return;
        const key = emails.map((e) => e.id).join(',');
        if (key === processedKey.current) return;
        processedKey.current = key;
        void fetchActions(emails);
    }, [emails, fetchActions]);

    // Manually extract actions for a single email (force re-process)
    const extractSingle = useCallback(async (email: Email) => {
        setExtractingId(email.id);
        try {
            const newActions = await fetchExtractedActions([email], {
                force: true,
            });
            // Merge new actions for this email with existing actions for other emails
            setActions((prev) => {
                const otherActions = prev.filter(
                    (a) => a.email_id !== email.id,
                );
                return [
                    ...otherActions,
                    ...newActions.filter((a) => a.email_id === email.id),
                ];
            });
        } catch (err) {
            console.error('extractSingle error:', err);
        } finally {
            setExtractingId(null);
        }
    }, []);

    // Force re-extract all loaded emails (uses allEmails when provided to include pages beyond the first)
    const extractAll = useCallback(async () => {
        const target = allEmails && allEmails.length > 0 ? allEmails : emails;
        if (target.length === 0) return;
        setExtractingAll(true);
        try {
            // Process in batches of 50 (API limit)
            const batches: Email[][] = [];
            for (let i = 0; i < target.length; i += 50) {
                batches.push(target.slice(i, i + 50));
            }
            const allNewActions: EmailAction[] = [];
            for (const batch of batches) {
                const batchActions = await fetchExtractedActions(batch, {
                    force: true,
                });
                allNewActions.push(...batchActions);
            }
            applyActions(allNewActions);
        } catch (err) {
            console.error('extractAll error:', err);
        } finally {
            setExtractingAll(false);
        }
    }, [emails, allEmails, applyActions]);

    const toggleComplete = useCallback(
        async (actionId: string) => {
            const action = actions.find((a) => a.id === actionId);
            if (!action) return;
            const next = !action.completed;
            setActions((prev) =>
                prev.map((a) =>
                    a.id === actionId ? { ...a, completed: next } : a,
                ),
            );
            await supabase
                .from('email_actions')
                .update({ completed: next })
                .eq('id', actionId);
        },
        [actions],
    );

    const confirmAction = useCallback(async (actionId: string) => {
        await confirmActions([actionId]);
        setActions((prev) =>
            prev.map((a) => (a.id === actionId ? { ...a, synced: true } : a)),
        );
    }, []);

    const confirmAllForEmail = useCallback(
        async (emailId: string) => {
            const pending = actions.filter(
                (a) => a.email_id === emailId && !a.synced && !a.completed,
            );
            if (pending.length === 0) return;
            const ids = pending.map((a) => a.id);
            await confirmActions(ids);
            setActions((prev) =>
                prev.map((a) =>
                    ids.includes(a.id) ? { ...a, synced: true } : a,
                ),
            );
        },
        [actions],
    );

    const rejectAction = useCallback(async (actionId: string) => {
        await rejectActionApi(actionId);
        setActions((prev) => prev.filter((a) => a.id !== actionId));
    }, []);

    return {
        actions,
        loading,
        extractingId,
        extractingAll,
        extractSingle,
        extractAll,
        toggleComplete,
        confirmAction,
        confirmAllForEmail,
        rejectAction,
    };
}
