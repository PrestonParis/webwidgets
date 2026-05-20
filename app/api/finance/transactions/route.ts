import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';
import {
    listFinanceTransactionsForUser,
    createFinanceTransactionForUser,
} from '@/features/finance/services/financeService';
import type { SupabaseClient } from '@supabase/supabase-js';

const createSchema = z.object({
    accountId: z.string().optional(),
    title: z.string().min(1),
    amount: z.number(),
    type: z.enum(['income', 'expense', 'transfer']),
    category: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    merchant: z.string().optional(),
    notes: z.string().optional(),
    recurringCandidate: z.boolean().default(false),
});

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const transactions = await listFinanceTransactionsForUser(
            supabase as unknown as SupabaseClient,
            userId,
        );
        return NextResponse.json({ transactions });
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
        const tx = await createFinanceTransactionForUser(
            supabase as unknown as SupabaseClient,
            { ...body.data, userId } as unknown as Omit<
                import('@/features/finance/types/finance').FinanceTransaction,
                'id'
            >,
        );
        return NextResponse.json({ transaction: tx });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
