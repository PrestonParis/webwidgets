'use client';

import { useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { EmailAction } from '@/features/inbox/types/inbox';
import { z } from 'zod';

const actionSchema = z.object({
    id: z.string(),
    email_id: z.string(),
    type: z.enum(['action', 'event', 'deadline']),
    title: z.string(),
    description: z.string().nullable(),
    due_date: z.string().nullable(),
    action_url: z.string().nullable(),
    completed: z.boolean(),
    synced: z.boolean().default(false),
    created_at: z.string(),
});

const LOG_LIMIT = 100;

export function useEmailActionLog() {
    const { user } = useAuth();
    const [log, setLog] = useState<EmailAction[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            setLoading(true);
            const { data } = await db
                .from('email_actions')
                .select('*')
                .eq('user_id', user.id)
                .eq('completed', true)
                .order('created_at', { ascending: false })
                .limit(LOG_LIMIT);
            const parsed = z.array(actionSchema).safeParse(data ?? []);
            setLog(parsed.success ? parsed.data : []);
            setLoading(false);
        };
        void load();
    }, [user]);

    const restore = useCallback(async (id: string) => {
        setLog((prev) => prev.filter((a) => a.id !== id));
        await db
            .from('email_actions')
            .update({ completed: false })
            .eq('id', id);
    }, []);

    return { log, loading, restore };
}
