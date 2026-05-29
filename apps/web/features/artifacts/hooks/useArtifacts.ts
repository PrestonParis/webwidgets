'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
    Artifact,
    ArtifactType,
} from '@/features/artifacts/types/artifact';

interface UseArtifactsResult {
    data: Artifact[];
    isLoading: boolean;
    isError: boolean;
    refresh: () => void;
}

interface UseArtifactsFilter {
    type?: ArtifactType;
}

export function useArtifacts(filter?: UseArtifactsFilter): UseArtifactsResult {
    const [data, setData] = useState<Artifact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const typeParam = filter?.type;

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        setIsError(false);

        const url = typeParam
            ? `/api/artifacts?type=${encodeURIComponent(typeParam)}`
            : '/api/artifacts';

        fetch(url)
            .then((r) => r.json())
            .then((json: { data?: Artifact[] }) => {
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
    }, [typeParam, refreshKey]);

    const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

    return { data, isLoading, isError, refresh };
}

interface UseArtifactResult {
    data: Artifact | null;
    isLoading: boolean;
    isError: boolean;
}

export function useArtifact(id: string | null): UseArtifactResult {
    const [data, setData] = useState<Artifact | null>(null);
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

        fetch(`/api/artifacts/${id}`)
            .then((r) => r.json())
            .then((json: { data?: Artifact }) => {
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
