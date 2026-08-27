import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { createTypedClients } from '@/lib/supabase/serverClient';

export async function POST(
    _request: Request,
    context: { params: Promise<{ requestId: string }> },
) {
    try {
        const { supabase } = await createTypedClients();
        await getRequestUserId(supabase);
        const actionRequestId = z
            .string()
            .uuid()
            .parse((await context.params).requestId);
        const result = await supabase.rpc('undo_task_action', {
            p_action_request_id: actionRequestId,
        });
        if (result.error) throw new Error(result.error.message);
        return NextResponse.json(result.data);
    } catch (error) {
        const message = error instanceof Error ? error.message : '';
        return NextResponse.json(
            {
                error: message.includes('conflict')
                    ? 'undo_conflict'
                    : 'undo_failed',
            },
            { status: message === 'Unauthorized' ? 401 : 409 },
        );
    }
}
