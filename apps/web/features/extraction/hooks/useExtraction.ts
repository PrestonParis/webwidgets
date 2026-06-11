'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { FileTextExtraction } from '@/features/extraction/types/extraction';

interface UseExtractionResult {
    extraction: FileTextExtraction | null;
    available: boolean;
    reason: string | undefined;
    isLoading: boolean;
    isError: boolean;
    refetch: () => Promise<void>;
}

// Polls /api/uploads/[fileId]/extract (GET) every 5s while status='processing'
export function useExtraction(fileId: string | null): UseExtractionResult {
    const [data, setData] = useState<FileTextExtraction | null>(null);
    const [available, setAvailable] = useState(false);
    const [reason, setReason] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const mountedRef = useRef(true);

    const fetchExtraction = useCallback(async () => {
        if (!fileId) return;
        try {
            const res = await apiRouteFetch(`/api/uploads/${fileId}/extract`);
            const json = (await res.json()) as {
                data?: FileTextExtraction;
                available?: boolean;
                reason?: string;
            };

            if (!mountedRef.current) return;

            if (json.data) {
                setData(json.data);
                setAvailable(json.data.extractionStatus === 'ready');
                setIsLoading(false);
                setIsError(false);

                // Stop polling if done
                if (json.data.extractionStatus !== 'processing') {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                }
            } else {
                setAvailable(false);
                setReason(json.reason);
                setIsLoading(false);
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            }
        } catch {
            if (mountedRef.current) {
                setIsError(true);
                setIsLoading(false);
            }
        }
    }, [fileId]);

    useEffect(() => {
        mountedRef.current = true;
        if (!fileId) {
            setData(null);
            setAvailable(false);
            return;
        }

        setIsLoading(true);
        void fetchExtraction();

        // Poll every 5s while still 'processing'
        intervalRef.current = setInterval(() => {
            if (data?.extractionStatus === 'processing') {
                void fetchExtraction();
            }
        }, 5_000);

        return () => {
            mountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fileId]);

    const refetch = useCallback(async () => {
        if (!fileId) return;
        setIsLoading(true);
        await fetchExtraction();
    }, [fileId, fetchExtraction]);

    return { extraction: data, available, reason, isLoading, isError, refetch };
}
