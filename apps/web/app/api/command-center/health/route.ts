import { NextResponse } from 'next/server';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { createClients } from '@/lib/supabase/serverClient';

function recordOf(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

export async function GET(): Promise<Response> {
    try {
        const { supabase, supabaseAdmin } = await createClients();
        await getRequestUserId(supabase);
        const snapshot = await supabaseAdmin.rpc('get_v1_operations_snapshot');
        if (snapshot.error) throw snapshot.error;
        const worker = recordOf(recordOf(snapshot.data)['worker']);
        return NextResponse.json({
            state: worker['healthy'] === true ? 'operational' : 'degraded',
            lastSeenAt:
                typeof worker['lastSeenAt'] === 'string'
                    ? worker['lastSeenAt']
                    : null,
        });
    } catch (error) {
        const unauthorized =
            error instanceof Error && error.message === 'Unauthorized';
        return NextResponse.json(
            { error: 'runtime_health_unavailable' },
            { status: unauthorized ? 401 : 503 },
        );
    }
}
