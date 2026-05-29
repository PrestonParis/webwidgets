'use client';

// Mutation-only hook for logging mood entries.
// The read side (listing mood logs) is handled by the runtime adapter pipeline
// via useWidgetData → import-export/exports → moodAdapter.
// This hook only handles writes (logMood) and optimistic state updates.

import { useCallback, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { MoodEntry } from '@/features/mood/types/mood';

function localDateStr(ts: number): string {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function useMoodMutation(onSuccess?: (entry: MoodEntry) => void) {
    const { user } = useAuth();
    const [pending, setPending] = useState(false);

    const logMood = useCallback(
        async (mood: number, date?: string) => {
            if (!user?.id) return;
            setPending(true);
            const logged_date = date ?? localDateStr(Date.now());
            const logged_at = new Date().toISOString();

            try {
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
                    const entry: MoodEntry = {
                        id: data.id as string,
                        user_id: user.id,
                        mood: data.mood as number,
                        score: data.mood as number,
                        note: (data.note as string | null) ?? null,
                        logged_date: data.logged_date as string,
                        logged_at: data.logged_at as string,
                    };
                    onSuccess?.(entry);
                }
            } finally {
                setPending(false);
            }
        },
        [user, onSuccess],
    );

    return { logMood, pending };
}
