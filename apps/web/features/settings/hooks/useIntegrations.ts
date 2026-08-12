'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuthContext } from '@/features/auth/components/AuthContext';

export interface IntegrationState {
    connected: boolean;
    hasKey: boolean;
}

type IntegrationMap = Record<string, IntegrationState>;
type UserIdentity = { provider?: string };
type IntegrationKeyRow = { provider: string };

const GOOGLE_OAUTH_IDS = ['gmail', 'google_calendar', 'google_drive'];
const MICROSOFT_OAUTH_IDS = ['outlook', 'outlook_calendar', 'onedrive'];

export function useIntegrations() {
    const { user, status } = useAuthContext();
    const [states, setStates] = useState<IntegrationMap>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (status === 'loading' || !user) {
            setLoading(false);
            return;
        }

        const identities = (user.identities ?? []) as UserIdentity[];
        const hasGoogleIdentity = identities.some(
            (identity) => identity.provider === 'google',
        );

        const [tokensResult, keysResult] = await Promise.all([
            supabase
                .from('user_tokens')
                .select('has_calendar, has_drive, has_microsoft')
                .eq('user_id', user.id)
                .maybeSingle(),
            supabase
                .from('user_integration_keys')
                .select('provider')
                .eq('user_id', user.id),
        ]);

        const tokens = tokensResult.data;
        const keyRows =
            (keysResult.data as unknown as IntegrationKeyRow[] | null) ?? [];
        const savedProviders = new Set(keyRows.map((row) => row.provider));

        const next: IntegrationMap = {};
        GOOGLE_OAUTH_IDS.forEach((id) => {
            const connected =
                id === 'google_calendar'
                    ? (tokens?.has_calendar ?? false)
                    : id === 'google_drive'
                      ? (tokens?.has_drive ?? false)
                      : hasGoogleIdentity;
            next[id] = { connected, hasKey: false };
        });
        MICROSOFT_OAUTH_IDS.forEach((id) => {
            next[id] = {
                connected: tokens?.has_microsoft ?? false,
                hasKey: false,
            };
        });

        const apiKeyIds = [
            'github',
            'linear',
            'notion',
            'readwise',
            'slack',
            'plaid',
            'finnhub',
            'alpha_vantage',
            'lichess',
            'anthropic',
            'openai',
            'gemini',
        ];
        apiKeyIds.forEach((id) => {
            const hasKey = savedProviders.has(id);
            next[id] = { connected: hasKey, hasKey };
        });

        setStates(next);
        setLoading(false);
    }, [user, status]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void load();
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [user, status, load]);

    const connectGoogle = useCallback(async (scopes: string[]) => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: scopes.join(' '),
                queryParams: { access_type: 'offline', prompt: 'consent' },
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    }, []);

    const connectMicrosoft = useCallback(() => {
        window.location.assign(
            `/api/auth/microsoft/start?redirect=${encodeURIComponent(window.location.pathname)}`,
        );
    }, []);

    const saveKey = useCallback(
        async (providerId: string, key: string) => {
            if (!user || !key.trim()) return;
            setSaving(providerId);
            await supabase.from('user_integration_keys').upsert(
                {
                    user_id: user.id,
                    provider: providerId,
                    api_key: key.trim(),
                },
                { onConflict: 'user_id,provider' },
            );
            setSaving(null);
            setStates((prev) => ({
                ...prev,
                [providerId]: { connected: true, hasKey: true },
            }));
        },
        [user],
    );

    const removeKey = useCallback(
        async (providerId: string) => {
            if (!user) return;
            setSaving(providerId);
            await supabase
                .from('user_integration_keys')
                .delete()
                .eq('user_id', user.id)
                .eq('provider', providerId);
            setSaving(null);
            setStates((prev) => ({
                ...prev,
                [providerId]: { connected: false, hasKey: false },
            }));
        },
        [user],
    );

    return {
        states,
        loading,
        saving,
        connectGoogle,
        connectMicrosoft,
        saveKey,
        removeKey,
    };
}
