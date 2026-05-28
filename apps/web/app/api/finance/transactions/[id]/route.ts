import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    deleteFinanceTransactionForUser,
    updateFinanceTransactionForUser,
} from '@/features/finance/services/financeTransactionService';
import type { SupabaseClient } from '@supabase/supabase-js';

const patchSchema = z.object({
    accountId: z.string().optional(),
    title: z.string().min(1).optional(),
    amount: z.number().optional(),
    type: z.enum(['income', 'expense', 'transfer']).optional(),
    category: z.string().min(1).optional(),
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    merchant: z.string().optional(),
    notes: z.string().optional(),
    recurringCandidate: z.boolean().optional(),
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
        const transaction = await updateFinanceTransactionForUser(
            supabase as unknown as SupabaseClient,
            userId,
            id,
            body.data as unknown as Parameters<
                typeof updateFinanceTransactionForUser
            >[3],
        );
        return NextResponse.json({ transaction });
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
        await deleteFinanceTransactionForUser(
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
