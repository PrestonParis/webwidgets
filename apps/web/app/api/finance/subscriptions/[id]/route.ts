import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    deleteFinanceSubscriptionForUser,
    updateFinanceSubscriptionForUser,
} from '@/features/finance/services/financeSubscriptionService';
import type { SupabaseClient } from '@supabase/supabase-js';

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
        await deleteFinanceSubscriptionForUser(
            supabase as unknown as SupabaseClient,
            userId,
            id,
        );
        return NextResponse.json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
