export type PlanId = 'free' | 'pro' | 'business';
export type SubscriptionStatus =
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'trialing'
    | 'incomplete';

export interface BillingPlan {
    id: PlanId;
    name: string;
    priceMonthly: number;
    description: string;
    cta?: string;
    badge?: string;
    features: string[];
    highlighted?: boolean;
    stripePriceEnvKey?: string;
}

export interface BillingSubscription {
    id: string;
    userId: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    planId: PlanId;
    status: SubscriptionStatus;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
}

export type BillingSubscriptionRow = {
    id: string;
    user_id: string;
    stripe_subscription_id: string;
    stripe_customer_id: string;
    plan_id: string;
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
};

export function rowToSubscription(
    row: BillingSubscriptionRow,
): BillingSubscription {
    return {
        id: row.id,
        userId: row.user_id,
        stripeSubscriptionId: row.stripe_subscription_id,
        stripeCustomerId: row.stripe_customer_id,
        planId: row.plan_id as PlanId,
        status: row.status as SubscriptionStatus,
        currentPeriodEnd: row.current_period_end,
        cancelAtPeriodEnd: row.cancel_at_period_end,
    };
}
