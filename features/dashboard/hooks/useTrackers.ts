'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/db/supabase';
import { Tracker } from '@/features/recovery/types/recovery';

export function useTrackers() {
    const [trackers, setTrackers] = useState<Tracker[] | null>(null);

    useEffect(() => {
        async function fetchTrackers() {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from('recovery_profiles')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });
            setTrackers(data || []);
        }
        void fetchTrackers();
    }, []);

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
