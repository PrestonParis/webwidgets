import { z } from 'zod';

const enqueueResponseSchema = z.object({ jobId: z.string().uuid() });

export async function enqueueTaskAction(input: {
    userId: string;
    actionRequestId: string;
    idempotencyKey: string;
}) {
    const baseUrl = process.env.WORKER_SERVICE_URL;
    const token = process.env.WORKER_API_TOKEN;
    if (!baseUrl || !token) throw new Error('task_worker_unavailable');
    const response = await fetch(new URL('/v1/jobs/actions', baseUrl), {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(55_000),
    });
    if (!response.ok) throw new Error('task_enqueue_failed');
    return enqueueResponseSchema.parse(await response.json());
}
