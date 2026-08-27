import { NextResponse } from 'next/server';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { briefingFeedbackRequestSchema } from '@/lib/briefings/schemas';
import { createTypedClients } from '@/lib/supabase/serverClient';

interface RouteContext {
    params: Promise<{ briefingId: string; itemId: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
    const parsed = briefingFeedbackRequestSchema.safeParse(
        await request.json().catch(() => null),
    );
    const { briefingId, itemId } = await context.params;
    if (
        !parsed.success ||
        !/^[0-9a-f-]{36}$/i.test(briefingId) ||
        !/^[0-9a-f-]{36}$/i.test(itemId)
    )
        return NextResponse.json(
            { error: 'invalid_feedback' },
            { status: 400 },
        );
    try {
        const { supabase, supabaseAdmin } = await createTypedClients();
        const userId = await getRequestUserId(supabase);
        const result = await supabase.from('briefing_feedback').upsert(
            {
                user_id: userId,
                briefing_id: briefingId,
                briefing_item_id: itemId,
                rating: parsed.data.rating,
                ...(parsed.data.comment
                    ? { comment: parsed.data.comment }
                    : {}),
            },
            { onConflict: 'user_id,briefing_item_id' },
        );
        if (result.error) throw result.error;
        await supabaseAdmin.from('analytics_events').insert({
            user_id: userId,
            type: 'briefing_feedback',
            source: 'briefings',
            metadata: {
                briefingId,
                itemId,
                rating: parsed.data.rating,
            },
        });
        return NextResponse.json({ saved: true });
    } catch (error) {
        const status =
            error instanceof Error && error.message === 'Unauthorized'
                ? 401
                : 500;
        return NextResponse.json({ error: 'feedback_save_failed' }, { status });
    }
}
