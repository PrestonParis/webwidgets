'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { MoodEntry } from '@/types/mood';

export function useMoodLog() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<MoodEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;

        (async () => {
            const { data } = await supabase.from('mood_logs').select(`
                id,
                user_id,
                mood,
                note,
                tags,
                logged_date,
                created_at,
                updated_at
            `);
            const formatted = (data || []).map((d) => ({
                ...d,
                score: d.mood,
            }));
            if (!cancelled) {
                setEntries(formatted);
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
                // Format the returned data to match MoodEntry type
                const formattedEntry: MoodEntry = {
                    ...data,
                    score: data.mood,
                    tags: null, // or appropriate default
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    user_id: user.id,
                };

                setEntries((prev) => [
                    formattedEntry,
                    ...prev.filter((e) => e.logged_date !== today),
                ]);
            }
        },
        [user],
    );

    return { entries, loading, logMood };
}
