'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDebounce } from '@/hooks/global/useDebounce';

export type SaveStatus = 'idle' | 'saving' | 'saved';

export function useQuickNote() {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [status, setStatus] = useState<SaveStatus>('idle');
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;

        (async () => {
            const { data } = await supabase
                .from('quick_notes')
                .select('content')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!cancelled) {
                setContent(data?.content ?? '');
                setLoaded(true);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    const persist = useDebounce(async (text: string) => {
        if (!user?.id) return;
        setStatus('saving');
        await supabase.from('quick_notes').upsert(
            {
                user_id: user.id,
                content: text,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
        );
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2000);
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
