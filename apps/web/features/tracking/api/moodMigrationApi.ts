'use client';

import { supabase, db } from '@/lib/db/supabase';

interface MoodLogRow {
    id: string;
    mood: number;
    logged_date: string;
    logged_at: string;
    note: string | null;
}

export async function migrateMoodLogs(userId: string): Promise<number> {
    const { data: moodLogs, error: fetchError } = await supabase
        .from('mood_logs')
        .select('id, mood, logged_date, logged_at, note')
        .eq('user_id', userId);

    if (fetchError) throw fetchError;
    if (!moodLogs || moodLogs.length === 0) return 0;

    const { data: existing, error: existingError } = await db
        .from('tracking_entries')
        .select('entry_date')
        .eq('user_id', userId)
        .eq('category', 'mood');

    if (existingError) throw existingError;

    const existingDates = new Set(
        ((existing as { entry_date: string }[]) ?? []).map((r) => r.entry_date),
    );

    const toInsert = (moodLogs as MoodLogRow[]).filter(
        (log) => !existingDates.has(log.logged_date),
    );

    if (toInsert.length === 0) return 0;

    const rows = toInsert.map((log) => ({
        user_id: userId,
        category: 'mood',
        entry_date: log.logged_date,
        logged_at: log.logged_at,
        metadata: { score: log.mood, energy: null },
        tags: [] as string[],
        source: 'import',
        ...(log.note !== null && { notes: log.note }),
    }));

    const { error: insertError } = await db
        .from('tracking_entries')
        .insert(rows);
    if (insertError) throw insertError;

    return rows.length;
}
