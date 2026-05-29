import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import {
    requireAdmin,
    forbidden,
    AdminRequiredError,
} from '@/lib/supabase/requireAdmin';
import { getSystemDataHealth } from '@/features/datahealth/server/dataHealthService';

export async function GET(): Promise<Response> {
    // Admin-only endpoint
    try {
        const { supabase, supabaseAdmin } = await createClients();
        await requireAdmin(supabase, supabaseAdmin);
    } catch (e) {
        if (e instanceof AdminRequiredError) return forbidden();
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const health = await getSystemDataHealth();
    return NextResponse.json(health, {
        status: (health as { status: string }).status === 'ok' ? 200 : 503,
    });
}
