'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Always request the full combined Google scope set so that connecting Gmail
// doesn't overwrite calendar tokens (and vice versa) — we store one Google
// token row per user that must cover all services.
const GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.events',
].join(' ');

export interface ConnectedAccount {
    id: string;
    provider: 'google' | 'microsoft';
    email: string;
    display_name: string | null;
}

export function useEmailConnection() {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const timeoutId = window.setTimeout(() => {
            if (!user?.id) {
                setLoading(false);
                return;
            }
            void supabase
                .from('user_email_accounts')
                .select('id, provider, email, display_name')
                .eq('user_id', user.id)
                .then(({ data }) => {
                    if (!cancelled) {
                        setAccounts((data as ConnectedAccount[]) ?? []);
                        setLoading(false);
                    }
                });
        }, 0);
        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [user?.id]);

    const connectGmail = useCallback(() => {
        void supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: GMAIL_SCOPES,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent select_account',
                },
                redirectTo: `${window.location.origin}/auth/callback?next=/inbox`,
            },
        });
    }, []);

    const connectOutlook = useCallback(() => {
        const redirect = encodeURIComponent(window.location.pathname);
        window.location.assign(
            `/api/auth/microsoft/start?redirect=${redirect}`,
        );
    }, []);

    const googleAccounts = accounts.filter((a) => a.provider === 'google');
    const microsoftAccounts = accounts.filter(
        (a) => a.provider === 'microsoft',
    );
    const hasGmail = googleAccounts.length > 0;
    const hasMicrosoft = microsoftAccounts.length > 0;
    const hasAny = accounts.length > 0;

    return {
        accounts,
        googleAccounts,
        microsoftAccounts,
        hasGmail,
        hasMicrosoft,
        hasAny,
        loading,
        connectGmail,
        connectOutlook,
    };
}
