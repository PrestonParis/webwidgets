import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';
import { fetchCustomerId } from '@/features/billing/services/billingService';
import { stripe, hasStripeConfig } from '@/lib/stripe/stripeClient';

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        if (!hasStripeConfig()) {
            return NextResponse.json(
                { error: 'Stripe is not configured' },
                { status: 503 },
            );
        }

        const customerId = await fetchCustomerId(supabase, userId);
        if (!customerId) {
            return NextResponse.json(
                { error: 'No billing account found' },
                { status: 404 },
            );
        }

        const origin = req.headers.get('origin') ?? 'http://localhost:3000';
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${origin}/settings`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
