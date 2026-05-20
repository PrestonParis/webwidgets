import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';
import {
    fetchCustomerId,
    upsertCustomer,
} from '@/features/billing/services/billingService';
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe/stripeClient';

const bodySchema = z.object({
    planId: z.enum(['pro', 'business']),
});

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        const parsed = bodySchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid plan' },
                { status: 400 },
            );
        }

        const priceId = STRIPE_PRICE_IDS[parsed.data.planId] ?? '';
        if (!priceId) {
            return NextResponse.json(
                { error: 'Price not configured' },
                { status: 500 },
            );
        }

        let customerId = await fetchCustomerId(supabase, userId);
        if (!customerId) {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            const customerParams: Parameters<
                typeof stripe.customers.create
            >[0] = {
                metadata: { supabase_user_id: userId },
            };
            if (user?.email !== undefined) customerParams.email = user.email;
            const customer = await stripe.customers.create(customerParams);
            customerId = customer.id;
            await upsertCustomer(supabase, userId, customerId);
        }

        const origin = req.headers.get('origin') ?? 'http://localhost:3000';
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${origin}/settings?billing=success`,
            cancel_url: `${origin}/settings?billing=canceled`,
            metadata: { supabase_user_id: userId },
        });

        return NextResponse.json({ url: session.url });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
