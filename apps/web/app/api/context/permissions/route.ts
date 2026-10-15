import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { omitUndefined } from '@/features/backend/lib/exactOptional';
import {
    getContextPermissions,
    upsertContextPermissions,
} from '@/features/context/services/contextPermissionsService';
import { contextPermissionsSchema } from '@/features/context/types/schemas';

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const permissions = await getContextPermissions(supabase, userId);
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
            supabase,
            userId,
            omitUndefined(parsed.data),
        );
        return NextResponse.json({ permissions });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
