'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
    createFinanceAccount,
    listFinanceAccounts,
} from '@/features/finance/services/financeService';
import {
    deleteFinanceAccountForUser,
    updateFinanceAccountForUser,
} from '@/features/finance/services/financeAccountService';
import { db } from '@/lib/db/supabase';
import type { FinanceAccount } from '@/features/finance/types/finance';
import type { SupabaseClient } from '@supabase/supabase-js';

export function useFinanceAccounts() {
    const { userId } = useAuth();
    const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
    const [loading, setLoading] = useState(false);

    const reload = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            setAccounts(await listFinanceAccounts(userId));
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        let active = true;
        void listFinanceAccounts(userId).then((next) => {
            if (active) setAccounts(next);
        });
        return () => {
            active = false;
        };
    }, [userId]);

    const createAccount = useCallback(
        async (
            input: Omit<
                FinanceAccount,
                'id' | 'userId' | 'createdAt' | 'updatedAt'
            >,
        ) => {
            if (!userId) return null;
            const account = await createFinanceAccount({ ...input, userId });
            setAccounts((current) => [account, ...current]);
            return account;
        },
        [userId],
    );

    const updateAccount = useCallback(
        async (
            id: string,
            input: Partial<
                Omit<
                    FinanceAccount,
                    'id' | 'userId' | 'createdAt' | 'updatedAt'
                >
            >,
        ) => {
            if (!userId) return null;
            const account = await updateFinanceAccountForUser(
                db as unknown as SupabaseClient,
                userId,
                id,
                input,
            );
            setAccounts((current) =>
                current.map((item) => (item.id === id ? account : item)),
            );
            return account;
        },
        [userId],
    );

    const deleteAccount = useCallback(
        async (id: string) => {
            if (!userId) return;
            await deleteFinanceAccountForUser(
                db as unknown as SupabaseClient,
                userId,
                id,
            );
            setAccounts((current) => current.filter((item) => item.id !== id));
        },
        [userId],
    );

    return {
        accounts,
        loading,
        reload,
        createAccount,
        updateAccount,
        deleteAccount,
    };
}
