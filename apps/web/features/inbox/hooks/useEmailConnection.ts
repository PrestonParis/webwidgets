'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';

const GMAIL_SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

export function useEmailConnection() {
    const { user } = useAuth();
    const [hasMicrosoft, setHasMicrosoft] = useState(false);
    const [loading, setLoading] = useState(true);

    const hasGmail =
        user?.identities?.some((id) => id.provider === 'google') ?? false;

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        void supabase
            .from('user_tokens')
            .select('has_microsoft')
            .eq('user_id', user.id)
            .maybeSingle()
            .then(({ data }) => {
                if (!cancelled) {
                    setHasMicrosoft(data?.has_microsoft ?? false);
                    setLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    const connectGmail = useCallback(() => {
        void supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: GMAIL_SCOPES,
                queryParams: { access_type: 'offline', prompt: 'consent' },
                redirectTo: `${window.location.origin}/auth/callback?next=/inbox`,
            },
        });
    }, []);

    const connectOutlook = useCallback(() => {
        const redirect = encodeURIComponent(window.location.pathname);
        window.location.href = `/api/auth/microsoft/start?redirect=${redirect}`;
    }, []);

    const hasAny = hasGmail || hasMicrosoft;

    return { hasGmail, hasMicrosoft, hasAny, loading, connectGmail, connectOutlook };
}
