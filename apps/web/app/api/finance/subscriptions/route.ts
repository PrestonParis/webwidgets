import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    listFinanceSubscriptionsForUser,
    createFinanceSubscriptionForUser,
} from '@/features/finance/services/financeSubscriptionService';
import type { SupabaseClient } from '@supabase/supabase-js';

const createSchema = z.object({
    name: z.string().min(1),
    amount: z.number().nonnegative(),
    billingCycle: z.enum(['monthly', 'yearly', 'weekly', 'custom']),
    nextBillingDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    category: z.string().min(1),
    active: z.boolean().default(true),
    source: z.enum(['manual', 'detected', 'email', 'bank']).default('manual'),
});

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const subscriptions = await listFinanceSubscriptionsForUser(
            supabase as unknown as SupabaseClient,
            userId,
        );
        return NextResponse.json({ subscriptions });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const body = createSchema.safeParse(await req.json());
        if (!body.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );
        const sub = await createFinanceSubscriptionForUser(
            supabase as unknown as SupabaseClient,
            { ...body.data, userId } as unknown as Omit<
                import('@/features/finance/types/finance').FinanceSubscription,
                'id'
            >,
        );
        return NextResponse.json({ subscription: sub });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
