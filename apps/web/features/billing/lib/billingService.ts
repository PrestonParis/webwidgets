import type { SupabaseClient } from '@supabase/supabase-js';
import type {
    BillingSubscription,
    BillingSubscriptionRow,
} from '@/features/billing/types/billing';
import { rowToSubscription } from '@/features/billing/types/billing';

const SUBS_TABLE = 'billing_subscriptions';
const CUSTOMERS_TABLE = 'billing_customers';

export async function fetchSubscription(
    supabase: SupabaseClient,
    userId: string,
): Promise<BillingSubscription | null> {
    const result = await supabase
        .from(SUBS_TABLE)
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .maybeSingle();

    if (result.error) throw result.error;
    const data = result.data as BillingSubscriptionRow | null;
    return data ? rowToSubscription(data) : null;
}

export async function fetchCustomerId(
    supabase: SupabaseClient,
    userId: string,
): Promise<string | null> {
    const { data } = await supabase
        .from(CUSTOMERS_TABLE)
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .maybeSingle();

    return (
        (data as { stripe_customer_id: string } | null)?.stripe_customer_id ??
        null
    );
}

export async function upsertCustomer(
    supabase: SupabaseClient,
    userId: string,
    stripeCustomerId: string,
): Promise<void> {
    const { error } = await supabase
        .from(CUSTOMERS_TABLE)
        .upsert(
            { user_id: userId, stripe_customer_id: stripeCustomerId },
            { onConflict: 'user_id' },
        );

    if (error) throw error;
}

export async function upsertSubscription(
    supabase: SupabaseClient,
    data: {
        userId: string;
        stripeSubscriptionId: string;
        stripeCustomerId: string;
        planId: string;
        status: string;
        currentPeriodStart?: string;
        currentPeriodEnd?: string;
        cancelAtPeriodEnd?: boolean;
    },
): Promise<void> {
    const { error } = await supabase.from(SUBS_TABLE).upsert(
        {
            user_id: data.userId,
            stripe_subscription_id: data.stripeSubscriptionId,
            stripe_customer_id: data.stripeCustomerId,
            plan_id: data.planId,
            status: data.status,
            current_period_start: data.currentPeriodStart ?? null,
            current_period_end: data.currentPeriodEnd ?? null,
            cancel_at_period_end: data.cancelAtPeriodEnd ?? false,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'stripe_subscription_id' },
    );

    if (error) throw error;
}

export async function cancelSubscriptionRecord(
    supabase: SupabaseClient,
    stripeSubscriptionId: string,
): Promise<void> {
    const { error } = await supabase
        .from(SUBS_TABLE)
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', stripeSubscriptionId);

    if (error) throw error;
}
