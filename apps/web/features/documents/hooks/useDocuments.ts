'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Document } from '@/features/documents/types/document';

interface UseDocumentsResult {
    data: Document[];
    isLoading: boolean;
    isError: boolean;
    refresh: () => void;
}

export function useDocuments(): UseDocumentsResult {
    const [data, setData] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        setIsError(false);

        fetch('/api/documents')
            .then((r) => r.json())
            .then((json: { data?: Document[] }) => {
                if (mounted) {
                    setData(json.data ?? []);
                    setIsLoading(false);
                }
            })
            .catch(() => {
                if (mounted) {
                    setIsError(true);
                    setIsLoading(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, [refreshKey]);

    const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

    return { data, isLoading, isError, refresh };
}

interface UseDocumentResult {
    data: Document | null;
    isLoading: boolean;
    isError: boolean;
}

export function useDocument(id: string | null): UseDocumentResult {
    const [data, setData] = useState<Document | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (!id) {
            setData(null);
            return;
        }

        let mounted = true;
        setIsLoading(true);
        setIsError(false);

        fetch(`/api/documents/${id}`)
            .then((r) => r.json())
            .then((json: { data?: Document }) => {
                if (mounted) {
                    setData(json.data ?? null);
                    setIsLoading(false);
                }
            })
            .catch(() => {
                if (mounted) {
                    setIsError(true);
                    setIsLoading(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, [id]);

    return { data, isLoading, isError };
}
