'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
    createAutomationConfig,
    listAutomationConfigs,
} from '@/features/automation/services/automationService';
import type { AutomationConfig } from '@/features/automation/types/automation';

export function useAutomationConfigs() {
    const { userId } = useAuth();
    const [configs, setConfigs] = useState<AutomationConfig[]>([]);
    const [loading, setLoading] = useState(false);

    const reload = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            setConfigs(await listAutomationConfigs(userId));
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        let active = true;
        void listAutomationConfigs(userId).then((next) => {
            if (active) setConfigs(next);
        });
        return () => {
            active = false;
        };
    }, [userId]);

    const createConfig = useCallback(
        async (input: Omit<AutomationConfig, 'id' | 'userId'>) => {
            if (!userId) return null;
            const config = await createAutomationConfig({ ...input, userId });
            setConfigs((current) => [config, ...current]);
            return config;
        },
        [userId],
    );

    return { configs, loading, reload, createConfig };
}
