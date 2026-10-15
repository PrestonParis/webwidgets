import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { omitUndefined } from '@/features/backend/lib/exactOptional';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    listFinanceTransactionsForUser,
    createFinanceTransactionForUser,
} from '@/features/finance/services/financeTransactionService';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';
import { ingestFinanceTransactionContext } from '@/features/context/services/contextProducerServiceServer';

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
            supabase,
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
        const tx = await createFinanceTransactionForUser(supabase, {
            ...body.data,
            userId,
        } as unknown as Omit<
            import('@/features/finance/types/finance').FinanceTransaction,
            'id'
        >);

        const { type, title, amount, category } = body.data;
        const sign = type === 'income' ? '+' : type === 'expense' ? '-' : '↕';
        const amountStr = `${sign}$${Math.abs(amount).toFixed(2)}`;

        await publishActivityEventSafe(
            supabase,
            omitUndefined({
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
            }),
        );

        // Best-effort context ingestion — never throws
        void ingestFinanceTransactionContext(userId, {
            id: (tx as { id?: string }).id ?? '',
            title: body.data.title,
            amount: body.data.amount,
            type: body.data.type,
            category: body.data.category,
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
