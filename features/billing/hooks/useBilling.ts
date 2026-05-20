'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type {
    BillingSubscription,
    BillingSubscriptionRow,
} from '@/features/billing/types/billing';
import { rowToSubscription } from '@/features/billing/types/billing';
import { getPlan } from '@/features/billing/constants/plans';
import type { BillingPlan } from '@/features/billing/types/billing';

interface UseBillingReturn {
    subscription: BillingSubscription | null;
    currentPlan: BillingPlan;
    loading: boolean;
}

export function useBilling(): UseBillingReturn {
    const { userId } = useAuth();
    const [subscription, setSubscription] =
        useState<BillingSubscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        let active = true;

        void db
            .from('billing_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['active', 'trialing', 'past_due'])
            .order('created_at', { ascending: false })
            .maybeSingle()
            .then(({ data }) => {
                if (!active) return;
                setSubscription(
                    data
                        ? rowToSubscription(
                              data as unknown as BillingSubscriptionRow,
                          )
                        : null,
                );
                setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [userId]);

    const currentPlan = getPlan(subscription?.planId ?? 'free');
    return { subscription, currentPlan, loading };
}
