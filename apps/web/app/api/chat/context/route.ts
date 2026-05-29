import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { collectContext } from '@/features/import-export/lib/contextCollector';

export async function GET() {
    const { supabase } = await createClients();

    let userId: string;
    try {
        userId = await getRequestUserId(supabase);
    } catch {
        return NextResponse.json(
            {
                ok: false,
                error: 'CONTEXT_AUTH_REQUIRED',
                message: 'Sign in to use AI Chat.',
            },
            { status: 401 },
        );
    }

    const payload = await collectContext(supabase, userId, {
        scope: 'personal',
        includeImportExportService: false,
    });

    return NextResponse.json({ ok: true, payload });
}
