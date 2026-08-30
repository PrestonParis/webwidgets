'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import { startGoogleConnection } from '@/lib/auth/googleConnection';
import { useAuthContext } from '@/features/auth/components/AuthContext';
import {
    deleteIntegrationKey,
    listIntegrationKeyProviders,
    saveIntegrationKey,
} from '../api/integrationKeysClient';

export interface IntegrationState {
    connected: boolean;
    hasKey: boolean;
}

type IntegrationMap = Record<string, IntegrationState>;
type UserIdentity = { provider?: string };

const GOOGLE_OAUTH_IDS = ['gmail', 'google_calendar', 'google_drive'];
const MICROSOFT_OAUTH_IDS = ['outlook', 'outlook_calendar'];

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

        const [tokensResult, savedProviderList] = await Promise.all([
            supabase
                .from('user_tokens')
                .select('has_calendar, has_microsoft')
                .eq('user_id', user.id)
                .maybeSingle(),
            listIntegrationKeyProviders(),
        ]);

        const tokens = tokensResult.data;
        const savedProviders = new Set(savedProviderList);

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
    }, [user, status]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void load();
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [user, status, load]);

    const connectGoogle = useCallback((scopes: string[]) => {
        startGoogleConnection(
            scopes.includes('https://www.googleapis.com/auth/calendar.events')
                ? 'calendar'
                : 'gmail',
        );
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
            await saveIntegrationKey(providerId, key.trim());
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
            await deleteIntegrationKey(providerId);
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
