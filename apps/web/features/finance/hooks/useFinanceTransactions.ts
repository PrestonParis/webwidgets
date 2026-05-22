'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
    listFinanceTransactions,
    createFinanceTransactionForUser,
    deleteFinanceTransactionForUser,
    updateFinanceTransactionForUser,
} from '@/features/finance/services/financeService';
import { db } from '@/lib/db/supabase';
import type { FinanceTransaction } from '@/features/finance/types/finance';
import type { SupabaseClient } from '@supabase/supabase-js';

export function useFinanceTransactions() {
    const { userId } = useAuth();
    const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
    const [loading, setLoading] = useState(false);

    const reload = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            setTransactions(await listFinanceTransactions(userId));
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        let active = true;
        void listFinanceTransactions(userId).then((next) => {
            if (active) setTransactions(next);
        });
        return () => {
            active = false;
        };
    }, [userId]);

    const createTransaction = useCallback(
        async (
            input: Omit<
                FinanceTransaction,
                'id' | 'userId' | 'createdAt' | 'occurredOn'
            >,
        ) => {
            if (!userId) return null;
            const tx = await createFinanceTransactionForUser(
                db as unknown as SupabaseClient,
                { ...input, userId },
            );
            setTransactions((cur) => [tx, ...cur]);
            return tx;
        },
        [userId],
    );

    const updateTransaction = useCallback(
        async (
            id: string,
            input: Partial<
                Omit<
                    FinanceTransaction,
                    'id' | 'userId' | 'createdAt' | 'occurredOn'
                >
            >,
        ) => {
            if (!userId) return null;
            const tx = await updateFinanceTransactionForUser(
                db as unknown as SupabaseClient,
                userId,
                id,
                input,
            );
            setTransactions((cur) =>
                cur.map((item) => (item.id === id ? tx : item)),
            );
            return tx;
        },
        [userId],
    );

    const deleteTransaction = useCallback(
        async (id: string) => {
            if (!userId) return;
            await deleteFinanceTransactionForUser(
                db as unknown as SupabaseClient,
                userId,
                id,
            );
            setTransactions((cur) => cur.filter((item) => item.id !== id));
        },
        [userId],
    );

    return {
        transactions,
        loading,
        reload,
        createTransaction,
        updateTransaction,
        deleteTransaction,
    };
}
