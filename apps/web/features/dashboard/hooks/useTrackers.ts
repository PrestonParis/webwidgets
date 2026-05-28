'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { Tracker } from '@/features/recovery/types/recovery';
import { isAbortError } from '@/lib/utils/errorHelpers';

async function fetchTrackersFromDB(userId: string): Promise<Tracker[]> {
    const { data } = await supabase
        .from('recovery_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (!data || data.length === 0) return [];

    const trackerIds = data.map((t) => t.id);

    const { data: relapseData } = await supabase
        .from('relapses')
        .select('tracker_id, relapsed_at')
        .in('tracker_id', trackerIds)
        .order('relapsed_at', { ascending: false });

    const latestRelapse = new Map<string, string>();
    for (const r of (relapseData ?? []) as {
        tracker_id: string;
        relapsed_at: string;
    }[]) {
        if (!latestRelapse.has(r.tracker_id)) {
            latestRelapse.set(r.tracker_id, r.relapsed_at);
        }
    }

    return data.flatMap((t) =>
        t.addiction !== null && t.start_time !== null && t.created_at !== null
            ? [
                  {
                      id: t.id,
                      addiction: t.addiction,
                      start_time: latestRelapse.get(t.id) ?? t.start_time,
                      created_at: t.created_at,
                  },
              ]
            : [],
    );
}

export function useTrackers() {
    const { user, status } = useAuthContext();
    const [trackers, setTrackers] = useState<Tracker[] | null>(null);

    useEffect(() => {
        if (!user?.id) {
            const timeoutId = window.setTimeout(() => setTrackers([]), 0);
            return () => window.clearTimeout(timeoutId);
        }

        const userId = user.id;
        let mounted = true;
        const timeoutId = window.setTimeout(() => {
            void load();
        }, 0);

        async function load() {
            try {
                const result = await fetchTrackersFromDB(userId);
                if (mounted) {
                    setTrackers(result);
                }
            } catch (error) {
                if (!isAbortError(error)) {
                    console.error('Error loading trackers:', error);
                }
                if (mounted) {
                    setTrackers([]);
                }
            }
        }

        return () => {
            mounted = false;
            window.clearTimeout(timeoutId);
        };
    }, [user?.id, status]);

    const handleReset = async (id: string, newStartTime: string) => {
        await supabase
            .from('relapses')
            .insert({ relapsed_at: newStartTime, tracker_id: id });
        await supabase
            .from('recovery_profiles')
            .update({ start_time: newStartTime })
            .eq('id', id);
        setTrackers((prev) =>
            prev
                ? prev.map((t) =>
                      t.id === id ? { ...t, start_time: newStartTime } : t,
                  )
                : prev,
        );
    };

    return { trackers, handleReset };
}
