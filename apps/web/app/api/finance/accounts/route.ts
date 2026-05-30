import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    createFinanceAccountForUser,
    listFinanceAccountsForUser,
} from '@/features/finance/services/financeAccountService';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';

const accountSchema = z.object({
    name: z.string().min(1),
    type: z.enum([
        'cash',
        'checking',
        'savings',
        'credit',
        'investment',
        'loan',
        'other',
    ]),
    currency: z.string().min(3).max(3).default('USD'),
    balance: z.number(),
    institution: z.string().optional(),
});

export async function GET() {
    const { supabase } = await createClients();
    const userId = await getRequestUserId(supabase);
    return NextResponse.json({
        accounts: await listFinanceAccountsForUser(supabase, userId),
    });
}

export async function POST(req: Request) {
    const { supabase } = await createClients();
    const userId = await getRequestUserId(supabase);
    const parsed = accountSchema.safeParse(await req.json());
    if (!parsed.success)
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    const account = await createFinanceAccountForUser(supabase, {
        ...parsed.data,
        userId,
    });

    const acc = account as { id?: string; name?: string; type?: string };
    await publishActivityEventSafe(supabase, {
        userId,
        source: 'finance',
        eventType: 'finance.account_created',
        sourceId: acc.id,
        sourceTable: 'finance_accounts',
        category: 'data',
        severity: 'info',
        priority: 'low',
        title: `Finance account added: ${parsed.data.name}`,
        body: `${parsed.data.type} · ${parsed.data.currency}`,
        actionUrl: '/finance',
        metadata: {
            accountName: parsed.data.name,
            accountType: parsed.data.type,
            currency: parsed.data.currency,
            institution: parsed.data.institution,
        },
    });

    return NextResponse.json(account);
}
