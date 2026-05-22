'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '@/lib/db/supabase';
import { Email, EmailAction } from '@/features/inbox/types/inbox';
import { useNotificationStore } from '@/features/notifications/hooks/useNotificationStore';
import {
    fetchExtractedActions,
    confirmActions,
    rejectAction as rejectActionApi,
} from '@/features/inbox/lib/inboxApiService';

const NOTIFIED_KEY = 'notified_action_ids';
type AddNotification = ReturnType<
    typeof useNotificationStore.getState
>['addNotification'];

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

function notifyNewActions(
    newActions: EmailAction[],
    addNotification: AddNotification,
) {
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
}

async function processInBatches(emails: Email[]): Promise<EmailAction[]> {
    const all: EmailAction[] = [];
    for (let i = 0; i < emails.length; i += 50) {
        all.push(
            ...(await fetchExtractedActions(emails.slice(i, i + 50), {
                force: true,
            })),
        );
    }
    return all;
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
            notifyNewActions(newActions, addNotification);
        },
        [addNotification],
    );

    const fetchActions = useCallback(
        async (batch: Email[]): Promise<boolean> => {
            if (batch.length === 0) return true;
            setLoading(true);
            try {
                applyActions(await fetchExtractedActions(batch));
                return true;
            } catch (err) {
                console.error('useEmailActions fetch error:', err);
                return false;
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
        void fetchActions(emails).then((ok) => {
            if (!ok) processedKey.current = '';
        });
    }, [emails, fetchActions]);

    const extractSingle = useCallback(async (email: Email) => {
        setExtractingId(email.id);
        try {
            const newActions = await fetchExtractedActions([email], {
                force: true,
            });
            setActions((prev) => [
                ...prev.filter((a) => a.email_id !== email.id),
                ...newActions.filter((a) => a.email_id === email.id),
            ]);
        } catch (err) {
            console.error('extractSingle error:', err);
        } finally {
            setExtractingId(null);
        }
    }, []);

    const extractAll = useCallback(async () => {
        const target = allEmails && allEmails.length > 0 ? allEmails : emails;
        if (target.length === 0) return;
        setExtractingAll(true);
        try {
            applyActions(await processInBatches(target));
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
            await db
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
