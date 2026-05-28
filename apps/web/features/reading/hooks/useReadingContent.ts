import { useState, useEffect, useRef } from 'react';
import { getProviderOrThrow } from '@/features/reading/lib/providerRegistry';
import type { ReadingContentResult } from '@/features/reading/types/providers';
import type { ReadingPosition } from '@/features/reading/types/positions';

interface UseReadingContentState {
    result: ReadingContentResult | null;
    loading: boolean;
    error: string | null;
}

export function useReadingContent(
    providerId: string | null,
    documentId: string | null,
    position: ReadingPosition | null,
    versionId?: string,
): UseReadingContentState {
    const [result, setResult] = useState<ReadingContentResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!providerId || !documentId || !position) {
            const timeoutId = window.setTimeout(() => {
                setResult(null);
            }, 0);
            return () => window.clearTimeout(timeoutId);
        }

        const timeoutId = window.setTimeout(() => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setLoading(true);
            setError(null);

            void (async () => {
                try {
                    const provider = getProviderOrThrow(providerId);
                    const data = await provider.getContent({
                        documentId,
                        position,
                        ...(versionId && { versionId }),
                        context: {
                            includeFootnotes: true,
                            includeCrossRefs: true,
                        },
                    });
                    if (controller.signal.aborted) return;
                    setResult(data);
                } catch (err) {
                    if (controller.signal.aborted) return;
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Failed to load content',
                    );
                } finally {
                    if (!controller.signal.aborted) setLoading(false);
                }
            })();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
            abortRef.current?.abort();
        };
    }, [providerId, documentId, position, versionId]);

    return { result, loading, error };
}
