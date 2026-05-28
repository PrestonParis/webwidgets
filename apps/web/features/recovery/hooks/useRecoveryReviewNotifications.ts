'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuthContext } from '@/features/auth/components/AuthContext';
import { useNotificationStore } from '@/features/notifications/hooks/useNotificationStore';

function trackerNeedsReview(trackerId: string): boolean {
    const last = localStorage.getItem(`recovery_last_reviewed_${trackerId}`);
    if (!last) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(last) < today;
}

export function useRecoveryReviewNotifications() {
    const { user } = useAuthContext();

    useEffect(() => {
        const check = async () => {
            if (!user?.id) return;

            const { data, error } = await supabase
                .from('recovery_profiles')
                .select('id, addiction')
                .eq('user_id', user.id);
            if (error || !data) return;

            const { notifications, addNotification } =
                useNotificationStore.getState();

            for (const tracker of data as { id: string; addiction: string }[]) {
                if (!trackerNeedsReview(tracker.id)) continue;
                const widgetId = `recovery-review-${tracker.id}`;
                const alreadyQueued = notifications.some(
                    (n) => n.widgetId === widgetId && !n.read,
                );
                if (alreadyQueued) continue;
                addNotification({
                    widgetId,
                    title: `Review days — ${tracker.addiction}`,
                    body: 'You have unreviewed days. Open your recovery tracker to log them.',
                    category: 'info',
                    href: '/recovery',
                });
            }
        };

        void check();
    }, [user]);
}
