import type { WorkerEnv } from '../env.js';
import type { TaskProcessor } from '../v1/processors.js';
import { WorkerTaskError } from '../v1/processors.js';

export function createBriefingProcessor(env: WorkerEnv): TaskProcessor {
    return async ({ envelope, dryRun }) => {
        if (envelope.task.kind !== 'briefing.generate')
            throw new WorkerTaskError(
                'invalid_briefing_task',
                'Briefing task payload is invalid.',
                false,
            );
        if (dryRun) {
            return {
                dryRun: true,
                trigger: envelope.task.trigger,
                coveredFrom: envelope.task.coveredFrom,
                coveredTo: envelope.task.coveredTo,
            };
        }
        const response = await fetch(
            new URL('/api/internal/briefings/generate', env.WEB_APP_URL),
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${env.WORKER_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: envelope.userId,
                    jobId: envelope.jobId,
                    correlationId: envelope.correlationId,
                    idempotencyKey: envelope.idempotencyKey,
                    trigger: envelope.task.trigger,
                    coveredFrom: envelope.task.coveredFrom,
                    coveredTo: envelope.task.coveredTo,
                }),
                signal: AbortSignal.timeout(env.JOB_TIMEOUT_MS - 5_000),
            },
        ).catch(() => null);
        if (!response)
            throw new WorkerTaskError(
                'briefing_web_unavailable',
                'Briefing generation service is unavailable.',
                true,
            );
        if (response.status === 401)
            throw new WorkerTaskError(
                'briefing_worker_unauthorized',
                'Briefing generation authorization failed.',
                false,
            );
        if (!response.ok)
            throw new WorkerTaskError(
                'briefing_generation_failed',
                'Briefing generation did not complete.',
                response.status >= 500,
            );
        const result: unknown = await response.json();
        if (!result || typeof result !== 'object')
            throw new WorkerTaskError(
                'briefing_response_invalid',
                'Briefing generation returned an invalid result.',
                false,
            );
        return result as Record<string, string | number | boolean | null>;
    };
}
