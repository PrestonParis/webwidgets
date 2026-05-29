'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
    createConsentRecord,
    listConsentRecords,
} from '@/features/security/services/consentService';
import type { ConsentRecord } from '@/features/security/types/consent';

export function useConsentRecords() {
    const { userId } = useAuth();
    const [records, setRecords] = useState<ConsentRecord[]>([]);
    const [loading, setLoading] = useState(false);

    const reload = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            setRecords(await listConsentRecords(userId));
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        let active = true;
        void listConsentRecords(userId).then((next) => {
            if (active) setRecords(next);
        });
        return () => {
            active = false;
        };
    }, [userId]);

    const saveRecord = useCallback(
        async (input: Omit<ConsentRecord, 'id' | 'userId'>) => {
            if (!userId) return null;
            const record = await createConsentRecord({ ...input, userId });
            setRecords((current) => [
                record,
                ...current.filter((item) => item.id !== record.id),
            ]);
            return record;
        },
        [userId],
    );

    return { records, loading, reload, saveRecord };
}
