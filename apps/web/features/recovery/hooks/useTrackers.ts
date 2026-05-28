import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { Tracker } from '@/features/recovery/types/recovery';

async function fetchTrackersFromDB(userId: string): Promise<Tracker[]> {
    const { data, error } = await supabase
        .from('recovery_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) return [];

    const trackerIds = data.map((t) => t.id);

    // Fetch the latest relapse per tracker — this is the authoritative start_time
    // (recovery_profiles.start_time may be stale if the UPDATE policy was missing)
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
    const { user } = useAuthContext();
    const userId = user?.id ?? null;
    const [trackers, setTrackers] = useState<Tracker[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTrackers = useCallback(async () => {
        if (!userId) {
            setTrackers([]);
            setLoading(false);
            return;
        }

        const result = await fetchTrackersFromDB(userId);
        setTrackers(result);
        setLoading(false);
    }, [userId]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void fetchTrackers();
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [fetchTrackers]);

    return { trackers, setTrackers, loading, fetchTrackers };
}
