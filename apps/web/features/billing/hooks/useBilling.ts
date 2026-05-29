'use client';

import { useEffect, useReducer } from 'react';
import { db } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type {
    BillingSubscription,
    BillingSubscriptionRow,
} from '@/features/billing/types/billing';
import { rowToSubscription } from '@/features/billing/types/billing';
import { getPlan } from '@/features/billing/constants';
import type { BillingPlan } from '@/features/billing/types/billing';

interface UseBillingReturn {
    subscription: BillingSubscription | null;
    currentPlan: BillingPlan;
    loading: boolean;
}

type BillingState = {
    subscription: BillingSubscription | null;
    loading: boolean;
};
type BillingAction =
    | { type: 'loaded'; subscription: BillingSubscription | null }
    | { type: 'no-user' };

function billingReducer(
    state: BillingState,
    action: BillingAction,
): BillingState {
    switch (action.type) {
        case 'loaded':
            return { subscription: action.subscription, loading: false };
        case 'no-user':
            return { subscription: null, loading: false };
    }
}

export function useBilling(): UseBillingReturn {
    const { userId } = useAuth();
    const [state, dispatch] = useReducer(billingReducer, {
        subscription: null,
        loading: true,
    });

    useEffect(() => {
        if (!userId) {
            dispatch({ type: 'no-user' });
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
                dispatch({
                    type: 'loaded',
                    subscription: data
                        ? rowToSubscription(
                              data as unknown as BillingSubscriptionRow,
                          )
                        : null,
                });
            });

        return () => {
            active = false;
        };
    }, [userId]);

    const currentPlan = getPlan(state.subscription?.planId ?? 'free');
    return {
        subscription: state.subscription,
        currentPlan,
        loading: state.loading,
    };
}
