'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    fetchSupplements,
    createSupplement,
    removeSupplement,
} from '@/features/tracking/api/supplementsApi';
import type {
    Supplement,
    CreateSupplementPayload,
} from '@/features/tracking/types/supplement';

export function useSupplements() {
    const [supplements, setSupplements] = useState<Supplement[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        try {
            const data = await fetchSupplements(signal);
            if (signal?.aborted) return;
            setSupplements(data);
            setLoading(false);
        } catch (e) {
            if (e instanceof Error && e.name === 'AbortError') return;
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void load(controller.signal);
        return () => controller.abort();
    }, [load]);

    const add = useCallback(
        async (
            payload: CreateSupplementPayload,
        ): Promise<Supplement | null> => {
            const result = await createSupplement(payload);
            if (result) setSupplements((prev) => [...prev, result]);
            return result;
        },
        [],
    );

    const remove = useCallback(async (id: string) => {
        const ok = await removeSupplement(id);
        if (ok) setSupplements((prev) => prev.filter((s) => s.id !== id));
    }, []);

    return { supplements, loading, add, remove, refetch: load };
}
