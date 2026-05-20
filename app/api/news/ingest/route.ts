import { NextResponse } from 'next/server';
import { enqueueNewsJob } from '@/features/news/queues/newsQueue';
import { ingestRssFeedJobSchema } from '@/features/news/schemas/ingestionSchemas';

export async function POST(request: Request) {
    const payload = await request.json();
    const job = ingestRssFeedJobSchema.parse({
        type: 'ingestRssFeed',
        ...payload,
    });
    const result = await enqueueNewsJob(job);
    return NextResponse.json(result, { status: result.queued ? 202 : 503 });
}
