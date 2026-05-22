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

    const load = useCallback(async () => {
        setLoading(true);
        const data = await fetchSupplements();
        setSupplements(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        void load();
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
