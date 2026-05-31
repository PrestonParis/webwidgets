import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    getContextPermissions,
    upsertContextPermissions,
} from '@/features/context/services/contextPermissionsService';
import { contextPermissionsSchema } from '@/features/context/types/schemas';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const permissions = await getContextPermissions(
            supabase as unknown as SupabaseClient,
            userId,
        );
        return NextResponse.json({ permissions });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const parsed = contextPermissionsSchema
            .partial()
            .safeParse(await req.json());
        if (!parsed.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );
        const permissions = await upsertContextPermissions(
            supabase as unknown as SupabaseClient,
            userId,
            parsed.data,
        );
        return NextResponse.json({ permissions });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
