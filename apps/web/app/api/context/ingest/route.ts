import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { ingestContextFromAdapterPayload } from '@/features/import-export/lib/contextMapper';
import type { MappedRow } from '@/features/import-export/types/importExport';
import type { SupabaseClient } from '@supabase/supabase-js';

const bodySchema = z.object({
    sourceType: z.string().min(1),
    rows: z.array(
        z.object({
            rowIndex: z.number().int(),
            data: z.record(z.string(), z.unknown()),
        }),
    ),
});

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const parsed = bodySchema.safeParse(await req.json());
        if (!parsed.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );
        const result = await ingestContextFromAdapterPayload(
            supabase as unknown as SupabaseClient,
            userId,
            parsed.data.sourceType,
            parsed.data.rows as MappedRow[],
        );
        return NextResponse.json(result);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
