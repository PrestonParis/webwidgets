'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/lib/db/supabase';
import {
    INTEGRATION_PROVIDERS,
    connectAvailableProvider,
} from '@/features/onboarding/lib/integrationRegistry';
import type { IntegrationRuntimeState } from '@/features/onboarding/lib/integrationRegistry';

export function useIntegrationRuntime() {
    const { user, userId } = useAuth();
    const [connectedIds, setConnectedIds] = useState<string[]>([]);

    useEffect(() => {
        const googleConnected =
            user?.identities?.some(
                (identity) => identity.provider === 'google',
            ) ?? false;
        let active = true;

        async function loadCalendarState() {
            if (!userId) {
                setConnectedIds([]);
                return;
            }

            const { data } = await supabase
                .from('user_tokens')
                .select('has_calendar')
                .eq('user_id', userId)
                .maybeSingle();
            if (!active) return;

            const ids = new Set<string>();
            if (googleConnected) ids.add('gmail');
            if (data?.has_calendar) ids.add('google-calendar');
            setConnectedIds([...ids]);
        }

        void loadCalendarState();
        return () => {
            active = false;
        };
    }, [user?.identities, userId]);

    const providers = useMemo<IntegrationRuntimeState[]>(
        () =>
            INTEGRATION_PROVIDERS.map((provider) => ({
                provider,
                state: connectedIds.includes(provider.id)
                    ? 'connected'
                    : provider.state,
            })),
        [connectedIds],
    );

    return {
        providers,
        connectedIds,
        connectProvider: connectAvailableProvider,
    };
}
