'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDebounce } from '@/features/ui/hooks/useDebounce';
import { z } from 'zod';

export type SaveStatus = 'idle' | 'saving' | 'saved';

const quickNoteSchema = z.object({
    content: z.string().nullable().optional(),
});

export function useQuickNote() {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [status, setStatus] = useState<SaveStatus>('idle');
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;

        void (async () => {
            const { data } = await supabase
                .from('quick_notes')
                .select('content')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!cancelled) {
                const parsed = quickNoteSchema.safeParse(data);
                setContent(parsed.success ? (parsed.data.content ?? '') : '');
                setLoaded(true);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    const persist = useDebounce((text: string) => {
        if (!user?.id) return;
        setStatus('saving');
        void supabase
            .from('quick_notes')
            .upsert(
                {
                    user_id: user.id,
                    content: text,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' },
            )
            .then(() => {
                setStatus('saved');
                setTimeout(() => setStatus('idle'), 2000);
            });
    }, 1000);

    const updateContent = useCallback(
        (text: string) => {
            setContent(text);
            setStatus('saving');
            persist(text);
        },
        [persist],
    );

    return { content, updateContent, status, loaded };
}
