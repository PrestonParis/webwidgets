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

interface LegacyConnectionFlags {
    has_gmail: boolean | null;
    has_microsoft: boolean | null;
}

function legacyAccounts(
    userId: string,
    flags: LegacyConnectionFlags | null,
): ConnectedAccount[] {
    const accounts: ConnectedAccount[] = [];
    if (flags?.has_gmail) {
        accounts.push({
            id: `legacy-google-${userId}`,
            provider: 'google',
            email: '',
            display_name: null,
        });
    }
    if (flags?.has_microsoft) {
        accounts.push({
            id: `legacy-microsoft-${userId}`,
            provider: 'microsoft',
            email: '',
            display_name: null,
        });
    }
    return accounts;
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
            const accountDb = supabase as unknown as {
                from: (table: 'user_email_accounts') => {
                    select: (cols: string) => {
                        eq: (
                            col: 'user_id',
                            val: string,
                        ) => Promise<{ data: ConnectedAccount[] | null }>;
                    };
                };
            };
            void Promise.all([
                accountDb
                    .from('user_email_accounts')
                    .select('id, provider, email, display_name')
                    .eq('user_id', user.id),
                supabase
                    .from('user_tokens')
                    .select('has_gmail, has_microsoft')
                    .eq('user_id', user.id)
                    .maybeSingle(),
            ])
                .then(([accountResult, tokenResult]) => {
                    if (cancelled) return;

                    const currentAccounts =
                        (accountResult.data as ConnectedAccount[] | null) ?? [];
                    const providers = new Set(
                        currentAccounts.map((account) => account.provider),
                    );
                    const fallbackAccounts = legacyAccounts(
                        user.id,
                        tokenResult.data as LegacyConnectionFlags | null,
                    ).filter((account) => !providers.has(account.provider));

                    setAccounts([...currentAccounts, ...fallbackAccounts]);
                })
                .catch(() => {
                    if (!cancelled) setAccounts([]);
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
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
