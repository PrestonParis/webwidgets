import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';
import {
    updateFinanceAccountForUser,
    deleteFinanceAccountForUser,
} from '@/features/finance/services/financeService';
import type { SupabaseClient } from '@supabase/supabase-js';

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
            supabase as unknown as SupabaseClient,
            userId,
            id,
            body.data as unknown as Partial<
                Omit<
                    import('@/features/finance/types/finance').FinanceAccount,
                    'id' | 'userId'
                >
            >,
        );
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
        await deleteFinanceAccountForUser(
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
