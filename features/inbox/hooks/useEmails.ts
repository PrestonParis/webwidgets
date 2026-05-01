'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Email } from '@/features/inbox/types/inbox';

export function useEmails() {
    const { user } = useAuth();
    const [emails, setEmails] = useState<Email[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const hasFetched = useRef(false);

    const loadEmails = useCallback(
        async (token?: string) => {
            if (!user || isUnauthorized) return;
            setLoading(true);

            try {
                const url = token
                    ? `/api/gmail/inbox?pageToken=${token}`
                    : '/api/gmail/inbox';

                const res = await fetch(url, {
                    credentials: 'include',
                    cache: 'no-store',
                });

                if (res.status === 401 || res.status === 403) {
                    setIsUnauthorized(true);
                    setLoading(false);
                    return;
                }

                if (!res.ok) throw new Error('Inbox API Fail');

                const data = await res.json();

                setEmails((prev) =>
                    token
                        ? [...prev, ...(data.emails || [])]
                        : data.emails || [],
                );

                setNextPageToken(data.nextPageToken);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        },
        [user, isUnauthorized],
    );

    useEffect(() => {
        if (user && !hasFetched.current && !isUnauthorized) {
            hasFetched.current = true;
            loadEmails();
        }
        return () => {
            if (user) hasFetched.current = false;
        };
    }, [user, loadEmails, isUnauthorized]);

    const handleManualClassify = async (
        email_id: string,
        category: string,
        sender: string,
        subject: string,
    ) => {
        setEmails((prev) =>
            prev.map((m) =>
                m.id === email_id ? { ...m, category, is_manual: true } : m,
            ),
        );

        await supabase.from('email_classifications').upsert(
            {
                user_id: user?.id,
                email_id,
                category,
                sender,
                subject,
                is_manual: true,
            },
            { onConflict: 'user_id,email_id' },
        );
    };

    return {
        user,
        emails,
        nextPageToken,
        loading,
        isUnauthorized,
        loadEmails,
        handleManualClassify,
    };
}
