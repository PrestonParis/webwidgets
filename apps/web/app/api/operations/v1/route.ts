import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import {
    AdminRequiredError,
    forbidden,
    requireAdmin,
} from '@/lib/supabase/requireAdmin';

export async function GET(): Promise<Response> {
    try {
        const { supabase, supabaseAdmin } = await createClients();
        await requireAdmin(supabase, supabaseAdmin);
        const snapshot = await supabaseAdmin.rpc('get_v1_operations_snapshot');
        if (snapshot.error) throw snapshot.error;
        return NextResponse.json(snapshot.data);
    } catch (error) {
        if (error instanceof AdminRequiredError) return forbidden();
        const unauthorized =
            error instanceof Error && error.message === 'Unauthorized';
        return NextResponse.json(
            { error: 'v1_operations_unavailable' },
            { status: unauthorized ? 401 : 503 },
        );
    }
}
