'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
    listFinanceSubscriptions,
    createFinanceSubscriptionForUser,
    updateFinanceSubscriptionForUser,
    deleteFinanceSubscriptionForUser,
} from '@/features/finance/services/financeService';
import { db } from '@/lib/db/supabase';
import type { FinanceSubscription } from '@/features/finance/types/finance';
import type { SupabaseClient } from '@supabase/supabase-js';

export function useFinanceSubscriptions() {
    const { userId } = useAuth();
    const [subscriptions, setSubscriptions] = useState<FinanceSubscription[]>(
        [],
    );
    const [loading, setLoading] = useState(false);

    const reload = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            setSubscriptions(await listFinanceSubscriptions(userId));
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        let active = true;
        void listFinanceSubscriptions(userId).then((next) => {
            if (active) setSubscriptions(next);
        });
        return () => {
            active = false;
        };
    }, [userId]);

    const createSubscription = useCallback(
        async (
            input: Omit<
                FinanceSubscription,
                'id' | 'userId' | 'createdAt' | 'cadence' | 'nextChargeOn'
            >,
        ) => {
            if (!userId) return null;
            const sub = await createFinanceSubscriptionForUser(
                db as unknown as SupabaseClient,
                { ...input, userId },
            );
            setSubscriptions((cur) => [sub, ...cur]);
            return sub;
        },
        [userId],
    );

    const updateSubscription = useCallback(
        async (
            id: string,
            input: Partial<
                Omit<
                    FinanceSubscription,
                    'id' | 'userId' | 'createdAt' | 'cadence' | 'nextChargeOn'
                >
            >,
        ) => {
            if (!userId) return null;
            const sub = await updateFinanceSubscriptionForUser(
                db as unknown as SupabaseClient,
                userId,
                id,
                input,
            );
            setSubscriptions((cur) =>
                cur.map((item) => (item.id === id ? sub : item)),
            );
            return sub;
        },
        [userId],
    );

    const deleteSubscription = useCallback(
        async (id: string) => {
            if (!userId) return;
            await deleteFinanceSubscriptionForUser(
                db as unknown as SupabaseClient,
                userId,
                id,
            );
            setSubscriptions((cur) => cur.filter((s) => s.id !== id));
        },
        [userId],
    );

    const monthlyTotal = subscriptions.reduce((sum, s) => {
        const cycle = s.cadence || s.billingCycle;
        if (cycle === 'monthly') return sum + s.amount;
        if (cycle === 'annual' || cycle === 'yearly') return sum + s.amount / 12;
        if (cycle === 'weekly') return sum + s.amount * 52 / 12;
        return sum;
    }, 0);

    return {
        subscriptions,
        loading,
        reload,
        createSubscription,
        updateSubscription,
        deleteSubscription,
        monthlyTotal,
    };
}
