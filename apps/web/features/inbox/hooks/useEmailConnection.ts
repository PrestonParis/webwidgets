'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';

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
            const db = supabase as unknown as {
                from: (table: string) => {
                    select: (cols: string) => {
                        eq: (
                            col: string,
                            val: string,
                        ) => Promise<{ data: ConnectedAccount[] | null }>;
                    };
                };
            };
            void db
                .from('user_email_accounts')
                .select('id, provider, email, display_name')
                .eq('user_id', user.id)
                .then(({ data }) => {
                    if (!cancelled) {
                        setAccounts(data ?? []);
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
        const redirect = encodeURIComponent(window.location.pathname);
        window.location.assign(`/api/auth/google/start?redirect=${redirect}`);
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
