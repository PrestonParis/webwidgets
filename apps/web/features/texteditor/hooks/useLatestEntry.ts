'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/lib/db/supabase';
import type { JournalEntry } from '@/features/journal/types/journal';

const entrySchema = z.object({
    id: z.number(),
    title: z.string(),
    content: z.string(),
    created_at: z.string(),
    type: z.enum(['journal', 'document', 'note']).default('journal'),
    image_url: z.string().nullable(),
    deleted_at: z.string().nullable(),
});

export function useLatestEntry(
    userId: string | undefined,
    noteType: 'journal' | 'document' | 'note',
) {
    const [entry, setEntry] = useState<JournalEntry | null>(null);
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;

        void (async () => {
            const { data, count: total } = await supabase
                .from('journals')
                .select('*', { count: 'exact' })
                .eq('user_id', userId)
                .eq('type', noteType)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(1);

            if (cancelled) return;
            const parsed = entrySchema.safeParse(data?.[0]);
            setEntry(parsed.success ? (parsed.data as JournalEntry) : null);
            setCount(total ?? 0);
        })();

        return () => {
            cancelled = true;
        };
    }, [userId, noteType]);

    return { entry, count };
}
