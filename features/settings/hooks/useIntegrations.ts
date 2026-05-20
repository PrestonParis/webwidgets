'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';

export interface IntegrationState {
    connected: boolean;
    hasKey: boolean;
}

type IntegrationMap = Record<string, IntegrationState>;

const GOOGLE_OAUTH_IDS = ['gmail', 'google_calendar', 'google_drive'];
const MICROSOFT_OAUTH_IDS = ['outlook', 'outlook_calendar'];

export function useIntegrations() {
    const [states, setStates] = useState<IntegrationMap>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const load = useCallback(async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const hasGoogleIdentity = !!user.identities?.find(
            (i) => i.provider === 'google',
        );

        const [tokensResult, keysResult] = await Promise.all([
            supabase
                .from('user_tokens')
                .select('has_calendar, has_microsoft')
                .eq('user_id', user.id)
                .maybeSingle(),
            supabase
                .from('user_integration_keys')
                .select('provider')
                .eq('user_id', user.id),
        ]);

        const tokens = tokensResult.data;
        const savedProviders = new Set(
            (keysResult.data ?? []).map((r) => r.provider),
        );

        const next: IntegrationMap = {};
        GOOGLE_OAUTH_IDS.forEach((id) => {
            const connected =
                id === 'google_calendar'
                    ? (tokens?.has_calendar ?? false)
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
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

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

    const saveKey = useCallback(async (providerId: string, key: string) => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
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
    }, []);

    const removeKey = useCallback(async (providerId: string) => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
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
    }, []);

    return { states, loading, saving, connectGoogle, saveKey, removeKey };
}
