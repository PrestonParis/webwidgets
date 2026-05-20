import { useState, useCallback, useRef } from 'react';
import { getProviderOrThrow } from '@/features/reading/lib/providerRegistry';
import type { ReadingSearchHit } from '@/features/reading/types/providers';

interface UseReadingSearchState {
    query: string;
    results: ReadingSearchHit[];
    loading: boolean;
    error: string | null;
    setQuery: (q: string) => void;
    search: () => void;
    clear: () => void;
}

export function useReadingSearch(
    providerId: string | null,
    documentId: string | null,
    versionId?: string,
): UseReadingSearchState {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ReadingSearchHit[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const search = useCallback(() => {
        if (!providerId || !documentId || !query.trim()) return;
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setLoading(true);
        setError(null);

        void (async () => {
            try {
                const provider = getProviderOrThrow(providerId);
                if (!provider.search) {
                    setResults([]);
                    setLoading(false);
                    return;
                }
                const result = await provider.search({
                    documentId,
                    query: query.trim(),
                    type: 'phrase',
                    limit: 50,
                    ...(versionId && { versionId }),
                });
                if (controller.signal.aborted) return;
                setResults(result.results);
            } catch (err) {
                if (controller.signal.aborted) return;
                setError(err instanceof Error ? err.message : 'Search failed');
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        })();
    }, [providerId, documentId, query, versionId]);

    const clear = useCallback(() => {
        abortRef.current?.abort();
        setQuery('');
        setResults([]);
        setError(null);
    }, []);

    return { query, results, loading, error, setQuery, search, clear };
}
