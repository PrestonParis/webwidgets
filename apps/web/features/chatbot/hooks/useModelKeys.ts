'use client';

import { useCallback, useEffect, useReducer, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
    saveModelKey,
    deleteModelKey,
    listModelProviderAvailability,
} from '@/features/chatbot/api/chatApi';
import type {
    ModelProvider,
    ModelProviderAvailability,
} from '@/features/chatbot/types/chat';

interface UseModelKeysReturn {
    savedProviders: ModelProvider[];
    availability: ModelProviderAvailability[];
    loading: boolean;
    saving: boolean;
    hasKey: (provider: ModelProvider) => boolean;
    isAvailable: (provider: ModelProvider) => boolean;
    save: (provider: ModelProvider, apiKey: string) => Promise<void>;
    remove: (provider: ModelProvider) => Promise<void>;
}

export function useModelKeys(): UseModelKeysReturn {
    const { userId, status } = useAuth();
    const [savedProviders, setSavedProviders] = useState<ModelProvider[]>([]);
    const [availability, setAvailability] = useState<
        ModelProviderAvailability[]
    >([]);
    const [loading, setLoading] = useReducer(
        (_: boolean, v: boolean) => v,
        true,
    );
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (status !== 'authenticated' || !userId) {
            setLoading(false);
            return;
        }
        void listModelProviderAvailability()
            .then((next) => {
                setSavedProviders(next.providers);
                setAvailability(next.availability);
            })
            .catch(() => undefined)
            .finally(() => setLoading(false));
    }, [userId, status]);

    const hasKey = useCallback(
        (provider: ModelProvider) => savedProviders.includes(provider),
        [savedProviders],
    );

    const isAvailable = useCallback(
        (provider: ModelProvider) =>
            availability.some(
                (item) => item.provider === provider && item.available,
            ),
        [availability],
    );

    const save = useCallback(
        async (provider: ModelProvider, apiKey: string) => {
            setSaving(true);
            try {
                await saveModelKey(provider, apiKey);
                setSavedProviders((prev) =>
                    prev.includes(provider) ? prev : [...prev, provider],
                );
                setAvailability((prev) =>
                    prev.map((item) =>
                        item.provider === provider
                            ? {
                                  ...item,
                                  hasUserKey: true,
                                  available: true,
                              }
                            : item,
                    ),
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
        setAvailability((prev) =>
            prev.map((item) =>
                item.provider === provider
                    ? {
                          ...item,
                          hasUserKey: false,
                          available: item.hasServerKey,
                      }
                    : item,
            ),
        );
    }, []);

    return {
        savedProviders,
        availability,
        loading,
        saving,
        hasKey,
        isAvailable,
        save,
        remove,
    };
}
