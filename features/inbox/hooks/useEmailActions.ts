'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { Email, EmailAction } from '@/features/inbox/types/inbox';
import { useNotificationStore } from '@/features/notifications/hooks/useNotificationStore';
import { fetchExtractedActions } from '@/features/inbox/lib/inboxApiService';

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
        // localStorage unavailable
    }
}

export function useEmailActions(emails: Email[]) {
    const [actions, setActions] = useState<EmailAction[]>([]);
    const [loading, setLoading] = useState(false);
    const processedKey = useRef<string>('');
    const addNotification = useNotificationStore((s) => s.addNotification);

    const fetchActions = useCallback(
        async (batch: Email[]) => {
            if (batch.length === 0) return;
            setLoading(true);
            try {
                const newActions = await fetchExtractedActions(batch);
                setActions(newActions);

                const notified = getNotifiedSet();
                for (const action of newActions) {
                    if (action.completed || notified.has(action.id)) continue;
                    if (
                        action.type === 'action' ||
                        action.type === 'deadline'
                    ) {
                        addNotification({
                            widgetId: 'inbox',
                            title: action.title,
                            body: action.description ?? action.type,
                            category:
                                action.type === 'deadline' ? 'alert' : 'info',
                        });
                        markNotified(action.id);
                    }
                }
            } catch (err) {
                console.error('useEmailActions fetch error:', err);
            } finally {
                setLoading(false);
            }
        },
        [addNotification],
    );

    useEffect(() => {
        if (emails.length === 0) return;
        const key = emails.map((e) => e.id).join(',');
        if (key === processedKey.current) return;
        processedKey.current = key;
        void fetchActions(emails);
    }, [emails, fetchActions]);

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

    return { actions, loading, toggleComplete };
}
