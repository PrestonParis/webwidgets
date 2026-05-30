import { NextResponse } from 'next/server';
import { enqueueNewsJob } from '@/features/news/queues/newsQueue';
import { ingestRssFeedJobSchema } from '@/features/news/schemas/ingestionSchemas';
import { createClients } from '@/lib/supabase/serverClient';

export async function POST(request: Request) {
    const { supabase } = await createClients();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const payload = (await request.json()) as Record<string, unknown>;
    const job = ingestRssFeedJobSchema.parse({
        type: 'ingestRssFeed',
        ...payload,
        // Pass user id so the BullMQ worker can publish a user-scoped activity event
        ...(user?.id ? { requestedBy: user.id } : {}),
    });
    const result = await enqueueNewsJob(job);
    return NextResponse.json(result, { status: result.queued ? 202 : 503 });
}
