import { NextResponse } from 'next/server';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { briefingPreferencesRequestSchema } from '@/lib/briefings/schemas';
import { createTypedClients } from '@/lib/supabase/serverClient';

export async function PUT(request: Request) {
    const parsed = briefingPreferencesRequestSchema.safeParse(
        await request.json().catch(() => null),
    );
    if (!parsed.success)
        return NextResponse.json(
            { error: 'invalid_preferences' },
            { status: 400 },
        );
    try {
        const { supabase } = await createTypedClients();
        const userId = await getRequestUserId(supabase);
        const result = await supabase.from('briefing_preferences').upsert({
            user_id: userId,
            daily_enabled: parsed.data.dailyEnabled,
            local_time: parsed.data.localTime,
            timezone: parsed.data.timezone,
            window_hours: parsed.data.windowHours,
        });
        if (result.error) throw result.error;
        return NextResponse.json({ saved: true });
    } catch (error) {
        const status =
            error instanceof Error && error.message === 'Unauthorized'
                ? 401
                : 500;
        return NextResponse.json(
            { error: 'preference_save_failed' },
            { status },
        );
    }
}
