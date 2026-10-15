import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    updateFinanceAccountForUser,
    deleteFinanceAccountForUser,
} from '@/features/finance/services/financeAccountService';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';

const patchSchema = z.object({
    name: z.string().min(1).optional(),
    type: z
        .enum([
            'cash',
            'checking',
            'savings',
            'credit',
            'investment',
            'loan',
            'other',
        ])
        .optional(),
    currency: z.string().min(3).max(3).optional(),
    balance: z.number().optional(),
    institution: z.string().optional(),
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
        const account = await updateFinanceAccountForUser(
            supabase,
            userId,
            id,
            body.data as unknown as Partial<
                Omit<
                    import('@/features/finance/types/finance').FinanceAccount,
                    'id' | 'userId'
                >
            >,
        );
        const acc = account as { name?: string; type?: string } | undefined;
        await publishActivityEventSafe(supabase, {
            userId,
            source: 'finance',
            eventType: 'finance.account_updated',
            sourceId: id,
            sourceTable: 'finance_accounts',
            category: 'data',
            severity: 'info',
            priority: 'low',
            title: acc?.name
                ? `Finance account updated: ${acc.name}`
                : 'Finance account updated',
            actionUrl: '/finance',
            metadata: { accountId: id, changedFields: Object.keys(body.data) },
        });
        return NextResponse.json({ account });
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

        // Fetch name before deletion
        const { data: existing } = await supabase
            .from('finance_accounts')
            .select('name')
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle();

        await deleteFinanceAccountForUser(supabase, userId, id);

        const name = (existing as { name?: string } | null)?.name ?? 'Account';
        await publishActivityEventSafe(supabase, {
            userId,
            source: 'finance',
            eventType: 'finance.account_deleted',
            sourceId: id,
            sourceTable: 'finance_accounts',
            category: 'data',
            severity: 'warning',
            priority: 'low',
            title: `Finance account removed: ${name}`,
            actionUrl: '/finance',
            metadata: { accountId: id },
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
