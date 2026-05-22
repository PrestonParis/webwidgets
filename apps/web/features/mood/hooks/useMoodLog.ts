'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { MoodEntry } from '@/features/mood/types/mood';
import { z } from 'zod';

function localDateStr(ts: number): string {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

const moodLogSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    mood: z.number(),
    note: z.string().nullable(),
    logged_date: z.string(),
    logged_at: z.string(),
});

const moodLogArraySchema = z.array(moodLogSchema);

const moodUpsertSchema = z.object({
    id: z.string(),
    mood: z.number(),
    note: z.string().nullable(),
    logged_date: z.string(),
    logged_at: z.string(),
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
                .select('id, user_id, mood, note, logged_at, logged_date')
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
        async (mood: number, date?: string) => {
            if (!user?.id) return;
            const logged_date = date ?? localDateStr(Date.now());
            const logged_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('mood_logs')
                .upsert(
                    {
                        user_id: user.id,
                        mood,
                        note: null,
                        logged_date,
                        logged_at,
                    },
                    { onConflict: 'user_id,logged_date' },
                )
                .select('id, mood, note, logged_at, logged_date')
                .single();

            if (!error && data) {
                const parsed = moodUpsertSchema.safeParse(data);
                if (!parsed.success) return;
                const formattedEntry: MoodEntry = {
                    ...parsed.data,
                    score: parsed.data.mood,
                    user_id: user.id,
                };

                setEntries((prev) => [
                    formattedEntry,
                    ...prev.filter((e) => e.logged_date !== logged_date),
                ]);
            }
        },
        [user],
    );

    return { entries, loading, logMood };
}
