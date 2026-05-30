import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    listFinanceTransactionsForUser,
    createFinanceTransactionForUser,
} from '@/features/finance/services/financeTransactionService';
import type { SupabaseClient } from '@supabase/supabase-js';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';

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

        const { type, title, amount, category } = body.data;
        const sign = type === 'income' ? '+' : type === 'expense' ? '-' : '↕';
        const amountStr = `${sign}$${Math.abs(amount).toFixed(2)}`;

        await publishActivityEventSafe(supabase, {
            userId,
            source: 'finance',
            eventType: 'finance.transaction_added',
            sourceId: (tx as { id?: string }).id,
            sourceTable: 'finance_transactions',
            category: 'data',
            severity: type === 'expense' ? 'warning' : 'info',
            priority: 'low',
            title: `${capitalize(type)}: ${title}`,
            body: `${amountStr} · ${category}`,
            actionUrl: '/finance',
            metadata: {
                transactionType: type,
                amount,
                category,
                merchant: body.data.merchant,
            },
        });

        return NextResponse.json({ transaction: tx });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
