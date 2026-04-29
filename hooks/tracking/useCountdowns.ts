'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/hooks/auth/useAuth';

export interface Countdown {
    id: string;
    name: string;
    target_date: string;
    emoji: string;
}

export function useCountdowns() {
    const { user } = useAuth();
    const [countdowns, setCountdowns] = useState<Countdown[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;

        (async () => {
            const { data } = await supabase
                .from('countdowns')
                .select('id, name, target_date, emoji')
                .eq('user_id', user.id)
                .gte('target_date', new Date().toISOString())
                .order('target_date', { ascending: true });

            if (!cancelled) {
                setCountdowns(data || []);
                setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    const addCountdown = useCallback(
        async (name: string, target_date: string, emoji: string) => {
            if (!user?.id || !name.trim() || !target_date) return;
            const { data, error } = await supabase
                .from('countdowns')
                .insert({
                    user_id: user.id,
                    name: name.trim(),
                    target_date,
                    emoji,
                })
                .select('id, name, target_date, emoji')
                .single();
            if (!error && data) {
                setCountdowns((prev) =>
                    [...prev, data].sort(
                        (a, b) =>
                            new Date(a.target_date).getTime() -
                            new Date(b.target_date).getTime(),
                    ),
                );
            }
        },
        [user?.id],
    );

    const deleteCountdown = useCallback(async (id: string) => {
        await supabase.from('countdowns').delete().eq('id', id);
        setCountdowns((prev) => prev.filter((c) => c.id !== id));
    }, []);

    return { countdowns, loading, addCountdown, deleteCountdown };
}
