import { NextResponse } from 'next/server';
import superjson from 'superjson';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { executeUnifiedAction } from '@/features/actions/lib/actionEngine';
import { parseActionInvocationRequest } from '@/features/actions/api/actionInvocation';

export async function POST(req: Request) {
    const { supabase } = await createClients();
    const userId = await getRequestUserId(supabase);
    const envelope = await parseActionInvocationRequest(req);
    const result = await executeUnifiedAction(envelope, { supabase, userId });
    return NextResponse.json(superjson.serialize(result), {
        status: result.status === 'failed' ? 400 : 200,
    });
}
