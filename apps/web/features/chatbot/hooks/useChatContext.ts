'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useCallback, useEffect, useState } from 'react';
import type {
    ContextPayload,
    ContextCollectionResult,
    ContextCollectionError,
} from '../types/contextPayload';

interface UseChatContextReturn {
    context: ContextPayload | null;
    loading: boolean;
    error: ContextCollectionError | null;
    errorMessage: string | null;
    // Whether there is enough context to allow sending a message.
    // True if context graph has available entries OR if user acknowledged partial context.
    canSend: boolean;
    refresh: () => void;
}

export function useChatContext(): UseChatContextReturn {
    const [context, setContext] = useState<ContextPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ContextCollectionError | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchContext = useCallback(async () => {
        setLoading(true);
        setError(null);
        setErrorMessage(null);
        try {
            const res = await apiRouteFetch('/api/chat/context', {
                credentials: 'include',
                cache: 'no-store',
            });
            const data = (await res.json()) as ContextCollectionResult;

            if (!data.ok) {
                setError(data.error);
                setErrorMessage(data.message);
                setContext(null);
            } else {
                setContext(data.payload);
                setError(null);
            }
        } catch {
            setError('CONTEXT_FETCH_FAILED');
            setErrorMessage(
                'Failed to reach the context service. Check your connection.',
            );
            setContext(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchContext();
    }, [fetchContext]);

    // Allow sending if: context graph is available (even if other sources are not),
    // or if context is fully empty (we degrade gracefully to a plain assistant).
    // Block on hard errors that indicate the user cannot proceed.
    const BLOCKING_ERRORS: ContextCollectionError[] = [
        'CONTEXT_AUTH_REQUIRED',
        'CONTEXT_PERMISSION_DENIED',
        'CONTEXT_FETCH_FAILED',
    ];
    const canSend =
        !loading && (error === null || !BLOCKING_ERRORS.includes(error));

    return {
        context,
        loading,
        error,
        errorMessage,
        canSend,
        refresh: fetchContext,
    };
}
