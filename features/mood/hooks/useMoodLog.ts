'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { MoodEntry } from '@/features/mood/types/mood';
import { z } from 'zod';

const moodLogSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    mood: z.number(),
    note: z.string().nullable(),
    tags: z.array(z.string()).nullable(),
    logged_date: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
});

const moodLogArraySchema = z.array(moodLogSchema);

const moodUpsertSchema = z.object({
    id: z.string(),
    mood: z.number(),
    note: z.string().nullable(),
    logged_date: z.string(),
});

export function useMoodLog() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<MoodEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;

        void (async () => {
            const { data } = await supabase
                .from('mood_logs')
                .select(
                    'id, user_id, mood, note, tags, logged_date, created_at, updated_at',
                )
                .eq('user_id', user.id)
                .order('logged_date', { ascending: false });
            const parsed = moodLogArraySchema.safeParse(data);
            const formatted = (parsed.success ? parsed.data : []).map((d) => ({
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
            const today = new Date().toISOString().slice(0, 10);

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
                const parsed = moodUpsertSchema.safeParse(data);
                if (!parsed.success) return;
                // Format the returned data to match MoodEntry type
                const formattedEntry: MoodEntry = {
                    ...parsed.data,
                    score: parsed.data.mood,
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
