import { z } from 'zod';
import type { BriefingTrigger } from './types';

const enqueueResponseSchema = z.object({ jobId: z.string().uuid() });

export async function enqueueBriefingJob(input: {
    userId: string;
    trigger: BriefingTrigger;
    coveredFrom: string;
    coveredTo: string;
    idempotencyKey: string;
}) {
    const baseUrl = process.env.WORKER_SERVICE_URL;
    const token = process.env.WORKER_API_TOKEN;
    if (!baseUrl || !token) throw new Error('briefing_worker_unavailable');
    const response = await fetch(new URL('/v1/jobs/briefings', baseUrl), {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(55_000),
    });
    if (!response.ok) throw new Error('briefing_enqueue_failed');
    return enqueueResponseSchema.parse(await response.json());
}
