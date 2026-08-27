import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { createTypedClients } from '@/lib/supabase/serverClient';
import { retryTaskAction } from '@/lib/taskActions/orchestration';

export async function POST(
    _request: Request,
    context: { params: Promise<{ requestId: string }> },
) {
    try {
        const { supabase } = await createTypedClients();
        const userId = await getRequestUserId(supabase);
        const actionRequestId = z
            .string()
            .uuid()
            .parse((await context.params).requestId);
        return NextResponse.json(
            await retryTaskAction({ db: supabase, userId, actionRequestId }),
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : '';
        return NextResponse.json(
            { error: 'task_retry_failed' },
            { status: message === 'Unauthorized' ? 401 : 409 },
        );
    }
}
