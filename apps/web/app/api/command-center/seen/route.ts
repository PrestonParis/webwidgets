import { NextResponse } from 'next/server';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { createClients, createTypedClients } from '@/lib/supabase/serverClient';
import type { Json } from '@/types/supabase';

function recordOf(value: Json | undefined): Record<string, Json | undefined> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : {};
}

function lastSeenOf(preferences: Json | undefined) {
    const commandCenter = recordOf(recordOf(preferences)['commandCenter']);
    const value = commandCenter['lastSeenAt'];
    return typeof value === 'string' && !Number.isNaN(Date.parse(value))
        ? value
        : null;
}

export async function GET() {
    try {
        const { supabase } = await createTypedClients();
        const userId = await getRequestUserId(supabase);
        const result = await supabase
            .from('user_preferences')
            .select('preferences')
            .eq('user_id', userId)
            .maybeSingle();
        if (result.error) throw result.error;
        return NextResponse.json({
            lastSeenAt: lastSeenOf(result.data?.preferences),
        });
    } catch (error) {
        const unauthorized =
            error instanceof Error && error.message === 'Unauthorized';
        return NextResponse.json(
            { error: 'seen_state_read_failed' },
            { status: unauthorized ? 401 : 500 },
        );
    }
}

export async function POST() {
    try {
        const { supabase } = await createClients();
        await getRequestUserId(supabase);
        const result = await supabase.rpc('mark_command_center_seen');
        if (result.error) throw result.error;
        return NextResponse.json({ lastSeenAt: String(result.data) });
    } catch (error) {
        const unauthorized =
            error instanceof Error && error.message === 'Unauthorized';
        return NextResponse.json(
            { error: 'seen_state_write_failed' },
            { status: unauthorized ? 401 : 500 },
        );
    }
}
