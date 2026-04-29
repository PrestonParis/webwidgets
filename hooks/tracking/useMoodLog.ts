'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/hooks/auth/useAuth';

export interface MoodEntry {
    id: string;
    mood: number;
    note: string | null;
    logged_date: string;
}

export function useMoodLog() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<MoodEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;

        (async () => {
            const { data } = await supabase
                .from('mood_logs')
                .select('id, mood, note, logged_date')
                .eq('user_id', user.id)
                .order('logged_date', { ascending: false })
                .limit(30);

            if (!cancelled) {
                setEntries(data || []);
                setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    const logMood = useCallback(
        async (mood: number, note?: string) => {
            if (!user?.id) return;
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('mood_logs')
                .upsert(
                    {
                        user_id: user.id,
                        mood,
                        note: note || null,
                        logged_date: today,
                        logged_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id,logged_date' },
                )
                .select('id, mood, note, logged_date')
                .single();

            if (!error && data) {
                setEntries((prev) => [
                    data,
                    ...prev.filter((e) => e.logged_date !== today),
                ]);
            }
        },
        [user?.id],
    );

    return { entries, loading, logMood };
}
