import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';
import {
    createFinanceAccountForUser,
    listFinanceAccountsForUser,
} from '@/features/finance/services/financeAccountService';

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
    return NextResponse.json(
        await createFinanceAccountForUser(supabase, { ...parsed.data, userId }),
    );
}
