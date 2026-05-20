import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';
import {
    listEntries,
    upsertEntry,
    batchUpsertEntries,
} from '@/features/context/services/contextService';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UpsertEntryPayload } from '@/features/context/types/context';

const entrySchema = z.object({
    entityId: z.string().min(1),
    entryType: z.enum([
        'profile',
        'goal',
        'widget',
        'integration',
        'query_gist',
        'insight',
    ]),
    label: z.string().min(1),
    data: z.record(z.string(), z.unknown()).optional(),
    linkedTo: z.array(z.string()).optional(),
});

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const entries = await listEntries(
            supabase as unknown as SupabaseClient,
            userId,
        );
        return NextResponse.json({ entries });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 401 });
    }
}

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const body = entrySchema.safeParse(await req.json());
        if (!body.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );
        const entry = await upsertEntry(
            supabase as unknown as SupabaseClient,
            userId,
            body.data as unknown as UpsertEntryPayload,
        );
        return NextResponse.json({ entry });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const body = z
            .object({ entries: z.array(entrySchema) })
            .safeParse(await req.json());
        if (!body.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );
        await batchUpsertEntries(
            supabase as unknown as SupabaseClient,
            userId,
            body.data.entries as unknown as UpsertEntryPayload[],
        );
        return NextResponse.json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
