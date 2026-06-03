import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import { JournalEntry } from '@/features/journal/types/journal';
import { z } from 'zod';

const journalEntrySchema = z.object({
    id: z.number(),
    title: z.string(),
    content: z.string(),
    image_url: z.string().nullable(),
    deleted_at: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string().nullable().optional(),
    metadata: z.unknown().optional(),
    type: z.enum(['journal', 'document', 'note']).default('journal'),
});

const journalEntryArraySchema = z.array(journalEntrySchema);

export function useJournalEntries(
    userId: string | undefined,
    noteType?: 'journal' | 'document' | 'note',
) {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [view, setView] = useState<'all' | 'trash'>('all');

    const fetchEntries = useCallback(async () => {
        if (!userId) return;

        let query = supabase
            .from('journals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (noteType) query = query.eq('type', noteType);
        if (view === 'all') query = query.is('deleted_at', null);
        else query = query.not('deleted_at', 'is', null);

        const { data, error } = await query;
        if (error) console.error('Fetch error:', error.message, error.hint);
        else {
            const parsed = journalEntryArraySchema.safeParse(data);
            return parsed.success ? (parsed.data as JournalEntry[]) : [];
        }
    }, [userId, view, noteType]);

    useEffect(() => {
        let isMounted = true;
        const timeoutId = window.setTimeout(() => {
            setEntries([]);

            const load = async () => {
                const data = await fetchEntries();
                if (isMounted && data) setEntries(data);
            };

            void load();
        }, 0);
        return () => {
            isMounted = false;
            window.clearTimeout(timeoutId);
        };
    }, [fetchEntries, refreshKey]);

    const handleDelete = useCallback(
        async (id: number) => {
            if (!userId) return;

            const { error } = await supabase
                .from('journals')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', String(id))
                .eq('user_id', userId);

            if (error) console.error('Delete error:', error.message);
            else setEntries((prev) => prev.filter((e) => e.id !== id));

            return !error;
        },
        [userId],
    );

    const handleRestore = useCallback(
        async (id: number) => {
            if (!userId) return;

            const { error } = await supabase
                .from('journals')
                .update({ deleted_at: null })
                .eq('id', String(id))
                .eq('user_id', userId);

            if (!error) setRefreshKey((k) => k + 1);
            return !error;
        },
        [userId],
    );

    return {
        entries,
        view,
        setView,
        refreshEntries: () => setRefreshKey((k) => k + 1),
        handleDelete,
        handleRestore,
    };
}
