import { useState, useEffect, useCallback } from 'react';
import { getAllProviders } from '@/features/reading/lib/providerRegistry';
import { bootstrapProviders } from '@/features/reading/providers/index';
import type { ReadingDocument } from '@/features/reading/types/document';

interface UseReadingLibraryState {
    documents: ReadingDocument[];
    loading: boolean;
    error: string | null;
    search: string;
    setSearch: (q: string) => void;
    reload: () => void;
}

export function useReadingLibrary(): UseReadingLibraryState {
    const [documents, setDocuments] = useState<ReadingDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            bootstrapProviders();
            const providers = getAllProviders();
            const results = await Promise.allSettled(
                providers.map((p) =>
                    p.listDocuments(search ? { search } : undefined),
                ),
            );
            const docs: ReadingDocument[] = [];
            results.forEach((r) => {
                if (r.status === 'fulfilled') docs.push(...r.value);
            });
            setDocuments(docs);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to load library',
            );
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(
            () => {
                void load();
            },
            search ? 300 : 0,
        );
        return () => clearTimeout(timer);
    }, [load, search]);

    return {
        documents,
        loading,
        error,
        search,
        setSearch,
        reload: () => {
            void load();
        },
    };
}
