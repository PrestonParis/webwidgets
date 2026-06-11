import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    deleteFinanceSubscriptionForUser,
    updateFinanceSubscriptionForUser,
} from '@/features/finance/services/financeSubscriptionService';
import type { SupabaseClient } from '@supabase/supabase-js';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';

const patchSchema = z.object({
    name: z.string().min(1).optional(),
    amount: z.number().nonnegative().optional(),
    billingCycle: z.enum(['monthly', 'yearly', 'weekly', 'custom']).optional(),
    nextBillingDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    category: z.string().min(1).optional(),
    active: z.boolean().optional(),
    source: z.enum(['manual', 'detected', 'email', 'bank']).optional(),
});

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const body = patchSchema.safeParse(await req.json());
        if (!body.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );
        const subscription = await updateFinanceSubscriptionForUser(
            supabase as unknown as SupabaseClient,
            userId,
            id,
            body.data as unknown as Parameters<
                typeof updateFinanceSubscriptionForUser
            >[3],
        );
        const sub = subscription as { name?: string } | undefined;

        // active=false means the subscription was cancelled
        const isCancellation = body.data.active === false;
        await publishActivityEventSafe(supabase, {
            userId,
            source: 'finance',
            eventType: isCancellation
                ? 'finance.subscription_cancelled'
                : 'finance.subscription_updated',
            sourceId: id,
            sourceTable: 'finance_subscriptions',
            category: 'data',
            severity: 'info',
            priority: 'low',
            title: isCancellation
                ? `Subscription cancelled: ${sub?.name ?? 'Subscription'}`
                : `Subscription updated: ${sub?.name ?? 'Subscription'}`,
            actionUrl: '/finance',
            metadata: {
                subscriptionId: id,
                changedFields: Object.keys(body.data),
            },
        });

        return NextResponse.json({ subscription });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        const { data: existing } = await supabase
            .from('finance_subscriptions')
            .select('name')
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle();

        await deleteFinanceSubscriptionForUser(
            supabase as unknown as SupabaseClient,
            userId,
            id,
        );

        const name =
            (existing as { name?: string } | null)?.name ?? 'Subscription';
        await publishActivityEventSafe(supabase, {
            userId,
            source: 'finance',
            eventType: 'finance.subscription_cancelled',
            sourceId: id,
            sourceTable: 'finance_subscriptions',
            category: 'data',
            severity: 'info',
            priority: 'low',
            title: `Subscription removed: ${name}`,
            actionUrl: '/finance',
            metadata: { subscriptionId: id },
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
