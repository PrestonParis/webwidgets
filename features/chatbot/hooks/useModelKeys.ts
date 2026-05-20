'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
    saveModelKey,
    deleteModelKey,
    listSavedProviders,
} from '@/features/chatbot/api/chatApi';
import type { ModelProvider } from '@/features/chatbot/types/chat';

interface UseModelKeysReturn {
    savedProviders: ModelProvider[];
    loading: boolean;
    saving: boolean;
    hasKey: (provider: ModelProvider) => boolean;
    save: (provider: ModelProvider, apiKey: string) => Promise<void>;
    remove: (provider: ModelProvider) => Promise<void>;
}

export function useModelKeys(): UseModelKeysReturn {
    const { userId, status } = useAuth();
    const [savedProviders, setSavedProviders] = useState<ModelProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (status !== 'authenticated' || !userId) {
            setLoading(false);
            return;
        }
        void listSavedProviders()
            .then(setSavedProviders)
            .catch(() => undefined)
            .finally(() => setLoading(false));
    }, [userId, status]);

    const hasKey = useCallback(
        (provider: ModelProvider) => savedProviders.includes(provider),
        [savedProviders],
    );

    const save = useCallback(
        async (provider: ModelProvider, apiKey: string) => {
            setSaving(true);
            try {
                await saveModelKey(provider, apiKey);
                setSavedProviders((prev) =>
                    prev.includes(provider) ? prev : [...prev, provider],
                );
            } finally {
                setSaving(false);
            }
        },
        [],
    );

    const remove = useCallback(async (provider: ModelProvider) => {
        await deleteModelKey(provider);
        setSavedProviders((prev) => prev.filter((p) => p !== provider));
    }, []);

    return { savedProviders, loading, saving, hasKey, save, remove };
}
