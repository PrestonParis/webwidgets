import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { stripe, hasStripeConfig } from '@/lib/stripe/stripeClient';
import { createClients } from '@/lib/supabase/serverClient';
import {
    upsertSubscription,
    cancelSubscriptionRecord,
    upsertCustomer,
} from '@/features/billing/lib/billingService';
import { STRIPE_PRICE_IDS } from '@/lib/stripe/stripeClient';
import { getStripeWebhookSecret } from '@/lib/stripe/stripeClient';

// Stripe moved period fields to items in newer API versions; access via cast.
type SubPeriods = {
    current_period_start?: number;
    current_period_end?: number;
};

function planIdFromPriceId(priceId: string): string {
    for (const [plan, id] of Object.entries(STRIPE_PRICE_IDS)) {
        if (id === priceId) return plan;
    }
    return 'free';
}

async function handleSubscription(
    sub: Stripe.Subscription,
    adminDb: SupabaseClient,
) {
    const userId = sub.metadata['supabase_user_id'] ?? '';
    if (!userId) return;

    const item = sub.items.data[0];
    const priceId = item?.price.id ?? '';
    const planId = planIdFromPriceId(priceId);

    const periods = sub as unknown as SubPeriods;
    const periodStart =
        periods.current_period_start !== undefined
            ? new Date(periods.current_period_start * 1000).toISOString()
            : undefined;
    const periodEnd =
        periods.current_period_end !== undefined
            ? new Date(periods.current_period_end * 1000).toISOString()
            : undefined;

    await upsertCustomer(adminDb, userId, sub.customer as string);
    await upsertSubscription(adminDb, {
        userId,
        stripeSubscriptionId: sub.id,
        stripeCustomerId: sub.customer as string,
        planId,
        status: sub.status,
        ...(periodStart !== undefined && { currentPeriodStart: periodStart }),
        ...(periodEnd !== undefined && { currentPeriodEnd: periodEnd }),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
    });
}

export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature') ?? '';
    const webhookSecret = getStripeWebhookSecret();
    if (!hasStripeConfig() || !webhookSecret) {
        return NextResponse.json(
            { error: 'Stripe webhook is not configured' },
            { status: 503 },
        );
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch {
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 },
        );
    }

    const { supabaseAdmin } = await createClients();
    const adminDb = supabaseAdmin;

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                if (session.mode !== 'subscription' || !session.subscription)
                    break;
                const sub = await stripe.subscriptions.retrieve(
                    session.subscription as string,
                );
                if (
                    !sub.metadata['supabase_user_id'] &&
                    session.metadata?.['supabase_user_id']
                ) {
                    await stripe.subscriptions.update(sub.id, {
                        metadata: {
                            supabase_user_id:
                                session.metadata['supabase_user_id'],
                        },
                    });
                    sub.metadata['supabase_user_id'] =
                        session.metadata['supabase_user_id'];
                }
                await handleSubscription(sub, adminDb);
                break;
            }
            case 'customer.subscription.updated':
            case 'customer.subscription.created': {
                await handleSubscription(event.data.object, adminDb);
                break;
            }
            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                await cancelSubscriptionRecord(adminDb, sub.id);
                break;
            }
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
